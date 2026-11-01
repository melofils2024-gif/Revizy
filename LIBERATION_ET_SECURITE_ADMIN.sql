-- ============================================================
-- LIBÉRATION ET SÉCURISATION DE L'ESPACE ADMINISTRATEUR (REVIZY)
-- ============================================================
-- Ce script est à exécuter dans le SQL Editor de Supabase
-- (https://supabase.com/dashboard/project/wvbpiqchgwyeqyzuxtpp/sql)
--
-- Il permet de :
-- 1. Révoquer et expulser tous les tokens, sessions et pirates.
-- 2. Rétablir le rôle 'admin' pour vous (melofils2024@gmail.com) et votre 2e admin.
-- 3. Rétrograder en 'client' tout autre compte pirate ou suspect.
-- 4. Verrouiller la base à STRICTEMENT 2 administrateurs maximum via un trigger PostgreSQL.
-- 5. Réinitialiser les facteurs TOTP/MFA pour débloquer votre accès sans être bloqué par un faux code.
-- ============================================================

-- ============================================================
-- 1. EXPULSION DES SESSIONS & TOKENS PIRATES
-- ============================================================
-- Supprime toutes les sessions et tous les refresh tokens existants.
-- Tous les utilisateurs (y compris les pirates) sont immédiatement déconnectés.
DELETE FROM auth.refresh_tokens;
DELETE FROM auth.sessions;

-- Réinitialisation des facteurs de double authentification MFA (TOTP)
-- pour supprimer tout code ou QR code configuré par un pirate :
DELETE FROM auth.mfa_challenges;
DELETE FROM auth.mfa_factors;

-- ============================================================
-- 2. NETTOYAGE DES RÔLES & RESTAURATION DES 2 VRAIS ADMINS
-- ============================================================
-- Rétrograde tous les comptes suspects en simple élève ('client')
-- sauf votre email (melofils2024@gmail.com) et celui de votre second admin.
-- NOTE : Si vous avez l'email exact du 2ème admin, remplacez 'dareitmahougnon@email.com' ci-dessous.
UPDATE public.profiles
SET role = 'client'
WHERE role = 'admin'
  AND lower(email) NOT IN ('melofils2024@gmail.com', 'dareitmahougnon@email.com');

-- Rétablit le rôle 'admin' pour votre compte principal :
UPDATE public.profiles
SET role = 'admin'
WHERE lower(email) = 'melofils2024@gmail.com';

-- Si le second admin a déjà créé son compte, activez-le également :
-- UPDATE public.profiles SET role = 'admin' WHERE lower(email) = 'dareitmahougnon@email.com';

-- ============================================================
-- 3. VERROU STRICT : MAXIMUM 2 ADMINISTRATEURS EN BASE
-- ============================================================
-- Déclencheur SQL interdisant d'avoir plus de 2 comptes admin en même temps.
-- Même avec un accès direct, toute tentative d'ajouter un 3ème admin échouera immédiatement.

CREATE OR REPLACE FUNCTION public.check_max_two_admins()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_count INT;
BEGIN
  IF NEW.role = 'admin' THEN
    -- Compte les administrateurs existants autres que la ligne en cours
    SELECT count(*)
      INTO v_admin_count
      FROM public.profiles
     WHERE role = 'admin'
       AND id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);

    IF v_admin_count >= 2 THEN
      RAISE EXCEPTION 'Action refusée : la limite stricte de 2 administrateurs est atteinte sur Revizy.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_limit_two_admins ON public.profiles;
CREATE TRIGGER trg_limit_two_admins
  BEFORE INSERT OR UPDATE OF role ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.check_max_two_admins();

-- ============================================================
-- 4. CONTRÔLE FINAL (Vérification des admins restants)
-- ============================================================
SELECT id, email, role, created_at
FROM public.profiles
WHERE role = 'admin';
