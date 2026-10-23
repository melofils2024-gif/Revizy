-- Revizy — Abonnements enregistrés en base
--
-- POURQUOI : l'abonnement était conservé uniquement dans le localStorage
-- du navigateur. Conséquences : l'administrateur ne voyait aucun
-- abonné, et l'élève perdait son accès illimité en changeant d'appareil
-- ou de navigateur. Cet abonnement est écrit par le serveur au moment
-- de la validation du paiement (clé service_role), puis relu par l'élève.
--
-- ORDRE D'EXÉCUTION : après schema.sql (profiles doit exister).

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  niveau text not null default 'bac',            -- 'brevet' ou 'bac'
  plan_name text,
  amount integer not null default 0,             -- montant débité (FCFA)
  currency text not null default 'XOF',
  provider text,
  transaction_id text,
  starts_at timestamptz not null default now(),
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_subscriptions_user on public.subscriptions(user_id);
create index if not exists idx_subscriptions_expires on public.subscriptions(expires_at);

alter table public.subscriptions enable row level security;

-- L'élève lit son propre abonnement (l'admin passe par la clé service_role).
drop policy if exists "subscriptions_select_own" on public.subscriptions;
create policy "subscriptions_select_own"
  on public.subscriptions for select
  using (auth.uid() = user_id);

-- Un même abonné ne peut pas avoir deux abonnements actifs simultanés.
create or replace function public.get_active_subscription(p_user_id uuid)
returns public.subscriptions
language sql
stable
security definer
set search_path = public
as $$
  select s.*
  from public.subscriptions s
  where s.user_id = p_user_id
    and s.expires_at > now()
  order by s.expires_at desc
  limit 1;
$$;

revoke all on function public.get_active_subscription(uuid) from public;
grant execute on function public.get_active_subscription(uuid) to authenticated;
