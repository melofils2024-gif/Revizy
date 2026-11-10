/**
 * server_securite.js — garde-fou du serveur Revizy.
 *
 * Rôle : ce que le SQL ne peut pas faire.
 *   - le SQL pose les murs (RLS, privilèges, déclencheurs) ;
 *   - ici, on observe ce qui se passe au niveau HTTP : qui parle au site,
 *     à quel rythme, sur quelles ressources. Un aspirateur de contenu se
 *     distingue d'un élève par le MOTIF, pas par le code : on compte les
 *     identifiants différents visités, les 404 en rafale, les tentatives
 *     sur l'espace d'administration.
 *
 * Ce que fait ce module :
 *   1. détecte les comportements de piratage (aspiration, force brute,
 *      balayage de fichiers internes) ;
 *   2. bloque temporairement l'adresse fautive (mémoire du serveur + table
 *      « blocage_acces » en base quand la clé service est disponible) ;
 *   3. journalise chaque événement (table « securite_evenements ») ;
 *   4. alerte le propriétaire (webhook : Telegram, Discord, Slack ou tout
 *      service qui accepte un POST JSON).
 *
 * Principe : une alerte doit pouvoir être lue même si la base est
 * indisponible. Les événements sont donc gardés en mémoire (ring buffer)
 * et répliqués en base seulement si c'est possible.
 */
const path = require('path');

// ── Configuration (tout est surchargeable par variable d'environnement) ──
const CONFIG = {
  // Fenêtre d'observation du balayage d'URL (404) et des tentatives admin.
  fenetreDetectionMs: Number(process.env.SECU_FENETRE_MS || 5 * 60 * 1000),
  // Nombre de fichiers internes demandés en peu de temps → blocage.
  max404: Number(process.env.SECU_MAX_404 || 25),
  // Nombre de tentatives admin refusées → blocage.
  maxAdmin: Number(process.env.SECU_MAX_ADMIN || 12),
  // Nombre d'identifiants de ressources différents touchés en peu de temps.
  maxIdentifiants: Number(process.env.SECU_MAX_IDS || 40),
  // Fenêtre d'observation de l'aspiration de contenu.
  fenetreIdsMs: Number(process.env.SECU_FENETRE_IDS_MS || 2 * 60 * 1000),
  // Durée du blocage automatique.
  dureeBlocageMs: Number(process.env.SECU_BLOCAGE_MINUTES || 30) * 60 * 1000,
  // Nombre d'événements conservés en mémoire.
  maxEvenements: Number(process.env.SECU_MAX_EVENEMENTS || 200),
  // URL d'alerte (webhook). Vide = pas d'envoi, seulement le journal.
  webhook: process.env.ALERTE_WEBHOOK_URL || '',
  // Délai maximal d'attente de l'envoi d'une alerte.
  timeoutWebhookMs: Number(process.env.SECU_WEBHOOK_TIMEOUT_MS || 8000),
  // Fichiers et sondes d'intrusion qui ne doivent JAMAIS être demandés par un visiteur.
  fichiersInterdits: [
    '/.env', '/.env.local', '/package.json', '/package-lock.json',
    '/server.js', '/server_epreuves.js', '/server_payments.js',
    '/server_securite.js', '/tools/', '/migrations/', '/.git/', '/.gitignore',
    '/schema.sql', '/MIGRATION_TOUT.sql', '/DEPLOY.md', '/contexts.js.map',
    '/.vscode/', '/.devin/', '/wp-admin', '/wp-login.php', '/administrator',
    '/phpmyadmin', '/pma', '/admin.php', '/xmlrpc.php', '/admin.html',
    // Fichiers d'urgence de remédiation post-incident (traces PIRATE live) :
    // ne doivent JAMAIS être demandés par un visiteur.
    '/URGENT_SECURITE_MAXIMALE.sql', '/EXPULSION_PIRATE_ET_VERROU_TOTAL.sql',
    '/LIBERATION_ET_SECURITE_ADMIN.sql', '/DETECTER_TRACES_PIRATAGE.sql',
    '/MIGRATION_TOUT.sql', '/schema_securite_bouclier.sql',
    '/package.json', '/package-lock.json', '/config.js.map'
  ]
};

const etat = {
  // IP → { quatreOhQuatre: [], admin: [], ids: Set, bloque: jusqu, motif }
  cip: new Map(),
  // Ring buffer des événements récents.
  evenements: [],
  // Compteurs globale (affichés dans l'espace admin).
  compteurs: { total: 0, alertes: 0, blocages: 0, critiques: 0 }
};

// ── Outils internes ───────────────────────────────────────────────────────

function maintenant() { return Date.now(); }

function entree(ip) {
  let e = etat.cip.get(ip);
  if (!e) {
    e = { quatreOhQuatre: [], admin: [], ids: new Set(), bloque: 0, motif: '' };
    etat.cip.set(ip, e);
  }
  return e;
}

