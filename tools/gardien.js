/**
 * tools/gardien.js — le gardien du site.
 *
 * Contrôle automatique, à lancer une fois par jour (tâche planifiée) :
 *   1. le site répond-il ? quelle version est en production ?
 *   2. la base est-elle à jour (migration appliquée) ?
 *   3. les documents officiels indexés sont-ils encore d'actualité ?
 *   4. les épreuves types sont-elles toujours présentes et téléchargeables ?
 *   5. les 4 banques d'annales référencées répondent-elles ?
 *
 * Si un point est rouge, le gardien envoie une alerte (webhook) et le dit
 * clairement. Il ne modifie rien : c'est un éclaireur, pas un réparateur.
 *
 * Usage :
 *   node tools/gardien.js            (production par défaut)
 *   node tools/gardien.js --offline  (aucun appel réseau : état local seul)
 *   node tools/gardien.js --json     (sortie lisible par une machine)
 */
const fs = require('fs');
const path = require('path');

const RACINE = path.resolve(__dirname, '..');
const PROD = process.env.SITE_URL || 'https://revisy.onrender.com';
const OFFLINE = process.argv.includes('--offline');
// Attention : ne pas nommer cette constante « JSON », ça masquerait le
// global JSON.parse utilisé plus bas.
const SORTIE_JSON = process.argv.includes('--json');
const WEBHOOK = process.env.ALERTE_WEBHOOK_URL || process.env.OWNER_ALERT_WEBHOOK_URL || '';

// Liste blanche : on ne teste que des hôtes autorisés.
const SOURCES_A_VERIFIER = [
  { nom: 'Studirex', url: 'https://studirex.com' },
  { nom: 'Fomesoutra', url: 'https://fomesoutra.com' },
  { nom: 'SujetDeBac', url: 'https://sujetdebac.fr' }
];

const controles = [];

function control(nom, ok, gravite, detail) {
  controles.push({ nom, ok, gravite, detail });
  return ok;
}

/** Un contrôle HTTP avec délai maximal. */
async function testerUrl(url, delaiMs = 15000) {
  const controleur = new AbortController();
  const minuteur = setTimeout(() => controleur.abort(), delaiMs);
  try {
    const r = await fetch(url, {
      redirect: 'follow',
      headers: { 'User-Agent': 'Revisy-Gardien/1.0' },
      signal: controleur.signal
    });
    return { ok: r.ok, status: r.status };
  } catch (e) {
    return { ok: false, status: 0, erreur: e.message };
  } finally {
    clearTimeout(minuteur);
  }
}

