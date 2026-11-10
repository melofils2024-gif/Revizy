-- ==========================================================================
-- Revizy — MIGRATION_18_programmes_offeres.sql
-- ==========================================================================
-- Objectif : cloner le modèle générique de révision (issu du Bénin et déjà
-- appliqué pour TG/CI/SN avec MIGRATION_17) dans tous les pays Africain,
-- Européen et Américain proposé par Revizy (contexts.js → PAYS_DISPONIBLES).
-- En utilisant p_pays dans toute la base, sélectionner son pays charge donc
-- automatiquement les matières, chapitres et séquences de son programme.

-- ATTENTION HONNÊTETÉ : la source de chaque clone est « revizy_generic ».
-- Il ne s agit PAS du programme officiel national authentique de ces pays.
-- Administrer « Programme officiel <PAYS> » dans Supabase (après validation
-- avec les établissements concernés) reste la voie propre.

-- Idempotent. Transactionnel. À ajouter à migrations/LISEZ-MOI.md après
-- MIGRATION_17_seed_pays.sql.
-- ==========================================================================
BEGIN;

-- BF
-- Matières
INSERT INTO public.subjects (pays, code, name, icon, description, niveau_code, serie_code, display_order, published)
SELECT 'BF'::text, code, name, icon, coalesce(description, ''), niveau_code, serie_code, display_order, true
FROM public.subjects WHERE pays='BJ' ON CONFLICT (pays, niveau_code, serie_code, code) DO NOTHING;
-- Chapitres (offset 300000 sur le BJ)
CREATE TEMP TABLE __map_BF ON COMMIT DROP AS
  SELECT sNew.id AS new_id, sBJ.id AS old_id
  FROM public.subjects sNew
  JOIN public.subjects sBJ
    ON sNew.code = sBJ.code AND sNew.niveau_code = sBJ.niveau_code
     AND coalesce(sNew.serie_code, '') = coalesce(sBJ.serie_code, '')
 WHERE sNew.pays='BF';
INSERT INTO public.chapters (subject_id, pays, slug, num, title, sa_label, classe, pdf_url,
  is_free, price, cours, exemple_titre, exemple_enonce, exemple_solution,
  exercice_consigne, exercice_question, exercice_type, exercice_options, correct_option, explication, published)
SELECT m.new_id, 'BF'::text,
       c.slug || '~' || lower('BF'),
       c.num + 300000,
       c.title, c.sa_label, c.classe, c.pdf_url, c.is_free, c.price, c.cours,
       c.exemple_titre, c.exemple_enonce, c.exemple_solution,
       c.exercice_consigne, c.exercice_question, c.exercice_type,
       c.exercice_options, c.correct_option, c.explication,
       coalesce(c.published, true)
  FROM public.chapters c JOIN __map_BF m ON m.old_id = c.subject_id
 WHERE c.pays='BJ';
DROP TABLE __map_BF;
-- Séquences (Revizy-générique, pas de provenance nationale officieuse)
INSERT INTO public.curriculum_sequences (pays, niveau_code, serie_code, subject_name, sequences, source, updated_at)
SELECT 'BF'::text, s.niveau_code, s.serie_code, s.subject_name, s.sequences,
       'revizy_generic', now()
FROM public.curriculum_sequences s
 WHERE s.pays='BJ'
ON CONFLICT DO NOTHING;

-- ML
-- Matières
INSERT INTO public.subjects (pays, code, name, icon, description, niveau_code, serie_code, display_order, published)
SELECT 'ML'::text, code, name, icon, coalesce(description, ''), niveau_code, serie_code, display_order, true
FROM public.subjects WHERE pays='BJ' ON CONFLICT (pays, niveau_code, serie_code, code) DO NOTHING;
-- Chapitres (offset 400000 sur le BJ)
CREATE TEMP TABLE __map_ML ON COMMIT DROP AS
  SELECT sNew.id AS new_id, sBJ.id AS old_id
  FROM public.subjects sNew
  JOIN public.subjects sBJ
    ON sNew.code = sBJ.code AND sNew.niveau_code = sBJ.niveau_code
     AND coalesce(sNew.serie_code, '') = coalesce(sBJ.serie_code, '')
 WHERE sNew.pays='ML';
INSERT INTO public.chapters (subject_id, pays, slug, num, title, sa_label, classe, pdf_url,
  is_free, price, cours, exemple_titre, exemple_enonce, exemple_solution,
  exercice_consigne, exercice_question, exercice_type, exercice_options, correct_option, explication, published)
SELECT m.new_id, 'ML'::text,
       c.slug || '~' || lower('ML'),
       c.num + 400000,
       c.title, c.sa_label, c.classe, c.pdf_url, c.is_free, c.price, c.cours,
       c.exemple_titre, c.exemple_enonce, c.exemple_solution,
       c.exercice_consigne, c.exercice_question, c.exercice_type,
       c.exercice_options, c.correct_option, c.explication,
       coalesce(c.published, true)
  FROM public.chapters c JOIN __map_ML m ON m.old_id = c.subject_id
 WHERE c.pays='BJ';
DROP TABLE __map_ML;
-- Séquences (Revizy-générique, pas de provenance nationale officieuse)
INSERT INTO public.curriculum_sequences (pays, niveau_code, serie_code, subject_name, sequences, source, updated_at)
SELECT 'ML'::text, s.niveau_code, s.serie_code, s.subject_name, s.sequences,
       'revizy_generic', now()
FROM public.curriculum_sequences s
 WHERE s.pays='BJ'
ON CONFLICT DO NOTHING;

-- NE
-- Matières
INSERT INTO public.subjects (pays, code, name, icon, description, niveau_code, serie_code, display_order, published)
SELECT 'NE'::text, code, name, icon, coalesce(description, ''), niveau_code, serie_code, display_order, true
FROM public.subjects WHERE pays='BJ' ON CONFLICT (pays, niveau_code, serie_code, code) DO NOTHING;
-- Chapitres (offset 500000 sur le BJ)
CREATE TEMP TABLE __map_NE ON COMMIT DROP AS
  SELECT sNew.id AS new_id, sBJ.id AS old_id
  FROM public.subjects sNew
  JOIN public.subjects sBJ
    ON sNew.code = sBJ.code AND sNew.niveau_code = sBJ.niveau_code
     AND coalesce(sNew.serie_code, '') = coalesce(sBJ.serie_code, '')
 WHERE sNew.pays='NE';
INSERT INTO public.chapters (subject_id, pays, slug, num, title, sa_label, classe, pdf_url,
  is_free, price, cours, exemple_titre, exemple_enonce, exemple_solution,
  exercice_consigne, exercice_question, exercice_type, exercice_options, correct_option, explication, published)
SELECT m.new_id, 'NE'::text,
       c.slug || '~' || lower('NE'),
       c.num + 500000,
       c.title, c.sa_label, c.classe, c.pdf_url, c.is_free, c.price, c.cours,
       c.exemple_titre, c.exemple_enonce, c.exemple_solution,
       c.exercice_consigne, c.exercice_question, c.exercice_type,
       c.exercice_options, c.correct_option, c.explication,
       coalesce(c.published, true)
  FROM public.chapters c JOIN __map_NE m ON m.old_id = c.subject_id
 WHERE c.pays='BJ';
DROP TABLE __map_NE;
-- Séquences (Revizy-générique, pas de provenance nationale officieuse)
INSERT INTO public.curriculum_sequences (pays, niveau_code, serie_code, subject_name, sequences, source, updated_at)
SELECT 'NE'::text, s.niveau_code, s.serie_code, s.subject_name, s.sequences,
       'revizy_generic', now()
FROM public.curriculum_sequences s
 WHERE s.pays='BJ'
ON CONFLICT DO NOTHING;

-- GN
-- Matières
INSERT INTO public.subjects (pays, code, name, icon, description, niveau_code, serie_code, display_order, published)
SELECT 'GN'::text, code, name, icon, coalesce(description, ''), niveau_code, serie_code, display_order, true
FROM public.subjects WHERE pays='BJ' ON CONFLICT (pays, niveau_code, serie_code, code) DO NOTHING;
-- Chapitres (offset 600000 sur le BJ)
CREATE TEMP TABLE __map_GN ON COMMIT DROP AS
  SELECT sNew.id AS new_id, sBJ.id AS old_id
  FROM public.subjects sNew
  JOIN public.subjects sBJ
    ON sNew.code = sBJ.code AND sNew.niveau_code = sBJ.niveau_code
     AND coalesce(sNew.serie_code, '') = coalesce(sBJ.serie_code, '')
 WHERE sNew.pays='GN';
INSERT INTO public.chapters (subject_id, pays, slug, num, title, sa_label, classe, pdf_url,
  is_free, price, cours, exemple_titre, exemple_enonce, exemple_solution,
  exercice_consigne, exercice_question, exercice_type, exercice_options, correct_option, explication, published)
SELECT m.new_id, 'GN'::text,
       c.slug || '~' || lower('GN'),
       c.num + 600000,
       c.title, c.sa_label, c.classe, c.pdf_url, c.is_free, c.price, c.cours,
       c.exemple_titre, c.exemple_enonce, c.exemple_solution,
       c.exercice_consigne, c.exercice_question, c.exercice_type,
       c.exercice_options, c.correct_option, c.explication,
       coalesce(c.published, true)
  FROM public.chapters c JOIN __map_GN m ON m.old_id = c.subject_id
 WHERE c.pays='BJ';
DROP TABLE __map_GN;
-- Séquences (Revizy-générique, pas de provenance nationale officieuse)
INSERT INTO public.curriculum_sequences (pays, niveau_code, serie_code, subject_name, sequences, source, updated_at)
SELECT 'GN'::text, s.niveau_code, s.serie_code, s.subject_name, s.sequences,
       'revizy_generic', now()
FROM public.curriculum_sequences s
 WHERE s.pays='BJ'
ON CONFLICT DO NOTHING;

-- GW
-- Matières
INSERT INTO public.subjects (pays, code, name, icon, description, niveau_code, serie_code, display_order, published)
SELECT 'GW'::text, code, name, icon, coalesce(description, ''), niveau_code, serie_code, display_order, true
FROM public.subjects WHERE pays='BJ' ON CONFLICT (pays, niveau_code, serie_code, code) DO NOTHING;
-- Chapitres (offset 700000 sur le BJ)
CREATE TEMP TABLE __map_GW ON COMMIT DROP AS
  SELECT sNew.id AS new_id, sBJ.id AS old_id
  FROM public.subjects sNew
  JOIN public.subjects sBJ
    ON sNew.code = sBJ.code AND sNew.niveau_code = sBJ.niveau_code
     AND coalesce(sNew.serie_code, '') = coalesce(sBJ.serie_code, '')
 WHERE sNew.pays='GW';
INSERT INTO public.chapters (subject_id, pays, slug, num, title, sa_label, classe, pdf_url,
  is_free, price, cours, exemple_titre, exemple_enonce, exemple_solution,
  exercice_consigne, exercice_question, exercice_type, exercice_options, correct_option, explication, published)
SELECT m.new_id, 'GW'::text,
       c.slug || '~' || lower('GW'),
       c.num + 700000,
       c.title, c.sa_label, c.classe, c.pdf_url, c.is_free, c.price, c.cours,
       c.exemple_titre, c.exemple_enonce, c.exemple_solution,
       c.exercice_consigne, c.exercice_question, c.exercice_type,
       c.exercice_options, c.correct_option, c.explication,
       coalesce(c.published, true)
  FROM public.chapters c JOIN __map_GW m ON m.old_id = c.subject_id
 WHERE c.pays='BJ';
DROP TABLE __map_GW;
-- Séquences (Revizy-générique, pas de provenance nationale officieuse)
INSERT INTO public.curriculum_sequences (pays, niveau_code, serie_code, subject_name, sequences, source, updated_at)
SELECT 'GW'::text, s.niveau_code, s.serie_code, s.subject_name, s.sequences,
       'revizy_generic', now()
FROM public.curriculum_sequences s
 WHERE s.pays='BJ'
ON CONFLICT DO NOTHING;

-- GM
-- Matières
INSERT INTO public.subjects (pays, code, name, icon, description, niveau_code, serie_code, display_order, published)
SELECT 'GM'::text, code, name, icon, coalesce(description, ''), niveau_code, serie_code, display_order, true
FROM public.subjects WHERE pays='BJ' ON CONFLICT (pays, niveau_code, serie_code, code) DO NOTHING;
-- Chapitres (offset 800000 sur le BJ)
CREATE TEMP TABLE __map_GM ON COMMIT DROP AS
  SELECT sNew.id AS new_id, sBJ.id AS old_id
  FROM public.subjects sNew
  JOIN public.subjects sBJ
    ON sNew.code = sBJ.code AND sNew.niveau_code = sBJ.niveau_code
     AND coalesce(sNew.serie_code, '') = coalesce(sBJ.serie_code, '')
 WHERE sNew.pays='GM';
INSERT INTO public.chapters (subject_id, pays, slug, num, title, sa_label, classe, pdf_url,
  is_free, price, cours, exemple_titre, exemple_enonce, exemple_solution,
  exercice_consigne, exercice_question, exercice_type, exercice_options, correct_option, explication, published)
SELECT m.new_id, 'GM'::text,
       c.slug || '~' || lower('GM'),
       c.num + 800000,
       c.title, c.sa_label, c.classe, c.pdf_url, c.is_free, c.price, c.cours,
       c.exemple_titre, c.exemple_enonce, c.exemple_solution,
       c.exercice_consigne, c.exercice_question, c.exercice_type,
       c.exercice_options, c.correct_option, c.explication,
       coalesce(c.published, true)
  FROM public.chapters c JOIN __map_GM m ON m.old_id = c.subject_id
 WHERE c.pays='BJ';
DROP TABLE __map_GM;
-- Séquences (Revizy-générique, pas de provenance nationale officieuse)
INSERT INTO public.curriculum_sequences (pays, niveau_code, serie_code, subject_name, sequences, source, updated_at)
SELECT 'GM'::text, s.niveau_code, s.serie_code, s.subject_name, s.sequences,
       'revizy_generic', now()
FROM public.curriculum_sequences s
 WHERE s.pays='BJ'
ON CONFLICT DO NOTHING;

-- LR
-- Matières
INSERT INTO public.subjects (pays, code, name, icon, description, niveau_code, serie_code, display_order, published)
SELECT 'LR'::text, code, name, icon, coalesce(description, ''), niveau_code, serie_code, display_order, true
FROM public.subjects WHERE pays='BJ' ON CONFLICT (pays, niveau_code, serie_code, code) DO NOTHING;
-- Chapitres (offset 900000 sur le BJ)
CREATE TEMP TABLE __map_LR ON COMMIT DROP AS
  SELECT sNew.id AS new_id, sBJ.id AS old_id
  FROM public.subjects sNew
  JOIN public.subjects sBJ
    ON sNew.code = sBJ.code AND sNew.niveau_code = sBJ.niveau_code
     AND coalesce(sNew.serie_code, '') = coalesce(sBJ.serie_code, '')
 WHERE sNew.pays='LR';
INSERT INTO public.chapters (subject_id, pays, slug, num, title, sa_label, classe, pdf_url,
  is_free, price, cours, exemple_titre, exemple_enonce, exemple_solution,
  exercice_consigne, exercice_question, exercice_type, exercice_options, correct_option, explication, published)
SELECT m.new_id, 'LR'::text,
       c.slug || '~' || lower('LR'),
       c.num + 900000,
       c.title, c.sa_label, c.classe, c.pdf_url, c.is_free, c.price, c.cours,
       c.exemple_titre, c.exemple_enonce, c.exemple_solution,
       c.exercice_consigne, c.exercice_question, c.exercice_type,
       c.exercice_options, c.correct_option, c.explication,
       coalesce(c.published, true)
  FROM public.chapters c JOIN __map_LR m ON m.old_id = c.subject_id
 WHERE c.pays='BJ';
DROP TABLE __map_LR;
-- Séquences (Revizy-générique, pas de provenance nationale officieuse)
INSERT INTO public.curriculum_sequences (pays, niveau_code, serie_code, subject_name, sequences, source, updated_at)
SELECT 'LR'::text, s.niveau_code, s.serie_code, s.subject_name, s.sequences,
       'revizy_generic', now()
FROM public.curriculum_sequences s
 WHERE s.pays='BJ'
ON CONFLICT DO NOTHING;

-- SL
-- Matières
INSERT INTO public.subjects (pays, code, name, icon, description, niveau_code, serie_code, display_order, published)
SELECT 'SL'::text, code, name, icon, coalesce(description, ''), niveau_code, serie_code, display_order, true
FROM public.subjects WHERE pays='BJ' ON CONFLICT (pays, niveau_code, serie_code, code) DO NOTHING;
-- Chapitres (offset 1000000 sur le BJ)
CREATE TEMP TABLE __map_SL ON COMMIT DROP AS
  SELECT sNew.id AS new_id, sBJ.id AS old_id
  FROM public.subjects sNew
  JOIN public.subjects sBJ
    ON sNew.code = sBJ.code AND sNew.niveau_code = sBJ.niveau_code
     AND coalesce(sNew.serie_code, '') = coalesce(sBJ.serie_code, '')
 WHERE sNew.pays='SL';