function nettoyer() {
  const limite = maintenant() - Math.max(CONFIG.fenetreDetectionMs, CONFIG.fenetreIdsMs);
  for (const [ip, e] of etat.cip) {
    e.quatreOhQuatre = e.quatreOhQuatre.filter(t => t > limite);
    e.admin = e.admin.filter(t => t > limite);
    if (e.bloque && e.bloque < maintenant()) { e.bloque = 0; e.motif = ''; }
    if (!e.quatreOhQuatre.length && !e.admin.length && !e.ids.size && !e.bloque) {
      etat.cip.delete(ip);
    }
  }
  // Garde-fou : jamais plus de 5000 IP suivies en mémoire.
  if (etat.cip.size > 5000) {
    const tropVieux = [...etat.cip.entries()]
      .sort((a, b) => (a[1].bloque || 0) - (b[1].bloque || 0))
      .slice(0, 1000);
    tropVieux.forEach(([ip]) => etat.cip.delete(ip));
  }
}

// ── Détection ─────────────────────────────────────────────────────────────

/** Extrait un identifiant de ressource d'un chemin (UUID, slug d'épreuve…). */
function extraireIdentifiant(chemin) {
  const m = String(chemin).match(/\/(epreuves|epreuve|chapitres|chapters|matieres|subjects)\/([A-Za-z0-9_-]{8,})/);
  return m ? `${m[1]}/${m[2]}` : null;
}

/**
 * Analyse une requête et, si elle est déjà bloquée, renvoie le verdict.
 * @returns {{autorise: boolean, motif?: string, jusqu?: number}}
 */
function verifierAcces(req, deps = {}) {
  const ip = (deps.ipResolver ? deps.ipResolver(req) : '') || 'inconnue';
  const e = entree(ip);
  if (e.bloque && e.bloque > maintenant()) {
    return { autorise: false, motif: e.motif || 'comportement suspect', jusqu: e.bloque, ip };
  }
  return { autorise: true, ip };
}

/**
 * Observe la fin d'une requête : c'est ici que l'on compte les 404, les
 * refus d'administration et les identifiants différents visités.
 * @returns {object|null} l'événement déclenché, s'il y en a un
 */
function observerReponse(req, statut, chemin, deps = {}) {
  const ip = (deps.ipResolver ? deps.ipResolver(req) : '') || 'inconnue';
  const e = entree(ip);
  const t = maintenant();

  if (statut === 404) {
    e.quatreOhQuatre.push(t);
    if (e.quatreOhQuatre.length >= CONFIG.max404) {
      return declencher('balayage_url', 'alerte',
        `${e.quatreOhQuatre.length} fichiers introuvables demandés en quelques minutes`,
        ip, chemin, deps);
    }
  }

  const estCheminAdmin = String(chemin).startsWith('/v1/admin') || chemin === '/admin-panel';
  const estRefusAdmin = statut === 401 || statut === 403 || (statut === 404 && chemin === '/admin-panel');
  if (estRefusAdmin && estCheminAdmin) {
    e.admin.push(t);
    if (e.admin.length >= CONFIG.maxAdmin) {
      return declencher('force_brute_admin', 'critique',
        `${e.admin.length} tentatives refusées sur l'espace d'administration`,
        ip, chemin, deps);
    }
  }

  const id = extraireIdentifiant(chemin);
  if (id) {
    e.ids.add(id);
    // On oublie les identifiants hors fenêtre.
    if (e.ids.size > 500) e.ids = new Set([...e.ids].slice(-200));
    if (e.ids.size >= CONFIG.maxIdentifiants) {
      return declencher('aspiration_contenu', 'alerte',
        `${e.ids.size} ressources différentes visées en quelques minutes`,
        ip, chemin, deps);
    }
  }

  return null;
}

/**
 * Demande directe d'un fichier interne : refusal immédiate et alerte.
 * (Le serveur renvoie déjà 404 pour ces fichiers, mais l'intention est
 * clairement hostile : on veut le savoir.)
 */
function detecterFichierInterdit(chemin) {
  const c = String(chemin || '').toLowerCase();
  return CONFIG.fichiersInterdits.some(f => c === f || c.startsWith(f));
}

// ── Déclenchement, blocage, alerte ────────────────────────────────────────

function declencher(type, gravite, message, ip, chemin, deps = {}) {
  const evenement = {
    type,
    gravite,
    message,
    ip,
    chemin: chemin || '',
    created_at: new Date().toISOString()
  };
  etat.compteurs.total++;
  if (gravite === 'alerte') etat.compteurs.alertes++;
  if (gravite === 'critique') etat.compteurs.critiques++;

  etat.evenements.unshift(evenement);
  if (etat.evenements.length > CONFIG.maxEvenements) etat.evenements.length = CONFIG.maxEvenements;

  console.warn(`[SECURITE] ${gravite.toUpperCase()} — ${type} — ${message} (${ip}${chemin ? ' — ' + chemin : ''})`);

  if (gravite === 'critique' || gravite === 'alerte') {
    bloquerIp(ip, message, deps, gravite === 'critique' ? CONFIG.dureeBlocageMs : Math.round(CONFIG.dureeBlocageMs / 2));
  }

  journaliser(evenement, deps);
  alerter(evenement, deps);

  return evenement;
}

