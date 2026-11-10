-- ════════════════════════════════════════════════════════════════════════════
-- REVISY — REQUÊTES FORENSIQUES & DÉTECTION DE TRACES DE PIRATAGE
-- À exécuter dans la console SQL Supabase :
-- https://supabase.com/dashboard/project/wvbpiqchgwyeqyzuxtpp/sql
-- ════════════════════════════════════════════════════════════════════════════

-- 1. IDENTIFIER TOUS LES COMPTES AYANT OU AYANT EU LE RÔLE 'admin'
-- Règle : Seuls 'melofils2024@gmail.com' et 'dareitmahougnon@gmail.com' sont légitimes.
select 
  p.id as user_id,
  u.email as email_auth,
  p.name as nom_profil,
  p.role as role_actuel,
  u.created_at as compte_cree_le,
  u.last_sign_in_at as derniere_connexion,
  case 
    when lower(u.email) in ('melofils2024@gmail.com', 'dareitmahougnon@gmail.com') then '✅ LÉGITIME'
    else '🚨 INTRUS / PIRATE'
  end as statut_alerte
from public.profiles p
left join auth.users u on u.id = p.id
where p.role = 'admin' 
   or lower(coalesce(u.email, '')) not in ('melofils2024@gmail.com', 'dareitmahougnon@gmail.com') and p.role <> 'client'
order by u.created_at desc;

-- 2. RECHERCHER LES COMPTES CRÉÉS RÉCEMMENT SANS EMAIL OFFICIEL
select 
  u.id,
  u.email,
  u.created_at,
  u.last_sign_in_at,
  u.raw_user_meta_data,
  p.role
from auth.users u
left join public.profiles p on p.id = u.id
where u.created_at > (now() - interval '14 days')
order by u.created_at desc;

-- 3. INSPECTION DE LA TABLE DES BLOCAGES & ATTAQUES RÉCENTES (si activée)
do $do$
begin
  if to_regclass('public.securite_evenements') is not null then
    raise notice 'Affichage des derniers événements de sécurité enregistrés...';
  end if;
end
$do$;

select *
from (
  select 
    id,
    type,
    gravite,
    ip,
    chemin,
    message,
    cree_le
  from public.securite_evenements
  order by cree_le desc
  limit 50
) ev
where to_regclass('public.securite_evenements') is not null;

-- 4. VÉRIFIER LES ADRESSES IP ACTUELLEMENT BANNIES OU BLOQUÉES
select *
from (
  select 
    ip,
    motif,
    bloque_jusqu,
    cree_le
  from public.blocage_acces
  order by cree_le desc
) b
where to_regclass('public.blocage_acces') is not null;

-- 5. RECHERCHER LES MODIFICATIONS SUSPECTES DE PROFILS OU PERMISSIONS
select 
  p.id,
  p.role,
  p.updated_at,
  u.email
from public.profiles p
join auth.users u on u.id = p.id
where p.role != 'client'
  and lower(u.email) not in ('melofils2024@gmail.com', 'dareitmahougnon@gmail.com');

-- 6. VÉRIFIER LES POLITIQUES ROW-LEVEL SECURITY ACTIVES
-- S'assure que RLS est bien activé ('true') sur les tables sensibles
select 
  schemaname,
  tablename,
  rowsecurity as rls_active
from pg_tables
where schemaname = 'public' 
  and tablename in ('profiles', 'transactions', 'subscriptions', 'unlocked_chapters', 'chapters', 'subjects');
