// ============================================================
// Revizy — server_payments.js
// Paiements FedaPay (Mobile Money MTN / Moov) côté serveur.
//
// Règle de sécurité : le déblocage d'un cours n'est JAMAIS écrit par le
// navigateur. Le client crée une transaction FedaPay puis demande au
// serveur de la vérifier (statut + montant) ; c'est le serveur qui écrit
// dans unlocked_chapters / transactions avec la clé service.
// ============================================================
const crypto = require('crypto');

const FEDAPAY_API_URL = process.env.FEDAPAY_API_URL || 'https://api.fedapay.com';
const FEDAPAY_SECRET_KEY = process.env.FEDAPAY_SECRET_KEY || '';
const FEDAPAY_CURRENCY = process.env.FEDAPAY_CURRENCY || 'XOF';

// Tarifs serveur : source de vérité pour les abonnements
const SUBSCRIPTION_PRICES = { brevet: 2000, bac: 3000 };
// Tarif minimum d'un chapitre payant (le serveur ne fait jamais confiance au client)
const MIN_CHAPTER_PRICE = { brevet: 100, bac: 150 };

/**
 * Identifie l'utilisateur à partir du jeton Bearer envoyé par le navigateur.
 * @returns {Promise<{id: string, email: string, name: string}|null>}
 */
async function getUserFromToken(token) {
  const supabaseUrl = process.env.SUPABASE_URL || '';
  const anonKey = process.env.SUPABASE_ANON_KEY || '';
  if (!supabaseUrl || !anonKey || !token) return null;

  try {
    const res = await fetch(`${supabaseUrl.replace(/\/$/, '')}/auth/v1/user`, {
      method: 'GET',
      headers: { apikey: anonKey, Authorization: `Bearer ${token}` }
    });
    if (!res.ok) return null;
    const user = await res.json();
    if (!user || !user.id) return null;
    return {
      id: user.id,
      email: user.email || '',
      name: (user.user_metadata && user.user_metadata.name) || (user.email || '').split('@')[0]
    };
  } catch (e) {
    console.warn('getUserFromToken:', e.message);
    return null;
  }
}

/**
 * Appel à l'API FedaPay (clé secrète, côté serveur uniquement).
 */
