-- ============================================================
-- Revisy — schema_securite_bouclier.sql
-- Bouclier de sécurité : journal d'audit, blocage, fermeture des
-- privilèges. À exécuter APRÈS les 15 migrations précédentes.
--
-- Ce que le SQL peut faire (et fait ici) :
--   1. consigner chaque événement de sécurité (tentative, piratage,
--      promotion d'admin) ;
--   2. interdire l'accès à un compte ou une adresse IP bannie ;
--   3. fermer l'accès aux fonctions : par défaut AUCUNE fonction du
--      schéma public n'est exécutable par un visiteur ; seule une liste
--      blanche explicite l'est ;
--   4. activer la RLS sur TOUTES les tables du schéma public (la liste
--      n'est plus figée : une table créée demain est protégée d'emblée) ;
--   5. couper les requêtes qui tournent trop longtemps.
--
-- Ce que le SQL ne peut PAS faire (à faire côté serveur) :
--   - limiter le nombre de requêtes HTTP (c'est le rôle du serveur) ;
--   - envoyer une alerte (e-mail, Telegram…) : le SQL écrit, le serveur
--     notifie ;
--   - voir une tentative de connexion échouée quand le navigateur parle
--     directement à Supabase : il faut passer par le serveur.
--
-- Script idempotent : il peut être relancé sans risque.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Journal des événements de sécurité
-- ------------------------------------------------------------
-- Qui a tenté quoi, et quand. Le serveur y écrit (clé service) ; le
-- back-office le lit. Aucune policy d'insertion n'est créée : un élève
-- ne peut pas polluer le journal.
create table if not exists public.securite_evenements (
  id         bigint generated always as identity primary key,
  type       text not null,
  -- info : constat banal | alerte : à surveiller | critique : action requise
  gravite    text not null default 'info',
  user_id    uuid references auth.users(id) on delete set null,
  email      text,
  ip         text,
  chemin     text,
  details    jsonb,
  created_at timestamptz default now()
);

create index if not exists securite_evenements_date
  on public.securite_evenements (created_at desc);
create index if not exists securite_evenements_type
  on public.securite_evenements (type, created_at desc);

alter table public.securite_evenements enable row level security;

drop policy if exists "securite_evenements_read_admin" on public.securite_evenements;
create policy "securite_evenements_read_admin"
  on public.securite_evenements
  for select to authenticated
  using (public.is_admin());

-- ------------------------------------------------------------
-- 2. Liste de blocage
-- ------------------------------------------------------------
-- type : 'email' | 'ip' | 'user_id'. jusqu_a vide = blocage définitif.
create table if not exists public.blocage_acces (
  id         bigint generated always as identity primary key,
  type       text not null,
  valeur     text not null,
  motif      text,
  jusqu_a    timestamptz,
  created_at timestamptz default now(),
  created_by uuid references auth.users(id) on delete set null,
  unique (type, valeur)
);

create index if not exists blocage_acces_index
  on public.blocage_acces (type, valeur);

alter table public.blocage_acces enable row level security;

drop policy if exists "blocage_acces_read_admin" on public.blocage_acces;
create policy "blocage_acces_read_admin"
  on public.blocage_acces
  for select to authenticated
  using (public.is_admin());

-- Un compte banni ne peut plus s'inscrire : le déclencheur ci-dessous
-- refuse l'écriture du profil.
create or replace function public.est_bloque(p_type text, p_valeur text)
returns boolean
language sql
stable
security definer
set search_path = public
as $fn$
  select exists (
    select 1
    from public.blocage_acces b
    where b.type = p_type
      and lower(b.valeur) = lower(p_valeur)
      and (b.jusqu_a is null or b.jusqu_a > now())
  );
$fn$;

grant execute on function public.est_bloque(text, text) to anon, authenticated, service_role;

create or replace function public.protect_compte_bloque()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
begin
  if new.email is not null
     and public.est_bloque('email', new.email) then
    raise exception 'Compte bloque';
  end if;
  return new;
end;
$fn$;

drop trigger if exists profiles_bloque_compte_insert on public.profiles;
create trigger profiles_bloque_compte_insert
  before insert on public.profiles
  for each row execute function public.protect_compte_bloque();

drop trigger if exists profiles_bloque_compte_email on public.profiles;
create trigger profiles_bloque_compte_email
  before update of email on public.profiles
  for each row execute function public.protect_compte_bloque();

-- ------------------------------------------------------------
-- 3. Journalisation : promotion d'admin et inscription
-- ------------------------------------------------------------
-- Toute promotion en « admin » est tracée : on sait qui l'a faite et
-- quand. C'est la trace la plus utile en cas de piratage.
create or replace function public.journaliser_promotion_admin()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
begin
  if new.role is distinct from old.role and new.role = 'admin' then
    insert into public.admin_journal (user_id, action, cible, details)
    values (
      new.id,
      'promotion_admin',
      new.email,
      jsonb_build_object('role_precedent', old.role, 'role', new.role)
    );
  end if;
  return new;
end;
$fn$;

drop trigger if exists profiles_journalise_promotion on public.profiles;
create trigger profiles_journalise_promotion
  after update of role on public.profiles
  for each row execute function public.journaliser_promotion_admin();

-- Inscription : chaque nouveau compte est journalisé. Une rafale
-- d'inscriptions inhabituelle se voit donc immédiatement.
create or replace function public.journaliser_inscription()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
begin
  insert into public.securite_evenements (type, gravite, user_id, email, details)
  values (
    'inscription',
    'info',
    new.id,
    new.email,
    jsonb_build_object('provider', coalesce(new.raw_app_meta_data ->> 'provider', ''))
  );
  return new;
end;
$fn$;

-- Créer un déclencheur sur auth.users demande des droits sur le schéma
-- « auth ». Si la plateforme ne les accorde pas, on ne veut surtout pas
-- faire échouer toute la migration : on isole l'échec.
do $do$
begin
  drop trigger if exists auth_users_journalise_inscription on auth.users;
  create trigger auth_users_journalise_inscription
    after insert on auth.users
    for each row execute function public.journaliser_inscription();
exception when others then
  raise notice 'Journal des inscriptions non activé (droits sur auth.users) : %', sqlerrm;
end
$do$;

-- ------------------------------------------------------------
-- 4. Fermeture des privilèges de fonctions
-- ------------------------------------------------------------
-- 4a. Les fonctions créées PLUS TARD (et les tables créées plus tard)
--     ne sont plus accessibles par défaut à un visiteur.
--
--     C'est le piège classique de Supabase : par défaut, toute fonction
--     créée dans le schéma public est exécutable par « anon » et
--     « authenticated ». Une fonction écrite par erreur — ououbliée dans
--     une future migration — devient donc une porte ouverte, puisque la
--     clé publique est dans le code du site.
--
--     Règle appliquée ici : ce qui est privé reste privé. Pour qu'un
--     élève lise directement une nouvelle table, il faut lui accorder
--     SELECT explicitement.
alter default privileges in schema public revoke execute on functions from anon, authenticated;
alter default privileges in schema public revoke all on tables from anon, authenticated;

-- 4b. On ne peut pas créer d'objet dans le schéma public en tant que
--     visiteur : sans cela, un élève authentifié pourrait créer une
--     fonction piégée qui détourne les autres.
revoke create on schema public from anon, authenticated;

-- 4c. Fermeture de TOUTES les fonctions du schéma public, puis
--     réouverture d'une liste blanche stricte.
--
--     Seules restent exécutables par un visiteur les fonctions listées
--     ci-dessous. Toutes les autres (y compris celles ajoutées plus
--     tard par erreur) sont fermées.
do $do$
declare
  sig text;
begin
  for sig in
    select p.oid::regprocedure::text
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
  loop
    begin
      execute format('revoke execute on function %s from anon, authenticated', sig);
    exception when others then
      null; -- signature exotique : on l'ignore plutôt que d'abonder
    end;
  end loop;
end
$do$;

-- Liste blanche. Chaque fonction a une raison d'être listée :
--   is_admin                     : utilisée par les politiques RLS
--   get_public_stats             : statistiques publiques du site
--   get_curriculum_topics        : programme officiel (lecture)
--   get_curriculum_sequences     : programme officiel (lecture)
--   get_curriculum_chapters       : cours, contenu payé filtré sur les droits
--   get_chapters_for_student      : cours de l'élève
--   get_quiz_bank                 : QCM gratuits
--   list_subjects                 : matières (métadonnées seules)
--   list_chapters_for_student     : chapitres (métadonnées seules)
--   get_my_profile                : son propre profil
--   get_active_subscription       : son propre abonnement
--   get_admin_stats               : statistiques admin (is_admin() vérifié
--                                   dans le corps de la fonction)
--   upsert/delete_curriculum_sequences, upsert_quiz_bank,
--   upsert/delete_chapter_mapping : écriture admin (is_admin() vérifié
--                                   dans le corps de la fonction)
--
-- Plusieurs signatures sont listées pour une même fonction : au fil des
-- migrations, une fonction est parfois redéfinie avec un paramètre de plus
-- (« pays »). On accorde alors TOUTES les signatures possibles, pour que le
-- site ne casse pas si l'ordre d'application change.
do $do$
declare
  f text;
begin
  foreach f in array array[
    'public.is_admin()',
    'public.get_public_stats()',
    'public.get_curriculum_topics(text,text,text)',
    'public.get_curriculum_topics(text,text,text,text)',
    'public.get_curriculum_topics(text,text,text,text,text)',
    'public.get_curriculum_sequences(text,text,text)',
    'public.get_curriculum_sequences(text,text,text,text)',
    'public.get_curriculum_chapters(text,text,text,text)',
    'public.get_chapters_for_student(text,text,text,text)',
    'public.get_chapters_for_student(text,text,text,text,uuid)',
    'public.get_quiz_bank(text,text,text,text)',
    'public.get_quiz_bank(text,text,text,text,text)',
    'public.list_subjects(text,text)',
    'public.list_chapters_for_student(uuid)',
    'public.get_my_profile()',
    'public.get_active_subscription(uuid)',
    'public.get_admin_stats()',
    'public.upsert_curriculum_sequences(text,text,text,text[],text)',
    'public.upsert_curriculum_sequences(text,text,text,text[],text,jsonb)',
    'public.upsert_curriculum_sequences(text,text,text,text[],text,jsonb,text)',
    'public.delete_curriculum_sequences(text,text,text)',
    'public.delete_curriculum_sequences(text,text,text,text)',
    'public.upsert_quiz_bank(text,text,jsonb,text,text)',
    'public.upsert_quiz_bank(text,text,jsonb,text,text,text)',
    'public.upsert_chapter_mapping(uuid,text,text,text,text,uuid,integer)',
    'public.delete_chapter_mapping(uuid,text,text,text,text,uuid)',
    'public.est_bloque(text,text)'
  ] loop
    begin
      execute format('grant execute on function %s to anon, authenticated, service_role', f);
    exception when others then
      -- Fonction absente : on ignore plutôt que d'arrêter la migration.
      null;
    end;
  end loop;
end
$do$;

-- Les fonctions de déclencheur n'ont pas à être appelables : on les ferme
-- explicitement (elles ne peuvent de toute façon pas être appelées
-- directement, mais cela évite qu'un futur_trigger soit mal protégé).
do $do$
declare
  f text;
begin
  foreach f in array array[
    'public.handle_new_user()',
    'public.protect_profile_role()',
    'public.protect_compte_bloque()',
    'public.journaliser_promotion_admin()',
    'public.journaliser_inscription()',
    'public.trg_compute_chapter_pricing()',
    'public.update_chapter_mappings_timestamp()'
  ] loop
    begin
      execute format('revoke execute on function %s from anon, authenticated', f);
    exception when others then
      null;
    end;
  end loop;
end
$do$;

-- ------------------------------------------------------------
-- 5. RLS sur TOUTES les tables du schéma public
-- ------------------------------------------------------------
-- Avant, la liste des tables protégées était figée dans le script. Une
-- table créée par une future migration pouvait donc rester ouverte.
-- Ici, on parcourt le schéma : la protection est automatique.
do $do$
declare
  nom text;
begin
  for nom in
    select c.relname
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind = 'r'
  loop
    execute format('alter table public.%I enable row level security', nom);
  end loop;
end
$do$;

-- ------------------------------------------------------------
-- 6. Requêtes qui tournent trop longtemps
-- ------------------------------------------------------------
-- Un attaquant qui lance 500 requêtes de 10 minutes sature le projet et
-- coûte de l'argent. On borne la durée d'une requête pour tout visiteur.
do $do$
begin
  execute 'alter role anon set statement_timeout = ''15s''';
  execute 'alter role authenticated set statement_timeout = ''15s''';
  execute 'alter role anon set idle_in_transaction_session_timeout = ''20s''';
  execute 'alter role authenticated set idle_in_transaction_session_timeout = ''20s''';
exception when others then
  raise notice 'Limitation de durée non appliquée (droits insuffisants) : %', sqlerrm;
end
$do$;

-- ------------------------------------------------------------
-- 7. Vérification
-- ------------------------------------------------------------
-- 1. Aucune fonction de public n'est exécutable par un visiteur, en
--    dehors de la liste blanche :
--
--    select p.proname
--    from pg_proc p
--    join pg_namespace n on n.oid = p.pronamespace
--    join information_schema.role_routine_grants g
--      on g.specific_name = p.oid::regprocedure::text
--    where n.nspname = 'public' and g.grantee = 'anon';
--
-- 2. Toutes les tables de public ont la RLS activée :
--
--    select relname from pg_class c
--    join pg_namespace n on n.oid = c.relnamespace
--    where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity;
--
-- 3. La liste de blocage est vide :
--
--    select * from public.blocage_acces;
