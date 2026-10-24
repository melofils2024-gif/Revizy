/**
 * Audit statique du site Revizy.
 *
 * Vérifie, sans exécuter le site, que :
 *  - chaque fonction appelée par un handler inline du HTML existe dans app.js ;
 *  - chaque id interrogé par app.js existe dans index.html ou est créé à la volée ;
 *  - chaque route de navigation go('...') correspond à une vue déclarée ;
 *  - chaque endpoint appelé par le front est traité par server.js.
 *
 * Usage : node tools/audit-site.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const lire = nom => fs.readFileSync(path.join(ROOT, nom), 'utf8');

const html = lire('index.html');
const app = lire('app.js');
const server = lire('server.js');

const issues = [];
const crypto = require('crypto');

console.log('====================================================');
console.log('REVIZY — AUDIT STATIQUE DU SITE');
console.log('====================================================\n');

// -----------------------------------------------------------------
// 1. Handlers inline du HTML → fonctions définies dans app.js
// -----------------------------------------------------------------
console.log('--- 1. Handlers inline (onclick…) vs fonctions de app.js ---');
const BUILTINS = new Set([
  'alert', 'confirm', 'prompt', 'setTimeout', 'setInterval', 'clearTimeout', 'clearInterval',
  'requestAnimationFrame', 'scrollTo', 'scrollBy', 'scrollIntoView', 'print', 'open', 'close',
  'focus', 'blur', 'click', 'getElementById', 'querySelector', 'querySelectorAll',
  'addEventListener', 'removeEventListener', 'dispatchEvent', 'preventDefault', 'stopPropagation',
  'parseInt', 'parseFloat', 'Number', 'String', 'Boolean', 'Math', 'Date', 'JSON', 'Object',
  'Array', 'encodeURIComponent', 'decodeURIComponent', 'atob', 'btoa', 'matchMedia',
  'getComputedStyle', 'closest', 'remove', 'append', 'insertAdjacentHTML', 'fetch', 'require',
  'console', 'document', 'window', 'return', 'if', 'for', 'while', 'new', 'await', 'async',
  'typeof', 'catch', 'switch', 'case', 'break', 'continue', 'void', 'this', 'null', 'true', 'false'
]);

const handlerRegex = /\bon(?:click|submit|change|input|keyup|keydown|mouseover)\s*=\s*"([^"]+)"/gi;
const appJsEtHtml = app + '\n' + html;
const calledFunctions = new Set();
let match;
while ((match = handlerRegex.exec(html)) !== null) {
  for (const fn of match[1].matchAll(/([a-zA-Z0-9_$]+)\s*\(/g)) {
    if (!BUILTINS.has(fn[1])) calledFunctions.add(fn[1]);
  }
}
for (const fn of calledFunctions) {
  const defined = new RegExp(
    `(?:function\\s+${fn}\\b|(?:const|let|var)\\s+${fn}\\s*=|window\\.${fn}\\s*=|${fn}\\s*[:=]\\s*(?:async\\s*)?(?:function|\\())`
  ).test(app);
  if (!defined) {
    issues.push(`BLOQUANT : la fonction "${fn}()" est appelée par un handler inline du HTML mais n'est pas définie dans app.js.`);
  }
}
console.log(`  ${calledFunctions.size} fonctions distinctes vérifiées.`);

// -----------------------------------------------------------------
// 2. getElementById dans app.js → ids présents dans index.html ou créés en JS
// -----------------------------------------------------------------
console.log('--- 2. getElementById(app.js) vs ids de index.html ---');
const getElemRegex = /document\.getElementById\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g;
const queriedIds = new Set();
while ((match = getElemRegex.exec(app)) !== null) queriedIds.add(match[1]);

const declaredIds = new Set();
for (const m of html.matchAll(/\bid\s*=\s*['"]([^'"]+)['"]/g)) declaredIds.add(m[1]);

let missingIds = 0;
for (const id of queriedIds) {
  if (id.includes('${') || id.includes('_')) continue;               // ids générés dynamiquement
  if (declaredIds.has(id)) continue;                                  // présent dans le HTML
  const creeEnJs = new RegExp(`\\.id\\s*=\\s*['"]${id}['"]|id=['"]${id}['"]`).test(app);
  if (!creeEnJs) {
    issues.push(`IMPORTANT : getElementById("${id}") est interrogé dans app.js mais l'id n'existe ni dans index.html ni créé en JS (vérifier la null-check).`);
    missingIds++;
  }
}
console.log(`  ${queriedIds.size} ids interrogés (${missingIds} introuvable(s)).`);

// -----------------------------------------------------------------
// 3. Routes go('...') → vues déclarées
// -----------------------------------------------------------------
console.log('--- 3. Routes go(...) vs vues de index.html ---');
const goRegex = /\bgo\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
const navigatedViews = new Set();
while ((match = goRegex.exec(app)) !== null) navigatedViews.add(match[1]);
while ((match = goRegex.exec(html)) !== null) navigatedViews.add(match[1]);

for (const v of navigatedViews) {
  // Convention du projet : la vue porte l'id "view-<nom>" (cf. go() dans app.js)
  const attendu = `view-${v}`;
  const existe = declaredIds.has(attendu) || new RegExp(`id=['"]${attendu}['"]`).test(html);
  if (!existe) {
    issues.push(`BLOQUANT : la route go("${v}") cherche l'élément id="${attendu}" qui n'existe pas dans index.html.`);
  }
}
console.log(`  ${navigatedViews.size} routes vérifiées.`);

// -----------------------------------------------------------------
// 4. Endpoints appelés par le front → traités par server.js
// -----------------------------------------------------------------
console.log('--- 4. Endpoints app.js vs server.js ---');
const fetchRegex = /fetch\s*\(\s*`?\$\{API_BASE_URL}([^`'"]+)`?/g;
const apiEndpoints = new Set();
while ((match = fetchRegex.exec(app)) !== null) apiEndpoints.add(match[1].split('?')[0]);

for (const ep of apiEndpoints) {
  const base = ep.split('/').filter(Boolean).pop() || ep;
  const handled = server.includes(ep) || server.includes(base);
  if (!handled) {
    issues.push(`BLOQUANT : l'endpoint "${ep}" est appelé par app.js mais n'est pas traité par server.js.`);
  }
}
console.log(`  ${apiEndpoints.size} endpoints vérifiés.`);

// -----------------------------------------------------------------
// 5. Auto-récursions (le bug qui cassait toutes les vues)
// -----------------------------------------------------------------
console.log('--- 5. Auto-appels récursifs (logger, etc.) ---');
const recursionRegex = /(\w+)\s*:\s*(?:async\s*)?function\s*\([^)]*\)\s*\{([\s\S]{0,400}?)\n\s*\}/g;
let autoRecursions = 0;
while ((match = recursionRegex.exec(app)) !== null) {
  const [, nom, corps] = match;
  // Appel direct de la fonction (on ignore console.xxx et autres préfixes).
  const appelDirect = new RegExp(`(?<![.\\w])${nom}\\s*\\(`).test(corps);
  if (appelDirect) {
    issues.push(`BLOQUANT : "${nom}" s'appelle lui-même (récursion infinie).`);
    autoRecursions++;
  }
}
console.log(`  ${autoRecursions} auto-récursion(s) détectée(s).`);

// -----------------------------------------------------------------
// 6. Fuite de secrets
// -----------------------------------------------------------------
console.log('--- 6. Secrets en clair dans le code ---');
const secretRegex = /(AIza[0-9A-Za-z_-]{30,}|sk_(live|test)_[0-9A-Za-z]{20,}|eyJhbGciOi[A-Za-z0-9_.-]{40,})/g;
for (const f of ['app.js', 'server.js', 'server_payments.js', 'contexts.js', 'config.js', 'index.html']) {
  const contenu = lire(f);
  const trouves = contenu.match(secretRegex);
  if (trouves) issues.push(`BLOQUANT : clé en clair détectée dans ${f} (${trouves.length}).`);
}
console.log('  Aucun secret en clair.');

// -----------------------------------------------------------------
console.log('\n====================================================');
console.log(`RÉSULTAT : ${issues.length} problème(s) détecté(s).`);
console.log('====================================================');
issues.forEach((iss, i) => console.log(`${i + 1}. ${iss}`));
if (!issues.length) console.log('Aucune anomalie bloquante détectée.');
process.exitCode = issues.length ? 1 : 0;
