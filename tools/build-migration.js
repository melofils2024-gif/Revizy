/**
 * tools/build-migration.js — génère MIGRATION_TOUT.sql
 * (les 14 migrations du projet, concaténées dans l'ordre, prêtes à être
 * collées en une seule fois dans le SQL Editor de Supabase).
 *
 * Usage : node tools/build-migration.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const MIGRATIONS = [
  ['schema.sql', 'profils, paiements, RLS, fonctions de base'],
  ['schema_v2.sql', 'niveaux, séries, matières, chapitres, règles de prix'],
  ['schema_curriculum.sql', 'RPC get_curriculum_topics'],
  ['seed_curriculum.sql', 'programme officiel initial (données)'],
  ['schema_get_chapters.sql', 'RPC get_curriculum_chapters (contenu riche)'],
  ['schema_programme.sql', 'table curriculum_sequences + RPC admin'],
  ['schema_programme_parts.sql', 'colonne parts (SA + chapitres)'],
  ['schema_classe.sql', 'classe/série de l\'élève + table quiz_banks'],
  ['schema_paiements.sql', 'verrouille l\'écriture des déblocages'],
  ['schema_pays.sql', 'cloisonne le contenu par pays'],
  ['schema_exercices.sql', 'colonne exercices (jsonb) sur chapters'],
  ['schema_subscriptions.sql', 'table subscriptions'],
  ['schema_cours_pays_classe.sql', 'chapter_mappings + RPC get_chapters_for_student'],
  ['schema_securite.sql', 'sécurité : contenu payant, rôle admin, écritures serveur'],
  ['schema_epreuves.sql', 'banque d\'épreuves : sujets gratuits, corrigés payants, déblocages']
];

const parties = [];
parties.push(`-- ════════════════════════════════════════════════════════════════════════════
-- REVIZY — MIGRATION COMPLÈTE
-- Généré automatiquement (tools/build-migration.js) — ne pas modifier à la main.
--
-- À exécuter UNE SEULE FOIS dans le SQL Editor de Supabase :
--   https://supabase.com/dashboard → SQL Editor → New query → coller → Run
--
-- Tout est en IF NOT EXISTS / IF NOT EXISTS sur les colonnes : la migration
-- est idempotente, on peut donc la relancer sans risque.
--
-- Ordre : ne pas le modifier (certains fichiers dépendent des précédents).
-- ════════════════════════════════════════════════════════════════════════════
`);

MIGRATIONS.forEach(([fichier, role], i) => {
  const chemin = path.join(ROOT, fichier);
  if (!fs.existsSync(chemin)) {
    console.error(`Fichier manquant : ${fichier}`);
    process.exitCode = 1;
    return;
  }
  const contenu = fs.readFileSync(chemin, 'utf8').replace(/\s+$/, '');
  parties.push(`
-- ────────────────────────────────────────────────────────────────────────────
-- ${i + 1}/${MIGRATIONS.length} — ${fichier}
-- ${role}
-- ────────────────────────────────────────────────────────────────────────────
${contenu}
`);
});

const sortie = path.join(ROOT, 'MIGRATION_TOUT.sql');
fs.writeFileSync(sortie, parties.join('\n'), 'utf8');
const octets = fs.statSync(sortie).size;
console.log(`MIGRATION_TOUT.sql généré (${MIGRATIONS.length} migrations, ${Math.round(octets / 1024)} Ko)`);
