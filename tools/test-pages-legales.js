/**
 * tools/test-pages-legales.js
 *
 * Contrôle les pages légales et de conformité :
 *   1. chaque page existe et a la structure attendue (doctype, langue,
 *      viewport, titre, description, un seul h1, feuille de style) ;
 *   2. les liens internes pointent vers une page qui existe ;
 *   3. AUCUNE corruption de caractères : pas de caractère chinois, cyrille,
 *      arabe ou devanagari qui se serait glissé dans un texte français ;
 *   4. les emplacements restés à compléter sont comptés (ils sont
 *      volontairement laissés : ils doivent être visibles, pas invisibles).
 *
 * Usage : node tools/test-pages-legales.js
 */
const fs = require('fs');
const path = require('path');

const RACINE = path.resolve(__dirname, '..');

let ok = 0;
let ko = 0;

function test(nom, condition, detail = '') {
  if (condition) { ok++; console.log(`OK    | ${nom}`); }
  else { ko++; console.log(`KO    | ${nom}${detail ? ' -> ' + detail : ''}`); }
}

// Les pages légales et leurs equivalents (URL propres → fichiers).
const PAGES = [
  { url: '/mentions-legales', fichier: 'mentions-legales.html' },
  { url: '/politique-de-confidentialite', fichier: 'politique-de-confidentialite.html' },
  { url: '/cookies', fichier: 'cookies.html' },
  { url: '/conditions-generales', fichier: 'conditions-generales.html' },
  { url: '/accessibilite', fichier: 'accessibilite.html' },
  { url: '/contact', fichier: 'contact.html' }
];

// Plages de caractères qui n'ont rien à faire dans une page française.
const PLAGES_INTERDITES = [
  { nom: 'chinois', re: /[\u3000-\u303f\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/g },
  { nom: 'cyrillique', re: /[\u0400-\u04ff]/g },
  { nom: 'arabe', re: /[\u0600-\u06ff\ufb50-\ufdff]/g },
  { nom: 'hebreu', re: /[\u0590-\u05ff]/g },
  { nom: 'devanagari', re: /[\u0900-\u097f]/g },
  { nom: 'thaï', re: /[\u0e00-\u0e7f]/g },
  { nom: 'hangul', re: /[\uac00-\ud7af]/g }
];

// Les URL propres que le serveur doit servir.
const ROUTES_ATTENDUES = [
  '/mentions-legales',
  '/politique-de-confidentialite',
  '/cookies',
  '/conditions-generales',
  '/accessibilite',
  '/contact'
];

console.log('— Pages légales —');

const contenus = new Map();

for (const page of PAGES) {
  const chemin = path.join(RACINE, page.fichier);
  const existe = fs.existsSync(chemin);
  test(`${page.fichier} existe`, existe);
  if (!existe) continue;

  const html = fs.readFileSync(chemin, 'utf8');
  contenus.set(page.url, html);

  test(`${page.fichier} commence par un doctype`,
    /^\s*<!DOCTYPE html>/i.test(html));
  test(`${page.fichier} déclare la langue française`,
    /<html[^>]+lang=["']fr["']/i.test(html));
  test(`${page.fichier} déclare l'encodage UTF-8`,
    /<meta[^>]+charset=["']?utf-8/i.test(html));
  test(`${page.fichier} est adaptative (viewport)`,
    /<meta[^>]+name=["']viewport["'][^>]+width=device-width/i.test(html));
  test(`${page.fichier} a un titre`,
    /<title>[^<]{5,}<\/title>/i.test(html));
  test(`${page.fichier} a une description`,
    /<meta[^>]+name=["']description["'][^>]+content=["'][^"]{20,}["']/i.test(html));
  test(`${page.fichier} charge la feuille de style du site`,
    /<link[^>]+href=["']\/style\.css["']/i.test(html));
  test(`${page.fichier} a exactement un h1`,
    (html.match(/<h1[\s>]/gi) || []).length === 1,
    `${(html.match(/<h1[\s>]/gi) || []).length} h1`);
  test(`${page.fichier} a un lien d'évitement`,
    /class=["']skip["']/i.test(html));
  test(`${page.fichier} propose l'année courante`,
    /id=["']annee["']/i.test(html));
  test(`${page.fichier} ne dépend d'aucun script externe`,
    !/<script[^>]+src=["']https?:/i.test(html),
    'un script externe a été trouvé');

  // 2. Corruption de caractères.
  for (const plage of PLAGES_INTERDITES) {
    const trouve = html.match(plage.re);
    test(`${page.fichier} ne contient aucun caractère ${plage.nom}`,
      !trouve,
      trouve ? trouve.slice(0, 3).join(' ') : '');
  }

  // 3. Aucun texte vide ou balise cassée évidente.
  test(`${page.fichier} n'a pas de balise non fermée grossière`,
    (html.match(/<p[\s>]/gi) || []).length === (html.match(/<\/p>/gi) || []).length,
    `${(html.match(/<p[\s>]/gi) || []).length} <p> pour ${(html.match(/<\/p>/gi) || []).length} </p>`);
  test(`${page.fichier} n'a pas de section non fermée`,
    (html.match(/<section[\s>]/gi) || []).length === (html.match(/<\/section>/gi) || []).length);
}

console.log('\n— Liens entre les pages —');
for (const [url, html] of contenus) {
  const liens = [...html.matchAll(/href=["'](\/[a-z-]+)["']/gi)].map(m => m[1]);
  const internes = [...new Set(liens)].filter(l => !l.startsWith('/v1/'));
  const casses = internes.filter(l => !ROUTES_ATTENDUES.includes(l) && l !== '/');
  test(`${url} ne pointe vers aucune page inexistante`,
    casses.length === 0,
    casses.join(', '));
  test(`${url} renvoie vers les autres pages légales`,
    internes.filter(l => ROUTES_ATTENDUES.includes(l)).length >= 4);
}

console.log('\n— Emplacements à compléter —');
let totalPlaces = 0;
for (const [url, html] of contenus) {
  const places = (html.match(/\[[^\]\n]{2,60}\]/g) || []).length;
  totalPlaces += places;
  test(`${url} signale les informations manquantes`,
    /À compléter/i.test(html));
  console.log(`       ${url} : ${places} emplacement(s) à compléter`);
}
test('les emplacements restants sont visibles et documentés',
  totalPlaces > 0, `${totalPlaces} au total`);

console.log('\n====================================================');
console.log(`${ok} test(s) réussi(s), ${ko} échec(s).`);
process.exitCode = ko > 0 ? 1 : 0;
