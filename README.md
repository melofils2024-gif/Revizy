# Revizy

Site de révision Brevet & BAC (Bénin).

## Déploiement

Voir **DEPLOY.md** pour Render + Supabase.

## Config locale

1. Exécute `MIGRATION_TOUT.sql` (toutes les migrations, en un seul copier-coller)
   dans le SQL Editor Supabase
2. Remplis `config.js` avec Project URL + anon key
3. Ouvre le site (serveur local ou Render)

## Épreuves d'examen

Sujets gratuits + corrigés payants : voir la section « Banque d'épreuves »
de **DEPLOY.md**. Import d'un lot d'épreuves :

```bash
node tools/import-epreuves.js epreuves/sources.json --dry-run  # contrôle
node tools/import-epreuves.js epreuves/sources.json             # import en base
```
