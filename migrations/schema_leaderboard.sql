-- ════════════════════════════════════════════════════════════════════════════
-- REVISY — CLASSEMENT PUBLIC & GAMIFICATION DES APPRENANTS (LEADERBOARD)
-- À exécuter dans la console SQL Supabase :
-- https://supabase.com/dashboard/project/wvbpiqchgwyeqyzuxtpp/sql
-- ════════════════════════════════════════════════════════════════════════════

-- 1. AJOUT DE LA COLONNE POINTS SUR PROFILES SI INEXISTANTE
alter table public.profiles
  add column if not exists points integer not null default 0;

-- 2. FONCTION RPC SÉCURISÉE : RÉCUPÉRER LE CLASSEMENT PUBLIC
-- Règle stricte de confidentialité : Ne JAMAIS exposer l'email ou les id internes.
-- On expose seulement le prénom/pseudo, le niveau, la classe, le pays et les points.
create or replace function public.get_leaderboard(p_limit integer default 15)
returns table (
  rang bigint,
  name text,
  points integer,
  niveau text,
  classe text,
  pays text
)
language sql
security definer
stable
set search_path = public
as $fn$
  select 
    row_number() over (order by p.points desc, p.created_at asc) as rang,
    coalesce(nullif(p.name, ''), 'Apprenant Revisy') as name,
    coalesce(p.points, 0) as points,
    coalesce(p.niveau, 'bac') as niveau,
    coalesce(p.classe, '') as classe,
    coalesce(p.pays, 'BJ') as pays
  from public.profiles p
  where p.role = 'client'
  order by p.points desc, p.created_at asc
  limit greatest(1, least(p_limit, 50));
$fn$;

-- 3. PERMISSIONS : ACCESSIBLE AUX VISITEURS NON-CONNECTÉS (ANON) ET CONNECTÉS
grant execute on function public.get_leaderboard(integer) to anon, authenticated;

-- 4. FONCTION POUR ATTRIBUER DES POINTS DE RÉVISION (Ex: validation de QCM)
create or replace function public.ajouter_points_apprenant(p_points integer)
returns integer
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_nouveau_total integer;
begin
  if auth.uid() is null then
    raise exception 'Non authentifié';
  end if;

  if p_points <= 0 or p_points > 500 then
    raise exception 'Quantité de points invalide';
  end if;

  update public.profiles
     set points = coalesce(points, 0) + p_points
   where id = auth.uid()
  returning points into v_nouveau_total;

  return v_nouveau_total;
end;
$fn$;

grant execute on function public.ajouter_points_apprenant(integer) to authenticated;