INSERT INTO public.chapters (subject_id, pays, slug, num, title, sa_label, classe, pdf_url,
  is_free, price, cours, exemple_titre, exemple_enonce, exemple_solution,
  exercice_consigne, exercice_question, exercice_type, exercice_options, correct_option, explication, published)
SELECT m.new_id, 'SL'::text,
       c.slug || '~' || lower('SL'),
       c.num + 1000000,
       c.title, c.sa_label, c.classe, c.pdf_url, c.is_free, c.price, c.cours,
       c.exemple_titre, c.exemple_enonce, c.exemple_solution,
       c.exercice_consigne, c.exercice_question, c.exercice_type,
       c.exercice_options, c.correct_option, c.explication,
       coalesce(c.published, true)
  FROM public.chapters c JOIN __map_SL m ON m.old_id = c.subject_id
 WHERE c.pays='BJ';
DROP TABLE __map_SL;
-- Séquences (Revizy-générique, pas de provenance nationale officieuse)
INSERT INTO public.curriculum_sequences (pays, niveau_code, serie_code, subject_name, sequences, source, updated_at)
SELECT 'SL'::text, s.niveau_code, s.serie_code, s.subject_name, s.sequences,
       'revizy_generic', now()
FROM public.curriculum_sequences s
 WHERE s.pays='BJ'
ON CONFLICT DO NOTHING;

-- NG
-- Matières
INSERT INTO public.subjects (pays, code, name, icon, description, niveau_code, serie_code, display_order, published)
SELECT 'NG'::text, code, name, icon, coalesce(description, ''), niveau_code, serie_code, display_order, true
FROM public.subjects WHERE pays='BJ' ON CONFLICT (pays, niveau_code, serie_code, code) DO NOTHING;
-- Chapitres (offset 1100000 sur le BJ)
CREATE TEMP TABLE __map_NG ON COMMIT DROP AS
  SELECT sNew.id AS new_id, sBJ.id AS old_id
  FROM public.subjects sNew
  JOIN public.subjects sBJ
    ON sNew.code = sBJ.code AND sNew.niveau_code = sBJ.niveau_code
     AND coalesce(sNew.serie_code, '') = coalesce(sBJ.serie_code, '')
 WHERE sNew.pays='NG';
INSERT INTO public.chapters (subject_id, pays, slug, num, title, sa_label, classe, pdf_url,
  is_free, price, cours, exemple_titre, exemple_enonce, exemple_solution,
  exercice_consigne, exercice_question, exercice_type, exercice_options, correct_option, explication, published)
SELECT m.new_id, 'NG'::text,
       c.slug || '~' || lower('NG'),
       c.num + 1100000,
       c.title, c.sa_label, c.classe, c.pdf_url, c.is_free, c.price, c.cours,
       c.exemple_titre, c.exemple_enonce, c.exemple_solution,
       c.exercice_consigne, c.exercice_question, c.exercice_type,
       c.exercice_options, c.correct_option, c.explication,
       coalesce(c.published, true)
  FROM public.chapters c JOIN __map_NG m ON m.old_id = c.subject_id
 WHERE c.pays='BJ';
DROP TABLE __map_NG;
-- Séquences (Revizy-générique, pas de provenance nationale officieuse)
INSERT INTO public.curriculum_sequences (pays, niveau_code, serie_code, subject_name, sequences, source, updated_at)
SELECT 'NG'::text, s.niveau_code, s.serie_code, s.subject_name, s.sequences,
       'revizy_generic', now()
FROM public.curriculum_sequences s
 WHERE s.pays='BJ'
ON CONFLICT DO NOTHING;

-- GH
-- Matières
INSERT INTO public.subjects (pays, code, name, icon, description, niveau_code, serie_code, display_order, published)
SELECT 'GH'::text, code, name, icon, coalesce(description, ''), niveau_code, serie_code, display_order, true
FROM public.subjects WHERE pays='BJ' ON CONFLICT (pays, niveau_code, serie_code, code) DO NOTHING;
-- Chapitres (offset 1200000 sur le BJ)
CREATE TEMP TABLE __map_GH ON COMMIT DROP AS
  SELECT sNew.id AS new_id, sBJ.id AS old_id
  FROM public.subjects sNew
  JOIN public.subjects sBJ
    ON sNew.code = sBJ.code AND sNew.niveau_code = sBJ.niveau_code
     AND coalesce(sNew.serie_code, '') = coalesce(sBJ.serie_code, '')
 WHERE sNew.pays='GH';
INSERT INTO public.chapters (subject_id, pays, slug, num, title, sa_label, classe, pdf_url,
  is_free, price, cours, exemple_titre, exemple_enonce, exemple_solution,
  exercice_consigne, exercice_question, exercice_type, exercice_options, correct_option, explication, published)
SELECT m.new_id, 'GH'::text,
       c.slug || '~' || lower('GH'),
       c.num + 1200000,
       c.title, c.sa_label, c.classe, c.pdf_url, c.is_free, c.price, c.cours,
       c.exemple_titre, c.exemple_enonce, c.exemple_solution,
       c.exercice_consigne, c.exercice_question, c.exercice_type,
       c.exercice_options, c.correct_option, c.explication,
       coalesce(c.published, true)
  FROM public.chapters c JOIN __map_GH m ON m.old_id = c.subject_id
 WHERE c.pays='BJ';
DROP TABLE __map_GH;
-- Séquences (Revizy-générique, pas de provenance nationale officieuse)
INSERT INTO public.curriculum_sequences (pays, niveau_code, serie_code, subject_name, sequences, source, updated_at)
SELECT 'GH'::text, s.niveau_code, s.serie_code, s.subject_name, s.sequences,
       'revizy_generic', now()
FROM public.curriculum_sequences s
 WHERE s.pays='BJ'
ON CONFLICT DO NOTHING;

-- CV
-- Matières
INSERT INTO public.subjects (pays, code, name, icon, description, niveau_code, serie_code, display_order, published)
SELECT 'CV'::text, code, name, icon, coalesce(description, ''), niveau_code, serie_code, display_order, true
FROM public.subjects WHERE pays='BJ' ON CONFLICT (pays, niveau_code, serie_code, code) DO NOTHING;
-- Chapitres (offset 1300000 sur le BJ)
CREATE TEMP TABLE __map_CV ON COMMIT DROP AS
  SELECT sNew.id AS new_id, sBJ.id AS old_id
  FROM public.subjects sNew
  JOIN public.subjects sBJ
    ON sNew.code = sBJ.code AND sNew.niveau_code = sBJ.niveau_code
     AND coalesce(sNew.serie_code, '') = coalesce(sBJ.serie_code, '')
 WHERE sNew.pays='CV';
INSERT INTO public.chapters (subject_id, pays, slug, num, title, sa_label, classe, pdf_url,
  is_free, price, cours, exemple_titre, exemple_enonce, exemple_solution,
  exercice_consigne, exercice_question, exercice_type, exercice_options, correct_option, explication, published)
SELECT m.new_id, 'CV'::text,
       c.slug || '~' || lower('CV'),
       c.num + 1300000,
       c.title, c.sa_label, c.classe, c.pdf_url, c.is_free, c.price, c.cours,
       c.exemple_titre, c.exemple_enonce, c.exemple_solution,
       c.exercice_consigne, c.exercice_question, c.exercice_type,
       c.exercice_options, c.correct_option, c.explication,
       coalesce(c.published, true)
  FROM public.chapters c JOIN __map_CV m ON m.old_id = c.subject_id
 WHERE c.pays='BJ';
DROP TABLE __map_CV;
-- Séquences (Revizy-générique, pas de provenance nationale officieuse)
INSERT INTO public.curriculum_sequences (pays, niveau_code, serie_code, subject_name, sequences, source, updated_at)
SELECT 'CV'::text, s.niveau_code, s.serie_code, s.subject_name, s.sequences,
       'revizy_generic', now()
FROM public.curriculum_sequences s
 WHERE s.pays='BJ'
ON CONFLICT DO NOTHING;

-- CM
-- Matières
INSERT INTO public.subjects (pays, code, name, icon, description, niveau_code, serie_code, display_order, published)
SELECT 'CM'::text, code, name, icon, coalesce(description, ''), niveau_code, serie_code, display_order, true
FROM public.subjects WHERE pays='BJ' ON CONFLICT (pays, niveau_code, serie_code, code) DO NOTHING;
-- Chapitres (offset 1400000 sur le BJ)
CREATE TEMP TABLE __map_CM ON COMMIT DROP AS
  SELECT sNew.id AS new_id, sBJ.id AS old_id
  FROM public.subjects sNew
  JOIN public.subjects sBJ
    ON sNew.code = sBJ.code AND sNew.niveau_code = sBJ.niveau_code
     AND coalesce(sNew.serie_code, '') = coalesce(sBJ.serie_code, '')
 WHERE sNew.pays='CM';
INSERT INTO public.chapters (subject_id, pays, slug, num, title, sa_label, classe, pdf_url,
  is_free, price, cours, exemple_titre, exemple_enonce, exemple_solution,
  exercice_consigne, exercice_question, exercice_type, exercice_options, correct_option, explication, published)
SELECT m.new_id, 'CM'::text,
       c.slug || '~' || lower('CM'),
       c.num + 1400000,
       c.title, c.sa_label, c.classe, c.pdf_url, c.is_free, c.price, c.cours,
       c.exemple_titre, c.exemple_enonce, c.exemple_solution,
       c.exercice_consigne, c.exercice_question, c.exercice_type,
       c.exercice_options, c.correct_option, c.explication,
       coalesce(c.published, true)
  FROM public.chapters c JOIN __map_CM m ON m.old_id = c.subject_id
 WHERE c.pays='BJ';
DROP TABLE __map_CM;
-- Séquences (Revizy-générique, pas de provenance nationale officieuse)
INSERT INTO public.curriculum_sequences (pays, niveau_code, serie_code, subject_name, sequences, source, updated_at)
SELECT 'CM'::text, s.niveau_code, s.serie_code, s.subject_name, s.sequences,
       'revizy_generic', now()
FROM public.curriculum_sequences s
 WHERE s.pays='BJ'
ON CONFLICT DO NOTHING;

-- CF
-- Matières
INSERT INTO public.subjects (pays, code, name, icon, description, niveau_code, serie_code, display_order, published)
SELECT 'CF'::text, code, name, icon, coalesce(description, ''), niveau_code, serie_code, display_order, true
FROM public.subjects WHERE pays='BJ' ON CONFLICT (pays, niveau_code, serie_code, code) DO NOTHING;
-- Chapitres (offset 1500000 sur le BJ)
CREATE TEMP TABLE __map_CF ON COMMIT DROP AS
  SELECT sNew.id AS new_id, sBJ.id AS old_id
  FROM public.subjects sNew
  JOIN public.subjects sBJ
    ON sNew.code = sBJ.code AND sNew.niveau_code = sBJ.niveau_code
     AND coalesce(sNew.serie_code, '') = coalesce(sBJ.serie_code, '')
 WHERE sNew.pays='CF';
INSERT INTO public.chapters (subject_id, pays, slug, num, title, sa_label, classe, pdf_url,
  is_free, price, cours, exemple_titre, exemple_enonce, exemple_solution,
  exercice_consigne, exercice_question, exercice_type, exercice_options, correct_option, explication, published)
SELECT m.new_id, 'CF'::text,
       c.slug || '~' || lower('CF'),
       c.num + 1500000,
       c.title, c.sa_label, c.classe, c.pdf_url, c.is_free, c.price, c.cours,
       c.exemple_titre, c.exemple_enonce, c.exemple_solution,
       c.exercice_consigne, c.exercice_question, c.exercice_type,
       c.exercice_options, c.correct_option, c.explication,
       coalesce(c.published, true)
  FROM public.chapters c JOIN __map_CF m ON m.old_id = c.subject_id
 WHERE c.pays='BJ';
DROP TABLE __map_CF;
-- Séquences (Revizy-générique, pas de provenance nationale officieuse)
INSERT INTO public.curriculum_sequences (pays, niveau_code, serie_code, subject_name, sequences, source, updated_at)
SELECT 'CF'::text, s.niveau_code, s.serie_code, s.subject_name, s.sequences,
       'revizy_generic', now()
FROM public.curriculum_sequences s
 WHERE s.pays='BJ'
ON CONFLICT DO NOTHING;

-- CG
-- Matières
INSERT INTO public.subjects (pays, code, name, icon, description, niveau_code, serie_code, display_order, published)
SELECT 'CG'::text, code, name, icon, coalesce(description, ''), niveau_code, serie_code, display_order, true
FROM public.subjects WHERE pays='BJ' ON CONFLICT (pays, niveau_code, serie_code, code) DO NOTHING;
-- Chapitres (offset 1600000 sur le BJ)
CREATE TEMP TABLE __map_CG ON COMMIT DROP AS
  SELECT sNew.id AS new_id, sBJ.id AS old_id
  FROM public.subjects sNew
  JOIN public.subjects sBJ
    ON sNew.code = sBJ.code AND sNew.niveau_code = sBJ.niveau_code
     AND coalesce(sNew.serie_code, '') = coalesce(sBJ.serie_code, '')
 WHERE sNew.pays='CG';
INSERT INTO public.chapters (subject_id, pays, slug, num, title, sa_label, classe, pdf_url,
  is_free, price, cours, exemple_titre, exemple_enonce, exemple_solution,
  exercice_consigne, exercice_question, exercice_type, exercice_options, correct_option, explication, published)
SELECT m.new_id, 'CG'::text,
       c.slug || '~' || lower('CG'),
       c.num + 1600000,
       c.title, c.sa_label, c.classe, c.pdf_url, c.is_free, c.price, c.cours,
       c.exemple_titre, c.exemple_enonce, c.exemple_solution,
       c.exercice_consigne, c.exercice_question, c.exercice_type,
       c.exercice_options, c.correct_option, c.explication,
       coalesce(c.published, true)
  FROM public.chapters c JOIN __map_CG m ON m.old_id = c.subject_id
 WHERE c.pays='BJ';
DROP TABLE __map_CG;
-- Séquences (Revizy-générique, pas de provenance nationale officieuse)
INSERT INTO public.curriculum_sequences (pays, niveau_code, serie_code, subject_name, sequences, source, updated_at)
SELECT 'CG'::text, s.niveau_code, s.serie_code, s.subject_name, s.sequences,
       'revizy_generic', now()
FROM public.curriculum_sequences s
 WHERE s.pays='BJ'
ON CONFLICT DO NOTHING;

-- TD
-- Matières
INSERT INTO public.subjects (pays, code, name, icon, description, niveau_code, serie_code, display_order, published)
SELECT 'TD'::text, code, name, icon, coalesce(description, ''), niveau_code, serie_code, display_order, true
FROM public.subjects WHERE pays='BJ' ON CONFLICT (pays, niveau_code, serie_code, code) DO NOTHING;
-- Chapitres (offset 1700000 sur le BJ)
CREATE TEMP TABLE __map_TD ON COMMIT DROP AS
  SELECT sNew.id AS new_id, sBJ.id AS old_id
  FROM public.subjects sNew
  JOIN public.subjects sBJ
    ON sNew.code = sBJ.code AND sNew.niveau_code = sBJ.niveau_code
     AND coalesce(sNew.serie_code, '') = coalesce(sBJ.serie_code, '')
 WHERE sNew.pays='TD';
INSERT INTO public.chapters (subject_id, pays, slug, num, title, sa_label, classe, pdf_url,
  is_free, price, cours, exemple_titre, exemple_enonce, exemple_solution,
  exercice_consigne, exercice_question, exercice_type, exercice_options, correct_option, explication, published)
SELECT m.new_id, 'TD'::text,
       c.slug || '~' || lower('TD'),
       c.num + 1700000,
       c.title, c.sa_label, c.classe, c.pdf_url, c.is_free, c.price, c.cours,
       c.exemple_titre, c.exemple_enonce, c.exemple_solution,
       c.exercice_consigne, c.exercice_question, c.exercice_type,
       c.exercice_options, c.correct_option, c.explication,
       coalesce(c.published, true)
  FROM public.chapters c JOIN __map_TD m ON m.old_id = c.subject_id
 WHERE c.pays='BJ';
DROP TABLE __map_TD;
-- Séquences (Revizy-générique, pas de provenance nationale officieuse)
INSERT INTO public.curriculum_sequences (pays, niveau_code, serie_code, subject_name, sequences, source, updated_at)
SELECT 'TD'::text, s.niveau_code, s.serie_code, s.subject_name, s.sequences,
       'revizy_generic', now()
FROM public.curriculum_sequences s
 WHERE s.pays='BJ'
ON CONFLICT DO NOTHING;

-- GA
-- Matières
INSERT INTO public.subjects (pays, code, name, icon, description, niveau_code, serie_code, display_order, published)
SELECT 'GA'::text, code, name, icon, coalesce(description, ''), niveau_code, serie_code, display_order, true
FROM public.subjects WHERE pays='BJ' ON CONFLICT (pays, niveau_code, serie_code, code) DO NOTHING;
-- Chapitres (offset 1800000 sur le BJ)
CREATE TEMP TABLE __map_GA ON COMMIT DROP AS
  SELECT sNew.id AS new_id, sBJ.id AS old_id
  FROM public.subjects sNew
  JOIN public.subjects sBJ
    ON sNew.code = sBJ.code AND sNew.niveau_code = sBJ.niveau_code
     AND coalesce(sNew.serie_code, '') = coalesce(sBJ.serie_code, '')
 WHERE sNew.pays='GA';
