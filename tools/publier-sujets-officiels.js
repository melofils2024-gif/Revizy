/**
 * tools/publier-sujets-officiels.js — publie le manifeste des documents
 * officiels indexés, sous forme de LIENS (jamais de copie).
 *
 * Chaque ligne du manifeste devient une fiche `epreuves` :
 *   fichier_url = l'URL officielle (le serveur redirige l'élève vers la
 *   source après contrôle des droits) ;
 *   source_nom / source_url / licence = traçabilité obligatoire.
 *
 * Prérequis : la migration doit être appliquée en base (table `epreuves`),
 * et SUPABASE_SERVICE_KEY doit être présente dans l'environnement ou le
 * fichier .env local.
 *
 * Usage :
 *   node tools/publier-sujets-officiels.js              # aperçu (dry-run)
 *   node tools/publier-sujets-officiels.js --appliquer  # écrit en base
 */

const fs = require('fs');
const path = require('path');

const RACINE = path.resolve(__dirname, '..');
const MANIFESTE = path.join(RACINE, 'epreuves', 'sujets-officiels.json');

function lireEnv() {
  const env = {};
  try {
    fs.readFileSync(path.join(RACINE, '.env'), 'utf8').split(/\r?\n/).forEach(l => {
      const i = l.indexOf('=');
      if (i > 0) env[l.slice(0, i).trim()] = l.slice(i + 1).trim();
    });
  } catch (_) { /* pas de .env : variables d'environnement */ }
  return env;
}

/** Slug stable : deux exécutions ne doivent pas créer deux fiches. */
function slugifier(document) {
  const base = String(document.titre || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'document';
  const annee = document.annee || 'sans-annee';
  return `officiel-${annee}-${base}`;
}

async function ecrire(ligne) {
  const env = lireEnv();
  const url = (process.env.SUPABASE_URL || env.SUPABASE_URL || '').replace(/\/$/, '');
  const cle = process.env.SUPABASE_SERVICE_KEY || env.SUPABASE_SERVICE_KEY || '';
  if (!url || !cle) {
    return { ok: false, error: 'SUPABASE_URL / SUPABASE_SERVICE_KEY absentes (variables d\'environnement ou .env)' };
  }
  const reponse = await fetch(`${url}/rest/v1/epreuves?on_conflict=slug`, {
    method: 'POST',
    headers: {
      apikey: cle,
      Authorization: `Bearer ${cle}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=minimal'
    },
    body: JSON.stringify(ligne)
  });
  if (!reponse.ok) {
    const detail = await reponse.text().catch(() => '');
    return { ok: false, error: `HTTP ${reponse.status} ${detail.slice(0, 200)}` };
  }
  return { ok: true };
}

(async () => {
  if (!fs.existsSync(MANIFESTE)) {
    console.error(`Manifeste absent : ${MANIFESTE}`);
    console.error('Lance d\'abord : node tools/chercher-sujets-officiels.js --ecrire');
    process.exit(1);
  }
  const manifeste = JSON.parse(fs.readFileSync(MANIFESTE, 'utf8'));
  const documents = Array.isArray(manifeste.documents) ? manifeste.documents : [];
  const appliquer = process.argv.includes('--appliquer');

  if (!documents.length) {
    console.log('Manifeste vide : rien à publier.');
    return;
  }

  console.log(`${documents.length} document(s) à publier comme liens externes :\n`);
  let ok = 0;
  let ko = 0;

  for (const document of documents) {
    const ligne = {
      slug: slugifier(document),
      pays: 'BJ',
      niveau: document.niveau || 'bac',
      annee: document.annee || null,
      matiere: document.matiere || 'Divers',
      type: 'sujet',
      titre: document.titre,
      description: `Document officiel indexé automatiquement — ${document.source_nom}`,
      // Lien externe : le serveur redirige l'élève vers la source officielle.
      fichier_url: document.url,
      fichier_nom: path.basename(new URL(document.url).pathname) || 'document.pdf',
      format: 'pdf',
      classe: null,
      serie: null,
      source_nom: document.source_nom,
      source_url: document.source_url,
      licence: document.licence || 'domaine public',
      is_free: true,
      price: 0,
      published: true
    };

    if (!appliquer) {
      console.log(`  [aperçu] ${ligne.slug}\n            ${ligne.titre.slice(0, 70)}`);
      ok++;
      continue;
    }
    const resultat = await ecrire(ligne);
    if (resultat.ok) { ok++; console.log(`  ✓ ${ligne.slug}`); }
    else { ko++; console.log(`  ✗ ${ligne.slug} : ${resultat.error}`); }
  }

  console.log(`\n${ok} document(s) traité(s), ${ko} en échec.`);
  if (!appliquer) {
    console.log('Relance avec --appliquer pour écrire en base (clé service requise).');
  }
  process.exitCode = ko > 0 ? 1 : 0;
})();
