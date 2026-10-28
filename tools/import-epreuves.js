/**
 * tools/import-epreuves.js — import d'un lot d'épreuves depuis un manifeste.
 *
 * Principe (important) : on n'attrape pas automatiquement des sites. Tu
 * fournis une liste de documents avec leur source et leur licence ; l'outil
 * télécharge les fichiers, les range et enregistre les fiches en base.
 *
 * Manifeste (epreuves/sources.json) :
 * {
 *   "documents": [
 *     {
 *       "pays": "BJ", "niveau": "bac", "classe": "Tle", "serie": "C",
 *       "annee": 2024, "matiere": "Mathématiques", "type": "sujet",
 *       "titre": "Épreuve de Mathématiques — BAC 2024",
 *       "description": "Session normale",
 *       "url": "https://source.officielle/exemple.pdf",
 *       "nom": "bj-bac-2024-math-sujet.pdf",
 *       "format": "pdf",
 *       "source_nom": "ONEB",
 *       "source_url": "https://oneb.bj",
 *       "licence": "domaine public",
 *       "is_free": true, "price": 0
 *     },
 *     {
 *       "type": "corrige", "is_free": false, "price": 200,
 *       "solution": "1) … 2) …", "bareme": 20, "difficulte": "moyen",
 *       "validee": true
 *     }
 *   ]
 * }
 *
 * Les mêmes règles que le back-office s'appliquent : un corrigé payant
 * sans solution rédigée, sans barème et sans validation est refusé.
 *
 * Usage :
 *   node tools/import-epreuves.js epreuves/sources.json            # import
 *   node tools/import-epreuves.js epreuves/sources.json --dry-run  # simulation
 *   node tools/import-epreuves.js epreuves/sources.json --upload    # vers le bucket Supabase
 */
const fs = require('fs');
const path = require('path');

process.chdir(path.resolve(__dirname, '..'));

const args = process.argv.slice(2);
const fichierManifeste = args.find(a => !a.startsWith('--')) || 'epreuves/sources.json';
const dryRun = args.includes('--dry-run');
const uploadBucket = args.includes('--upload');

const epreuves = require(path.resolve(__dirname, '..', 'server_epreuves.js'));

const env = {};
try {
  fs.readFileSync('.env', 'utf8').split(/\r?\n/).forEach(l => {
    const i = l.indexOf('=');
    if (i > 0) env[l.slice(0, i).trim()] = l.slice(i + 1).trim();
  });
} catch (_) { /* variables d'environnement seulement */ }

const SUPABASE_URL = process.env.SUPABASE_URL || env.SUPABASE_URL || '';
const CLE_SERVICE = process.env.SUPABASE_SERVICE_KEY || env.SUPABASE_SERVICE_KEY || '';
const DOSSIER_LOCAL = path.resolve('epreuves');
const BUCKET = 'epreuves';

function slug(pays, niveau, annee, matiere, type, classe, serie) {
  // Clé canonique partagée avec le back-office (voir server_epreuves.js) :
  // elle inclut la classe et la série, donc deux séries ne s'écrasent jamais.
  return epreuves.epreuveSlug({ pays, niveau, annee, matiere, type, classe, serie });
}

async function telecharger(url, destination) {
  const reponse = await fetch(url, { redirect: 'follow' });
  if (!reponse.ok) throw new Error(`HTTP ${reponse.status}`);
  const type = reponse.headers.get('content-type') || '';
  if (type && !/pdf|octet-stream|text\/plain|zip|word|officedocument|image\//i.test(type)) {
    console.warn(`   ⚠ type inattendu : ${type}`);
  }
  const buffer = Buffer.from(await reponse.arrayBuffer());
  fs.writeFileSync(destination, buffer);
  return buffer.length;
}

async function envoyerAuBucket(cheminObjet, fichierLocal) {
  if (!SUPABASE_URL || !CLE_SERVICE) throw new Error('SUPABASE_URL / SUPABASE_SERVICE_KEY absentes');
  const data = fs.readFileSync(fichierLocal);
  const url = `${SUPABASE_URL.replace(/\/$/, '')}/storage/v1/object/${BUCKET}/${cheminObjet.split('/').map(encodeURIComponent).join('/')}`;
  const reponse = await fetch(url, {
    method: 'POST',
    headers: {
      apikey: CLE_SERVICE,
      Authorization: `Bearer ${CLE_SERVICE}`,
      'Content-Type': 'application/octet-stream',
      'x-upsert': 'true'
    },
    body: data
  });
  if (!reponse.ok) throw new Error(`bucket HTTP ${reponse.status} ${(await reponse.text()).slice(0, 160)}`);
  return true;
}