INSERT INTO public.chapters (subject_id, pays, slug, num, title, sa_label, classe, pdf_url,
  is_free, price, cours, exemple_titre, exemple_enonce, exemple_solution,
  exercice_consigne, exercice_question, exercice_type, exercice_options, correct_option, explication, published)
SELECT m.new_id, 'GA'::text,
       c.slug || '~' || lower('GA'),
       c.num + 1800000,
       c.title, c.sa_label, c.classe, c.pdf_url, c.is_free, c.price, c.cours,
       c.exemple_titre, c.exemple_enonce, c.exemple_solution,
       c.exercice_consigne, c.exercice_question, c.exercice_type,
       c.exercice_options, c.correct_option, c.explication,
       coalesce(c.published, true)
  FROM public.chapters c JOIN __map_GA m ON m.old_id = c.subject_id
 WHERE c.pays='BJ';
DROP TABLE __map_GA;
-- Séquences (Revizy-générique, pas de provenance nationale officieuse)
INSERT INTO public.curriculum_sequences (pays, niveau_code, serie_code, subject_name, sequences, source, updated_at)
SELECT 'GA'::text, s.niveau_code, s.serie_code, s.subject_name, s.sequences,
       'revizy_generic', now()
FROM public.curriculum_sequences s
 WHERE s.pays='BJ'
ON CONFLICT DO NOTHING;

-- GQ
-- Matières
INSERT INTO public.subjects (pays, code, name, icon, description, niveau_code, serie_code, display_order, published)
SELECT 'GQ'::text, code, name, icon, coalesce(description, ''), niveau_code, serie_code, display_order, true
FROM public.subjects WHERE pays='BJ' ON CONFLICT (pays, niveau_code, serie_code, code) DO NOTHING;
-- Chapitres (offset 1900000 sur le BJ)
CREATE TEMP TABLE __map_GQ ON COMMIT DROP AS
  SELECT sNew.id AS new_id, sBJ.id AS old_id
  FROM public.subjects sNew
  JOIN public.subjects sBJ
    ON sNew.code = sBJ.code AND sNew.niveau_code = sBJ.niveau_code
     AND coalesce(sNew.serie_code, '') = coalesce(sBJ.serie_code, '')
 WHERE sNew.pays='GQ';
INSERT INTO public.chapters (subject_id, pays, slug, num, title, sa_label, classe, pdf_url,
  is_free, price, cours, exemple_titre, exemple_enonce, exemple_solution,
  exercice_consigne, exercice_question, exercice_type, exercice_options, correct_option, explication, published)
SELECT m.new_id, 'GQ'::text,
       c.slug || '~' || lower('GQ'),
       c.num + 1900000,
       c.title, c.sa_label, c.classe, c.pdf_url, c.is_free, c.price, c.cours,
       c.exemple_titre, c.exemple_enonce, c.exemple_solution,
       c.exercice_consigne, c.exercice_question, c.exercice_type,
       c.exercice_options, c.correct_option, c.explication,
       coalesce(c.published, true)
  FROM public.chapters c JOIN __map_GQ m ON m.old_id = c.subject_id
 WHERE c.pays='BJ';
DROP TABLE __map_GQ;
-- Séquences (Revizy-générique, pas de provenance nationale officieuse)
INSERT INTO public.curriculum_sequences (pays, niveau_code, serie_code, subject_name, sequences, source, updated_at)
SELECT 'GQ'::text, s.niveau_code, s.serie_code, s.subject_name, s.sequences,
       'revizy_generic', now()
FROM public.curriculum_sequences s
 WHERE s.pays='BJ'
ON CONFLICT DO NOTHING;

-- ST
-- Matières
INSERT INTO public.subjects (pays, code, name, icon, description, niveau_code, serie_code, display_order, published)
SELECT 'ST'::text, code, name, icon, coalesce(description, ''), niveau_code, serie_code, display_order, true
FROM public.subjects WHERE pays='BJ' ON CONFLICT (pays, niveau_code, serie_code, code) DO NOTHING;
-- Chapitres (offset 2000000 sur le BJ)
CREATE TEMP TABLE __map_ST ON COMMIT DROP AS
  SELECT sNew.id AS new_id, sBJ.id AS old_id
  FROM public.subjects sNew
  JOIN public.subjects sBJ
    ON sNew.code = sBJ.code AND sNew.niveau_code = sBJ.niveau_code
     AND coalesce(sNew.serie_code, '') = coalesce(sBJ.serie_code, '')
 WHERE sNew.pays='ST';
INSERT INTO public.chapters (subject_id, pays, slug, num, title, sa_label, classe, pdf_url,
  is_free, price, cours, exemple_titre, exemple_enonce, exemple_solution,
  exercice_consigne, exercice_question, exercice_type, exercice_options, correct_option, explication, published)
SELECT m.new_id, 'ST'::text,
       c.slug || '~' || lower('ST'),
       c.num + 2000000,
       c.title, c.sa_label, c.classe, c.pdf_url, c.is_free, c.price, c.cours,
       c.exemple_titre, c.exemple_enonce, c.exemple_solution,
       c.exercice_consigne, c.exercice_question, c.exercice_type,
       c.exercice_options, c.correct_option, c.explication,
       coalesce(c.published, true)
  FROM public.chapters c JOIN __map_ST m ON m.old_id = c.subject_id
 WHERE c.pays='BJ';
DROP TABLE __map_ST;
-- Séquences (Revizy-générique, pas de provenance nationale officieuse)
INSERT INTO public.curriculum_sequences (pays, niveau_code, serie_code, subject_name, sequences, source, updated_at)
SELECT 'ST'::text, s.niveau_code, s.serie_code, s.subject_name, s.sequences,
       'revizy_generic', now()
FROM public.curriculum_sequences s
 WHERE s.pays='BJ'
ON CONFLICT DO NOTHING;

-- CD
-- Matières
INSERT INTO public.subjects (pays, code, name, icon, description, niveau_code, serie_code, display_order, published)
SELECT 'CD'::text, code, name, icon, coalesce(description, ''), niveau_code, serie_code, display_order, true
FROM public.subjects WHERE pays='BJ' ON CONFLICT (pays, niveau_code, serie_code, code) DO NOTHING;
-- Chapitres (offset 2100000 sur le BJ)
CREATE TEMP TABLE __map_CD ON COMMIT DROP AS
  SELECT sNew.id AS new_id, sBJ.id AS old_id
  FROM public.subjects sNew
  JOIN public.subjects sBJ
    ON sNew.code = sBJ.code AND sNew.niveau_code = sBJ.niveau_code
     AND coalesce(sNew.serie_code, '') = coalesce(sBJ.serie_code, '')
 WHERE sNew.pays='CD';
INSERT INTO public.chapters (subject_id, pays, slug, num, title, sa_label, classe, pdf_url,
  is_free, price, cours, exemple_titre, exemple_enonce, exemple_solution,
  exercice_consigne, exercice_question, exercice_type, exercice_options, correct_option, explication, published)
SELECT m.new_id, 'CD'::text,
       c.slug || '~' || lower('CD'),
       c.num + 2100000,
       c.title, c.sa_label, c.classe, c.pdf_url, c.is_free, c.price, c.cours,
       c.exemple_titre, c.exemple_enonce, c.exemple_solution,
       c.exercice_consigne, c.exercice_question, c.exercice_type,
       c.exercice_options, c.correct_option, c.explication,
       coalesce(c.published, true)
  FROM public.chapters c JOIN __map_CD m ON m.old_id = c.subject_id
 WHERE c.pays='BJ';
DROP TABLE __map_CD;
-- Séquences (Revizy-générique, pas de provenance nationale officieuse)
INSERT INTO public.curriculum_sequences (pays, niveau_code, serie_code, subject_name, sequences, source, updated_at)
SELECT 'CD'::text, s.niveau_code, s.serie_code, s.subject_name, s.sequences,
       'revizy_generic', now()
FROM public.curriculum_sequences s
 WHERE s.pays='BJ'
ON CONFLICT DO NOTHING;

-- AO
-- Matières
INSERT INTO public.subjects (pays, code, name, icon, description, niveau_code, serie_code, display_order, published)
SELECT 'AO'::text, code, name, icon, coalesce(description, ''), niveau_code, serie_code, display_order, true
FROM public.subjects WHERE pays='BJ' ON CONFLICT (pays, niveau_code, serie_code, code) DO NOTHING;
-- Chapitres (offset 2200000 sur le BJ)
CREATE TEMP TABLE __map_AO ON COMMIT DROP AS
  SELECT sNew.id AS new_id, sBJ.id AS old_id
  FROM public.subjects sNew
  JOIN public.subjects sBJ
    ON sNew.code = sBJ.code AND sNew.niveau_code = sBJ.niveau_code
     AND coalesce(sNew.serie_code, '') = coalesce(sBJ.serie_code, '')
 WHERE sNew.pays='AO';
INSERT INTO public.chapters (subject_id, pays, slug, num, title, sa_label, classe, pdf_url,
  is_free, price, cours, exemple_titre, exemple_enonce, exemple_solution,
  exercice_consigne, exercice_question, exercice_type, exercice_options, correct_option, explication, published)
SELECT m.new_id, 'AO'::text,
       c.slug || '~' || lower('AO'),
       c.num + 2200000,
       c.title, c.sa_label, c.classe, c.pdf_url, c.is_free, c.price, c.cours,
       c.exemple_titre, c.exemple_enonce, c.exemple_solution,
       c.exercice_consigne, c.exercice_question, c.exercice_type,
       c.exercice_options, c.correct_option, c.explication,
       coalesce(c.published, true)
  FROM public.chapters c JOIN __map_AO m ON m.old_id = c.subject_id
 WHERE c.pays='BJ';
DROP TABLE __map_AO;
-- Séquences (Revizy-générique, pas de provenance nationale officieuse)
INSERT INTO public.curriculum_sequences (pays, niveau_code, serie_code, subject_name, sequences, source, updated_at)
SELECT 'AO'::text, s.niveau_code, s.serie_code, s.subject_name, s.sequences,
       'revizy_generic', now()
FROM public.curriculum_sequences s
 WHERE s.pays='BJ'
ON CONFLICT DO NOTHING;

-- ET
-- Matières
INSERT INTO public.subjects (pays, code, name, icon, description, niveau_code, serie_code, display_order, published)
SELECT 'ET'::text, code, name, icon, coalesce(description, ''), niveau_code, serie_code, display_order, true
FROM public.subjects WHERE pays='BJ' ON CONFLICT (pays, niveau_code, serie_code, code) DO NOTHING;
-- Chapitres (offset 2300000 sur le BJ)
CREATE TEMP TABLE __map_ET ON COMMIT DROP AS
  SELECT sNew.id AS new_id, sBJ.id AS old_id
  FROM public.subjects sNew
  JOIN public.subjects sBJ
    ON sNew.code = sBJ.code AND sNew.niveau_code = sBJ.niveau_code
     AND coalesce(sNew.serie_code, '') = coalesce(sBJ.serie_code, '')
 WHERE sNew.pays='ET';
INSERT INTO public.chapters (subject_id, pays, slug, num, title, sa_label, classe, pdf_url,
  is_free, price, cours, exemple_titre, exemple_enonce, exemple_solution,
  exercice_consigne, exercice_question, exercice_type, exercice_options, correct_option, explication, published)
SELECT m.new_id, 'ET'::text,
       c.slug || '~' || lower('ET'),
       c.num + 2300000,
       c.title, c.sa_label, c.classe, c.pdf_url, c.is_free, c.price, c.cours,
       c.exemple_titre, c.exemple_enonce, c.exemple_solution,
       c.exercice_consigne, c.exercice_question, c.exercice_type,
       c.exercice_options, c.correct_option, c.explication,
       coalesce(c.published, true)
  FROM public.chapters c JOIN __map_ET m ON m.old_id = c.subject_id
 WHERE c.pays='BJ';
DROP TABLE __map_ET;
-- Séquences (Revizy-générique, pas de provenance nationale officieuse)
INSERT INTO public.curriculum_sequences (pays, niveau_code, serie_code, subject_name, sequences, source, updated_at)
SELECT 'ET'::text, s.niveau_code, s.serie_code, s.subject_name, s.sequences,
       'revizy_generic', now()
FROM public.curriculum_sequences s
 WHERE s.pays='BJ'
ON CONFLICT DO NOTHING;

-- KE
-- Matières
INSERT INTO public.subjects (pays, code, name, icon, description, niveau_code, serie_code, display_order, published)
SELECT 'KE'::text, code, name, icon, coalesce(description, ''), niveau_code, serie_code, display_order, true
FROM public.subjects WHERE pays='BJ' ON CONFLICT (pays, niveau_code, serie_code, code) DO NOTHING;
-- Chapitres (offset 2400000 sur le BJ)
CREATE TEMP TABLE __map_KE ON COMMIT DROP AS
  SELECT sNew.id AS new_id, sBJ.id AS old_id
  FROM public.subjects sNew
  JOIN public.subjects sBJ
    ON sNew.code = sBJ.code AND sNew.niveau_code = sBJ.niveau_code
     AND coalesce(sNew.serie_code, '') = coalesce(sBJ.serie_code, '')
 WHERE sNew.pays='KE';
INSERT INTO public.chapters (subject_id, pays, slug, num, title, sa_label, classe, pdf_url,
  is_free, price, cours, exemple_titre, exemple_enonce, exemple_solution,
  exercice_consigne, exercice_question, exercice_type, exercice_options, correct_option, explication, published)
SELECT m.new_id, 'KE'::text,
       c.slug || '~' || lower('KE'),
       c.num + 2400000,
       c.title, c.sa_label, c.classe, c.pdf_url, c.is_free, c.price, c.cours,
       c.exemple_titre, c.exemple_enonce, c.exemple_solution,
       c.exercice_consigne, c.exercice_question, c.exercice_type,
       c.exercice_options, c.correct_option, c.explication,
       coalesce(c.published, true)
  FROM public.chapters c JOIN __map_KE m ON m.old_id = c.subject_id
 WHERE c.pays='BJ';
DROP TABLE __map_KE;
-- Séquences (Revizy-générique, pas de provenance nationale officieuse)
INSERT INTO public.curriculum_sequences (pays, niveau_code, serie_code, subject_name, sequences, source, updated_at)
SELECT 'KE'::text, s.niveau_code, s.serie_code, s.subject_name, s.sequences,
       'revizy_generic', now()
FROM public.curriculum_sequences s
 WHERE s.pays='BJ'
ON CONFLICT DO NOTHING;

-- TZ
-- Matières
INSERT INTO public.subjects (pays, code, name, icon, description, niveau_code, serie_code, display_order, published)
SELECT 'TZ'::text, code, name, icon, coalesce(description, ''), niveau_code, serie_code, display_order, true
FROM public.subjects WHERE pays='BJ' ON CONFLICT (pays, niveau_code, serie_code, code) DO NOTHING;
-- Chapitres (offset 2500000 sur le BJ)
CREATE TEMP TABLE __map_TZ ON COMMIT DROP AS
  SELECT sNew.id AS new_id, sBJ.id AS old_id
  FROM public.subjects sNew
  JOIN public.subjects sBJ
    ON sNew.code = sBJ.code AND sNew.niveau_code = sBJ.niveau_code
     AND coalesce(sNew.serie_code, '') = coalesce(sBJ.serie_code, '')
 WHERE sNew.pays='TZ';
INSERT INTO public.chapters (subject_id, pays, slug, num, title, sa_label, classe, pdf_url,
  is_free, price, cours, exemple_titre, exemple_enonce, exemple_solution,
  exercice_consigne, exercice_question, exercice_type, exercice_options, correct_option, explication, published)
SELECT m.new_id, 'TZ'::text,
       c.slug || '~' || lower('TZ'),
       c.num + 2500000,
       c.title, c.sa_label, c.classe, c.pdf_url, c.is_free, c.price, c.cours,
       c.exemple_titre, c.exemple_enonce, c.exemple_solution,
       c.exercice_consigne, c.exercice_question, c.exercice_type,
       c.exercice_options, c.correct_option, c.explication,
       coalesce(c.published, true)
  FROM public.chapters c JOIN __map_TZ m ON m.old_id = c.subject_id
 WHERE c.pays='BJ';
DROP TABLE __map_TZ;
-- Séquences (Revizy-générique, pas de provenance nationale officieuse)
INSERT INTO public.curriculum_sequences (pays, niveau_code, serie_code, subject_name, sequences, source, updated_at)
SELECT 'TZ'::text, s.niveau_code, s.serie_code, s.subject_name, s.sequences,
       'revizy_generic', now()
FROM public.curriculum_sequences s
 WHERE s.pays='BJ'
ON CONFLICT DO NOTHING;

