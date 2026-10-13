-- Migration Revizy : colonnes classe / serie sur profiles
-- A executer dans Supabase → SQL Editor → Run

alter table public.profiles
  add column if not exists classe text default '',
  add column if not exists serie text;

-- Met a jour le trigger d'inscription pour enregistrer classe/serie
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

  insert into public.profiles (id, email, name, role, niveau, classe, serie)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    chosen_role,
    coalesce(new.raw_user_meta_data->>'niveau', 'bac'),
    coalesce(new.raw_user_meta_data->>'classe', ''),
    nullif(upper(coalesce(new.raw_user_meta_data->>'serie', '')), '')
  )
  on conflict (id) do update set
    email = excluded.email,
    name = coalesce(excluded.name, public.profiles.name),
    role = excluded.role,
    niveau = excluded.niveau,
    classe = coalesce(excluded.classe, public.profiles.classe),
    serie = coalesce(excluded.serie, public.profiles.serie);

  return new;
end;
$fn$;

-- Permettre a l'utilisateur de creer/mettre a jour son propre profil (fallback front)
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);
