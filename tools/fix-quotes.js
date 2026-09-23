// Corrige les apostrophes doublées causées par PowerShell here-strings
// ''bac'' -> 'bac'  (délimiteurs de valeurs SQL)
// L''État reste L''État (vrai échappement SQL à l'intérieur d'une chaîne)

const fs = require('fs');
const file = require('path').join(__dirname, '..', 'seed_curriculum.sql');

let sql = fs.readFileSync(file, 'utf8');
const before = (sql.match(/''/g) || []).length;

// On remplace les '' qui jouent le rôle de délimiteurs de string SQL.
// Ils apparaissent toujours après ( , = espace ou en début de ligne :
//   (''bac'',  -> ('bac',
//   ''bac''    -> 'bac'  (après virgule ou parenthèse)
// On ne touche PAS aux '' au milieu d'un mot (L''État, qu''il, etc.)
// car ceux-là sont de vrais échappements SQL.

// Étape 1 : remplacer '' suivi d'un contenu puis '' quand précédé
// par un délimiteur SQL typique (, ( = \n espace)
sql = sql.replace(/([\s,(=])''((?:[^']|'(?!'))*?)''/g, (m, pre, val) => {
  return pre + "'" + val + "'";
});

// Étape 2 : cas en début absolu de ligne ou après INSERT VALUES
sql = sql.replace(/^''((?:[^']|'(?!'))*?)''/gm, (m, val) => {
  return "'" + val + "'";
});

const after = (sql.match(/''/g) || []).length;
fs.writeFileSync(file, sql, 'utf8');

console.log('Avant : ' + before + " doubles apostrophes ''");
console.log('Après : ' + after  + " doubles apostrophes ''");
console.log('Corrigées : ' + (before - after));

// Vérification rapide : afficher les 3 premières lignes d'INSERT
const lines = sql.split('\n');
const insertLine = lines.findIndex(l => l.includes('insert into public.niveaux'));
if (insertLine >= 0) {
  console.log('\nAperçu INSERT niveaux :');
  console.log(lines.slice(insertLine, insertLine + 5).join('\n'));
}
