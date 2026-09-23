-- ============================================================
-- Revizy — Schema v2 (ADDITIF)
-- À exécuter APRÈS schema.sql dans Supabase SQL Editor
-- Aucune modification des tables existantes (profiles,
-- unlocked_chapters, transactions). Le nouveau modèle s'ajoute.
-- ============================================================

-- 1. NIVEAUX ---------------------------------------------------------
create table if not exists public.niveaux (
  code text primary key check (code in ('bac', 'brevet')),
  label text not null,
  base_price integer not null check (base_price > 0),
  free_chapter_count integer not null default 3 check (free_chapter_count >= 0),
  display_order integer not null default 0
);

-- 2. SERIES (BAC uniquement) -----------------------------------------
create table if not exists public.series (
  code text primary key check (code in ('A','B','C','D','G')),
  label text not null,
  niveau_code text not null references public.niveaux(code),
  display_order integer not null default 0
);

-- 3. SUBJECTS (matières) ---------------------------------------------
create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  name text not null,
  icon text not null default '📚',
  description text,
  niveau_code text not null references public.niveaux(code),
  serie_code text references public.series(code),
  display_order integer not null default 0,
  published boolean not null default true,
  unique (niveau_code, serie_code, code)
);

create index if not exists idx_subjects_niveau_serie
  on public.subjects(niveau_code, serie_code);

-- 4. CHAPTERS -------------------------------------------------------
create table if not exists public.chapters (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  num integer not null check (num > 0),
  title text not null,
  sa_label text,
  is_free boolean not null default false,
  price integer not null default 0 check (price >= 0),
  cours text not null,
  exemple_titre text,
  exemple_enonce text,
  exemple_solution text,
  exercice_consigne text,
  exercice_question text,
  exercice_type text check (exercice_type in ('qcm','vf')),
  exercice_options jsonb,
  exercice_correct_option text,
  exercice_explication text,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (subject_id, num)
);

create index if not exists idx_chapters_subject
  on public.chapters(subject_id);
create index if not exists idx_chapters_published
  on public.chapters(published);

-- 5. PRICING_RULES (audit + ajustements futurs) ---------------------
create table if not exists public.pricing_rules (
  id uuid primary key default gen_random_uuid(),
  niveau_code text not null references public.niveaux(code),
  base_price integer not null,
  free_chapter_count integer not null,
  effective_from timestamptz not null default now(),
  active boolean not null default true
);

-- ============================================================
-- TRIGGER : prix calculé automatiquement
-- 3 premiers chapitres d'une matière = gratuits
-- Au-delà : prix selon niveau (BAC=150, Brevet=100)
-- ============================================================

create or replace function public.trg_compute_chapter_pricing()
returns trigger
language plpgsql
as $fn$
declare
  v_free_count integer;
  v_base_price integer;
begin
  select n.free_chapter_count, n.base_price
    into v_free_count, v_base_price
    from public.subjects s
    join public.niveaux n on n.code = s.niveau_code
   where s.id = new.subject_id;

  if v_free_count is null then
    raise exception 'Sujet introuvable pour le chapitre (%)', new.subject_id;
  end if;

  if new.num <= v_free_count then
    new.is_free := true;
    new.price := 0;
  else
    new.is_free := false;
    new.price := coalesce(nullif(new.price, 0), v_base_price);
  end if;

  new.updated_at := now();
  return new;
end;
$fn$;

drop trigger if exists trg_chapters_pricing on public.chapters;
create trigger trg_chapters_pricing
  before insert or update of num, subject_id on public.chapters
  for each row execute function public.trg_compute_chapter_pricing();

-- ============================================================
-- RPC 1 : list_subjects — matières visibles (vue publique)
-- ============================================================

create or replace function public.list_subjects(
  p_niveau text,
  p_serie text default null
)
returns table (
  id uuid,
  code text,
  name text,
  icon text,
  description text,
  serie_code text,
  total_chapters bigint,
  free_chapters bigint
)
language sql
security definer
stable
set search_path = public
as $fn$
  select
    s.id, s.code, s.name, s.icon, s.description, s.serie_code,
    count(c.id) filter (where c.published) as total_chapters,
    count(c.id) filter (where c.published and c.is_free) as free_chapters
  from public.subjects s
  left join public.chapters c on c.subject_id = s.id
  where s.published
    and s.niveau_code = p_niveau
    and (p_serie is null or s.serie_code = p_serie or s.serie_code is null)
  group by s.id
  order by s.display_order, s.name;
$fn$;

grant execute on function public.list_subjects(text, text) to anon, authenticated;

-- ============================================================
-- RPC 2 : list_chapters_for_student — chapitres + flag locked
-- ============================================================

create or replace function public.list_chapters_for_student(p_subject_id uuid)
returns table (
  id uuid,
  slug text,
  num integer,
  title text,
  sa_label text,
  is_free boolean,
  price integer,
  locked boolean
)
language sql
security definer
stable
set search_path = public
as $fn$
  select
    c.id, c.slug, c.num, c.title, c.sa_label, c.is_free, c.price,
    (not c.is_free and not exists (
      select 1 from public.unlocked_chapters u
       where u.user_id = auth.uid() and u.chapter_id = c.slug
    )) as locked
  from public.chapters c
  where c.subject_id = p_subject_id and c.published
  order by c.num;
