/**
 * tools/chercher-sujets-officiels.js — indexation automatique des sujets
 * officiels publiés en ligne.
 *
 * Ce que fait l'outil :
 *   - il lit les pages OFFICIELLES listées dans SOURCES (ministère,
 *     office des examens) ;
 *   - il en extrait le titre, la date et le lien du document ;
 *   - il écrit un MANIFESTE de métadonnées (aucun PDF téléchargé).
 *
 * Ce que l'outil ne fait JAMAIS :
 *   - télécharger les PDF ;
 *   - visiting un domaine qui n'est pas sur la liste blanche ;
 *   - publier quoi que ce soit : la publication se fait ensuite, ligne par
 *     ligne, via tools/publier-sujets-officiels.js (ou le back-office).
 *
 * Pourquoi seulement des liens ? Un sujet d'examen officiel est un document
 * public (domaine public) : on peut le lier, et même le rediffuser. Mais la
 * règle du projet reste : on ne recopie que ce dont on a vérifié le droit,
 * et on laisse l'élève下载 depuis la source quand c'est possible.
 *
 * Usage :
 *   node tools/chercher-sujets-officiels.js              # aperçu
 *   node tools/chercher-sujets-officiels.js --ecrire     # écrit le manifeste
 */

const fs = require('fs');
const path = require('path');

const RACINE = path.resolve(__dirname, '..');
const SORTIE = path.join(RACINE, 'epreuves', 'sujets-officiels.json');

/**
 * Pages officielles autorisées. Seuls ces domaines sont lus : le contrôle
 * est fait sur le domaine final, après les redirections.
 */
const SOURCES = [
  {
    nom: "Ministère des Enseignements Secondaire, Technique et de la Formation Professionnelle (Bénin) — communiqués",
    url: 'https://enseignementsecondaire.gouv.bj/',
    licence: 'domaine public (document officiel de l\'État)'
  },
  {
    nom: "Ministère des Enseignements Secondaire, Technique et de la Formation Professionnelle (Bénin) — autres documents officiels",
    url: 'https://enseignementsecondaire.gouv.bj/actualite/autres-documents-officiels',
    licence: 'domaine public (document officiel de l\'État)'
  },
  {
    nom: "Ministère des Enseignements Secondaire, Technique et de la Formation Professionnelle (Bénin) — statistiques",
    url: 'https://enseignementsecondaire.gouv.bj/actualite/statistiques',
    licence: 'domaine public (document officiel de l\'État)'
  }
];

const DOMAINES_AUTORISES = [
  'enseignementsecondaire.gouv.bj',
  'www.enseignementsecondaire.gouv.bj',
  'gouv.bj',
  'www.gouv.bj'
];

const MOTS_SUJET = /epreuve|épreuve|sujet|sujet-corrige|composition|bepc|bac\b|brevet|concours|examen|annales/i;

const MATIERES = [
  { mot: /math/i, nom: 'Mathématiques' },
  { mot: /physique|chimie|pct/i, nom: 'Physique-Chimie' },
  { mot: /svt|sciences de la vie|sciences naturelles/i, nom: 'SVT' },
  { mot: /français|francais|litterature|littérature/i, nom: 'Français & Littérature' },
  { mot: /histoire|g[ée]ographie/i, nom: 'Histoire-Géographie' },
  { mot: /anglais/i, nom: 'Anglais' },
  { mot: /espagnol/i, nom: 'Espagnol' },
  { mot: /allemand/i, nom: 'Allemand' },
  { mot: /philosophie/i, nom: 'Philosophie' },
  { mot: /comptabilit[ée]/i, nom: 'Comptabilité' },
  { mot: /[ée]conomie/i, nom: 'Économie' }
];

function domaineAutorise(url) {
  try {
    const d = new URL(url).hostname.toLowerCase();
    return DOMAINES_AUTORISES.includes(d) ? d : null;
  } catch (e) {
    return null;
  }
}

