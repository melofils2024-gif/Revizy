-- ============================================================
-- Revizy — schema_securite.sql
-- Correctifs de sécurité (à exécuter APRÈS tous les autres scripts,
-- en dernier : schema_pays.sql, schema_exercices.sql, schema_paiements.sql,
-- schema_subscriptions.sql…). Script idempotent : il peut être relancé.
--
-- 1. Contenu payant : les cours, exemples et corrigés des chapitres payants
--    ne sont plus lisibles sans abonnement ou déblocage.
-- 2. Rôle admin : impossible de s'auto-promouvoir à l'inscription, ni après
--    (déclencheur + droits de colonne limités sur « profiles »).
-- 3. Banque d'exercices : surcharge de fonction ambiguë supprimée.
-- 4. Déblocages / transactions : seul le serveur (clé service) les écrit.
-- 5. Journal des actions d'administration (qui a publié quoi, et quand).
-- ============================================================

-- ------------------------------------------------------------
-- 1. Lecture des chapitres
-- ------------------------------------------------------------
-- La table reste lisible (titres, prix, numéros), mais plus les colonnes
-- de contenu : elles passent uniquement par get_curriculum_chapters, qui
-- vérifie les droits de l'élève.
revoke select on public.chapters from anon, authenticated;

do $do$
declare
  cols text;
begin
  select string_agg(quote_ident(column_name), ', ' order by ordinal_position)
    into cols
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'chapters'
    and column_name not in (
      'cours', 'pdf_url', 'exercices',
      'exemple_titre', 'exemple_enonce', 'exemple_solution',
      'exercice_consigne', 'exercice_question', 'exercice_type',
      'exercice_options', 'exercice_correct_option', 'exercice_explication'
    );
  execute format('grant select (%s) on public.chapters to anon, authenticated', cols);
end
$do$;

-- Contenu complet si : chapitre gratuit, admin, abonnement actif sur le
-- niveau, ou chapitre débloqué par l'élève (par id ou par slug).
drop function if exists public.get_curriculum_chapters(text, text, text, text);
create or replace function public.get_curriculum_chapters(
  p_niveau  text,
  p_serie   text default null,
  p_subject text default null,
  p_pays    text default 'BJ'
)
returns table (
  id                         uuid,
  slug                       text,
  subject_name               text,
  niveau_code                text,
  serie_code                 text,
  num                        integer,
  title                      text,
  sa_label                   text,
  classe                     text,
  pdf_url                    text,
  is_free                    boolean,
  price                      integer,
  locked                     boolean,
  cours                      text,
  exemple_titre              text,
  exemple_enonce             text,
  exemple_solution           text,
  exercice_consigne          text,
  exercice_question          text,
  exercice_type              text,
  exercice_options           jsonb,
  exercice_correct_option    text,
  exercice_explication       text,
  exercices                  jsonb
)
language sql
security definer
stable
set search_path = public
as $fn$
  select
    c.id,
    c.slug,
    s.name                                         as subject_name,
    s.niveau_code,
    s.serie_code,
    c.num,
    c.title,
    c.sa_label,
    c.classe,
    case when a.ok then c.pdf_url end              as pdf_url,
    c.is_free,
    c.price,
    not a.ok                                       as locked,
    case when a.ok then c.cours end                as cours,
    c.exemple_titre,
    case when a.ok then c.exemple_enonce end       as exemple_enonce,
    case when a.ok then c.exemple_solution end     as exemple_solution,
    case when a.ok then c.exercice_consigne end    as exercice_consigne,
    case when a.ok then c.exercice_question end    as exercice_question,
    case when a.ok then c.exercice_type end        as exercice_type,
    case when a.ok then c.exercice_options end     as exercice_options,
    case when a.ok then c.exercice_correct_option end as exercice_correct_option,
    case when a.ok then c.exercice_explication end as exercice_explication,
    case when a.ok then coalesce(c.exercices, '[]'::jsonb) else '[]'::jsonb end as exercices
  from public.subjects s
  join public.chapters c on c.subject_id = s.id
  cross join lateral (
    select (
      coalesce(c.is_free, false)
      or public.is_admin()
      or exists (
        select 1 from public.subscriptions sub
        where sub.user_id = auth.uid()
          and sub.expires_at > now()
          and sub.niveau in (s.niveau_code, 'all')
      )
      or exists (
        select 1 from public.unlocked_chapters u
        where u.user_id = auth.uid()
          and u.chapter_id in (c.id::text, c.slug)
      )
    ) as ok
  ) a
  where s.published
    and c.published
    and s.pays = p_pays
    and c.pays = p_pays
    and s.niveau_code = p_niveau
    and (p_serie   is null or s.serie_code = p_serie   or s.serie_code is null)
    and (p_subject is null or s.name       = p_subject)
  order by s.name, c.num;
