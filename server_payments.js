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

const FEDAPAY_API_URL = (() => {
  const base = String(process.env.FEDAPAY_API_URL || 'https://api.fedapay.com/v1').replace(/\/+$/, '');
  return /\/v1$/.test(base) ? base : `${base}/v1`;
})();
const FEDAPAY_SECRET_KEY = process.env.FEDAPAY_SECRET_KEY || '';
// Tous les tarifs sont exprimés en FCFA : la devise facturée ne dépend jamais du pays choisi.
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

// L'API FedaPay encapsule l'objet : { "v1/transaction": { ... } }
function unwrapTransaction(data) {
  if (!data || typeof data !== 'object') return {};
  return data['v1/transaction'] || data.transaction || data;
}

/**
 * Crée une transaction FedaPay puis génère son lien de paiement.
 * @returns {Promise<{ok: boolean, id?: string, url?: string, status?: number, error?: string}>}
 */
async function createTransaction({ amount, description, callbackUrl, customer, metadata }) {
  const phone = String(customer.phone || '').replace(/[^0-9]/g, '');
  const created = await fedapayRequest('/transactions', {
    method: 'POST',
    body: {
      amount,
      description,
      currency: { iso: FEDAPAY_CURRENCY },
      callback_url: callbackUrl || undefined,
      customer: {
        email: customer.email || undefined,
        firstname: customer.firstname,
        lastname: customer.lastname,
        phone_number: phone ? { number: phone, country: (customer.country || 'bj').toLowerCase() } : undefined
      },
      custom_metadata: metadata
    }
  });
  const tx = unwrapTransaction(created.data);
  if (!created.ok || !tx.id) {
    return { ok: false, status: created.status, error: created.error || JSON.stringify(created.data || {}).slice(0, 300) };
  }

  const token = await fedapayRequest(`/transactions/${encodeURIComponent(tx.id)}/token`, { method: 'POST', body: {} });
  const url = token.data && (token.data.url || token.data.payment_url);
  if (!token.ok || !url) {
    return { ok: false, status: token.status, error: token.error || 'Lien de paiement FedaPay absent' };
  }
  return { ok: true, id: String(tx.id), url };
}

/**
 * Montant attendu côté serveur.
 * - Abonnement : tarif officiel figé du pays (2000 / 3000 au Bénin).
 * - Chapitre : tarif de la base si connu, sinon le tarif plancher du niveau.
 * @param {object} ctx contexte du pays (prix, devise)
 */
async function resolveExpectedAmount(kind, niveau, chapterId, clientAmount, chapterTitle, ctx) {
  const context = ctx || null;
  const subscriptionPrices = (context && context.prix && context.prix.abonnement) || SUBSCRIPTION_PRICES;
  const minChapterPrice = (context && context.prix && context.prix.chapitre) || MIN_CHAPTER_PRICE;
  const currency = FEDAPAY_CURRENCY;

  if (kind === 'subscription') {
    return { amount: subscriptionPrices[niveau] || 0, currency };
  }

  // Épreuve (corrigé payant) : le prix fait foi en base.
  if (kind === 'epreuve') {
    let amount = 0;
    if (chapterId) {
      const rows = await supabaseRestGet(
        `/rest/v1/epreuves?id=eq.${encodeURIComponent(chapterId)}&select=price,is_free&limit=1`
      );
      if (Array.isArray(rows) && rows.length) {
        amount = rows[0].is_free ? 0 : (Number(rows[0].price) || 0);
      }
    }
    // L'élève ne peut jamais proposer moins que le prix affiché en base.
    const propose = Number(clientAmount);
    if (Number.isFinite(propose) && propose > amount) amount = propose;
    return { amount, currency };
  }

  const floor = minChapterPrice[niveau] || 100;
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

  return { amount, currency };
}

/**
 * Montant officiel de l'achat (le prix affiché en base fait foi).
 *
 * Contrairement à resolveExpectedAmount, le montant proposé par le client
 * n'est jamais pris en compte : c'est la référence pour contrôler ce qui
 * a RÉELLEMENT été payé. Sans cela, le contrôle « montant insuffisant »
 * serait inerte (le montant payé servirait de référence à lui-même).
 */
