# Migration v2 — Programme béninois en base

## 🎯 Objectif
Remplacer tous les hardcodes (matières, chapitres, prix) par une base Supabase propre,
appliquer la règle **3 premiers chapitres gratuits / 150 FCFA (BAC) / 100 FCFA (Brevet)**.

## ⚠️ Caractère additif
**Aucune modification des tables existantes** (`profiles`, `unlocked_chapters`, `transactions`).
On ajoute 5 nouvelles tables + 4 RPC + triggers + RLS.

## 📦 Fichiers livrés

| Fichier | Rôle |
|---|---|
| `schema_v2.sql` | DDL : nouvelles tables, triggers, RPC, RLS |
| `seed_curriculum.sql` | DML : injection des 40 matières + 182 chapitres |
| `tools/generate-seed.js` | Générateur Node du seed (reproductible) |

## 🚀 Application (3 minutes)

1. Ouvre https://supabase.com/dashboard → ton projet
2. **SQL Editor → New query**
3. Copie-colle le contenu de `schema_v2.sql` → **Run**
   - Tu dois voir : `Success. No rows returned` (DDL ne renvoie pas de lignes)
   - En cas d'erreur : la migration est idempotente, relance sans risque
4. Copie-colle le contenu de `seed_curriculum.sql` → **Run**
   - Tu dois voir : `Success. 182 rows inserted` (approx)
   - En cas d'erreur partielle : tout est dans une transaction `begin/commit`,
     donc soit tout passe, soit rien ne passe
5. Vérifie dans **Table Editor** :
   - Table `niveaux` → 2 lignes (bac, brevet)
   - Table `series` → 5 lignes
   - Table `subjects` → 40 lignes
   - Table `chapters` → 182 lignes
   - Champ `is_free` = true sur les 3 premiers chapitres de chaque matière ✅
   - Champ `price` = 150/100 sur les chapitres suivants ✅

## 🔍 Vérifications rapides (SQL Editor)

```sql
-- Compter par niveau
select n.label, count(*) as chapitres
from chapters c
join subjects s on s.id = c.subject_id
join niveaux n on n.code = s.niveau_code
group by n.label;

-- Vérifier la gratuité des 3 premiers
select s.name, c.num, c.is_free, c.price
from chapters c
join subjects s on s.id = c.subject_id
where s.code = 'mathematiques' and s.serie_code = 'C'
order by c.num;

-- Tester une RPC publique
select * from list_subjects('bac', 'C');
```

## 📋 Après application

Le frontend actuel (`app.js`) **continue de fonctionner** car aucune table existante
n'est modifiée. Pour activer le nouveau modèle :

1. Refactor `app.js` pour appeler `list_subjects()` / `list_chapters_for_student()` /
   `get_chapter_content()` (Phase 3 du plan)
2. Brancher la recherche globale (la barre existe déjà, elle est vide)
3. Câbler l'onglet QCM dynamique sur le pool de chapitres débloqués

## 🔙 Rollback

Si tu veux tout annuler (peu probable, mais au cas où) :
```sql
drop table if exists public.chapters cascade;
drop table if exists public.subjects cascade;
drop table if exists public.series cascade;
drop table if exists public.niveaux cascade;
drop table if exists public.pricing_rules cascade;
drop function if exists public.trg_compute_chapter_pricing();
drop function if exists public.list_subjects(text, text);
drop function if exists public.list_chapters_for_student(uuid);
drop function if exists public.get_chapter_content(uuid);
drop function if exists public.get_admin_stats();
```

Les tables d'origine (`profiles`, `unlocked_chapters`, `transactions`) restent intactes.
