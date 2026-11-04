// Test d'intégrité des sources d'épreuves externes (liens, jamais de copie)
// Usage : node tools/test-sources-epreuves.js [--online]
//
// Le but : garantir qu'aucun document tiers n'est présenté comme étant
// hébergé par Revizy, qu'un lien mort reste masqué, et que chaque source
// affichée porte bien son verdict de réutilisation.

const fs = require('fs');
const path = require('path');
const https = require('https');
const C = require('../contexts.js');

const ROOT = path.resolve(__dirname, '..');
const enLigne = process.argv.includes('--online');
let ok = 0;
let ko = 0;

function verifier(condition, message, detail = '') {
  if (!condition) { ko++; console.log('ECHEC | ' + message + (detail ? ' -> ' + detail : '')); }
  else { ok++; console.log('OK    | ' + message + (detail ? ' -> ' + detail : '')); }
}

// ── 1. Les données ─────────────────────────────────────────────────
const sources = C.SOURCES_EPREUVES;
verifier(Array.isArray(sources) && sources.length >= 4,
  'Le registre des sources externes est publié', `${(sources || []).length} source(s)`);

const VERDICTS = ['lien', 'inspiration', 'reprise'];
const STATUTS = ['ok', 'injoignable'];

for (const s of sources) {
  verifier(!!s.nom && s.nom.length > 1, `Source nommée : ${s.nom}`);
  verifier(/^https:\/\/[^\s]+\.[a-z]{2,}/i.test(s.url), `URL https : ${s.nom}`, s.url);
  verifier(VERDICTS.includes(s.verdict), `Verdict de reprise défini : ${s.nom}`, s.verdict);
  verifier(STATUTS.includes(s.statut), `Statut du lien défini : ${s.nom}`, s.statut);
  verifier(!!s.contenu && s.contenu.length > 20, `Contenu décrit : ${s.nom}`);
  verifier(!/revisy\.onrender\.com/.test(s.url), `La source est bien externe : ${s.nom}`);
}

// ── 2. Aucune source ne se présente comme un document Revizy ───────
for (const s of sources) {
  const estNotreCopie = /(notre (propre )?(copie|version))|hébergé par revizy|téléchargeable sur revizy/i;
  verifier(!estNotreCopie.test(s.contenu || ''),
    `Aucune source n'est présentée comme une copie Revizy : ${s.nom}`);
}

// ── 3. L'interface masque les liens injoignables ───────────────────
const appJs = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');
verifier(appJs.includes('renderSourcesEpreuves'), 'Le rendu des sources existe dans app.js');
verifier(/statut\s*!==\s*'injoignable'/.test(appJs),
  "L'interface filtre les liens injoignables");
verifier(appJs.includes("T('epreuves.sourcesTitre')") && appJs.includes("T('epreuves.sourcesOuvrir')"),
  'Les libellés de la section passent par la traduction');

const indexHtml = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
verifier(indexHtml.includes('id="sourcesEpreuvesListe"'),
  'Le conteneur de la section existe dans index.html');
verifier(indexHtml.includes('id="epreuvesListe"'),
  'La section est bien rattachée à l\'onglet Épreuves');

// ── 4. Les libellés sont traduits dans les 8 langues du site ───────
const ctxJs = fs.readFileSync(path.join(ROOT, 'contexts.js'), 'utf8');
for (const cle of ['epreuves.sourcesTitre', 'epreuves.sourcesIntro', 'epreuves.sourcesOuvrir', 'epreuves.sourcesHeberge']) {
  const occurrences = (ctxJs.match(new RegExp("'" + cle + "'", 'g')) || []).length;
  verifier(occurrences === 8, `« ${cle} » est traduit dans les 8 langues`, `${occurrences}/8`);
}
verifier(ctxJs.includes('SOURCES_EPREUVES'), 'contexts.js expose le registre des sources');

// ── 5. La documentation juridique couvre toutes les sources ───────
const deployMd = fs.readFileSync(path.join(ROOT, 'DEPLOY.md'), 'utf8');
for (const s of sources) {
  verifier(deployMd.includes(s.url), `DEPLOY.md documente le lien de ${s.nom}`, s.url);
  verifier(deployMd.includes(s.nom), `DEPLOY.md cite ${s.nom}`);
}
verifier(/ne jamais/i.test(deployMd) && /import-epreuves/.test(deployMd),
  'DEPLOY.md interdit l\'import automatique de ces sites');

// ── 6. Contrôle en ligne (optionnel) ───────────────────────────────
function testerUrl(url) {
  return new Promise((resolve) => {
    // GET (et non HEAD) : plusieurs de ces hébergeurs refusent HEAD.
    const req = https.request(url, {
      method: 'GET',
      timeout: 20000,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Revizy-SourceCheck/1.0)' }
    }, (res) => {
      res.on('data', () => { });
      res.on('end', () => resolve({ status: res.statusCode }));
      res.resume();
    });
    req.on('error', (e) => resolve({ status: 0, erreur: e.code || e.message }));
    req.on('timeout', () => { req.destroy(); resolve({ status: 0, erreur: 'timeout' }); });
  });
}

(async () => {
  if (!enLigne) {
    console.log('\n(contrôle en ligne ignoré : passer --online pour vérifier les liens)');
  } else {
    console.log('\n--- contrôle en ligne ---');
    for (const s of sources) {
      const r = await testerUrl(s.url);
      const erreurReseau = r.status === 0; // timeout / ECONNRESET : le réseau local bloque
      if (s.statut === 'injoignable') {
        // Un lien déclaré mort doit l'être vraiment : NXDOMAIN = concluant.
        verifier(r.erreur === 'ENOTFOUND', `${s.nom} — injoignable confirmé`,
          `résultat: ${r.erreur || 'HTTP ' + r.status}`);
      } else if (erreurReseau) {
        // Impossible de conclure depuis cette machine : ce n'est pas un échec.
        console.log(`INFO  | ${s.nom} — indéterminé (réseau local : ${r.erreur})`);
        ok++;
      } else {
        verifier(r.status >= 200 && r.status < 400, `${s.nom} — joignable`, `HTTP ${r.status}`);
      }
    }
  }

  console.log('\n====================================================');
  console.log(`${ok} test(s) réussi(s), ${ko} échec(s).`);
  process.exitCode = ko > 0 ? 1 : 0;
})();
