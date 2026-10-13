-- ============================================================
-- Revizy — schema_programme.sql
-- Permet à l'admin de saisir (ou faire générer par l'IA) les
-- titres des parties clés / séquences du programme officiel,
-- afin que les cours soient automatiquement construits dessus.
--
-- ORDRE D'EXÉCUTION :
--   1. schema.sql
--   2. schema_v2.sql
--   3. schema_curriculum.sql
--   4. seed_curriculum.sql
--   5. schema_programme.sql   ← ce fichier
-- ============================================================

-- ------------------------------------------------------------
-- 1. Table des séquences du programme
--    Une ligne par (niveau, série, matière).
--    serie_code null = valable pour toutes les séries.
-- ------------------------------------------------------------
create table if not exists public.curriculum_sequences (
  id            uuid primary key default gen_random_uuid(),
  niveau_code   text not null,
  serie_code    text,
  subject_name  text not null,
  sequences     text[] not null default '{}',
  source        text not null default 'manuel',  -- 'manuel' | 'ia'
  updated_at    timestamptz not null default now()
);

create unique index if not exists curriculum_sequences_unique
  on public.curriculum_sequences (niveau_code, coalesce(serie_code, ''), lower(subject_name));

-- ------------------------------------------------------------
-- 2. Lecture : utilisée par server.js pour construire les cours
-- ------------------------------------------------------------
create or replace function public.get_curriculum_sequences(
  p_niveau  text,
  p_serie   text default null,
  p_subject text default null
)
returns table (
  niveau_code  text,
  serie_code   text,
  subject_name text,
  sequences    text[],
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
    cs.source,
    cs.updated_at
  from public.curriculum_sequences cs
  where cs.niveau_code = p_niveau
    and (p_serie   is null or cs.serie_code is null or cs.serie_code = p_serie)
    and (p_subject is null or lower(cs.subject_name) = lower(p_subject))
  order by (cs.serie_code is not null) desc, cs.updated_at desc
  limit 1;
$fn$;

grant execute on function public.get_curriculum_sequences(text, text, text) to anon, authenticated;

-- ------------------------------------------------------------
-- 3. Écriture : réservée aux administrateurs
-- ------------------------------------------------------------
create or replace function public.upsert_curriculum_sequences(
  p_niveau    text,
  p_serie     text default null,
  p_subject   text,
  p_sequences text[],
  p_source    text default 'manuel'
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
    where niveau_code = p_niveau
      and lower(subject_name) = lower(p_subject)
      and coalesce(serie_code, '') = coalesce(nullif(p_serie, ''), '');
    return true;
  end if;

  insert into public.curriculum_sequences (niveau_code, serie_code, subject_name, sequences, source, updated_at)
  values (p_niveau, nullif(btrim(p_serie), ''), btrim(p_subject),
          array(select btrim(x) from unnest(p_sequences) x where btrim(x) <> ''),
          coalesce(p_source, 'manuel'), now())
  on conflict (niveau_code, coalesce(serie_code, ''), lower(subject_name))
  do update set
    sequences  = excluded.sequences,
    source     = excluded.source,
    updated_at = now();

  return true;
end;
$fn$;

grant execute on function public.upsert_curriculum_sequences(text, text, text, text[], text) to authenticated;

-- ------------------------------------------------------------
-- 4. Suppression
-- ------------------------------------------------------------
create or replace function public.delete_curriculum_sequences(
  p_niveau  text,
  p_serie   text default null,
  p_subject text
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
  where niveau_code = p_niveau
    and lower(subject_name) = lower(p_subject)
    and coalesce(serie_code, '') = coalesce(nullif(p_serie, ''), '');

  return true;
end;
$fn$;

grant execute on function public.delete_curriculum_sequences(text, text, text) to authenticated;

-- ------------------------------------------------------------
-- 5. RLS : lecture ouverte (anon/authenticated), écriture admin
-- ------------------------------------------------------------
alter table public.curriculum_sequences enable row level security;

drop policy if exists curriculum_sequences_read on public.curriculum_sequences;
create policy curriculum_sequences_read
  on public.curriculum_sequences
  for select
  to anon, authenticated
  using (true);

drop policy if exists curriculum_sequences_admin_write on public.curriculum_sequences;
create policy curriculum_sequences_admin_write
  on public.curriculum_sequences
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());