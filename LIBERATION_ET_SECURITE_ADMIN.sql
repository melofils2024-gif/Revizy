-- ============================================================
-- REVISY — LIBÉRATION ET SÉCURISATION DE L'ESPACE ADMINISTRATEUR
-- ============================================================
-- À coller dans le SQL Editor de Supabase :
--   https://supabase.com/dashboard/project/wvbpiqchgwyeqyzuxtpp/sql
--
-- Ce script est UNIQUE, IDEMPOTENT et RÉSISTANT AUX ÉCHECS :
--   - chaque étape est protégée (IF EXISTS / to_regclass) : si un objet
--     manque, l'étape est simplement sautée au lieu de faire échouer
--     tout le script ;
--   - le script peut être relancé autant de fois que nécessaire ;
--   - le SQL Editor exécute le script dans UNE transaction : si une ligne
--     échoue, rien n'est appliqué. D'où l'importance des garde-fous.
--
-- ⚠️  LES DEUX ADRESSES AUTORISÉES sont écrites dans le bloc
--     « 3. Nettoyage des rôles » (et dans ADMIN_EMAILS sur Render).
--     Elles doivent être identiques des deux côtés, sinon un
--     administrateur se connecte mais est refusé par le serveur.
--
-- Ce que fait le script :
--   0. Diagnostic (lecture seule) : qui est administrateur aujourd'hui ?
--   1. Expulsion de toutes les sessions, jetons et facteurs MFA pirates.
--   2. Neutralisation de l'auto-promotion (la cause de la prise de contrôle).
--   3. Nettoyage des rôles : les deux administrateurs légitimes retrouvent
--      le rôle « admin », tous les autres sont rétrogradés en élèves.
--   4. Verrou : 2 administrateurs maximum, rôle non modifiable par un élève.
--   5. Journal des actions d'administration.
--   6. Contrôle final.
--
-- APRÈS CE SCRIPT :
--   - changez le mot de passe de votre compte (Authentication → Utilisateurs) ;
--   - activez le TOTP (Authentication → Sign In / Providers → MFA → TOTP) ;
--   - appliquez MIGRATION_TOUT.sql (schéma complet du site).
-- ============================================================

-- ============================================================
-- 0. DIAGNOSTIC (lecture seule) — à lire AVANT la suite
-- ============================================================
select id, email, role, created_at
  from public.profiles
 where role = 'admin'
 order by created_at;

-- Le déclencheur d'inscription lit-il encore le rôle dans les métadonnées
-- envoyées par le navigateur ? C'est la faille d'auto-promotion.
select prosrc like '%raw_user_meta_data->>''role''%' as "VULNERABLE_AUTO_PROMOTION"
  from pg_proc
 where proname = 'handle_new_user'
 limit 1;

-- Les élèves peuvent-ils écrire la colonne « role » ?
select policyname, cmd, qual, with_check
  from pg_policies
 where schemaname = 'public' and tablename = 'profiles';

-- ============================================================
-- 1. EXPULSION DES SESSIONS, JETONS ET FACTEURS MFA
-- ============================================================
-- Toutes les sessions actives sont détruites : chaque appareil doit se
-- reconnecter. Les éventuels codes TOTP enregistrés par un tiers sont
-- supprimés : un pirate ne peut plus récupérer l'accès avec un code.
-- (Les tables auth.* n'existent pas dans toutes les versions de Supabase :
--  chaque suppression est donc conditionnée à la présence de la table.)
do $do$
begin
  if to_regclass('auth.refresh_tokens') is not null then
    execute 'delete from auth.refresh_tokens';
  end if;
  if to_regclass('auth.sessions') is not null then
    execute 'delete from auth.sessions';
  end if;
  if to_regclass('auth.mfa_factors') is not null then
    execute 'delete from auth.mfa_factors';
  end if;
  if to_regclass('auth.mfa_challenges') is not null then
    execute 'delete from auth.mfa_challenges';
  end if;
end
$do$;

-- ============================================================
-- 2. NEUTRALISATION DE L'AUTO-PROMOTION (la cause de l'intrusion)
-- ============================================================
-- La fonction d'inscription ne lit PLUS le rôle dans les métadonnées du
-- navigateur : un compte créé depuis le site est TOUJOURS un élève.
-- Les colonnes absentes de la base sont gérées : la construction de
-- l'INSERT est dynamique, le script fonctionne sur le schéma actuel comme
-- sur le schéma complet.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
declare
  chosen_pays text;