-- UG
-- Matières
INSERT INTO public.subjects (pays, code, name, icon, description, niveau_code, serie_code, display_order, published)
SELECT 'UG'::text, code, name, icon, coalesce(description, ''), niveau_code, serie_code, display_order, true
FROM public.subjects WHERE pays='BJ' ON CONFLICT (pays, niveau_code, serie_code, code) DO NOTHING;
-- Chapitres (offset 2600000 sur le BJ)
CREATE TEMP TABLE __map_UG ON COMMIT DROP AS
  SELECT sNew.id AS new_id, sBJ.id AS old_id
  FROM public.subjects sNew
  JOIN public.subjects sBJ
    ON sNew.code = sBJ.code AND sNew.niveau_code = sBJ.niveau_code
     AND coalesce(sNew.serie_code, '') = coalesce(sBJ.serie_code, '')
 WHERE sNew.pays='UG';
INSERT INTO public.chapters (subject_id, pays, slug, num, title, sa_label, classe, pdf_url,
  is_free, price, cours, exemple_titre, exemple_enonce, exemple_solution,
  exercice_consigne, exercice_question, exercice_type, exercice_options, correct_option, explication, published)
SELECT m.new_id, 'UG'::text,
       c.slug || '~' || lower('UG'),
       c.num + 2600000,
       c.title, c.sa_label, c.classe, c.pdf_url, c.is_free, c.price, c.cours,
       c.exemple_titre, c.exemple_enonce, c.exemple_solution,
       c.exercice_consigne, c.exercice_question, c.exercice_type,
       c.exercice_options, c.correct_option, c.explication,
       coalesce(c.published, true)
  FROM public.chapters c JOIN __map_UG m ON m.old_id = c.subject_id
 WHERE c.pays='BJ';
DROP TABLE __map_UG;
-- Séquences (Revizy-générique, pas de provenance nationale officieuse)
INSERT INTO public.curriculum_sequences (pays, niveau_code, serie_code, subject_name, sequences, source, updated_at)
SELECT 'UG'::text, s.niveau_code, s.serie_code, s.subject_name, s.sequences,
       'revizy_generic', now()
FROM public.curriculum_sequences s
 WHERE s.pays='BJ'
ON CONFLICT DO NOTHING;

-- RW
-- Matières
INSERT INTO public.subjects (pays, code, name, icon, description, niveau_code, serie_code, display_order, published)
SELECT 'RW'::text, code, name, icon, coalesce(description, ''), niveau_code, serie_code, display_order, true
FROM public.subjects WHERE pays='BJ' ON CONFLICT (pays, niveau_code, serie_code, code) DO NOTHING;
-- Chapitres (offset 2700000 sur le BJ)
CREATE TEMP TABLE __map_RW ON COMMIT DROP AS
  SELECT sNew.id AS new_id, sBJ.id AS old_id
  FROM public.subjects sNew
  JOIN public.subjects sBJ
    ON sNew.code = sBJ.code AND sNew.niveau_code = sBJ.niveau_code
     AND coalesce(sNew.serie_code, '') = coalesce(sBJ.serie_code, '')
 WHERE sNew.pays='RW';
INSERT INTO public.chapters (subject_id, pays, slug, num, title, sa_label, classe, pdf_url,
  is_free, price, cours, exemple_titre, exemple_enonce, exemple_solution,
  exercice_consigne, exercice_question, exercice_type, exercice_options, correct_option, explication, published)
SELECT m.new_id, 'RW'::text,
       c.slug || '~' || lower('RW'),
       c.num + 2700000,
       c.title, c.sa_label, c.classe, c.pdf_url, c.is_free, c.price, c.cours,
       c.exemple_titre, c.exemple_enonce, c.exemple_solution,
       c.exercice_consigne, c.exercice_question, c.exercice_type,
       c.exercice_options, c.correct_option, c.explication,
       coalesce(c.published, true)
  FROM public.chapters c JOIN __map_RW m ON m.old_id = c.subject_id
 WHERE c.pays='BJ';
DROP TABLE __map_RW;
-- Séquences (Revizy-générique, pas de provenance nationale officieuse)
INSERT INTO public.curriculum_sequences (pays, niveau_code, serie_code, subject_name, sequences, source, updated_at)
SELECT 'RW'::text, s.niveau_code, s.serie_code, s.subject_name, s.sequences,
       'revizy_generic', now()
FROM public.curriculum_sequences s
 WHERE s.pays='BJ'
ON CONFLICT DO NOTHING;

-- BI
-- Matières
INSERT INTO public.subjects (pays, code, name, icon, description, niveau_code, serie_code, display_order, published)
SELECT 'BI'::text, code, name, icon, coalesce(description, ''), niveau_code, serie_code, display_order, true
FROM public.subjects WHERE pays='BJ' ON CONFLICT (pays, niveau_code, serie_code, code) DO NOTHING;
-- Chapitres (offset 2800000 sur le BJ)
CREATE TEMP TABLE __map_BI ON COMMIT DROP AS
  SELECT sNew.id AS new_id, sBJ.id AS old_id
  FROM public.subjects sNew
  JOIN public.subjects sBJ
    ON sNew.code = sBJ.code AND sNew.niveau_code = sBJ.niveau_code
     AND coalesce(sNew.serie_code, '') = coalesce(sBJ.serie_code, '')
 WHERE sNew.pays='BI';
INSERT INTO public.chapters (subject_id, pays, slug, num, title, sa_label, classe, pdf_url,
  is_free, price, cours, exemple_titre, exemple_enonce, exemple_solution,
  exercice_consigne, exercice_question, exercice_type, exercice_options, correct_option, explication, published)
SELECT m.new_id, 'BI'::text,
       c.slug || '~' || lower('BI'),
       c.num + 2800000,
       c.title, c.sa_label, c.classe, c.pdf_url, c.is_free, c.price, c.cours,
       c.exemple_titre, c.exemple_enonce, c.exemple_solution,
       c.exercice_consigne, c.exercice_question, c.exercice_type,
       c.exercice_options, c.correct_option, c.explication,
       coalesce(c.published, true)
  FROM public.chapters c JOIN __map_BI m ON m.old_id = c.subject_id
 WHERE c.pays='BJ';
DROP TABLE __map_BI;
-- Séquences (Revizy-générique, pas de provenance nationale officieuse)
INSERT INTO public.curriculum_sequences (pays, niveau_code, serie_code, subject_name, sequences, source, updated_at)
SELECT 'BI'::text, s.niveau_code, s.serie_code, s.subject_name, s.sequences,
       'revizy_generic', now()
FROM public.curriculum_sequences s
 WHERE s.pays='BJ'
ON CONFLICT DO NOTHING;

-- SO
-- Matières
INSERT INTO public.subjects (pays, code, name, icon, description, niveau_code, serie_code, display_order, published)
SELECT 'SO'::text, code, name, icon, coalesce(description, ''), niveau_code, serie_code, display_order, true
FROM public.subjects WHERE pays='BJ' ON CONFLICT (pays, niveau_code, serie_code, code) DO NOTHING;
-- Chapitres (offset 2900000 sur le BJ)
CREATE TEMP TABLE __map_SO ON COMMIT DROP AS
  SELECT sNew.id AS new_id, sBJ.id AS old_id
  FROM public.subjects sNew
  JOIN public.subjects sBJ
    ON sNew.code = sBJ.code AND sNew.niveau_code = sBJ.niveau_code
     AND coalesce(sNew.serie_code, '') = coalesce(sBJ.serie_code, '')
 WHERE sNew.pays='SO';
INSERT INTO public.chapters (subject_id, pays, slug, num, title, sa_label, classe, pdf_url,
  is_free, price, cours, exemple_titre, exemple_enonce, exemple_solution,
  exercice_consigne, exercice_question, exercice_type, exercice_options, correct_option, explication, published)
SELECT m.new_id, 'SO'::text,
       c.slug || '~' || lower('SO'),
       c.num + 2900000,
       c.title, c.sa_label, c.classe, c.pdf_url, c.is_free, c.price, c.cours,
       c.exemple_titre, c.exemple_enonce, c.exemple_solution,
       c.exercice_consigne, c.exercice_question, c.exercice_type,
       c.exercice_options, c.correct_option, c.explication,
       coalesce(c.published, true)
  FROM public.chapters c JOIN __map_SO m ON m.old_id = c.subject_id
 WHERE c.pays='BJ';
DROP TABLE __map_SO;
-- Séquences (Revizy-générique, pas de provenance nationale officieuse)
INSERT INTO public.curriculum_sequences (pays, niveau_code, serie_code, subject_name, sequences, source, updated_at)
SELECT 'SO'::text, s.niveau_code, s.serie_code, s.subject_name, s.sequences,
       'revizy_generic', now()
FROM public.curriculum_sequences s
 WHERE s.pays='BJ'
ON CONFLICT DO NOTHING;

-- DJ
-- Matières
INSERT INTO public.subjects (pays, code, name, icon, description, niveau_code, serie_code, display_order, published)
SELECT 'DJ'::text, code, name, icon, coalesce(description, ''), niveau_code, serie_code, display_order, true
FROM public.subjects WHERE pays='BJ' ON CONFLICT (pays, niveau_code, serie_code, code) DO NOTHING;
-- Chapitres (offset 3000000 sur le BJ)
CREATE TEMP TABLE __map_DJ ON COMMIT DROP AS
  SELECT sNew.id AS new_id, sBJ.id AS old_id
  FROM public.subjects sNew
  JOIN public.subjects sBJ
    ON sNew.code = sBJ.code AND sNew.niveau_code = sBJ.niveau_code
     AND coalesce(sNew.serie_code, '') = coalesce(sBJ.serie_code, '')
 WHERE sNew.pays='DJ';
INSERT INTO public.chapters (subject_id, pays, slug, num, title, sa_label, classe, pdf_url,
  is_free, price, cours, exemple_titre, exemple_enonce, exemple_solution,
  exercice_consigne, exercice_question, exercice_type, exercice_options, correct_option, explication, published)
SELECT m.new_id, 'DJ'::text,
       c.slug || '~' || lower('DJ'),
       c.num + 3000000,
       c.title, c.sa_label, c.classe, c.pdf_url, c.is_free, c.price, c.cours,
       c.exemple_titre, c.exemple_enonce, c.exemple_solution,
       c.exercice_consigne, c.exercice_question, c.exercice_type,
       c.exercice_options, c.correct_option, c.explication,
       coalesce(c.published, true)
  FROM public.chapters c JOIN __map_DJ m ON m.old_id = c.subject_id
 WHERE c.pays='BJ';
DROP TABLE __map_DJ;
-- Séquences (Revizy-générique, pas de provenance nationale officieuse)
INSERT INTO public.curriculum_sequences (pays, niveau_code, serie_code, subject_name, sequences, source, updated_at)
SELECT 'DJ'::text, s.niveau_code, s.serie_code, s.subject_name, s.sequences,
       'revizy_generic', now()
FROM public.curriculum_sequences s
 WHERE s.pays='BJ'
ON CONFLICT DO NOTHING;

-- ER
-- Matières
INSERT INTO public.subjects (pays, code, name, icon, description, niveau_code, serie_code, display_order, published)
SELECT 'ER'::text, code, name, icon, coalesce(description, ''), niveau_code, serie_code, display_order, true
FROM public.subjects WHERE pays='BJ' ON CONFLICT (pays, niveau_code, serie_code, code) DO NOTHING;
-- Chapitres (offset 3100000 sur le BJ)
CREATE TEMP TABLE __map_ER ON COMMIT DROP AS
  SELECT sNew.id AS new_id, sBJ.id AS old_id
  FROM public.subjects sNew
  JOIN public.subjects sBJ
    ON sNew.code = sBJ.code AND sNew.niveau_code = sBJ.niveau_code
     AND coalesce(sNew.serie_code, '') = coalesce(sBJ.serie_code, '')
 WHERE sNew.pays='ER';
INSERT INTO public.chapters (subject_id, pays, slug, num, title, sa_label, classe, pdf_url,
  is_free, price, cours, exemple_titre, exemple_enonce, exemple_solution,
  exercice_consigne, exercice_question, exercice_type, exercice_options, correct_option, explication, published)
SELECT m.new_id, 'ER'::text,
       c.slug || '~' || lower('ER'),
       c.num + 3100000,
       c.title, c.sa_label, c.classe, c.pdf_url, c.is_free, c.price, c.cours,
       c.exemple_titre, c.exemple_enonce, c.exemple_solution,
       c.exercice_consigne, c.exercice_question, c.exercice_type,
       c.exercice_options, c.correct_option, c.explication,
       coalesce(c.published, true)
  FROM public.chapters c JOIN __map_ER m ON m.old_id = c.subject_id
 WHERE c.pays='BJ';
DROP TABLE __map_ER;
-- Séquences (Revizy-générique, pas de provenance nationale officieuse)
INSERT INTO public.curriculum_sequences (pays, niveau_code, serie_code, subject_name, sequences, source, updated_at)
SELECT 'ER'::text, s.niveau_code, s.serie_code, s.subject_name, s.sequences,
       'revizy_generic', now()
FROM public.curriculum_sequences s
 WHERE s.pays='BJ'
ON CONFLICT DO NOTHING;

-- SS
-- Matières
INSERT INTO public.subjects (pays, code, name, icon, description, niveau_code, serie_code, display_order, published)
SELECT 'SS'::text, code, name, icon, coalesce(description, ''), niveau_code, serie_code, display_order, true
FROM public.subjects WHERE pays='BJ' ON CONFLICT (pays, niveau_code, serie_code, code) DO NOTHING;
-- Chapitres (offset 3200000 sur le BJ)
CREATE TEMP TABLE __map_SS ON COMMIT DROP AS
  SELECT sNew.id AS new_id, sBJ.id AS old_id
  FROM public.subjects sNew
  JOIN public.subjects sBJ
    ON sNew.code = sBJ.code AND sNew.niveau_code = sBJ.niveau_code
     AND coalesce(sNew.serie_code, '') = coalesce(sBJ.serie_code, '')
 WHERE sNew.pays='SS';
INSERT INTO public.chapters (subject_id, pays, slug, num, title, sa_label, classe, pdf_url,
  is_free, price, cours, exemple_titre, exemple_enonce, exemple_solution,
  exercice_consigne, exercice_question, exercice_type, exercice_options, correct_option, explication, published)
SELECT m.new_id, 'SS'::text,
       c.slug || '~' || lower('SS'),
       c.num + 3200000,
       c.title, c.sa_label, c.classe, c.pdf_url, c.is_free, c.price, c.cours,
       c.exemple_titre, c.exemple_enonce, c.exemple_solution,
       c.exercice_consigne, c.exercice_question, c.exercice_type,
       c.exercice_options, c.correct_option, c.explication,
       coalesce(c.published, true)
  FROM public.chapters c JOIN __map_SS m ON m.old_id = c.subject_id
 WHERE c.pays='BJ';
DROP TABLE __map_SS;
-- Séquences (Revizy-générique, pas de provenance nationale officieuse)
INSERT INTO public.curriculum_sequences (pays, niveau_code, serie_code, subject_name, sequences, source, updated_at)
SELECT 'SS'::text, s.niveau_code, s.serie_code, s.subject_name, s.sequences,
       'revizy_generic', now()
FROM public.curriculum_sequences s
 WHERE s.pays='BJ'
ON CONFLICT DO NOTHING;

-- KM
-- Matières
INSERT INTO public.subjects (pays, code, name, icon, description, niveau_code, serie_code, display_order, published)
SELECT 'KM'::text, code, name, icon, coalesce(description, ''), niveau_code, serie_code, display_order, true
FROM public.subjects WHERE pays='BJ' ON CONFLICT (pays, niveau_code, serie_code, code) DO NOTHING;
-- Chapitres (offset 3300000 sur le BJ)
CREATE TEMP TABLE __map_KM ON COMMIT DROP AS
  SELECT sNew.id AS new_id, sBJ.id AS old_id
  FROM public.subjects sNew
  JOIN public.subjects sBJ
    ON sNew.code = sBJ.code AND sNew.niveau_code = sBJ.niveau_code
     AND coalesce(sNew.serie_code, '') = coalesce(sBJ.serie_code, '')
 WHERE sNew.pays='KM';
INSERT INTO public.chapters (subject_id, pays, slug, num, title, sa_label, classe, pdf_url,
  is_free, price, cours, exemple_titre, exemple_enonce, exemple_solution,
  exercice_consigne, exercice_question, exercice_type, exercice_options, correct_option, explication, published)
SELECT m.new_id, 'KM'::text,
       c.slug || '~' || lower('KM'),
       c.num + 3300000,
       c.title, c.sa_label, c.classe, c.pdf_url, c.is_free, c.price, c.cours,
       c.exemple_titre, c.exemple_enonce, c.exemple_solution,
       c.exercice_consigne, c.exercice_question, c.exercice_type,
       c.exercice_options, c.correct_option, c.explication,
       coalesce(c.published, true)
  FROM public.chapters c JOIN __map_KM m ON m.old_id = c.subject_id
 WHERE c.pays='BJ';