function sansAccents(texte) {
  return String(texte || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function devinerMatiere(titre) {
  const t = sansAccents(titre).toLowerCase();
  for (const entree of MATIERES) {
    if (entree.mot.test(t)) return entree.nom;
  }
  return '';
}

function devinerNiveau(titre) {
  const t = sansAccents(titre).toUpperCase();
  if (/\bBEPC\b|\bBREVET\b/.test(t)) return 'brevet';
  if (/\bBAC\b|\bBACCALAUREAT\b/.test(t)) return 'bac';
  return '';
}

function devinerAnnee(titre, date) {
  const annees = String(titre || '').match(/\b(19|20)\d{2}\b/g);
  if (annees && annees.length) return Number(annees[annees.length - 1]);
  const anneeDate = String(date || '').match(/\b(19|20)\d{2}\b/);
  return anneeDate ? Number(anneeDate[0]) : null;
}

/** Décode les entités HTML les plus courantes (accents, apostrophes). */
function decoderEntites(texte) {
  return String(texte || '')
    .replace(/&#039;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

/** Extrait (titre, date, lien) des documents d'une page officielle. */
function extraireDocuments(html, urlBase) {
  const documents = [];
  // Chaque bloc « <h3>titre</h3> … <a href="…pdf">Télécharger » .
  const morceaux = html.split(/<h3[^>]*>/i).slice(1);
  for (const morceau of morceaux) {
    const titre = (morceau.match(/^([\s\S]*?)<\/h3>/i) || [])[1];
    if (!titre) continue;
    const texteTitre = decoderEntites(titre.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
    if (!texteTitre || texteTitre.length < 3) continue;
    const date = decoderEntites((morceau.match(/<span[^>]*>([^<]{4,40})<\/span>/i) || [])[1] || '').trim();
    const lien = (morceau.match(/href="([^"]+\.pdf[^"]*)"/i) || [])[1];
    if (!lien) continue;
    let absolu = null;
    try { absolu = new URL(lien, urlBase).toString(); } catch (e) { continue; }
    documents.push({ titre: texteTitre, date, url: absolu });
  }
  return documents;
}

async function lireSource(source) {
  if (!domaineAutorise(source.url)) {
    return { source, erreur: 'domaine non autorisé', documents: [] };
  }
  const reponse = await fetch(source.url, {
    redirect: 'follow',
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Revizy-IndexOfficiel/1.0)' }
  });
  if (!reponse.ok) {
    return { source, erreur: `HTTP ${reponse.status}`, documents: [] };
  }
  const html = await reponse.text();
  // Après redirection, le domaine doit toujours être autorisé.
  if (!domaineAutorise(reponse.url)) {
    return { source, erreur: `redirection hors liste blanche (${reponse.url})`, documents: [] };
  }
  const documents = extraireDocuments(html, reponse.url);
  return { source, page: reponse.url, documents };
}

(async () => {
  const ecrire = process.argv.includes('--ecrire');
  const resultats = [];
  let total = 0;

  for (const source of SOURCES) {
    let sortie;
    try {
      sortie = await lireSource(source);
    } catch (e) {
      console.log(`✗ ${source.nom} : ${e.message || e}`);
      continue;
    }
    if (sortie.erreur) {
      console.log(`✗ ${source.nom} : ${sortie.erreur}`);
      continue;
    }
    console.log(`✓ ${source.nom} : ${sortie.documents.length} document(s) trouvé(s)`);
    for (const doc of sortie.documents) {
      const estSujet = MOTS_SUJET.test(doc.titre);
      resultats.push({
        titre: doc.titre,
        url: doc.url,
        date: doc.date || null,
        type: estSujet ? 'sujet' : 'document',
        matiere: devinerMatiere(doc.titre),
        niveau: devinerNiveau(doc.titre),
        annee: devinerAnnee(doc.titre, doc.date),
        source_nom: source.nom,
        source_url: source.url,
        licence: source.licence
      });
      total++;
    }
  }

  const candidats = resultats.filter(r => r.type === 'sujet');
  console.log(`\nTotal : ${total} document(s) indexés, dont ${candidats.length} sujets d'examen.`);

  if (ecrire) {
    fs.mkdirSync(path.dirname(SORTIE), { recursive: true });
    fs.writeFileSync(SORTIE, JSON.stringify({
      genereLe: new Date().toISOString().slice(0, 10),
      note: 'Métadonnées et liens uniquement : aucun document officiel n\'est téléchargé ni recopié.',
      documents: resultats
    }, null, 2), 'utf8');
    console.log(`Manifeste écrit : ${SORTIE}`);
  } else {
    console.log('\n(Ajouter --ecrire pour enregistrer le manifeste.)');
    for (const c of candidats.slice(0, 15)) {
      console.log(`  ${c.matiere || '(matière ?)'}/${c.niveau || 'niveau ?'} ${c.annee || ''} — ${c.titre.slice(0, 60)}`);
    }
  }
})();
