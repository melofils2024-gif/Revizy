// Vérifie le catalogue des SA disponibles par matière / niveau / série
// (miroir de getSaCatalog côté navigateur, sans dépendances).
const fs = require('fs');
const path = require('path');

const src = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
const start = src.indexOf('const KNOWLEDGE_BASE = {');
const end = src.indexOf('\n};', start) + 3;
const sandbox = {};
const fn = new Function(`${src.slice(start, end)}; return KNOWLEDGE_BASE;`);
const KNOWLEDGE_BASE = fn();

const matieres = {
  brevet: Object.keys(KNOWLEDGE_BASE.brevet || {}),
  bac: Object.keys(KNOWLEDGE_BASE.bac || {})
};

let total = 0;
for (const [niveau, list] of Object.entries(matieres)) {
  for (const subject of list) {
    const data = KNOWLEDGE_BASE[niveau][subject];
    const chapters = (data && Array.isArray(data.chapters)) ? data.chapters : [];
    const grouped = new Map();
    for (const chap of chapters) {
      const sa = String(chap.sa || 'SA 1').trim();
      if (!grouped.has(sa)) grouped.set(sa, []);
      grouped.get(sa).push(chap.title);
    }
    const saList = Array.from(grouped.entries()).map(([sa, ch]) => `${sa} (${ch.length} ch.)`);
    total += saList.length;
    console.log(`${niveau.padEnd(6)} ${subject.padEnd(30)} ${saList.length ? saList.join(', ') : '— aucune SA'}`);
  }
}
console.log(`\n${total} SA disponibles au total.`);
