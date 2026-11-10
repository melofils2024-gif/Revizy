-- ============================================================
-- REVISY — CORRECTIF DE SÉCURITÉ MAXIMALE IMMÉDIAT
-- À exécuter dans Supabase : Dashboard -> SQL Editor -> Run
-- ============================================================

-- 0. EXPULSION IMMÉDIATE DU PIRATE ET VERROUILLAGE DES RÔLES
-- Détruit toutes les sessions et facteurs MFA pirates en cours
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

-- Rétrograde immédiatement tout pirate qui s'est auto-promu
update public.profiles p
   set role = 'client'
 where p.role = 'admin'
   and not exists (
     select 1 from auth.users u
      where u.id = p.id
        and lower(u.email) in ('melofils2024@gmail.com', 'dareitmahougnon@gmail.com')
   );

-- Rétablit strictement les 2 seuls administrateurs légitimes
update public.profiles p
   set role = 'admin'
  from auth.users u
 where u.id = p.id
   and lower(u.email) in ('melofils2024@gmail.com', 'dareitmahougnon@gmail.com');

-- Redéfinit is_admin() : un pirate avec role='admin' reste FALSE car son email n'est pas autorisé
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

-- Verrouille à 2 administrateurs maximum
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

drop trigger if exists trg_limit_two_admins on public.profiles;
create trigger trg_limit_two_admins
  before insert or update on public.profiles
  for each row execute function public.check_max_two_admins();

-- 1. FERMETURE IMMÉDIATE DE LA FUITE SUR GET_ADMIN_STATS
-- Seul un administrateur connecté peut lire les revenus et statistiques.
create or replace function public.get_admin_stats()
returns json
language sql
security definer
stable
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


-- 2. FERMETURE IMMÉDIATE DE LA FUITE SUR GET_CURRICULUM_CHAPTERS
-- Les cours payants sont masqués si l'utilisateur n'a pas payé.
drop function if exists public.get_curriculum_chapters(text, text, text, text);
drop function if exists public.get_curriculum_chapters(text, text, text);
drop function if exists public.get_curriculum_chapters(text, text);
drop function if exists public.get_curriculum_chapters(text);

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
    and (s.pays is null or s.pays = p_pays)
    and (c.pays is null or c.pays = p_pays)
    and s.niveau_code = p_niveau
    and (p_serie   is null or s.serie_code = p_serie   or s.serie_code is null)
    and (p_subject is null or s.name       = p_subject)
  order by s.name, c.num;
$fn$;

grant execute on function public.get_curriculum_chapters(text, text, text, text) to anon, authenticated;


-- 3. VERROUILLAGE DES COLONNES SENSIBLES SUR LA TABLE CHAPTERS
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
  if cols is not null then
    execute format('grant select (%s) on public.chapters to anon, authenticated', cols);
  end if;
end
$do$;


-- 4. VERROUILLAGE ANTI-AUTO-PROMOTION EN ADMINISTRATEUR
create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
begin
  if new.role is distinct from old.role then
    if current_user in ('postgres', 'service_role') then
      return new;
    end if;
    if exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') then
      return new;
    end if;
    raise exception 'Modification du rôle interdite (accès administrateur requis).';
  end if;
  return new;
end;
$fn$;

drop trigger if exists trg_protect_profile_role on public.profiles;
create trigger trg_protect_profile_role
  before update on public.profiles
  for each row execute function public.protect_profile_role();

-- Révocation de l'écriture sur la colonne role
revoke update on public.profiles from anon, authenticated;
grant update (name, email, niveau, classe, serie, pays) on public.profiles to authenticated;


-- 5. TABLES DE BLOCAGE ET AUDIT SÉCURITÉ
create table if not exists public.securite_evenements (
  id         bigint generated always as identity primary key,
  type       text not null,
  gravite    text not null default 'info',
  user_id    uuid references auth.users(id) on delete set null,
  email      text,
  ip         text,
  chemin     text,
  details    jsonb,
  created_at timestamptz default now()
);

alter table public.securite_evenements enable row level security;
drop policy if exists "securite_evenements_read_admin" on public.securite_evenements;
create policy "securite_evenements_read_admin"
  on public.securite_evenements
  for select to authenticated
  using (public.is_admin());

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

alter table public.blocage_acces enable row level security;
drop policy if exists "blocage_acces_read_admin" on public.blocage_acces;
create policy "blocage_acces_read_admin"
  on public.blocage_acces
  for select to authenticated
  using (public.is_admin());
