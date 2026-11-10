#!/usr/bin/env node
/**
 * Audit de provenance — Revisy.
 * Règle : la vitrine NE PUBLIE PAS de contenu « national officiel » sans
 *  une source publiée et validée par l'autorité éducative du pays.
 *
 * Exemples de codes de sortie :
 *   0 = OK (aucun contenu suspect détecté)
 *   1 = Blocage : une migration en prétend un programme national officiel
 *
 * Usage : node tools/audit-provenance.js
 */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

const problems = [];
function add(file, problem) { problems.push({ fichier: file, probleme: problem }); }

// ── 1) Aucun fichier ne doit émettre de « national_officiel » sauf marges autorisées ──
function scan() {
  const files = [];
  (function walk(dir) {
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      if (/^(node_modules|\.git|cache|epreuves|supabase)$/.test(e.name)) continue;
      if (/^(\.|\.devin|\.kiro|\.vscode)$/.test(e.name) && e.type === 'directory') continue;
      const full = path.join(dir, e.name);
      if (e.isDirectory()) { walk(full); continue; }
      if (!/\.(sql|md|js|json|html|yml|yaml)$/i.test(e.name)) continue;
      if (e.name === path.basename(__filename)) continue; // ne s'auto-référence pas
      if (e.name === 'audit-provenance.js' || e.name === 'audit-statique-securite.js') continue;
      files.push(full);
    }
  })(ROOT);
  for (const f of files) {
    let src;
    try { src = fs.readFileSync(f, 'utf8'); } catch { continue; }
    if (/national[_-]officiel/i.test(src)) add(path.relative(ROOT, f), 'contient « national_officiel » (vérifié uniquement si le fichier s\'appuie sur un document officiel explicite)');
    if (/official\s+(national\s+)?curriculum|programme\s+national\s+offic/i.test(src) && !/LISEZ-MOI\.md|DEPLOY\.md|\.md$/i.test(f)) {
      add(path.relative(ROOT, f), 'programme national officiel mentionné hors documentation');
    }
  }
}

// ── 2) contexts.js : PAYS_DISPONIBLES programme:true réservé à BJ ─────────
(function checkContexts() {
  const ctx = fs.readFileSync(path.join(ROOT, 'contexts.js'), 'utf8');
  // Recherche des entrées avec programme === true
  const lines = ctx.split('\n');
  for (const l of lines) {
    if (/programme:\s*true/.test(l) && !/BJ/.test(l)) add('contexts.js', 'pays autre que BJ déclaré « programme: true » sans preuve de source officielle : ' + l.trim().slice(0, 120));
  }
})();

// ── 3) MIGRATION_17 / MIGRATION_18 : source est strictement revizy_generic ──
for (const m of ['MIGRATION_17_seed_pays.sql', 'MIGRATION_18_programmes_offeres.sql']) {
  const f = path.join(ROOT, 'migrations', m);
  if (!fs.existsSync(f)) continue;
  const src = fs.readFileSync(f, 'utf8');
  if (/national[_-]officiel/i.test(src)) add('migrations/' + m, 'source « national_officiel » dans une migration de seed générique');
  // Chaque INSERT en ligne pour curriculum_sequences doit étiqueter source='revizy_generic' (pour MIGRATION_18)
  if (m.includes('18')) {
    const inserts = src.match(/INSERT INTO public\.curriculum_sequences[\s\S]*?ON CONFLICT DO NOTHING;?/g) || [];
    for (const ins of inserts) if (!/'revizy_generic'/.test(ins)) add('migrations/' + m, 'une insertion curriculum_sequences n’étiquette pas revizy_generic');
  }
}

// ── 4) Avant tout push, ne doit pas contenir de source national pour d'autres pays que BJ ──
const rapport = {
  outil: 'audit-provenance',
  date: new Date().toISOString(),
  total_problèmes: problems.length,
  problems,
  verdict: problems.length === 0 ? 'OK — Aucune prétention officielle non étayée détectée' : 'A_VOIR — corrigez avant déploiement',
};
console.log(JSON.stringify(rapport, null, 2));
if (problems.length) process.exit(1);
