#!/usr/bin/env node
/**
 * Génère MIGRATION_18_programmes_offeres.sql — extension de MIGRATION_17
 * à TOUS les pays africains, européens et américains offerts par Revisy.
 *
 * Contrairement à MIGRATION_17 (clone pays par pays avec offsets humains),
 * ce script parcourt PAYS_DISPONIBLES de ./contexts.js. Chaque pays est
 * cloné à partir du Bénin avec un offset numérique distinct et unique
 * (+200000, +300000, +400000 …), en l'étiquetant source='revizy_generic'.
 * AUCUN programme national officiel n'est inventé.
 *
 * Usage : node tools/build-migration-offeres.js                       # par défaut tous les pays offerts
 *         node tools/build-migration-offeres.js --exclude=TG,CI,SN   # pays à exclure
 *         node tools/build-migration-offeres.js --include=MA,DZ      # pays à inclure seulement
 */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const contextsPath = path.join(ROOT, 'contexts.js');
const src = fs.readFileSync(contextsPath, 'utf8');

// Récupérer les codes pays offerts depuis PAYS_DISPONIBLES.
const m = src.match(/const PAYS_DISPONIBLES = \[([\s\S]*?)\];/);
if (!m) { console.error('PAYS_DISPONIBLES introuvable dans contexts.js'); process.exit(1); }
const entries = m[1].match(/\{ code: '([^']+)'/g) || [];
const codes = entries.map(e => e.match(/code: '([^']+)'/)[1]);
if (codes.length < 40) { console.error('Extraction suspecte (<40 pays).'); process.exit(1); }

// Exclure le Bénin (source) + les pays déjà traités par MIGRATION_17.
const EXCLUDE = new Set(['BJ', 'TG', 'CI', 'SN']);
for (const arg of process.argv.slice(2)) {
  const [k, v] = arg.split('=');
  if (k === '--exclude') v.split(',').forEach(x => EXCLUDE.add(x.trim().toUpperCase()));
  if (k === '--include') { const incl = v.split(',').map(x => x.trim().toUpperCase()); for (const c of [...EXCLUDE]) if (!incl.includes(c)) EXCLUDE.delete(c); }
}
const COUNTRIES = codes.filter(c => !EXCLUDE.has(c));
console.log('Pays traités :', COUNTRIES.length, COUNTRIES.slice(0, 12).join(', '), '…');

const args = process.argv.includes('--realtime');
const out = [];
out.push('-- ==========================================================================');
out.push('-- Revisy — MIGRATION_18_programmes_offeres.sql');
out.push('-- ==========================================================================');
out.push('-- Objectif : cloner le modèle générique de révision (issu du Bénin et déjà');
out.push('-- appliqué pour TG/CI/SN avec MIGRATION_17) dans tous les pays Africain,');
out.push('-- Européen et Américain proposé par Revisy (contexts.js → PAYS_DISPONIBLES).');
out.push('-- En utilisant p_pays dans toute la base, sélectionner son pays charge donc');
out.push('-- automatiquement les matières, chapitres et séquences de son programme.');
out.push('');
out.push('-- ATTENTION HONNÊTETÉ : la source de chaque clone est « revizy_generic ».');
out.push('-- Il ne s agit PAS du programme officiel national authentique de ces pays.');
out.push('-- Administrer « Programme officiel <PAYS> » dans Supabase (après validation');
out.push('-- avec les établissements concernés) reste la voie propre.');
out.push('');
out.push('-- Idempotent. Transactionnel. À ajouter à migrations/LISEZ-MOI.md après');
out.push('-- MIGRATION_17_seed_pays.sql.');
out.push('-- ==========================================================================');
out.push('BEGIN;');

// Calcul de l’offset numérique par pays : départ 200000, incrément de 100000.
const OFFSET = {};
COUNTRIES.forEach((c, i) => { OFFSET[c] = 200000 + (i + 1) * 100000; });

