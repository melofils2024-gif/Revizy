/**
 * tools/build-migration-p0.js — génère migrations/P0_FERMER_LA_PORTE.sql
 *
 * Priorité 0 : ce qu'il faut coller MAINTENANT pour fermer la porte.
 *   1. schema.sql          → fonction d'inscription corrigée (le rôle n'est
 *                             plus lu dans les métadonnées du navigateur)
 *   2. schema_securite.sql → déclencheur de protection du rôle, droits de
 *                             colonne limités, journal, RLS resserrée
 *
 * Les deux fichiers sont idempotents et vérifient l'existence des objets
 * avant d'y toucher : on peut les réexécuter sans risque, et les coller
 * avant le reste de la migration.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DOSSIER = path.join(ROOT, 'migrations');
if (!fs.existsSync(DOSSIER)) fs.mkdirSync(DOSSIER, { recursive: true });

const entete = `-- ════════════════════════════════════════════════════════════════════════════
-- REVIZY — PRIORITÉ 0 : FERMER LA PORTE
-- Généré par tools/build-migration-p0.js — ne pas modifier à la main.
--
-- À coller dans le SQL Editor de Supabase (une seule fois, d'un bloc) :
--   https://supabase.com/dashboard → SQL Editor → New query → coller → Run
--
-- Ce que ça change, tout de suite :
--   1. la fonction d'inscription ne lit PLUS le rôle dans les métadonnées
--      envoyées par le navigateur → plus d'auto-promotion en « admin » ;
--   2. un déclencheur annule toute écriture du rôle par un élève ;
--   3. l'élève ne peut plus modifier la table « profiles » en entier :
--      seuls son nom, son e-mail, son niveau, sa classe, sa série et son
--      pays restent modifiables ;
--   4. les écritures sur les déblocages et les transactions passent par le
--      serveur ;
--   5. le journal des actions d'administration (admin_journal) est créé.
--
-- Les deux fichiers sont idempotents (IF NOT EXISTS / IF EXISTS) : les
-- réexécuter ne casse rien.
--
-- ────────────────────────────────────────────────────────────────────────────
-- Après cette étape, la suite de la migration se fait en 15 morceaux
-- numérotés : voir migrations/LISEZ-MOI.md
-- ════════════════════════════════════════════════════════════════════════════

`;

const morceaux = ['schema.sql', 'schema_securite.sql'];
let sortie = entete;
morceaux.forEach(f => {
  sortie += `\n\n-- ────────────────────────────────────────────────────────────────────────────\n-- ${f}\n-- ────────────────────────────────────────────────────────────────────────────\n\n`;
  sortie += fs.readFileSync(path.join(ROOT, f), 'utf8');
});

const nom = path.join(DOSSIER, 'P0_FERMER_LA_PORTE.sql');
fs.writeFileSync(nom, sortie, 'utf8');
console.log(`P0 généré : ${nom} (${Math.round(Buffer.byteLength(sortie, 'utf8') / 1024)} Ko, ${morceaux.join(' + ')})`);
