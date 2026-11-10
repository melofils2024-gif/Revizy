-- ================================================================
-- Revisy — MIGRATION_17_seed_pays.sql
-- ================================================================
-- Objectif : permettre à la base de « changer automatiquement le
-- programme officiel » selon le pays entré par l'apprenant :
--   • Programme officiel partagé avec d'autres pays qui n'ont pas
--     encore leurs propres programmes nationaux publiantisés —
--     on clone BJ (Bénin) dans les pays qui utilisent le même
--     programme : TG (Togo), CI (Côte d'Ivoire), SN (Sénégal).
--   • Chaque pays reçoit ses propres subject_id ; les chapitres
--     sont numérotés avec un décalage par pays pour ne pas violer
--     chapters(subject_id, num).
--   • Les séquences du programme officiel sont également copiées
--     pour TG, CI, SN (tables curriculum_sequences).
-- Idempotent. Transactionnel. À lancer dans le SQL Editor de
-- Supabase avant/apres MIGRATION_16 (ordre : 16 puis 17).
--
-- IMPORTANT : lancer uniquement sur une instance déjà seedée en
-- MIGRATION_04 (programme Bénin présent). Ajoutez un pays partageant
-- le même programme via DEPLOY.md « Programme officiel par pays ».
-- ================================================================
BEGIN;

-- ------------------------------------------------------------------
-- 0) Matières propres à chaque pays (on évite les collisions sur
--    l'unicité (pays, niveau_code, serie_code, code)).
-- ------------------------------------------------------------------
INSERT INTO public.subjects (pays, code, name, icon, description, niveau_code, serie_code, display_order, published)
SELECT 'TG'::text, code, name, icon, coalesce(description, ''), niveau_code, serie_code, display_order, true
FROM public.subjects WHERE pays='BJ'
ON CONFLICT (pays, niveau_code, serie_code, code) DO NOTHING;

INSERT INTO public.subjects (pays, code, name, icon, description, niveau_code, serie_code, display_order, published)
SELECT 'CI'::text, code, name, icon, coalesce(description, ''), niveau_code, serie_code, display_order, true
FROM public.subjects WHERE pays='BJ'
ON CONFLICT (pays, niveau_code, serie_code, code) DO NOTHING;

INSERT INTO public.subjects (pays, code, name, icon, description, niveau_code, serie_code, display_order, published)
SELECT 'SN'::text, code, name, icon, coalesce(description, ''), niveau_code, serie_code, display_order, true
FROM public.subjects WHERE pays='BJ'
ON CONFLICT (pays, niveau_code, serie_code, code) DO NOTHING;

-- ------------------------------------------------------------------
-- 1) Chapitres : un subject_id propre par pays, num décalés
--    par pays (TG:+20000, CI:+40000, SN:+60000) pour respecter
--    l'unicité (subject_id, num).
--    Le slug est distinct (suffixe ~PAYS) pour respecter UNIQUE.
-- ------------------------------------------------------------------

-- TG
CREATE TEMP TABLE __map_tg ON COMMIT DROP AS
SELECT sNew.id AS new_id, sBJ.id AS old_id
FROM public.subjects sNew
JOIN public.subjects sBJ
  ON sNew.code = sBJ.code AND sNew.niveau_code = sBJ.niveau_code
 AND coalesce(sNew.serie_code,'') = coalesce(sBJ.serie_code,'')
WHERE sNew.pays='TG';
INSERT INTO public.chapters (subject_id, pays, slug, num, title, sa_label, classe, pdf_url,
  is_free, price, cours, exemple_titre, exemple_enonce, exemple_solution,
  exercice_consigne, exercice_question, exercice_type, exercice_options, correct_option, explication, published)
SELECT m.new_id, 'TG'::text, c.slug || '~TG'::text, c.num + 20000, c.title, c.sa_label, c.classe, c.pdf_url,
  c.is_free, c.price, c.cours, c.exemple_titre, c.exemple_enonce, c.exemple_solution,
  c.exercice_consigne, c.exercice_question, c.exercice_type, c.exercice_options, c.correct_option, c.explication,
  coalesce(c.published, true)
FROM public.chapters c JOIN __map_tg m ON m.old_id = c.subject_id
WHERE c.pays='BJ';

-- CI
CREATE TEMP TABLE __map_ci ON COMMIT DROP AS
SELECT sNew.id AS new_id, sBJ.id AS old_id
FROM public.subjects sNew
JOIN public.subjects sBJ
  ON sNew.code = sBJ.code AND sNew.niveau_code = sBJ.niveau_code
 AND coalesce(sNew.serie_code,'') = coalesce(sBJ.serie_code,'')
