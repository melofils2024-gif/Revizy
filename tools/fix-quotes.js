const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'seed_curriculum.sql');

let sql = fs.readFileSync(file, 'utf8');
const lines = sql.split('\n');

let fixed = 0;
const result = lines.map((line, i) => {
  if (!line.includes("'''")) return line;

  // Remplacer toute séquence de 3 apostrophes par 2
  // Dans les titres SQL, x'''y signifie que la valeur contient x'y
  // et doit s'écrire x''y (SQL escape)
  const newLine = line.replace(/'''/g, "''");
  if (newLine !== line) {
    fixed++;
    console.log('Fixed line ' + (i+1) + ':');
    console.log('  WAS: ' + line.substring(0, 100));
    console.log('  NOW: ' + newLine.substring(0, 100));
  }
  return newLine;
});

const out = result.join('\n');

// Vérifier qu'il n'y a plus de '''
const remaining = (out.match(/'''/g) || []).length;
console.log('\nLignes corrigées :', fixed);
console.log("Triple apostrophes restantes :", remaining);

if (remaining === 0) {
  fs.writeFileSync(file, out, 'utf8');
  console.log('Fichier sauvegardé.');
} else {
  console.log('ATTENTION : triples restantes — non sauvegardé');
}
