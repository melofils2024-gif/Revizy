-- ============================================================
-- Revizy — schema_classe.sql
-- Classe et série de l'élève + banque d'exercices personnalisée
--
-- À exécuter APRÈS schema.sql, schema_v2.sql, schema_curriculum.sql,
-- seed_curriculum.sql, schema_programme.sql.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Classe et série sur le profil élève
-- ------------------------------------------------------------
alter table public.profiles add column if not exists classe text;
alter table public.profiles add column if not exists serie text;

create index if not exists profiles_classe_serie_idx
  on public.profiles (classe, serie);

-- L'élève peut modifier sa classe/série, mais jamais son rôle.
create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
begin
  if new.role is distinct from old.role
     and coalesce(auth.role(), '') <> 'service_role'
     and not public.is_admin() then
    new.role := old.role;
  end if;
  return new;
end;
$fn$;

drop trigger if exists profiles_protect_role on public.profiles;
create trigger profiles_protect_role
  before update on public.profiles
  for each row execute function public.protect_profile_role();

-- Le trigger d'inscription recopie classe et série depuis les métadonnées
-- fournies lors du formulaire d'inscription.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
begin
  -- Rôle toujours « client » : jamais celui envoyé par le navigateur.
  insert into public.profiles (id, email, name, role, niveau, classe, serie)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    'client',
    coalesce(new.raw_user_meta_data->>'niveau', 'bac'),
    nullif(btrim(coalesce(new.raw_user_meta_data->>'classe', '')), ''),
    nullif(upper(btrim(coalesce(new.raw_user_meta_data->>'serie', ''))), '')
  );
  return new;
end;
$fn$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------
-- 2. Banque d'exercices par (classe, série, matière)
--    Générée une fois par l'IA, réutilisée par tous les élèves.
-- ------------------------------------------------------------
create table if not exists public.quiz_banks (
  id            uuid primary key default gen_random_uuid(),
  niveau_code   text not null,
  classe        text,
  serie_code    text,
  subject_name  text not null,
  questions     jsonb not null default '[]'::jsonb,
  updated_at    timestamptz not null default now()
);

create unique index if not exists quiz_banks_unique
  on public.quiz_banks (
    niveau_code,
    coalesce(classe, ''),
    coalesce(serie_code, ''),
    lower(subject_name)
  );

create or replace function public.get_quiz_bank(
  p_niveau  text,
  p_classe  text default null,
  p_serie   text default null,
  p_subject text default null
)
returns table (
  niveau_code text,
  classe      text,
  serie_code  text,
  subject_name text,
  questions   jsonb,
  updated_at  timestamptz
)
language sql
security definer
stable
set search_path = public
as $fn$
  select
    qb.niveau_code, qb.classe, qb.serie_code, qb.subject_name, qb.questions, qb.updated_at
  from public.quiz_banks qb
  where qb.niveau_code = p_niveau
    and (p_classe  is null or coalesce(qb.classe, '')    = coalesce(p_classe, ''))
    and (p_serie   is null or coalesce(qb.serie_code, '') = coalesce(p_serie, ''))
    and (p_subject is null or lower(qb.subject_name) = lower(p_subject))
  order by qb.updated_at desc
  limit 1;
$fn$;

grant execute on function public.get_quiz_bank(text, text, text, text) to anon, authenticated;

-- Écriture réservée au backend (clé service_role) ou aux admins.
-- Les paramètres avec valeur par défaut doivent être en dernier (règle PostgreSQL).
drop function if exists public.upsert_quiz_bank(text, text, text, text, jsonb);
create or replace function public.upsert_quiz_bank(
  p_niveau    text,
  p_subject   text,
  p_questions jsonb,
  p_classe    text default null,
  p_serie     text default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $fn$
begin
  if coalesce(auth.role(), '') <> 'service_role' and not public.is_admin() then
    raise exception 'not allowed';
  end if;

  insert into public.quiz_banks (niveau_code, classe, serie_code, subject_name, questions, updated_at)
  values (p_niveau, nullif(btrim(p_classe), ''), nullif(upper(btrim(p_serie)), ''), btrim(p_subject), p_questions, now())
  on conflict (niveau_code, (coalesce(classe, '')), (coalesce(serie_code, '')), (lower(subject_name)))
  do update set questions = excluded.questions, updated_at = now();

  return true;
end;
$fn$;

revoke execute on function public.upsert_quiz_bank(text, text, jsonb, text, text) from public, anon;
grant execute on function public.upsert_quiz_bank(text, text, jsonb, text, text) to authenticated, service_role;

-- Lecture du profil complet (classe, série, niveau)
create or replace function public.get_my_profile()
returns table (
  id       uuid,
  name     text,
  role     text,
  niveau   text,
  classe   text,
  serie    text
)
language sql
security definer
stable
set search_path = public
as $fn$
  select p.id, p.name, p.role, p.niveau, p.classe, p.serie
  from public.profiles p
  where p.id = auth.uid();
$fn$;

grant execute on function public.get_my_profile() to authenticated;

alter table public.quiz_banks enable row level security;

drop policy if exists quiz_banks_read on public.quiz_banks;
create policy quiz_banks_read
  on public.quiz_banks
  for select
  to anon, authenticated
  using (true);

drop policy if exists quiz_banks_admin_write on public.quiz_banks;
create policy quiz_banks_admin_write
  on public.quiz_banks
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());