async function resolveOfficialAmount(kind, niveau, chapterId, chapterTitle, ctx) {
  return resolveExpectedAmount(kind, niveau, chapterId, 0, chapterTitle, ctx);
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
 * GET PostgREST avec le jeton de l'élève : les RLS ne lui montrent que ses propres lignes.
 */
async function userRestGet(token, endpoint) {
  const supabaseUrl = process.env.SUPABASE_URL || '';
  const anonKey = process.env.SUPABASE_ANON_KEY || '';
  if (!supabaseUrl || !anonKey || !token) return null;
  try {
    const res = await fetch(`${supabaseUrl.replace(/\/$/, '')}${endpoint}`, {
      method: 'GET',
      headers: { apikey: anonKey, Authorization: `Bearer ${token}`, Accept: 'application/json' }
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    console.warn('userRestGet:', e.message);
    return null;
  }
}

/**
 * Écriture avec le jeton de l'élève : les RLS s'appliquent (un admin écrit
 * grâce à la policy « write_admin », un élève ne peut rien écrire).
 * Permet à l'administration de publier sans exposer la clé service.
 */
async function userRestWrite(token, endpoint, method, body, options = {}) {
  const supabaseUrl = process.env.SUPABASE_URL || '';
  const anonKey = process.env.SUPABASE_ANON_KEY || '';
  if (!supabaseUrl || !anonKey || !token) return { ok: false, error: 'Jeton ou configuration Supabase absent' };
  try {
    const res = await fetch(`${supabaseUrl.replace(/\/$/, '')}${endpoint}`, {
      method,
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Prefer: options.prefer || 'return=minimal'
      },
      body: body ? JSON.stringify(body) : undefined
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      return { ok: false, error: `HTTP ${res.status} ${detail.slice(0, 200)}` };
    }
    // Avec « return=representation », le corps contient la ligne écrite.
    const data = await res.json().catch(() => null);
    return { ok: true, data: data || null };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

/**
 * Écriture serveur (clé service) — contourne les RLS des élèves.
 */
async function supabaseRestWrite(endpoint, method, body, options = {}) {
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
        'Prefer': options.prefer || 'return=minimal'
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

  const tx = unwrapTransaction(res.data);
  const status = String(tx.status || tx.transaction_status || '').toLowerCase();
  const approved = status === 'approved' || status === 'completed' || status.includes('approved');
  const rawCurrency = tx.currency && typeof tx.currency === 'object' ? tx.currency.iso : tx.currency;
  const metadata = tx.custom_metadata || tx.metadata || {};

  return {
    ok: approved,
    status,
    amount: Number(tx.amount || 0),
    currency: typeof rawCurrency === 'string' && rawCurrency ? rawCurrency.toUpperCase() : FEDAPAY_CURRENCY,
    customerEmail: tx.customer && tx.customer.email ? String(tx.customer.email).toLowerCase() : '',
    metadata: metadata && typeof metadata === 'object' ? metadata : {},
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

/**
 * Réserve la transaction (contrainte unique sur transaction_id) AVANT tout déblocage :
 * deux requêtes simultanées ne peuvent pas utiliser le même paiement.
 * @returns {Promise<{ok: boolean, conflict?: boolean, error?: string}>}
 */
async function claimReceipt(receipt) {
  const result = await supabaseRestWrite('/rest/v1/payment_receipts', 'POST', receipt);
  if (result.ok) return { ok: true };
  return { ok: false, conflict: /HTTP 409/.test(result.error || ''), error: result.error };
}

async function releaseReceipt(transactionId) {
  return supabaseRestWrite(
    `/rest/v1/payment_receipts?transaction_id=eq.${encodeURIComponent(transactionId)}`,
    'DELETE'
  );
}

module.exports = {
  SUBSCRIPTION_PRICES,
  MIN_CHAPTER_PRICE,
  FEDAPAY_CURRENCY,
  getUserFromToken,
  fedapayRequest,
  createTransaction,
  resolveExpectedAmount,
  resolveOfficialAmount,
  verifyTransaction,
  isTransactionAlreadyUsed,
  claimReceipt,
  releaseReceipt,
  supabaseRestGet,
  userRestGet,
  userRestWrite,
  supabaseRestWrite
};
