/**
 * tools/build-migration-chunks.js — découpe MIGRATION_TOUT.sql en 15 fichiers
 * numérotés, un par migration source.
 *
 * Pourquoi : le SQL Editor exécute le script dans UNE transaction. Si une
 * seule instruction est invalide, TOUT est annulé et on ne sait pas où ça a
 * cassé. En collant les 15 morceaux un par un, on sait exactement lequel
 * échoue — et les suivants restent applicables.
 *
 * Usage : node tools/build-migration-chunks.js
 */
const fs = require('fs');
const path = require('path');
const { normaliserLF } = require('./lib/lf');

const ROOT = path.resolve(__dirname, '..');
const DOSSIER = path.join(ROOT, 'migrations');

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

if (!fs.existsSync(DOSSIER)) fs.mkdirSync(DOSSIER, { recursive: true });

const lignes = [];
lignes.push(`# Migration Revizy — mode d'emploi

Le SQL Editor de Supabase exécute le script **dans une seule transaction** :
si une instruction est invalide, *tout* est annulé et l'erreur affiche la
ligne fautive — mais on ne peut pas savoir quel fichier l'a produite.

La parade : coller les **15 morceaux un par un**, dans l'ordre.

## Comment faire

1. Supabase → **SQL Editor** → **New query**.
2. Ouvrez le morceau \`migrations/MIGRATION_01_schema.sql\` (fichier du dépôt,
   ou le texte fourni dans le chat), collez-le, **Run**.
3. Si c'est vert : passez au suivant (02, 03…). Chaque morceau est idempotent :
   le réexécuter ne casse rien.
4. Si c'est **rouge** : notez le **numéro** du morceau et le message d'erreur,
   envoyez-le, on corrige ce fichier-là et on continue.
5. À la fin, vérifiez :

\`\`\`bash
node tools/verifier-migration.js   # doit afficher 17/17
\`\`\`

## Ordre des morceaux

| # | Fichier | Ce qu'il apporte |
|---|---------|------------------|
`);

const fichiers = [];
MIGRATIONS.forEach(([fichier, resume], i) => {
  const num = String(i + 1).padStart(2, '0');
  const contenu = normaliserLF(fs.readFileSync(path.join(ROOT, fichier), 'utf8'));
  const nom = `MIGRATION_${num}_${fichier.replace(/\.sql$/, '')}.sql`;
  fs.writeFileSync(path.join(DOSSIER, nom), contenu, 'utf8');
  fichiers.push(nom);
  lignes.push(`| ${num} | \`${nom}\` | ${resume} |`);
});

lignes.push(`
## Si vous préférez tout d'un coup

\`MIGRATION_TOUT.sql\` (387 Ko) contient les 15 morceaux concaténés dans
l'ordre. C'est pratique, mais en cas d'échec on ne sait pas d'où vient
l'erreur. Les morceaux sont préférables.

## Outillage

- \`node tools/verifier-migration.js\` — état de la base (17 contrôles).
- \`node tools/test-migration-sql.js\` — contrôles statiques sur le SQL
  (déclencheurs, index, cibles ON CONFLICT, cohérence colonnes/valeurs).
`);

fs.writeFileSync(path.join(DOSSIER, 'LISEZ-MOI.md'), lignes.join('\n'), 'utf8');

console.log(`${fichiers.length} morceaux générés dans migrations/`);
fichiers.forEach(f => console.log('  ' + f));