async function fedapayRequest(path, options = {}) {
  if (!FEDAPAY_SECRET_KEY) return { ok: false, status: 0, error: 'FEDAPAY_SECRET_KEY non configurée' };
  try {
    const res = await fetch(`${FEDAPAY_API_URL}${path}`, {
      method: options.method || 'GET',
      headers: {
        'Authorization': `Bearer ${FEDAPAY_SECRET_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: options.body ? JSON.stringify(options.body) : undefined
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
  } catch (e) {
    return { ok: false, status: 0, error: e.message };
  }
}

/**
 * Montant attendu côté serveur.
 * - Abonnement : tarif officiel figé (2000 / 3000).
 * - Chapitre : tarif de la base si connu, sinon le tarif plancher du niveau.
 */
async function resolveExpectedAmount(kind, niveau, chapterId, clientAmount, chapterTitle) {
  if (kind === 'subscription') {
    return { amount: SUBSCRIPTION_PRICES[niveau] || 0, currency: FEDAPAY_CURRENCY };
  }

  const floor = MIN_CHAPTER_PRICE[niveau] || 100;
  let amount = floor;

  // Prix officiel en base (si le chapitre y est publié) : il fait foi
  if (chapterId) {
    const bySlug = await supabaseRestGet(
      `/rest/v1/chapters?slug=eq.${encodeURIComponent(chapterId)}&select=price&limit=1`
    );
    if (Array.isArray(bySlug) && bySlug.length && Number(bySlug[0].price) > 0) {
      amount = Number(bySlug[0].price);
    } else if (chapterTitle) {
      const byTitle = await supabaseRestGet(
        `/rest/v1/chapters?title=eq.${encodeURIComponent(chapterTitle)}&select=price&limit=1`
      );
      if (Array.isArray(byTitle) && byTitle.length && Number(byTitle[0].price) > 0) {
        amount = Number(byTitle[0].price);
      }
    }
  }

  // Le client ne peut jamais proposer moins que le tarif plancher,
  // et ne peut faire qu'augmenter le montant attendu.
  const proposed = Number(clientAmount);
  if (Number.isFinite(proposed) && proposed > amount) amount = proposed;
  if (amount < floor) amount = floor;

  return { amount, currency: FEDAPAY_CURRENCY };
}

/**
 * GET PostgREST avec la clé service (lecture serveur).
 */
async function supabaseRestGet(endpoint) {
  const supabaseUrl = process.env.SUPABASE_URL || '';
  const serviceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || '';
  if (!supabaseUrl || !serviceKey) return null;
  try {
    const res = await fetch(`${supabaseUrl.replace(/\/$/, '')}${endpoint}`, {
      method: 'GET',
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Accept': 'application/json'
      }
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    console.warn('supabaseRestGet:', e.message);
    return null;
  }
}

/**
 * Écriture serveur (clé service) — contourne les RLS des élèves.
 */
async function supabaseRestWrite(endpoint, method, body) {
  const supabaseUrl = process.env.SUPABASE_URL || '';
  const serviceKey = process.env.SUPABASE_SERVICE_KEY || '';
  if (!supabaseUrl) return { ok: false, error: 'SUPABASE_URL absente' };
  if (!serviceKey) {
    return {
      ok: false,
      error: 'SUPABASE_SERVICE_KEY absente : le serveur ne peut pas enregistrer le déblocage. ' +
             'Ajoute la clé service_role de Supabase dans les variables d’environnement.'
    };
  }
  try {
    const res = await fetch(`${supabaseUrl.replace(/\/$/, '')}${endpoint}`, {
      method,
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: body ? JSON.stringify(body) : undefined
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      return { ok: false, error: `HTTP ${res.status} ${detail.slice(0, 200)}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

/**
 * Vérifie une transaction FedaPay auprès de l'API (source de vérité).
 */
async function verifyTransaction(transactionId) {
  if (!transactionId) return { ok: false, reason: 'transaction_id manquant' };

  const res = await fedapayRequest(`/transactions/${encodeURIComponent(transactionId)}`);
  if (!res.ok) {
    return { ok: false, reason: res.error || `Transaction introuvable (${res.status})` };
  }

  const tx = res.data || {};
  const status = String(tx.status || tx.transaction_status || '').toLowerCase();
  const approved = status === 'approved' || status === 'completed' || status.includes('approved');

  return {
    ok: approved,
    status,
    amount: Number(tx.amount || 0),
    currency: tx.currency || FEDAPAY_CURRENCY,
    customerEmail: tx.customer && tx.customer.email ? tx.customer.email : '',
    reference: tx.reference || tx.id || transactionId,
    reason: approved ? '' : `statut ${status || 'inconnu'}`
  };
}

/**
 * Un même identifiant de transaction ne peut servir qu'une fois.
 */
async function isTransactionAlreadyUsed(transactionId) {
  const rows = await supabaseRestGet(
    `/rest/v1/payment_receipts?transaction_id=eq.${encodeURIComponent(transactionId)}&select=id&limit=1`
  );
  return Array.isArray(rows) && rows.length > 0;
}

async function saveReceipt(receipt) {
  return supabaseRestWrite('/rest/v1/payment_receipts', 'POST', receipt);
}

module.exports = {
  SUBSCRIPTION_PRICES,
  MIN_CHAPTER_PRICE,
  getUserFromToken,
  fedapayRequest,
  resolveExpectedAmount,
  verifyTransaction,
  isTransactionAlreadyUsed,
  saveReceipt,
  supabaseRestGet,
  supabaseRestWrite
};
