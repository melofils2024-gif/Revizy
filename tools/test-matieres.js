// Test de cohérence du catalogue de matières (non-régression)
// Usage : node tools/test-matieres.js
//
// Vérifie que les matières affichées par le site (contexts.js) et celles
// seedées en base (seed_curriculum.sql) ne divergent JAMAIS : c'est le
// décalage qui faisait qu'un élève voyait « Espagnol » au catalogue mais
// n'avait aucun chapitre en base (et l'inverse).

const fs = require('fs');
const path = require('path');
const C = require('../contexts.js');

const ROOT = path.resolve(__dirname, '..');
let ok = 0;
let ko = 0;

function verifier(condition, message, detail = '') {
  if (!condition) { ko++; console.log('ECHEC | ' + message + (detail ? ' -> ' + detail : '')); }
  else { ok++; console.log('OK    | ' + message + (detail ? ' -> ' + detail : '')); }
}

// ─────────────────────────────────────────────────────────────────
// 1. Le catalogue local expose Espagnol et Allemand là où c'est prévu
// ─────────────────────────────────────────────────────────────────
const matieres = C.CONTEXTS.BJ.matieres;
const noms = (liste) => (liste || []).map(m => (typeof m === 'string' ? m : m.name));

const cibles = [
  ['3ème (brevet)', noms(matieres.brevet)],
  ['Tle A', noms(matieres.bac.A)],
  ['Tle B', noms(matieres.bac.B)]
];

for (const [libelle, liste] of cibles) {
  verifier(liste.includes('Espagnol'), `Espagnol est au catalogue ${libelle}`, liste.join(', '));
  verifier(liste.includes('Allemand'), `Allemand est au catalogue ${libelle}`, liste.join(', '));
}

// Aucune propagation indue : les séries C, D et G n'ont pas les LV2.
for (const serie of ['C', 'D', 'G']) {
  const liste = noms(matieres.bac[serie]);
  verifier(!liste.includes('Espagnol') && !liste.includes('Allemand'),
    `Les LV2 ne sont pas ajoutées en série ${serie}`, liste.join(', '));
}

// ─────────────────────────────────────────────────────────────────
// 2. Le programme local (topics) existe pour chaque niveau concerné
// ─────────────────────────────────────────────────────────────────
const cur = C.CONTEXTS.BJ.curriculum;
for (const [niveau, serie] of [['brevet', null], ['bac', 'A'], ['bac', 'B']]) {
  for (const matiere of ['Espagnol', 'Allemand']) {
    const bloc = cur[niveau][matiere];
    const topics = Array.isArray(bloc) ? bloc : (bloc && (bloc[serie] || bloc.A));
    verifier(Array.isArray(topics) && topics.length >= 3,
      `Programme local : ${matiere} (${niveau}${serie ? ' ' + serie : ''})`,
      Array.isArray(topics) ? topics.length + ' topics' : 'absent');
  }
}

// ─────────────────────────────────────────────────────────────────
// 3. Chaque langue du site sait nommer les deux matières
// ─────────────────────────────────────────────────────────────────
const langues = [
  ['fr', 'BJ'], ['en', 'GH'], ['ar', 'MA'], ['pt', 'BR'],
  ['es', 'ES'], ['it', 'IT'], ['ru', 'RU'], ['zh', 'CN']
];
for (const [langue, pays] of langues) {
  const nomEsp = C.traduireMatiere(pays, 'Espagnol');
  const nomAll = C.traduireMatiere(pays, 'Allemand');
  verifier(nomEsp !== 'Espagnol' || langue === 'fr',
    `Le nom « Espagnol » est traduit en ${langue}`, nomEsp);
  verifier(nomAll !== 'Allemand' || langue === 'fr',
    `Le nom « Allemand » est traduit en ${langue}`, nomAll);
}

// ─────────────────────────────────────────────────────────────────
// 4. Le seed SQL contient exactement les mêmes matières que le catalogue
// ─────────────────────────────────────────────────────────────────
const seed = fs.readFileSync(path.join(ROOT, 'seed_curriculum.sql'), 'utf8');
const blocSubjects = seed.split('insert into public.subjects')[1] || '';
const lignes = blocSubjects.split('\n').slice(0, 200);

