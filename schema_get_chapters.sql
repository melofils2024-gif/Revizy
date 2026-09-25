-- ============================================================
-- Revizy — schema_get_chapters.sql
-- Nouvelle RPC : get_curriculum_chapters
-- Retourne le contenu RICHE des chapitres (cours, exemple, exercice)
-- depuis la table chapters, pour le frontend (app.js).
--
-- À exécuter APRÈS schema_curriculum.sql + seed_curriculum.sql
-- (donc en dernier, dans le même ordre que les autres migrations).
-- ============================================================

-- La RPC get_curriculum_topics reste en place : elle est utilisée par server.js
-- pour construire le prompt Gemini. On ne la supprime pas.

create or replace function public.get_curriculum_chapters(
  p_niveau  text,
  p_serie   text default null,
  p_subject text default null
)
returns table (
  subject_name              text,
  niveau_code               text,
  serie_code                text,
  num                       integer,
  title                     text,
  sa_label                  text,
  is_free                   boolean,
  price                     integer,
  cours                     text,
  exemple_titre             text,
  exemple_enonce            text,
  exemple_solution          text,
  exercice_consigne         text,
  exercice_question         text,
  exercice_type             text,
  exercice_options          jsonb,
  exercice_correct_option   text,
  exercice_explication      text
)
language sql
security definer
stable
set search_path = public
as $fn$
  select
    s.name                          as subject_name,
    s.niveau_code,
    s.serie_code,
    c.num,
    c.title,
    c.sa_label,
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
    and s.niveau_code = p_niveau
    and (p_serie   is null or s.serie_code = p_serie   or s.serie_code is null)
    and (p_subject is null or s.name       = p_subject)
  order by s.name, c.num;
$fn$;

grant execute on function public.get_curriculum_chapters(text, text, text) to anon, authenticated;

-- Commentaire d'aide
comment on function public.get_curriculum_chapters(text, text, text) is
  'Retourne les chapitres complets (cours + exemple + exercice) pour un niveau/serie/matière. Utilisé par le frontend pour rendre le contenu sans placeholder.';
