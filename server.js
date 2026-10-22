const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

loadLocalEnv();

const payments = require('./server_payments.js');
const seo = require('./server_seo.js');
// Contextes nationaux (Bénin aujourd'hui, extension régionale/internationale).
// Toute donnée propre à un pays est centralisée dans contexts.js.
const { CONTEXTS, DEFAULT_CODE, getContext, getContextBySlug, listContexts, resolveContext } = require('./contexts.js');

// ── Supabase REST client (léger, sans SDK) ──────────────────────────
const SUPABASE_URL     = process.env.SUPABASE_URL     || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY
                          || process.env.SUPABASE_ANON_KEY
                          || '';

/**
 * Appel REST Supabase minimal (GET PostgREST ou RPC).
 * @param {string} endpoint  ex: "/rest/v1/rpc/get_curriculum_topics"
 * @param {object} body      payload JSON pour les RPC POST
 * @returns {Promise<any>}   données parsées ou null en cas d'erreur
 */
async function supabaseFetch(endpoint, body = null) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) return null;
  try {
    const url = SUPABASE_URL.replace(/\/$/, '') + endpoint;
    const options = {
      method: body ? 'POST' : 'GET',
      headers: {
        'apikey':        SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type':  'application/json',
        'Accept':        'application/json'
      }
    };
    if (body) options.body = JSON.stringify(body);
    const res = await fetch(url, options);
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    console.warn('supabaseFetch error:', e.message);
    return null;
  }
}

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
// Modèle principal : gemini-3.5-flash-lite.
// Mesuré sur le projet réel (tools/benchmark-models.js + tests directs) :
//   - quota gratuit : ~1 500 requêtes/JOUR pour la famille Flash-Lite,
//     contre 20 req/jour pour chaque Flash "standard" (3.5 / 3.6 / 3.7 / 3.8)
//     → les Flash standards saturent en quelques dizaines de requêtes ;
//   - vitesse : 2,8 s pour une réponse de chat, 12,5 s pour 30 questions ;
//   - qualité : correcte en français (philosophie, littérature) et en maths.
// Chaîne de secours maintenue : sans elle, une saturation de Google (503
// "high demand" ou 429 quota) met tout le site hors service.
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
const GEMINI_FALLBACK_MODELS = String(
  process.env.GEMINI_FALLBACK_MODELS
    || 'gemini-flash-lite-latest,gemini-3.1-flash-lite,gemini-3.6-flash,gemini-3.7-flash,gemini-3.8-flash,gemini-3.5-flash,gemini-flash-latest'
)
  .split(',')
  .map(name => name.trim())
  .filter(Boolean);
const courseCache = new Map();

// Clés API disponibles : la seconde est utile en secours (quota ou clé révoquée).
const GEMINI_API_KEYS = [process.env.GEMINI_API_KEY, process.env.GEMINI_API_KEY_2]
  .filter(key => key && key !== 'cle_api_gemini_reelle');

// Quand Google signale une clé invalide, onarrête de marteler l'API pendant un moment
// et on répond tout de suite avec un message clair au lieu d'une fausse "panne".
let aiKeyBlockedUntil = 0;
const AI_KEY_BLOCK_MS = 10 * 60 * 1000;

function isAiKeyBlocked() {
  return Date.now() < aiKeyBlockedUntil;
}

function isInvalidKeyError(status, data) {
  if (![400, 401, 403].includes(status)) return false;
  const message = String((data && data.error && data.error.message) || '').toLowerCase();
  // 400 = clé refusée, 401 = clé tronquée ou absente ("invalid authentication credentials"),
  // 403 = clé sans accès à l'API. 403 "high demand" n'existe pas : Gemini renvoie 503 pour ça.
  return message.includes('api key')
    || message.includes('authentication')
    || message.includes('credential')
    || message.includes('permission')
    || message.includes('unauthorized')
    || message.includes('api has not been used');
}

// Appelle Gemini avec timeout par appel, retry court et bascule sur le modèle de secours.
// Retourne { ok, status, data, model, invalidKey }.
const GEMINI_TIMEOUT_CHAT_MS = Number(process.env.GEMINI_TIMEOUT_CHAT_MS) || 25000;
const GEMINI_TIMEOUT_COURSE_MS = Number(process.env.GEMINI_TIMEOUT_COURSE_MS) || 110000;

async function callGemini(requestBody, timeoutMs = GEMINI_TIMEOUT_CHAT_MS, totalBudgetMs = timeoutMs * 2) {
  // 1 essai sur le modèle principal (le plus rapide), puis 1 essai sur le secours.
  const plans = [
    { model: GEMINI_MODEL, attempts: 1 },
    ...GEMINI_FALLBACK_MODELS.map(model => ({ model, attempts: 1 }))
  ].filter(plan => plan.model);

  let lastStatus = 0;
  let lastData = null;
  let invalidKey = false;
  // Budget global : sans lui, une saturation totale de Google enchainerait
  // 5 modèles à 110 s chacun (jusqu'à 9 minutes d'attente côté élève).
  const startedAt = Date.now();

  for (const apiKey of GEMINI_API_KEYS) {
    for (let p = 0; p < plans.length && !invalidKey; p++) {
      if (Date.now() - startedAt > totalBudgetMs) {
        console.error(`Gemini: budget de ${Math.round(totalBudgetMs / 1000)} s épuisé, abandon`);
        return { ok: false, status: lastStatus, data: lastData || { error: { code: 0, message: 'Service IA indisponible (trop lent)' } }, invalidKey };
      }
      const { model, attempts } = plans[p];

    for (let attempt = 0; attempt < attempts; attempt++) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
            signal: controller.signal
          }
        );

        const data = await response.json();
        if (response.ok && data.candidates && data.candidates[0]) {
          return { ok: true, status: response.status, data, model };
        }

        lastStatus = response.status;
        lastData = data;
        // Clé refusée par Google : inutile d'essayer les autres modèles
        if (isInvalidKeyError(response.status, data)) {
          invalidKey = true;
          aiKeyBlockedUntil = Date.now() + AI_KEY_BLOCK_MS;
          console.error(`Gemini: clé API refusée (${response.status}) — accès IA suspendu ${AI_KEY_BLOCK_MS / 60000} min`);
          break;
        }
        // 4xx autre que 429 = requête invalide : inutile de réessayer
        const errorCode = data && data.error ? data.error.code : 0;
        if (response.status >= 400 && response.status < 500 && errorCode !== 429) {
          break;
        }
        // 429 = quota par minute atteint : on patiente avant le nouvel essai
        if (errorCode === 429 || response.status === 429) {
          const retryAfter = Number(response.headers.get('retry-after')) || 5;
          await new Promise(resolve => setTimeout(resolve, Math.min(retryAfter, 10) * 1000));
        }
      } catch (error) {
        lastStatus = 0;
        lastData = { error: { code: 0, message: error.message } };
        console.error(`Gemini ${model} : ${error.message}`);
      } finally {
        clearTimeout(timer);
      }

      if (attempt < attempts - 1) {
        await new Promise(resolve => setTimeout(resolve, 800));
      }
    }
      if (!invalidKey && p < plans.length - 1) {
        console.error(`Gemini: modèle ${model} indisponible, bascule sur le suivant`);
      }
    }
  }

  return { ok: false, status: lastStatus, data: lastData, invalidKey };
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/plain; charset=utf-8',
  '.sql': 'text/plain; charset=utf-8'
};

function loadLocalEnv() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) return;

  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    value = value.replace(/\s+[;#].*$/, '').trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

function safeJoin(root, requestPath) {
  const decoded = decodeURIComponent((requestPath || '/').split('?')[0]);
  const cleaned = path.normalize(decoded).replace(/^(\.\.[/\\])+/, '');
  const full = path.join(root, cleaned);
  if (!full.startsWith(root)) return null;
  return full;
}

function sendJson(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

function readRawBody(req, maxBytes = 64 * 1024) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', chunk => {
      raw += chunk;
      if (raw.length > maxBytes) {
        reject(new Error('Payload trop volumineux'));
        req.destroy();
      }
    });
    req.on('end', () => resolve(raw));
    req.on('error', reject);
  });
}

function parseJsonBody(raw) {
  return raw ? JSON.parse(raw) : {};
}

async function readJsonBody(req) {
  return parseJsonBody(await readRawBody(req));
}

function cleanText(value, max = 80) {
  return String(value || '').replace(/[<>]/g, '').trim().slice(0, max);
}

function slugify(value) {
  return cleanText(value, 120)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'cours';
}

function cleanQuizOption(value) {
  return cleanText(value, 220)
    .replace(/\s*\((?:correct|bonne réponse|réponse correcte)\)\s*/gi, '')
    .replace(/\s*-\s*(?:correct|bonne réponse|réponse correcte)\s*$/gi, '')
    .trim();
}

function repairJson(text) {
  // Répare les JSON tronqués ou malformés par le modèle (virgules en fin, guillemets non fermés)
  const cleaned = String(text || '')
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim();

  const start = cleaned.indexOf('{');
  const raw = start !== -1 ? cleaned.slice(start) : cleaned;

  let candidate = raw.replace(/\}\s*\.\.\.\s*$/, '}');
  // Combles les virgules manquantes entre deux objets/chaînes d'un tableau
  candidate = candidate.replace(/\}\s*\{/g, '},{').replace(/\}\s*"/g, '},"');
  // Supprime les virgules orphelines avant un accolades/crochets fermants
  candidate = candidate.replace(/,\s*([}\]])/g, '$1');
  // Referme les structures restées ouvertes
  const stack = [];
  let inString = false;
  let escaped = false;
  for (let i = 0; i < candidate.length; i++) {
    const ch = candidate[i];
    if (escaped) { escaped = false; continue; }
    if (ch === '\\') { escaped = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === '{' || ch === '[') stack.push(ch);
    else if (ch === '}' || ch === ']') stack.pop();
  }
  if (inString) candidate += '"';
  for (let i = stack.length - 1; i >= 0; i--) {
    candidate += stack[i] === '{' ? '}' : ']';
  }
  return candidate;
}