begin
  chosen_pays := upper(btrim(coalesce(new.raw_user_meta_data->>'pays', 'BJ')));
  if chosen_pays !~ '^[A-Z]{2}$' then
    chosen_pays := 'BJ';
  end if;

  insert into public.profiles (id, email, name, role, niveau)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    'client',
    coalesce(new.raw_user_meta_data->>'niveau', 'bac')
  )
  on conflict (id) do update
     set email = excluded.email,
         name  = coalesce(nullif(excluded.name, ''), public.profiles.name);
  -- ⚠️ « role » n'est JAMAIS mis à jour ici : c'était la faille.
  return new;
end;
$fn$;

-- Le déclencheur d'inscription est recréé (au cas où).
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Même si le déclencheur était désactivé, le rôle ne peut plus changer
-- depuis le navigateur : la fonction annule toute écriture de rôle par
-- un élève (current_user = anon ou authenticated).
create or replace function public.protect_profile_role()
returns trigger
language plpgsql
set search_path = public
as $fn$
begin
  if current_user in ('anon', 'authenticated') and not public.is_admin() then
    if tg_op = 'INSERT' then
      new.role := 'client';
    elsif new.role is distinct from old.role then
      new.role := old.role;
    end if;
  end if;
  return new;
end;
$fn$;

do $do$
begin
  if to_regclass('public.profiles') is not null then
    execute 'drop trigger if exists profiles_protect_role on public.profiles';
    execute 'create trigger profiles_protect_role before insert or update on public.profiles for each row execute function public.protect_profile_role()';
  end if;
end
$do$;

-- Défense en profondeur : l'élève n'a plus le droit de mettre à jour la
-- table entière, seulement les colonnes qu'il a le droit de modifier.
-- (La colonne « role » est volontairement absente de cette liste.)
do $do$
declare
  col text;
begin
  if to_regclass('public.profiles') is null then
    return;
  end if;
  execute 'revoke update on public.profiles from anon, authenticated';
  foreach col in array array['name', 'email', 'niveau', 'classe', 'serie', 'pays'] loop
    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'profiles' and column_name = col
    ) then
      execute format('grant update (%I) on public.profiles to authenticated', col);
    end if;
  end loop;
end
$do$;

-- ============================================================
-- 3. NETTOYAGE DES RÔLES
-- ============================================================
-- ⚠️  ADRESSE DU PROPRIÉTAIRE — à modifier ici si nécessaire.
-- Le rôle est comparé à l'adresse de auth.users (la source de vérité),
-- jamais à « profiles.email » (colonne modifiable par l'élève, et qui
-- peut être vide : un e-mail NULL ne doit jamais être considéré comme
-- « autorisé »).
do $do$
declare
  -- ⚠️  LES DEUX ADRESSES AUTORISÉES (2 maximum).
  -- Le rôle est comparé à l'adresse de auth.users (la source de vérité),
  -- jamais à « profiles.email » (colonne modifiable par l'élève, et qui
  -- peut être vide : un e-mail NULL ne doit jamais être considéré comme
  -- « autorisé »).
  owner_email       text := 'melofils2024@gmail.com';
  second_admin_email text := 'dareitmahougnon@gmail.com';
begin
  -- 3a. Tous les administrateurs qui ne sont ni le propriétaire ni le
  --     second administrateur deviennent de simples élèves.
  update public.profiles p
     set role = 'client'
   where p.role = 'admin'
     and not exists (
       select 1 from auth.users u
        where u.id = p.id
          and lower(u.email) in (lower(owner_email), lower(second_admin_email))
     );

  -- 3b. Le propriétaire et le second administrateur retrouvent le rôle
  --     « admin ». Sans cette étape, le second admin resterait « client »
  --     et le site lui afficherait « Accès réservé aux administrateurs ».
  update public.profiles p
     set role = 'admin'
    from auth.users u
   where u.id = p.id
     and lower(u.email) in (lower(owner_email), lower(second_admin_email));
end
$do$;

-- 3c. Compte rendu immédiat : si une ligne est manquante ci-dessous, le
--     compte n'existe pas encore ou son e-mail n'est pas le bon.
select u.email,
       u.email_confirmed_at is not null as "email_confirme",
       coalesce(p.role, 'profil_absent')    as "role_actuel",
       (p.role = 'admin')                  as "admin"
  from auth.users u
  left join public.profiles p on p.id = u.id
 where lower(u.email) in ('melofils2024@gmail.com', 'dareitmahougnon@gmail.com');

