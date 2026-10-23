-- ============================================================
-- Revizy — schema_exercices.sql
-- 30 QCM / Vrai-Faux par chapitre.
--
-- Les exercices d'un chapitre sont générés par l'IA une première fois
-- (POST /v1/ai/chapter-exercises) puis conservés dans la colonne
-- `exercices` : ils sont ainsi partagés par tous les élèves du pays
-- et ne consomment le quota IA qu'une seule fois par chapitre.
--
-- À exécuter APRÈS schema_pays.sql.
-- ============================================================

alter table public.chapters
  add column if not exists exercices jsonb not null default '[]'::jsonb;

-- ── Relecture du contenu des chapitres, avec les exercices ───────
drop function if exists public.get_curriculum_chapters(text, text, text, text);
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
    c.exercice_explication,
    coalesce(c.exercices, '[]'::jsonb) as exercices
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

-- ── Vérification ─────────────────────────────────────────────────
-- Après avoir généré les exercices d'un chapitre :
--
--   select slug, jsonb_array_length(exercices) as nb
--   from public.chapters
--   where jsonb_array_length(exercices) > 0;
--
-- Le compteur doit monter à 30 pour les chapitres traités.
