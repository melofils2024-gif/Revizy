-- ============================================================
-- Revizy — schema_curriculum.sql
-- Migration : supprime l''ancienne table curriculum (modèle plat)
-- et expose la RPC get_curriculum_topics compatible avec server.js
--
-- ORDRE D'EXÉCUTION OBLIGATOIRE :
--   1. schema.sql
--   2. schema_v2.sql
--   3. schema_curriculum.sql  ← ce fichier
--   4. seed_curriculum.sql
-- ============================================================

-- Suppression de l'ancien modèle plat s'il existe
drop function if exists public.get_curriculum_topics(text, text, text);
drop table if exists public.curriculum cascade;

-- ============================================================
-- RPC get_curriculum_topics
-- Lit les titres de chapitres depuis subjects + chapters (modèle v2)
-- Compatible avec l'appel server.js :
--   supabaseFetch('/rest/v1/rpc/get_curriculum_topics', {
--     p_niveau, p_serie, p_subject
--   })
-- Retourne : [{subject_name, serie_code, topics: ["Titre chap 1", ...]}]
-- ============================================================
create or replace function public.get_curriculum_topics(
  p_niveau  text,
  p_serie   text default null,
  p_subject text default null
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
    s.name                                       as subject_name,
    s.serie_code,
    array_agg(c.title order by c.num)            as topics
  from public.subjects s
  join public.chapters c on c.subject_id = s.id and c.published
  where s.published
    and s.niveau_code = p_niveau
    and (p_serie   is null or s.serie_code = p_serie   or s.serie_code is null)
    and (p_subject is null or s.name       = p_subject)
  group by s.name, s.serie_code
  order by s.name;
$fn$;

grant execute on function public.get_curriculum_topics(text, text, text) to anon, authenticated;
