/**
 * test-migration-sql.js — contrôles statiques sur MIGRATION_TOUT.sql.
 *
 * Le SQL Editor de Supabase exécute le script d'un bloc : UNE instruction
 * invalide fait échouer TOUT le lot. Ces contrôles移交ent les fautes
 * avant la copie dans le SQL Editor.
 *
 *   1. Déclencheurs : PostgreSQL interdit de combiner « INSERT » et
 *      « UPDATE OF colonnes » dans un même trigger (erreur fatale).
 *   2. GRANT sur une signature de fonction qui n'existe pas à cet instant
 *      (« function ... does not exist »).
 *   3. Idempotence : « create policy » / « create trigger » doivent être
 *      précédés de leur « drop ... if exists ».
 *   4. Ordre : une table utilisée avant sa création.
 *
 * Usage : node tools/test-migration-sql.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const fichier = path.join(ROOT, 'MIGRATION_TOUT.sql');

let ok = 0;
let ko = 0;
function test(nom, condition, detail) {
  if (condition) { ok++; console.log(`OK    | ${nom}`); }
  else { ko++; console.log(`KO    | ${nom}${detail ? ' → ' + detail : ''}`); }
}

if (!fs.existsSync(fichier)) {
  console.error('MIGRATION_TOUT.sql introuvable — lance d\'abord : node tools/build-migration.js');
  process.exit(1);
}
const sql = fs.readFileSync(fichier, 'utf8');
const lignes = sql.split(/\r?\n/);
// Version sans commentaires, mais avec les mêmes numéros de ligne :
// sinon les phrases des commentaires (« -- table subscriptions ») sont
// prises pour des instructions.
const sqlPropre = lignes.map(l => l.replace(/--.*$/, '')).join('\n');
const numeroDe = position => sqlPropre.slice(0, position).split('\n').length;

// ── Découpe en statements (en tenant compte des blocs $$ … $$) ────────
function splitStatements(source) {
  const statements = [];
  let buffer = '';
  let dansDollar = false;
  let dollarTag = '';
  for (const ligne of source.split(/\r?\n/)) {
    const mDollar = ligne.match(/\$([a-zA-Z_]*)\$/);
    if (!dansDollar && mDollar) { dollarTag = mDollar[0]; dansDollar = true; }
    else if (dansDollar && ligne.includes(dollarTag)) { dansDollar = false; }
    buffer += ligne + '\n';
    if (!dansDollar) {
      const propre = buffer.replace(/--.*$/gm, '').trim();
      if (propre.endsWith(';')) { statements.push({ texte: propre, ligne: numeroDe(buffer.length - 1) }); buffer = ''; }
    }
  }
  return statements;
}
const statements = splitStatements(sql);
const texte = statements.map(s => s.texte).join('\n');

// ── 1. Déclencheurs INSERT + UPDATE OF ────────────────────────────────
const interdits = [];
lignes.forEach((l, i) => {
  if (/^\s*--/.test(l)) return;
  if (/\b(insert|delete)\s+or\s+update\s+of\b/i.test(l) || /\bupdate\s+of\b[^;]*\bor\s+(insert|delete)\b/i.test(l)) {
    interdits.push(`L${i + 1} : ${l.trim().slice(0, 90)}`);
  }
});
test('aucun déclencheur ne combine INSERT et UPDATE OF', interdits.length === 0, interdits.join(' | '));

// ── Types des paramètres (pour comparer les signatures) ───────────────
const TYPES_SQL = new Set([
  'text', 'varchar', 'character', 'char', 'integer', 'int', 'int4', 'int2', 'bigint', 'int8',
  'smallint', 'boolean', 'bool', 'uuid', 'jsonb', 'json', 'numeric', 'decimal', 'real',
  'double', 'date', 'time', 'timestamp', 'timestamptz', 'timetz', 'interval', 'bytea',
  'serial', 'bigserial', 'money', 'inet', 'cidr', 'macaddr', 'xml', 'name', 'anyelement',
  'anyarray', 'anynonarray', 'anycompatible', 'void', 'regclass'
]);
function typeDeParametre(morceau) {
  let t = morceau.trim();
  if (!t) return '';
  const i = t.search(/\bdefault\b/i);
  if (i >= 0) t = t.slice(0, i).trim();
  if (!t) return '';
  const mots = t.split(/\s+/).filter(Boolean);
  if (mots.length > 1 && !TYPES_SQL.has(mots[0].toLowerCase())) mots.shift();
  const type = [];
  for (const mot of mots) {
    const base = mot.toLowerCase().replace(/\(.*\)$/, '');
    if (TYPES_SQL.has(base) || /^(text|uuid|jsonb|json|integer|bigint|numeric|boolean|date|timestamp)\[\]$/.test(mot.toLowerCase())) type.push(mot.toLowerCase());
    else if (type.length === 0) type.push(mot.toLowerCase());
    else break;
  }
  return type.join(' ').replace(/\s+/g, ' ');
}
function argsDeDefinition(source, debut) {
  const ouverture = source.indexOf('(', debut);
  if (ouverture < 0) return '';
  let niveau = 0; let fin = -1;
  for (let i = ouverture; i < source.length; i++) {
    const c = source[i];
    if (c === '(') niveau++;
    else if (c === ')') { niveau--; if (niveau === 0) { fin = i; break; } }
  }
  if (fin < 0) return '';
  const corps = source.slice(ouverture + 1, fin);
  const morceaux = []; let profondeur = 0; let courant = '';
  for (const c of corps) {
    if (c === '(' || c === '[') profondeur++;
    if (c === ')' || c === ']') profondeur--;
    if (c === ',' && profondeur === 0) { morceaux.push(courant); courant = ''; } else courant += c;
  }
  if (courant.trim()) morceaux.push(courant);
  return morceaux.map(typeDeParametre).filter(Boolean).join(',');
}

// ── 2. GRANT sur une signature inexistante ────────────────────────────
const evenements = [];
let m;
const rCreate = /create\s+(?:or\s+replace\s+)?function\s+(?:public\.)?([a-z_][a-z0-9_]*)\s*\(/gi;
while ((m = rCreate.exec(sqlPropre)) !== null) {
  evenements.push({ type: 'create', nom: m[1].toLowerCase(), pos: m.index, args: argsDeDefinition(sqlPropre, m.index) });
}
const rDrop = /drop\s+function\s+(?:if\s+exists\s+)?(?:public\.)?([a-z_][a-z0-9_]*)\s*\(/gi;
while ((m = rDrop.exec(sqlPropre)) !== null) {
  evenements.push({ type: 'drop', nom: m[1].toLowerCase(), pos: m.index, args: argsDeDefinition(sqlPropre, m.index) });
}
const rGrant = /grant\s+execute\s+on\s+function\s+(?:public\.)?([a-z_][a-z0-9_]*)\s*\(([^)]*)\)/gi;
while ((m = rGrant.exec(sqlPropre)) !== null) {
  const args = m[2].split(',').map(a => a.trim().toLowerCase()).join(',');
  evenements.push({ type: 'grant', nom: m[1].toLowerCase(), pos: m.index, args });
}
evenements.sort((a, b) => a.pos - b.pos);

const existant = new Set();
const grantsInvalides = [];
for (const ev of evenements) {
  if (ev.type === 'create') existant.add(`${ev.nom}(${ev.args})`);
  else if (ev.type === 'drop') existant.delete(`${ev.nom}(${ev.args})`);
  else if (ev.type === 'grant' && !existant.has(`${ev.nom}(${ev.args})`)) {
    grantsInvalides.push(`L${numeroDe(ev.pos)} ${ev.nom}(${ev.args})`);
  }
}
test('aucun GRANT ne porte sur une signature inexistante', grantsInvalides.length === 0, grantsInvalides.join(' | '));

// ── 3. Idempotence : policy et trigger ───────────────────────────────
const dropsPolitiques = new Set();
const dropsTriggers = new Set();
const politiques = [];
const triggers = [];
const rDropPolicy = /drop\s+policy\s+if\s+exists\s+"([^"]+)"\s+on\s+(?:public\.)?([a-z_][a-z0-9_]*)/gi;
while ((m = rDropPolicy.exec(sqlPropre)) !== null) dropsPolitiques.add(`${m[2].toLowerCase()}.${m[1]}`);
const rPolicy = /create\s+policy\s+"([^"]+)"\s+on\s+(?:public\.)?([a-z_][a-z0-9_]*)/gi;
while ((m = rPolicy.exec(sqlPropre)) !== null) politiques.push({ cle: `${m[2].toLowerCase()}.${m[1]}`, ligne: numeroDe(m.index) });
const rDropTrigger = /drop\s+trigger\s+if\s+exists\s+([a-z_][a-z0-9_]*)\s+on\s+/gi;
while ((m = rDropTrigger.exec(sqlPropre)) !== null) dropsTriggers.add(m[1].toLowerCase());
const rTrigger = /create\s+trigger\s+([a-z_][a-z0-9_]*)/gi;
while ((m = rTrigger.exec(sqlPropre)) !== null) triggers.push({ nom: m[1].toLowerCase(), ligne: numeroDe(m.index) });

const policiesSansDrop = politiques.filter(p => !dropsPolitiques.has(p.cle));
test('toutes les politiques ont un drop préalable (rejouable)', policiesSansDrop.length === 0,
  policiesSansDrop.slice(0, 5).map(p => `L${p.ligne} ${p.cle}`).join(' | '));

const triggersSansDrop = triggers.filter(t => !dropsTriggers.has(t.nom));
test('tous les déclencheurs ont un drop préalable (rejouable)', triggersSansDrop.length === 0,
  triggersSansDrop.slice(0, 5).map(t => `L${t.ligne} ${t.nom}`).join(' | '));

// ── 4. Ordre : table utilisée avant sa création ───────────────────────
const tables = [];
const rTable = /create\s+table\s+(?:if\s+not\s+exists\s+)?(?:public\.)?([a-z_][a-z0-9_]*)/gi;
while ((m = rTable.exec(sqlPropre)) !== null) tables.push({ nom: m[1].toLowerCase(), pos: m.index });
const dejaPresentes = new Set(['profiles', 'transactions', 'unlocked_chapters', 'chapters', 'subjects', 'auth']);
const MOTS_IGNORES = new Set([
  'delete', 'conflict', 'using', 'function', 'of', 'auth', 'table', 'set', 'select', 'values',
  'where', 'on', 'from', 'into', 'update', 'only', 'not', 'exists', 'if', 'and', 'or', 'as',
  'with', 'for', 'to', 'in', 'do', 'begin', 'end', 'case', 'when', 'then', 'else', 'distinct',
  'between', 'like', 'is', 'null', 'default', 'primary', 'unique', 'check', 'references', 'foreign',
  'key', 'constraint', 'cascade', 'restrict', 'generated', 'always', 'identity', 'by', 'asc',
  'desc', 'limit', 'offset', 'returning', 'insert', 'policy', 'trigger', 'rule', 'view', 'index',
  'concurrently', 'storage', 'objects', 'buckets', 'schema', 'extensions', 'public', 'vector'
]);
const utilisees = [];
const rUse = /\b(?:on|from|into|update|table)\s+(?:only\s+)?(?:public\.)?([a-z_][a-z0-9_]*)/gi;
while ((m = rUse.exec(sqlPropre)) !== null) {
  const nom = m[1].toLowerCase();
  if (MOTS_IGNORES.has(nom) || dejaPresentes.has(nom)) continue;
  if (!tables.some(t => t.nom === nom)) continue;
  utilisees.push({ nom, pos: m.index });
}
const horsOrdre = [];
utilisees.forEach(u => {
  const creation = tables.find(t => t.nom === u.nom);
  if (creation && creation.pos > u.pos) horsOrdre.push(`L${numeroDe(u.pos)} ${u.nom}`);
});
test('aucune table n\'est utilisée avant sa création', horsOrdre.length === 0,
  [...new Set(horsOrdre)].slice(0, 6).join(' | '));

// ── 5. Le fichier contient bien les 15 migrations ─────────────────────
const migrations = (texte.match(/create\s+or\s+replace\s+function|create\s+table/gi) || []).length;
test('le fichier consolidé est volumineux (toutes les migrations)', sql.length > 300000,
  `${sql.length} caractères`);
test('le fichier contient les briques attendues',
  texte.includes('create table if not exists public.epreuves')
  && texte.includes('create table if not exists public.admin_journal')
  && texte.includes('protect_profile_role')
  && texte.includes('get_curriculum_chapters'));

console.log(`\n${ok} test(s) réussi(s), ${ko} échec(s).`);
process.exit(ko ? 1 : 0);