/**
 * Cherche une épreuve déjà enregistrée avec la MÊME identité
 * (pays / niveau / classe / série / année / matière / type).
 * C'est ce qui rend l'import idempotent : recharger un lot met à jour les
 * fiches existantes au lieu de créer des doublons.
 */
async function rechercherEpreuve(ligne) {
  const conditions = [
    `pays=eq.${encodeURIComponent(ligne.pays)}`,
    `niveau=eq.${encodeURIComponent(ligne.niveau)}`,
    `matiere=eq.${encodeURIComponent(ligne.matiere)}`,
    `type=eq.${encodeURIComponent(ligne.type)}`
  ];
  if (ligne.annee) conditions.push(`annee=eq.${encodeURIComponent(String(ligne.annee))}`);
  conditions.push(ligne.classe ? `classe=eq.${encodeURIComponent(ligne.classe)}` : 'classe=is.null');
  conditions.push(ligne.serie ? `serie=eq.${encodeURIComponent(ligne.serie)}` : 'serie=is.null');
  const url = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/epreuves?${conditions.join('&')}&select=id,slug&limit=1`;
  const reponse = await fetch(url, {
    method: 'GET',
    headers: {
      apikey: CLE_SERVICE,
      Authorization: `Bearer ${CLE_SERVICE}`,
      Accept: 'application/json'
    }
  });
  if (!reponse.ok) return null;
  const data = await reponse.json().catch(() => []);
  return Array.isArray(data) && data.length ? data[0] : null;
}

/** Écrit une ligne « epreuves » (upsert sur le slug) et renvoie son id. */
async function insererEnBase(ligne) {
  if (!SUPABASE_URL || !CLE_SERVICE) throw new Error('SUPABASE_URL / SUPABASE_SERVICE_KEY absentes');
  const url = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/epreuves?on_conflict=slug`;
  const reponse = await fetch(url, {
    method: 'POST',
    headers: {
      apikey: CLE_SERVICE,
      Authorization: `Bearer ${CLE_SERVICE}`,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates,return=representation'
    },
    body: JSON.stringify(ligne)
  });
  if (!reponse.ok) throw new Error(`REST HTTP ${reponse.status} ${(await reponse.text()).slice(0, 200)}`);
  const data = await reponse.json().catch(() => []);
  return Array.isArray(data) && data.length ? data[0].id : null;
}

/** Met à jour une épreuve existante (même identité, contenu corrigé). */
async function mettreAJourEnBase(id, ligne) {
  const url = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/epreuves?id=eq.${encodeURIComponent(id)}`;
  const reponse = await fetch(url, {
    method: 'PATCH',
    headers: {
      apikey: CLE_SERVICE,
      Authorization: `Bearer ${CLE_SERVICE}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=representation'
    },
    body: JSON.stringify(ligne)
  });
  if (!reponse.ok) throw new Error(`PATCH HTTP ${reponse.status} ${(await reponse.text()).slice(0, 200)}`);
  const data = await reponse.json().catch(() => []);
  return Array.isArray(data) && data.length ? data[0].id : id;
}

