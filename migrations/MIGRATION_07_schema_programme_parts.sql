-- ============================================================
-- Revizy — schema_programme_parts.sql
-- Programme officiel structuré : SA (situations d'apprentissage)
-- + chapitres numérotés, saisis par l'admin.
--
-- À exécuter après schema_programme.sql (ou fusionné avec lui).
-- ============================================================

-- 1. Colonne structurée (en plus des séquences simples)
alter table public.curriculum_sequences add column if not exists parts jsonb;

-- 2. La lecture renvoie aussi les parts
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
  where cs.niveau_code = p_niveau
    and (p_serie   is null or cs.serie_code is null or cs.serie_code = p_serie)
    and (p_subject is null or lower(cs.subject_name) = lower(p_subject))
  order by (cs.serie_code is not null) desc, cs.updated_at desc
  limit 1;
$fn$;

grant execute on function public.get_curriculum_sequences(text, text, text) to anon, authenticated;

-- 3. Écriture avec la structure SA + chapitres
create or replace function public.upsert_curriculum_sequences(
  p_niveau    text,
  p_serie     text default null,
  p_subject   text,
  p_sequences text[],
  p_source    text default 'manuel',
  p_parts     jsonb default null
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

  insert into public.curriculum_sequences
    (niveau_code, serie_code, subject_name, sequences, parts, source, updated_at)
  values (
    p_niveau,
    nullif(btrim(p_serie), ''),
    btrim(p_subject),
    array(select btrim(x) from unnest(p_sequences) x where btrim(x) <> ''),
    p_parts,
    coalesce(p_source, 'manuel'),
    now()
  )
  on conflict (niveau_code, coalesce(serie_code, ''), lower(subject_name))
  do update set
    sequences  = excluded.sequences,
    parts      = excluded.parts,
    source     = excluded.source,
    updated_at = now();

  return true;
end;
$fn$;

grant execute on function public.upsert_curriculum_sequences(text, text, text, text[], text, jsonb) to authenticated;