WHERE sNew.pays='CI';
INSERT INTO public.chapters (subject_id, pays, slug, num, title, sa_label, classe, pdf_url,
  is_free, price, cours, exemple_titre, exemple_enonce, exemple_solution,
  exercice_consigne, exercice_question, exercice_type, exercice_options, correct_option, explication, published)
SELECT m.new_id, 'CI'::text, c.slug || '~CI'::text, c.num + 40000, c.title, c.sa_label, c.classe, c.pdf_url,
  c.is_free, c.price, c.cours, c.exemple_titre, c.exemple_enonce, c.exemple_solution,
  c.exercice_consigne, c.exercice_question, c.exercice_type, c.exercice_options, c.correct_option, c.explication,
  coalesce(c.published, true)
FROM public.chapters c JOIN __map_ci m ON m.old_id = c.subject_id
WHERE c.pays='BJ';

-- SN
CREATE TEMP TABLE __map_sn ON COMMIT DROP AS
SELECT sNew.id AS new_id, sBJ.id AS old_id
FROM public.subjects sNew
JOIN public.subjects sBJ
  ON sNew.code = sBJ.code AND sNew.niveau_code = sBJ.niveau_code
 AND coalesce(sNew.serie_code,'') = coalesce(sBJ.serie_code,'')
WHERE sNew.pays='SN';
INSERT INTO public.chapters (subject_id, pays, slug, num, title, sa_label, classe, pdf_url,
  is_free, price, cours, exemple_titre, exemple_enonce, exemple_solution,
  exercice_consigne, exercice_question, exercice_type, exercice_options, correct_option, explication, published)
SELECT m.new_id, 'SN'::text, c.slug || '~SN'::text, c.num + 60000, c.title, c.sa_label, c.classe, c.pdf_url,
  c.is_free, c.price, c.cours, c.exemple_titre, c.exemple_enonce, c.exemple_solution,
  c.exercice_consigne, c.exercice_question, c.exercice_type, c.exercice_options, c.correct_option, c.explication,
  coalesce(c.published, true)
FROM public.chapters c JOIN __map_sn m ON m.old_id = c.subject_id
WHERE c.pays='BJ';

-- ------------------------------------------------------------------
-- 2) Séquences du programme officiel : on copie les (niveau, série,
--     matière) du Bénin dans les pays partagés.
--     L'index d'unicité est sur (pays, niveau_code, coalesce(serie_code,''), lower(subject_name)).
--     ON CONFLICT DO NOTHING reste sans cible prudente (évite une erreur de syntaxe).
-- ------------------------------------------------------------------
INSERT INTO public.curriculum_sequences (pays, niveau_code, serie_code, subject_name, sequences, source, updated_at)
SELECT 'TG'::text, sBJ.niveau_code, sBJ.serie_code, sbj.name, s.sequences, coalesce(s.source, 'manuel'), now()
FROM public.curriculum_sequences s
JOIN public.subjects sbj ON sbj.pays='BJ' AND sbj.name = s.subject_name
JOIN public.subjects stg ON stg.pays='TG' AND stg.code = sbj.code AND stg.niveau_code = sbj.niveau_code
  AND coalesce(stg.serie_code,'') = coalesce(sbj.serie_code,'')
ON CONFLICT DO NOTHING;

INSERT INTO public.curriculum_sequences (pays, niveau_code, serie_code, subject_name, sequences, source, updated_at)
SELECT 'CI'::text, sBJ.niveau_code, sBJ.serie_code, sbj.name, s.sequences, coalesce(s.source, 'manuel'), now()
FROM public.curriculum_sequences s
JOIN public.subjects sbj ON sbj.pays='BJ' AND sbj.name = s.subject_name
JOIN public.subjects sci ON sci.pays='CI' AND sci.code = sbj.code AND sci.niveau_code = sbj.niveau_code
  AND coalesce(sci.serie_code,'') = coalesce(sbj.serie_code,'')
ON CONFLICT DO NOTHING;

INSERT INTO public.curriculum_sequences (pays, niveau_code, serie_code, subject_name, sequences, source, updated_at)
SELECT 'SN'::text, sBJ.niveau_code, sBJ.serie_code, sbj.name, s.sequences, coalesce(s.source, 'manuel'), now()
FROM public.curriculum_sequences s
JOIN public.subjects sbj ON sbj.pays='BJ' AND sbj.name = s.subject_name
JOIN public.subjects ssn ON ssn.pays='SN' AND ssn.code = sbj.code AND ssn.niveau_code = sbj.niveau_code
  AND coalesce(ssn.serie_code,'') = coalesce(sbj.serie_code,'')
ON CONFLICT DO NOTHING;

COMMIT;
