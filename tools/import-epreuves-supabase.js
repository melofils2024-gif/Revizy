#!/usr/bin/env node
/**
 * Revizy — Import d'épreuves (sujets ou corrigés) dans public.epreuves.
 *
 * Usage :
 *   node tools/import-epreuves-supabase.js --file tools/epreuves.rows.json [--dry-run] [--limit N] [--upload]
 *
 * Entrée JSON (tableau d'objets) :
 *   [
 *     { "pays":"BJ","niveau":"bac","annee":2023,"matiere":"Mathématiques",
 *       "type":"sujet","titre":"BAC BJ 2023 - Mathématiques Sujet",
 *       "fichier_url":"https://sources.official.example/subject.pdf",  // externe, jamais recopie
 *       "fichier_nom":"bj-bac-2023-maths-sujet.pdf",
 *       "classe":"Tle","serie":"C","format":"pdf","source_nom":"Revizy — exemple",
 *       "source_url":"https://...","licence":"Document original Revizy","is_free":true,"price":0 }
 *   ]
 *
 * Règles :
 *  · fichier_url démarre par http(s):// → lien externe (canalisé via serveur), jamais recopie     
 *  · fichier_url démarre par supabase: → référence existante dans le bucket « epreuves »            
 *  · chemin local avec --upload → le fichier est poussé dans le bucket Supabase « epreuves » et la 
 *    fiche indique supabase:<path>.
 *  · source_url + licence obligatoires (conformité du contenu).
 *  · Idempotent : slug unique inséré avec PUT on_conflict DO NOTHING.
 *  · Aucun scraping automatique : la collecte reste manuelle (validation humaine).
 */
const fs = require('fs');
const path = require('path');
const url = require('url');

const args = process.argv.slice(2);
function arg(name, def){ const i = args.indexOf('--'+name); if (i === -1) return def; return args[i+1] ?? def; }
const DRY = args.includes('--dry-run');
const UPLOAD = args.includes('--upload');
const LIMIT = parseInt(arg('limit','9999'),10);
const FILE = arg('file', null);
if (!FILE) { console.error('Usage: node tools/import-epreuves-supabase.js --file <rows.json> [--dry-run] [--limit N] [--upload]'); process.exit(2); }

require('dotenv').config();
const SUPA = (process.env.SUPABASE_URL || process.env.SUPABASE_URL_DEFAULT || '').replace(/\/$/,'');
const KEY  = (process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || '');
if (!SUPA || !KEY) { console.error('SUPABASE_URL / SUPABASE_SERVICE_KEY manquants (.env)'); process.exit(3); }

const ALLOWED = ['pdf','docx','zip','png','jpg','jpeg'];
const PAYS = new Set(JSON.parse(fs.readFileSync(path.join(__dirname,'..','contexts.js'),'utf8').match(/const PAYS_DISPONIBLES = [\s\S]*?\n  \];/)[0].replace(/const PAYS_DISPONIBLES = /,'').replace(/;\s*$/,'') + ']').map(p => p.code));

async function supabase(pathname, opts = {}) {
  const r = await fetch(`${SUPA}${pathname}`, { ...opts, headers: { 'Accept':'application/json','apikey':KEY,'Authorization':`Bearer ${KEY}`, ...opts.headers } });
  const text = await r.text();
  let body = null; try { body = text ? JSON.parse(text) : null; } catch (e) { body = text; }
  return { ok: r.ok, status: r.status, body };
}

async function uploadLocal(localPath, objectName) {
  const buff = fs.readFileSync(localPath);
  const bucket = 'epreuves';
  const r = await fetch(`${SUPA}/storage/v1/object/${bucket}/${encodeURIComponent(objectName)}`, { method: 'POST', headers: { 'Content-Type': 'application/octet-stream','apikey':KEY,'Authorization':`Bearer ${KEY}` }, body: buff });
  const text = await r.text();
  if (!r.ok) throw new Error(`Storage upload ${objectName}: HTTP ${r.status} ${text.slice(0,200)}`);
}

