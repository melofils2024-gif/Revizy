/**
 * Normalise en LF tous les fichiers SQL du dépôt suivis par Git.
 * Usage : node tools/normaliser-sql-lf.js [--check]
 *   sans --check : réécrit les fichiers qui contiennent des CR
 *   avec --check : se contente de lister ceux qui sont à normaliser
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { normaliserLF } = require('./lib/lf');

const ROOT = path.resolve(__dirname, '..');
const check = process.argv.includes('--check');

const sortie = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '--', '*.sql'], { cwd: ROOT, encoding: 'utf8' });
const fichiers = sortie.split('\n').filter(Boolean);

let corriges = 0;
let inchanges = 0;
for (const f of fichiers) {
  const chemin = path.join(ROOT, f);
  if (!fs.existsSync(chemin)) continue;
  const buf = fs.readFileSync(chemin);
  const avant = buf.toString('utf8');
  const apres = normaliserLF(avant);
  if (avant === apres) { inchanges++; continue; }
  const cr = (buf.toString('latin1').match(/\r/g) || []).length;
  if (check) {
    console.log(`  CR ${String(cr).padStart(5)}  ${f}`);
  } else {
    fs.writeFileSync(chemin, apres, 'utf8');
    console.log(`  normalise (${cr} CR retires)  ${f}`);
  }
  corriges++;
}
console.log(`\n${fichiers.length} fichiers SQL — ${corriges} a normaliser, ${inchanges} deja en LF.`);
if (check && corriges > 0) process.exitCode = 1;