$fn$;

grant execute on function public.get_curriculum_chapters(text, text, text, text) to anon, authenticated;

-- ------------------------------------------------------------
-- 2. Rôle admin
-- ------------------------------------------------------------
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

  insert into public.profiles (id, email, name, role, niveau, classe, serie, pays)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    'client',
    coalesce(new.raw_user_meta_data->>'niveau', 'bac'),
    nullif(btrim(coalesce(new.raw_user_meta_data->>'classe', '')), ''),
    nullif(upper(btrim(coalesce(new.raw_user_meta_data->>'serie', ''))), ''),
    chosen_pays
  )
  on conflict (id) do nothing;
  return new;
end;
$fn$;

-- Un élève (rôles anon / authenticated) ne choisit jamais son rôle, ni à
-- la création de son profil ni ensuite. Le SQL Editor de Supabase et la
-- clé service restent libres : c'est là qu'on promeut un admin.
-- (Fonction volontairement SANS security definer : current_user doit
-- refléter le rôle réel de l'appelant.)
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

drop trigger if exists profiles_protect_role on public.profiles;
create trigger profiles_protect_role
  before insert or update on public.profiles
  for each row execute function public.protect_profile_role();

-- Promouvoir un admin (à lancer dans le SQL Editor) :
--   update public.profiles set role = 'admin' where email = 'adresse@exemple.com';

-- Défense dans les profondeurs : même si le déclencheur était désactivé,
-- l'élève n'a plus le droit d'écrire la colonne « role ».
-- On retire le droit de mise à jour sur la table entière, puis on ne
-- redonne que les colonnes que l'élève a le droit de modifier.
revoke update on public.profiles from anon, authenticated;

do $do$
declare
  col text;
begin
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

-- ------------------------------------------------------------
-- 2 bis. Journal des actions d'administration
-- ------------------------------------------------------------
-- Qui a publié quoi, et quand. Écriture par le serveur (clé service)
-- uniquement : aucune policy d'insertion n'est créée, un élève ne peut
-- donc pas y écrire quoi que ce soit.
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

-- ------------------------------------------------------------
-- 3. Banque d'exercices : une seule signature
-- ------------------------------------------------------------
drop function if exists public.upsert_quiz_bank(text, text, jsonb, text, text);

do $do$
begin
  if to_regprocedure('public.upsert_quiz_bank(text, text, jsonb, text, text, text)') is not null then
    execute 'revoke execute on function public.upsert_quiz_bank(text, text, jsonb, text, text, text) from public, anon';
    execute 'grant execute on function public.upsert_quiz_bank(text, text, jsonb, text, text, text) to authenticated, service_role';
  end if;
end
$do$;

-- ------------------------------------------------------------
-- 4. Déblocages, transactions, abonnements : écriture serveur uniquement
-- ------------------------------------------------------------
drop policy if exists "unlocks_insert_own" on public.unlocked_chapters;
drop policy if exists "unlocks_update_own" on public.unlocked_chapters;
drop policy if exists "tx_insert_own" on public.transactions;

-- Un élève ne lit que son propre abonnement.
create or replace function public.get_active_subscription(p_user_id uuid)
returns public.subscriptions
language sql
stable
security definer
set search_path = public
as $$
  select s.*
  from public.subscriptions s
  where s.user_id = p_user_id
    and (p_user_id = auth.uid() or public.is_admin())
    and s.expires_at > now()
  order by s.expires_at desc
  limit 1;
$$;

revoke all on function public.get_active_subscription(uuid) from public;
grant execute on function public.get_active_subscription(uuid) to authenticated;

-- ------------------------------------------------------------
-- 6. Espace administrateur : accès réservé
-- ------------------------------------------------------------
-- Les statistiques globales (chiffre d'affaires, nombre d'élèves,
-- transactions) ne doivent jamais être lisibles par un élève.
create or replace function public.get_admin_stats()
returns json
language sql
stable
security definer
set search_path = public
as $fn$
  select case
    when public.is_admin() then json_build_object(
      'total_revenue',      coalesce((select sum(amount) from public.transactions), 0),
      'students_count',     (select count(*) from public.profiles where role = 'client'),
      'fiches_count',       (select count(*) from public.chapters where published),
      'transactions_count', (select count(*) from public.transactions),
      'unlocks_count',      (select count(*) from public.unlocked_chapters),
      'subjects_count',     (select count(*) from public.subjects where published),
      'last_updated',       now()
    )
    else null
  end;
$fn$;

revoke all on function public.get_admin_stats() from public;
revoke all on function public.get_admin_stats() from anon;
grant execute on function public.get_admin_stats() to authenticated;

-- Ancienne RPC qui renvoyait le contenu d'un chapitre sans vérifier
-- l'abonnement : le site ne l'utilise pas, on la ferme complètement.
do $do$
begin
  if to_regprocedure('public.get_chapter_content(uuid)') is not null then
    execute 'revoke all on function public.get_chapter_content(uuid) from public, anon, authenticated';
  end if;
end
$do$;

-- ------------------------------------------------------------
-- 7. Programme officiel : écriture réservée aux comptes connectés
-- ------------------------------------------------------------
-- (Les fonctions vérifient déjà is_admin() ; on retire en plus l'accès
-- anonyme pour qu'un appel non authentifié ne puisse même pas les tenter.)
do $do$
begin
  if to_regprocedure('public.upsert_curriculum_sequences(text, text, text, text[], text, jsonb, text)') is not null then
    execute 'revoke all on function public.upsert_curriculum_sequences(text, text, text, text[], text, jsonb, text) from public, anon';
    execute 'grant execute on function public.upsert_curriculum_sequences(text, text, text, text[], text, jsonb, text) to authenticated';
  end if;
  if to_regprocedure('public.delete_curriculum_sequences(text, text, text, text)') is not null then
    execute 'revoke all on function public.delete_curriculum_sequences(text, text, text, text) from public, anon';
    execute 'grant execute on function public.delete_curriculum_sequences(text, text, text, text) to authenticated';
  end if;
end
$do$;

-- ------------------------------------------------------------
-- 8. Vérification finale : RLS activée partout
-- ------------------------------------------------------------
-- Ce bloc est idempotent : si une table a perdu sa protection (script
-- ancien relancé, restauration…), elle est réactivée ici.
do $do$
declare
  nom text;
begin
  foreach nom in array array[
    'profiles', 'unlocked_chapters', 'transactions', 'subscriptions',
    'chapters', 'subjects', 'niveaux', 'series', 'pricing_rules',
    'quiz_banks', 'curriculum_sequences', 'payment_receipts',
    'epreuves', 'unlocked_epreuves', 'epreuve_corrections',
    'epreuves_activites', 'epreuves_signalements', 'chapter_mappings',
    'admin_journal'
  ]
  loop
    if to_regclass('public.' || nom) is not null then
      execute format('alter table public.%I enable row level security', nom);
    end if;
  end loop;
end
$do$;

-- ------------------------------------------------------------
-- 9. Vérification
-- ------------------------------------------------------------
-- En navigation privée (non connecté), les chapitres payants doivent
-- revenir verrouillés et sans cours :
--
--   select num, title, is_free, locked, left(cours, 40)
--   from public.get_curriculum_chapters('bac', 'C', null, 'BJ');
--
-- (Dans le SQL Editor tu es superutilisateur : is_admin() peut être faux
-- mais l'exécution n'est pas celle d'un élève ; teste depuis le site.)