DROP TABLE __map_KM;
-- Séquences (Revizy-générique, pas de provenance nationale officieuse)
INSERT INTO public.curriculum_sequences (pays, niveau_code, serie_code, subject_name, sequences, source, updated_at)
SELECT 'KM'::text, s.niveau_code, s.serie_code, s.subject_name, s.sequences,
       'revizy_generic', now()
FROM public.curriculum_sequences s
 WHERE s.pays='BJ'
ON CONFLICT DO NOTHING;

-- MA
-- Matières
INSERT INTO public.subjects (pays, code, name, icon, description, niveau_code, serie_code, display_order, published)
SELECT 'MA'::text, code, name, icon, coalesce(description, ''), niveau_code, serie_code, display_order, true
FROM public.subjects WHERE pays='BJ' ON CONFLICT (pays, niveau_code, serie_code, code) DO NOTHING;
-- Chapitres (offset 3400000 sur le BJ)
CREATE TEMP TABLE __map_MA ON COMMIT DROP AS
  SELECT sNew.id AS new_id, sBJ.id AS old_id
  FROM public.subjects sNew
  JOIN public.subjects sBJ
    ON sNew.code = sBJ.code AND sNew.niveau_code = sBJ.niveau_code
     AND coalesce(sNew.serie_code, '') = coalesce(sBJ.serie_code, '')
 WHERE sNew.pays='MA';
INSERT INTO public.chapters (subject_id, pays, slug, num, title, sa_label, classe, pdf_url,
  is_free, price, cours, exemple_titre, exemple_enonce, exemple_solution,
  exercice_consigne, exercice_question, exercice_type, exercice_options, correct_option, explication, published)
SELECT m.new_id, 'MA'::text,
       c.slug || '~' || lower('MA'),
       c.num + 3400000,
       c.title, c.sa_label, c.classe, c.pdf_url, c.is_free, c.price, c.cours,
       c.exemple_titre, c.exemple_enonce, c.exemple_solution,
       c.exercice_consigne, c.exercice_question, c.exercice_type,
       c.exercice_options, c.correct_option, c.explication,
       coalesce(c.published, true)
  FROM public.chapters c JOIN __map_MA m ON m.old_id = c.subject_id
 WHERE c.pays='BJ';
DROP TABLE __map_MA;
-- Séquences (Revizy-générique, pas de provenance nationale officieuse)
INSERT INTO public.curriculum_sequences (pays, niveau_code, serie_code, subject_name, sequences, source, updated_at)
SELECT 'MA'::text, s.niveau_code, s.serie_code, s.subject_name, s.sequences,
       'revizy_generic', now()
FROM public.curriculum_sequences s
 WHERE s.pays='BJ'
ON CONFLICT DO NOTHING;

-- DZ
-- Matières
INSERT INTO public.subjects (pays, code, name, icon, description, niveau_code, serie_code, display_order, published)
SELECT 'DZ'::text, code, name, icon, coalesce(description, ''), niveau_code, serie_code, display_order, true
FROM public.subjects WHERE pays='BJ' ON CONFLICT (pays, niveau_code, serie_code, code) DO NOTHING;
-- Chapitres (offset 3500000 sur le BJ)
CREATE TEMP TABLE __map_DZ ON COMMIT DROP AS
  SELECT sNew.id AS new_id, sBJ.id AS old_id
  FROM public.subjects sNew
  JOIN public.subjects sBJ
    ON sNew.code = sBJ.code AND sNew.niveau_code = sBJ.niveau_code
     AND coalesce(sNew.serie_code, '') = coalesce(sBJ.serie_code, '')
 WHERE sNew.pays='DZ';
INSERT INTO public.chapters (subject_id, pays, slug, num, title, sa_label, classe, pdf_url,
  is_free, price, cours, exemple_titre, exemple_enonce, exemple_solution,
  exercice_consigne, exercice_question, exercice_type, exercice_options, correct_option, explication, published)
SELECT m.new_id, 'DZ'::text,
       c.slug || '~' || lower('DZ'),
       c.num + 3500000,
       c.title, c.sa_label, c.classe, c.pdf_url, c.is_free, c.price, c.cours,
       c.exemple_titre, c.exemple_enonce, c.exemple_solution,
       c.exercice_consigne, c.exercice_question, c.exercice_type,
       c.exercice_options, c.correct_option, c.explication,
       coalesce(c.published, true)
  FROM public.chapters c JOIN __map_DZ m ON m.old_id = c.subject_id
 WHERE c.pays='BJ';
DROP TABLE __map_DZ;
-- Séquences (Revizy-générique, pas de provenance nationale officieuse)
INSERT INTO public.curriculum_sequences (pays, niveau_code, serie_code, subject_name, sequences, source, updated_at)
SELECT 'DZ'::text, s.niveau_code, s.serie_code, s.subject_name, s.sequences,
       'revizy_generic', now()
FROM public.curriculum_sequences s
 WHERE s.pays='BJ'
ON CONFLICT DO NOTHING;

-- TN
-- Matières
INSERT INTO public.subjects (pays, code, name, icon, description, niveau_code, serie_code, display_order, published)
SELECT 'TN'::text, code, name, icon, coalesce(description, ''), niveau_code, serie_code, display_order, true
FROM public.subjects WHERE pays='BJ' ON CONFLICT (pays, niveau_code, serie_code, code) DO NOTHING;
-- Chapitres (offset 3600000 sur le BJ)
CREATE TEMP TABLE __map_TN ON COMMIT DROP AS
  SELECT sNew.id AS new_id, sBJ.id AS old_id
  FROM public.subjects sNew
  JOIN public.subjects sBJ
    ON sNew.code = sBJ.code AND sNew.niveau_code = sBJ.niveau_code
     AND coalesce(sNew.serie_code, '') = coalesce(sBJ.serie_code, '')
 WHERE sNew.pays='TN';
INSERT INTO public.chapters (subject_id, pays, slug, num, title, sa_label, classe, pdf_url,
  is_free, price, cours, exemple_titre, exemple_enonce, exemple_solution,
  exercice_consigne, exercice_question, exercice_type, exercice_options, correct_option, explication, published)
SELECT m.new_id, 'TN'::text,
       c.slug || '~' || lower('TN'),
       c.num + 3600000,
       c.title, c.sa_label, c.classe, c.pdf_url, c.is_free, c.price, c.cours,
       c.exemple_titre, c.exemple_enonce, c.exemple_solution,
       c.exercice_consigne, c.exercice_question, c.exercice_type,
       c.exercice_options, c.correct_option, c.explication,
       coalesce(c.published, true)
  FROM public.chapters c JOIN __map_TN m ON m.old_id = c.subject_id
 WHERE c.pays='BJ';
DROP TABLE __map_TN;
-- Séquences (Revizy-générique, pas de provenance nationale officieuse)
INSERT INTO public.curriculum_sequences (pays, niveau_code, serie_code, subject_name, sequences, source, updated_at)
SELECT 'TN'::text, s.niveau_code, s.serie_code, s.subject_name, s.sequences,
       'revizy_generic', now()
FROM public.curriculum_sequences s
 WHERE s.pays='BJ'
ON CONFLICT DO NOTHING;

-- EG
-- Matières
INSERT INTO public.subjects (pays, code, name, icon, description, niveau_code, serie_code, display_order, published)
SELECT 'EG'::text, code, name, icon, coalesce(description, ''), niveau_code, serie_code, display_order, true
FROM public.subjects WHERE pays='BJ' ON CONFLICT (pays, niveau_code, serie_code, code) DO NOTHING;
-- Chapitres (offset 3700000 sur le BJ)
CREATE TEMP TABLE __map_EG ON COMMIT DROP AS
  SELECT sNew.id AS new_id, sBJ.id AS old_id
  FROM public.subjects sNew
  JOIN public.subjects sBJ
    ON sNew.code = sBJ.code AND sNew.niveau_code = sBJ.niveau_code
     AND coalesce(sNew.serie_code, '') = coalesce(sBJ.serie_code, '')
 WHERE sNew.pays='EG';
INSERT INTO public.chapters (subject_id, pays, slug, num, title, sa_label, classe, pdf_url,
  is_free, price, cours, exemple_titre, exemple_enonce, exemple_solution,
  exercice_consigne, exercice_question, exercice_type, exercice_options, correct_option, explication, published)
SELECT m.new_id, 'EG'::text,
       c.slug || '~' || lower('EG'),
       c.num + 3700000,
       c.title, c.sa_label, c.classe, c.pdf_url, c.is_free, c.price, c.cours,
       c.exemple_titre, c.exemple_enonce, c.exemple_solution,
       c.exercice_consigne, c.exercice_question, c.exercice_type,
       c.exercice_options, c.correct_option, c.explication,
       coalesce(c.published, true)
  FROM public.chapters c JOIN __map_EG m ON m.old_id = c.subject_id
 WHERE c.pays='BJ';
DROP TABLE __map_EG;
-- Séquences (Revizy-générique, pas de provenance nationale officieuse)
INSERT INTO public.curriculum_sequences (pays, niveau_code, serie_code, subject_name, sequences, source, updated_at)
SELECT 'EG'::text, s.niveau_code, s.serie_code, s.subject_name, s.sequences,
       'revizy_generic', now()
FROM public.curriculum_sequences s
 WHERE s.pays='BJ'
ON CONFLICT DO NOTHING;

-- LY
-- Matières
INSERT INTO public.subjects (pays, code, name, icon, description, niveau_code, serie_code, display_order, published)
SELECT 'LY'::text, code, name, icon, coalesce(description, ''), niveau_code, serie_code, display_order, true
FROM public.subjects WHERE pays='BJ' ON CONFLICT (pays, niveau_code, serie_code, code) DO NOTHING;
-- Chapitres (offset 3800000 sur le BJ)
CREATE TEMP TABLE __map_LY ON COMMIT DROP AS
  SELECT sNew.id AS new_id, sBJ.id AS old_id
  FROM public.subjects sNew
  JOIN public.subjects sBJ
    ON sNew.code = sBJ.code AND sNew.niveau_code = sBJ.niveau_code
     AND coalesce(sNew.serie_code, '') = coalesce(sBJ.serie_code, '')
 WHERE sNew.pays='LY';
INSERT INTO public.chapters (subject_id, pays, slug, num, title, sa_label, classe, pdf_url,
  is_free, price, cours, exemple_titre, exemple_enonce, exemple_solution,
  exercice_consigne, exercice_question, exercice_type, exercice_options, correct_option, explication, published)
SELECT m.new_id, 'LY'::text,
       c.slug || '~' || lower('LY'),
       c.num + 3800000,
       c.title, c.sa_label, c.classe, c.pdf_url, c.is_free, c.price, c.cours,
       c.exemple_titre, c.exemple_enonce, c.exemple_solution,
       c.exercice_consigne, c.exercice_question, c.exercice_type,
       c.exercice_options, c.correct_option, c.explication,
       coalesce(c.published, true)
  FROM public.chapters c JOIN __map_LY m ON m.old_id = c.subject_id
 WHERE c.pays='BJ';
DROP TABLE __map_LY;
-- Séquences (Revizy-générique, pas de provenance nationale officieuse)
INSERT INTO public.curriculum_sequences (pays, niveau_code, serie_code, subject_name, sequences, source, updated_at)
SELECT 'LY'::text, s.niveau_code, s.serie_code, s.subject_name, s.sequences,
       'revizy_generic', now()
FROM public.curriculum_sequences s
 WHERE s.pays='BJ'
ON CONFLICT DO NOTHING;

-- SD
-- Matières
INSERT INTO public.subjects (pays, code, name, icon, description, niveau_code, serie_code, display_order, published)
SELECT 'SD'::text, code, name, icon, coalesce(description, ''), niveau_code, serie_code, display_order, true
FROM public.subjects WHERE pays='BJ' ON CONFLICT (pays, niveau_code, serie_code, code) DO NOTHING;
-- Chapitres (offset 3900000 sur le BJ)
CREATE TEMP TABLE __map_SD ON COMMIT DROP AS
  SELECT sNew.id AS new_id, sBJ.id AS old_id
  FROM public.subjects sNew
  JOIN public.subjects sBJ
    ON sNew.code = sBJ.code AND sNew.niveau_code = sBJ.niveau_code
     AND coalesce(sNew.serie_code, '') = coalesce(sBJ.serie_code, '')
 WHERE sNew.pays='SD';
INSERT INTO public.chapters (subject_id, pays, slug, num, title, sa_label, classe, pdf_url,
  is_free, price, cours, exemple_titre, exemple_enonce, exemple_solution,
  exercice_consigne, exercice_question, exercice_type, exercice_options, correct_option, explication, published)
SELECT m.new_id, 'SD'::text,
       c.slug || '~' || lower('SD'),
       c.num + 3900000,
       c.title, c.sa_label, c.classe, c.pdf_url, c.is_free, c.price, c.cours,
       c.exemple_titre, c.exemple_enonce, c.exemple_solution,
       c.exercice_consigne, c.exercice_question, c.exercice_type,
       c.exercice_options, c.correct_option, c.explication,
       coalesce(c.published, true)
  FROM public.chapters c JOIN __map_SD m ON m.old_id = c.subject_id
 WHERE c.pays='BJ';
DROP TABLE __map_SD;
-- Séquences (Revizy-générique, pas de provenance nationale officieuse)
INSERT INTO public.curriculum_sequences (pays, niveau_code, serie_code, subject_name, sequences, source, updated_at)
SELECT 'SD'::text, s.niveau_code, s.serie_code, s.subject_name, s.sequences,
       'revizy_generic', now()
FROM public.curriculum_sequences s
 WHERE s.pays='BJ'
ON CONFLICT DO NOTHING;

-- ZA
-- Matières
INSERT INTO public.subjects (pays, code, name, icon, description, niveau_code, serie_code, display_order, published)
SELECT 'ZA'::text, code, name, icon, coalesce(description, ''), niveau_code, serie_code, display_order, true
FROM public.subjects WHERE pays='BJ' ON CONFLICT (pays, niveau_code, serie_code, code) DO NOTHING;
-- Chapitres (offset 4000000 sur le BJ)
CREATE TEMP TABLE __map_ZA ON COMMIT DROP AS
  SELECT sNew.id AS new_id, sBJ.id AS old_id
  FROM public.subjects sNew
  JOIN public.subjects sBJ
    ON sNew.code = sBJ.code AND sNew.niveau_code = sBJ.niveau_code
     AND coalesce(sNew.serie_code, '') = coalesce(sBJ.serie_code, '')
 WHERE sNew.pays='ZA';
INSERT INTO public.chapters (subject_id, pays, slug, num, title, sa_label, classe, pdf_url,
  is_free, price, cours, exemple_titre, exemple_enonce, exemple_solution,
  exercice_consigne, exercice_question, exercice_type, exercice_options, correct_option, explication, published)
SELECT m.new_id, 'ZA'::text,
       c.slug || '~' || lower('ZA'),
       c.num + 4000000,
       c.title, c.sa_label, c.classe, c.pdf_url, c.is_free, c.price, c.cours,
       c.exemple_titre, c.exemple_enonce, c.exemple_solution,
       c.exercice_consigne, c.exercice_question, c.exercice_type,
       c.exercice_options, c.correct_option, c.explication,
       coalesce(c.published, true)
  FROM public.chapters c JOIN __map_ZA m ON m.old_id = c.subject_id
 WHERE c.pays='BJ';
DROP TABLE __map_ZA;
-- Séquences (Revizy-générique, pas de provenance nationale officieuse)
INSERT INTO public.curriculum_sequences (pays, niveau_code, serie_code, subject_name, sequences, source, updated_at)
SELECT 'ZA'::text, s.niveau_code, s.serie_code, s.subject_name, s.sequences,
       'revizy_generic', now()
FROM public.curriculum_sequences s
 WHERE s.pays='BJ'
ON CONFLICT DO NOTHING;

-- NA
-- Matières
INSERT INTO public.subjects (pays, code, name, icon, description, niveau_code, serie_code, display_order, published)
SELECT 'NA'::text, code, name, icon, coalesce(description, ''), niveau_code, serie_code, display_order, true
FROM public.subjects WHERE pays='BJ' ON CONFLICT (pays, niveau_code, serie_code, code) DO NOTHING;
-- Chapitres (offset 4100000 sur le BJ)
CREATE TEMP TABLE __map_NA ON COMMIT DROP AS
  SELECT sNew.id AS new_id, sBJ.id AS old_id
  FROM public.subjects sNew
  JOIN public.subjects sBJ
    ON sNew.code = sBJ.code AND sNew.niveau_code = sBJ.niveau_code
     AND coalesce(sNew.serie_code, '') = coalesce(sBJ.serie_code, '')
 WHERE sNew.pays='NA';
INSERT INTO public.chapters (subject_id, pays, slug, num, title, sa_label, classe, pdf_url,
  is_free, price, cours, exemple_titre, exemple_enonce, exemple_solution,
  exercice_consigne, exercice_question, exercice_type, exercice_options, correct_option, explication, published)
SELECT m.new_id, 'NA'::text,
       c.slug || '~' || lower('NA'),
       c.num + 4100000,
       c.title, c.sa_label, c.classe, c.pdf_url, c.is_free, c.price, c.cours,
       c.exemple_titre, c.exemple_enonce, c.exemple_solution,
       c.exercice_consigne, c.exercice_question, c.exercice_type,
       c.exercice_options, c.correct_option, c.explication,
       coalesce(c.published, true)
  FROM public.chapters c JOIN __map_NA m ON m.old_id = c.subject_id
 WHERE c.pays='BJ';
