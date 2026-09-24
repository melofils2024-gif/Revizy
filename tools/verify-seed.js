const fs = require('fs');
const sql = fs.readFileSync(require('path').join(__dirname, '..', 'seed_curriculum.sql'), 'utf8');
const lines = sql.split('\n');

const triple    = lines.filter(l => l.includes("'''")).length;
const inserts   = (sql.match(/insert into public\.chapters/g)||[]).length;
const conflicts = (sql.match(/on conflict \(slug\) do nothing/g)||[]).length;
const qcm       = (sql.match(/'qcm'/g)||[]).length;
const vf        = (sql.match(/'vf'/g)||[]).length;
const commit    = sql.includes('commit;') ? 'OUI' : 'NON';
const hasBegin  = sql.includes('begin;') ? 'OUI' : 'NON';
const badDelim  = (sql.match(/\(''[a-zA-Z]/g)||[]).length;

console.log('=== VÉRIFICATION SEED_CURRICULUM.SQL ===');
console.log('Triple apostrophes   :', triple,        '<-- doit etre 0');
console.log('Délimiteurs erronés  :', badDelim,      '<-- doit etre 0');
console.log('BEGIN                :', hasBegin);
console.log('COMMIT               :', commit);
console.log('Chapitres (inserts)  :', inserts);
console.log('ON CONFLICT (slug)   :', conflicts,     '<-- doit = inserts');
console.log('Exercices QCM        :', qcm);
console.log('Exercices VF         :', vf);
console.log('Total exercices      :', qcm + vf,      '<-- doit = inserts');

const ok = triple === 0 && badDelim === 0 && inserts === conflicts && (qcm + vf) === inserts;
console.log('\nRésultat :', ok ? '✅ FICHIER OK' : '❌ PROBLEMES DÉTECTÉS');