for (const c of COUNTRIES) {
  out.push('');
  out.push('-- ' + c);
  out.push('-- Matières');
  out.push("INSERT INTO public.subjects (pays, code, name, icon, description, niveau_code, serie_code, display_order, published)");
  out.push("SELECT '" + c + "'::text, code, name, icon, coalesce(description, ''), niveau_code, serie_code, display_order, true");
  out.push("FROM public.subjects WHERE pays='BJ' ON CONFLICT (pays, niveau_code, serie_code, code) DO NOTHING;");

  out.push('-- Chapitres (offset ' + OFFSET[c] + ' sur le BJ)');
  out.push('CREATE TEMP TABLE __map_' + c.replace('-', '_') + ' ON COMMIT DROP AS');
  out.push('  SELECT sNew.id AS new_id, sBJ.id AS old_id');
  out.push('  FROM public.subjects sNew');
  out.push('  JOIN public.subjects sBJ');
  out.push("    ON sNew.code = sBJ.code AND sNew.niveau_code = sBJ.niveau_code");
  out.push("     AND coalesce(sNew.serie_code, '') = coalesce(sBJ.serie_code, '')");
  out.push(" WHERE sNew.pays='" + c + "';");
  out.push('INSERT INTO public.chapters (subject_id, pays, slug, num, title, sa_label, classe, pdf_url,');
  out.push('  is_free, price, cours, exemple_titre, exemple_enonce, exemple_solution,');
  out.push('  exercice_consigne, exercice_question, exercice_type, exercice_options, correct_option, explication, published)');
  out.push('SELECT m.new_id, \'' + c + '\'::text,');
  out.push("       c.slug || '~' || lower('" + c + "'),");
  out.push('       c.num + ' + OFFSET[c] + ',');
  out.push('       c.title, c.sa_label, c.classe, c.pdf_url, c.is_free, c.price, c.cours,');
  out.push('       c.exemple_titre, c.exemple_enonce, c.exemple_solution,');
  out.push('       c.exercice_consigne, c.exercice_question, c.exercice_type,');
  out.push('       c.exercice_options, c.correct_option, c.explication,');
  out.push('       coalesce(c.published, true)');
  out.push('  FROM public.chapters c JOIN __map_' + c.replace('-', '_') + ' m ON m.old_id = c.subject_id');
  out.push(" WHERE c.pays='BJ';");
  out.push('DROP TABLE __map_' + c.replace('-', '_') + ';');

  out.push('-- Séquences (Revisy-générique, pas de provenance nationale officieuse)');
  out.push('INSERT INTO public.curriculum_sequences (pays, niveau_code, serie_code, subject_name, sequences, source, updated_at)');
  out.push('SELECT \'' + c + '\'::text, s.niveau_code, s.serie_code, s.subject_name, s.sequences,');
  out.push("       'revizy_generic', now()");
  out.push('FROM public.curriculum_sequences s');
  out.push(" WHERE s.pays='BJ'");
  out.push('ON CONFLICT DO NOTHING;');
}

out.push('');
out.push('COMMIT;');
out.push('');
out.push("-- Introducteurs/personnes qui veulent le programme officiel national authentic de leur pays :");
out.push("-- voir docs/programme/, DEPLOY.md « Programme officiel par pays », et le fichier");
out.push('-- MIGRATION_04_seed_curriculum.sql (modèle Bénin, référence).');
out.push('-- Fin MIGRATION_18_programmes_offeres.');

const outFile = path.join(ROOT, 'migrations', 'MIGRATION_18_programmes_offeres.sql');
fs.writeFileSync(outFile, out.join('\n'));
console.log('Généré :', outFile, ' (', COUNTRIES.length, 'pays )');
console.log('Les offsets numériques garantissent unique(subject_id, num) sans collisions.');
console.log('Chaque clone est étiqueté source=revizy_generic dans curriculum_sequences.');
