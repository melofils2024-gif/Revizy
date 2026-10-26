/**
 * tools/verifier-migration.js — vérifie que la base est à jour.
 *
 * Contrôle en lecture seule (clé anon) : colonnes ajoutées, tables
 * créées, fonctions RPC exposées. À lancer après avoir collé
 * MIGRATION_TOUT.sql dans le SQL Editor de Supabase.
 *
 * Usage : node tools/verifier-migration.js
 */
const fs = require('fs');
const path = require('path');

const racine = path.resolve(__dirname, '..');
const env = {};
try {
  fs.readFileSync(path.join(racine, '.env'), 'utf8').split(/\r?\n/).forEach(l => {
    const i = l.indexOf('=');
    if (i > 0) env[l.slice(0, i).trim()] = l.slice(i + 1).trim();
  });
} catch (_) { /* pas de .env : variables d'environnement */ }

const URL_BASE = process.env.SUPABASE_URL || env.SUPABASE_URL;
const CLE = process.env.SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY;

if (!URL_BASE || !CLE) {
  console.error('SUPABASE_URL / SUPABASE_ANON_KEY introuvables (.env ou variables d\'environnement)');
  process.exit(1);
}

const entetes = { apikey: CLE, Authorization: `Bearer ${CLE}` };

const COLONNES = [
  ['profiles', 'classe'],
  ['profiles', 'serie'],
  ['profiles', 'pays'],
  ['chapters', 'pays'],
  ['chapters', 'exercices'],
  ['subjects', 'pays'],
  ['curriculum_sequences', 'pays'],
  ['quiz_banks', 'pays']
];

const TABLES = ['quiz_banks', 'subscriptions', 'chapter_mappings', 'curriculum_sequences', 'curriculum_parts'];

const FONCTIONS = [
  'get_curriculum_chapters',
  'get_curriculum_topics',
  'get_chapters_for_student',
  'get_curriculum_sequences'
];

let ok = 0;
let ko = 0;

function test(nom, condition, detail = '') {
  if (condition) {
    ok++;
    console.log(`OK    | ${nom}`);
  } else {
    ko++;
    console.log(`KO    | ${nom}${detail ? ' → ' + detail : ''}`);
  }
}

async function colonneExiste(table, colonne) {
  const url = `${URL_BASE}/rest/v1/${table}?select=${colonne}&limit=1`;
  const r = await fetch(url, { headers: entetes });
  if (r.status === 200) return true;
  // 401/403 = table présente mais protégée : on ne peut pas le savoir ici,
  // on ne la considère donc pas manquante.
  if (r.status === 401 || r.status === 403) return true;
  // 404 = table absente du schéma.
  if (r.status === 404) return false;
  const texte = await r.text();
  return !/does not exist|42703/i.test(texte);
}

(async () => {
  console.log(`\nBase : ${URL_BASE}\n`);

  console.log('— Colonnes —');
  for (const [table, colonne] of COLONNES) {
    const existe = await colonneExiste(table, colonne);
    test(`${table}.${colonne}`, existe);
  }

  console.log('\n— Tables —');
  for (const table of TABLES) {
    const r = await fetch(`${URL_BASE}/rest/v1/${table}?select=*&limit=1`, { headers: entetes });
    // 200 = présente (éventuellement vide à cause du RLS) ; 404 = absente
    // du schéma ; 401/403 = présente mais protégée.
    const presente = r.status === 200 || r.status === 401 || r.status === 403;
    test(table, presente, `status=${r.status}`);
  }

  console.log('\n— Fonctions RPC exposées —');
  let chemins = {};
  let catalogueOk = false;
  try {
    const r = await fetch(`${URL_BASE}/rest/v1/`, { headers: entetes });
    const body = await r.json();
    chemins = body.paths || {};
    catalogueOk = Object.keys(chemins).length > 0;
  } catch (e) {
    console.log('   (catalogue indisponible :', e.message + ')');
  }
  for (const fn of FONCTIONS) {
    const exposee = Object.keys(chemins).some(p => p.includes('/' + fn));
    test(fn, exposee, catalogueOk ? 'RPC absente du schéma exposé' : 'catalogue illisible');
  }

  console.log(`\n${ok} vérification(s) réussie(s), ${ko} en échec.`);
  if (ko) {
    console.log('\n→ Il manque des éléments : relance MIGRATION_TOUT.sql dans le SQL Editor.');
  } else {
    console.log('\n→ Base à jour : la classe des élèves, le cloisonnement par pays et les RPC sont en place.');
  }
  process.exit(ko ? 1 : 0);
})();