DROP TABLE __map_NA;
-- Séquences (Revizy-générique, pas de provenance nationale officieuse)
INSERT INTO public.curriculum_sequences (pays, niveau_code, serie_code, subject_name, sequences, source, updated_at)
SELECT 'NA'::text, s.niveau_code, s.serie_code, s.subject_name, s.sequences,
       'revizy_generic', now()
FROM public.curriculum_sequences s
 WHERE s.pays='BJ'
ON CONFLICT DO NOTHING;

-- BW
-- Matières
INSERT INTO public.subjects (pays, code, name, icon, description, niveau_code, serie_code, display_order, published)
SELECT 'BW'::text, code, name, icon, coalesce(description, ''), niveau_code, serie_code, display_order, true
FROM public.subjects WHERE pays='BJ' ON CONFLICT (pays, niveau_code, serie_code, code) DO NOTHING;
-- Chapitres (offset 4200000 sur le BJ)
CREATE TEMP TABLE __map_BW ON COMMIT DROP AS
  SELECT sNew.id AS new_id, sBJ.id AS old_id
  FROM public.subjects sNew
  JOIN public.subjects sBJ
    ON sNew.code = sBJ.code AND sNew.niveau_code = sBJ.niveau_code
     AND coalesce(sNew.serie_code, '') = coalesce(sBJ.serie_code, '')
 WHERE sNew.pays='BW';
INSERT INTO public.chapters (subject_id, pays, slug, num, title, sa_label, classe, pdf_url,
  is_free, price, cours, exemple_titre, exemple_enonce, exemple_solution,
  exercice_consigne, exercice_question, exercice_type, exercice_options, correct_option, explication, published)
SELECT m.new_id, 'BW'::text,
       c.slug || '~' || lower('BW'),
       c.num + 4200000,
       c.title, c.sa_label, c.classe, c.pdf_url, c.is_free, c.price, c.cours,
       c.exemple_titre, c.exemple_enonce, c.exemple_solution,
       c.exercice_consigne, c.exercice_question, c.exercice_type,
       c.exercice_options, c.correct_option, c.explication,
       coalesce(c.published, true)
  FROM public.chapters c JOIN __map_BW m ON m.old_id = c.subject_id
 WHERE c.pays='BJ';
DROP TABLE __map_BW;
-- Séquences (Revizy-générique, pas de provenance nationale officieuse)
INSERT INTO public.curriculum_sequences (pays, niveau_code, serie_code, subject_name, sequences, source, updated_at)
SELECT 'BW'::text, s.niveau_code, s.serie_code, s.subject_name, s.sequences,
       'revizy_generic', now()
FROM public.curriculum_sequences s
 WHERE s.pays='BJ'
ON CONFLICT DO NOTHING;

-- ZW
-- Matières
INSERT INTO public.subjects (pays, code, name, icon, description, niveau_code, serie_code, display_order, published)
SELECT 'ZW'::text, code, name, icon, coalesce(description, ''), niveau_code, serie_code, display_order, true
FROM public.subjects WHERE pays='BJ' ON CONFLICT (pays, niveau_code, serie_code, code) DO NOTHING;
-- Chapitres (offset 4300000 sur le BJ)
CREATE TEMP TABLE __map_ZW ON COMMIT DROP AS
  SELECT sNew.id AS new_id, sBJ.id AS old_id
  FROM public.subjects sNew
  JOIN public.subjects sBJ
    ON sNew.code = sBJ.code AND sNew.niveau_code = sBJ.niveau_code
     AND coalesce(sNew.serie_code, '') = coalesce(sBJ.serie_code, '')
 WHERE sNew.pays='ZW';
INSERT INTO public.chapters (subject_id, pays, slug, num, title, sa_label, classe, pdf_url,
  is_free, price, cours, exemple_titre, exemple_enonce, exemple_solution,
  exercice_consigne, exercice_question, exercice_type, exercice_options, correct_option, explication, published)
SELECT m.new_id, 'ZW'::text,
       c.slug || '~' || lower('ZW'),
       c.num + 4300000,
       c.title, c.sa_label, c.classe, c.pdf_url, c.is_free, c.price, c.cours,
       c.exemple_titre, c.exemple_enonce, c.exemple_solution,
       c.exercice_consigne, c.exercice_question, c.exercice_type,
       c.exercice_options, c.correct_option, c.explication,
       coalesce(c.published, true)
  FROM public.chapters c JOIN __map_ZW m ON m.old_id = c.subject_id
 WHERE c.pays='BJ';
DROP TABLE __map_ZW;
-- Séquences (Revizy-générique, pas de provenance nationale officieuse)
INSERT INTO public.curriculum_sequences (pays, niveau_code, serie_code, subject_name, sequences, source, updated_at)
SELECT 'ZW'::text, s.niveau_code, s.serie_code, s.subject_name, s.sequences,
       'revizy_generic', now()
FROM public.curriculum_sequences s
 WHERE s.pays='BJ'
ON CONFLICT DO NOTHING;

-- MZ
-- Matières
INSERT INTO public.subjects (pays, code, name, icon, description, niveau_code, serie_code, display_order, published)
SELECT 'MZ'::text, code, name, icon, coalesce(description, ''), niveau_code, serie_code, display_order, true
FROM public.subjects WHERE pays='BJ' ON CONFLICT (pays, niveau_code, serie_code, code) DO NOTHING;
-- Chapitres (offset 4400000 sur le BJ)
CREATE TEMP TABLE __map_MZ ON COMMIT DROP AS
  SELECT sNew.id AS new_id, sBJ.id AS old_id
  FROM public.subjects sNew
  JOIN public.subjects sBJ
    ON sNew.code = sBJ.code AND sNew.niveau_code = sBJ.niveau_code
     AND coalesce(sNew.serie_code, '') = coalesce(sBJ.serie_code, '')
 WHERE sNew.pays='MZ';
INSERT INTO public.chapters (subject_id, pays, slug, num, title, sa_label, classe, pdf_url,
  is_free, price, cours, exemple_titre, exemple_enonce, exemple_solution,
  exercice_consigne, exercice_question, exercice_type, exercice_options, correct_option, explication, published)
SELECT m.new_id, 'MZ'::text,
       c.slug || '~' || lower('MZ'),
       c.num + 4400000,
       c.title, c.sa_label, c.classe, c.pdf_url, c.is_free, c.price, c.cours,
       c.exemple_titre, c.exemple_enonce, c.exemple_solution,
       c.exercice_consigne, c.exercice_question, c.exercice_type,
       c.exercice_options, c.correct_option, c.explication,
       coalesce(c.published, true)
  FROM public.chapters c JOIN __map_MZ m ON m.old_id = c.subject_id
 WHERE c.pays='BJ';
DROP TABLE __map_MZ;
-- Séquences (Revizy-générique, pas de provenance nationale officieuse)
INSERT INTO public.curriculum_sequences (pays, niveau_code, serie_code, subject_name, sequences, source, updated_at)
SELECT 'MZ'::text, s.niveau_code, s.serie_code, s.subject_name, s.sequences,
       'revizy_generic', now()
FROM public.curriculum_sequences s
 WHERE s.pays='BJ'
ON CONFLICT DO NOTHING;

-- MW
-- Matières
INSERT INTO public.subjects (pays, code, name, icon, description, niveau_code, serie_code, display_order, published)
SELECT 'MW'::text, code, name, icon, coalesce(description, ''), niveau_code, serie_code, display_order, true
FROM public.subjects WHERE pays='BJ' ON CONFLICT (pays, niveau_code, serie_code, code) DO NOTHING;
-- Chapitres (offset 4500000 sur le BJ)
CREATE TEMP TABLE __map_MW ON COMMIT DROP AS
  SELECT sNew.id AS new_id, sBJ.id AS old_id
  FROM public.subjects sNew
  JOIN public.subjects sBJ
    ON sNew.code = sBJ.code AND sNew.niveau_code = sBJ.niveau_code
     AND coalesce(sNew.serie_code, '') = coalesce(sBJ.serie_code, '')
 WHERE sNew.pays='MW';
INSERT INTO public.chapters (subject_id, pays, slug, num, title, sa_label, classe, pdf_url,
  is_free, price, cours, exemple_titre, exemple_enonce, exemple_solution,
  exercice_consigne, exercice_question, exercice_type, exercice_options, correct_option, explication, published)
SELECT m.new_id, 'MW'::text,
       c.slug || '~' || lower('MW'),
       c.num + 4500000,
       c.title, c.sa_label, c.classe, c.pdf_url, c.is_free, c.price, c.cours,
       c.exemple_titre, c.exemple_enonce, c.exemple_solution,
       c.exercice_consigne, c.exercice_question, c.exercice_type,
       c.exercice_options, c.correct_option, c.explication,
       coalesce(c.published, true)
  FROM public.chapters c JOIN __map_MW m ON m.old_id = c.subject_id
 WHERE c.pays='BJ';
DROP TABLE __map_MW;
-- Séquences (Revizy-générique, pas de provenance nationale officieuse)
INSERT INTO public.curriculum_sequences (pays, niveau_code, serie_code, subject_name, sequences, source, updated_at)
SELECT 'MW'::text, s.niveau_code, s.serie_code, s.subject_name, s.sequences,
       'revizy_generic', now()
FROM public.curriculum_sequences s
 WHERE s.pays='BJ'
ON CONFLICT DO NOTHING;

-- ZM
-- Matières
INSERT INTO public.subjects (pays, code, name, icon, description, niveau_code, serie_code, display_order, published)
SELECT 'ZM'::text, code, name, icon, coalesce(description, ''), niveau_code, serie_code, display_order, true
FROM public.subjects WHERE pays='BJ' ON CONFLICT (pays, niveau_code, serie_code, code) DO NOTHING;
-- Chapitres (offset 4600000 sur le BJ)
CREATE TEMP TABLE __map_ZM ON COMMIT DROP AS
  SELECT sNew.id AS new_id, sBJ.id AS old_id
  FROM public.subjects sNew
  JOIN public.subjects sBJ
    ON sNew.code = sBJ.code AND sNew.niveau_code = sBJ.niveau_code
     AND coalesce(sNew.serie_code, '') = coalesce(sBJ.serie_code, '')
 WHERE sNew.pays='ZM';
INSERT INTO public.chapters (subject_id, pays, slug, num, title, sa_label, classe, pdf_url,
  is_free, price, cours, exemple_titre, exemple_enonce, exemple_solution,
  exercice_consigne, exercice_question, exercice_type, exercice_options, correct_option, explication, published)
SELECT m.new_id, 'ZM'::text,
       c.slug || '~' || lower('ZM'),
       c.num + 4600000,
       c.title, c.sa_label, c.classe, c.pdf_url, c.is_free, c.price, c.cours,
       c.exemple_titre, c.exemple_enonce, c.exemple_solution,
       c.exercice_consigne, c.exercice_question, c.exercice_type,
       c.exercice_options, c.correct_option, c.explication,
       coalesce(c.published, true)
  FROM public.chapters c JOIN __map_ZM m ON m.old_id = c.subject_id
 WHERE c.pays='BJ';
DROP TABLE __map_ZM;
-- Séquences (Revizy-générique, pas de provenance nationale officieuse)
INSERT INTO public.curriculum_sequences (pays, niveau_code, serie_code, subject_name, sequences, source, updated_at)
SELECT 'ZM'::text, s.niveau_code, s.serie_code, s.subject_name, s.sequences,
       'revizy_generic', now()
FROM public.curriculum_sequences s
 WHERE s.pays='BJ'
ON CONFLICT DO NOTHING;

-- MG
-- Matières
INSERT INTO public.subjects (pays, code, name, icon, description, niveau_code, serie_code, display_order, published)
SELECT 'MG'::text, code, name, icon, coalesce(description, ''), niveau_code, serie_code, display_order, true
FROM public.subjects WHERE pays='BJ' ON CONFLICT (pays, niveau_code, serie_code, code) DO NOTHING;
-- Chapitres (offset 4700000 sur le BJ)
CREATE TEMP TABLE __map_MG ON COMMIT DROP AS
  SELECT sNew.id AS new_id, sBJ.id AS old_id
  FROM public.subjects sNew
  JOIN public.subjects sBJ
    ON sNew.code = sBJ.code AND sNew.niveau_code = sBJ.niveau_code
     AND coalesce(sNew.serie_code, '') = coalesce(sBJ.serie_code, '')
 WHERE sNew.pays='MG';
INSERT INTO public.chapters (subject_id, pays, slug, num, title, sa_label, classe, pdf_url,
  is_free, price, cours, exemple_titre, exemple_enonce, exemple_solution,
  exercice_consigne, exercice_question, exercice_type, exercice_options, correct_option, explication, published)
SELECT m.new_id, 'MG'::text,
       c.slug || '~' || lower('MG'),
       c.num + 4700000,
       c.title, c.sa_label, c.classe, c.pdf_url, c.is_free, c.price, c.cours,
       c.exemple_titre, c.exemple_enonce, c.exemple_solution,
       c.exercice_consigne, c.exercice_question, c.exercice_type,
       c.exercice_options, c.correct_option, c.explication,
       coalesce(c.published, true)
  FROM public.chapters c JOIN __map_MG m ON m.old_id = c.subject_id
 WHERE c.pays='BJ';
DROP TABLE __map_MG;
-- Séquences (Revizy-générique, pas de provenance nationale officieuse)
INSERT INTO public.curriculum_sequences (pays, niveau_code, serie_code, subject_name, sequences, source, updated_at)
SELECT 'MG'::text, s.niveau_code, s.serie_code, s.subject_name, s.sequences,
       'revizy_generic', now()
FROM public.curriculum_sequences s
 WHERE s.pays='BJ'
ON CONFLICT DO NOTHING;

-- MU
-- Matières
INSERT INTO public.subjects (pays, code, name, icon, description, niveau_code, serie_code, display_order, published)
SELECT 'MU'::text, code, name, icon, coalesce(description, ''), niveau_code, serie_code, display_order, true
FROM public.subjects WHERE pays='BJ' ON CONFLICT (pays, niveau_code, serie_code, code) DO NOTHING;
-- Chapitres (offset 4800000 sur le BJ)
CREATE TEMP TABLE __map_MU ON COMMIT DROP AS
  SELECT sNew.id AS new_id, sBJ.id AS old_id
  FROM public.subjects sNew
  JOIN public.subjects sBJ
    ON sNew.code = sBJ.code AND sNew.niveau_code = sBJ.niveau_code
     AND coalesce(sNew.serie_code, '') = coalesce(sBJ.serie_code, '')
 WHERE sNew.pays='MU';
INSERT INTO public.chapters (subject_id, pays, slug, num, title, sa_label, classe, pdf_url,
  is_free, price, cours, exemple_titre, exemple_enonce, exemple_solution,
  exercice_consigne, exercice_question, exercice_type, exercice_options, correct_option, explication, published)
SELECT m.new_id, 'MU'::text,
       c.slug || '~' || lower('MU'),
       c.num + 4800000,
       c.title, c.sa_label, c.classe, c.pdf_url, c.is_free, c.price, c.cours,
       c.exemple_titre, c.exemple_enonce, c.exemple_solution,
       c.exercice_consigne, c.exercice_question, c.exercice_type,
       c.exercice_options, c.correct_option, c.explication,
       coalesce(c.published, true)
  FROM public.chapters c JOIN __map_MU m ON m.old_id = c.subject_id
 WHERE c.pays='BJ';
DROP TABLE __map_MU;
-- Séquences (Revizy-générique, pas de provenance nationale officieuse)
INSERT INTO public.curriculum_sequences (pays, niveau_code, serie_code, subject_name, sequences, source, updated_at)
SELECT 'MU'::text, s.niveau_code, s.serie_code, s.subject_name, s.sequences,
       'revizy_generic', now()
FROM public.curriculum_sequences s
 WHERE s.pays='BJ'
ON CONFLICT DO NOTHING;

-- SC
-- Matières
INSERT INTO public.subjects (pays, code, name, icon, description, niveau_code, serie_code, display_order, published)
SELECT 'SC'::text, code, name, icon, coalesce(description, ''), niveau_code, serie_code, display_order, true
FROM public.subjects WHERE pays='BJ' ON CONFLICT (pays, niveau_code, serie_code, code) DO NOTHING;
-- Chapitres (offset 4900000 sur le BJ)
CREATE TEMP TABLE __map_SC ON COMMIT DROP AS
  SELECT sNew.id AS new_id, sBJ.id AS old_id
  FROM public.subjects sNew
  JOIN public.subjects sBJ
    ON sNew.code = sBJ.code AND sNew.niveau_code = sBJ.niveau_code
     AND coalesce(sNew.serie_code, '') = coalesce(sBJ.serie_code, '')
 WHERE sNew.pays='SC';
INSERT INTO public.chapters (subject_id, pays, slug, num, title, sa_label, classe, pdf_url,
  is_free, price, cours, exemple_titre, exemple_enonce, exemple_solution,
  exercice_consigne, exercice_question, exercice_type, exercice_options, correct_option, explication, published)