(async () => {
  // ── 1. Le site répond-il ? ─────────────────────────────────────────────
  let sante = null;
  if (!OFFLINE) {
    const r = await testerUrl(`${PROD}/health`);
    sante = r;
    control('le site répond', r.ok, 'critique', `HTTP ${r.status}`);
    if (r.ok) {
      try {
        const details = await (await fetch(`${PROD}/health`)).json();
        control('la base est joignable', details.base === 'ok', 'critique', `base=${details.base}`);
        control('la base est à jour (migration)', details.base === 'ok', 'alerte', `version=${details.version}`);
      } catch (e) {
        control('le diagnostic de santé est lisible', false, 'alerte', e.message);
      }
    }
  } else {
    control('contrôle en ligne désactivé (--offline)', true, 'info', 'seul l\'état local est vérifié');
  }

  // ── 2. Les épreuves types sont-elles présentes ? ───────────────────────
  const catalogue = path.join(RACINE, 'epreuves', 'types', 'catalogue.json');
  let documents = [];
  try {
    const brut = JSON.parse(fs.readFileSync(catalogue, 'utf8'));
    documents = Array.isArray(brut.documents) ? brut.documents : [];
  } catch (e) {
    control('le catalogue des épreuves types est lisible', false, 'critique', e.message);
  }
  control('le catalogue des épreuves types contient des documents',
    documents.length >= 8, 'alerte', `${documents.length} document(s)`);

  // Chaque document annoncé doit exister sur le disque.
  let manquants = [];
  for (const doc of documents) {
    for (const f of (doc.formats || [])) {
      const p = path.join(RACINE, 'epreuves', 'types', f.nom || '');
      if (!f.nom || !fs.existsSync(p)) manquants.push(f.nom);
    }
  }
  control('tous les fichiers annoncés existent', manquants.length === 0, 'critique', manquants.join(', '));

  // ── 3. Le manifeste des documents officiels est-il à jour ? ────────────
  const manifeste = path.join(RACINE, 'epreuves', 'sujets-officiels.json');
  let index = null;
  try {
    index = JSON.parse(fs.readFileSync(manifeste, 'utf8'));
  } catch (e) {
    control('le manifeste des documents officiels est lisible', false, 'alerte', e.message);
  }
  if (index) {
    const docs = Array.isArray(index.documents) ? index.documents : [];
    control('le manifeste contient des documents officiels', docs.length > 0, 'alerte', `${docs.length} document(s)`);
    const age = index.genereLe ? Math.round((Date.now() - Date.parse(index.genereLe)) / 86400000) : null;
    control('le manifeste a moins de 30 jours', age === null || age <= 30, 'info', age === null ? 'date inconnue' : `${age} jour(s)`);
  }

  // ── 4. Les banques d'annales référencées répondent-elles ? ─────────────
  if (!OFFLINE) {
    for (const source of SOURCES_A_VERIFIER) {
      const r = await testerUrl(source.url, 12000);
      control(`la source ${source.nom} répond`, r.ok, 'alerte', `HTTP ${r.status}`);
    }
  }

  // ── 5. Un téléchargement réel fonctionne-t-il ? ────────────────────────
  if (!OFFLINE && documents.length) {
    const nom = (documents[0].formats || []).find(f => f.format === 'pdf');
    if (nom) {
      const r = await testerUrl(`${PROD}/v1/epreuves-types/${encodeURIComponent(nom.nom)}`, 20000);
      control('un épreuve type se télécharge réellement', r.ok, 'critique', `HTTP ${r.status}`);
    }
  }

  // ── Bilan ──────────────────────────────────────────────────────────────
  const ko = controles.filter(c => !c.ok);
  const critiques = ko.filter(c => c.gravite === 'critique');
  const alertes = ko.filter(c => c.gravite === 'alerte');

  const rapport = {
    quand: new Date().toISOString(),
    site: PROD,
    total: controles.length,
    ok: controles.length - ko.length,
    echecs: ko.length,
    critiques: critiques.length,
    alertes: alertes.length,
    controles
  };

  if (SORTIE_JSON) {
    console.log(JSON.stringify(rapport, null, 2));
  } else {
    console.log('\n═══ GARDIEN REVISY ═══\n');
    controles.forEach(c => {
      const etat = c.ok ? 'OK  ' : 'KO  ';
      console.log(`${etat} ${c.nom}${c.detail ? '  (' + c.detail + ')' : ''}`);
    });
    console.log(`\n${rapport.ok}/${rapport.total} contrôles réussis — ${rapport.critiques} critique(s), ${rapport.alertes} alerte(s).`);
  }

  // Alerte si nécessaire.
  if (ko.length && WEBHOOK) {
    const texte = `[Revisy · GARDIEN] ${critiques.length} critique(s), ${alertes.length} alerte(s)\n`
      + ko.map(c => `• ${c.nom} — ${c.detail || ''}`).join('\n');
    try {
      const r = await fetch(WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: texte, rapport })
      });
      if (!r.ok) console.warn('[GARDIEN] alerte non envoyée : HTTP ' + r.status);
    } catch (e) {
      console.warn('[GARDIEN] alerte non envoyée :', e.message);
    }
  }

  process.exitCode = critiques.length ? 1 : 0;
})();