function extractJson(text) {
  const cleaned = String(text || '').trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch (error) {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1));
      } catch (innerError) {
        return JSON.parse(repairJson(cleaned));
      }
    }
    return JSON.parse(repairJson(cleaned));
  }
}

/**
 * Analyse la structure du programme saisie par l'admin.
 * Format accepté (libre) :
 *   SA 1 : Titre de la partie
 *     1. Premier chapitre
 *     2. Deuxième chapitre
 *   SA 2 : Autre partie
 *     1. Chapitre
 * Un simple titre par ligne est aussi accepté : les chapitres sont alors
 * regroupés par deux en situations d'apprentissage numérotées automatiquement.
 * Retourne [{ sa, num, titre, chapitres: [] }]
 */
function parseProgramParts(text) {
  const parts = [];
  const lines = String(text || '').split(/\r?\n/);
  let current = null;
  let sawExplicitSa = false;

  const pushPart = part => {
    part.chapitres = part.chapitres.filter(Boolean);
    if (part.titre || part.chapitres.length) parts.push(part);
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    const saMatch = line.match(/^(?:sa\s*|situation\s*d['’]?\s*apprentissage\s*)(\d+)\s*[:.\-–—]\s*(.*)$/i);
    if (saMatch) {
      if (current) pushPart(current);
      const num = parseInt(saMatch[1], 10);
      current = { sa: `SA ${num}`, num, titre: saMatch[2].trim(), chapitres: [] };
      sawExplicitSa = true;
      continue;
    }

    const numMatch = line.match(/^(\d+)\s*[).\-–—]\s*(.+)$/);
    const bulletMatch = line.match(/^[-*•]\s*(.+)$/);
    const chapterTitle = numMatch ? numMatch[2].trim() : (bulletMatch ? bulletMatch[1].trim() : line);

    if (!current) {
      current = { sa: '', num: 0, titre: '', chapitres: [] };
    }
    current.chapitres.push(chapterTitle);
  }
  if (current) pushPart(current);

  // Aucune SA explicite : on regroupe les chapitres par deux en SA numérotées
  if (!sawExplicitSa && parts.length) {
    const regrouped = [];
    let buffer = [];
    let saNum = 1;
    const flush = () => {
      if (!buffer.length) return;
      regrouped.push({
        sa: `SA ${saNum}`,
        num: saNum,
        titre: '',
        chapitres: buffer.slice()
      });
      buffer = [];
      saNum++;
    };
    for (const part of parts) {
      for (const chapitre of part.chapitres) {
        buffer.push(chapitre);
        if (buffer.length === 2) flush();
      }
    }
    flush();
    return regrouped;
  }

  // Numérotation SA continue même si l'admin a sauté des numéros
  let autoNum = 0;
  for (const part of parts) {
    autoNum++;
    if (!part.num) part.num = autoNum;
    part.sa = part.sa || `SA ${part.num}`;
  }
  return parts;
}

/**
 * Transforme une structure de programme en liste de titres de chapitres,
 * en conservant l'ordre et la numérotation SA / chapitre.
 */
function programPartsToChapters(parts) {
  const chapters = [];
  let num = 0;
  for (const part of parts) {
    const saLabel = part.sa || `SA ${part.num}`;
    for (const titre of part.chapitres || []) {
      num++;
      chapters.push({ num, sa: saLabel, titre });
    }
  }
  return chapters;
}

function normalizeChapters(chapitres, niveau, subjectName) {
  const basePrice = niveau === 'brevet' ? 100 : 150;
  const FREE_CHAPTER_COUNT = 3; // les 3 premiers chapitres sont gratuits
  return (Array.isArray(chapitres) ? chapitres : []).map((chapter, index) => {
    const title = cleanText(chapter.title || `Chapitre ${index + 1} — ${subjectName}`, 180);
    // Reprend la situation d'apprentissage du titre ("SA 2 : ...") ou du champ dédié
    const saFromTitle = title.match(/^(SA\s*\d+)\s*[:.\-–—]/i);
    const sa = cleanText(chapter.sa || (saFromTitle ? saFromTitle[1] : ''), 20).toUpperCase();
    const exercice = chapter.exercice || {};
    const type = exercice.type === 'vf' ? 'vf' : 'qcm';
    const options = Array.isArray(exercice.options) && exercice.options.length >= 2
      ? exercice.options.slice(0, 4).map(cleanQuizOption)
      : [
          'a) Je ne sais pas',
          'b) Je sais appliquer la méthode',
          'c) Je récite sans comprendre',
          'd) Je saute les exercices'
        ];

    const isFree = index < FREE_CHAPTER_COUNT;
    return {
      id: `${niveau}_${slugify(subjectName)}_gemini_${index + 1}_${slugify(title)}`,
      num: index + 1,
      sa: sa || null,
      title,
      isFree,
      price: isFree ? 0 : (Number(chapter.price) || basePrice),
      cours: cleanText(chapter.cours, 6000) || `Cours de ${subjectName} à compléter.`,
      exemple: {
        titre: cleanText(chapter.exemple && chapter.exemple.titre || 'Exemple guidé', 120),
        enonce: cleanText(chapter.exemple && chapter.exemple.enonce || 'Énoncé type examen.', 1000),
        solution: cleanText(chapter.exemple && chapter.exemple.solution || 'Correction détaillée.', 1800)
      },
      exercice: {
        consigne: cleanText(exercice.consigne || 'Exercice d’application', 160),
        question: cleanText(exercice.question || 'Quelle réponse est correcte ?', 1000),
        type,
        options,
        correctOption: cleanText(exercice.correctOption || (type === 'vf' ? 'vrai' : 'b'), 10).toLowerCase(),
        explication: cleanText(exercice.explication || 'Explication de la réponse.', 1200)
      }
    };
  });
}

function timingSafeCompare(a, b) {
  const left = Buffer.from(String(a || ''), 'utf8');
  const right = Buffer.from(String(b || ''), 'utf8');
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function getFedapaySignature(req) {
  const headerNames = ['x-fedapay-signature', 'fedapay-signature', 'x-signature', 'signature'];
  for (const name of headerNames) {
    const value = req.headers[name];
    if (value) return String(value);
  }
  return '';
}

function verifyFedapaySignature(req, rawBody) {
  const secret = process.env.FEDAPAY_WEBHOOK_SECRET;
  if (!secret) return { ok: true, reason: 'secret-not-configured' };

  const received = getFedapaySignature(req);
  if (!received) return { ok: false, reason: 'missing-signature' };

  const hmac = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  const candidates = [received, received.replace(/^sha256=/i, '')];
  const v1 = received.match(/v1=([a-f0-9]+)/i);
  if (v1) candidates.push(v1[1]);

  return { ok: candidates.some(candidate => timingSafeCompare(candidate, hmac)), reason: 'checked' };
}

function extractFedapayPayment(payload) {
  const entity = payload.entity || payload.data || payload.transaction || payload;
  const customer = entity.customer || payload.customer || {};
  const status = String(entity.status || entity.transaction_status || payload.status || payload.name || '').toLowerCase();
  const approved = status.includes('approved') || status.includes('completed') || status.includes('success') || status.includes('transaction.approved');

  return {
    approved,
    event: payload.name || payload.event || payload.type || status || 'fedapay.webhook',
    reference: entity.reference || entity.id || entity.transaction_id || payload.id || '',
    amount: entity.amount || entity.amount_transferred || entity.total || 0,
    currency: entity.currency || process.env.FEDAPAY_CURRENCY || 'XOF',
    description: entity.description || entity.reason || payload.description || 'Paiement Revizy',
    customerName: [customer.firstname, customer.lastname, customer.name].filter(Boolean).join(' ') || customer.full_name || '',
    customerEmail: customer.email || entity.email || '',
    customerPhone: customer.phone_number || customer.phone || entity.phone || ''
  };
}

function buildPaymentAlert(payment) {
  return [
    'Paiement Revizy reçu',
    `Montant: ${payment.amount} ${payment.currency}`,
    `Référence: ${payment.reference || 'N/A'}`,
    `Client: ${payment.customerName || payment.customerEmail || payment.customerPhone || 'N/A'}`,
    `Description: ${payment.description}`
  ].join('\n');
}

async function sendOwnerAlerts(payment) {
  const message = buildPaymentAlert(payment);

  if (process.env.OWNER_ALERT_WEBHOOK_URL) {
    await fetch(process.env.OWNER_ALERT_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: message, payment })
    });
  }

  if (process.env.CALLMEBOT_PHONE && process.env.CALLMEBOT_APIKEY) {
    const url = new URL('https://api.callmebot.com/whatsapp.php');
    url.searchParams.set('phone', process.env.CALLMEBOT_PHONE);
    url.searchParams.set('apikey', process.env.CALLMEBOT_APIKEY);
    url.searchParams.set('text', message);
    await fetch(url);
  }
}

async function handleFedapayWebhook(req, res) {
  let rawBody;
  let payload;
  try {
    rawBody = await readRawBody(req, 128 * 1024);
    payload = parseJsonBody(rawBody);
  } catch (error) {
    sendJson(res, 400, { success: false, error: 'Webhook JSON invalide' });
    return;
  }

  const signature = verifyFedapaySignature(req, rawBody);
  if (!signature.ok) {
    sendJson(res, 401, { success: false, error: 'Signature webhook invalide' });
    return;
  }

  const payment = extractFedapayPayment(payload);
  if (payment.approved) {
    try {
      await sendOwnerAlerts(payment);
    } catch (error) {
      console.error('Alerte paiement non envoyée:', error.message);
    }
  }

  sendJson(res, 200, { success: true, received: true });
}