async function main() {
  let rows = JSON.parse(fs.readFileSync(FILE, 'utf8'));
  if (!Array.isArray(rows)) throw new Error('Le fichier doit être un tableau JSON');
  rows = rows.slice(0, LIMIT);
  const report = { inserted: 0, skipped: 0, uploaded: 0, errors: [] };
  for (const row of rows) {
    const clean = { ...row };
    clean.pays = String(clean.pays || '').toUpperCase();
    if (!PAYS.has(clean.pays)) { report.errors.push(`${clean.pays}: pays non offert (PAYS_DISPONIBLES)`); continue; }
    if (!clean.source_url || !clean.licence) { report.errors.push(`${clean.titre || clean.slug||'?'}: source_url et licence obligatoires`); continue; }
    if (!clean.slug) {
      const lu = (clean.niveau||'bac').toString(), z = (clean.annee||'').toString(), m = (clean.matiere||'mat').toString().toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
      clean.slug = [clean.pays.toLowerCase(), lu, z, m, clean.type||'sujet'].join('-');
    }
    let fichier_url = clean.fichier_url || '';
    if (!fichier_url) { report.errors.push(`${clean.slug}: fichier_url manquant`); continue; }
    const local = fs.existsSync(path.resolve(fichier_url)) ? path.resolve(fichier_url) : null;
    if (local && UPLOAD) {
      try { await uploadLocal(local, clean.slug + path.extname(local)); clean.fichier_url = `supabase:${bucketObjName(clean.slug, path.extname(local))}`; report.uploaded++; }
      catch (e) { report.errors.push(String(e.message)); continue; }
    } else if (local && !UPLOAD) { report.errors.push(`${clean.slug}: fichier local + --upload obligatoire pour migration buket`); continue; }
    const ext = (clean.format || (clean.fichier_url||'').split('.').pop() || 'pdf').toLowerCase().replace(/[^a-z0-9].*$/,'');
    if (!ALLOWED.includes(ext)) { report.errors.push(`${clean.slug}: format non autorisé ${ext}`); continue; }
    clean.format = ext;
    clean.niveau = String(clean.niveau || 'bac').toLowerCase();
    clean.type = String(clean.type || 'sujet').toLowerCase();
    clean.is_free = Boolean(clean.is_free ?? clean.type === 'sujet');
    clean.price = Number(clean.price ?? 0) || 0;
    if (DRY) { report.inserted++; console.log('[dry-run] would upsert', clean.slug, '->', clean.source_url); continue; }
    const body = {
      slug: clean.slug, pays: clean.pays, niveau: clean.niveau, annee: clean.annee ?? null, matiere: clean.matiere || 'Mathématiques', type: clean.type,
      titre: clean.titre || clean.slug, description: clean.description || null,
      fichier_url: clean.fichier_url, fichier_nom: clean.fichier_nom || null,
      classe: clean.classe || null, serie: clean.serie || null,
      format: clean.format, pages: clean.pages || null,
      source_nom: clean.source_nom || null, source_url: clean.source_url, licence: clean.licence,
      is_free: clean.is_free, price: clean.price, published: true
    };
    const r = await supabase('/rest/v1/epreuves?on_conflict=slug', { method: 'POST', headers: { 'Content-Type':'application/json','Prefer':'return=representation' }, body: JSON.stringify(body) });
    if (r.ok) report.inserted++; else { report.errors.push(`${clean.slug}: ${r.status} ${JSON.stringify(r.body).slice(0,300)}`); }
  }
  console.log(JSON.stringify({ dryRun: DRY, inserted: report.inserted, uploaded: report.uploaded, skipped: rows.length - report.inserted - report.errors.length, errors: report.errors.slice(0,20) }, null, 2));
}

function bucketObjName(slug, ext) { return `${slug}${ext}`; }
main().catch(e => { console.error(e); process.exit(1); });