-- ============================================================
-- 4. VERROU STRICT : 2 ADMINISTRATEURS MAXIMUM
-- ============================================================
-- Seules les deux adresses officielles vérifiées peuvent être administrateur.
-- Même si un compte pirate parvenait à modifier son profil, is_admin() renvoie FALSE.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $fn$
  select exists (
    select 1
      from auth.users u
      join public.profiles p on p.id = u.id
     where u.id = auth.uid()
       and p.role = 'admin'
       and lower(u.email) in ('melofils2024@gmail.com', 'dareitmahougnon@gmail.com')
  );
$fn$;

grant execute on function public.is_admin() to authenticated;

-- Le déclencheur est déclaré sur INSERT et UPDATE (sans « OF ») :
-- PostgreSQL refuse de combiner « INSERT » et « UPDATE OF colonnes »
-- dans un même déclencheur, et cette erreur annulait le script entier.
create or replace function public.check_max_two_admins()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_admin_count integer;
begin
  if new.role = 'admin' then
    select count(*)
      into v_admin_count
      from public.profiles
     where role = 'admin'
       and id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid);
    if v_admin_count >= 2 then
      raise exception 'Action refusée : la limite stricte de 2 administrateurs est atteinte sur Revisy.';
    end if;
  end if;
  return new;
end;
$fn$;

do $do$
begin
  if to_regclass('public.profiles') is not null then
    execute 'drop trigger if exists trg_limit_two_admins on public.profiles';
    execute 'create trigger trg_limit_two_admins before insert or update on public.profiles for each row execute function public.check_max_two_admins()';
  end if;
end
$do$;

-- ============================================================
-- 5. JOURNAL DES ACTIONS D'ADMINISTRATION
-- ============================================================
create table if not exists public.admin_journal (
  id         bigint generated always as identity primary key,
  user_id    uuid references auth.users(id) on delete set null,
  action     text not null,
  cible      text,
  details    jsonb,
  created_at timestamptz default now()
);

create index if not exists admin_journal_date
  on public.admin_journal (created_at desc);

alter table public.admin_journal enable row level security;

drop policy if exists "admin_journal_read_admin" on public.admin_journal;
create policy "admin_journal_read_admin"
  on public.admin_journal
  for select to authenticated
  using (public.is_admin());

-- ============================================================
-- 6. CONTRÔLE FINAL
-- ============================================================
-- 6a. Administrateurs restants : il doit y en avoir exactement 2
--     (le propriétaire et le second administrateur), et aucun autre.
select id, email, role, created_at
  from public.profiles
 where role = 'admin'
 order by created_at;

-- 6a-bis. Ces deux comptes doivent correspondre exactement à la liste
--     ADMIN_EMAILS du serveur (Render), sinon un administrateur se
--     connecte mais reçoit « Accès administrateur refusé ».
--     La valeur attendue est :
--       melofils2024@gmail.com,dareitmahougnon@gmail.com
select u.email,
       u.email_confirmed_at is not null as "email_confirme",
       coalesce(p.role, 'profil_absent')    as "role_actuel"
  from auth.users u
  left join public.profiles p on p.id = u.id
 where p.role = 'admin'
 order by u.email;

-- 6b. La faille d'auto-promotion est-elle corrigée ?
--     « vulnerable_auto_promotion » doit être à FALSE.
select
  case when prosrc like '%raw_user_meta_data->>''role''%'
       then true else false end as "vulnerable_auto_promotion",
  case when prosrc like '%''client''%'
       then true else false end as "role_force_client"
  from pg_proc
 where proname = 'handle_new_user'
 limit 1;

-- 6c. Le déclencheur de protection du rôle est bien en place.
select tgname, pg_get_triggerdef(oid) as definition
  from pg_trigger
 where tgrelid = 'public.profiles'::regclass
   and not tgisinternal
 order by tgname;

-- 6d. Comptage des comptes (repère pour la suite).
select role, count(*) as nombre
  from public.profiles
 group by role
 order by role;

-- ============================================================
-- 7. OPTION : SUPPRIMER DÉFINITIVEMENT UN COMPTE PIRATE
-- ============================================================
-- À FAIRE UNIQUEMENT après avoir identifié les comptes pirates avec la
-- requête 6a. Les 删除 ci-dessous sont des lignes COMMENTÉES : elles ne
-- s'exécutent pas tant que vous ne les Have pas décommentées.
-- Remplacez <UUID_PIRATE> par l'identifiant du compte à supprimer.
--
-- delete from auth.users where id = '<UUID_PIRATE>';
--
-- (La suppression du compte supprime aussi ses données : profil, déblocages,
--  transactions. Refaites une sauvegarde des chapitres du site avant.)
-- ============================================================
