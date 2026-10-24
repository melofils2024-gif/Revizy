-- ============================================================
-- Revizy — schema_cours_pays_classe.sql
-- Permet d'associer des cours spécifiques à chaque pays,
-- classe et série pour un programme personnalisé.
--
-- À exécuter APRÈS schema.sql, schema_v2.sql, schema_classe.sql
-- ============================================================

-- ------------------------------------------------------------
-- 1. Table de mapping : Cours spécifiques par (pays, classe, série, matière)
--    Un cours peut être spécifique à un pays, une classe, une série,
--    ou commun à plusieurs (si la colonne est NULL)
-- ------------------------------------------------------------
create table if not exists public.chapter_mappings (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references public.chapters(id) on delete cascade,
  pays_code text,           -- Code pays (ex: 'BJ', 'FR', 'CI') - NULL = commun à tous
  classe text,              -- Classe (ex: '3ème', '2nde', '1ère', 'Terminale') - NULL = toutes classes
  serie_code text,          -- Série (ex: 'A', 'B', 'C', 'D', 'G') - NULL = toutes séries
  niveau_code text not null, -- 'bac' ou 'brevet'
  subject_id uuid not null references public.subjects(id) on delete cascade,
  priority integer not null default 0, -- Priorité : plus élevé = plus spécifique
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index pour les recherches rapides
create index if not exists chapter_mappings_lookup_idx
  on public.chapter_mappings (niveau_code, coalesce(pays_code, ''), coalesce(classe, ''), coalesce(serie_code, ''), subject_id);

-- Index unique pour éviter les doublons
create unique index if not exists chapter_mappings_unique
  on public.chapter_mappings (chapter_id, niveau_code, coalesce(pays_code, ''), coalesce(classe, ''), coalesce(serie_code, ''), subject_id);

-- ------------------------------------------------------------
-- 2. Fonction RPC : Récupérer les chapitres pour un utilisateur
--    en fonction de son pays, sa classe et sa série
--
--    Renvoie la MÊME forme que get_curriculum_chapters() (voir
--    schema_securite.sql) : le front s'appuie sur niveau_code,
--    subject_name, is_free, locked, cours, exercices…
--    Le contenu payant n'est renvoyé que si l'élève a les droits.
-- ------------------------------------------------------------
-- Le type de retour a changé : on supprime l'ancienne version, sinon
-- « create or replace » échoue (« cannot change return type »).
drop function if exists public.get_chapters_for_student(text, text, text, text, uuid);
create or replace function public.get_chapters_for_student(
  p_niveau text,
  p_pays text default null,
  p_classe text default null,
  p_serie text default null,
  p_subject_id uuid default null
)
returns table (
  id                         uuid,
  slug                       text,
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
  locked                     boolean,
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
  exercices                  jsonb,
  priority                   integer,
  is_specific                boolean
)
language sql
security definer
stable
set search_path = public
as $fn$
  select
    c.id,
    c.slug,
    s.name                                         as subject_name,
    s.niveau_code,
    s.serie_code,
    c.num,
    c.title,
    c.sa_label,
    c.classe,
    case when a.ok then c.pdf_url end              as pdf_url,
    c.is_free,
    c.price,
    not a.ok                                       as locked,
    case when a.ok then c.cours end                as cours,
    c.exemple_titre,
    case when a.ok then c.exemple_enonce end       as exemple_enonce,
    case when a.ok then c.exemple_solution end     as exemple_solution,
    case when a.ok then c.exercice_consigne end    as exercice_consigne,
    case when a.ok then c.exercice_question end    as exercice_question,
    case when a.ok then c.exercice_type end        as exercice_type,
    case when a.ok then c.exercice_options end     as exercice_options,
    case when a.ok then c.exercice_correct_option end as exercice_correct_option,
    case when a.ok then c.exercice_explication end as exercice_explication,
    case when a.ok then coalesce(c.exercices, '[]'::jsonb) else '[]'::jsonb end as exercices,
    coalesce(m.priority, 0)                       as priority,
    (m.chapter_id is not null)                     as is_specific
  from public.subjects s
  join public.chapters c on c.subject_id = s.id
  cross join lateral (
    select (
      coalesce(c.is_free, false)
      or public.is_admin()
      or exists (
        select 1 from public.subscriptions sub
        where sub.user_id = auth.uid()
          and sub.expires_at > now()
          and sub.niveau in (s.niveau_code, 'all')
      )
      or exists (
        select 1 from public.unlocked_chapters u
        where u.user_id = auth.uid()
          and u.chapter_id in (c.id::text, c.slug)
      )
    ) as ok
  ) a
  left join lateral (
    select cm.chapter_id, cm.priority
    from public.chapter_mappings cm
    where cm.chapter_id = c.id
      and cm.niveau_code = p_niveau
      and (p_pays   is null or cm.pays_code   is null or cm.pays_code   = p_pays)
      and (p_classe is null or cm.classe      is null or cm.classe      = p_classe)
      and (p_serie  is null or cm.serie_code  is null or cm.serie_code  = p_serie)
      and (p_subject_id is null or cm.subject_id = p_subject_id)
    order by cm.priority desc
    limit 1
  ) m on true
  where c.published
    and s.published
    and s.niveau_code = p_niveau
    and (p_subject_id is null or c.subject_id = p_subject_id)
    -- Cloisonnement par pays : on ne sert jamais le programme d'un autre pays.
    and (p_pays is null or (c.pays = p_pays and s.pays = p_pays))
  order by
    coalesce(m.priority, 0) desc,
    s.name,
    c.num;
$fn$;

grant execute on function public.get_chapters_for_student(text, text, text, text, uuid) to anon, authenticated;

-- ------------------------------------------------------------
-- 3. Fonction RPC : Ajouter/Modifier un mapping de chapitre
--    Réservée aux administrateurs
-- ------------------------------------------------------------
create or replace function public.upsert_chapter_mapping(
  p_chapter_id uuid,
  p_niveau text,
  p_pays text default null,
  p_classe text default null,
  p_serie text default null,
  p_subject_id uuid,
  p_priority integer default 0
)
returns boolean
language plpgsql
security definer
set search_path = public
as $fn$
begin
  if not public.is_admin() then
    raise exception 'Accès réservé aux administrateurs';
  end if;

  insert into public.chapter_mappings (
    chapter_id, niveau_code, pays_code, classe, serie_code, subject_id, priority, updated_at
  )
  values (
    p_chapter_id,
    p_niveau,
    nullif(btrim(coalesce(p_pays, '')), ''),
    nullif(btrim(coalesce(p_classe, '')), ''),
    nullif(upper(btrim(coalesce(p_serie, ''))), ''),
    p_subject_id,
    p_priority,
    now()
  )
  on conflict (chapter_id, niveau_code, (coalesce(pays_code, '')), (coalesce(classe, '')), (coalesce(serie_code, '')), subject_id)
  do update set
    pays_code = excluded.pays_code,
    classe = excluded.classe,
    serie_code = excluded.serie_code,
    priority = excluded.priority,
    updated_at = now();

  return true;
end;
$fn$;

grant execute on function public.upsert_chapter_mapping(uuid, text, text, text, text, uuid, integer) to authenticated;

-- ------------------------------------------------------------
-- 4. Fonction RPC : Supprimer un mapping de chapitre
--    Réservée aux administrateurs
-- ------------------------------------------------------------
create or replace function public.delete_chapter_mapping(
  p_chapter_id uuid,
  p_niveau text,
  p_pays text default null,
  p_classe text default null,
  p_serie text default null,
  p_subject_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $fn$
begin
  if not public.is_admin() then
    raise exception 'Accès réservé aux administrateurs';
  end if;

  delete from public.chapter_mappings
  where chapter_id = p_chapter_id
    and niveau_code = p_niveau
    and coalesce(pays_code, '') = coalesce(nullif(p_pays, ''), '')
    and coalesce(classe, '') = coalesce(nullif(p_classe, ''), '')
    and coalesce(serie_code, '') = coalesce(nullif(p_serie, ''), '')
    and subject_id = p_subject_id;

  return true;
end;
$fn$;

grant execute on function public.delete_chapter_mapping(uuid, text, text, text, text, uuid) to authenticated;

-- ------------------------------------------------------------
-- 5. RLS : lecture publique, écriture admin
-- ------------------------------------------------------------
alter table public.chapter_mappings enable row level security;

drop policy if exists chapter_mappings_read on public.chapter_mappings;
create policy chapter_mappings_read
  on public.chapter_mappings
  for select
  to anon, authenticated
  using (true);

drop policy if exists chapter_mappings_admin_write on public.chapter_mappings;
create policy chapter_mappings_admin_write
  on public.chapter_mappings
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ------------------------------------------------------------
-- 6. Trigger pour mettre à jour updated_at
-- ------------------------------------------------------------
create or replace function public.update_chapter_mappings_timestamp()
returns trigger
language plpgsql
as $fn$
begin
  new.updated_at = now();
  return new;
end;
$fn$;

drop trigger if exists trg_chapter_mappings_updated on public.chapter_mappings;
create trigger trg_chapter_mappings_updated
  before update on public.chapter_mappings
  for each row
  execute function public.update_chapter_mappings_timestamp();

-- ============================================================
-- FIN schema_cours_pays_classe.sql
-- Exécuter ce fichier dans Supabase SQL Editor
-- ============================================================
