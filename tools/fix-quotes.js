// Corrige les titres SQL mal fermés : 'texte'','  ->  'texte',
// Ce pattern apparaît quand un titre contient une apostrophe échappée
// et que la fermeture du string est devenue '','  au lieu de  ','
const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'seed_curriculum.sql');

let sql = fs.readFileSync(file, 'utf8');
const lines = sql.split('\n');

let fixed = 0;
const result = lines.map((line, i) => {
  // Pattern erroné : apostrophe double suivie de virgule-apostrophe
  // ex: l''espace'','SA 3'  -> l''espace','SA 3'
  if (!line.includes("'','")) return line;

  const newLine = line.replace(/'','(?!')/g, "','");
  if (newLine !== line) {
    fixed++;
    console.log('Corrigé ligne ' + (i + 1) + ':');
    console.log('  AVANT: ' + line.substring(0, 110));
    console.log('  APRÈS: ' + newLine.substring(0, 110));
  }
  return newLine;
});

const out = result.join('\n');

// Vérification finale
const remaining = (out.match(/'','(?!')/g) || []).length;
const triple    = (out.match(/'''/g) || []).length;

console.log('\nLignes corrigées :', fixed);
console.log("Pattern erronés restants :", remaining, '<-- doit être 0');
console.log("Triple apostrophes       :", triple,    '<-- doit être 0');

if (remaining === 0 && triple === 0) {
  fs.writeFileSync(file, out, 'utf8');
  console.log('Fichier sauvegardé proprement.');
} else {
  console.log('ATTENTION - problèmes restants, non sauvegardé.');
}
