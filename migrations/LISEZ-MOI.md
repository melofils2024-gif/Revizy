# Migration Revisy — mode d'emploi

Le SQL Editor de Supabase exécute le script **dans une seule transaction** :
si une instruction est invalide, *tout* est annulé et l'erreur affiche la
ligne fautive — mais on ne peut pas savoir quel fichier l'a produite.

La parade : coller les **16 morceaux un par un**, dans l'ordre.

## Comment faire

1. Supabase → **SQL Editor** → **New query**.
2. Ouvrez le morceau `migrations/MIGRATION_01_schema.sql` (fichier du dépôt,
   ou le texte fourni dans le chat), collez-le, **Run**.
3. Si c'est vert : passez au suivant (02, 03…). Chaque morceau est idempotent :
   le réexécuter ne casse rien.
4. Si c'est **rouge** : notez le **numéro** du morceau et le message d'erreur,
   envoyez-le, on corrige ce fichier-là et on continue.
5. À la fin, vérifiez :

```bash
node tools/verifier-migration.js   # doit afficher 25/25
```

## Ordre des morceaux

| # | Fichier | Ce qu'il apporte |
|---|---------|------------------|

| 01 | `MIGRATION_01_schema.sql` | profils, paiements, RLS, fonctions de base |
| 02 | `MIGRATION_02_schema_v2.sql` | niveaux, séries, matières, chapitres, règles de prix |
| 03 | `MIGRATION_03_schema_curriculum.sql` | RPC get_curriculum_topics |
| 04 | `MIGRATION_04_seed_curriculum.sql` | programme officiel initial (données) |
| 05 | `MIGRATION_05_schema_get_chapters.sql` | RPC get_curriculum_chapters (contenu riche) |
| 06 | `MIGRATION_06_schema_programme.sql` | table curriculum_sequences + RPC admin |
| 07 | `MIGRATION_07_schema_programme_parts.sql` | colonne parts (SA + chapitres) |
| 08 | `MIGRATION_08_schema_classe.sql` | classe/série de l'élève + table quiz_banks |
| 09 | `MIGRATION_09_schema_paiements.sql` | verrouille l'écriture des déblocages |
| 10 | `MIGRATION_10_schema_pays.sql` | cloisonne le contenu par pays |
| 11 | `MIGRATION_11_schema_exercices.sql` | colonne exercices (jsonb) sur chapters |
| 12 | `MIGRATION_12_schema_subscriptions.sql` | table subscriptions |
| 13 | `MIGRATION_13_schema_cours_pays_classe.sql` | chapter_mappings + RPC get_chapters_for_student |
| 14 | `MIGRATION_14_schema_securite.sql` | sécurité : contenu payant, rôle admin, écritures serveur |
| 15 | `MIGRATION_15_schema_epreuves.sql` | banque d'épreuves : sujets gratuits, corrigés payants, déblocages |
| 16 | `MIGRATION_16_schema_securite_bouclier.sql` | bouclier : journal d'audit, blocage, fermeture des privilèges |
| 17 | `MIGRATION_17_seed_pays.sql` | programmes partagés TG/CI/SN (clone depuis BJ) — automatique à la lecture par pays |
| 18 | `MIGRATION_18_programmes_offeres.sql` | modèle générique appliqué à tous les pays Afrique/Europe/Amérique proposés — source='revizy_generic' (jamais national officiel légitimement attribuable) |

## Si vous préférez tout d'un coup

`MIGRATION_TOUT.sql` (404 Ko) contient les 16 morceaux concaténés dans
l'ordre. C'est pratique, mais en cas d'échec on ne sait pas d'où vient
l'erreur. Les morceaux sont préférables.

## Outillage

- `node tools/verifier-migration.js` — état de la base (25 contrôles).
- `node tools/test-migration-sql.js` — contrôles statiques sur le SQL
  (déclencheurs, index, cibles ON CONFLICT, cohérence colonnes/valeurs).
- `node tools/audit-provenance.js` — conformité (aucune source `national_officiel` non appuyée par docs),
  Vérifie que les seuls seeds TG/CI/SN et 62 autres pays sont `revizy_generic`.
- `node tools/audit-statique-securite.js` — fuite de secrets avant déploiement.
