// Test isole de repairJson / extractJson (server.js)
const fs = require('fs');
const path = require('path');

const src = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf8');
const repairSrc = src.match(/function repairJson[\s\S]*?\n}\n/)[0];
const extractSrc = src.match(/function extractJson[\s\S]*?\n}\n/)[0];
eval(repairSrc);
eval(extractSrc);

const cases = [
  ['JSON tronque en plein objet', '{"chapitres":[{"title":"A","cours":"x"},{"title":"B","cours":"y"},{"title":"C","cours":"z"'],
  ['virgule finale', '{"chapitres":[{"title":"A"},]}'],
  ['virgule manquante entre objets', '{"chapitres":[{"title":"A","exercice":{"options":["a","b"]}},{"title":"B"}]}'],
  ['bloc markdown', '```json\n{"chapitres":[{"title":"A"}]}\n```'],
  ['tronque dans une chaine', '{"chapitres":[{"title":"A","cours":"texte interrompu'],
];

let ok = 0;
for (const [label, input] of cases) {
  try {
    const parsed = extractJson(input);
    const n = Array.isArray(parsed.chapitres) ? parsed.chapitres.length : 0;
    console.log(`OK   ${label} -> ${n} chapitre(s)`);
    ok++;
  } catch (e) {
    console.log(`FAIL ${label} -> ${e.message}`);
  }
}
console.log(`${ok}/${cases.length} cas réparés`);
process.exit(ok === cases.length ? 0 : 1);