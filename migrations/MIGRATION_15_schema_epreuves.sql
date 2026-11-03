-- ============================================================
-- Revizy — schema_epreuves.sql
-- Banque d'épreuves (sujets d'examen) et de corrigés.
-- À exécuter APRÈS schema_securite.sql (il ne le contredit pas :
-- il ne touche ni aux chapitres ni aux politiques de déblocage).
-- Script idempotent : il peut être relancé sans risque.
--
-- Principe :
--   - le SUJET (l'épreuve) est gratuit : il attire le trafic ;
--   - le CORRIGÉ est payant : c'est la valeur monétisée ;
--   - les fichiers ne sont jamais exposés en direct : c'est le serveur
--     qui vérifie les droits de l'élève puis délivre un lien signé.
--
-- Rigueur du corrigé : la correction d'un corrigé payant vit dans une
-- table à part (epreuve_corrections), lisible par le serveur seul. Elle
-- n'est exposée à l'élève qu'après paiement, et sa publication est bloquée
-- tant qu'elle n'est pas validée (solution rédigée + barème + validation
-- humaine). C'est ce qui rend le prix justifiable.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Table des épreuves
-- ------------------------------------------------------------
create table if not exists public.epreuves (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique,
  pays          text not null default 'BJ',
  niveau        text not null default 'bac',
  annee         integer,
  matiere       text not null default 'Mathématiques',
  type          text not null default 'sujet',
  titre         text not null,
  description   text,
  -- Origine du fichier :
  --   http(s)://…  -> lien externe (source officielle), servi après contrôle
  --   supabase:…   -> objet du bucket « epreuves » (lien signé par le serveur)
  --   sinon        -> nom de fichier dans le dossier local « epreuves/ »
  fichier_url   text not null,
  fichier_nom   text,
  -- Format du document : pdf, docx, zip, png… (déduit de l'extension si vide).
  format        text not null default 'pdf',
  pages         integer,
  -- Ciblage scolaire (facultatif) : pour proposer la bonne épreuve
  -- à l'élève selon sa classe et sa série.
  classe        text,
  serie         text,
  -- Traçabilité : chaque document indique d'où il vient et sous quelle
  -- licence il est repris (obligatoire pour tout contenu réutilisé).
  source_nom    text,
  source_url    text,
  licence       text,
  is_free       boolean not null default true,
  price         integer not null default 0,
  published     boolean not null default true,
  created_at    timestamptz default now(),
  -- Dernière mise à jour de la fiche (actualisation d'une campagne).
  updated_at    timestamptz default now()
);

create index if not exists epreuves_pays_niveau_annee
  on public.epreuves (pays, niveau, annee desc);
create index if not exists epreuves_matiere
  on public.epreuves (matiere);
create index if not exists epreuves_classe_serie
  on public.epreuves (classe, serie);

-- Colonnes ajoutées après la première version (idempotent).
alter table public.epreuves add column if not exists format text not null default 'pdf';
alter table public.epreuves add column if not exists classe text;
alter table public.epreuves add column if not exists serie text;

-- ------------------------------------------------------------
-- 2. Corrections des corrigés (table séparée = secret well kept)
--
-- Elle n'est PAS lisible par l'élève : le serveur la joint à la
-- catalogue et n'en expose le contenu qu'à l'élève ayant payé.
-- Un corrigé payant ne peut pas être publié sans validation.
-- ------------------------------------------------------------
create table if not exists public.epreuve_corrections (
  epreuve_id uuid primary key references public.epreuves(id) on delete cascade,
  -- Solution rédigée, détaillée, conforme au barème.
  solution   text,
  -- Barème total (points) : ce que l'élève doit retrouver dans la correction.
  bareme     integer,
  -- Difficulté annoncée : facile | moyen | difficile.
  difficulte text not null default 'moyen',
  -- Validation humaine : tant que ce n'est pas vrai, le corrigé payant
  -- ne peut pas être mis en ligne.
  validee    boolean not null default false,
  valide_par uuid references auth.users(id) on delete set null,
  valide_le  timestamptz,
  updated_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 3. Déblocages achetés (analogue de unlocked_chapters)
-- ------------------------------------------------------------
create table if not exists public.unlocked_epreuves (
  user_id    uuid not null references auth.users(id) on delete cascade,
  epreuve_id uuid not null references public.epreuves(id) on delete cascade,
  title      text,
  niveau     text,
  price      integer,
  provider   text,
  created_at timestamptz default now(),
  primary key (user_id, epreuve_id)
);

-- ------------------------------------------------------------
-- 4. Activité des élèves (ce que l'admin doit voir)
--
-- Chaque téléchargement, consultation de corrigé ou signalement
-- est journalisé : l'admin sait quel élève a fait quoi.
-- Écriture par le serveur uniquement.
-- ------------------------------------------------------------
create table if not exists public.epreuves_activites (
  id         bigint generated always as identity primary key,
  user_id    uuid references auth.users(id) on delete set null,
  epreuve_id uuid references public.epreuves(id) on delete cascade,
  -- telechargement | consultation | signalement
  action     text not null,
  created_at timestamptz default now()
);

create index if not exists epreuves_activites_date
  on public.epreuves_activites (created_at desc);
create index if not exists epreuves_activites_epreuve
  on public.epreuves_activites (epreuve_id);

-- ------------------------------------------------------------
-- 5. Signalements d'erreur sur un corrigé
--
-- Un élève qui trouve une erreur le signale : c'est le garde-fou
-- qui garantit qu'un corrigé payé reste juste dans le temps.
-- ------------------------------------------------------------
create table if not exists public.epreuves_signalements (
  id         bigint generated always as identity primary key,
  epreuve_id uuid not null references public.epreuves(id) on delete cascade,
  user_id    uuid references auth.users(id) on delete set null,
  message    text not null,
  statut     text not null default 'nouveau',
  created_at timestamptz default now()
);

create index if not exists epreuves_signalements_statut
  on public.epreuves_signalements (statut, created_at desc);

-- ------------------------------------------------------------
-- 6. RLS
-- ------------------------------------------------------------
alter table public.epreuves enable row level security;
alter table public.unlocked_epreuves enable row level security;
alter table public.epreuve_corrections enable row level security;
alter table public.epreuves_activites enable row level security;
alter table public.epreuves_signalements enable row level security;

-- Lecture du catalogue public (uniquement les épreuves publiées).
drop policy if exists "epreuves_read_published" on public.epreuves;
create policy "epreuves_read_published" on public.epreuves
  for select to anon, authenticated
  using (published);

-- Écriture : l'admin (via SQL Editor ou back-office) ou la clé service.
drop policy if exists "epreuves_write_admin" on public.epreuves;
create policy "epreuves_write_admin" on public.epreuves
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- L'élève lit ses propres déblocages…
drop policy if exists "epreuves_unlocks_read_own" on public.unlocked_epreuves;
create policy "epreuves_unlocks_read_own" on public.unlocked_epreuves
  for select to authenticated
  using (auth.uid() = user_id);

-- …mais ne peut jamais en créer un lui-même : seul le serveur écrit
-- (après validation du paiement FedaPay). Aucune policy d'insertion
-- n'est créée ici, volontairement.

-- La correction (solution rédigée) n'est lisible que par l'admin.
-- L'élève y accède par le serveur, après contrôle de ses droits.
drop policy if exists "corrections_read_admin" on public.epreuve_corrections;
create policy "corrections_read_admin" on public.epreuve_corrections
  for select to authenticated
  using (public.is_admin());
drop policy if exists "corrections_write_admin" on public.epreuve_corrections;
create policy "corrections_write_admin" on public.epreuve_corrections
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Activité et signalements : lecture par l'admin, écriture par le serveur.
drop policy if exists "activites_read_admin" on public.epreuves_activites;
create policy "activites_read_admin" on public.epreuves_activites
  for select to authenticated
  using (public.is_admin());

drop policy if exists "signalements_read_admin" on public.epreuves_signalements;
create policy "signalements_read_admin" on public.epreuves_signalements
  for select to authenticated
  using (public.is_admin());

-- L'élève peut signaler une erreur sur un corrigé, mais seulement pour lui :
-- il ne peut pas signer à la place d'un autre.
drop policy if exists "signalements_insert_own" on public.epreuves_signalements;
create policy "signalements_insert_own" on public.epreuves_signalements
  for insert to authenticated
  with check (auth.uid() = user_id);

-- ------------------------------------------------------------
-- 7. Stockage des fichiers
-- ------------------------------------------------------------
-- Bucket privé : les liens directs ne donnent rien. Le serveur génère
-- une URL signée à durée courte après avoir vérifié les droits.
insert into storage.buckets (id, name, public)
values ('epreuves', 'epreuves', false)
on conflict (id) do nothing;

drop policy if exists "epreuves_storage_admin" on storage.objects;
create policy "epreuves_storage_admin" on storage.objects
  for all to authenticated
  using (bucket_id = 'epreuves' and public.is_admin())
  with check (bucket_id = 'epreuves' and public.is_admin());

-- ------------------------------------------------------------
-- 8. Vérification
--
-- Après exécution :
--   select count(*) from public.epreuves;                 -- 0 au départ
--   insert into public.epreuves (pays, niveau, annee, matiere, type,
--          titre, fichier_url, source_nom, source_url, licence, is_free, price)
--   values ('BJ','bac',2024,'Mathématiques','sujet',
--          'Épreuve de Mathématiques — BAC 2024','bj-bac-2024-math-sujet.pdf',
--          'ONEB','https://exemple.oneb.bj','domaine public', true, 0);
--
-- Publier un corrigé payant avec sa correction (le serveur l'exige) :
--   insert into public.epreuve_corrections (epreuve_id, solution, bareme, difficulte, validee)
--   values ('<uuid>', '1) … 2) …', 20, 'moyen', true);
--
-- Promouvoir un admin (dans le SQL Editor) :
--   update public.profiles set role = 'admin' where email = 'adresse@exemple.com';
