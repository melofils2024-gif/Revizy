/**
 * server_epreuves.js — banque d'épreuves (sujets gratuits) et de corrigés (payants).
 *
 * Principe de sécurité : le fichier n'est JAMAIS exposé en direct.
 *   1. le front demande le catalogue (métadonnées publiques) ;
 *   2. l'élève clique « Télécharger » → le serveur vérifie ses droits ;
 *   3. le serveur renvoie soit un lien signé (bucket privé, 5 min),
 *      soit le fichier local, soit une redirection vers la source.
 *
 * Un corrigé non payé ne renvoie jamais d'URL : 402 et c'est tout.
 *
 * Rigueur du corrigé : la solution rédigée vit dans une table séparée
 * (epreuve_corrections). Elle n'est jointe au catalogue qu'avec les droits
 * de l'élève, et un corrigé payant ne peut pas être publié sans solution
 * rédigée, barème et validation humaine.
 */

const fs = require('fs');
const path = require('path');

const DOSSIER_PAR_DEFAUT = path.join(__dirname, 'epreuves');
const BUCKET = 'epreuves';
const DUREE_SIGNATURE_S = 300; // 5 minutes : assez pour télécharger, trop court pour diffuser.

// ── Formats acceptés ────────────────────────────────────────────────
// `inline` : le navigateur affiche le document (PDF, images).
// sinon    : téléchargement (Word, ZIP…) — plus logique qu'un PDF en clair.
const FORMATS = {
  pdf:  { mime: 'application/pdf', label: 'PDF', inline: true },
  docx: { mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', label: 'Word', inline: false },
  doc:  { mime: 'application/msword', label: 'Word', inline: false },
  odt:  { mime: 'application/vnd.oasis.opendocument.text', label: 'OpenDocument', inline: false },
  xlsx: { mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', label: 'Excel', inline: false },
  xls:  { mime: 'application/vnd.ms-excel', label: 'Excel', inline: false },
  pptx: { mime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', label: 'PowerPoint', inline: false },
  zip:  { mime: 'application/zip', label: 'ZIP', inline: false },
  rar:  { mime: 'application/vnd.rar', label: 'RAR', inline: false },
  png:  { mime: 'image/png', label: 'PNG', inline: true },
  jpg:  { mime: 'image/jpeg', label: 'JPEG', inline: true },
  jpeg: { mime: 'image/jpeg', label: 'JPEG', inline: true },
  gif:  { mime: 'image/gif', label: 'GIF', inline: true },
  webp: { mime: 'image/webp', label: 'WEBP', inline: true },
  txt:  { mime: 'text/plain; charset=utf-8', label: 'Texte', inline: true },
  csv:  { mime: 'text/csv; charset=utf-8', label: 'CSV', inline: false }
};

/** Extensions tolérées pour un fichier déposé (sécurité : pas d'exécutable). */
const EXTENSIONS_AUTORISEES = Object.keys(FORMATS);

/** Dossier local des fichiers (surchargeable pour les tests). */
function dossierEpreuves() {
  return process.env.EPREUVES_DIR || DOSSIER_PAR_DEFAUT;
}

/** Type d'épreuve : 'sujet' (gratuit) ou 'corrige' (payant). */
function normaliserType(valeur) {
  return String(valeur || '').toLowerCase() === 'corrige' ? 'corrige' : 'sujet';
}

/**
 * Deduit le format d'un document à partir de son nom de fichier.
 * (jamais d'exécutable : un .exe n'est pas un format d'épreuve)
 */
function detecterFormat(reference) {
  const brut = String(reference || '').split(/[?#]/)[0];
  const nom = brut.slice(brut.lastIndexOf('/') + 1);
  const point = nom.lastIndexOf('.');
  if (point < 0) return 'pdf';
  const extension = nom.slice(point + 1).toLowerCase();
  return EXTENSIONS_AUTORISEES.includes(extension) ? extension : 'pdf';
}

/** Informations de format (mime, libellé, affichage dans le navigateur). */
function infosFormat(format, reference) {
  const cle = String(format || '').toLowerCase();
  if (FORMATS[cle]) return FORMATS[cle];
  return FORMATS[detecterFormat(reference)];
}

/**
 * L'élève a-t-il accès à cette épreuve ?
 * - sujet gratuit : toujours ;
 * - corrigé : débloqué à l'achat, ou couvert par l'abonnement ;
 * - admin : tout.
 */
function aAcces(epreuve, entitlements) {
  if (!epreuve) return false;
  if (epreuve.is_free) return true;
  if (!entitlements) return false;
  if (entitlements.isAdmin) return true;
  if (entitlements.epreuves && entitlements.epreuves.has(String(epreuve.id))) return true;
  return Boolean(entitlements.niveaux && (entitlements.niveaux.has(epreuve.niveau) || entitlements.niveaux.has('all')));
}

/**
 * Vue publique d'une épreuve (sans le chemin interne du fichier).
 * La solution n'est jointe que si l'élève a les droits.
 */
function epreuvePublique(row, entitlements, correction) {
  const acces = aAcces(row, entitlements);
  const corr = correction || {};
  const format = String(row.format || '').toLowerCase() || detecterFormat(row.fichier_url);
  // La solution rédigée concerne les corrigés, et seulement ceux que
  // l'élève a le droit de lire.
  const solutionAutorisee = acces && normaliserType(row.type) === 'corrige';
  return {
    id: row.id,
    slug: row.slug || '',
    pays: row.pays,
    niveau: row.niveau,
    classe: row.classe || null,
    serie: row.serie || null,
    annee: row.annee,
    matiere: row.matiere,
    type: normaliserType(row.type),
    titre: row.titre,
    description: row.description || '',
    pages: row.pages || null,
    // Format du document (PDF, Word, ZIP…) : l'élève sait ce qu'il va obtenir.
    format,
    formatLabel: infosFormat(format, row.fichier_url).label,
    // Traçabilité obligatoire : d'où vient le document, sous quelle licence.
    source: {
      nom: row.source_nom || '',
      url: row.source_url || '',
      licence: row.licence || ''
    },
    isFree: Boolean(row.is_free),
    price: Number(row.price) || 0,
    accessible: acces,
    telechargeable: acces || Boolean(row.is_free),
    // Qualité annoncée du corrigé (visible AVANT l'achat : c'est ce qui
    // justifie le prix).
    difficulte: corr.difficulte || 'moyen',
    bareme: Number(corr.bareme) || null,
    validee: Boolean(corr.validee),
    // La solution rédigée : uniquement pour celui qui a les droits.
    solution: solutionAutorisee ? (corr.solution || '') : '',
    aSolution: solutionAutorisee && Boolean(corr.solution),
    signale: Number(corr.signalements) || 0
  };
}

/**
 * Liste les épreuves (catalogue public, filtré).
 * @param {object} filtres {pays, niveau, classe, serie, annee, matiere, type}
 * @param {object} deps {restGet}
 */
async function listerEpreuves(filtres, deps) {
  const restGet = deps && deps.restGet;
  if (typeof restGet !== 'function') return [];
  const conditions = ['published=eq.true'];
  if (filtres.pays) conditions.push(`pays=eq.${encodeURIComponent(String(filtres.pays).toUpperCase())}`);
  if (filtres.niveau) conditions.push(`niveau=eq.${encodeURIComponent(String(filtres.niveau).toLowerCase())}`);
  if (filtres.matiere) conditions.push(`matiere=eq.${encodeURIComponent(String(filtres.matiere))}`);
  if (filtres.type) conditions.push(`type=eq.${encodeURIComponent(normaliserType(filtres.type))}`);
  if (filtres.annee) conditions.push(`annee=eq.${encodeURIComponent(String(filtres.annee))}`);
  // Ciblage scolaire : une épreuve de 1re série C ne doit pas être proposée
  // à un élève de 3e ni à un élève de 1re série A.
  if (filtres.classe) conditions.push(`classe=eq.${encodeURIComponent(String(filtres.classe))}`);
  if (filtres.serie) conditions.push(`serie=eq.${encodeURIComponent(String(filtres.serie))}`);

  const endpoint = `/rest/v1/epreuves?select=*&${conditions.join('&')}&order=annee.desc,niveau.asc,matiere.asc`;
  const rows = await restGet(endpoint);
  return Array.isArray(rows) ? rows : [];
}

/** Récupère une épreuve par identifiant. */
async function epreuveParId(id, deps) {
  const restGet = deps && deps.restGet;
  if (typeof restGet !== 'function' || !id) return null;
  const rows = await restGet(`/rest/v1/epreuves?id=eq.${encodeURIComponent(String(id))}&select=*&limit=1`);
  return Array.isArray(rows) && rows.length ? rows[0] : null;
}

/**
 * Charge les corrections d'un ensemble d'épreuves.
 * (table séparée : le contenu n'est pas dans le catalogue public)
 */
async function chargerCorrections(ids, deps) {
  const restGet = deps && deps.restGet;
  const carte = {};
  if (typeof restGet !== 'function' || !ids || !ids.length) return carte;
  const liste = ids.map(id => `"${String(id).replace(/"/g, '')}"`).join(',');
  const rows = await restGet(`/rest/v1/epreuve_corrections?epreuve_id=in.(${liste})&select=*`);
  if (!Array.isArray(rows)) return carte;
  for (const row of rows) {
    carte[String(row.epreuve_id)] = {
      solution: row.solution || '',
      bareme: Number(row.bareme) || 0,
      difficulte: row.difficulte || 'moyen',
      validee: Boolean(row.validee),
      valide_le: row.valide_le || null
    };
  }
  return carte;
}

/** Corrige une épreuve par identifiant (table des corrections). */
async function chargerCorrection(epreuveId, deps) {
  const restGet = deps && deps.restGet;
  if (typeof restGet !== 'function' || !epreuveId) return null;
  const rows = await restGet(`/rest/v1/epreuve_corrections?epreuve_id=eq.${encodeURIComponent(String(epreuveId))}&select=*&limit=1`);
  return Array.isArray(rows) && rows.length ? rows[0] : null;
}

/**
 * Règles de publication d'une épreuve.
 * Un corrigé payant n'est publiable que si sa correction est complète :
 * solution rédigée, barème, validation. C'est la garantie de rigueur
 * que l'élève paie.
 * @returns {string[]} liste des problèmes (vide = publiable)
 */
function verifierPublication(epreuve, correction) {
  const erreurs = [];
  const corr = correction || {};
  if (!epreuve || !epreuve.titre) erreurs.push('titre obligatoire');
  if (!epreuve.fichier_url) erreurs.push('fichier obligatoire');
  if (!epreuve.source_nom || !epreuve.licence) {
    erreurs.push('source et licence obligatoires (traçabilité)');
  }
  const type = normaliserType(epreuve.type);
  if (type === 'corrige' && !epreuve.is_free) {
    if (!(Number(epreuve.price) > 0)) erreurs.push('prix du corrigé obligatoire');
    if (!corr.validee) erreurs.push('corrigé non validé : il doit être relu et validé');
    if (!corr.solution || String(corr.solution).trim().length < 80) {
      erreurs.push('solution rédigée obligatoire (80 caractères minimum)');
    }
    if (!(Number(corr.bareme) > 0)) erreurs.push('barème obligatoire');
  }
  return erreurs;
}

/**
 * Traduit la référence de fichier en une URL téléchargeable.
 *   http(s)://…  → source externe (redirection après contrôle des droits)
 *   supabase:…   → objet du bucket privé (URL signée par le serveur)
 *   nom.pdf      → fichier local du dossier « epreuves/ »
 */
async function resoudreLienFichier(epreuve, deps) {
  const reference = String((epreuve && epreuve.fichier_url) || '').trim();
  if (!reference) return { ok: false, error: 'Aucun fichier associé' };

  if (/^https?:\/\//i.test(reference)) {
    return { ok: true, mode: 'externe', url: reference };
  }

  if (reference.startsWith('supabase:')) {
    const objet = reference.slice('supabase:'.length).replace(/^\/+/, '');
    const signe = await signerObjetSupabase(objet, deps);
    if (!signe.ok) return signe;
    return { ok: true, mode: 'supabase', url: signe.url, expireDans: DUREE_SIGNATURE_S };
  }

  const nom = path.basename(reference);
  const fichier = path.join(dossierEpreuves(), nom);
  if (!fs.existsSync(fichier)) {
    return { ok: false, error: `Fichier absent du serveur (${nom})` };
  }
  return { ok: true, mode: 'local', url: `/epreuves/${encodeURIComponent(nom)}`, chemin: fichier };
}

/** URL signée d'un objet du bucket privé (clé service obligatoire). */
async function signerObjetSupabase(objet, deps) {
  const urlBase = process.env.SUPABASE_URL || '';
  const cleService = process.env.SUPABASE_SERVICE_KEY || '';
  if (!urlBase || !cleService) {
    return { ok: false, error: 'SUPABASE_SERVICE_KEY absente : impossible de signer le fichier' };
  }
  const chemin = objet.split('/').map(part => encodeURIComponent(part)).join('/');
  try {
    const res = await fetch(`${urlBase.replace(/\/$/, '')}/storage/v1/object/sign/${BUCKET}/${chemin}`, {
      method: 'POST',
      headers: {
        apikey: cleService,
        Authorization: `Bearer ${cleService}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ expiresIn: DUREE_SIGNATURE_S })
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      return { ok: false, error: `Signature impossible (${res.status}) ${detail.slice(0, 160)}` };
    }
    const data = await res.json().catch(() => ({}));
    const signed = data && (data.signedURL || data.signedUrl || data.url);
    if (!signed) return { ok: false, error: 'URL signée absente de la réponse' };
    const base = urlBase.replace(/\/$/, '');
    return { ok: true, url: signed.startsWith('http') ? signed : `${base}${signed}` };
  } catch (error) {
    return { ok: false, error: `Signature impossible : ${error.message}` };
  }
}

/**
 * Nom de fichier servi au client (jamais de chemin de dossier).
 * Nettoyé : pas de guillemet ni de saut de ligne dans un en-tête HTTP.
 */
function nomFichier(row) {
  const brut = String((row && (row.fichier_nom || row.fichier_url)) || '')
    .split(/[?#]/)[0]
    .split('/')
    .pop() || 'epreuve.pdf';
  return brut.replace(/[\r\n"\\]/g, '').slice(0, 120) || 'epreuve.pdf';
}

/**
 * Sert un fichier local d'épreuve (mode « local »).
 * Le contrôle des droits a déjà été fait par l'appelant.
 */
function servirFichierLocal(req, res, chemin, nom, format) {
  const infos = infosFormat(format, nom);
  const type = infos.mime;
  const nomPropre = String(nom || 'epreuve.pdf').replace(/[\r\n"\\]/g, '').slice(0, 120) || 'epreuve.pdf';
  fs.readFile(chemin, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Fichier introuvable');
      return;
    }
    // PDF et images : affichage dans l'onglet. Word/ZIP : téléchargement.
    const disposition = infos.inline ? 'inline' : 'attachment';
    res.writeHead(200, {
      'Content-Type': type,
      'Content-Length': data.length,
      'Content-Disposition': `${disposition}; filename="${nomPropre}"`,
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'private, max-age=300'
    });
    res.end(data);
  });
}

/**
 * Journalise une action d'élève (téléchargement, consultation, signalement).
 * Silencieux en cas d'échec : on ne casse jamais un download pour un log.
 */
async function journaliser(userId, epreuveId, action, deps) {
  const write = deps && deps.write;
  if (typeof write !== 'function' || !epreuveId) return false;
  try {
    const resultat = await write('/rest/v1/epreuves_activites', 'POST', {
      user_id: userId || null,
      epreuve_id: epreuveId,
      action
    });
    return Boolean(resultat && resultat.ok);
  } catch (e) {
    console.warn('[EPREUVES] journalisation impossible:', e.message);
    return false;
  }
}

module.exports = {
  BUCKET,
  DUREE_SIGNATURE_S,
  FORMATS,
  EXTENSIONS_AUTORISEES,
  dossierEpreuves,
  normaliserType,
  detecterFormat,
  infosFormat,
  aAcces,
  epreuvePublique,
  listerEpreuves,
  epreuveParId,
  chargerCorrections,
  chargerCorrection,
  verifierPublication,
  resoudreLienFichier,
  signerObjetSupabase,
  servirFichierLocal,
  nomFichier,
  journaliser
};
