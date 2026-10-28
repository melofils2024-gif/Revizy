-- ============================================================
-- Revizy — schema_pays.sql
-- Cloisonnement du contenu par pays (contexte).
--
-- Revizy est né pour le Bénin mais vise l'Afrique de l'Ouest puis
-- l'international. Cette migration ajoute la dimension « pays » aux
-- tables de contenu et aux RPC qui les lisent.
--
-- À exécuter APRÈS schema.sql, schema_v2.sql, schema_curriculum.sql,
-- schema_get_chapters.sql, schema_programme.sql, schema_programme_parts.sql,
-- schema_classe.sql et schema_paiements.sql.
--
-- Rétrocompatible : toutes les lignes existantes passent à 'BJ'
-- (Bénin) et tous les nouveaux paramètres p_pays valent 'BJ' par défaut.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Dimension pays sur les tables de contenu
-- ------------------------------------------------------------
alter table public.subjects
  add column if not exists pays text not null default 'BJ';

alter table public.chapters
  add column if not exists pays text not null default 'BJ';

alter table public.curriculum_sequences
  add column if not exists pays text not null default 'BJ';

alter table public.quiz_banks
  add column if not exists pays text not null default 'BJ';

create index if not exists idx_subjects_pays on public.subjects (pays);
create index if not exists idx_chapters_pays on public.chapters (pays);
create index if not exists idx_curriculum_sequences_pays on public.curriculum_sequences (pays);
create index if not exists idx_quiz_banks_pays on public.quiz_banks (pays);

-- Une même matière peut exister dans plusieurs pays : la contrainte
-- d'unicité des matières doit inclure le pays.
do $do$
declare
  constraint_name text;
begin
  select conname into constraint_name
  from pg_constraint
  where conrelid = 'public.subjects'::regclass
    and contype = 'u'
    and pg_get_constraintdef(oid) ilike '%niveau_code%'
    and pg_get_constraintdef(oid) ilike '%serie_code%'
  limit 1;

  if constraint_name is not null then
    execute format('alter table public.subjects drop constraint %I', constraint_name);
  end if;
end
$do$;

alter table public.subjects
  drop constraint if exists subjects_niveau_code_serie_code_code_key;

alter table public.subjects
  add constraint subjects_unique_per_pays
  unique (pays, niveau_code, serie_code, code);

-- L'unicité du programme officiel devient (pays, niveau, série, matière) :
-- le même programme peut coexister pour deux pays.
drop index if exists public.curriculum_sequences_unique;
create unique index if not exists curriculum_sequences_unique
  on public.curriculum_sequences (pays, niveau_code, coalesce(serie_code, ''), lower(subject_name));

-- La banque d'exercices est unique par (pays, classe, série, matière).
drop index if exists public.quiz_banks_unique;
create unique index if not exists quiz_banks_unique
  on public.quiz_banks (
    pays,
    niveau_code,
    coalesce(classe, ''),
    coalesce(serie_code, ''),
    lower(subject_name)
  );

-- ------------------------------------------------------------
-- 2. RPC de lecture du programme : filtrage par pays
-- ------------------------------------------------------------
drop function if exists public.get_curriculum_topics(text, text, text);
create or replace function public.get_curriculum_topics(
  p_niveau  text,
  p_serie   text default null,
  p_subject text default null,
  p_pays    text default 'BJ'
)
returns table (
  subject_name text,
  serie_code   text,
  topics       text[]
)
language sql
security definer
stable
set search_path = public
as $fn$
  select
    s.name                            as subject_name,
    s.serie_code,
    array_agg(c.title order by c.num) as topics
  from public.subjects s
  join public.chapters c on c.subject_id = s.id and c.published
  where s.published
    and s.pays = p_pays
    and c.pays = p_pays
    and s.niveau_code = p_niveau
    and (p_serie   is null or s.serie_code = p_serie   or s.serie_code is null)
    and (p_subject is null or s.name       = p_subject)
  group by s.name, s.serie_code
  order by s.name;
$fn$;

grant execute on function public.get_curriculum_topics(text, text, text, text) to anon, authenticated;