/**
 * Création d'une transaction FedaPay côté serveur.
 * Le montant est calculé par le serveur : le navigateur ne peut pas l'imposer.
 */
async function handleCreateTransaction(req, res) {
  let body;
  try {
    body = await readJsonBody(req);
  } catch (error) {
    sendJson(res, 400, { success: false, error: 'JSON invalide' });
    return;
  }

  const token = getBearerToken(req);
  const user = await payments.getUserFromToken(token);
  if (!user) {
    sendJson(res, 401, { success: false, error: 'Connexion requise pour payer' });
    return;
  }

  const kind = body.kind === 'subscription' ? 'subscription' : 'chapter';
  const niveau = cleanText(body.niveau || 'bac', 10).toLowerCase();
  if (!['bac', 'brevet'].includes(niveau)) {
    sendJson(res, 400, { success: false, error: 'Niveau invalide' });
    return;
  }

  const chapterId = kind === 'chapter' ? cleanText(body.chapterId, 160) : '';
  if (kind === 'chapter' && !chapterId) {
    sendJson(res, 400, { success: false, error: 'Chapitre manquant' });
    return;
  }

  const ctx = contextFromRequest(req, body);
  const expected = await payments.resolveExpectedAmount(kind, niveau, chapterId, body.amount, cleanText(body.title, 180), ctx);
  if (!expected.amount || expected.amount <= 0) {
    sendJson(res, 400, { success: false, error: 'Montant invalide' });
    return;
  }

  const description = kind === 'subscription'
    ? `Revizy - Abonnement mensuel ${niveau === 'brevet' ? 'Brevet' : 'BAC'}`
    : `Revizy - Cours ${chapterId}`;

  const result = await payments.fedapayRequest('/transactions', {
    method: 'POST',
    body: {
      amount: expected.amount,
      description,
      currency: expected.currency,
      callback_url: process.env.FEDAPAY_CALLBACK_URL || process.env.APP_BASE_URL_FRONT || process.env.APP_BASE_URL || '',
      customer: {
        email: user.email,
        firstname: (user.name || 'Eleve').split(' ')[0],
        lastname: (user.name || 'Revizy').split(' ').slice(1).join(' ') || 'Eleve',
        phone_number: cleanText(body.phone || '', 20)
      },
      metadata: { kind, niveau, chapter_id: chapterId, user_id: user.id }
    }
  });

  if (!result.ok || !result.data) {
    console.error('FedaPay create transaction:', result.status, result.error || JSON.stringify(result.data || {}).slice(0, 300));
    sendJson(res, 502, { success: false, error: 'Initialisation du paiement impossible' });
    return;
  }

  sendJson(res, 200, {
    success: true,
    amount: expected.amount,
    transactionId: result.data.id || result.data.transaction_id || '',
    paymentUrl: result.data.payment_url || '',
    kind,
    niveau,
    chapterId
  });
}

/**
 * Vérification d'un paiement et déblocage côté serveur.
 * C'est le seul chemin qui autorise l'accès à un cours payant.
 */
async function handleVerifyPayment(req, res) {
  let body;
  try {
    body = await readJsonBody(req);
  } catch (error) {
    sendJson(res, 400, { success: false, error: 'JSON invalide' });
    return;
  }

  const token = getBearerToken(req);
  const user = await payments.getUserFromToken(token);
  if (!user) {
    sendJson(res, 401, { success: false, error: 'Connexion requise' });
    return;
  }

  const transactionId = cleanText(body.transactionId, 120);
  const kind = body.kind === 'subscription' ? 'subscription' : 'chapter';
  const niveau = cleanText(body.niveau || 'bac', 10).toLowerCase();
  const chapterId = kind === 'chapter' ? cleanText(body.chapterId, 160) : '';

  if (!transactionId) {
    sendJson(res, 400, { success: false, error: 'Référence de transaction manquante' });
    return;
  }
  if (kind === 'chapter' && !chapterId) {
    sendJson(res, 400, { success: false, error: 'Chapitre manquant' });
    return;
  }

  const check = await payments.verifyTransaction(transactionId);
  if (!check.ok) {
    console.warn('Paiement non validé:', transactionId, check.reason);
    sendJson(res, 402, { success: false, error: `Paiement non validé (${check.reason || 'statut inconnu'})` });
    return;
  }

  const ctx = contextFromRequest(req, body);
  const expected = await payments.resolveExpectedAmount(kind, niveau, chapterId, check.amount, cleanText(body.title, 180), ctx);
  if (check.amount < expected.amount) {
    console.warn('Montant insuffisant:', transactionId, check.amount, '<', expected.amount);
    sendJson(res, 402, { success: false, error: `Montant insuffisant (${check.amount} sur ${expected.amount} requis)` });
    return;
  }
  if (check.currency && expected.currency && check.currency !== expected.currency) {
    sendJson(res, 402, { success: false, error: 'Devise non conforme' });
    return;
  }

  if (await payments.isTransactionAlreadyUsed(transactionId)) {
    sendJson(res, 409, { success: false, error: 'Cette transaction a déjà été utilisée' });
    return;
  }

  // Écriture serveur : c'est le seul endroit où le déblocage est autorisé
  let write;
  if (kind === 'subscription') {
    write = await payments.supabaseRestWrite('/rest/v1/transactions', 'POST', {
      user_id: user.id,
      chapter_id: `subscription_${niveau}`,
      chapter_title: `Abonnement mensuel ${niveau === 'brevet' ? 'Brevet' : 'BAC'}`,
      amount: check.amount,
      provider: 'FedaPay (MoMo)',
      phone: cleanText(body.phone || '', 20)
    });
  } else {
    write = await payments.supabaseRestWrite('/rest/v1/unlocked_chapters', 'POST', {
      user_id: user.id,
      chapter_id: chapterId,
      title: cleanText(body.title, 180),
      niveau,
      subject: cleanText(body.subject, 80),
      price: check.amount,
      provider: 'FedaPay (MoMo)'
    });
  }

  if (!write.ok) {
    console.error('Écriture déblocage impossible:', write.error);
    sendJson(res, 500, { success: false, error: 'Enregistrement du déblocage impossible' });
    return;
  }

  await payments.saveReceipt({
    transaction_id: transactionId,
    user_id: user.id,
    kind,
    niveau,
    chapter_id: chapterId,
    amount: check.amount,
    reference: check.reference || transactionId
  });

  sendJson(res, 200, {
    success: true,
    unlocked: kind === 'chapter' ? chapterId : `subscription_${niveau}`,
    amount: check.amount,
    kind,
    niveau
  });
}

function getBearerToken(req) {
  const header = req.headers['authorization'] || req.headers['Authorization'] || '';
  const match = String(header).match(/Bearer\s+(.+)$/i);
  return match ? match[1].trim() : '';
}

// Le curriculum par pays vit dans contexts.js (BENIN_CURRICULUM -> CONTEXTS.BJ.curriculum).

// ── Curriculum topics ─────────────────────────────────────────────
// Priorité : Supabase → fallback hardcodé

/**
 * Récupère les topics depuis Supabase via la RPC get_curriculum_topics.
 * Gère le fallback sans série et les variantes de noms pour garantir
 * la connexion avec la base de données.
 * Retourne un tableau de strings, ou null si indisponible.
 */
async function getCurriculumTopicsFromSupabase(subjectName, niveau, serie, ctx) {
  const context = ctx || CONTEXTS[DEFAULT_CODE];
  // 1. Essai avec série exacte et nom exact
  let rows = await supabaseFetch('/rest/v1/rpc/get_curriculum_topics', {
    p_niveau:  niveau,
    p_serie:   serie  || null,
    p_subject: subjectName,
    p_pays:    context.code
  });

  // 2. Si aucun résultat et qu'une série était spécifiée, relancer sans filtre de série (p_serie = null)
  if ((!Array.isArray(rows) || rows.length === 0) && serie) {
    rows = await supabaseFetch('/rest/v1/rpc/get_curriculum_topics', {
      p_niveau:  niveau,
      p_serie:   null,
      p_subject: subjectName,
      p_pays:    context.code
    });
  }

  // 3. Si toujours aucun résultat, tenter avec des variantes de nom usuelles
  if (!Array.isArray(rows) || rows.length === 0) {
    const candidates = [];
    if (subjectName.includes('&')) candidates.push(subjectName.split('&')[0].trim());
    if (subjectName.includes('/')) candidates.push(subjectName.replace(/\s*\/\s*/g, '/'));
    if (subjectName === 'Français') candidates.push('Français & Littérature');
    if (subjectName === 'Lecture/Dictée') candidates.push('Lecture / Dictée');

    for (const altSubj of candidates) {
      rows = await supabaseFetch('/rest/v1/rpc/get_curriculum_topics', {
        p_niveau:  niveau,
        p_serie:   null,
        p_subject: altSubj,
        p_pays:    context.code
      });
      if (Array.isArray(rows) && rows.length > 0) break;
    }
  }

  if (!Array.isArray(rows) || rows.length === 0) return null;

  // Trouver la ligne avec des topics valides
  for (const row of rows) {
    if (Array.isArray(row.topics) && row.topics.length > 0) {
      console.log(`[Database Connected] ${row.topics.length} topics récupérés depuis Supabase pour ${subjectName} (${niveau})`);
      return row.topics;
    }
  }

  return null;
}

