// Test du nettoyeur d'échappements JSON du serveur (server.js).
// L'IA glisse parfois du LaTeX brut dans le JSON : « \u » suivi de
// lettres devient un échappement Unicode invalide et casse le parsing.
//
// Usage : node tools/test-json-escapes.js

const fs = require('fs');
const path = require('path');

const source = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf8');
const debut = source.indexOf('function assainirEscapesJson');
const fin = source.indexOf('\nfunction repairJson', debut);
if (debut === -1 || fin === -1) {
  console.error('Fonction assainirEscapesJson introuvable dans server.js');
  process.exit(1);
}
const assainirEscapesJson = eval('(' + source.slice(debut, fin) + ')');

const cas = [
  {
    nom: 'LaTeX \\underbrace (\\u invalide)',
    entree: '{"question":"x = \\underbrace{a+b}_{c}"}',
    attendu: 'x = underbrace{a+b}_{c}'
  },
  {
    nom: 'LaTeX \\underline',
    entree: '{"question":"\\underline{calcul}"}',
    attendu: 'underline{calcul}'
  },
  {
    nom: 'Parenthèses LaTeX et pourcentage',
    entree: '{"question":"50 % \\(x\\)"}',
    attendu: '50 % (x)'
  },
  {
    nom: 'Échappement JSON valide conservé',
    entree: '{"question":"il dit \\"oui\\""}',
    attendu: 'il dit "oui"'
  },
  {
    nom: 'Unicode \\uXXXX valide conservé',
    entree: '{"question":"\\u00e9l\\u00e8ve"}',
    attendu: 'élève'
  },
  {
    nom: 'Barre oblique simple',
    entree: '{"question":"a/b"}',
    attendu: 'a/b'
  }
];

let echecs = 0;
for (const c of cas) {
  const sortie = assainirEscapesJson(c.entree);
  let parse = false;
  let valeur = '';
  try {
    const obj = JSON.parse(sortie);
    parse = true;
    valeur = obj.question;
  } catch (e) {
    valeur = 'PARSE KO : ' + e.message;
  }

  const ok = parse && valeur === c.attendu;
  if (!ok) echecs++;
  console.log((ok ? 'OK   ' : 'ECHEC') + ' | ' + c.nom + ' -> "' + valeur + '"' + (ok ? '' : ' (attendu "' + c.attendu + '")'));
}

console.log(echecs === 0 ? '\nTous les tests passent.' : '\n' + echecs + ' test(s) en échec.');
process.exit(echecs === 0 ? 0 : 1);