-- ------------------------------------------------------------
-- 3. RPC du contenu riche des chapitres : filtrage par pays
-- ------------------------------------------------------------
drop function if exists public.get_curriculum_chapters(text, text, text);
create or replace function public.get_curriculum_chapters(
  p_niveau  text,
  p_serie   text default null,
  p_subject text default null,
  p_pays    text default 'BJ'
)
returns table (
  id                         uuid,
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
  cours                      text,
  exemple_titre              text,
  exemple_enonce             text,
  exemple_solution           text,
  exercice_consigne          text,
  exercice_question          text,
  exercice_type              text,
  exercice_options           jsonb,
  exercice_correct_option    text,
  exercice_explication       text
)
language sql
security definer
stable
set search_path = public
as $fn$
  select
    c.id,
    s.name                          as subject_name,
    s.niveau_code,
    s.serie_code,
    c.num,
    c.title,
    c.sa_label,
    c.classe,
    c.pdf_url,
    c.is_free,
    c.price,
    c.cours,
    c.exemple_titre,
    c.exemple_enonce,
    c.exemple_solution,
    c.exercice_consigne,
    c.exercice_question,
    c.exercice_type,
    c.exercice_options,
    c.exercice_correct_option,
    c.exercice_explication
  from public.subjects s
  join public.chapters c on c.subject_id = s.id
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
-- 4. Programme officiel saisi par l'admin : par pays
-- ------------------------------------------------------------
drop function if exists public.get_curriculum_sequences(text, text, text);
create or replace function public.get_curriculum_sequences(
  p_niveau  text,
  p_serie   text default null,
  p_subject text default null,
  p_pays    text default 'BJ'
)
returns table (
  niveau_code  text,
  serie_code   text,
  subject_name text,
  sequences    text[],
  parts        jsonb,
  source       text,
  updated_at   timestamptz
)
language sql
security definer
stable
set search_path = public
as $fn$
  select
    cs.niveau_code,
    cs.serie_code,
    cs.subject_name,
    cs.sequences,
    cs.parts,
    cs.source,
    cs.updated_at
  from public.curriculum_sequences cs
  where cs.pays = p_pays
    and cs.niveau_code = p_niveau
    and (p_serie   is null or cs.serie_code is null or cs.serie_code = p_serie)
    and (p_subject is null or lower(cs.subject_name) = lower(p_subject))
  order by (cs.serie_code is not null) desc, cs.updated_at desc
  limit 1;
$fn$;

grant execute on function public.get_curriculum_sequences(text, text, text, text) to anon, authenticated;

drop function if exists public.upsert_curriculum_sequences(text, text, text, text[], text, jsonb);
create or replace function public.upsert_curriculum_sequences(
  p_niveau    text,
  p_serie     text default null,
  p_subject   text,
  p_sequences text[],
  p_source    text default 'manuel',
  p_parts     jsonb default null,
  p_pays      text default 'BJ'
)
returns boolean
language plpgsql
security definer
set search_path = public
as $fn$
begin
  if not public.is_admin() then
    raise exception 'Acces reserve aux administrateurs';
  end if;

  if p_subject is null or btrim(p_subject) = '' then
    raise exception 'Matiere obligatoire';
  end if;

  if p_sequences is null or array_length(p_sequences, 1) is null then
    delete from public.curriculum_sequences
    where pays = p_pays
      and niveau_code = p_niveau
      and (p_serie is null or serie_code is null or serie_code = p_serie)
      and lower(subject_name) = lower(p_subject);
    return true;
  end if;

  insert into public.curriculum_sequences
    (pays, niveau_code, serie_code, subject_name, sequences, parts, source, updated_at)
  values
    (p_pays, p_niveau, p_serie, p_subject, p_sequences, p_parts, p_source, now())
  on conflict (pays, niveau_code, coalesce(serie_code, ''), lower(subject_name))
  do update set
    sequences  = excluded.sequences,
    parts      = excluded.parts,
    source     = excluded.source,
    updated_at = now();

  return true;
end;
$fn$;

