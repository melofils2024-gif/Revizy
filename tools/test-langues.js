// Test de la couche langue/pays de contexts.js
// Usage : node tools/test-langues.js

const C = require('../contexts.js');

let echecs = 0;
function verifier(condition, message, detail = '') {
  if (!condition) { echecs++; console.log('ECHEC | ' + message + (detail ? ' -> ' + detail : '')); }
  else console.log('OK    | ' + message + (detail ? ' -> ' + detail : ''));
}

// 1. Tous les pays ont une langue
const sansLangue = C.PAYS_DISPONIBLES.filter(p => !p.langue);
verifier(sansLangue.length === 0, 'Tous les pays du catalogue ont une langue',
  sansLangue.map(p => p.code).join(', '));

// 2. La langue de chaque pays est supportée par le dictionnaire
const languesInconnues = [...new Set(C.PAYS_DISPONIBLES.map(p => p.langue))].filter(l => !C.LANGUES[l]);
verifier(languesInconnues.length === 0, 'Toutes les langues du catalogue sont dans LANGUES',
  languesInconnues.join(', '));

// 3. La langue du pays est bien celle attendue (quelques cas clés)
const cas = [
  ['BJ', 'fr'], ['SN', 'fr'], ['CI', 'fr'], ['CM', 'fr'],
  ['NG', 'en'], ['GH', 'en'], ['KE', 'en'], ['ZA', 'en'], ['ET', 'en'],
  ['MA', 'ar'], ['DZ', 'ar'], ['EG', 'ar'],
  ['AO', 'pt'], ['CV', 'pt'], ['BR', 'pt'],
  ['ES', 'es'], ['IT', 'it'], ['RU', 'ru'], ['CN', 'zh']
];
for (const [code, attendu] of cas) {
  verifier(C.langueDe(code) === attendu, `Langue de ${code}`, `${C.langueDe(code)} (attendu ${attendu})`);
}

// 4. Les pays africains sont proposés en premier
const liste = C.listePaysPourSelecteur();
const premiersNonAfricains = liste.findIndex(p => p.zone !== 'afrique');
const derniersAfricains = liste.map(p => p.zone).lastIndexOf('afrique');
verifier(premiersNonAfricains > derniersAfricains, 'Les pays africains viennent en premier',
  `${derniersAfricains + 1} pays africains sur ${liste.length}`);

// 5. Un pays sans programme publié a bien un contexte léger
const ctxGH = C.contexteCatalogue('GH');
verifier(!!ctxGH, 'Contexte léger disponible pour le Ghana');
verifier(ctxGH && ctxGH.langue === 'en', 'Contexte léger : langue du pays', ctxGH && ctxGH.langue);
verifier(ctxGH && ctxGH.textes.programmeOfficiel.includes('Ghana'), 'Contexte léger : programme du pays',
  ctxGH && ctxGH.textes.programmeOfficiel);

// 6. resolveContext renvoie le contexte léger pour un pays du catalogue
const res = C.resolveContext({ code: 'GH' });
verifier(res && res.code === 'GH', 'resolveContext respecte le pays demandé', res && res.code);
verifier(res && res.langue === 'en', 'resolveContext : langue du pays', res && res.langue);

// 7. Le contexte par défaut reste le Bénin
const def = C.resolveContext({});
verifier(def && def.code === 'BJ', 'resolveContext sans pays -> Bénin', def && def.code);

// 8. Traduction : la clé demandée est traduite et les paramètres remplacés
const fr = C.traduire('BJ', 'banner.title', { pays: 'Bénin' });
verifier(fr.includes('Bénin'), 'Traduction FR avec paramètre', fr);
const en = C.traduire('GH', 'banner.title', { pays: 'Ghana' });
verifier(en.includes('Ghana') && en !== fr, 'Traduction EN avec paramètre', en);
const ar = C.traduire('MA', 'banner.title', { pays: 'Maroc' });
verifier(ar.includes('Maroc') && /[؀-ۿ]/.test(ar), 'Traduction AR avec paramètre', ar);

// 9. Une clé inconnue ne casse rien
verifier(typeof C.traduire('BJ', 'cle.inconnue') === 'string', 'Clé inconnue : repli sûr', C.traduire('BJ', 'cle.inconnue'));

// 10. Les libellés Vrai/Faux suivent la langue (côté serveur)
const srv = require('fs').readFileSync(require('path').join(__dirname, '..', 'server.js'), 'utf8');
verifier(srv.includes('optionsVraiFaux'), 'Le serveur expose des options Vrai/Faux localisées');

console.log(echecs === 0 ? '\nTous les tests passent.' : '\n' + echecs + ' test(s) en échec.');
process.exit(echecs === 0 ? 0 : 1);