/**
 * Fallback synchrone sur le curriculum du contexte (par défaut : Bénin).
 */
function getCurriculumTopicsLocal(subjectName, niveau, serie, ctx) {
  const curriculum = (ctx && ctx.curriculum) || CONTEXTS[DEFAULT_CODE].curriculum;
  const level = curriculum[niveau];
  if (!level) return [];
  const subject = level[subjectName];
  if (!subject) return [];
  if (Array.isArray(subject)) return subject;
  return subject[serie] || subject['C'] || subject['D'] || Object.values(subject)[0] || [];
}

/**
 * Point d'entrée : Supabase en priorité, fallback local.
 */
/**
 * Séquences du programme saisies par l'admin (table curriculum_sequences).
 * C'est la source de référence : elle prime sur le programme seedé et sur le fallback.
 * Retourne un tableau de strings, ou null si aucune séquence n'est enregistrée.
 */
async function getAdminSequences(subjectName, niveau, serie) {
  const rows = await supabaseFetch('/rest/v1/rpc/get_curriculum_sequences', {
    p_niveau: niveau,
    p_serie: serie || null,
    p_subject: subjectName
  });

  if (!Array.isArray(rows) || rows.length === 0) return null;
  for (const row of rows) {
    if (Array.isArray(row.sequences) && row.sequences.length > 0) {
      console.log(`[Programme admin] ${row.sequences.length} séquences utilisées pour ${subjectName} (${niveau}${row.serie_code ? ' ' + row.serie_code : ''}, source ${row.source})`);
      return row.sequences;
    }
  }
  return null;
}

async function getAdminProgram(subjectName, niveau, serie, ctx) {
  const context = ctx || CONTEXTS[DEFAULT_CODE];
  const rows = await supabaseFetch('/rest/v1/rpc/get_curriculum_sequences', {
    p_niveau: niveau,
    p_serie: serie || null,
    p_subject: subjectName,
    p_pays: context.code
  });

  if (!Array.isArray(rows) || rows.length === 0) return null;
  for (const row of rows) {
    // Structure détaillée (SA + chapitres) si l'admin l'a enregistrée
    if (Array.isArray(row.parts) && row.parts.length > 0) {
      const parts = row.parts
        .map(part => ({
          sa: cleanText(part.sa, 20) || `SA ${part.num || 1}`,
          num: Number(part.num) || 1,
          titre: cleanText(part.titre, 180),
          chapitres: Array.isArray(part.chapitres)
            ? part.chapitres.map(c => cleanText(c, 180)).filter(Boolean)
            : []
        }))
        .filter(part => part.titre || part.chapitres.length);
      if (parts.length) {
        console.log(`[Programme admin] ${parts.length} SA utilisées pour ${subjectName} (${niveau}${row.serie_code ? ' ' + row.serie_code : ''})`);
        return { parts, sequences: row.sequences || [] };
      }
    }
    if (Array.isArray(row.sequences) && row.sequences.length > 0) {
      console.log(`[Programme admin] ${row.sequences.length} séquences utilisées pour ${subjectName} (${niveau}${row.serie_code ? ' ' + row.serie_code : ''}, source ${row.source})`);
      return { parts: parseProgramParts(row.sequences.join('\n')), sequences: row.sequences };
    }
  }
  return null;
}

async function getCurriculumTopics(subjectName, niveau, serie, ctx) {
  const admin = await getAdminProgram(subjectName, niveau, serie, ctx);
  if (admin) {
    const chapters = programPartsToChapters(admin.parts);
    if (chapters.length) return chapters.map(c => c.titre);
  }
  const remote = await getCurriculumTopicsFromSupabase(subjectName, niveau, serie, ctx);
  if (remote) return remote;
  return getCurriculumTopicsLocal(subjectName, niveau, serie, ctx);
}

async function buildCoursePrompt({ subjectName, niveau, serie, sequences, parts, ctx }) {
  const context = ctx || CONTEXTS[DEFAULT_CODE];
  const textes = context.textes;
  const niveauLabel = niveau === 'bac' ? `Terminale BAC série ${serie}` : 'classe de 3ème Brevet';

  // 1. Structure imposée par l'admin (SA + chapitres)
  const adminParts = Array.isArray(parts) && parts.length
    ? parts
    : (Array.isArray(sequences) && sequences.length ? parseProgramParts(sequences.join('\n')) : null);

  if (adminParts && adminParts.length) {
    const chapters = programPartsToChapters(adminParts);
    const structure = adminParts
      .map(part => {
        const titres = (part.chapitres || []).map(t => `   - ${t}`).join('\n');
        return ` ${part.sa || `SA ${part.num}`}${part.titre ? ` : ${part.titre}` : ''}${titres ? `\n${titres}` : ''}`;
      })
      .join('\n');
    const priceRef = context.prix.chapitre[niveau] || 150;
    return buildCoursePromptTemplate({
      subjectName, niveauLabel, priceRef, ctx: context,
      introBlock: `\nStructure IMPOSÉE du programme (respecte l'ordre, les SA et les titres de chapitres) :\n${structure}\n\nGénère exactement ${chapters.length} chapitres, un par chapitre listé ci-dessus, dans cet ordre.`,
      chapCount: chapters.length,
      extraConstraints: [
        'Le titre de chaque chapitre est exactement "<numéro SA> : <titre du chapitre>" (exemple : "SA 2 : Les vecteurs").',
        'Le contenu de chaque chapitre porte uniquement sur la partie du programme à laquelle il est rattaché.'
      ]
    });  }

  // 2. Programme officiel existant (séquences simples)
  const topics = await getCurriculumTopics(subjectName, niveau, serie, context);
  const chapCount = topics.length > 0 ? topics.length : 5;
  const topicsBlock = topics.length > 0
    ? `\nLe programme officiel ${textes.programmeOfficiel} pour cette matière couvre ces chapitres principaux :\n${topics.map((t, i) => `${i + 1}. ${t}`).join('\n')}\nGénère exactement ${chapCount} chapitres en suivant strictement cet ordre et ce programme.`
    : `\nGénère exactement ${chapCount} chapitres couvrant les notions essentielles du programme.`;
  const priceRef = context.prix.chapitre[niveau] || 150;

  return buildCoursePromptTemplate({
    subjectName, niveauLabel, priceRef, ctx: context, introBlock: topicsBlock, chapCount
  });
}

/**
 * Gabarit commun de génération d'un cours (structure imposée ou programme simple).
 */
function buildCoursePromptTemplate({ subjectName, niveauLabel, priceRef, introBlock, chapCount, extraConstraints = [], ctx }) {
  const context = ctx || CONTEXTS[DEFAULT_CODE];
  const textes = context.textes;
  return `Tu es un professeur expert du ${textes.systemeEducatif} (${textes.programmeOfficiel}). Génère un contenu de révision complet pour ${subjectName}, niveau ${niveauLabel}.${introBlock}

Réponds uniquement en JSON valide, sans markdown, sous cette forme exacte :
{
  "chapitres": [
    {
      "title": "SA 1 : Titre exact du chapitre selon le programme",
      "price": ${priceRef},
      "cours": "Cours complet et explicite : définitions précises, toutes les notions clés, formules, démonstrations importantes, méthodes de résolution, exemples numériques ou littéraires concrets, pièges fréquents à l'examen ${textes.examens}.",
      "exemple": {
        "titre": "Exemple résolu — type ${textes.examens}",
        "enonce": "Énoncé réaliste tel qu'il apparaît aux examens ${context.nom}",
        "solution": "Solution détaillée pas-à-pas avec justifications"
      },
      "exercice": {
        "consigne": "QCM — Application directe du cours",
        "question": "Question précise sur une notion du chapitre",
        "type": "qcm",
        "options": ["a) Proposition incorrecte", "b) Proposition correcte", "c) Proposition incorrecte", "d) Proposition incorrecte"],
        "correctOption": "b",
        "explication": "Explication claire pourquoi cette réponse est correcte"
      }
    }
  ]
}

Contraintes impératives :
- Génère exactement ${chapCount} chapitres couvrant les notions les plus importantes du programme.
- Chaque cours doit être suffisamment complet pour qu'un élève puisse réviser sans autre document.
- Inclure toutes les définitions, formules, propriétés et méthodes nécessaires à l'examen.
- Les 3 premiers chapitres sont gratuits (mais leur contenu doit être aussi complet que les autres).
- Les prix sont ${priceRef} FCFA par chapitre payant (chapitres 4 et suivants).
- Les exercices doivent être variés et différents d'un chapitre à l'autre.
- Ne mets jamais "Correct", "Bonne réponse" ou tout indice dans les options visibles.
- La bonne réponse est indiquée uniquement dans correctOption.${extraConstraints.length ? '\n' + extraConstraints.map(c => '\n- ' + c).join('') : ''}
- Utilise uniquement le français, avec le ${textes.vocabulaire}.`;
}

/**
 * Contexte (pays) d'une requête.
 * Ordre : paramètre explicite (corps / query / en-tête) → sous-domaine →
 * préfixe d'URL (/senegal/cours/...) → contexte par défaut (Bénin).
 */
function contextFromRequest(req, body) {
  let explicit = '';
  if (body && (body.pays || body.country)) explicit = body.pays || body.country;
  if (!explicit && req.headers['x-revizy-pays']) explicit = req.headers['x-revizy-pays'];
  let pathname = req.url || '/';
  const q = pathname.indexOf('?');
  if (q >= 0) pathname = pathname.slice(0, q);
  if (!explicit) {
    const m = pathname.match(/[?&]pays=([A-Za-z]{2})/);
    if (m) explicit = m[1];
  }  return resolveContext({ code: explicit, host: req.headers.host, path: pathname });
}

