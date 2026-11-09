-- ════════════════════════════════════════════════════════════════════════════
-- REVIZY — EXPULSION IMMÉDIATE DU PIRATE & VERROU STRICT 2 ADMINS
-- À exécuter immédiatement dans Supabase :
-- https://supabase.com/dashboard/project/wvbpiqchgwyeqyzuxtpp/sql
-- ════════════════════════════════════════════════════════════════════════════

-- 1. EXPULSION PHYSIQUE DU PIRATE (DESTRUCTION DES SESSIONS ACTIVES)
-- Le pirate est immédiatement déconnecté de force et perd son accès
do $do$
begin
  if to_regclass('auth.refresh_tokens') is not null then
    execute 'delete from auth.refresh_tokens';
  end if;
  if to_regclass('auth.sessions') is not null then
    execute 'delete from auth.sessions';
  end if;
  if to_regclass('auth.mfa_factors') is not null then
    execute 'delete from auth.mfa_factors';
  end if;
  if to_regclass('auth.mfa_challenges') is not null then
    execute 'delete from auth.mfa_challenges';
  end if;
end
$do$;

-- 2. RÉTROGRADATION DE TOUT COMPTE PIRATE EN SIMPLE ÉLÈVE
-- Tout compte ayant role='admin' qui n'est pas un des deux comptes officiels
-- redevient immédiatement un simple élève sans droits
update public.profiles p
   set role = 'client'
 where p.role = 'admin'
   and not exists (
     select 1 from auth.users u
      where u.id = p.id
        and lower(u.email) in ('melofils2024@gmail.com', 'dareitmahougnon@gmail.com')
   );

-- 3. CONFIRMATION STRICTE DES 2 SEULS ADMINISTRATEURS LÉGITIMES
update public.profiles p
   set role = 'admin'
  from auth.users u
 where u.id = p.id
   and lower(u.email) in ('melofils2024@gmail.com', 'dareitmahougnon@gmail.com');

-- 4. VERROU SQL SUR IS_ADMIN() — BLINDAGE ABSOLU
-- Même si un intrus parvenait à modifier son profil, is_admin() renverra TOUJOURS FALSE
-- car la fonction vérifie désormais l'email authentifié par Supabase Auth.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $fn$
  select exists (
    select 1
      from auth.users u
      join public.profiles p on p.id = u.id
     where u.id = auth.uid()
       and p.role = 'admin'
       and lower(u.email) in ('melofils2024@gmail.com', 'dareitmahougnon@gmail.com')
  );
$fn$;

grant execute on function public.is_admin() to authenticated;

-- 5. VERROU PHYSIQUE : 2 ADMINISTRATEURS MAXIMUM EN BASE
create or replace function public.check_max_two_admins()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_admin_count integer;
begin
  if new.role = 'admin' then
    select count(*)
      into v_admin_count
      from public.profiles
     where role = 'admin'
       and id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid);
    if v_admin_count >= 2 then
      raise exception 'Action refusée : la limite stricte de 2 administrateurs est atteinte sur Revizy.';
    end if;
  end if;
  return new;
end;
$fn$;

do $do$
begin
  if to_regclass('public.profiles') is not null then
    execute 'drop trigger if exists trg_limit_two_admins on public.profiles';
    execute 'create trigger trg_limit_two_admins before insert or update on public.profiles for each row execute function public.check_max_two_admins()';
  end if;
end
$do$;

-- 6. INTERDICTION D'ÉCRITURE SUR LE RÔLE PAR UN UTILISATEUR
create or replace function public.protect_profile_role()
returns trigger
language plpgsql
set search_path = public
as $fn$
begin
  if current_user in ('anon', 'authenticated') and not public.is_admin() then
    if tg_op = 'INSERT' then
      new.role := 'client';
    elsif new.role is distinct from old.role then
      new.role := old.role;
    end if;
  end if;
  return new;
end;
$fn$;

do $do$
begin
  if to_regclass('public.profiles') is not null then
    execute 'drop trigger if exists profiles_protect_role on public.profiles';
    execute 'create trigger profiles_protect_role before insert or update on public.profiles for each row execute function public.protect_profile_role()';
  end if;
end
$do$;

-- Limitation stricte des colonnes modifiables par les élèves
do $do$
declare
  col text;
begin
  if to_regclass('public.profiles') is null then
    return;
  end if;
  execute 'revoke update on public.profiles from anon, authenticated';
  foreach col in array array['name', 'email', 'niveau', 'classe', 'serie', 'pays'] loop
    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'profiles' and column_name = col
    ) then
      execute format('grant update (%I) on public.profiles to authenticated', col);
    end if;
  end loop;
end
$do$;

-- 7. FERMETURE DE LA FUITE SUR GET_ADMIN_STATS
create or replace function public.get_admin_stats()
returns json
language sql
security definer
stable
set search_path = public
as $fn$
  select case
    when public.is_admin() then json_build_object(
      'total_revenue',      coalesce((select sum(amount) from public.transactions), 0),
      'students_count',     (select count(*) from public.profiles where role = 'client'),
      'fiches_count',       (select count(*) from public.chapters where published),
      'transactions_count', (select count(*) from public.transactions),
      'unlocks_count',      (select count(*) from public.unlocked_chapters),
      'subjects_count',     (select count(*) from public.subjects where published),
      'last_updated',       now()
    )
    else null
  end;
$fn$;

revoke all on function public.get_admin_stats() from public;
revoke all on function public.get_admin_stats() from anon;
grant execute on function public.get_admin_stats() to authenticated;

-- 8. CONTRÔLE FINAL — LISTE DES 2 SEULS ADMINISTRATEURS RESTANTS
select p.id, u.email, p.role, p.created_at
  from public.profiles p
  join auth.users u on u.id = p.id
 where p.role = 'admin'
 order by p.created_at;