grant execute on function public.upsert_curriculum_sequences(text, text, text, text[], text, jsonb, text) to authenticated;

-- Suppression du programme officiel : par pays
drop function if exists public.delete_curriculum_sequences(text, text, text);
create or replace function public.delete_curriculum_sequences(
  p_niveau  text,
  p_serie   text default null,
  p_subject text,
  p_pays    text default 'BJ'
)
returns boolean
language plpgsql
security definer
set search_path = public
as $fn$
begin
  if not public.is_admin() then
    raise exception 'Acces reserve aux administrateurs';
  end if;

  delete from public.curriculum_sequences
  where pays = p_pays
    and niveau_code = p_niveau
    and lower(subject_name) = lower(p_subject)
    and coalesce(serie_code, '') = coalesce(nullif(p_serie, ''), '');

  return true;
end;
$fn$;

grant execute on function public.delete_curriculum_sequences(text, text, text, text) to authenticated;

-- ------------------------------------------------------------
-- 5. Banque d'exercices : par pays
-- ------------------------------------------------------------
drop function if exists public.get_quiz_bank(text, text, text, text);
create or replace function public.get_quiz_bank(
  p_niveau  text,
  p_classe  text default null,
  p_serie   text default null,
  p_subject text default null,
  p_pays    text default 'BJ'
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
  where qb.pays = p_pays
    and qb.niveau_code = p_niveau
    and (p_classe  is null or coalesce(qb.classe, '')    = coalesce(p_classe, ''))
    and (p_serie   is null or coalesce(qb.serie_code, '') = coalesce(p_serie, ''))
    and (p_subject is null or lower(qb.subject_name) = lower(p_subject))
  order by qb.updated_at desc
  limit 1;
$fn$;

grant execute on function public.get_quiz_bank(text, text, text, text, text) to anon, authenticated;

drop function if exists public.upsert_quiz_bank(text, text, jsonb, text, text);
create or replace function public.upsert_quiz_bank(
  p_niveau    text,
  p_subject   text,
  p_questions jsonb,
  p_classe    text default null,
  p_serie     text default null,
  p_pays      text default 'BJ'
)
returns boolean
language plpgsql
security definer
set search_path = public
as $fn$
begin
  if not (public.is_admin() or auth.role() = 'service_role') then
    raise exception 'Ecriture reservee au backend ou aux administrateurs';
  end if;

  insert into public.quiz_banks
    (pays, niveau_code, classe, serie_code, subject_name, questions, updated_at)
  values
    (p_pays, p_niveau, p_classe, p_serie, p_subject, p_questions, now())
  on conflict (pays, niveau_code, coalesce(classe, ''), coalesce(serie_code, ''), lower(subject_name))
  do update set
    questions  = excluded.questions,
    updated_at = now();

  return true;
end;
$fn$;

revoke execute on function public.upsert_quiz_bank(text, text, jsonb, text, text, text) from public, anon;
grant execute on function public.upsert_quiz_bank(text, text, jsonb, text, text, text) to authenticated, service_role;

-- ------------------------------------------------------------
-- 6. Pays de l'apprenant (choisi à l'inscription)
-- ------------------------------------------------------------
-- Le pays saisi par l'élève lors de l'inscription est mémorisé dans son
-- profil : à la connexion, le site charge automatiquement le programme,
-- le catalogue et les tarifs de ce pays.
alter table public.profiles
  add column if not exists pays text not null default 'BJ';

create index if not exists idx_profiles_pays on public.profiles (pays);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
declare
  chosen_pays  text;
begin
  -- Le rôle n'est jamais lu dans les métadonnées d'inscription (modifiables
  -- par n'importe qui) : un admin se promeut uniquement en SQL.
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
  );
  return new;
end;
$fn$;

-- ------------------------------------------------------------
-- 7. Vérification
-- ------------------------------------------------------------
-- Le contenu doit être cloisonné : un même chapitre publié pour deux
-- pays doit exister en double (un par pays).
--
--   select pays, count(*) from public.chapters group by pays;
--
-- Tout doit afficher BJ tant qu'aucun autre pays n'est activé.