/**
 * Recherche automatique du programme officiel d'une matière.
 * L'admin clique sur "Rechercher" : l'IA propose les parties clés / séquences,
 * que l'admin peut corriger avant de les enregistrer.
 */
function localProgramSequences(subjectName, niveau, serie, ctx) {
  const topics = getCurriculumTopicsLocal(subjectName, niveau, serie || 'C', ctx);
  return (Array.isArray(topics) ? topics : [])
    .map((item, i) => cleanText(item, 180))
    .filter(Boolean)
    .map((title, i) => (/^partie\s*\d+/i.test(title) || /^sa\s*\d+/i.test(title) ? title : `Partie ${i + 1} : ${title}`));
}

async function handleProgramOutline(req, res) {
  let body;
  try {
    body = await readJsonBody(req);
  } catch (error) {
    sendJson(res, 400, { success: false, error: 'JSON invalide' });
    return;
  }

  const subjectName = cleanText(body.subjectName, 80);
  const niveau = cleanText(body.niveau, 10).toLowerCase();
  const serie = cleanText(body.serie || '', 2).toUpperCase();
  const ctx = contextFromRequest(req, body);
  // Par défaut : réponse locale instantanée. useAi=true pour l'enrichissement Gemini.
  const useAi = body.useAi === true;

  if (!subjectName || !['bac', 'brevet'].includes(niveau)) {
    sendJson(res, 400, { success: false, error: 'Paramètres invalides' });
    return;
  }

  const niveauLabel = niveau === 'bac'
    ? `classe de Terminale de ${ctx.nom}${serie ? `, série ${serie}` : ''}`
    : `classe de 3ème (${ctx.libelleExamen.brevet}) de ${ctx.nom}`;

  const respondLocal = (reason) => {
    const local = localProgramSequences(subjectName, niveau, serie, ctx);
    if (!local.length) {
      sendJson(res, 502, {
        success: false,
        code: 'NO_PROGRAM',
        error: reason || 'Aucun programme trouvé pour cette matière'
      });
      return;
    }
    const parts = parseProgramParts(local.join('\n'));
    sendJson(res, 200, {
      success: true,
      sequences: local,
      parts,
      structureText: partsToText(parts),
      source: 'local',
      note: reason || 'Programme local (référentiel Revizy) — corrige si besoin puis enregistre.'
    });
  };

  // Chemin rapide (défaut) : pas d'appel Gemini
  if (!useAi) {
    respondLocal();
    return;
  }

  if (!GEMINI_API_KEYS.length || isAiKeyBlocked()) {
    respondLocal('IA indisponible — programme local proposé.');
    return;
  }

  try {
    const prompt = `Tu es l'inspecteur pédagogique du ${ctx.textes.systemeEducatif} (${ctx.textes.programmeOfficiel}).
Donne la structure du programme officiel de ${subjectName} en ${niveauLabel} : les situations d'apprentissage (SA) et, pour chacune, les chapitres du programme.

Réponds uniquement en JSON valide, sans markdown, sous cette forme exacte :
{"parts": [
  {"sa": "SA 1", "titre": "Titre de la partie du programme", "chapitres": ["Premier chapitre", "Deuxième chapitre"]},
  {"sa": "SA 2", "titre": "Autre partie", "chapitres": ["Chapitre unique"]}
]}

Règles :
- 4 à 10 SA, dans l'ordre du programme officiel.
- 1 à 4 chapitres par SA, dans l'ordre officiel.
- Titres courts et précis, conformes au ${ctx.textes.vocabulaire}.
- Les chapitres doivent vraiment appartenir à leur SA.
- Pas de doublon, pas de numéro de page, pas de commentaire.`;

    const result = await callGemini({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 8192, responseMimeType: 'application/json' }
    }, 60000);

    if (!result.ok) {
      console.error('Gemini program-outline error', result.status, JSON.stringify(result.data).slice(0, 400));
      respondLocal('IA saturée — programme local proposé.');
      return;
    }

    const text = result.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    let parts = [];
    try {
      parts = extractJson(text).parts;
    } catch (parseErr) {
      console.warn('program-outline JSON parse', parseErr.message);
    }
    const cleaned = (Array.isArray(parts) ? parts : [])
      .map((part, index) => ({
        sa: cleanText(part.sa, 20) || `SA ${index + 1}`,
        num: index + 1,
        titre: cleanText(part.titre, 180),
        chapitres: (Array.isArray(part.chapitres) ? part.chapitres : [])
          .map(c => cleanText(c, 180)).filter(Boolean)
      }))
      .filter(part => part.titre || part.chapitres.length);

    if (!cleaned.length) {
      respondLocal('Réponse IA vide — programme local proposé.');
      return;
    }

    const sequences = cleaned.flatMap(part => part.chapitres.length ? part.chapitres : [part.titre]);
    sendJson(res, 200, {
      success: true,
      sequences,
      parts: cleaned,
      structureText: partsToText(cleaned),
      source: 'ia'
    });
  } catch (error) {
    console.error('Erreur recherche programme:', error.message);
    respondLocal('Erreur IA — programme local proposé.');
  }
}

/**
 * Rend une structure de programme au format texte exploitable dans le textarea admin.
 *   SA 1 : Titre
 *     1. Chapitre
 */
function partsToText(parts) {
  return (Array.isArray(parts) ? parts : [])
    .map(part => {
      const sa = part.sa || `SA ${part.num || 1}`;
      const titre = part.titre ? `: ${part.titre}` : '';
      const chapters = (part.chapitres || [])
        .map((c, i) => `  ${i + 1}. ${c}`)
        .join('\n');
      return `${sa}${titre}${chapters ? '\n' + chapters : ''}`;
    })
    .join('\n');
}

/**
 * Banque d'exercices personnalisée pour une (classe, série, matière).
 * Réutilise une banque déjà générée, sinon la crée avec l'IA à partir du
 * programme officiel (séquences de l'admin en priorité) et la mémorise.
 */
async function handleQuizBank(req, res) {
  let body;
  try {
    body = await readJsonBody(req);
  } catch (error) {
    sendJson(res, 400, { success: false, error: 'JSON invalide' });
    return;
  }

  const subjectName = cleanText(body.subjectName, 80);
  const niveau = cleanText(body.niveau, 10).toLowerCase();
  const classe = cleanText(body.classe || '', 20);
  const serie = cleanText(body.serie || '', 2).toUpperCase();
  const force = body.force === true;
  const wanted = Math.min(Math.max(parseInt(body.count, 10) || 30, 5), 60);
  const ctx = contextFromRequest(req, body);

  if (!subjectName || !['bac', 'brevet'].includes(niveau)) {
    sendJson(res, 400, { success: false, error: 'Paramètres invalides' });
    return;
  }

  // 1. Banque déjà disponible en base (partagée entre tous les élèves)
  if (!force) {
    const rows = await supabaseFetch('/rest/v1/rpc/get_quiz_bank', {
      p_niveau: niveau,
      p_classe: classe || null,
      p_serie: serie || null,
      p_subject: subjectName,
      p_pays: ctx.code
    });
    const row = Array.isArray(rows) && rows.length ? rows[0] : null;
    const questions = row && Array.isArray(row.questions) ? row.questions : [];
    // On réutilise la banque seulement si elle couvre la quantité demandée
    if (questions.length >= wanted && questions.length > 0) {
      sendJson(res, 200, { success: true, questions, cached: true, classe, serie, niveau });
      return;
    }
  }

  if (!GEMINI_API_KEYS.length) {
    sendJson(res, 503, { success: false, code: 'AI_NOT_CONFIGURED', error: 'GEMINI_API_KEY non configurée' });
    return;
  }
  if (isAiKeyBlocked()) {
    sendJson(res, 503, { success: false, code: 'AI_KEY_INVALID', error: 'Service IA indisponible (clé API refusée par Google)' });
    return;
  }

  try {
    const classeLabel = classe ? (niveau === 'brevet' ? `${classe} (niveau ${ctx.libelleExamen.brevet})` : `${classe}, série ${serie || 'C'}`) : (niveau === 'brevet' ? `${ctx.classes.brevet} (${ctx.libelleExamen.brevet})` : `${ctx.classes.bac}, série ${serie || 'C'}`);
    // Le programme enregistré ne couvre que les classes d'examen (3ème, Terminale) :
    // pour 2nde/1ère on laisse l'IA s'appuyer sur le programme de la classe.
    const isExamClass = !classe || classe === ctx.classes.brevet || classe === ctx.classes.bac;
    const sequences = isExamClass ? await getCurriculumTopics(subjectName, niveau, serie, ctx) : [];
    const programmeBlock = sequences.length
      ? `\nProgramme officiel à respecter strictement (parties clés) :\n${sequences.map((s, i) => `${i + 1}. ${s}`).join('\n')}\n`
      : '';

    const prompt = buildQuizBankPrompt(subjectName, classeLabel, programmeBlock, wanted, {}, ctx);

    const result = await callGemini({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.4, maxOutputTokens: 32768, responseMimeType: 'application/json' }
    }, GEMINI_TIMEOUT_COURSE_MS);

    if (!result.ok) {
      console.error('Gemini quiz-bank error', result.status, JSON.stringify(result.data).slice(0, 400));
      sendJson(res, result.invalidKey ? 503 : 502, {
        success: false,
        code: result.invalidKey ? 'AI_KEY_INVALID' : 'AI_BUSY',
        error: result.invalidKey
          ? 'Service IA indisponible (clé API refusée par Google)'
          : 'Préparation des exercices impossible pour le moment'
      });
      return;
    }

    const text = result.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const parsed = extractJson(text);
    let questions = normalizeQuestions(parsed.questions);

    if (!questions.length) {
      sendJson(res, 502, { success: false, error: 'Aucune question exploitable n’a été renvoyée' });
      return;
    }

    // L'IA peut livrer moins que la quantité demandée (limite de tokens).
    // On ne relance une passe de complément que si l'écart est important :
    // le quota gratuit est de 20 requêtes par JOUR et par modèle, chaque
    // appel supplémentaire compte.
    const seuilComplement = Math.ceil(wanted * 0.8);
    if (questions.length < seuilComplement) {
      const missing = wanted - questions.length;
      try {
        const dejaVues = new Set(
          questions.map(q => (q.question || '').toLowerCase().trim()).filter(Boolean)
        );
        const complement = buildQuizBankPrompt(subjectName, classeLabel, programmeBlock, missing, {
          supplement: true,
          dejaVues: Array.from(dejaVues).slice(0, 40)
        }, ctx);
        const res2 = await callGemini({
          contents: [{ parts: [{ text: complement }] }],
          generationConfig: { temperature: 0.6, maxOutputTokens: 32768, responseMimeType: 'application/json' }
        }, GEMINI_TIMEOUT_COURSE_MS, 90000);

        if (res2.ok) {
          const parsed2 = extractJson(res2.data?.candidates?.[0]?.content?.parts?.[0]?.text || '');
          const extra = normalizeQuestions(parsed2.questions)
            .filter(q => q.question && !dejaVues.has(q.question.toLowerCase().trim()));
          if (extra.length) {
            questions = questions.concat(extra).slice(0, wanted);
          }
        }
      } catch (e) {
        console.warn('Complément banque d’exercices:', e.message);
      }
    }

    await supabaseFetch('/rest/v1/rpc/upsert_quiz_bank', {
      p_niveau: niveau,
      p_classe: classe || null,
      p_serie: serie || null,
      p_subject: subjectName,
      p_questions: questions,
      p_pays: ctx.code
    });

    sendJson(res, 200, { success: true, questions, cached: false, demande: wanted, classe, serie, niveau });
  } catch (error) {
    console.error('Erreur banque d’exercices:', error.message);
    sendJson(res, 502, { success: false, error: 'Préparation des exercices impossible' });
  }
}

