// Test isole de repairJson / extractJson (server.js)
const fs = require('fs');
const path = require('path');

const src = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf8');
// Le dépôt est en CRLF : on tolère \r\n comme \n dans les motifs.
const reparation = /function repairJson[\s\S]*?\r?\n}\r?\n/;
const extraction = /function extractJson[\s\S]*?\r?\n}\r?\n/;
const assainissement = /function assainirEscapesJson[\s\S]*?\r?\n}\r?\n/;
const repairSrc = src.match(reparation);
const extractSrc = src.match(extraction);
const assainirSrc = src.match(assainissement);
if (!repairSrc || !extractSrc || !assainirSrc) {
  console.error('FAIL : repairJson / extractJson / assainirEscapesJson introuvables dans server.js');
  process.exit(1);
}
eval(assainirSrc[0]);
eval(repairSrc[0]);
eval(extractSrc[0]);

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