/**
 * http.js — appels HTTP sortants avec délai maximal.
 *
 * Pourquoi : sans délai, un appel à Supabase (ou à FedaPay) qui ne répond
 * jamais garde la requête ouverte indéfiniment. Sur une instance unique,
 * quelques appels bloqués suffisent à rendre le site entier injoignable.
 *
 * Le délai par défaut est de 15 secondes : au-delà, la base est de toute
 * façon injoignable et l'appel doit échouer pour que l'utilisateur reçoit
 * une erreur claire plutôt que d'attendre.
 */
const DELAI_DEFAUT_MS = Number(process.env.HTTP_DELAI_MS || 15000);

/**
 * fetch avec délai maximal (et message d'erreur lisible).
 * @param {string} url
 * @param {object} options  options fetch (method, headers, body…)
 * @param {number} delaiMs   délai maximal, 15 s par défaut
 */
async function fetchDelai(url, options = {}, delaiMs = DELAI_DEFAUT_MS) {
  // Si l'appelant a déjà son propre signal (retry IA), on le respecte.
  if (options.signal) {
    return fetch(url, options);
  }
  const controleur = new AbortController();
  const minuteur = setTimeout(() => controleur.abort(), delaiMs);
  try {
    return await fetch(url, { ...options, signal: controleur.signal });
  } catch (e) {
    if (e && (e.name === 'AbortError' || e.name === 'TimeoutError')) {
      throw new Error(`Délai dépassé (${delaiMs} ms) : ${url}`);
    }
    throw e;
  } finally {
    clearTimeout(minuteur);
  }
}

module.exports = { fetchDelai, DELAI_DEFAUT_MS };