/**
 * Prompt de génération d'une banque d'exercices.
 * @param {string} subjectName
 * @param {string} classeLabel
 * @param {string} programmeBlock  programme officiel à respecter
 * @param {number} count           nombre de questions demandé
 * @param {object} options         { supplement: true, dejaVues: string[] }
 */
function buildQuizBankPrompt(subjectName, classeLabel, programmeBlock, count, options = {}, ctx) {
  const context = ctx || CONTEXTS[DEFAULT_CODE];
  const textes = context.textes;
  const supplement = options.supplement
    ? `\nIMPORTANT : ce sont des questions ADDITIONNELLES. N'écris AUCUNE des questions déjà listées ci-dessous.\nQuestions déjà proposées (à ne pas répéter) :\n${(options.dejaVues || []).map((q, i) => `${i + 1}. ${q}`).join('\n')}\n`
    : '';

  return `Tu es professeur d'examens du ${textes.systemeEducatif} (${textes.programmeOfficiel}).
Prépare une banque de ${count} questions d'entraînement pour la matière ${subjectName}, niveau : ${classeLabel}.${programmeBlock}
Les questions doivent porter UNIQUEMENT sur le programme de cette classe, avec le niveau de difficulté réel des ${textes.examens}.${supplement}

Réponds uniquement en JSON valide, sans markdown :
{"questions": [
  {
    "chapitre": "Partie du programme concernée",
    "question": "Énoncé de la question",
    "type": "qcm" ou "vf",
    "options": ["a) ...", "b) ...", "c) ...", "d) ..."],
    "correctOption": "a",
    "explication": "Pourquoi cette réponse est correcte"
  }
]}

Contraintes :
- Exactement ${count} questions, sans doublon.
- Vrai/Faux : "options" contient uniquement ["Vrai", "Faux"].
- Jamais d'indice dans les options (pas de "Correct" ni "Bonne réponse").
- Chaque question est liée à une partie du programme (champ "chapitre").`;
}

function normalizeQuestions(list) {
  return (Array.isArray(list) ? list : [])
    .map(item => {
      const type = item && item.type === 'vf' ? 'vf' : 'qcm';
      let options = Array.isArray(item.options) ? item.options.map(o => cleanText(o, 200)).filter(Boolean) : [];
      if (type === 'vf') options = ['Vrai', 'Faux'];
      else options = options.map(o => cleanQuizOption(o.replace(/^[a-dA-D]\s*[).:-]\s*/, ''))).filter(Boolean);
      const raw = cleanText(item.correctOption || '', 10).toLowerCase();
      let correctIndex;
      if (type === 'vf') correctIndex = /^(f|faux|b|1|false)/.test(raw) ? 1 : 0;
      else correctIndex = /^[a-d]/.test(raw) ? raw.charCodeAt(0) - 97 : parseInt(raw, 10);
      return {
        chapitre: cleanText(item.chapitre || '', 120),
        question: cleanText(item.question, 500),
        type,
        options,
        correctIndex,
        explication: cleanText(item.explication || '', 600)
      };
    })
    .filter(q => q.question && q.options.length >= 2
      && Number.isInteger(q.correctIndex) && q.correctIndex >= 0 && q.correctIndex < q.options.length);
}

async function handleGenerateCourse(req, res) {
  let body;
  try {
    body = await readJsonBody(req);
  } catch (error) {
    sendJson(res, 400, { success: false, error: 'JSON invalide' });
    return;
  }

  const subjectName = cleanText(body.subjectName, 80);
  const niveau = cleanText(body.niveau, 10).toLowerCase();
  const serie = cleanText(body.serie || 'C', 2).toUpperCase();
  // Séquences imposées par l'admin pour cette matière (prioritaires sur le programme stocké)
  const requestedSequences = Array.isArray(body.sequences)
    ? body.sequences.map(item => cleanText(item, 180)).filter(Boolean).slice(0, 40)
    : [];
  // Structure détaillée (SA + chapitres) imposée par l'admin
  const requestedParts = Array.isArray(body.parts)
    ? body.parts.map(part => ({
        sa: cleanText(part.sa, 20),
        num: Number(part.num) || 0,
        titre: cleanText(part.titre, 180),
        chapitres: Array.isArray(part.chapitres)
          ? part.chapitres.map(c => cleanText(c, 180)).filter(Boolean).slice(0, 40)
          : []
      })).filter(part => part.titre || part.chapitres.length)
    : [];

  if (!subjectName || !['bac', 'brevet'].includes(niveau)) {
    sendJson(res, 400, { success: false, error: 'Paramètres invalides' });
    return;
  }

  const ctx = contextFromRequest(req, body);
  const cacheKey = `${ctx.code}:${niveau}:${serie}:${subjectName}:${requestedSequences.join('|')}:${JSON.stringify(requestedParts)}`.toLowerCase();
  if (courseCache.has(cacheKey)) {
    sendJson(res, 200, { success: true, chapitres: courseCache.get(cacheKey), cached: true });
    return;
  }

  if (!GEMINI_API_KEYS.length) {
    sendJson(res, 503, { success: false, code: 'AI_NOT_CONFIGURED', error: 'GEMINI_API_KEY non configurée' });
    return;
  }
  if (isAiKeyBlocked()) {
    sendJson(res, 503, { success: false, code: 'AI_KEY_INVALID', error: 'Service IA indisponible (clé API refusée par Google)' });
    return;
  }

  try {
    const coursePrompt = await buildCoursePrompt({
    subjectName, niveau, serie, sequences: requestedSequences, parts: requestedParts, ctx
  });

    let chapitres = [];
    let lastError = null;

    // 2 tentatives : la 2e avec une température plus basse pour limiter les JSON malformés
    for (let attempt = 0; attempt < 2 && !chapitres.length; attempt++) {
      const result = await callGemini({
        contents: [{ parts: [{ text: coursePrompt }] }],
        generationConfig: {
          temperature: attempt === 0 ? 0.35 : 0.1,
          maxOutputTokens: 16384,
          responseMimeType: 'application/json'
        }
      }, GEMINI_TIMEOUT_COURSE_MS);

      if (!result.ok) {
        lastError = `Gemini ${result.status}: ${JSON.stringify(result.data).slice(0, 300)}`;
        console.error('Gemini generate-course error', lastError);
        if (result.invalidKey) {
          sendJson(res, 503, { success: false, code: 'AI_KEY_INVALID', error: 'Service IA indisponible (clé API refusée par Google)' });
          return;
        }
        break; // callGemini a déjà réessayé, inutile de recommencer ici
      }

      const geminiPayload = result.data;
      const text = geminiPayload.candidates && geminiPayload.candidates[0]
        && geminiPayload.candidates[0].content
        && geminiPayload.candidates[0].content.parts
        && geminiPayload.candidates[0].content.parts[0]
        && geminiPayload.candidates[0].content.parts[0].text;

      try {
        const parsed = extractJson(text);
        chapitres = normalizeChapters(parsed.chapitres, niveau, subjectName);
      } catch (parseError) {
        lastError = `JSON inexploitable: ${parseError.message}`;
        console.error('Gemini generate-course', lastError);
      }
    }

    if (!chapitres.length) {
      sendJson(res, 502, { success: false, error: 'Réponse Gemini vide ou invalide', detail: lastError });
      return;
    }

    courseCache.set(cacheKey, chapitres);
    sendJson(res, 200, { success: true, chapitres, cached: false });
  } catch (error) {
    console.error('Erreur Gemini:', error.message);
    sendJson(res, 502, { success: false, error: 'Génération impossible' });
  }
}