SELECT m.new_id, 'SC'::text,
       c.slug || '~' || lower('SC'),
       c.num + 4900000,
       c.title, c.sa_label, c.classe, c.pdf_url, c.is_free, c.price, c.cours,
       c.exemple_titre, c.exemple_enonce, c.exemple_solution,
       c.exercice_consigne, c.exercice_question, c.exercice_type,
       c.exercice_options, c.correct_option, c.explication,
       coalesce(c.published, true)
  FROM public.chapters c JOIN __map_SC m ON m.old_id = c.subject_id
 WHERE c.pays='BJ';
DROP TABLE __map_SC;
-- Séquences (Revizy-générique, pas de provenance nationale officieuse)
INSERT INTO public.curriculum_sequences (pays, niveau_code, serie_code, subject_name, sequences, source, updated_at)
SELECT 'SC'::text, s.niveau_code, s.serie_code, s.subject_name, s.sequences,
       'revizy_generic', now()
FROM public.curriculum_sequences s
 WHERE s.pays='BJ'
ON CONFLICT DO NOTHING;

-- LS
-- Matières
INSERT INTO public.subjects (pays, code, name, icon, description, niveau_code, serie_code, display_order, published)
SELECT 'LS'::text, code, name, icon, coalesce(description, ''), niveau_code, serie_code, display_order, true
FROM public.subjects WHERE pays='BJ' ON CONFLICT (pays, niveau_code, serie_code, code) DO NOTHING;
-- Chapitres (offset 5000000 sur le BJ)
CREATE TEMP TABLE __map_LS ON COMMIT DROP AS
  SELECT sNew.id AS new_id, sBJ.id AS old_id
  FROM public.subjects sNew
  JOIN public.subjects sBJ
    ON sNew.code = sBJ.code AND sNew.niveau_code = sBJ.niveau_code
     AND coalesce(sNew.serie_code, '') = coalesce(sBJ.serie_code, '')
 WHERE sNew.pays='LS';
INSERT INTO public.chapters (subject_id, pays, slug, num, title, sa_label, classe, pdf_url,
  is_free, price, cours, exemple_titre, exemple_enonce, exemple_solution,
  exercice_consigne, exercice_question, exercice_type, exercice_options, correct_option, explication, published)
SELECT m.new_id, 'LS'::text,
       c.slug || '~' || lower('LS'),
       c.num + 5000000,
       c.title, c.sa_label, c.classe, c.pdf_url, c.is_free, c.price, c.cours,
       c.exemple_titre, c.exemple_enonce, c.exemple_solution,
       c.exercice_consigne, c.exercice_question, c.exercice_type,
       c.exercice_options, c.correct_option, c.explication,
       coalesce(c.published, true)
  FROM public.chapters c JOIN __map_LS m ON m.old_id = c.subject_id
 WHERE c.pays='BJ';
DROP TABLE __map_LS;
-- Séquences (Revizy-générique, pas de provenance nationale officieuse)
INSERT INTO public.curriculum_sequences (pays, niveau_code, serie_code, subject_name, sequences, source, updated_at)
SELECT 'LS'::text, s.niveau_code, s.serie_code, s.subject_name, s.sequences,
       'revizy_generic', now()
FROM public.curriculum_sequences s
 WHERE s.pays='BJ'
ON CONFLICT DO NOTHING;

-- SZ
-- Matières
INSERT INTO public.subjects (pays, code, name, icon, description, niveau_code, serie_code, display_order, published)
SELECT 'SZ'::text, code, name, icon, coalesce(description, ''), niveau_code, serie_code, display_order, true
FROM public.subjects WHERE pays='BJ' ON CONFLICT (pays, niveau_code, serie_code, code) DO NOTHING;
-- Chapitres (offset 5100000 sur le BJ)
CREATE TEMP TABLE __map_SZ ON COMMIT DROP AS
  SELECT sNew.id AS new_id, sBJ.id AS old_id
  FROM public.subjects sNew
  JOIN public.subjects sBJ
    ON sNew.code = sBJ.code AND sNew.niveau_code = sBJ.niveau_code
     AND coalesce(sNew.serie_code, '') = coalesce(sBJ.serie_code, '')
 WHERE sNew.pays='SZ';
INSERT INTO public.chapters (subject_id, pays, slug, num, title, sa_label, classe, pdf_url,
  is_free, price, cours, exemple_titre, exemple_enonce, exemple_solution,
  exercice_consigne, exercice_question, exercice_type, exercice_options, correct_option, explication, published)
SELECT m.new_id, 'SZ'::text,
       c.slug || '~' || lower('SZ'),
       c.num + 5100000,
       c.title, c.sa_label, c.classe, c.pdf_url, c.is_free, c.price, c.cours,
       c.exemple_titre, c.exemple_enonce, c.exemple_solution,
       c.exercice_consigne, c.exercice_question, c.exercice_type,
       c.exercice_options, c.correct_option, c.explication,
       coalesce(c.published, true)
  FROM public.chapters c JOIN __map_SZ m ON m.old_id = c.subject_id
 WHERE c.pays='BJ';
DROP TABLE __map_SZ;
-- Séquences (Revizy-générique, pas de provenance nationale officieuse)
INSERT INTO public.curriculum_sequences (pays, niveau_code, serie_code, subject_name, sequences, source, updated_at)
SELECT 'SZ'::text, s.niveau_code, s.serie_code, s.subject_name, s.sequences,
       'revizy_generic', now()
FROM public.curriculum_sequences s
 WHERE s.pays='BJ'
ON CONFLICT DO NOTHING;

-- FR
-- Matières
INSERT INTO public.subjects (pays, code, name, icon, description, niveau_code, serie_code, display_order, published)
SELECT 'FR'::text, code, name, icon, coalesce(description, ''), niveau_code, serie_code, display_order, true
FROM public.subjects WHERE pays='BJ' ON CONFLICT (pays, niveau_code, serie_code, code) DO NOTHING;
-- Chapitres (offset 5200000 sur le BJ)
CREATE TEMP TABLE __map_FR ON COMMIT DROP AS
  SELECT sNew.id AS new_id, sBJ.id AS old_id
  FROM public.subjects sNew
  JOIN public.subjects sBJ
    ON sNew.code = sBJ.code AND sNew.niveau_code = sBJ.niveau_code
     AND coalesce(sNew.serie_code, '') = coalesce(sBJ.serie_code, '')
 WHERE sNew.pays='FR';
INSERT INTO public.chapters (subject_id, pays, slug, num, title, sa_label, classe, pdf_url,
  is_free, price, cours, exemple_titre, exemple_enonce, exemple_solution,
  exercice_consigne, exercice_question, exercice_type, exercice_options, correct_option, explication, published)
SELECT m.new_id, 'FR'::text,
       c.slug || '~' || lower('FR'),
       c.num + 5200000,
       c.title, c.sa_label, c.classe, c.pdf_url, c.is_free, c.price, c.cours,
       c.exemple_titre, c.exemple_enonce, c.exemple_solution,
       c.exercice_consigne, c.exercice_question, c.exercice_type,
       c.exercice_options, c.correct_option, c.explication,
       coalesce(c.published, true)
  FROM public.chapters c JOIN __map_FR m ON m.old_id = c.subject_id
 WHERE c.pays='BJ';
DROP TABLE __map_FR;
-- Séquences (Revizy-générique, pas de provenance nationale officieuse)
INSERT INTO public.curriculum_sequences (pays, niveau_code, serie_code, subject_name, sequences, source, updated_at)
SELECT 'FR'::text, s.niveau_code, s.serie_code, s.subject_name, s.sequences,
       'revizy_generic', now()
FROM public.curriculum_sequences s
 WHERE s.pays='BJ'
ON CONFLICT DO NOTHING;

-- BE
-- Matières
INSERT INTO public.subjects (pays, code, name, icon, description, niveau_code, serie_code, display_order, published)
SELECT 'BE'::text, code, name, icon, coalesce(description, ''), niveau_code, serie_code, display_order, true
FROM public.subjects WHERE pays='BJ' ON CONFLICT (pays, niveau_code, serie_code, code) DO NOTHING;
-- Chapitres (offset 5300000 sur le BJ)
CREATE TEMP TABLE __map_BE ON COMMIT DROP AS
  SELECT sNew.id AS new_id, sBJ.id AS old_id
  FROM public.subjects sNew
  JOIN public.subjects sBJ
    ON sNew.code = sBJ.code AND sNew.niveau_code = sBJ.niveau_code
     AND coalesce(sNew.serie_code, '') = coalesce(sBJ.serie_code, '')
 WHERE sNew.pays='BE';
INSERT INTO public.chapters (subject_id, pays, slug, num, title, sa_label, classe, pdf_url,
  is_free, price, cours, exemple_titre, exemple_enonce, exemple_solution,
  exercice_consigne, exercice_question, exercice_type, exercice_options, correct_option, explication, published)
SELECT m.new_id, 'BE'::text,
       c.slug || '~' || lower('BE'),
       c.num + 5300000,
       c.title, c.sa_label, c.classe, c.pdf_url, c.is_free, c.price, c.cours,
       c.exemple_titre, c.exemple_enonce, c.exemple_solution,
       c.exercice_consigne, c.exercice_question, c.exercice_type,
       c.exercice_options, c.correct_option, c.explication,
       coalesce(c.published, true)
  FROM public.chapters c JOIN __map_BE m ON m.old_id = c.subject_id
 WHERE c.pays='BJ';
DROP TABLE __map_BE;
-- Séquences (Revizy-générique, pas de provenance nationale officieuse)
INSERT INTO public.curriculum_sequences (pays, niveau_code, serie_code, subject_name, sequences, source, updated_at)
SELECT 'BE'::text, s.niveau_code, s.serie_code, s.subject_name, s.sequences,
       'revizy_generic', now()
FROM public.curriculum_sequences s
 WHERE s.pays='BJ'
ON CONFLICT DO NOTHING;

-- CA
-- Matières
INSERT INTO public.subjects (pays, code, name, icon, description, niveau_code, serie_code, display_order, published)
SELECT 'CA'::text, code, name, icon, coalesce(description, ''), niveau_code, serie_code, display_order, true
FROM public.subjects WHERE pays='BJ' ON CONFLICT (pays, niveau_code, serie_code, code) DO NOTHING;
-- Chapitres (offset 5400000 sur le BJ)
CREATE TEMP TABLE __map_CA ON COMMIT DROP AS
  SELECT sNew.id AS new_id, sBJ.id AS old_id
  FROM public.subjects sNew
  JOIN public.subjects sBJ
    ON sNew.code = sBJ.code AND sNew.niveau_code = sBJ.niveau_code
     AND coalesce(sNew.serie_code, '') = coalesce(sBJ.serie_code, '')
 WHERE sNew.pays='CA';
INSERT INTO public.chapters (subject_id, pays, slug, num, title, sa_label, classe, pdf_url,
  is_free, price, cours, exemple_titre, exemple_enonce, exemple_solution,
  exercice_consigne, exercice_question, exercice_type, exercice_options, correct_option, explication, published)
SELECT m.new_id, 'CA'::text,
       c.slug || '~' || lower('CA'),
       c.num + 5400000,
       c.title, c.sa_label, c.classe, c.pdf_url, c.is_free, c.price, c.cours,
       c.exemple_titre, c.exemple_enonce, c.exemple_solution,
       c.exercice_consigne, c.exercice_question, c.exercice_type,
       c.exercice_options, c.correct_option, c.explication,
       coalesce(c.published, true)
  FROM public.chapters c JOIN __map_CA m ON m.old_id = c.subject_id
 WHERE c.pays='BJ';
DROP TABLE __map_CA;
-- Séquences (Revizy-générique, pas de provenance nationale officieuse)
INSERT INTO public.curriculum_sequences (pays, niveau_code, serie_code, subject_name, sequences, source, updated_at)
SELECT 'CA'::text, s.niveau_code, s.serie_code, s.subject_name, s.sequences,
       'revizy_generic', now()
FROM public.curriculum_sequences s
 WHERE s.pays='BJ'
ON CONFLICT DO NOTHING;

-- CH
-- Matières
INSERT INTO public.subjects (pays, code, name, icon, description, niveau_code, serie_code, display_order, published)
SELECT 'CH'::text, code, name, icon, coalesce(description, ''), niveau_code, serie_code, display_order, true
FROM public.subjects WHERE pays='BJ' ON CONFLICT (pays, niveau_code, serie_code, code) DO NOTHING;
-- Chapitres (offset 5500000 sur le BJ)
CREATE TEMP TABLE __map_CH ON COMMIT DROP AS
  SELECT sNew.id AS new_id, sBJ.id AS old_id
  FROM public.subjects sNew
  JOIN public.subjects sBJ
    ON sNew.code = sBJ.code AND sNew.niveau_code = sBJ.niveau_code
     AND coalesce(sNew.serie_code, '') = coalesce(sBJ.serie_code, '')
 WHERE sNew.pays='CH';
INSERT INTO public.chapters (subject_id, pays, slug, num, title, sa_label, classe, pdf_url,
  is_free, price, cours, exemple_titre, exemple_enonce, exemple_solution,
  exercice_consigne, exercice_question, exercice_type, exercice_options, correct_option, explication, published)
SELECT m.new_id, 'CH'::text,
       c.slug || '~' || lower('CH'),
       c.num + 5500000,
       c.title, c.sa_label, c.classe, c.pdf_url, c.is_free, c.price, c.cours,
       c.exemple_titre, c.exemple_enonce, c.exemple_solution,
       c.exercice_consigne, c.exercice_question, c.exercice_type,
       c.exercice_options, c.correct_option, c.explication,
       coalesce(c.published, true)
  FROM public.chapters c JOIN __map_CH m ON m.old_id = c.subject_id
 WHERE c.pays='BJ';
DROP TABLE __map_CH;
-- Séquences (Revizy-générique, pas de provenance nationale officieuse)
INSERT INTO public.curriculum_sequences (pays, niveau_code, serie_code, subject_name, sequences, source, updated_at)
SELECT 'CH'::text, s.niveau_code, s.serie_code, s.subject_name, s.sequences,
       'revizy_generic', now()
FROM public.curriculum_sequences s
 WHERE s.pays='BJ'
ON CONFLICT DO NOTHING;

-- US
-- Matières
INSERT INTO public.subjects (pays, code, name, icon, description, niveau_code, serie_code, display_order, published)
SELECT 'US'::text, code, name, icon, coalesce(description, ''), niveau_code, serie_code, display_order, true
FROM public.subjects WHERE pays='BJ' ON CONFLICT (pays, niveau_code, serie_code, code) DO NOTHING;
-- Chapitres (offset 5600000 sur le BJ)
CREATE TEMP TABLE __map_US ON COMMIT DROP AS
  SELECT sNew.id AS new_id, sBJ.id AS old_id
  FROM public.subjects sNew
  JOIN public.subjects sBJ
    ON sNew.code = sBJ.code AND sNew.niveau_code = sBJ.niveau_code
     AND coalesce(sNew.serie_code, '') = coalesce(sBJ.serie_code, '')
 WHERE sNew.pays='US';
INSERT INTO public.chapters (subject_id, pays, slug, num, title, sa_label, classe, pdf_url,
  is_free, price, cours, exemple_titre, exemple_enonce, exemple_solution,
  exercice_consigne, exercice_question, exercice_type, exercice_options, correct_option, explication, published)
SELECT m.new_id, 'US'::text,
       c.slug || '~' || lower('US'),
       c.num + 5600000,
       c.title, c.sa_label, c.classe, c.pdf_url, c.is_free, c.price, c.cours,
       c.exemple_titre, c.exemple_enonce, c.exemple_solution,
       c.exercice_consigne, c.exercice_question, c.exercice_type,
       c.exercice_options, c.correct_option, c.explication,
       coalesce(c.published, true)
  FROM public.chapters c JOIN __map_US m ON m.old_id = c.subject_id
 WHERE c.pays='BJ';
DROP TABLE __map_US;
-- Séquences (Revizy-générique, pas de provenance nationale officieuse)
INSERT INTO public.curriculum_sequences (pays, niveau_code, serie_code, subject_name, sequences, source, updated_at)
SELECT 'US'::text, s.niveau_code, s.serie_code, s.subject_name, s.sequences,
       'revizy_generic', now()
FROM public.curriculum_sequences s
 WHERE s.pays='BJ'
ON CONFLICT DO NOTHING;

-- GB
-- Matières
INSERT INTO public.subjects (pays, code, name, icon, description, niveau_code, serie_code, display_order, published)
SELECT 'GB'::text, code, name, icon, coalesce(description, ''), niveau_code, serie_code, display_order, true
FROM public.subjects WHERE pays='BJ' ON CONFLICT (pays, niveau_code, serie_code, code) DO NOTHING;
-- Chapitres (offset 5700000 sur le BJ)
CREATE TEMP TABLE __map_GB ON COMMIT DROP AS
  SELECT sNew.id AS new_id, sBJ.id AS old_id
  FROM public.subjects sNew
  JOIN public.subjects sBJ
    ON sNew.code = sBJ.code AND sNew.niveau_code = sBJ.niveau_code
     AND coalesce(sNew.serie_code, '') = coalesce(sBJ.serie_code, '')
 WHERE sNew.pays='GB';