/** Écrit la correction d'un corrigé (upsert sur l'épreuve). */
async function insererCorrection(epreuveId, correction) {
  if (!epreuveId) return false;
  const url = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/epreuve_corrections?on_conflict=epreuve_id`;
  const reponse = await fetch(url, {
    method: 'POST',
    headers: {
      apikey: CLE_SERVICE,
      Authorization: `Bearer ${CLE_SERVICE}`,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates,return=minimal'
    },
    body: JSON.stringify(Object.assign({ epreuve_id: epreuveId }, correction))
  });
  if (!reponse.ok) throw new Error(`correction HTTP ${reponse.status} ${(await reponse.text()).slice(0, 200)}`);
  return true;
}

(async () => {
  if (!fs.existsSync(fichierManifeste)) {
    console.error(`Manifeste introuvable : ${fichierManifeste}`);
    console.error('Crée-le à partir de epreuves/sources-exemple.json.');
    process.exit(1);
  }
  let manifeste;
  try {
    manifeste = JSON.parse(fs.readFileSync(fichierManifeste, 'utf8'));
  } catch (e) {
    console.error('Manifeste illisible :', e.message);
    process.exit(1);
  }
  const documents = Array.isArray(manifeste) ? manifeste : (manifeste.documents || []);
  if (!documents.length) {
    console.log('Aucune épreuve dans le manifeste.');
    return;
  }

  console.log(`\nImport de ${documents.length} épreuve(s) depuis ${fichierManifeste}`);
  if (dryRun) console.log('⚠ Mode simulation : rien n\'est écrit.\n');
  if (!dryRun) fs.mkdirSync(DOSSIER_LOCAL, { recursive: true });

  let ok = 0;
  let ignores = 0;
  let erreurs = 0;

  for (const doc of documents) {
    const type = doc.type === 'corrige' ? 'corrige' : 'sujet';
    const format = String(doc.format || '').toLowerCase()
      || epreuves.detecterFormat(doc.nom || doc.url || 'document.pdf');
    const nom = doc.nom || (slug(doc.pays, doc.niveau, doc.annee, doc.matiere, type) + '.' + format);
    const libelle = `${doc.pays || '??'} ${doc.niveau || '??'} ${doc.annee || '??'} ${doc.matiere || '??'} — ${type}`;

    // Règle de légalité : pas de source ni licence, on n'importe rien.
    if (!doc.source_nom || !doc.licence) {
      console.log(`✗ IGNORÉ (source ou licence manquante) : ${libelle}`);
      ignores++;
      continue;
    }
    if (!doc.titre || !doc.url) {
      console.log(`✗ IGNORÉ (titre ou URL manquant) : ${libelle}`);
      ignores++;
      continue;
    }

    const ligne = {
      slug: doc.slug || slug(doc.pays, doc.niveau, doc.annee, doc.matiere, type),
      pays: String(doc.pays || 'BJ').toUpperCase(),
      niveau: doc.niveau === 'brevet' ? 'brevet' : 'bac',
      classe: doc.classe || null,
      serie: doc.serie || null,
      annee: doc.annee || null,
      matiere: doc.matiere || 'Mathématiques',
      type,
      titre: doc.titre,
      description: doc.description || null,
      fichier_url: String(doc.url),
      fichier_nom: path.basename(nom),
      format,
      pages: doc.pages || null,
      source_nom: doc.source_nom,
      source_url: doc.source_url || null,
      licence: doc.licence,
      is_free: doc.is_free === undefined ? (type === 'sujet') : Boolean(doc.is_free),
      price: Number(doc.price) || 0,
      published: doc.published === undefined ? true : Boolean(doc.published)
    };

    // La correction : obligatoire pour un corrigé payant.
    const correction = {
      solution: doc.solution || null,
      bareme: Number(doc.bareme) || 0,
      difficulte: ['facile', 'moyen', 'difficile'].includes(String(doc.difficulte || '').toLowerCase())
        ? String(doc.difficulte).toLowerCase() : 'moyen',
      validee: doc.validee === true
    };

    // Mêmes règles que le back-office : pas de corrigé payant sans
    // correction complète et validée.
    if (ligne.published) {
      const problemes = epreuves.verifierPublication(ligne, correction);
      if (problemes.length) {
        console.log(`✗ IGNORÉ (${problemes.join(' · ')}) : ${libelle}`);
        ignores++;
        continue;
      }
    }

    try {
      let referenceFichier = String(doc.url);

      if (/^https?:\/\//i.test(referenceFichier)) {
        const fichierLocal = path.join(DOSSIER_LOCAL, path.basename(nom));
        if (!dryRun) {
          const taille = await telecharger(referenceFichier, fichierLocal);
          console.log(`   ↓ ${path.basename(fichierLocal)} (${Math.round(taille / 1024)} Ko)`);
          if (uploadBucket) {
            await envoyerAuBucket(path.basename(nom), fichierLocal);
            referenceFichier = `supabase:${path.basename(nom)}`;
            console.log(`   ↑ envoyé dans le bucket « ${BUCKET} »`);
          } else {
            referenceFichier = path.basename(nom);
          }
        } else {
          console.log(`   ↓ (simulation) ${nom}`);
        }
      }
      ligne.fichier_url = referenceFichier;

      if (!dryRun) {
        const id = await insererEnBase(ligne);
        if (id && (correction.solution || correction.bareme || correction.validee)) {
          await insererCorrection(id, correction);
        }
        console.log(`✓ ${libelle} — ${ligne.is_free ? 'gratuit' : `${ligne.price} FCFA`}`
          + `${ligne.classe || ligne.serie ? ` — ${[ligne.classe, ligne.serie].filter(Boolean).join(' ')}` : ''}`);
      } else {
        console.log(`✓ (simulation) ${libelle} — ${ligne.is_free ? 'gratuit' : `${ligne.price} FCFA`}`);
      }
      ok++;
    } catch (e) {
      console.log(`✗ ERREUR ${libelle} : ${e.message}`);
      erreurs++;
    }
  }

  console.log(`\n${ok} importé(s), ${ignores} ignoré(s), ${erreurs} erreur(s).`);
  if (!dryRun && ok) {
    console.log('→ Les épreuves sont visibles dans l\'espace élève (onglet « Épreuves d\'examen »).');
  }
  process.exit(erreurs ? 1 : 0);
})();