async function handleChat(req, res) {
  let body;
  try {
    body = await readJsonBody(req);
  } catch (error) {
    sendJson(res, 400, { success: false, error: 'JSON invalide' });
    return;
  }

  const ctx = contextFromRequest(req, body);
  const prompt = cleanText(body.prompt, 1000);
  const niveau = cleanText(body.niveau || `Terminale BAC ${ctx.nom}`, 100);

  if (!prompt) {
    sendJson(res, 400, { success: false, error: 'Prompt requis' });
    return;
  }

  if (!GEMINI_API_KEYS.length) {
    sendJson(res, 503, { success: false, code: 'AI_NOT_CONFIGURED', error: 'GEMINI_API_KEY non configurée' });
    return;
  }
  if (isAiKeyBlocked()) {
    sendJson(res, 503, { success: false, code: 'AI_KEY_INVALID', error: 'Service IA indisponible (clé API refusée par Google)' });
    return;
  }

  try {
    const systemPrompt = `Tu es l'assistant et tuteur pédagogique Revizy spécialisé dans le ${ctx.textes.systemeEducatif} (niveau ${niveau}).
Aide l'élève de manière concise, claire, bienveillante et pédagogique avec des explications méthodiques, des formules si nécessaire et des exemples concrets adaptés au ${ctx.textes.programmeOfficiel}. Réponds en français.`;

    const result = await callGemini({
      contents: [
        { role: 'user', parts: [{ text: `${systemPrompt}\n\nQuestion de l'élève : ${prompt}` }] }
      ],
      generationConfig: {
        temperature: 0.5,
        maxOutputTokens: 500
      }
    });

    const data = result.data;
    const replyText = data && data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (result.ok && replyText) {
      sendJson(res, 200, { success: true, reply: replyText });
    } else if (result.invalidKey) {
      sendJson(res, 503, { success: false, code: 'AI_KEY_INVALID', error: 'Service IA indisponible (clé API refusée par Google)' });
    } else {
      console.error('Gemini chat error', result.status, JSON.stringify(data).slice(0, 800));
      const geminiCode = data && data.error ? data.error.code : 'reseau';
      sendJson(res, 502, { success: false, code: 'AI_BUSY', error: `Chatbot indisponible (Gemini ${geminiCode})` });
    }
  } catch (error) {
    console.error('Erreur Chatbot Gemini:', error.message);
    sendJson(res, 502, { success: false, error: 'Chatbot indisponible' });
  }
}

function serveStatic(req, res) {
  const rawPath = (req.url || '/').split('?')[0];
  let filePath = safeJoin(ROOT, rawPath === '/' ? '/index.html' : rawPath);
  if (!filePath) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      // Un fichier attendu (avec extension) mais absent renvoie un vrai 404.
      // Sinon on retombe sur la SPA (routage côté client).
      // Indispensable : sans cela, /robots.txt ou /sitemap.xml renverraient
      // le HTML de l'application en faux 200 (mauvais pour le référencement).
      if (path.extname(rawPath)) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('404 — fichier introuvable');
        return;
      }
      filePath = path.join(ROOT, 'index.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const type = MIME[ext] || 'application/octet-stream';

    fs.readFile(filePath, (readErr, data) => {
      if (readErr) {
        res.writeHead(404);
        res.end('Not found');
        return;
      }
      res.writeHead(200, { 'Content-Type': type });
      res.end(data);
    });
  });
}

/**
 * Extrait le délai de réinitialisation du quota renvoyé par Google
 * ("Please retry in 9h15m32s") et le rend en secondes.
 */
function parseQuotaRetrySeconds(text) {
  const match = String(text || '').match(/Please retry in ((?:\d+(?:\.\d+)?h)?(?:\d+(?:\.\d+)?m)?(?:\d+(?:\.\d+)?s)?)/i);
  if (!match || !match[1]) return null;
  let seconds = 0;
  const h = match[1].match(/(\d+(?:\.\d+)?)h/);
  const m = match[1].match(/(\d+(?:\.\d+)?)m/);
  const s = match[1].match(/(\d+(?:\.\d+)?)s/);
  if (h) seconds += parseFloat(h[1]) * 3600;
  if (m) seconds += parseFloat(m[1]) * 60;
  if (s) seconds += parseFloat(s[1]);
  return seconds ? Math.round(seconds) : null;
}

// Diagnostic IA : teste chaque modèle de la chaîne et indique lequel répond.
// Ne renvoie aucune information sur la clé API (ni valeur, ni suffixe).
// Cache du diagnostic IA : chaque test consomme une requête Google et le
// quota gratuit est de 20 requêtes par JOUR et par modèle. On met donc le
// résultat en cache 5 minutes (bypass avec ?force=1).
let aiHealthCache = null;
let aiHealthCacheAt = 0;
const AI_HEALTH_TTL_MS = 5 * 60 * 1000;

async function handleAiHealth(req, res) {
  const force = /\?force=1/.test(req.url || '');
  if (!force && aiHealthCache && Date.now() - aiHealthCacheAt < AI_HEALTH_TTL_MS) {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify(aiHealthCache));
    return;
  }

  if (!GEMINI_API_KEYS.length) {
    sendJson(res, 200, { success: false, configured: false, message: 'GEMINI_API_KEY absente des variables d’environnement' });
    return;
  }
  const apiKey = GEMINI_API_KEYS[0];

  const models = [GEMINI_MODEL, ...GEMINI_FALLBACK_MODELS].filter(Boolean);
  const tests = [];

  for (const model of models) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 25000);
    const start = Date.now();
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: 'ping' }] }], generationConfig: { maxOutputTokens: 32 } }),
          signal: controller.signal
        }
      );
      const data = await response.json();
      const errorMessage = String((data && data.error && data.error.message) || `HTTP ${response.status}`);
      tests.push({
        model,
        ok: response.ok,
        status: response.status,
        ms: Date.now() - start,
        code: data && data.error ? data.error.code : null,
        raison: response.ok ? null : errorMessage.slice(0, 200),
        // Délai de réinitialisation du quota (message 429 de Google)
        retryDansSecondes: response.ok ? null : parseQuotaRetrySeconds(errorMessage)
      });
    } catch (error) {
      tests.push({ model, ok: false, status: 0, ms: Date.now() - start, code: 'reseau', raison: error.message.slice(0, 120) });
    } finally {
      clearTimeout(timer);
    }
  }

  const working = tests.filter(t => t.ok);
  const rawKey = String(GEMINI_API_KEYS[0] || '').trim();
  const hasServiceKey = Boolean(process.env.SUPABASE_SERVICE_KEY);
  const hasFedapaySecret = Boolean(process.env.FEDAPAY_SECRET_KEY);

  // Diagnostic Supabase : le serveur peut-il réellement lire la base ?
  // Indispensable pour le sitemap (pages chapitre) et le prix des cours.
  const hasSupabaseUrl = Boolean(process.env.SUPABASE_URL);
  const hasAnonKey = Boolean(process.env.SUPABASE_ANON_KEY);
  let supabaseLecture = 'configuration absente';
  if (hasSupabaseUrl && (hasAnonKey || hasServiceKey)) {
    const rows = await payments.supabaseRestGet('/rest/v1/chapters?select=id&limit=1');
    supabaseLecture = Array.isArray(rows) ? 'ok' : 'echec';
  }

  const payload = {
    success: working.length > 0,
    configured: true,
    modelePrincipal: GEMINI_MODEL,
    modelesDisponibles: working.map(t => t.model),
    supabase: {
      urlConfiguree: hasSupabaseUrl,
      clePublique: hasAnonKey,
      cleService: hasServiceKey,
      lecture: supabaseLecture
    },
    quota: (() => {
      // Quota gratuit Google : 20 requêtes par JOUR et par modèle.
      const rateLimit = tests.find(t => t.status === 429);
      const retry = rateLimit ? rateLimit.retryDansSecondes : null;
      return {
        limiteParJourParModele: 20,
        epuise: Boolean(rateLimit),
        retryDansSecondes: retry,
        retryDans: retry ? `${Math.floor(retry / 3600)} h ${Math.floor((retry % 3600) / 60)} min` : null
      };
    })(),
    paiements: {
      cleServiceSupabase: hasServiceKey,
      cleFedaPay: hasFedapaySecret,
      debloquageSecurise: hasServiceKey && hasFedapaySecret
    },
    // Diagnostic de saisie : longueur et préfixe sans jamais renvoyer la clé.
    cle: {
      longueur: rawKey.length,
      debut: rawKey.slice(0, 6),
      contientEspace: /\s/.test(rawKey),
      commenceParNomVariable: /^GEMINI_API_KEY/i.test(rawKey),
      entreGuillemets: /^["']|["']$/.test(rawKey)
    },
    tests
  };

  aiHealthCache = payload;
  aiHealthCacheAt = Date.now();
  sendJson(res, 200, payload);
}

// Chapitres publiés d'un pays. Si la colonne « pays » n'existe pas encore
// (migration non appliquée), on retombe sur l'ensemble des chapitres.
async function fetchPublishedChapters(ctx) {
  const select = 'slug,title,sa_label,num,price,is_free,published,subjects(name,niveau_code,serie_code)';
  let rows = await payments.supabaseRestGet(
    `/rest/v1/chapters?select=${select}&published=eq.true&pays=eq.${ctx.code}&limit=500`
  );
  if (!Array.isArray(rows)) {
    rows = await payments.supabaseRestGet(
      `/rest/v1/chapters?select=${select}&published=eq.true&limit=500`
    );
  }
  return Array.isArray(rows) ? rows : [];
}

