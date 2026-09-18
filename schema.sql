-- Revizy schema Supabase (SQL Editor -> Run)

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text not null,
  role text not null default 'client' check (role in ('client', 'admin')),
  niveau text not null default 'bac' check (niveau in ('bac', 'brevet')),
  created_at timestamptz not null default now()
);

create table if not exists public.unlocked_chapters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  chapter_id text not null,
  title text not null,
  niveau text,
  subject text,
  price integer not null default 0,
  provider text,
  unlocked_at timestamptz not null default now(),
  unique (user_id, chapter_id)
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  chapter_id text,
  chapter_title text,
  amount integer not null default 0,
  provider text,
  phone text,
  created_at timestamptz not null default now()
);

create index if not exists idx_unlocked_user on public.unlocked_chapters(user_id);
create index if not exists idx_transactions_user on public.transactions(user_id);

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $fn$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$fn$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
declare
  admin_count integer;
  chosen_role text;
begin
  chosen_role := coalesce(new.raw_user_meta_data->>'role', 'client');

  if chosen_role = 'admin' then
    select count(*) into admin_count from public.profiles where role = 'admin';
    if admin_count >= 2 then
      chosen_role := 'client';
    end if;
  end if;

  insert into public.profiles (id, email, name, role, niveau)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    chosen_role,
    coalesce(new.raw_user_meta_data->>'niveau', 'bac')
  );
  return new;
end;
$fn$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.get_public_stats()
returns json
language sql
security definer
set search_path = public
as $fn$
  select json_build_object(
    'total_users', (select count(*)::int from public.profiles),
    'unlocked_chapters', (select count(*)::int from public.unlocked_chapters),
    'success_rate', '98%'
  );
$fn$;

grant execute on function public.is_admin() to authenticated;
grant execute on function public.get_public_stats() to anon, authenticated;

alter table public.profiles enable row level security;
alter table public.unlocked_chapters enable row level security;
alter table public.transactions enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "unlocks_select_own" on public.unlocked_chapters;
create policy "unlocks_select_own"
  on public.unlocked_chapters for select
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "unlocks_insert_own" on public.unlocked_chapters;
create policy "unlocks_insert_own"
  on public.unlocked_chapters for insert
  with check (auth.uid() = user_id);

drop policy if exists "tx_select_own" on public.transactions;
create policy "tx_select_own"
  on public.transactions for select
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "tx_insert_own" on public.transactions;
create policy "tx_insert_own"
  on public.transactions for insert
  with check (auth.uid() = user_id);