/**
 * Écrit en base via la fonction fournie par le serveur. La fonction peut
 * renvoyer {ok:false} (clé service absente) au lieu de rejeter : on traite
 * les deux cas comme un échec silencieux — la mémoire prend le relais.
 */
function ecrireBase(deps, endpoint, methode, corps) {
  if (!deps.restWrite) return Promise.resolve(false);
  try {
    return Promise.resolve(deps.restWrite(endpoint, methode, corps))
      .then(r => !(r && r.ok === false))
      .catch(() => false);
  } catch (e) {
    return Promise.resolve(false);
  }
}

/** Bloque une adresse IP (mémoire + base si possible). */
function bloquerIp(ip, motif, deps = {}, dureeMs = CONFIG.dureeBlocageMs) {
  const cleanIp = String(ip).replace(/^::ffff:/, '');
  // Ne jamais verrouiller l'adresse de bouclage locale (runner de test / boucle interne)
  if (cleanIp === '127.0.0.1' || cleanIp === '::1' || cleanIp === 'localhost') {
    return;
  }
  const e = entree(ip);
  e.bloque = maintenant() + dureeMs;
  e.motif = motif;
  etat.compteurs.blocages++;
  console.warn(`[SECURITE] IP bloquée ${ip} pendant ${Math.round(dureeMs / 60000)} min — ${motif}`);

  // Table « blocage_acces » : la liste survit au redémarrage du serveur.
  const valeur = String(ip).replace(/^::ffff:/, '');
  ecrireBase(deps, '/rest/v1/blocage_acces', 'POST', {
    type: 'ip',
    valeur,
    motif: String(motif || '').slice(0, 300),
    jusqu_a: new Date(e.bloque).toISOString()
  });
  return { ip, jusqu: e.bloque, motif };
}

/** Retire un blocage. */
function debloquer(ip, deps = {}) {
  const e = etat.cip.get(ip);
  if (e) { e.bloque = 0; e.motif = ''; }
  const valeur = String(ip || '').replace(/^::ffff:/, '');
  ecrireBase(deps, `/rest/v1/blocage_acces?type=eq.ip&valeur=eq.${encodeURIComponent(valeur)}`, 'DELETE', null);
  return true;
}

/** Écrit l'événement dans la table « securite_evenements » (si possible). */
function journaliser(evenement, deps = {}) {
  return ecrireBase(deps, '/rest/v1/securite_evenements', 'POST', {
    type: evenement.type,
    gravite: evenement.gravite,
    ip: evenement.ip || null,
    chemin: evenement.chemin || null,
    details: { message: evenement.message }
  });
}

/**
 * Envoie l'alerte au webhook configuré (Telegram, Discord, Slack, Zapier…).
 * Silencieux en cas d'échec : une alerte ne doit jamais faire tomber le site.
 */
function alerter(evenement, deps = {}) {
  const url = deps.webhook || CONFIG.webhook;
  if (!url) return Promise.resolve(false);
  const corps = {
    text: `[Revizy · ${evenement.gravite.toUpperCase()}] ${evenement.message}\nIP : ${evenement.ip}\nChemin : ${evenement.chemin || '-'}\nDate : ${evenement.created_at}`,
    evenement
  };
  const controleur = new AbortController();
  const minuteur = setTimeout(() => controleur.abort(), CONFIG.timeoutWebhookMs);
  // Le « fetch » est injectable : les tests n'ont ainsi pas besoin du réseau.
  const envoi = deps.fetchImpl || fetch;
  return envoi(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(corps),
    signal: controleur.signal
  })
    .then(r => { clearTimeout(minuteur); return Boolean(r && r.ok); })
    .catch(e => { clearTimeout(minuteur); console.warn('[SECURITE] alerte non envoyée :', e.message); return false; });
}

/** État courant (espace admin). */
function etatSecurite() {
  const bloques = [];
  for (const [ip, e] of etat.cip) {
    if (e.bloque && e.bloque > maintenant()) {
      bloques.push({ ip, motif: e.motif, jusqu: new Date(e.bloque).toISOString() });
    }
  }
  return {
    compteurs: { ...etat.compteurs },
    evenements: etat.evenements.slice(0, 50),
    bloques,
    config: {
      max404: CONFIG.max404,
      maxAdmin: CONFIG.maxAdmin,
      maxIdentifiants: CONFIG.maxIdentifiants,
      dureeBlocageMinutes: Math.round(CONFIG.dureeBlocageMs / 60000),
      webhook: Boolean(depsWebhookActif())
    }
  };
}

function depsWebhookActif() { return Boolean(CONFIG.webhook); }

/** Les événements récents (mémoire). */
function evenementsRecents(limite = 50) { return etat.evenements.slice(0, limite); }

/** Nettoyage périodique (à appeler depuis un setInterval). */
function purger() { nettoyer(); }

// Fin du module.
module.exports = {
  CONFIG,
  verifierAcces,
  observerReponse,
  detecterFichierInterdit,
  declencher,
  bloquerIp,
  debloquer,
  journaliser,
  alerter,
  etatSecurite,
  evenementsRecents,
  purger,
  extraireIdentifiant
};