// Un chapitre précis (avec son contenu) pour un pays donné.
async function fetchChapterDetail(slug, ctx) {
  const select = 'slug,title,sa_label,num,price,is_free,cours,subjects(name,niveau_code,serie_code)';
  let rows = await payments.supabaseRestGet(
    `/rest/v1/chapters?slug=eq.${encodeURIComponent(slug)}&published=eq.true&pays=eq.${ctx.code}&select=${select}&limit=1`
  );
  if (!Array.isArray(rows)) {
    rows = await payments.supabaseRestGet(
      `/rest/v1/chapters?slug=eq.${encodeURIComponent(slug)}&published=eq.true&select=${select}&limit=1`
    );
  }
  return Array.isArray(rows) ? rows : [];
}

// Liste des pages indexables : pages landing (programme officiel de
// chaque pays actif) + chapitres publiés en base. Mise en cache 10 min
// pour ne pas interroger Supabase à chaque requête.
let seoPagesCache = null;
let seoPagesCacheAt = 0;
async function collectSeoPages(force = false) {
  const now = Date.now();
  if (!force && seoPagesCache && now - seoPagesCacheAt < 10 * 60 * 1000) {
    return seoPagesCache;
  }

  const pages = [];
  for (const ctx of Object.values(CONTEXTS)) {
    if (!ctx.actif) continue;
    const landing = seo.buildLandingPages(ctx.curriculum, ctx);
    const landingSlugs = new Set(landing.map(p => p.slug));
    const chapters = seo.buildChapterPages(await fetchPublishedChapters(ctx), ctx)
      .filter(c => !landingSlugs.has(c.slug));
    pages.push(...landing, ...chapters);
  }
  seoPagesCache = pages;
  seoPagesCacheAt = now;
  return seoPagesCache;
}

// Page d'accueil d'un pays : index des matières par niveau et série.
function renderCountryHome(ctx) {
  const textes = ctx.textes;
  const matieres = ctx.matieres || {};
  const seriesBac = Object.keys(matieres.bac || {});
  const listBac = seriesBac.map(s => {
    const items = (matieres.bac[s] || []).map(m =>
      `<li><a href="/${ctx.slug}/cours/${seo.slugify(`${m.name}-terminale-serie-${s}`)}.html">${escapeHtml(m.name)}</a></li>`
    ).join('');
    return `<h2>Terminale — série ${s}</h2><ul style="line-height:1.9;">${items}</ul>`;
  }).join('');
  const listBrevet = (matieres.brevet || []).map(m =>
    `<li><a href="/${ctx.slug}/cours/${seo.slugify(`${m.name}-3eme-brevet`)}.html">${escapeHtml(m.name)}</a></li>`
  ).join('');

  return `<!DOCTYPE html>
<html lang="${ctx.langue || 'fr'}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Cours ${textes.slogan} | ${SITE_NAME}</title>
<meta name="description" content="Tous les cours du programme officiel ${textes.slogan} : ${ctx.nom}. Fiches, QCM corrigés et tuteur IA 24h/24.">
<link rel="canonical" href="${SITE_URL}/${ctx.slug}/">
<meta name="robots" content="index, follow, max-image-preview:large">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Revizy">
<meta property="og:title" content="Cours ${escapeHtml(textes.slogan)} | Revizy">
<meta property="og:description" content="Tous les cours du programme officiel ${escapeHtml(textes.slogan)} : ${escapeHtml(ctx.nom)}.">
<meta property="og:url" content="${SITE_URL}/${ctx.slug}/">
<meta property="og:image" content="${SITE_URL}/icon-512.png">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/style.css">
</head>
<body>
<header style="max-width:900px;margin:0 auto;padding:20px 18px;display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;">
  <a href="/" style="font-weight:800;font-size:1.2rem;color:#0f172a;text-decoration:none;">📖 Revizy</a>
  <a href="/?pays=${ctx.code}" style="background:#2563eb;color:#fff;padding:10px 18px;border-radius:10px;text-decoration:none;font-weight:700;">Commencer gratuitement</a>
</header>
<main style="max-width:900px;margin:0 auto;padding:10px 18px 60px;">
  <p style="color:#64748b;font-size:0.9rem;margin:0 0 6px;"><a href="/" style="color:#2563eb;">Accueil</a> › ${escapeHtml(ctx.nom)}</p>
  <h1 style="font-size:2rem;color:#0f172a;margin:6px 0 12px;line-height:1.2;">Cours du programme officiel ${escapeHtml(ctx.nom)}</h1>
  <p style="font-size:1.05rem;color:#334155;max-width:760px;">
    ${escapeHtml(ctx.nomLong)} — ${escapeHtml(textes.slogan)}. Cours clairs, fiches synthétiques, QCM corrigés et tuteur IA 24h/24.
  </p>
  <h2 style="color:#0f172a;margin-top:34px;">${escapeHtml(ctx.libelleExamen.brevet)} — ${escapeHtml(ctx.classes.brevet)}</h2>
  <ul style="line-height:1.9;color:#334155;padding-left:22px;">${listBrevet}</ul>
  ${listBac}
</main>
<footer style="border-top:1px solid #e2e8f0;padding:22px 18px;text-align:center;color:#64748b;font-size:0.85rem;">
  © ${new Date().getFullYear()} Revizy — ${escapeHtml(textes.slogan)}
</footer>
</body>
</html>`;
}

// echappement HTML local (le module SEO expose le sien, mais on reste autonome)
function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

const SITE_URL = (process.env.APP_BASE_URL_FRONT || process.env.APP_BASE_URL || 'https://revisy.onrender.com').replace(/\/$/, '');
const SITE_NAME = 'Revizy';

const server = http.createServer(async (req, res) => {
  const requestPath = (req.url || '/').split('?')[0];

  if (req.method === 'POST' && requestPath === '/v1/ai/generate-course') {
    handleGenerateCourse(req, res);
    return;
  }

  if (req.method === 'POST' && requestPath === '/v1/ai/chat') {
    handleChat(req, res);
    return;
  }

  if (requestPath === '/v1/ai/health') {
    handleAiHealth(req, res);
    return;
  }

  if (req.method === 'POST' && requestPath === '/v1/ai/program-outline') {
    handleProgramOutline(req, res);
    return;
  }

  if (req.method === 'POST' && requestPath === '/v1/ai/quiz-bank') {
    handleQuizBank(req, res);
    return;
  }

  if (req.method === 'POST' && requestPath === '/v1/payments/create-transaction') {
    handleCreateTransaction(req, res);
    return;
  }

  if (req.method === 'POST' && requestPath === '/v1/payments/verify') {
    handleVerifyPayment(req, res);
    return;
  }

  // ── SEO : pages landing, sitemap, robots ──────────────────────────
  if (requestPath === '/robots.txt') {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=86400' });
    res.end(seo.buildRobots());
    return;
  }

  if (requestPath === '/sitemap.xml') {
    const pages = await collectSeoPages();
    res.writeHead(200, { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' });
    res.end(seo.buildSitemap(pages));
    return;
  }

  // Alias historique : /cours/<slug>.html -> /<pays>/cours/<slug>.html
  if (requestPath.startsWith('/cours/') && requestPath.endsWith('.html')) {
    const slug = requestPath.slice('/cours/'.length, -'.html'.length);
    const def = CONTEXTS[DEFAULT_CODE];
    res.writeHead(301, { 'Location': `/${def.slug}/cours/${slug}.html`, 'Cache-Control': 'public, max-age=3600' });
    res.end();
    return;
  }

  // Page d'accueil d'un pays : /<pays>/
  const countryHome = requestPath.match(/^\/([a-z][a-z0-9-]{1,15})\/?$/i);
  if (countryHome) {
    const ctx = getContextBySlug(countryHome[1]);
    if (ctx) {
      if (!ctx.actif) {
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><title>Bientôt disponible</title></head><body><h1>${escapeHtml(ctx.nom)} — bientôt disponible</h1><p><a href="/">Retour à l'accueil</a></p></body></html>`);
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=3600' });
      res.end(renderCountryHome(ctx));
      return;
    }
  }

  // Page d'un pays : /<pays>/cours/<slug>.html
  const countryCourse = requestPath.match(/^\/([a-z][a-z0-9-]{1,15})\/cours\/([^/]+)\.html$/i);
  if (countryCourse) {
    const ctx = getContextBySlug(countryCourse[1]);
    const slug = decodeURIComponent(countryCourse[2]);
    if (!ctx || !ctx.actif) {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end('<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><title>Page introuvable</title></head><body><h1>404</h1><p><a href="/">Retour à l\'accueil</a></p></body></html>');
      return;
    }
    const pages = await collectSeoPages();
    let page = pages.find(p => p.slug === slug && p.country === ctx.code);
    // Page chapitre : on recharge le cours complet (contenu réel = SEO)
    if (page && page.kind === 'chapter' && !page.content) {
      const row = await fetchChapterDetail(page.dbSlug, ctx);
      const full = seo.buildChapterPages(Array.isArray(row) ? row : [], ctx);
      if (full.length) page = full[0];
    }
    // Filet : slug de chapitre absent du cache
    if (!page) {
      const row = await fetchChapterDetail(slug, ctx);
      const chapterPages = seo.buildChapterPages(Array.isArray(row) ? row : [], ctx);
      if (chapterPages.length) page = chapterPages[0];
    }
    if (page) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=3600' });
      res.end(seo.renderLandingPage(page, pages));
      return;
    }
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end('<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><title>Page introuvable</title></head><body><h1>404</h1><p><a href="/">Retour à l\'accueil</a></p></body></html>');
    return;
  }

  if (req.method === 'POST' && requestPath === '/webhook/fedapay') {
    handleFedapayWebhook(req, res);
    return;
  }

  serveStatic(req, res);
});

server.listen(PORT, () => {
  console.log('Revizy listening on port ' + PORT);
});