const seedSet = new Map(); // "niveau|serie" -> Set(noms)
const rRow = /\(\s*'([^']*)'\s*,\s*'([^']*)'\s*,\s*'([^']*)'\s*,\s*'([^']*)'\s*,\s*(NULL|'[^']*')\s*,\s*(\d+)\s*\)/g;
let m;
while ((m = rRow.exec(blocSubjects)) !== null) {
  const code = m[1];
  const name = m[2];
  const niveau = m[4];
  const serie = m[5] === 'NULL' ? '' : m[5].replace(/'/g, '');
  const cle = `${niveau}|${serie}`;
  if (!seedSet.has(cle)) seedSet.set(cle, new Map());
  seedSet.get(cle).set(name, { code, display: Number(m[6]) });
}

verifier(seedSet.size >= 6, 'Le seed SQL décrit les matières par niveau/série',
  Array.from(seedSet.keys()).join(', '));

// Comparaison ensemble par ensemble : niveau|série -> noms
const comparaisons = [
  ['brevet|', noms(matieres.brevet)],
  ['bac|A', noms(matieres.bac.A)],
  ['bac|B', noms(matieres.bac.B)],
  ['bac|C', noms(matieres.bac.C)],
  ['bac|D', noms(matieres.bac.D)],
  ['bac|G', noms(matieres.bac.G)]
];

for (const [cle, liste] of comparaisons) {
  const enBase = seedSet.get(cle);
  if (!enBase) {
    verifier(false, `Le seed SQL contient le niveau/série ${cle}`);
    continue;
  }
  const enBaseNoms = Array.from(enBase.keys());
  const manquantes = liste.filter(n => !enBaseNoms.includes(n));
  const enTrop = enBaseNoms.filter(n => !liste.includes(n));
  verifier(manquantes.length === 0,
    `Toutes les matières du catalogue ${cle} sont seedées`, manquantes.join(', '));
  verifier(enTrop.length === 0,
    `Le seed SQL n'a pas de matière hors catalogue pour ${cle}`, enTrop.join(', '));
}

// Les deux matières nouvelles sont bien présentes en base, avec un code stable
for (const [cle, attendu] of [['brevet|', 'Espagnol'], ['brevet|', 'Allemand'],
  ['bac|A', 'Espagnol'], ['bac|A', 'Allemand'],
  ['bac|B', 'Espagnol'], ['bac|B', 'Allemand']]) {
  const entree = (seedSet.get(cle) || new Map()).get(attendu);
  verifier(!!entree, `${attendu} est seedé en ${cle}`,
    entree ? `code=${entree.code} ordre=${entree.display}` : 'absent');
}

// ─────────────────────────────────────────────────────────────────
// 5. Le contenu de cours embarqué existe (app.js)
// ─────────────────────────────────────────────────────────────────
const appJs = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');
const debutKb = appJs.indexOf('const KNOWLEDGE_BASE = {');
const finKb = appJs.indexOf('\n};', debutKb);
const kb = appJs.slice(debutKb, finKb);

for (const [niveau, matiere] of [['brevet', 'Espagnol'], ['brevet', 'Allemand'],
  ['bac', 'Espagnol'], ['bac', 'Allemand']]) {
  const idx = kb.indexOf(`"${matiere}": {`);
  verifier(idx !== -1, `KNOWLEDGE_BASE.${niveau} contient ${matiere}`);
  if (idx === -1) continue;
  // On s'arrête à la matière suivante (clé de niveau 4 espaces) pour ne pas
  // compter les chapitres de la matière voisine.
  const suivant = kb.indexOf('\n    "', idx + 10);
  const bloc = kb.slice(idx, suivant === -1 ? undefined : suivant);
  const titres = (bloc.match(/title: "/g) || []).length;
  const cours = (bloc.match(/cours: "/g) || []).length;
  verifier(titres >= 6 && cours >= 6 && titres === cours,
    `${matiere} (${niveau}) a au moins 6 chapitres avec contenu`,
    `${titres} titres / ${cours} cours`);
}

// ─────────────────────────────────────────────────────────────────
// 6. L'interface student propose les deux LV2 dans les bonnes classes
// ─────────────────────────────────────────────────────────────────
const serverJs = fs.readFileSync(path.join(ROOT, 'server.js'), 'utf8');
verifier(appJs.includes("subjects.push('Espagnol', 'Allemand')"),
  'La banque d\'exercices de l\'élève propose Espagnol et Allemand');
verifier(/serie === 'A' \|\| serie === 'B'/.test(appJs),
  'Les LV2 sont proposées en Terminale A et B');
verifier(serverJs.includes("'Anglais', 'Espagnol', 'Allemand'"),
  'La liste blanche serveur connaît les deux LV2');

console.log('\n====================================================');
console.log(`${ok} test(s) réussi(s), ${ko} échec(s).`);
process.exitCode = ko > 0 ? 1 : 0;
