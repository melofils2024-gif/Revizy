/**
 * Revisy — Middleware Express d'accès aux corrigés payants.
 * Route type : GET /v1/epreuves/:id/download-solution
 *
 * Comportement :
 *   1. Récupère le Bearer token Supabase Auth (Authorization: Bearer ...).
 *   2. Vérifie auprès de GoTrue qui est l'utilisateur.
 *   3. Lit public.epreuves (publiée ? gratuite ?).
 *      Sauf si gratuite → 402 PAIEMENT_REQUIS.
 *   4. Avec le même token, lit public.unlocked_epreuves (RLS « own rows ») ?
 *      Si présent → accès à la solution → next().
 *      Sinon → 402 PAIEMENT_REQUIS (redirection FedaPay).
 * La validation réelle du paiement FedaPay se fait UNE FOIS, à l'enregistrement
 * d'unlocked_epreuves (POST /v1/payments/verify côté serveur). Ici on ne fait que camper ;
 * aucune écriture n'est effectuée.
 *
 * Env requis : SUPABASE_URL, SUPABASE_ANON_KEY.
 */

function getBearerToken(req) {
  const h = req && (req.headers?.authorization || req.headers?.Authorization) || '';
  const m = String(h).match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : null;
}

async function getFetch() {
  if (typeof fetch === 'function') return fetch;
  return (await import('node-fetch')).default;
}

async function requireSolutionAccess(req, res, next) {
  try {
    const token = getBearerToken(req);
    if (!token) return res.status(401).json({ success: false, error: 'Jeton requis (Authorization: Bearer ...)' });
    const id = String((req.params && (req.params.id ?? req.params.epreuveId)) || '');
    if (!/^[0-9a-f-]{36}$/i.test(id)) return res.status(400).json({ success: false, error: 'identifiant d’épreuve invalide' });

    const URL = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
    const KEY = process.env.SUPABASE_ANON_KEY || '';
    if (!URL || !KEY) return res.status(503).json({ success: false, error: 'Supabase n’est pas configuré' });

    const fetcher = await getFetch();
    const auth = await fetcher(`${URL}/auth/v1/user`, {
      headers: { apikey: KEY, Authorization: `Bearer ${token}` }
    });
    const user = await auth.json().catch(() => ({}));
    if (!auth.ok || !user || !user.id) return res.status(401).json({ success: false, error: 'Session invalide' });

    // Épreuve publique
    const ep = await fetcher(`${URL}/rest/v1/epreuves?id=eq.${encodeURIComponent(id)}&select=id,type,is_free,published,price&limit=1`, { headers: { apikey: KEY, Authorization: `Bearer ${token}` } });
    const rows = await ep.json().catch(() => []);
    const epreuve = Array.isArray(rows) ? rows[0] : null;
    if (!epreuve || epreuve.published === false) return res.status(404).json({ success: false, error: 'Épreuve introuvable' });
    if (epreuve.is_free) return next();

    // Déblocage déjà acheté via FedaPay (écrit côté serveur par verify-payment)
    const unlock = await fetcher(`${URL}/rest/v1/unlocked_epreuves?user_id=eq.${encodeURIComponent(user.id)}&epreuve_id=eq.${encodeURIComponent(id)}&select=epreuve_id&limit=1`, { headers: { apikey: KEY, Authorization: `Bearer ${token}` } });
    const list = await unlock.json().catch(() => []);
    if (Array.isArray(list) && list.length > 0) return next();

    return res.status(402).json({ success: false, code: 'PAIEMENT_REQUIS', error: 'Corrigé payant : débloque-le pour le télécharger', price: epreuve.price, epreuveId: epreuve.id });
  } catch (e) {
    console.error('requireSolutionAccess:', e);
    return res.status(500).json({ success: false, error: 'Erreur interne du serveur' });
  }
}

module.exports = { requireSolutionAccess };