$fn$;

grant execute on function public.list_chapters_for_student(uuid) to authenticated;

-- ============================================================
-- RPC 3 : get_chapter_content — récupération contenu + accès
-- ============================================================

create or replace function public.get_chapter_content(p_chapter_id uuid)
returns table (
  id uuid,
  slug text,
  num integer,
  title text,
  sa_label text,
  is_free boolean,
  price integer,
  cours text,
  exemple_titre text,
  exemple_enonce text,
  exemple_solution text,
  exercice_consigne text,
  exercice_question text,
  exercice_type text,
  exercice_options jsonb,
  exercice_correct_option text,
  exercice_explication text,
  access_granted boolean
)
language plpgsql
security definer
stable
set search_path = public
as $fn$
declare
  v_chap record;
  v_unlocked boolean;
begin
  select c.*, s.niveau_code, s.serie_code
    into v_chap
    from public.chapters c
    join public.subjects s on s.id = c.subject_id
   where c.id = p_chapter_id and c.published;

  if not found then
    raise exception 'Chapitre introuvable';
  end if;

  -- Un chapitre est accessible s'il est gratuit OU débloqué par l'élève
  v_unlocked := v_chap.is_free or exists (
    select 1 from public.unlocked_chapters u
     where u.user_id = auth.uid() and u.chapter_id = v_chap.slug
  );

  if not v_unlocked then
    -- Pas d'accès : on masque le contenu payant
    return query select
      v_chap.id, v_chap.slug, v_chap.num, v_chap.title, v_chap.sa_label,
      v_chap.is_free, v_chap.price,
      '🔒 Ce chapitre est premium. Connectez-vous et débloquez-le pour accéder au cours complet, à l''exemple détaillé et aux QCM.'::text as cours,
      null::text, null::text, null::text,
      null::text, null::text, null::text, null::jsonb, null::text, null::text,
      false as access_granted;
    return;
  end if;

  return query select
    v_chap.id, v_chap.slug, v_chap.num, v_chap.title, v_chap.sa_label,
    v_chap.is_free, v_chap.price,
    v_chap.cours,
    v_chap.exemple_titre, v_chap.exemple_enonce, v_chap.exemple_solution,
    v_chap.exercice_consigne, v_chap.exercice_question, v_chap.exercice_type,
    v_chap.exercice_options, v_chap.exercice_correct_option, v_chap.exercice_explication,
    true as access_granted;
end;
$fn$;

grant execute on function public.get_chapter_content(uuid) to anon, authenticated;

-- ============================================================
-- RPC 4 : get_admin_stats — stats admin dynamiques
-- ============================================================

create or replace function public.get_admin_stats()
returns json
language sql
security definer
stable
set search_path = public
as $fn$
  select json_build_object(
    'total_revenue',      coalesce((select sum(amount) from public.transactions), 0),
    'students_count',     (select count(*) from public.profiles where role = 'client'),
    'fiches_count',       (select count(*) from public.chapters where published),
    'transactions_count', (select count(*) from public.transactions),
    'unlocks_count',      (select count(*) from public.unlocked_chapters),
    'subjects_count',     (select count(*) from public.subjects where published),
    'last_updated',       now()
  );
$fn$;

grant execute on function public.get_admin_stats() to authenticated;

-- ============================================================
-- RLS — lecture publique pour niveaux/series/subjects/chapters publiés
-- écriture admin uniquement
-- ============================================================

alter table public.niveaux       enable row level security;
alter table public.series        enable row level security;
alter table public.subjects      enable row level security;
alter table public.chapters      enable row level security;
alter table public.pricing_rules enable row level security;

-- Lecture
drop policy if exists "niveaux_read_all" on public.niveaux;
create policy "niveaux_read_all" on public.niveaux
  for select using (true);

drop policy if exists "series_read_all" on public.series;
create policy "series_read_all" on public.series
  for select using (true);

drop policy if exists "subjects_read_all" on public.subjects;
create policy "subjects_read_all" on public.subjects
  for select using (published or public.is_admin());

drop policy if exists "chapters_read_all" on public.chapters;
create policy "chapters_read_all" on public.chapters
  for select using (published or public.is_admin());

drop policy if exists "pricing_read_all" on public.pricing_rules;
create policy "pricing_read_all" on public.pricing_rules
  for select using (active or public.is_admin());

-- Écriture admin
drop policy if exists "niveaux_admin_write" on public.niveaux;
create policy "niveaux_admin_write" on public.niveaux
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "series_admin_write" on public.series;
create policy "series_admin_write" on public.series
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "subjects_admin_write" on public.subjects;
create policy "subjects_admin_write" on public.subjects
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "chapters_admin_write" on public.chapters;
create policy "chapters_admin_write" on public.chapters
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "pricing_admin_write" on public.pricing_rules;
create policy "pricing_admin_write" on public.pricing_rules
  for all using (public.is_admin()) with check (public.is_admin());

-- ============================================================
-- FIN schema_v2.sql
-- Ensuite : exécuter seed_curriculum.sql pour injecter le
-- programme béninois complet.
-- ============================================================
