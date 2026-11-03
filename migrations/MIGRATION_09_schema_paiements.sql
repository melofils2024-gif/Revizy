-- ============================================================
-- Revizy — schema_paiements.sql
-- Sécurise le déblocage des cours payants :
--   1. Les élèves ne peuvent PLUS écrire eux-mêmes dans
--      unlocked_chapters / transactions (déblocage serveur uniquement).
--   2. Table payment_receipts : 1 transaction FedaPay = 1 déblocage.
--
-- À exécuter sur les bases déjà déployées.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Reçus de paiement (anti-rejeu)
-- ------------------------------------------------------------
create table if not exists public.payment_receipts (
  id            uuid primary key default gen_random_uuid(),
  transaction_id text not null unique,
  user_id       uuid not null references public.profiles(id) on delete cascade,
  kind          text not null default 'chapter' check (kind in ('chapter','subscription')),
  niveau        text,
  chapter_id    text,
  amount        integer not null default 0,
  reference     text,
  created_at    timestamptz not null default now()
);

-- Traçabilité des paiements dans l'historique admin
alter table public.transactions add column if not exists status text;
alter table public.transactions add column if not exists transaction_id text;

create index if not exists payment_receipts_user_idx
  on public.payment_receipts (user_id, created_at desc);

alter table public.payment_receipts enable row level security;

drop policy if exists payment_receipts_read_own on public.payment_receipts;
create policy payment_receipts_read_own
  on public.payment_receipts
  for select
  to authenticated
  using (auth.uid() = user_id or public.is_admin());

-- ------------------------------------------------------------
-- 2. Verrouillage de l'écriture directe par les élèves
--    La lecture reste possible ; l'écriture passe par le serveur
--    (clé service_role), qui vérifie la transaction FedaPay.
-- ------------------------------------------------------------
drop policy if exists "unlocks_insert_own" on public.unlocked_chapters;
drop policy if exists "unlocks_update_own" on public.unlocked_chapters;
drop policy if exists "unlocks_delete_own" on public.unlocked_chapters;

drop policy if exists "tx_insert_own" on public.transactions;
drop policy if exists "tx_update_own" on public.transactions;
drop policy if exists "tx_delete_own" on public.transactions;

-- Les admins restent autorisés à écrire (gestion manuelle)
drop policy if exists "unlocks_admin_write" on public.unlocked_chapters;
create policy "unlocks_admin_write"
  on public.unlocked_chapters
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "tx_admin_write" on public.transactions;
create policy "tx_admin_write"
  on public.transactions
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Lecture de ses propres déblocages (inchangée, on la recrée pour être sûr)
drop policy if exists "unlocks_select_own" on public.unlocked_chapters;
create policy "unlocks_select_own"
  on public.unlocked_chapters
  for select
  to authenticated
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "tx_select_own" on public.transactions;
create policy "tx_select_own"
  on public.transactions
  for select
  to authenticated
  using (auth.uid() = user_id or public.is_admin());