INSERT INTO public.chapters (subject_id, pays, slug, num, title, sa_label, classe, pdf_url,
  is_free, price, cours, exemple_titre, exemple_enonce, exemple_solution,
  exercice_consigne, exercice_question, exercice_type, exercice_options, correct_option, explication, published)
SELECT m.new_id, 'GB'::text,
       c.slug || '~' || lower('GB'),
       c.num + 5700000,
       c.title, c.sa_label, c.classe, c.pdf_url, c.is_free, c.price, c.cours,
       c.exemple_titre, c.exemple_enonce, c.exemple_solution,
       c.exercice_consigne, c.exercice_question, c.exercice_type,
       c.exercice_options, c.correct_option, c.explication,
       coalesce(c.published, true)
  FROM public.chapters c JOIN __map_GB m ON m.old_id = c.subject_id
 WHERE c.pays='BJ';
DROP TABLE __map_GB;
-- Séquences (Revizy-générique, pas de provenance nationale officieuse)
INSERT INTO public.curriculum_sequences (pays, niveau_code, serie_code, subject_name, sequences, source, updated_at)
SELECT 'GB'::text, s.niveau_code, s.serie_code, s.subject_name, s.sequences,
       'revizy_generic', now()
FROM public.curriculum_sequences s
 WHERE s.pays='BJ'
ON CONFLICT DO NOTHING;

-- ES
-- Matières
INSERT INTO public.subjects (pays, code, name, icon, description, niveau_code, serie_code, display_order, published)
SELECT 'ES'::text, code, name, icon, coalesce(description, ''), niveau_code, serie_code, display_order, true
FROM public.subjects WHERE pays='BJ' ON CONFLICT (pays, niveau_code, serie_code, code) DO NOTHING;
-- Chapitres (offset 5800000 sur le BJ)
CREATE TEMP TABLE __map_ES ON COMMIT DROP AS
  SELECT sNew.id AS new_id, sBJ.id AS old_id
  FROM public.subjects sNew
  JOIN public.subjects sBJ
    ON sNew.code = sBJ.code AND sNew.niveau_code = sBJ.niveau_code
     AND coalesce(sNew.serie_code, '') = coalesce(sBJ.serie_code, '')
 WHERE sNew.pays='ES';
INSERT INTO public.chapters (subject_id, pays, slug, num, title, sa_label, classe, pdf_url,
  is_free, price, cours, exemple_titre, exemple_enonce, exemple_solution,
  exercice_consigne, exercice_question, exercice_type, exercice_options, correct_option, explication, published)
SELECT m.new_id, 'ES'::text,
       c.slug || '~' || lower('ES'),
       c.num + 5800000,
       c.title, c.sa_label, c.classe, c.pdf_url, c.is_free, c.price, c.cours,
       c.exemple_titre, c.exemple_enonce, c.exemple_solution,
       c.exercice_consigne, c.exercice_question, c.exercice_type,
       c.exercice_options, c.correct_option, c.explication,
       coalesce(c.published, true)
  FROM public.chapters c JOIN __map_ES m ON m.old_id = c.subject_id
 WHERE c.pays='BJ';
DROP TABLE __map_ES;
-- Séquences (Revizy-générique, pas de provenance nationale officieuse)
INSERT INTO public.curriculum_sequences (pays, niveau_code, serie_code, subject_name, sequences, source, updated_at)
SELECT 'ES'::text, s.niveau_code, s.serie_code, s.subject_name, s.sequences,
       'revizy_generic', now()
FROM public.curriculum_sequences s
 WHERE s.pays='BJ'
ON CONFLICT DO NOTHING;

-- IT
-- Matières
INSERT INTO public.subjects (pays, code, name, icon, description, niveau_code, serie_code, display_order, published)
SELECT 'IT'::text, code, name, icon, coalesce(description, ''), niveau_code, serie_code, display_order, true
FROM public.subjects WHERE pays='BJ' ON CONFLICT (pays, niveau_code, serie_code, code) DO NOTHING;
-- Chapitres (offset 5900000 sur le BJ)
CREATE TEMP TABLE __map_IT ON COMMIT DROP AS
  SELECT sNew.id AS new_id, sBJ.id AS old_id
  FROM public.subjects sNew
  JOIN public.subjects sBJ
    ON sNew.code = sBJ.code AND sNew.niveau_code = sBJ.niveau_code
     AND coalesce(sNew.serie_code, '') = coalesce(sBJ.serie_code, '')
 WHERE sNew.pays='IT';
INSERT INTO public.chapters (subject_id, pays, slug, num, title, sa_label, classe, pdf_url,
  is_free, price, cours, exemple_titre, exemple_enonce, exemple_solution,
  exercice_consigne, exercice_question, exercice_type, exercice_options, correct_option, explication, published)
SELECT m.new_id, 'IT'::text,
       c.slug || '~' || lower('IT'),
       c.num + 5900000,
       c.title, c.sa_label, c.classe, c.pdf_url, c.is_free, c.price, c.cours,
       c.exemple_titre, c.exemple_enonce, c.exemple_solution,
       c.exercice_consigne, c.exercice_question, c.exercice_type,
       c.exercice_options, c.correct_option, c.explication,
       coalesce(c.published, true)
  FROM public.chapters c JOIN __map_IT m ON m.old_id = c.subject_id
 WHERE c.pays='BJ';
DROP TABLE __map_IT;
-- Séquences (Revizy-générique, pas de provenance nationale officieuse)
INSERT INTO public.curriculum_sequences (pays, niveau_code, serie_code, subject_name, sequences, source, updated_at)
SELECT 'IT'::text, s.niveau_code, s.serie_code, s.subject_name, s.sequences,
       'revizy_generic', now()
FROM public.curriculum_sequences s
 WHERE s.pays='BJ'
ON CONFLICT DO NOTHING;

-- PT
-- Matières
INSERT INTO public.subjects (pays, code, name, icon, description, niveau_code, serie_code, display_order, published)
SELECT 'PT'::text, code, name, icon, coalesce(description, ''), niveau_code, serie_code, display_order, true
FROM public.subjects WHERE pays='BJ' ON CONFLICT (pays, niveau_code, serie_code, code) DO NOTHING;
-- Chapitres (offset 6000000 sur le BJ)
CREATE TEMP TABLE __map_PT ON COMMIT DROP AS
  SELECT sNew.id AS new_id, sBJ.id AS old_id
  FROM public.subjects sNew
  JOIN public.subjects sBJ
    ON sNew.code = sBJ.code AND sNew.niveau_code = sBJ.niveau_code
     AND coalesce(sNew.serie_code, '') = coalesce(sBJ.serie_code, '')
 WHERE sNew.pays='PT';
INSERT INTO public.chapters (subject_id, pays, slug, num, title, sa_label, classe, pdf_url,
  is_free, price, cours, exemple_titre, exemple_enonce, exemple_solution,
  exercice_consigne, exercice_question, exercice_type, exercice_options, correct_option, explication, published)
SELECT m.new_id, 'PT'::text,
       c.slug || '~' || lower('PT'),
       c.num + 6000000,
       c.title, c.sa_label, c.classe, c.pdf_url, c.is_free, c.price, c.cours,
       c.exemple_titre, c.exemple_enonce, c.exemple_solution,
       c.exercice_consigne, c.exercice_question, c.exercice_type,
       c.exercice_options, c.correct_option, c.explication,
       coalesce(c.published, true)
  FROM public.chapters c JOIN __map_PT m ON m.old_id = c.subject_id
 WHERE c.pays='BJ';
DROP TABLE __map_PT;
-- Séquences (Revizy-générique, pas de provenance nationale officieuse)
INSERT INTO public.curriculum_sequences (pays, niveau_code, serie_code, subject_name, sequences, source, updated_at)
SELECT 'PT'::text, s.niveau_code, s.serie_code, s.subject_name, s.sequences,
       'revizy_generic', now()
FROM public.curriculum_sequences s
 WHERE s.pays='BJ'
ON CONFLICT DO NOTHING;

-- BR
-- Matières
INSERT INTO public.subjects (pays, code, name, icon, description, niveau_code, serie_code, display_order, published)
SELECT 'BR'::text, code, name, icon, coalesce(description, ''), niveau_code, serie_code, display_order, true
FROM public.subjects WHERE pays='BJ' ON CONFLICT (pays, niveau_code, serie_code, code) DO NOTHING;
-- Chapitres (offset 6100000 sur le BJ)
CREATE TEMP TABLE __map_BR ON COMMIT DROP AS
  SELECT sNew.id AS new_id, sBJ.id AS old_id
  FROM public.subjects sNew
  JOIN public.subjects sBJ
    ON sNew.code = sBJ.code AND sNew.niveau_code = sBJ.niveau_code
     AND coalesce(sNew.serie_code, '') = coalesce(sBJ.serie_code, '')
 WHERE sNew.pays='BR';
INSERT INTO public.chapters (subject_id, pays, slug, num, title, sa_label, classe, pdf_url,
  is_free, price, cours, exemple_titre, exemple_enonce, exemple_solution,
  exercice_consigne, exercice_question, exercice_type, exercice_options, correct_option, explication, published)
SELECT m.new_id, 'BR'::text,
       c.slug || '~' || lower('BR'),
       c.num + 6100000,
       c.title, c.sa_label, c.classe, c.pdf_url, c.is_free, c.price, c.cours,
       c.exemple_titre, c.exemple_enonce, c.exemple_solution,
       c.exercice_consigne, c.exercice_question, c.exercice_type,
       c.exercice_options, c.correct_option, c.explication,
       coalesce(c.published, true)
  FROM public.chapters c JOIN __map_BR m ON m.old_id = c.subject_id
 WHERE c.pays='BJ';
DROP TABLE __map_BR;
-- Séquences (Revizy-générique, pas de provenance nationale officieuse)
INSERT INTO public.curriculum_sequences (pays, niveau_code, serie_code, subject_name, sequences, source, updated_at)
SELECT 'BR'::text, s.niveau_code, s.serie_code, s.subject_name, s.sequences,
       'revizy_generic', now()
FROM public.curriculum_sequences s
 WHERE s.pays='BJ'
ON CONFLICT DO NOTHING;

-- IN
-- Matières
INSERT INTO public.subjects (pays, code, name, icon, description, niveau_code, serie_code, display_order, published)
SELECT 'IN'::text, code, name, icon, coalesce(description, ''), niveau_code, serie_code, display_order, true
FROM public.subjects WHERE pays='BJ' ON CONFLICT (pays, niveau_code, serie_code, code) DO NOTHING;
-- Chapitres (offset 6200000 sur le BJ)
CREATE TEMP TABLE __map_IN ON COMMIT DROP AS
  SELECT sNew.id AS new_id, sBJ.id AS old_id
  FROM public.subjects sNew
  JOIN public.subjects sBJ
    ON sNew.code = sBJ.code AND sNew.niveau_code = sBJ.niveau_code
     AND coalesce(sNew.serie_code, '') = coalesce(sBJ.serie_code, '')
 WHERE sNew.pays='IN';
INSERT INTO public.chapters (subject_id, pays, slug, num, title, sa_label, classe, pdf_url,
  is_free, price, cours, exemple_titre, exemple_enonce, exemple_solution,
  exercice_consigne, exercice_question, exercice_type, exercice_options, correct_option, explication, published)
SELECT m.new_id, 'IN'::text,
       c.slug || '~' || lower('IN'),
       c.num + 6200000,
       c.title, c.sa_label, c.classe, c.pdf_url, c.is_free, c.price, c.cours,
       c.exemple_titre, c.exemple_enonce, c.exemple_solution,
       c.exercice_consigne, c.exercice_question, c.exercice_type,
       c.exercice_options, c.correct_option, c.explication,
       coalesce(c.published, true)
  FROM public.chapters c JOIN __map_IN m ON m.old_id = c.subject_id
 WHERE c.pays='BJ';
DROP TABLE __map_IN;
-- Séquences (Revizy-générique, pas de provenance nationale officieuse)
INSERT INTO public.curriculum_sequences (pays, niveau_code, serie_code, subject_name, sequences, source, updated_at)
SELECT 'IN'::text, s.niveau_code, s.serie_code, s.subject_name, s.sequences,
       'revizy_generic', now()
FROM public.curriculum_sequences s
 WHERE s.pays='BJ'
ON CONFLICT DO NOTHING;

-- CN
-- Matières
INSERT INTO public.subjects (pays, code, name, icon, description, niveau_code, serie_code, display_order, published)
SELECT 'CN'::text, code, name, icon, coalesce(description, ''), niveau_code, serie_code, display_order, true
FROM public.subjects WHERE pays='BJ' ON CONFLICT (pays, niveau_code, serie_code, code) DO NOTHING;
-- Chapitres (offset 6300000 sur le BJ)
CREATE TEMP TABLE __map_CN ON COMMIT DROP AS
  SELECT sNew.id AS new_id, sBJ.id AS old_id
  FROM public.subjects sNew
  JOIN public.subjects sBJ
    ON sNew.code = sBJ.code AND sNew.niveau_code = sBJ.niveau_code
     AND coalesce(sNew.serie_code, '') = coalesce(sBJ.serie_code, '')
 WHERE sNew.pays='CN';
INSERT INTO public.chapters (subject_id, pays, slug, num, title, sa_label, classe, pdf_url,
  is_free, price, cours, exemple_titre, exemple_enonce, exemple_solution,
  exercice_consigne, exercice_question, exercice_type, exercice_options, correct_option, explication, published)
SELECT m.new_id, 'CN'::text,
       c.slug || '~' || lower('CN'),
       c.num + 6300000,
       c.title, c.sa_label, c.classe, c.pdf_url, c.is_free, c.price, c.cours,
       c.exemple_titre, c.exemple_enonce, c.exemple_solution,
       c.exercice_consigne, c.exercice_question, c.exercice_type,
       c.exercice_options, c.correct_option, c.explication,
       coalesce(c.published, true)
  FROM public.chapters c JOIN __map_CN m ON m.old_id = c.subject_id
 WHERE c.pays='BJ';
DROP TABLE __map_CN;
-- Séquences (Revizy-générique, pas de provenance nationale officieuse)
INSERT INTO public.curriculum_sequences (pays, niveau_code, serie_code, subject_name, sequences, source, updated_at)
SELECT 'CN'::text, s.niveau_code, s.serie_code, s.subject_name, s.sequences,
       'revizy_generic', now()
FROM public.curriculum_sequences s
 WHERE s.pays='BJ'
ON CONFLICT DO NOTHING;

-- RU
-- Matières
INSERT INTO public.subjects (pays, code, name, icon, description, niveau_code, serie_code, display_order, published)
SELECT 'RU'::text, code, name, icon, coalesce(description, ''), niveau_code, serie_code, display_order, true
FROM public.subjects WHERE pays='BJ' ON CONFLICT (pays, niveau_code, serie_code, code) DO NOTHING;
-- Chapitres (offset 6400000 sur le BJ)
CREATE TEMP TABLE __map_RU ON COMMIT DROP AS
  SELECT sNew.id AS new_id, sBJ.id AS old_id
  FROM public.subjects sNew
  JOIN public.subjects sBJ
    ON sNew.code = sBJ.code AND sNew.niveau_code = sBJ.niveau_code
     AND coalesce(sNew.serie_code, '') = coalesce(sBJ.serie_code, '')
 WHERE sNew.pays='RU';
INSERT INTO public.chapters (subject_id, pays, slug, num, title, sa_label, classe, pdf_url,
  is_free, price, cours, exemple_titre, exemple_enonce, exemple_solution,
  exercice_consigne, exercice_question, exercice_type, exercice_options, correct_option, explication, published)
SELECT m.new_id, 'RU'::text,
       c.slug || '~' || lower('RU'),
       c.num + 6400000,
       c.title, c.sa_label, c.classe, c.pdf_url, c.is_free, c.price, c.cours,
       c.exemple_titre, c.exemple_enonce, c.exemple_solution,
       c.exercice_consigne, c.exercice_question, c.exercice_type,
       c.exercice_options, c.correct_option, c.explication,
       coalesce(c.published, true)
  FROM public.chapters c JOIN __map_RU m ON m.old_id = c.subject_id
 WHERE c.pays='BJ';
DROP TABLE __map_RU;
-- Séquences (Revizy-générique, pas de provenance nationale officieuse)
INSERT INTO public.curriculum_sequences (pays, niveau_code, serie_code, subject_name, sequences, source, updated_at)
SELECT 'RU'::text, s.niveau_code, s.serie_code, s.subject_name, s.sequences,
       'revizy_generic', now()
FROM public.curriculum_sequences s
 WHERE s.pays='BJ'
ON CONFLICT DO NOTHING;

COMMIT;

-- Introducteurs/personnes qui veulent le programme officiel national authentic de leur pays :
-- voir docs/programme/, DEPLOY.md « Programme officiel par pays », et le fichier
-- MIGRATION_04_seed_curriculum.sql (modèle Bénin, référence).
-- Fin MIGRATION_18_programmes_offeres.