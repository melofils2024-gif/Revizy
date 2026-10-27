const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

loadLocalEnv();

const payments = require('./server_payments.js');
const seo = require('./server_seo.js');
// Banque d'épreuves (sujets gratuits / corrigés payants).
const epreuves = require('./server_epreuves.js');
// Pilotage du quota IA (non extensible) + cache durable sur disque.
const { BudgetQuota, CacheDisque } = require('./ai_quota.js');
// Contextes nationaux (Bénin aujourd'hui, extension régionale/internationale).
// Toute donnée propre à un pays est centralisée dans contexts.js.
const { CONTEXTS, DEFAULT_CODE, LANGUES, getContext, getContextBySlug, listContexts, resolveContext, traduire, traduireMatiere } = require('./contexts.js');

/**
 * Instruction de langue pour les prompts IA.
 * La langue découle du pays choisi par l'apprenant (jamais de l'IP) :
 * cours, exercices et réponses du tuteur sont produits dans cette langue.
 */
function instructionLangue(ctx) {
  const context = ctx || CONTEXTS[DEFAULT_CODE];
  const code = context.langue || 'fr';
  const langue = LANGUES[code] || LANGUES.fr;
  return `Langue de rédaction obligatoire : ${langue.nom} (${code}). ${langue.instructionIA} `
    + `Les titres et intitulés de chapitres restent ceux du programme officiel (${context.textes.programmeOfficiel}).`;
}

/**
 * Étiquettes des options de QCM dans la langue du pays.
 * Sans cela, le modèle risque de réintroduire du français dans un cours
 * en anglais, en arabe ou en chinois.
 */
const QCM_LABELS = {
  fr: { incorrect: 'Proposition incorrecte', correct: 'Proposition correcte', consigne: 'QCM — Application directe du cours', exemple: 'Exemple résolu', qcm: 'QCM de compréhension', vf: 'Vrai/Faux', enonce: 'Énoncé de la question', explication: 'Pourquoi cette réponse est correcte' },
  en: { incorrect: 'Incorrect statement', correct: 'Correct statement', consigne: 'QCM — Direct application of the lesson', exemple: 'Worked example', qcm: 'comprehension MCQ', vf: 'True/False', enonce: 'Statement of the question', explication: 'Why this answer is correct' },
  ar: { incorrect: 'عبارة خاطئة', correct: 'عبارة صحيحة', consigne: 'اختيار من متعدد — تطبيق مباشر للدرس', exemple: 'مثال محلول', qcm: 'اختيار من متعدد للفهم', vf: 'صواب/خطأ', enonce: 'نص السؤال', explication: 'سبب صحة هذه الإجابة' },
  pt: { incorrect: 'Afirmação incorreta', correct: 'Afirmação correta', consigne: 'QCM — Aplicação direta da aula', exemple: 'Exemplo resolvido', qcm: 'QCM de compreensão', vf: 'Verdadeiro/Falso', enonce: 'Enunciado da questão', explication: 'Por que esta resposta está correta' },
  es: { incorrect: 'Proposición incorrecta', correct: 'Proposición correcta', consigne: 'Cuestionario — Aplicación directa de la lección', exemple: 'Ejemplo resuelto', qcm: 'Cuestionario de comprensión', vf: 'Verdadero/Falso', enonce: 'Enunciado de la pregunta', explication: 'Por qué esta respuesta es correcta' },
  it: { incorrect: 'Proposizione errata', correct: 'Proposizione corretta', consigne: 'Quiz — Applicazione diretta della lezione', exemple: 'Esempio risolto', qcm: 'Quiz di comprensione', vf: 'Vero/Falso', enonce: 'Testo della domanda', explication: 'Perché questa risposta è corretta' },
  ru: { incorrect: 'Неверное утверждение', correct: 'Верное утверждение', consigne: 'Тест — Прямое применение урока', exemple: 'Разобранный пример', qcm: 'Тест на понимание', vf: 'Верно/Неверно', enonce: 'Условие вопроса', explication: 'Почему этот ответ верный' },
  zh: { incorrect: '错误陈述', correct: '正确陈述', consigne: '选择题 — 课堂内容的直接应用', exemple: '例题详解', qcm: '理解选择题', vf: '正确/错误', enonce: '题目内容', explication: '为什么这个答案正确' }
};

/** Étiquettes QCM + formulation « écris uniquement dans… » pour la langue du pays. */
function libellesEcriture(ctx) {
  const context = ctx || CONTEXTS[DEFAULT_CODE];
  const code = context.langue || 'fr';
  const labels = QCM_LABELS[code] || QCM_LABELS.fr;
  const langueNom = (LANGUES[code] || LANGUES.fr).nom;
  const redaction = code === 'fr'
    ? 'le français'
    : `la langue de ${context.nom} (${langueNom})`;
  return { labels, redaction };
}

// ── Validation et sanitization des inputs ─────────────────────────
function sanitizeString(input, maxLength = 1000) {
  if (typeof input !== 'string') return '';
  const trimmed = input.trim();
  if (trimmed.length > maxLength) return trimmed.substring(0, maxLength);
  // Supprimer les caractères de contrôle sauf newline/tab
  return trimmed.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

function validateEmail(email) {
  if (typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

function validateNiveau(niveau) {
  const valid = ['bac', 'brevet'];
  return valid.includes(niveau);
}

function validateSerie(serie) {
  if (!serie) return true; // null est valide (pas de série)
  const valid = ['A', 'B', 'C', 'D', 'G'];
  return valid.includes(serie.toUpperCase());
}

function validateClasse(classe) {
  if (!classe) return true; // null est valide
  const valid = ['3ème', '2nde', '1ère', 'Terminale'];
  return valid.includes(classe);
}

function validatePaysCode(code) {
  if (!code) return true; // null est valide
  if (typeof code !== 'string') return false;
  return /^[A-Z]{2}$/.test(code.toUpperCase());
}

function validateUuid(uuid) {
  if (!uuid) return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

function validateInteger(input, min = 0, max = Number.MAX_SAFE_INTEGER) {
  const num = parseInt(input, 10);
  if (isNaN(num)) return false;
  return num >= min && num <= max;
}

function validatePhoneNumber(phone) {
  if (!phone) return true; // null est valide (optionnel)
  if (typeof phone !== 'string') return false;
  // Format international : +229 + 8 à 15 chiffres
  const phoneRegex = /^\+?[1-9]\d{7,14}$/;
  return phoneRegex.test(phone.replace(/[\s-]/g, ''));
}

function validateTransactionId(id) {
  if (!id) return false;
  if (typeof id !== 'string') return false;
  // ID transaction FedaPay : UUID ou chaîne alphanumérique
  const txRegex = /^[a-zA-Z0-9\-_]{8,64}$/;
  return txRegex.test(id);
}

// ── Rate limiting pour prévenir les abus ─────────────────────────
const rateLimitStore = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 60; // 60 requêtes par minute par IP

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress || 'unknown';
}

function isRateLimited(req) {
  const ip = getClientIp(req);
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;

  // Nettoyer les anciennes entrées
  const requests = rateLimitStore.get(ip) || [];
  const validRequests = requests.filter(timestamp => timestamp > windowStart);

  if (validRequests.length >= RATE_LIMIT_MAX_REQUESTS) {
    return true; // Rate limit atteint
  }

  // Ajouter la requête actuelle
  validRequests.push(now);
  rateLimitStore.set(ip, validRequests);

  // Nettoyer périodiquement le store
  if (rateLimitStore.size > 1000) {
    const cutoff = Date.now() - RATE_LIMIT_WINDOW_MS;
    for (const [key, timestamps] of rateLimitStore.entries()) {
      const valid = timestamps.filter(t => t > cutoff);
      if (valid.length === 0) {
        rateLimitStore.delete(key);
      } else {
        rateLimitStore.set(key, valid);
      }
    }
  }

  return false;
}

// Rate limiting plus strict pour les endpoints sensibles (IA, paiements)
const SENSITIVE_RATE_LIMIT = {
  '/v1/ai/chat': { max: 10, window: 60 * 1000 },
  '/v1/ai/generate-course': { max: 5, window: 60 * 1000 },
  '/v1/ai/program-outline': { max: 5, window: 60 * 1000 },
  '/v1/ai/quiz-bank': { max: 5, window: 60 * 1000 },
  '/v1/ai/chapter-exercises': { max: 10, window: 60 * 1000 },
  '/v1/payments/create-transaction': { max: 3, window: 60 * 1000 },
  '/v1/payments/verify': { max: 10, window: 60 * 1000 },
  '/webhook/fedapay': { max: 10, window: 60 * 1000 }
};

const sensitiveRateLimitStore = new Map();

function isSensitiveRateLimited(req, endpoint) {
  const config = SENSITIVE_RATE_LIMIT[endpoint];
  if (!config) return false;

  const ip = getClientIp(req);
  const key = `${ip}:${endpoint}`;
  const now = Date.now();
  const windowStart = now - config.window;

  const requests = sensitiveRateLimitStore.get(key) || [];
  const validRequests = requests.filter(timestamp => timestamp > windowStart);

  if (validRequests.length >= config.max) {
    return true;
  }

  validRequests.push(now);
  sensitiveRateLimitStore.set(key, validRequests);

  return false;
}

// ── Supabase REST client (léger, sans SDK) ──────────────────────────
const SUPABASE_URL     = process.env.SUPABASE_URL     || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY
                          || process.env.SUPABASE_ANON_KEY
                          || '';

/**
 * Appel REST Supabase minimal (GET/POST/PATCH PostgREST ou RPC).
 * @param {string} endpoint  ex: "/rest/v1/rpc/get_curriculum_topics"
 * @param {object} body      payload JSON pour les RPC POST
 * @param {string} method    méthode HTTP (GET par défaut, POST si body)
 * @returns {Promise<any>}   données parsées ou null en cas d'erreur
 */
async function supabaseFetch(endpoint, body = null, method = null) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) return null;
  try {
    const url = SUPABASE_URL.replace(/\/$/, '') + endpoint;
    const options = {
      method: method || (body ? 'POST' : 'GET'),
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
    if (res.status === 204) return { ok: true };
    const text = await res.text();
    return text ? JSON.parse(text) : { ok: true };
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
// Cache mémoire : le cache disque (plus bas) est le vrai filet de sécurité.
// 12 h ici évitent de régénérer un cours déjà payé en quota après 30 min.
const COURSE_CACHE_TTL_MS = Number(process.env.AI_CACHE_MEMOIRE_MINUTES || 720) * 60 * 1000;
const COURSE_CACHE_MAX = 500;

function courseCacheGet(key) {
  const entry = courseCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.at > COURSE_CACHE_TTL_MS) {
    courseCache.delete(key);
    return null;
  }
  return entry.value;
}

function courseCacheSet(key, value) {
  if (courseCache.size >= COURSE_CACHE_MAX) {
    courseCache.delete(courseCache.keys().next().value);
  }
  courseCache.set(key, { at: Date.now(), value });
}

// ── Quota IA : le plafond gratuit n'est pas extensible ───────────────
// Google accorde ~20 requêtes/JOUR et par modèle sur les modèles flash
// standard, et ~1 500/JOUR sur les modèles flash-lite (mesuré). On ne peut
// pas augmenter ces plafonds : on les applique donc nous-mêmes, en dessous
// du réel, et on garantit que le site reste utilisable même quand ils sont
// atteints (cache durable + repli local — jamais une erreur 502).
const AI_BUDGET_QUOTIDIEN = Number(process.env.AI_BUDGET_QUOTIDIEN) || 200;
// Modèles flash standard (quota Google ~20/j) : on reste bien en dessous.
const AI_BUDGET_PAR_MODELE = Number(process.env.AI_BUDGET_PAR_MODELE) || 15;
// Modèles flash-lite (quota Google ~1 500/j) : la marge est plus large.
const AI_BUDGET_PAR_MODELE_LITE = Number(process.env.AI_BUDGET_PAR_MODELE_LITE) || 150;
// Le diagnostic IA consomme lui aussi du quota : budget séparé et réduit.
const AI_BUDGET_SANTE = Number(process.env.AI_BUDGET_SANTE) || 12;
const AI_BUDGET_SANTE_PAR_MODELE = Number(process.env.AI_BUDGET_SANTE_PAR_MODELE) || 3;

// Un budget par clé API : chaque clé a son propre quota Google.
const budgetsIA = new Map();
function budgetPourCle(cle) {
  if (!budgetsIA.has(cle)) {
    budgetsIA.set(cle, new BudgetQuota({
      budgetTotal: AI_BUDGET_QUOTIDIEN,
      budgetParModele: AI_BUDGET_PAR_MODELE,
      budgetParModeleLite: AI_BUDGET_PAR_MODELE_LITE
    }));
  }
  return budgetsIA.get(cle);
}
const budgetIASante = new BudgetQuota({
  budgetTotal: AI_BUDGET_SANTE,
  budgetParModele: AI_BUDGET_SANTE_PAR_MODELE,
  budgetParModeleLite: AI_BUDGET_SANTE_PAR_MODELE
});

// Cache durable sur disque : survit au redémarrage de l'instance, là où
// le cache mémoire est perdu à chaque redémarrage du plan gratuit Render.
const cacheDisque = new CacheDisque(process.env.AI_CACHE_DIR || path.join(__dirname, 'cache'), {
  ttlMs: (Number(process.env.AI_CACHE_TTL_JOURS) || 30) * 24 * 60 * 60 * 1000,
  maxFichiers: Number(process.env.AI_CACHE_MAX_FICHIERS) || 400
});

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

async function callGemini(requestBody, timeoutMs = GEMINI_TIMEOUT_CHAT_MS, totalBudgetMs = timeoutMs * 2, options = {}) {
  // 1 essai sur le modèle principal (le plus rapide), puis 1 essai sur le secours.
  const plans = [
    { model: GEMINI_MODEL, attempts: 1 },
    ...GEMINI_FALLBACK_MODELS.map(model => ({ model, attempts: 1 }))
  ].filter(plan => plan.model);

  let lastStatus = 0;
  let lastData = null;
  let invalidKey = false;
  let invalidKeyCount = 0;
  // Budget global : sans lui, une saturation totale de Google enchainerait
  // 5 modèles à 110 s chacun (jusqu'à 9 minutes d'attente côté élève).
  const startedAt = Date.now();
  // Quota : on ne sort jamais plus de requêtes que le budget du jour.
  const budget = options.budget || null;
  let budgetCourant = budget;
  let requetesTentees = 0;
  let quotaBloque = false;

  for (const apiKey of GEMINI_API_KEYS) {
    invalidKey = false;
    const budgetCle = budgetCourant || budgetPourCle(apiKey);
    budgetCourant = budgetCle;
    for (let p = 0; p < plans.length && !invalidKey; p++) {
      if (Date.now() - startedAt > totalBudgetMs) {
        console.error(`Gemini: budget de ${Math.round(totalBudgetMs / 1000)} s épuisé, abandon`);
        return { ok: false, status: lastStatus, data: lastData || { error: { code: 0, message: 'Service IA indisponible (trop lent)' } }, invalidKey };
      }
      const { model, attempts } = plans[p];

      // Quota épuisé pour ce modèle : on ne tente même pas l'appel HTTP.
      const autorisation = budgetCle.autorise(model);
      if (!autorisation.ok) {
        quotaBloque = true;
        console.warn(`Gemini: ${autorisation.raison} — modèle ${model} ignoré (plus d'appel envoyé)`);
        continue;
      }
      requetesTentees++;

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
          invalidKeyCount++;
          if (invalidKeyCount >= GEMINI_API_KEYS.length) {
            aiKeyBlockedUntil = Date.now() + AI_KEY_BLOCK_MS;
            console.error(`Gemini: toutes les clés API refusées (${response.status}) — accès IA suspendu ${AI_KEY_BLOCK_MS / 60000} min`);
          } else {
            console.error(`Gemini: clé API refusée (${response.status}) — bascule sur la clé de secours`);
          }
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

  // Quota atteint avant tout appel : on le dit explicitement pour que
  // l'appelant bascule sur le cache durable ou le contenu local.
  if (quotaBloque && !requetesTentees) {
    return {
      ok: false,
      status: 429,
      data: { error: { code: 429, message: 'Quota IA épuisé pour aujourd\'hui' } },
      invalidKey: false,
      quotaExhausted: true,
      retryDansSecondes: budgetCourant.retryDansSecondes()
    };
  }

  return {
    ok: false,
    status: lastStatus,
    data: lastData,
    invalidKey: invalidKeyCount > 0 && invalidKeyCount >= GEMINI_API_KEYS.length
  };
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
  '.txt': 'text/plain; charset=utf-8'
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

function sendJson(res, status, payload) {
  if (res.headersSent) return;
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

function readRawBody(req, maxBytes = 64 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', chunk => {
      size += chunk.length;
      if (size > maxBytes) {
        reject(new Error('Payload trop volumineux'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function parseJsonBody(raw) {
  if (!raw) return {};
  const parsed = JSON.parse(raw);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new SyntaxError('Le corps de la requête doit être un objet JSON');
  }
  return parsed;
}

async function readJsonBody(req, maxBytes) {
  return parseJsonBody(await readRawBody(req, maxBytes || 64 * 1024));
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
    // Artefacts de réponse du modèle (« FileResource », « Thought »…)
    .replace(/^(?:FileResource|Thought|None|null|undefined|NaN)$/i, '')
    .trim();
}

/**
 * Neutralise les séquences d'échappement invalides d'un JSON généré par IA.
 * Le modèle glisse parfois du LaTeX brut dans les chaînes
 * ( \underbrace{...}, \(, \%, \text{...} ) : « \u » suivi de lettres
 * est un échappement Unicode invalide et fait échouer le parsing.
 * On retire la barre oblique, on garde le caractère.
 */
function assainirEscapesJson(texte) {
  const src = String(texte || '');
  const out = [];
  let inString = false;
  let i = 0;

  while (i < src.length) {
    const ch = src[i];

    if (!inString) {
      if (ch === '"') inString = true;
      out.push(ch);
      i++;
      continue;
    }

    if (ch === '"') { inString = false; out.push(ch); i++; continue; }

    if (ch === '\\') {
      const next = src[i + 1];
      if (next === undefined) { i++; continue; }
      if (next === 'u') {
        const hex = src.slice(i + 2, i + 6);
        if (/^[0-9a-fA-F]{4}$/.test(hex)) {
          out.push('\\u' + hex);
          i += 6;
        } else {
          out.push('u');
          i += 2;
        }
        continue;
      }
      if ('"\\/bfnrt'.indexOf(next) !== -1) {
        out.push('\\' + next);
        i += 2;
        continue;
      }
      out.push(next);
      i += 2;
      continue;
    }

    // Caractère de contrôle brut dans une chaîne : invalide en JSON
    if (ch.charCodeAt(0) < 0x20) { out.push(' '); i++; continue; }

    out.push(ch);
    i++;
  }

  return out.join('');
}

function repairJson(text) {
  // Répare les JSON tronqués ou malformés par le modèle (virgules en fin, guillemets non fermés)
  const cleaned = assainirEscapesJson(String(text || '')
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim());

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
  const cleaned = assainirEscapesJson(String(text || '').trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim());
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

function normalizeChapters(chapitres, niveau, subjectName, serie = null) {
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
      // Niveau et matière : le front en a besoin pour filtrer (tableaux de bord,
      // recherche, génération des exercices du chapitre).
      niveau,
      subject: subjectName,
      // Le Brevet (3ème) est commun : pas de série.
      serie: niveau === 'brevet' ? null : (serie || null),
      isFree,
      price: isFree ? 0 : basePrice,
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

const IS_PRODUCTION = process.env.NODE_ENV === 'production' || Boolean(process.env.RENDER);
const WEBHOOK_TOLERANCE_S = 300;

function verifyFedapaySignature(req, rawBody) {
  const secret = process.env.FEDAPAY_WEBHOOK_SECRET;
  if (!secret) {
    return IS_PRODUCTION
      ? { ok: false, reason: 'secret-not-configured' }
      : { ok: true, reason: 'secret-not-configured-dev' };
  }

  const received = getFedapaySignature(req);
  if (!received) return { ok: false, reason: 'missing-signature' };

  // Format FedaPay : "t=<timestamp>,s=<hmac sha256 de `${t}.${corps}`>"
  const parts = Object.fromEntries(
    received.split(',').map(part => part.trim().split('=')).filter(pair => pair.length === 2)
  );
  if (parts.t && parts.s) {
    const timestamp = Number(parts.t);
    if (!Number.isFinite(timestamp) || Math.abs(Date.now() / 1000 - timestamp) > WEBHOOK_TOLERANCE_S) {
      return { ok: false, reason: 'timestamp-out-of-tolerance' };
    }
    const expected = crypto.createHmac('sha256', secret).update(`${parts.t}.${rawBody}`).digest('hex');
    return { ok: timingSafeCompare(parts.s, expected), reason: 'checked' };
  }

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
    id: entity.id || entity.transaction_id || '',
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
    if (signature.reason === 'secret-not-configured') {
      console.error('Webhook FedaPay refusé : FEDAPAY_WEBHOOK_SECRET non configurée');
    }
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
    await unlockFromWebhook(payment.id);
  }

  sendJson(res, 200, { success: true, received: true });
}

/**
 * Déblocage par webhook : couvre l'élève qui ferme l'onglet après avoir payé.
 * Seules les transactions créées par le serveur portent user_id / kind / niveau.
 */
async function unlockFromWebhook(transactionId) {
  if (!transactionId) return;
  try {
    const check = await payments.verifyTransaction(String(transactionId));
    const meta = (check && check.metadata) || {};
    if (!check.ok || !meta.user_id || !meta.kind) return;
    const kind = ['subscription', 'epreuve'].includes(meta.kind) ? meta.kind : 'chapter';
    const niveau = ['bac', 'brevet'].includes(meta.niveau) ? meta.niveau : 'bac';
    const result = await applyVerifiedPayment({
      user: { id: String(meta.user_id), email: '' },
      transactionId: String(transactionId),
      kind,
      niveau,
      // Pour une épreuve, l'identifiant transporté est celui de l'épreuve.
      chapterId: kind === 'chapter'
        ? cleanText(meta.chapter_id, 160)
        : (kind === 'epreuve' ? cleanText(meta.epreuve_id, 160) : ''),
      title: '',
      subject: '',
      phone: '',
      ctx: null
    });
    if (result.status !== 200) {
      console.warn('Webhook : déblocage non appliqué', transactionId, result.payload.error);
    }
  } catch (error) {
    console.error('Webhook : déblocage impossible', error.message);
  }
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

  // Validation de l'email
  if (!validateEmail(user.email)) {
    sendJson(res, 400, { success: false, error: 'Email invalide' });
    return;
  }

  const kind = ['subscription', 'epreuve'].includes(body.kind) ? body.kind : 'chapter';
  const niveau = sanitizeString(body.niveau || 'bac', 10).toLowerCase();
  if (!validateNiveau(niveau)) {
    sendJson(res, 400, { success: false, error: 'Niveau invalide' });
    return;
  }

  const chapterId = kind === 'chapter' ? sanitizeString(body.chapterId, 160) : '';
  if (kind === 'chapter' && !chapterId) {
    sendJson(res, 400, { success: false, error: 'Chapitre manquant' });
    return;
  }
  // Pour une épreuve, l'identifiant de l'épreuve remplace celui du chapitre.
  const epreuveId = kind === 'epreuve' ? sanitizeString(body.epreuveId || body.chapterId, 160) : '';
  if (kind === 'epreuve' && !validateUuid(epreuveId)) {
    sendJson(res, 400, { success: false, error: 'Épreuve invalide' });
    return;
  }

  // Validation du numéro de téléphone
  const phone = sanitizeString(body.phone || '', 20);
  if (phone && !validatePhoneNumber(phone)) {
    sendJson(res, 400, { success: false, error: 'Numéro de téléphone invalide' });
    return;
  }

  const ctx = contextFromRequest(req, body);
  const expected = await payments.resolveExpectedAmount(
    kind,
    niveau,
    kind === 'epreuve' ? epreuveId : chapterId,
    body.amount,
    sanitizeString(body.title, 180),
    ctx
  );
  if (!expected.amount || expected.amount <= 0) {
    sendJson(res, 400, { success: false, error: 'Montant invalide' });
    return;
  }

  const description = kind === 'subscription'
    ? `Revizy - Abonnement mensuel ${niveau === 'brevet' ? 'Brevet' : 'BAC'}`
    : (kind === 'epreuve'
      ? `Revizy - Corrigé ${sanitizeString(body.title, 90) || epreuveId}`
      : `Revizy - Cours ${chapterId}`);

  const fullName = sanitizeString(user.name || '', 100);
  const created = await payments.createTransaction({
    amount: expected.amount,
    description,
    callbackUrl: process.env.FEDAPAY_CALLBACK_URL || process.env.APP_BASE_URL_FRONT || process.env.APP_BASE_URL || '',
    customer: {
      email: user.email,
      firstname: fullName.split(' ')[0] || 'Eleve',
      lastname: fullName.split(' ').slice(1).join(' ') || 'Revizy',
      phone: phone,
      country: 'bj'
    },
    metadata: {
      kind,
      niveau,
      chapter_id: chapterId,
      epreuve_id: kind === 'epreuve' ? epreuveId : '',
      user_id: user.id
    }
  });

  if (!created.ok) {
    console.error('[PAYMENT] Create transaction failed:', user.id, kind, niveau, chapterId, created.status, created.error);
    sendJson(res, 502, { success: false, error: 'Initialisation du paiement impossible' });
    return;
  }

  console.log('[PAYMENT] Transaction created:', user.id, kind, niveau, chapterId, created.id, expected.amount);

  sendJson(res, 200, {
    success: true,
    amount: expected.amount,
    transactionId: created.id,
    paymentUrl: created.url,
    kind,
    niveau,
    chapterId,
    epreuveId: kind === 'epreuve' ? epreuveId : ''
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

  const transactionId = sanitizeString(body.transactionId, 120);
  const kind = ['subscription', 'epreuve'].includes(body.kind) ? body.kind : 'chapter';
  const niveau = sanitizeString(body.niveau || 'bac', 10).toLowerCase();
  const chapterId = kind === 'chapter' ? sanitizeString(body.chapterId, 160) : '';
  const epreuveId = kind === 'epreuve' ? sanitizeString(body.epreuveId || body.chapterId, 160) : '';

  if (!transactionId || !validateTransactionId(transactionId)) {
    sendJson(res, 400, { success: false, error: 'Référence de transaction invalide' });
    return;
  }
  if (!validateNiveau(niveau)) {
    sendJson(res, 400, { success: false, error: 'Niveau invalide' });
    return;
  }
  if (kind === 'chapter' && !chapterId) {
    sendJson(res, 400, { success: false, error: 'Chapitre manquant' });
    return;
  }
  if (kind === 'epreuve' && !validateUuid(epreuveId)) {
    sendJson(res, 400, { success: false, error: 'Épreuve invalide' });
    return;
  }

  const result = await applyVerifiedPayment({
    user,
    transactionId,
    kind,
    niveau,
    // Pour une épreuve, l'identifiant transporté est celui de l'épreuve.
    chapterId: kind === 'epreuve' ? epreuveId : chapterId,
    title: sanitizeString(body.title, 180),
    subject: sanitizeString(body.subject, 80),
    phone: sanitizeString(body.phone || '', 20),
    ctx: contextFromRequest(req, body)
  });
  sendJson(res, result.status, result.payload);
}

/**
 * Contrôle la transaction auprès de FedaPay puis applique le déblocage.
 * Partagé par la vérification navigateur et le webhook.
 * @returns {Promise<{status: number, payload: object}>}
 */
async function applyVerifiedPayment({ user, transactionId, kind, niveau, chapterId, title, subject, phone, ctx }) {
  const fail = (status, error) => ({ status, payload: { success: false, error } });
  
  console.log('[PAYMENT] Verifying payment:', user.id, transactionId, kind, niveau, chapterId);
  
  const check = await payments.verifyTransaction(transactionId);
  if (!check.ok) {
    console.warn('[PAYMENT] Payment not verified:', transactionId, check.reason);
    return fail(402, `Paiement non validé (${check.reason || 'statut inconnu'})`);
  }

  const expected = await payments.resolveExpectedAmount(kind, niveau, chapterId, check.amount, title, ctx);
  if (check.amount < expected.amount) {
    console.warn('[PAYMENT] Insufficient amount:', transactionId, check.amount, '<', expected.amount);
    return fail(402, `Montant insuffisant (${check.amount} sur ${expected.amount} requis)`);
  }
  if (check.currency && expected.currency && check.currency !== expected.currency) {
    console.warn('[PAYMENT] Currency mismatch:', transactionId, check.currency, '!=', expected.currency);
    return fail(402, 'Devise non conforme');
  }

  // La transaction doit appartenir à l'élève qui la présente et viser cet achat.
  const meta = check.metadata || {};
  if (meta.user_id && String(meta.user_id) !== String(user.id)) {
    console.warn('[PAYMENT] User ID mismatch:', transactionId, meta.user_id, '!=', user.id);
    return fail(403, 'Cette transaction appartient à un autre compte');
  }
  if (meta.kind && meta.kind !== kind) {
    console.warn('[PAYMENT] Kind mismatch:', transactionId, meta.kind, '!=', kind);
    return fail(403, 'Transaction non destinée à cet achat');
  }
  if (kind === 'chapter' && meta.chapter_id && String(meta.chapter_id) !== chapterId) {
    console.warn('[PAYMENT] Chapter ID mismatch:', transactionId, meta.chapter_id, '!=', chapterId);
    return fail(403, 'Transaction liée à un autre chapitre');
  }
  if (kind === 'epreuve' && meta.epreuve_id && String(meta.epreuve_id) !== chapterId) {
    console.warn('[PAYMENT] Epreuve ID mismatch:', transactionId, meta.epreuve_id, '!=', chapterId);
    return fail(403, 'Transaction liée à une autre épreuve');
  }
  if (!meta.user_id && check.customerEmail && user.email
      && check.customerEmail !== String(user.email).toLowerCase()) {
    console.warn('[PAYMENT] Email mismatch:', transactionId, check.customerEmail, '!=', user.email);
    return fail(403, 'Cette transaction a été payée depuis un autre compte');
  }

  const successPayload = {
    success: true,
    unlocked: kind === 'chapter' ? chapterId : (kind === 'epreuve' ? `epreuve_${chapterId}` : `subscription_${niveau}`),
    amount: check.amount,
    kind,
    niveau
  };

  // Réservation atomique du reçu avant tout déblocage.
  const claim = await payments.claimReceipt({
    transaction_id: transactionId,
    user_id: user.id,
    kind,
    niveau,
    chapter_id: chapterId,
    amount: check.amount,
    reference: String(check.reference || transactionId)
  });
  if (!claim.ok) {
    if (claim.conflict) {
      console.warn('[PAYMENT] Transaction already used:', transactionId);
      const rows = await payments.supabaseRestGet(
        `/rest/v1/payment_receipts?transaction_id=eq.${encodeURIComponent(transactionId)}&select=user_id,kind,chapter_id&limit=1`
      );
      const existing = Array.isArray(rows) && rows[0];
      // Même élève, même achat : déjà appliqué, on confirme sans rien réécrire.
      if (existing && existing.user_id === user.id && existing.kind === kind
          && (kind !== 'chapter' || existing.chapter_id === chapterId)) {
        console.log('[PAYMENT] Transaction already applied to same user:', transactionId);
        return { status: 200, payload: { ...successPayload, alreadyApplied: true } };
      }
      return fail(409, 'Cette transaction a déjà été utilisée');
    }
    console.error('[PAYMENT] Receipt registration failed:', claim.error);
    return fail(500, 'Enregistrement du paiement impossible');
  }

  // Écriture serveur : c'est le seul endroit où le déblocage est autorisé
  let write;
  if (kind === 'subscription') {
    // L'abonnement est enregistré en base : l'admin le voit, et l'élève
    // retrouve son accès illimité sur tous ses appareils.
    const expiresAt = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString();
    write = await payments.supabaseRestWrite('/rest/v1/subscriptions', 'POST', {
      user_id: user.id,
      niveau,
      plan_name: niveau === 'brevet' ? 'Pass Brevet' : 'Pass BAC',
      amount: check.amount,
      currency: check.currency || payments.FEDAPAY_CURRENCY,
      provider: 'FedaPay (MoMo)',
      transaction_id: transactionId,
      starts_at: new Date().toISOString(),
      expires_at: expiresAt
    });
    if (write.ok) {
      console.log('[PAYMENT] Subscription created:', user.id, niveau);
      // La trace « abonnement » reste aussi dans l'historique des paiements.
      await payments.supabaseRestWrite('/rest/v1/transactions', 'POST', {
        user_id: user.id,
        chapter_id: `subscription_${niveau}`,
        chapter_title: `Abonnement mensuel ${niveau === 'brevet' ? 'Brevet' : 'BAC'}`,
        amount: check.amount,
        provider: 'FedaPay (MoMo)',
        phone
      });
    } else {
      console.error('[PAYMENT] Subscription write failed:', write.error);
    }
  } else if (kind === 'epreuve') {
    // Épreuve payante : le déblocage est écrit côté serveur, jamais par
    // l'élève lui-même.
    write = await payments.supabaseRestWrite(
      '/rest/v1/unlocked_epreuves?on_conflict=user_id,epreuve_id',
      'POST',
      {
        user_id: user.id,
        epreuve_id: chapterId,
        title: title || chapterId,
        niveau,
        price: check.amount,
        provider: 'FedaPay (MoMo)'
      },
      { prefer: 'resolution=ignore-duplicates,return=minimal' }
    );
  } else {
    // Un rachat d'un chapitre déjà débloqué ne doit pas échouer sur unique(user_id, chapter_id).
    write = await payments.supabaseRestWrite(
      '/rest/v1/unlocked_chapters?on_conflict=user_id,chapter_id',
      'POST',
      {
        user_id: user.id,
        chapter_id: chapterId,
        title: title || chapterId,
        niveau,
        subject,
        price: check.amount,
        provider: 'FedaPay (MoMo)'
      },
      { prefer: 'resolution=ignore-duplicates,return=minimal' }
    );
  }

  if (!write.ok) {
    console.error('[PAYMENT] Unlock write failed:', write.error);
    await payments.releaseReceipt(transactionId);
    return fail(500, 'Enregistrement du déblocage impossible');
  }

  console.log('[PAYMENT] Unlock successful:', user.id, kind, chapterId);
  forgetEntitlements(user.id);

  return { status: 200, payload: successPayload };
}

function getBearerToken(req) {
  const header = req.headers['authorization'] || req.headers['Authorization'] || '';
  const match = String(header).match(/Bearer\s+(.+)$/i);
  return match ? match[1].trim() : '';
}

// ── Droits d'accès aux cours payants (vérifiés côté serveur) ──────────
const ENTITLEMENT_TTL_MS = 60 * 1000;
const entitlementCache = new Map();

async function getEntitlements(req) {
  const token = getBearerToken(req);
  if (!token || token === 'null' || token === 'undefined') return null;
  const cached = entitlementCache.get(token);
  if (cached && Date.now() - cached.at < ENTITLEMENT_TTL_MS) return cached.value;

  const user = await payments.getUserFromToken(token);
  let value = null;
  if (user) {
    const uid = encodeURIComponent(user.id);
    const now = encodeURIComponent(new Date().toISOString());
    const [profile, subs, unlocks, epreuvesAchetees] = await Promise.all([
      payments.userRestGet(token, `/rest/v1/profiles?id=eq.${uid}&select=role&limit=1`),
      payments.userRestGet(token, `/rest/v1/subscriptions?user_id=eq.${uid}&expires_at=gt.${now}&select=niveau`),
      payments.userRestGet(token, `/rest/v1/unlocked_chapters?user_id=eq.${uid}&select=chapter_id`),
      payments.userRestGet(token, `/rest/v1/unlocked_epreuves?user_id=eq.${uid}&select=epreuve_id`)
    ]);
    value = {
      userId: user.id,
      isAdmin: Array.isArray(profile) && Boolean(profile[0]) && profile[0].role === 'admin',
      niveaux: new Set((Array.isArray(subs) ? subs : []).map(row => String(row.niveau))),
      chapters: new Set((Array.isArray(unlocks) ? unlocks : []).map(row => String(row.chapter_id))),
      epreuves: new Set((Array.isArray(epreuvesAchetees) ? epreuvesAchetees : []).map(row => String(row.epreuve_id)))
    };
  }
  if (entitlementCache.size > 1000) entitlementCache.clear();
  entitlementCache.set(token, { at: Date.now(), value });
  return value;
}

function forgetEntitlements(userId) {
  for (const [token, entry] of entitlementCache) {
    if (entry.value && entry.value.userId === userId) entitlementCache.delete(token);
  }
}

function canReadChapter(ent, chapter, niveau) {
  if (chapter.isFree) return true;
  if (!ent) return false;
  return ent.isAdmin
    || ent.niveaux.has(niveau)
    || ent.niveaux.has('all')
    || ent.chapters.has(String(chapter.id));
}

// Retire le contenu des chapitres payants que l'élève n'a pas débloqués.
function protectChapters(chapitres, niveau, ent) {
  return chapitres.map(chapter => {
    if (canReadChapter(ent, chapter, niveau)) return chapter;
    return {
      id: chapter.id,
      num: chapter.num,
      sa: chapter.sa,
      title: chapter.title,
      niveau: chapter.niveau,
      subject: chapter.subject,
      serie: chapter.serie,
      isFree: false,
      price: chapter.price,
      locked: true,
      cours: '',
      exemple: { titre: (chapter.exemple && chapter.exemple.titre) || '', enonce: '', solution: '' }
    };
  });
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

/** Compare deux libellés sans tenir compte des accents ni de la casse. */
function libellesEquivalents(a, b) {
  const norm = (v) => String(v || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
  return norm(a) === norm(b);
}

/**
 * Fallback synchrone sur le curriculum du contexte.
 * Un pays qui n'a pas de programme embarqué renvoie [] : on ne sert JAMAIS
 * le programme d'un autre pays, c'est l'IA qui construit celui du pays.
 */
function getCurriculumTopicsLocal(subjectName, niveau, serie, ctx) {
  const curriculum = (ctx && ctx.curriculum) || null;
  if (!curriculum) return [];
  const level = curriculum[niveau];
  if (!level) return [];
  // « Mathématiques » et « Mathematiques » doivent tomber sur la même matière
  const cle = Object.keys(level).find(k => libellesEquivalents(k, subjectName));
  const subject = cle ? level[cle] : level[subjectName];
  if (!subject) return [];
  if (Array.isArray(subject)) return subject;
  return subject[serie] || subject['C'] || subject['D'] || Object.values(subject)[0] || [];
}

/**
 * Cours de repli, construit SANS l'IA.
 *
 * Sert de filet de sécurité quand le quota IA est atteint (ou qu'aucune clé
 * n'est disponible) : l'élève reçoit un cours structuré dans la langue de
 * son pays, construit à partir du programme officiel connu — jamais à partir
 * du programme d'un autre pays. Le contenu détaillé est réinjecté plus tard
 * par l'IA, quand le quota se libère.
 */
function construireCoursLocal(subjectName, niveau, serie, ctx) {
  const context = ctx || CONTEXTS[DEFAULT_CODE];
  const code = context.code || DEFAULT_CODE;
  const matiere = traduireMatiere(code, subjectName) || subjectName;
  const pays = context.nom || code;
  const topics = getCurriculumTopicsLocal(subjectName, niveau, serie, context);

  const titres = topics.length
    ? topics.slice(0, 12).map(t => cleanText(t, 180)).filter(Boolean)
    : [traduire(code, 'cours.introTitre')];

  return titres.map((titre, index) => {
    const numero = index + 1;
    const contenu = index === 0
      ? traduire(code, 'cours.intro', { matiere, pays })
      : traduire(code, 'cours.chapitre', { titre, pays });
    return {
      id: slugChapitre(context, niveau, serie, subjectName, numero, titre),
      num: numero,
      title: titre,
      sa: `SA ${numero}`,
      isFree: true,
      price: 0,
      cours: contenu,
      exemple: {
        titre: traduire(code, 'cours.exempleTitre'),
        enonce: traduire(code, 'cours.exempleEnonce'),
        solution: traduire(code, 'cours.exempleSolution')
      },
      exercice: {
        consigne: traduire(code, 'exercices.titre'),
        question: traduire(code, 'cours.exempleEnonce'),
        type: 'resolution',
        solution: traduire(code, 'cours.exempleSolution')
      }
    };
  });
}

/**
 * Programme saisi par l'admin (table curriculum_sequences) : source de référence.
 */
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
        .filter(part => part && typeof part === 'object')
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

  // 1. Structure imposée par l'admin (SA + chapitres), sinon programme enregistré
  let adminParts = Array.isArray(parts) && parts.length
    ? parts
    : (Array.isArray(sequences) && sequences.length ? parseProgramParts(sequences.join('\n')) : null);
  if (!adminParts || !adminParts.length) {
    const stored = await getAdminProgram(subjectName, niveau, serie, context);
    if (stored && Array.isArray(stored.parts) && programPartsToChapters(stored.parts).length) {
      adminParts = stored.parts;
    }
  }

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
  const examen = (context.libelleExamen && (niveau === 'bac' ? context.libelleExamen.bac : context.libelleExamen.brevet)) || '';
  const topicsBlock = topics.length > 0
    ? `\nLe programme officiel ${textes.programmeOfficiel} pour cette matière couvre ces chapitres principaux :\n${topics.map((t, i) => `${i + 1}. ${t}`).join('\n')}\nGénère exactement ${chapCount} chapitres en suivant strictement cet ordre et ce programme.`
    : `\nAucun programme n'est encore enregistré pour ${context.nom} : construis le cours sur le PROGRAMME OFFICIEL DE ${context.nom} (${textes.programmeOfficiel}${examen ? `, examen ${examen}` : ''}) pour cette matière.\nRéparties les notions en ${chapCount} chapitres qui suivent strictement ce programme national, dans l'ordre du programme.`;
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
  const { labels, redaction } = libellesEcriture(context);
  return `Tu es un professeur expert du ${textes.systemeEducatif} (${textes.programmeOfficiel}). Génère un contenu de révision complet pour ${subjectName}, niveau ${niveauLabel}.${introBlock}

${instructionLangue(context)}

Réponds uniquement en JSON valide, sans markdown, sous cette forme exacte :
{
  "chapitres": [
    {
      "title": "SA 1 : Titre exact du chapitre selon le programme",
      "price": ${priceRef},
      "cours": "Cours complet et explicite : définitions précises, toutes les notions clés, formules, démonstrations importantes, méthodes de résolution, exemples numériques ou littéraires concrets, pièges fréquents à l'examen ${textes.examens}.",
      "exemple": {
        "titre": "${labels.exemple} — type ${textes.examens}",
        "enonce": "Énoncé réaliste tel qu'il apparaît aux examens ${context.nom}",
        "solution": "Solution détaillée pas-à-pas avec justifications"
      },
      "exercice": {
        "consigne": "${labels.consigne}",
        "question": "Question précise sur une notion du chapitre",
        "type": "qcm",
        "options": ["a) ${labels.incorrect}", "b) ${labels.correct}", "c) ${labels.incorrect}", "d) ${labels.incorrect}"],
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
- Rédige l'intégralité du contenu en ${redaction} : titres, cours, exemples, questions, options et explications. Ne mélange jamais les langues.`;
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
  const fullUrl = req.url || '/';
  if (!explicit) {
    const m = fullUrl.match(/[?&]pays=([A-Za-z]{2})/);
    if (m) explicit = m[1];
  }
  const q = fullUrl.indexOf('?');
  const pathname = q >= 0 ? fullUrl.slice(0, q) : fullUrl;
  return resolveContext({ code: explicit, host: req.headers.host, path: pathname });
}

/**
 * Recherche automatique du programme officiel d'une matière.
 * L'admin clique sur "Rechercher" : l'IA propose les parties clés / séquences,
 * que l'admin peut corriger avant de les enregistrer.
 */
function localProgramSequences(subjectName, niveau, serie, ctx) {
  // Le programme local n'existe que pour les pays dont le curriculum est
  // embarqué (Bénin). Pour les autres pays, c'est l'IA qui construit le
  // programme : on ne doit JAMAIS servir le programme d'un autre pays.
  if (!ctx || !ctx.curriculum) return [];
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
  // Par défaut : réponse locale instantanée. useAi=true (admin seulement) pour l'enrichissement Gemini.
  let useAi = body.useAi === true;
  if (useAi) {
    const ent = await getEntitlements(req).catch(() => null);
    if (!ent || !ent.isAdmin) useAi = false;
  }

  if (!subjectName || !['bac', 'brevet'].includes(niveau)) {
    sendJson(res, 400, { success: false, error: 'Paramètres invalides' });
    return;
  }

  const niveauLabel = niveau === 'bac'
    ? `classe de Terminale de ${ctx.nom} (examen ${ctx.libelleExamen.bac})${serie ? `, série ${serie}` : ''}`
    : `classe de 3ème (${ctx.libelleExamen.brevet}) de ${ctx.nom}`;

  const respondLocal = (reason) => {
    const local = localProgramSequences(subjectName, niveau, serie, ctx);
    if (!local.length) {
      sendJson(res, 502, {
        success: false,
        code: 'NO_PROGRAM',
        error: reason
          || `Aucun programme local pour « ${subjectName} » (${ctx.nom}). Utilise l'IA : elle construit le programme officiel du pays.`
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

${instructionLangue(ctx)}

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
- Le programme doit correspondre à l'examen ${niveau === 'bac' ? ctx.libelleExamen.bac : ctx.libelleExamen.brevet} de ${ctx.nom}, pas à celui d'un autre pays.
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
  const wanted = Math.min(Math.max(parseInt(body.count, 10) || 50, 5), 60);
  const ctx = contextFromRequest(req, body);

  if (!subjectName || !['bac', 'brevet'].includes(niveau)) {
    sendJson(res, 400, { success: false, error: 'Paramètres invalides' });
    return;
  }

  // Régénérer une banque partagée consomme le quota IA : réservé à l'admin.
  let force = false;
  if (body.force === true) {
    const ent = await getEntitlements(req);
    force = Boolean(ent && ent.isAdmin);
  }

  // 1. Banque déjà disponible en base (partagée entre tous les élèves)
  let existing = [];
  if (!force) {
    const rows = await supabaseFetch('/rest/v1/rpc/get_quiz_bank', {
      p_niveau: niveau,
      p_classe: classe || null,
      p_serie: serie || null,
      p_subject: subjectName,
      p_pays: ctx.code
    });
    const row = Array.isArray(rows) && rows.length ? rows[0] : null;
    existing = row && Array.isArray(row.questions) ? row.questions : [];
    // L'IA livre souvent un peu moins que demandé : une banque à 80 % suffit
    if (existing.length > 0 && existing.length >= Math.ceil(wanted * 0.8)) {
      sendJson(res, 200, { success: true, questions: existing.slice(0, wanted), cached: true, classe, serie, niveau });
      return;
    }
  }
  const sendExisting = () => {
    if (!existing.length) return false;
    sendJson(res, 200, { success: true, questions: existing.slice(0, wanted), cached: true, classe, serie, niveau });
    return true;
  };

  if (!GEMINI_API_KEYS.length) {
    if (sendExisting()) return;
    sendJson(res, 503, { success: false, code: 'AI_NOT_CONFIGURED', error: 'GEMINI_API_KEY non configurée' });
    return;
  }
  if (isAiKeyBlocked()) {
    if (sendExisting()) return;
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
      if (sendExisting()) return;
      const quotaExhausted = Boolean(result.quotaExhausted);
      sendJson(res, (result.invalidKey || quotaExhausted) ? 503 : 502, {
        success: false,
        code: result.invalidKey ? 'AI_KEY_INVALID' : (quotaExhausted ? 'AI_QUOTA' : 'AI_BUSY'),
        quotaExhausted,
        retryDansSecondes: result.retryDansSecondes || null,
        error: result.invalidKey
          ? 'Service IA indisponible (clé API refusée par Google)'
          : (quotaExhausted
            ? 'Quotidien IA atteint : exercices locaux utilisés'
            : 'Préparation des exercices impossible pour le moment')
      });
      return;
    }

    const text = result.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const parsed = extractJson(text);
    let questions = normalizeQuestions(parsed.questions, ctx);

    if (!questions.length) {
      if (sendExisting()) return;
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
          const extra = normalizeQuestions(parsed2.questions, ctx)
            .filter(q => q.question && !dejaVues.has(q.question.toLowerCase().trim()));
          if (extra.length) {
            questions = questions.concat(extra).slice(0, wanted);
          }
        }
      } catch (e) {
        console.warn('Complément banque d’exercices:', e.message);
      }
    }

    // On plafonne à la quantité demandée (le modèle peut en livrer plus).
    questions = questions.slice(0, wanted);

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

${instructionLangue(context)}

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
- Vrai/Faux : "options" contient uniquement ${JSON.stringify(optionsVraiFaux(context))}.
- Jamais d'indice dans les options (pas de "Correct" ni "Bonne réponse").
- Chaque question est liée à une partie du programme (champ "chapitre").`;
}

// ── Exercices d'un chapitre (50 QCM / Vrai-Faux) ───────────────────
// Générés une fois par l'IA puis conservés en base : ils sont partagés
// par tous les élèves du pays, donc une seule génération suffit.

const EXERCICES_PAR_CHAPITRE = 50;

/** Normalise les exercices d'un chapitre (même format que le front). */
/**
 * Nettoie les options d'un QCM et renvoie l'index de la bonne réponse
 * APRÈS nettoyage (une option parasite supprimée ne doit pas décaler
 * la bonne réponse).
 */
function nettoyerOptionsQcm(options, indexAttendu) {
  const source = Array.isArray(options) ? options : [];
  const kept = source
    .map((o, i) => ({ i, text: cleanQuizOption(cleanText(o, 220).replace(/^[a-dA-D]\s*[).:-]\s*/, '')) }))
    .filter(o => o.text);
  const optionsFinal = kept.map(o => o.text);
  let correctIndex = kept.findIndex(o => o.i === indexAttendu);
  if (correctIndex < 0 && optionsFinal.length) {
    correctIndex = Math.min(Math.max(indexAttendu, 0), optionsFinal.length - 1);
  }
  return { options: optionsFinal, correctIndex };
}

function normalizeChapterExercises(list, ctx) {
  const vfOptions = optionsVraiFaux(ctx);
  return (Array.isArray(list) ? list : [])
    .filter(item => item && typeof item === 'object')
    .map((item, index) => {
      const type = item.type === 'vf' ? 'vf' : 'qcm';
      const raw = cleanText(item.correctOption || '', 10).toLowerCase();
      let options;
      let correctIndex;
      if (type === 'vf') {
        options = vfOptions;
        correctIndex = estReponseFausse(raw) ? 1 : 0;
      } else {
        const attendu = /^[a-d]/.test(raw) ? raw.charCodeAt(0) - 97 : parseInt(raw, 10);
        const nettoye = nettoyerOptionsQcm(item.options, Number.isInteger(attendu) ? attendu : 0);
        options = nettoye.options;
        correctIndex = nettoye.correctIndex;
      }
      return {
        consigne: cleanText(item.consigne || `Question ${index + 1}`, 120),
        question: cleanText(item.question, 500),
        type,
        options,
        correctIndex,
        // Valeur attendue par le front (lettre pour un QCM, vrai/faux
        // pour un Vrai-Faux) : l'ordre des options reste [vrai, faux].
        correctOption: type === 'vf'
          ? (correctIndex === 1 ? 'faux' : 'vrai')
          : (Number.isInteger(correctIndex) ? String.fromCharCode(97 + correctIndex) : ''),
        explication: cleanText(item.explication || '', 600)
      };
    })
    .filter(ex => ex.question && ex.options.length >= 2
      && Number.isInteger(ex.correctIndex) && ex.correctIndex >= 0 && ex.correctIndex < ex.options.length);
}

/** Prompt de génération des exercices d'un chapitre. */
function buildChapterExercisesPrompt(chapterTitle, subjectName, niveau, serie, cours, count, ctx) {
  const context = ctx || CONTEXTS[DEFAULT_CODE];
  const textes = context.textes;
  const niveauLabel = niveau === 'bac'
    ? `Terminale (${context.libelleExamen.bac}), série ${serie || 'C'}`
    : `${context.classes.brevet} (${context.libelleExamen.brevet})`;
  const resume = String(cours || '').slice(0, 6000);
  const { labels, redaction } = libellesEcriture(context);

  return `Tu es professeur d'examens du ${textes.systemeEducatif} (${textes.programmeOfficiel}).
Prépare ${count} exercices (QCM et Vrai/Faux) sur le chapitre « ${chapterTitle} » de la matière ${subjectName}, niveau ${niveauLabel}.

${resume ? `COURS DE RÉFÉRENCE (respecte-le strictement pour les notions, formules et exemples) :\n${resume}\n` : ''}

${instructionLangue(context)}

Réponds uniquement en JSON valide, sans markdown :
{"exercices": [
  {
    "consigne": "Question 1 — ${labels.qcm}",
    "question": "${labels.enonce}",
    "type": "qcm" ou "vf",
    "options": ["a) ...", "b) ...", "c) ...", "d) ..."],
    "correctOption": "a",
    "explication": "${labels.explication}"
  }
]}

Contraintes :
- Exactement ${count} exercices, numérotés dans "consigne" (Question 1, Question 2, …).
- Pour un Vrai/Faux, la consigne indique « ${labels.vf} » et "options" contient uniquement ${JSON.stringify(optionsVraiFaux(context))}.
- Les exercices doivent porter UNIQUEMENT sur ce chapitre, avec le niveau réel des ${textes.examens}.
- Jamais d'indice dans les options (pas de "Correct" ni "Bonne réponse").
- Chaque "explication" doit justifier la réponse en 1 à 3 phrases.
- Rédige l'intégralité des exercices en ${redaction} : consignes, énoncés, options et explications.`;
}

/** Lit les exercices déjà enregistrés pour un chapitre. */
async function readChapterExercises(chapterId, chapterTitle, subjectName, niveau, serie, ctx) {
  const select = 'exercices,title,subjects(name,niveau_code,serie_code)';
  let rows = null;
  if (chapterId) {
    rows = await payments.supabaseRestGet(
      `/rest/v1/chapters?slug=eq.${encodeURIComponent(chapterId)}&select=${select}&limit=1`
    );
  }
  if (!Array.isArray(rows) || !rows.length) {
    const titre = encodeURIComponent(chapterTitle);
    const sujet = encodeURIComponent(subjectName);
    rows = await payments.supabaseRestGet(
      `/rest/v1/chapters?title=eq.${titre}&pays=eq.${encodeURIComponent(ctx.code)}&select=${select}&limit=5`
    );
    if (Array.isArray(rows) && rows.length) {
      rows = rows.filter(r => {
        const s = r.subjects || {};
        if (s.niveau_code && s.niveau_code !== niveau) return false;
        if (serie && s.serie_code && s.serie_code !== serie) return false;
        if (s.name && subjectName && s.name !== subjectName) return false;
        return true;
      });
    }
  }
  const row = Array.isArray(rows) && rows.length ? rows[0] : null;
  if (!row || !Array.isArray(row.exercices) || !row.exercices.length) return null;
  const list = row.exercices
    .filter(ex => ex && typeof ex === 'object')
    .map((ex, i) => ({
      consigne: cleanText(ex.consigne || `Question ${i + 1}`, 120),
      question: cleanText(ex.question, 500),
      type: ex.type === 'vf' ? 'vf' : 'qcm',
      options: Array.isArray(ex.options) ? ex.options.map(o => cleanText(o, 200)).filter(Boolean) : [],
      correctIndex: Number.isInteger(ex.correctIndex) ? ex.correctIndex : parseInt(ex.correctOption, 10),
      explication: cleanText(ex.explication || '', 600)
    }))
    .filter(ex => ex.question && ex.options.length >= 2
      && Number.isInteger(ex.correctIndex) && ex.correctIndex >= 0 && ex.correctIndex < ex.options.length)
    .map(ex => ({
      ...ex,
      correctOption: ex.type === 'vf'
        ? (ex.correctIndex === 1 ? 'faux' : 'vrai')
        : String.fromCharCode(97 + ex.correctIndex)
    }));
  return list.length ? list : null;
}

/** Enregistre les exercices d'un chapitre (nécessite la clé service_role). */
async function saveChapterExercises(chapterId, chapterTitle, subjectName, niveau, serie, exercices, ctx) {
  if (!exercices || !exercices.length) return false;
  let endpoint = '';
  if (chapterId) {
    const bySlug = await payments.supabaseRestGet(
      `/rest/v1/chapters?slug=eq.${encodeURIComponent(chapterId)}&select=id&limit=1`
    );
    if (Array.isArray(bySlug) && bySlug.length) {
      endpoint = `/rest/v1/chapters?id=eq.${encodeURIComponent(bySlug[0].id)}`;
    }
  }
  if (!endpoint) {
    // Sans slug connu, on cible le chapitre de CETTE matière uniquement :
    // un même titre peut exister dans d'autres matières ou d'autres pays.
    const subjects = await payments.supabaseRestGet(
      `/rest/v1/subjects?code=eq.${encodeURIComponent(slugMatiere(subjectName))}`
      + `&niveau_code=eq.${encodeURIComponent(niveau)}`
      + `&serie_code=eq.${encodeURIComponent(serie || 'C')}`
      + `&pays=eq.${encodeURIComponent(ctx.code)}`
      + `&select=id&limit=1`
    );
    if (!Array.isArray(subjects) || !subjects.length) return false;
    endpoint = `/rest/v1/chapters?subject_id=eq.${encodeURIComponent(subjects[0].id)}`
      + `&title=eq.${encodeURIComponent(chapterTitle)}`;
  }
  const res = await payments.supabaseRestWrite(endpoint, 'PATCH', { exercices });
  return res.ok;
}

/**
 * POST /v1/ai/chapter-exercises
 * Retourne 50 QCM / Vrai-Faux pour un chapitre, générés par l'IA une
 * première fois puis conservés en base (partagés par tous les élèves).
 */
async function handleChapterExercises(req, res) {
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
  const chapterTitle = cleanText(body.chapterTitle, 180);
  const chapterId = cleanText(body.chapterId || '', 160);
  const cours = cleanText(body.cours || '', 20000);
  const ctx = contextFromRequest(req, body);
  const wanted = Math.min(Math.max(parseInt(body.count, 10) || EXERCICES_PAR_CHAPITRE, 5), 60);

  if (!chapterTitle || !['bac', 'brevet'].includes(niveau)) {
    sendJson(res, 400, { success: false, error: 'Paramètres invalides' });
    return;
  }

  // 1. Exercices déjà calculés : on les renvoie (aucun appel IA)
  const cacheKey = `ex:${ctx.code}:${niveau}:${serie}:${subjectName}:${chapterId || chapterTitle}`.toLowerCase();
  const cachedMemoire = courseCacheGet(cacheKey);
  if (cachedMemoire && cachedMemoire.length >= Math.ceil(wanted * 0.8)) {
    sendJson(res, 200, { success: true, exercices: cachedMemoire.slice(0, wanted), cached: true });
    return;
  }
  const cached = await readChapterExercises(chapterId, chapterTitle, subjectName, niveau, serie, ctx);
  if (cached && cached.length >= Math.ceil(wanted * 0.8)) {
    courseCacheSet(cacheKey, cached);
    sendJson(res, 200, { success: true, exercices: cached.slice(0, wanted), cached: true });
    return;
  }
  const sendCached = () => {
    if (!cached || !cached.length) return false;
    sendJson(res, 200, { success: true, exercices: cached.slice(0, wanted), cached: true });
    return true;
  };

  // Repli sans IA : pas d'erreur HTTP — le front conserve sa banque
  // locale d'exercices (déjà affichée) et l'indique à l'élève.
  const sendLocal = (raison, retryDansSecondes) => {
    sendJson(res, 200, {
      success: true,
      exercices: [],
      local: true,
      quotaExhausted: raison === 'quota',
      raison,
      retryDansSecondes
    });
  };

  // 1b. Cache durable (disque) : les 50 exercices d'un chapitre restent
  //     disponibles après un redémarrage, sans consommer de quota.
  const cleDisque = `exos:${cacheKey}`;
  const depuisDisque = cacheDisque.get(cleDisque);
  if (depuisDisque && depuisDisque.length >= Math.ceil(wanted * 0.8)) {
    courseCacheSet(cacheKey, depuisDisque);
    sendJson(res, 200, { success: true, exercices: depuisDisque.slice(0, wanted), cached: true, source: 'cache' });
    return;
  }

  if (!GEMINI_API_KEYS.length || isAiKeyBlocked()) {
    if (sendCached()) return;
    sendLocal('ia-absente');
    return;
  }

  // 2. Génération par l'IA
  const prompt = buildChapterExercisesPrompt(chapterTitle, subjectName, niveau, serie, cours, wanted, ctx);
  const result = await callGemini({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.5, maxOutputTokens: 32768, responseMimeType: 'application/json' }
  }, GEMINI_TIMEOUT_COURSE_MS, 180000);

  if (!result.ok) {
    if (sendCached()) return;
    sendLocal(result.quotaExhausted ? 'quota' : 'generation-failed', result.retryDansSecondes);
    return;
  }

  let exercices = [];
  try {
    const parsed = extractJson(result.data?.candidates?.[0]?.content?.parts?.[0]?.text || '');
    exercices = normalizeChapterExercises(parsed.exercices, ctx);
  } catch (e) {
    console.warn('Exercices du chapitre : JSON inexploitable', e.message);
  }
  if (!exercices.length) {
    if (sendCached()) return;
    sendLocal('aucun-exercice');
    return;
  }

  // 2b. Complément si l'IA n'a pas livré assez d'exercices en un seul appel
  const seuilComplement = Math.ceil(wanted * 0.8);
  if (exercices.length < seuilComplement) {
    const missing = wanted - exercices.length;
    try {
      const dejaVues = new Set(
        exercices.map(e => (e.question || '').toLowerCase().trim()).filter(Boolean)
      );
      const complementPrompt = buildChapterExercisesPrompt(
        chapterTitle, subjectName, niveau, serie, cours, missing, ctx
      ) + `\n\nIMPORTANT : ce sont des exercices ADDITIONNELS (questions ${exercices.length + 1} à ${wanted}).`
        + ` N'écris AUCUNE des questions déjà proposées ci-dessous.\n`
        + `Questions déjà proposées (à ne pas répéter) :\n`
        + Array.from(dejaVues).slice(0, 40).map((q, i) => `${i + 1}. ${q}`).join('\n') + '\n';
      const res2 = await callGemini({
        contents: [{ parts: [{ text: complementPrompt }] }],
        generationConfig: { temperature: 0.6, maxOutputTokens: 32768, responseMimeType: 'application/json' }
      }, GEMINI_TIMEOUT_COURSE_MS, 90000);

      if (res2.ok) {
        const parsed2 = extractJson(res2.data?.candidates?.[0]?.content?.parts?.[0]?.text || '');
        const extra = normalizeChapterExercises(parsed2.exercices, ctx)
          .filter(e => e.question && !dejaVues.has(e.question.toLowerCase().trim()));
        if (extra.length) {
          exercices = exercices.concat(extra).slice(0, wanted);
        }
      }
    } catch (e) {
      console.warn('Complément exercices du chapitre:', e.message);
    }
  }

  // Plafonnement à la quantité demandée
  exercices = exercices.slice(0, wanted);

  // 3. Conservation en base (silencieuse si la clé service_role manque)
  try {
    await saveChapterExercises(chapterId, chapterTitle, subjectName, niveau, serie, exercices, ctx);
  } catch (e) {
    console.warn('Enregistrement des exercices du chapitre:', e.message);
  }

  // 4. Mémoire : évite de régénérer le même chapitre pour d'autres élèves
  //    tant que la clé service_role n'est pas configurée.
  courseCacheSet(cacheKey, exercices);
  // Cache durable : la banque d'exercices survit au redémarrage.
  cacheDisque.set(cleDisque, exercices);

  sendJson(res, 200, { success: true, exercices, cached: false, demande: wanted });
}

/**
 * Libellés Vrai / Faux dans la langue du pays de l'apprenant.
 * L'ordre est toujours [vrai, faux] : l'index de la bonne réponse
 * reste stable quelle que soit la langue.
 */
function optionsVraiFaux(ctx) {
  const context = ctx || CONTEXTS[DEFAULT_CODE];
  switch (context.langue) {
    case 'en': return ['True', 'False'];
    case 'ar': return ['صح', 'خطأ'];
    case 'pt': return ['Verdadeiro', 'Falso'];
    case 'es': return ['Verdadero', 'Falso'];
    case 'it': return ['Vero', 'Falso'];
    case 'ru': return ['Верно', 'Неверно'];
    case 'zh': return ['正确', '错误'];
    default: return ['Vrai', 'Faux'];
  }
}

/** La réponse désigne-t-elle l'option « faux » ? */
function estReponseFausse(raw) {
  const v = String(raw || '').trim().toLowerCase();
  if (!v) return false;
  if (/^f/.test(v)) return true;                       // faux, false, falso
  if (/^(неверно|خطأ|错误)/.test(v)) return true;
  if (/^(b|1)$/.test(v)) return true;                  // « b) Faux » / index 1
  return false;
}

function normalizeQuestions(list, ctx) {
  return (Array.isArray(list) ? list : [])
    .filter(item => item && typeof item === 'object')
    .map(item => {
      const type = item.type === 'vf' ? 'vf' : 'qcm';
      const raw = cleanText(item.correctOption || '', 10).toLowerCase();
      let options;
      let correctIndex;
      if (type === 'vf') {
        options = optionsVraiFaux(ctx);
        correctIndex = estReponseFausse(raw) ? 1 : 0;
      } else {
        const attendu = /^[a-d]/.test(raw) ? raw.charCodeAt(0) - 97 : parseInt(raw, 10);
        const nettoye = nettoyerOptionsQcm(item.options, Number.isInteger(attendu) ? attendu : 0);
        options = nettoye.options;
        correctIndex = nettoye.correctIndex;
      }
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

/**
 * Slug stable et unique d'un chapitre (par pays / niveau / série / matière).
 * Le même chapitre généré par l'IA retrouve toujours sa ligne en base.
 */
function slugChapitre(ctx, niveau, serie, subjectName, num, titre) {
  const base = slugify(titre) || 'chapitre';
  const mat = slugify(subjectName) || 'matiere';
  return [ctx.code.toLowerCase(), niveau, (serie || 'c').toLowerCase(), mat, String(num).padStart(3, '0'), base]
    .join('_')
    .slice(0, 180);
}

/** Slug canonique d'une matière (identique en base et côté API). */
function slugMatiere(subjectName) {
  return slugify(subjectName) || 'matiere';
}

/**
 * Lit les chapitres déjà enregistrés en base pour ce pays / niveau / série /
 * matière. C'est la source de vérité en ligne : le cours est partagé par
 * tous les élèves et n'est jamais régénéré.
 */
async function readCourseChapters(subjectName, niveau, serie, ctx) {
  const subjects = await payments.supabaseRestGet(
    `/rest/v1/subjects?code=eq.${encodeURIComponent(slugMatiere(subjectName))}`
    + `&niveau_code=eq.${encodeURIComponent(niveau)}`
    + `&serie_code=eq.${encodeURIComponent(serie || 'C')}`
    + `&pays=eq.${encodeURIComponent(ctx.code)}`
    + `&select=id&limit=1`
  );
  if (!Array.isArray(subjects) || !subjects.length) return null;
  const subjectId = subjects[0].id;

  const rows = await payments.supabaseRestGet(
    `/rest/v1/chapters?subject_id=eq.${encodeURIComponent(subjectId)}`
    + `&select=slug,num,title,sa_label,cours,exemple_titre,exemple_enonce,exemple_solution,is_free,price`
    + `&order=num.asc`
  );
  if (!Array.isArray(rows) || !rows.length) return null;

  return rows.map((row, index) => {
    const isFree = row.is_free !== false && index < 3;
    return {
      id: row.slug,
      num: Number(row.num) || (index + 1),
      sa: row.sa_label || null,
      title: cleanText(row.title, 180),
      niveau,
      subject: subjectName,
      // Le Brevet (3ème) est commun : pas de série.
      serie: niveau === 'brevet' ? null : (serie || null),
      isFree,
      price: isFree ? 0 : (Number(row.price) || (niveau === 'brevet' ? 100 : 150)),
      cours: cleanText(row.cours, 6000),
      exemple: {
        titre: cleanText(row.exemple_titre, 120) || 'Exemple guidé',
        enonce: cleanText(row.exemple_enonce, 1000) || 'Énoncé type examen.',
        solution: cleanText(row.exemple_solution, 1800) || 'Correction détaillée.'
      },
      exemple_source: 'base'
    };
  });
}

/**
 * Enregistre les chapitres générés par l'IA : ils deviennent le cours
 * officiel du pays (même contenu pour tous les élèves, plus de régénération).
 */
async function saveCourseChapters(subjectName, niveau, serie, ctx, chapitres) {
  if (!Array.isArray(chapitres) || !chapitres.length) return false;

  // 1. La matière (avec son pays) : créée une fois
  const code = slugMatiere(subjectName);
  const existing = await payments.supabaseRestGet(
    `/rest/v1/subjects?code=eq.${encodeURIComponent(code)}`
    + `&niveau_code=eq.${encodeURIComponent(niveau)}`
    + `&serie_code=eq.${encodeURIComponent(serie || 'C')}`
    + `&pays=eq.${encodeURIComponent(ctx.code)}`
    + `&select=id&limit=1`
  );

  let subjectId = (Array.isArray(existing) && existing.length) ? existing[0].id : null;
  if (!subjectId) {
    const created = await payments.supabaseRestWrite('/rest/v1/subjects', 'POST', {
      code,
      name: subjectName,
      icon: '📘',
      niveau_code: niveau,
      serie_code: serie || 'C',
      display_order: 0,
      published: true,
      pays: ctx.code
    });
    if (!created.ok) {
      // Colonne `pays` absente (migration non appliquée) ou clé service
      // manquante : le cours reste utilisable, il ne sera pas partagé.
      console.warn('Matière non enregistrée (colonne pays / clé service ?):', created.error);
      return false;
    }
    const refetch = await payments.supabaseRestGet(
      `/rest/v1/subjects?code=eq.${encodeURIComponent(code)}`
      + `&niveau_code=eq.${encodeURIComponent(niveau)}`
      + `&serie_code=eq.${encodeURIComponent(serie || 'C')}`
      + `&pays=eq.${encodeURIComponent(ctx.code)}`
      + `&select=id&limit=1`
    );
    subjectId = (Array.isArray(refetch) && refetch.length) ? refetch[0].id : null;
    if (!subjectId) return false;
  }

  // 2. Les chapitres
  for (let i = 0; i < chapitres.length; i++) {
    const ch = chapitres[i];
    const num = Number(ch.num) || (i + 1);
    const slug = slugChapitre(ctx, niveau, serie, subjectName, num, ch.title);
    const ex = ch.exemple || {};
    const body = {
      slug,
      subject_id: subjectId,
      num,
      title: cleanText(ch.title, 180),
      sa_label: cleanText(ch.sa || '', 20) || null,
      is_free: ch.isFree !== false,
      price: Number(ch.price) || 0,
      cours: cleanText(ch.cours, 6000),
      exemple_titre: cleanText(ex.titre, 120),
      exemple_enonce: cleanText(ex.enonce, 1000),
      exemple_solution: cleanText(ex.solution, 1800),
      published: true,
      pays: ctx.code
    };
    const write = await payments.supabaseRestWrite(
      '/rest/v1/chapters?on_conflict=subject_id,num',
      'POST',
      body,
      { prefer: 'resolution=merge-duplicates,return=minimal' }
    );
    if (!write.ok) {
      console.warn('Chapitre non enregistré:', write.error);
      return false;
    }
  }
  return true;
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
    ? body.parts
        .filter(part => part && typeof part === 'object')
        .slice(0, 40)
        .map(part => ({
          sa: cleanText(part.sa, 20),
          num: Number(part.num) || 0,
          titre: cleanText(part.titre, 180),
          chapitres: Array.isArray(part.chapitres)
            ? part.chapitres.map(c => cleanText(c, 180)).filter(Boolean).slice(0, 40)
            : []
        }))
        .filter(part => part.titre || part.chapitres.length)
    : [];

  if (!subjectName || !['bac', 'brevet'].includes(niveau)) {
    sendJson(res, 400, { success: false, error: 'Paramètres invalides' });
    return;
  }

  const ctx = contextFromRequest(req, body);
  const ent = await getEntitlements(req);
  // Seul l'admin peut imposer une structure : pour les élèves, le cours
  // suit toujours le programme officiel enregistré (et reste partagé).
  const isAdmin = Boolean(ent && ent.isAdmin);
  const sequences = isAdmin ? requestedSequences : [];
  const parts = isAdmin ? requestedParts : [];
  const isCustom = sequences.length > 0 || parts.length > 0;
  const send = (chapitres, extra) => sendJson(res, 200, {
    success: true,
    chapitres: protectChapters(chapitres, niveau, ent),
    ...extra
  });

  const cacheKey = `${ctx.code}:${niveau}:${serie}:${subjectName}:${sequences.join('|')}:${JSON.stringify(parts)}`.toLowerCase();
  const cachedChapters = courseCacheGet(cacheKey);
  if (cachedChapters) {
    send(cachedChapters, { cached: true });
    return;
  }

  // 1. La base d'abord : le cours officiel du pays, partagé par tous les
  //    élèves, jamais régénéré.
  if (!isCustom) {
    const fromDb = await readCourseChapters(subjectName, niveau, serie, ctx);
    if (fromDb && fromDb.length) {
      courseCacheSet(cacheKey, fromDb);
      send(fromDb, { cached: true, source: 'base' });
      return;
    }
  }

  // 1b. Cache durable (disque) : un cours déjà généré reste disponible
  //     après un redémarrage de l'instance — et ne coûte aucun quota.
  const cleDisque = `cours:${cacheKey}`;
  const depuisDisque = cacheDisque.get(cleDisque);
  if (depuisDisque && depuisDisque.length) {
    courseCacheSet(cacheKey, depuisDisque);
    send(depuisDisque, { cached: true, source: 'cache' });
    return;
  }

  // Repli sans IA : on rend un cours local (programme du pays) plutôt
  // qu'une erreur 502. Le site reste utilisable, le contenu détaillé
  // arrive plus tard, quand le quota se libère.
  const repliLocal = (raison, retryDansSecondes) => {
    const local = construireCoursLocal(subjectName, niveau, serie, ctx);
    if (!local.length) return false;
    courseCacheSet(cacheKey, local);
    send(local, { cached: false, source: 'local', quotaExhausted: raison === 'quota', raison, retryDansSecondes });
    return true;
  };

  if (!GEMINI_API_KEYS.length) {
    if (repliLocal('ia-absente')) return;
    sendJson(res, 503, { success: false, code: 'AI_NOT_CONFIGURED', error: 'GEMINI_API_KEY non configurée' });
    return;
  }
  if (isAiKeyBlocked()) {
    if (repliLocal('cle-refusee')) return;
    sendJson(res, 503, { success: false, code: 'AI_KEY_INVALID', error: 'Service IA indisponible (clé API refusée par Google)' });
    return;
  }

  try {
    const coursePrompt = await buildCoursePrompt({ subjectName, niveau, serie, sequences, parts, ctx });

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
        if (result.quotaExhausted) {
          // Quota épuisé : repli local immédiat, aucune erreur pour l'élève.
          console.warn('Quota IA épuisé — cours local renvoyé (repli sans IA)');
          if (repliLocal('quota', result.retryDansSecondes)) return;
        }
        if (result.invalidKey) {
          if (repliLocal('cle-refusee')) return;
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
        chapitres = normalizeChapters(parsed.chapitres, niveau, subjectName, serie);
      } catch (parseError) {
        lastError = `JSON inexploitable: ${parseError.message}`;
        console.error('Gemini generate-course', lastError);
      }
    }

    if (!chapitres.length) {
      // Repli local : mieux vaut un cours structuré qu'une page d'erreur.
      if (repliLocal('generation-failed')) return;
      sendJson(res, 502, { success: false, error: 'Réponse Gemini vide ou invalide', detail: lastError });
      return;
    }

    // Identifiants stables (ceux de la base) : un déblocage reste valable
    // quand le cours est ensuite relu depuis la base.
    chapitres = chapitres.map(ch => ({
      ...ch,
      id: slugChapitre(ctx, niveau, serie, subjectName, ch.num, ch.title)
    }));

    courseCacheSet(cacheKey, chapitres);
    // Cache durable : le cours survit au redémarrage de l'instance et ne
    // sera plus régénéré (donc plus de quota dépensé) au prochain élève.
    cacheDisque.set(cleDisque, chapitres);

    // Enregistrement en base : le cours devient celui du pays (une seule
    // génération, même contenu pour tous les élèves du pays).
    try {
      const saved = await saveCourseChapters(subjectName, niveau, serie, ctx, chapitres);
      if (saved) console.log(`[Cours] ${chapitres.length} chapitre(s) enregistrés pour ${ctx.code} / ${subjectName}`);
    } catch (e) {
      console.warn('Enregistrement du cours impossible:', e.message);
    }

    send(chapitres, { cached: false, source: 'ia' });
  } catch (error) {
    console.error('Erreur Gemini:', error.message);
    if (repliLocal('erreur')) return;
    sendJson(res, 502, { success: false, error: 'Génération impossible' });
  }
}

// Limite anti-abus : le quota Gemini est partagé par tous les élèves.
const CHAT_LIMIT = 20;
const CHAT_WINDOW_MS = 10 * 60 * 1000;
const chatHits = new Map();

function chatRateLimited(req) {
  const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  const ip = forwarded || req.socket.remoteAddress || 'inconnu';
  const now = Date.now();
  const hits = (chatHits.get(ip) || []).filter(t => now - t < CHAT_WINDOW_MS);
  if (hits.length >= CHAT_LIMIT) {
    chatHits.set(ip, hits);
    return true;
  }
  hits.push(now);
  chatHits.set(ip, hits);
  if (chatHits.size > 5000) {
    for (const [key, list] of chatHits) {
      if (!list.length || now - list[list.length - 1] > CHAT_WINDOW_MS) chatHits.delete(key);
    }
  }
  return false;
}

function chatHistory(raw) {
  if (!Array.isArray(raw)) return [];
  const turns = raw
    .slice(-6)
    .map(turn => ({
      role: turn && turn.role === 'bot' ? 'model' : 'user',
      text: String((turn && turn.text) || '').trim().slice(0, 1500)
    }))
    .filter(turn => turn.text);
  // Gemini exige une conversation qui commence par l'élève et alterne les rôles.
  while (turns.length && turns[0].role !== 'user') turns.shift();
  const alternated = [];
  for (const turn of turns) {
    const last = alternated[alternated.length - 1];
    if (last && last.role === turn.role) last.text += `\n${turn.text}`;
    else alternated.push({ ...turn });
  }
  if (alternated.length && alternated[alternated.length - 1].role === 'user') alternated.pop();
  return alternated.map(turn => ({ role: turn.role, parts: [{ text: turn.text }] }));
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
  if (chatRateLimited(req)) {
    sendJson(res, 429, { success: false, code: 'CHAT_RATE_LIMIT', error: 'Trop de questions en peu de temps. Patiente quelques minutes.' });
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
    const systemPrompt = `Tu es l'assistant et tuteur pédagogique d'excellence Revizy pour les élèves ${ctx.textes.paysLocution} (${ctx.nom}).
Tu dois respecter STRICTEMENT le ${ctx.textes.systemeEducatif} et le ${ctx.textes.programmeOfficiel} pour le niveau : ${niveau}.
Tous tes conseils, définitions, théorèmes, démarches et méthodes de rédaction doivent être rigoureusement conformes aux exigences officielles des examens nationaux ${ctx.textes.paysLocution} (${ctx.textes.credential || ctx.textes.examens}).
Règles pédagogiques à respecter :
1. Réponds de manière concise, bienveillante, progressive et limpide.
2. Détaille chaque étape de calcul ou de raisonnement, en explicitant les formules clés.
3. Fournis des exemples concrets et résolus adaptés aux réalités de l'apprenant ${ctx.textes.paysLocution} (ex: monnaie ${ctx.devise}, repères géographiques, économiques et historiques locaux).
4. Reste TOUJOURS strictement fidèle au programme scolaire officiel ${ctx.textes.paysLocution}.
5. Écris les formules en texte simple lisible (x², √, ×, ÷, ≤, π, fractions a/b), sans LaTeX ni symboles $, et sans tableaux.
6. Si la question n'a aucun rapport avec les études ou le site Revizy, ramène poliment l'élève vers ses révisions.
${instructionLangue(ctx)}`;

    const result = await callGemini({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [
        ...chatHistory(body.history),
        { role: 'user', parts: [{ text: prompt }] }
      ],
      generationConfig: {
        temperature: 0.5,
        maxOutputTokens: 1500
      }
    });

    const data = result.data;
    const replyText = (data && data.candidates?.[0]?.content?.parts || [])
      .filter(part => part && part.text && !part.thought)
      .map(part => part.text)
      .join('')
      .trim();
    if (result.ok && replyText) {
      sendJson(res, 200, { success: true, reply: replyText });
    } else if (result.ok) {
      sendJson(res, 200, { success: true, reply: "Je ne peux pas répondre à cette question. Reformule-la ou pose-moi une question sur tes cours." });
    } else if (result.invalidKey) {
      sendJson(res, 503, { success: false, code: 'AI_KEY_INVALID', error: 'Service IA indisponible (clé API refusée par Google)' });
    } else if (result.quotaExhausted) {
      // Quota épuisé : le front bascule sur la fiche de secours locale.
      sendJson(res, 503, {
        success: false,
        code: 'AI_QUOTA',
        quotaExhausted: true,
        retryDansSecondes: result.retryDansSecondes || null,
        error: 'Quotidien IA atteint : fiche de révision locale servie'
      });
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

// Seuls ces fichiers sont publics : code serveur, schémas SQL, .env, .git,
// node_modules et outils ne doivent jamais être servis.
const PUBLIC_FILES = new Set([
  '/index.html',
  '/app.js',
  '/config.js',
  '/contexts.js',
  '/style.css',
  '/site.webmanifest',
  '/favicon.ico',
  '/favicon.svg',
  '/favicon-16.png',
  '/favicon-32.png',
  '/apple-touch-icon.png',
  '/icon-192.png',
  '/icon-512.png'
]);

function serveStatic(req, res) {
  let rawPath;
  try {
    rawPath = decodeURIComponent((req.url || '/').split('?')[0]);
  } catch (_) {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Requête invalide');
    return;
  }
  const publicPath = rawPath === '/' ? '/index.html' : rawPath;

  if (!PUBLIC_FILES.has(publicPath)) {
    // Un fichier attendu (avec extension) mais non public renvoie un vrai 404.
    // Sinon on retombe sur la SPA (routage côté client).
    if (path.extname(publicPath)) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 — fichier introuvable');
      return;
    }
  }

  const filePath = PUBLIC_FILES.has(publicPath)
    ? path.join(ROOT, publicPath)
    : path.join(ROOT, 'index.html');
  const ext = path.extname(filePath).toLowerCase();
  const type = MIME[ext] || 'application/octet-stream';

  fs.readFile(filePath, (readErr, data) => {
    if (readErr) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 — fichier introuvable');
      return;
    }
    res.writeHead(200, { 'Content-Type': type, 'X-Content-Type-Options': 'nosniff' });
    res.end(data);
  });
}

/**
 * État du budget IA interne (toutes clés API confondues).
 * Le quota gratuit Google n'étant pas extensible, c'est ce plafond que le
 * serveur s'applique réellement — bien en dessous des 20 req/jour de Google.
 */
function etatQuotaIA() {
  const etats = Array.from(budgetsIA.values()).map(b => b.etat());
  const parModele = {};
  etats.forEach(e => {
    Object.keys(e.parModele).forEach(m => {
      parModele[m] = (parModele[m] || 0) + e.parModele[m];
    });
  });
  const utilise = etats.reduce((s, e) => s + e.utilise, 0);
  const budgetTotal = etats.length ? etats[0].budgetTotal : AI_BUDGET_QUOTIDIEN;
  return {
    utilise,
    budgetTotal,
    restant: Math.max(0, budgetTotal - utilise),
    budgetParModele: AI_BUDGET_PAR_MODELE,
    budgetParModeleLite: AI_BUDGET_PAR_MODELE_LITE,
    parModele,
    fenetreHeures: 24,
    sante: budgetIASante.etat()
  };
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
  // Le test forcé consomme le quota IA : réservé à l'admin.
  let force = false;
  if (/[?&]force=1/.test(req.url || '')) {
    const ent = await getEntitlements(req);
    force = Boolean(ent && ent.isAdmin);
  }
  if (!force && aiHealthCache && Date.now() - aiHealthCacheAt < AI_HEALTH_TTL_MS) {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify(aiHealthCache));
    return;
  }

  if (!GEMINI_API_KEYS.length) {
    sendJson(res, 200, {
      success: false,
      configured: false,
      message: 'GEMINI_API_KEY absente des variables d’environnement',
      // Le site reste utilisable (repli local) : on l'annonce aussi.
      quota: { ...etatQuotaIA(), limiteParJourParModele: 20 }
    });
    return;
  }
  const apiKey = GEMINI_API_KEYS[0];

  const models = [GEMINI_MODEL, ...GEMINI_FALLBACK_MODELS].filter(Boolean);
  const tests = [];
  // Le diagnostic consomme du quota Google : on s'arrête au premier modèle
  // qui répond et on ne teste jamais plus de 3 modèles par appel.
  const MAX_TESTS_SANTE = 3;

  for (const model of models) {
    if (tests.length >= MAX_TESTS_SANTE) break;
    if (tests.some(t => t.ok)) break; // un modèle répond : inutile de tester les autres
    const autorisation = budgetIASante.autorise(model);
    if (!autorisation.ok) {
      tests.push({
        model,
        ok: false,
        status: 0,
        ms: 0,
        code: 'budget-diagnostic',
        raison: 'Budget du diagnostic épuisé (le quota Google n\'est pas extensible)',
        teste: false
      });
      break;
    }
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
    // Commit déployé (fourni par Render) : indispensable pour savoir
    // quelle version tourne réellement en production.
    version: process.env.RENDER_GIT_COMMIT || process.env.APP_VERSION || 'inconnue',
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
        retryDans: retry ? `${Math.floor(retry / 3600)} h ${Math.floor((retry % 3600) / 60)} min` : null,
        // Budget réellement appliqué par le serveur (le quota n'est pas extensible)
        ...etatQuotaIA()
      };
    })(),
    paiements: {
      cleServiceSupabase: hasServiceKey,
      cleFedaPay: hasFedapaySecret,
      // Sans ce secret, FedaPay ne peut pas notifier le serveur (webhook refusé).
      // Le flux principal (retour de paiement + vérification serveur) reste actif.
      secretWebhook: Boolean(process.env.FEDAPAY_WEBHOOK_SECRET),
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
// La colonne « cours » est protégée : on ne la demande que si la clé utilisée
// a le droit de la lire (clé service), sinon on dégrade proprement.
async function fetchPublishedChapters(ctx) {
  const base = 'slug,title,sa_label,num,price,is_free,published,pays';
  const tries = [
    `${base},cours,subjects(name,niveau_code,serie_code)`,
    `${base},subjects(name,niveau_code,serie_code)`
  ];
  for (const select of tries) {
    let rows = await payments.supabaseRestGet(
      `/rest/v1/chapters?select=${select}&published=eq.true&pays=eq.${ctx.code}&limit=500`
    );
    if (Array.isArray(rows)) return rows;
  }
  // Repli : le filtre « pays » n'est pas disponible en base.
  const select = `${base},subjects(name,niveau_code,serie_code)`;
  let rows = await payments.supabaseRestGet(
    `/rest/v1/chapters?select=${select}&published=eq.true&limit=500`
  );
  if (!Array.isArray(rows)) return [];
  // Cloisonnement : on ne garde que les chapitres du pays demandé.
  return rows.filter(r => !r.pays || r.pays === ctx.code);
}

// Un chapitre précis (avec son contenu) pour un pays donné.
async function fetchChapterDetail(slug, ctx) {
  const base = 'slug,title,sa_label,num,price,is_free,published,pays';
  const withContent = `${base},cours,subjects(name,niveau_code,serie_code)`;
  const withoutContent = `${base},subjects(name,niveau_code,serie_code)`;
  const tries = [withContent, withoutContent];
  for (const select of tries) {
    let rows = await payments.supabaseRestGet(
      `/rest/v1/chapters?slug=eq.${encodeURIComponent(slug)}&published=eq.true&pays=eq.${ctx.code}&select=${select}&limit=1`
    );
    if (Array.isArray(rows)) return rows;
  }
  let rows = await payments.supabaseRestGet(
    `/rest/v1/chapters?slug=eq.${encodeURIComponent(slug)}&published=eq.true&select=${withoutContent}&limit=1`
  );
  if (!Array.isArray(rows)) return [];
  return rows.filter(r => !r.pays || r.pays === ctx.code);
}

// ── Endpoint : Récupérer les chapitres pour un étudiant (filtré par pays, classe, série) ──
async function handleGetChaptersForStudent(req, res) {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const niveau = sanitizeString(url.searchParams.get('niveau') || '', 10);
    const pays = sanitizeString(url.searchParams.get('pays') || '', 3);
    const classe = sanitizeString(url.searchParams.get('classe') || '', 20);
    const serie = sanitizeString(url.searchParams.get('serie') || '', 3);
    const subjectId = sanitizeString(url.searchParams.get('subject_id') || '', 50);

    // Validation stricte
    if (!validateNiveau(niveau)) {
      sendJson(res, 400, { success: false, error: 'niveau invalide (bac ou brevet)' });
      return;
    }
    if (pays && !validatePaysCode(pays)) {
      sendJson(res, 400, { success: false, error: 'code pays invalide' });
      return;
    }
    if (classe && !validateClasse(classe)) {
      sendJson(res, 400, { success: false, error: 'classe invalide' });
      return;
    }
    if (serie && !validateSerie(serie)) {
      sendJson(res, 400, { success: false, error: 'série invalide' });
      return;
    }
    if (subjectId && !validateUuid(subjectId)) {
      sendJson(res, 400, { success: false, error: 'subject_id invalide' });
      return;
    }

    const rows = await supabaseFetch('/rest/v1/rpc/get_chapters_for_student', {
      p_niveau: niveau,
      p_pays: pays || null,
      p_classe: classe || null,
      p_serie: serie || null,
      p_subject_id: subjectId || null
    });

    if (!Array.isArray(rows)) {
      sendJson(res, 500, { success: false, error: 'Erreur de récupération des chapitres' });
      return;
    }

    sendJson(res, 200, { success: true, chapters: rows });
  } catch (error) {
    console.error('handleGetChaptersForStudent error:', error);
    sendJson(res, 500, { success: false, error: 'Erreur interne du serveur' });
  }
}

// ── Épreuves : catalogue public (sujets gratuits, corrigés payants) ──
async function handleGetEpreuves(req, res) {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const filtres = {
      pays: sanitizeString(url.searchParams.get('pays') || '', 3).toUpperCase(),
      niveau: sanitizeString(url.searchParams.get('niveau') || '', 10).toLowerCase(),
      classe: sanitizeString(url.searchParams.get('classe') || '', 10),
      serie: sanitizeString(url.searchParams.get('serie') || '', 10),
      matiere: sanitizeString(url.searchParams.get('matiere') || '', 60),
      type: sanitizeString(url.searchParams.get('type') || '', 10),
      annee: sanitizeString(url.searchParams.get('annee') || '', 4)
    };
    if (filtres.pays && !validatePaysCode(filtres.pays)) {
      sendJson(res, 400, { success: false, error: 'code pays invalide' });
      return;
    }
    if (filtres.niveau && !validateNiveau(filtres.niveau)) {
      sendJson(res, 400, { success: false, error: 'niveau invalide (bac ou brevet)' });
      return;
    }

    const entitlements = await getEntitlements(req);
    const rows = await epreuves.listerEpreuves(filtres, { restGet: payments.supabaseRestGet });

    // Les corrections (solution rédigée) sont jointes à part : elles ne sont
    // exposées qu'aux élèves qui ont les droits.
    const corrections = await epreuves.chargerCorrections(rows.map(r => r.id), { restGet: payments.supabaseRestGet });
    const catalogue = rows.map(row => epreuves.epreuvePublique(row, entitlements, corrections[String(row.id)]));

    // Les listes disponibles (pour les filtres du front).
    const matieres = Array.from(new Set(catalogue.map(e => e.matiere))).sort();
    const annees = Array.from(new Set(catalogue.map(e => e.annee).filter(Boolean))).sort((a, b) => b - a);
    const classes = Array.from(new Set(catalogue.map(e => e.classe).filter(Boolean))).sort();
    const series = Array.from(new Set(catalogue.map(e => e.serie).filter(Boolean))).sort();

    sendJson(res, 200, {
      success: true,
      epreuves: catalogue,
      matieres,
      annees,
      classes,
      series,
      // L'élève sait tout de suite ce qu'il a déjà débloqué.
      debloquees: entitlements && entitlements.epreuves ? Array.from(entitlements.epreuves) : []
    });
  } catch (error) {
    console.error('handleGetEpreuves error:', error);
    sendJson(res, 500, { success: false, error: 'Erreur interne du serveur' });
  }
}

// ── Téléchargement d'une épreuve : le serveur vérifie les droits ─────
// Une épreuve non payée ne renvoie JAMAIS d'URL : 402 et c'est tout.
async function handleTelechargerEpreuve(req, res, epreuveId) {
  try {
    if (!validateUuid(epreuveId)) {
      sendJson(res, 400, { success: false, error: 'identifiant d\'épreuve invalide' });
      return;
    }
    const row = await epreuves.epreuveParId(epreuveId, { restGet: payments.supabaseRestGet });
    if (!row || row.published === false) {
      sendJson(res, 404, { success: false, error: 'Épreuve introuvable' });
      return;
    }

    const entitlements = await getEntitlements(req);
    if (!epreuves.aAcces(row, entitlements)) {
      sendJson(res, 402, {
        success: false,
        code: 'PAIEMENT_REQUIS',
        error: 'Corrigé payant : débloque-le pour le télécharger',
        price: Number(row.price) || 0,
        titre: row.titre,
        epreuveId: row.id
      });
      return;
    }

    const lien = await epreuves.resoudreLienFichier(row, {});
    if (!lien.ok) {
      sendJson(res, 503, { success: false, error: lien.error || 'Fichier momentanément indisponible' });
      return;
    }

    // Journal : l'admin doit savoir quel élève a téléchargé quoi.
    const userId = entitlements && entitlements.userId ? entitlements.userId : null;
    await epreuves.journaliser(userId, row.id, 'telechargement', {
      write: payments.supabaseRestWrite
    });

    if (lien.mode === 'local') {
      // Le fichier est servi par le serveur après contrôle des droits.
      const nomFichier = epreuves.nomFichier(row);
      epreuves.servirFichierLocal(req, res, lien.chemin, nomFichier, row.format);
      return;
    }
    sendJson(res, 200, {
      success: true,
      url: lien.url,
      mode: lien.mode,
      expireDans: lien.expireDans || null,
      nom: row.fichier_nom || null
    });
  } catch (error) {
    console.error('handleTelechargerEpreuve error:', error);
    sendJson(res, 500, { success: false, error: 'Erreur interne du serveur' });
  }
}

// ── Consulter le corrigé (solution rédigée, barème, difficulté) ─────
// C'est l'argumentaire de vente : l'élève voit ce qu'il va obtenir
// (barème, difficulté, validation) AVANT de payer, et la solution
// rédigée seulement APRÈS.
async function handleConsulterEpreuve(req, res, epreuveId) {
  try {
    if (!validateUuid(epreuveId)) {
      sendJson(res, 400, { success: false, error: 'identifiant d\'épreuve invalide' });
      return;
    }
    const row = await epreuves.epreuveParId(epreuveId, { restGet: payments.supabaseRestGet });
    if (!row || row.published === false) {
      sendJson(res, 404, { success: false, error: 'Épreuve introuvable' });
      return;
    }
    const entitlements = await getEntitlements(req);
    const correction = await epreuves.chargerCorrection(epreuveId, { restGet: payments.supabaseRestGet });
    const vue = epreuves.epreuvePublique(row, entitlements, correction);

    if (!vue.accessible) {
      sendJson(res, 402, {
        success: false,
        code: 'PAIEMENT_REQUIS',
        error: 'Corrigé payant : débloque-le pour le consulter',
        price: vue.price,
        titre: vue.titre,
        epreuveId: row.id,
        // Aperçu de ce qui sera acheté (jamais la solution).
        apercu: {
          bareme: vue.bareme,
          difficulte: vue.difficulte,
          validee: vue.validee,
          pages: vue.pages,
          matiere: vue.matiere,
          annee: vue.annee
        }
      });
      return;
    }

    if (vue.aSolution) {
      await epreuves.journaliser(entitlements && entitlements.userId, row.id, 'consultation', {
        write: payments.supabaseRestWrite
      });
    }

    sendJson(res, 200, { success: true, epreuve: vue });
  } catch (error) {
    console.error('handleConsulterEpreuve error:', error);
    sendJson(res, 500, { success: false, error: 'Erreur interne du serveur' });
  }
}

// ── Signaler une erreur sur un corrigé ──────────────────────────────
// Le garde-fou qui garantit qu'un corrigé payé reste juste : l'élève
// signale, l'admin corrige, le circuit est tracé.
async function handleSignalerEpreuve(req, res, epreuveId) {
  try {
    if (!validateUuid(epreuveId)) {
      sendJson(res, 400, { success: false, error: 'identifiant d\'épreuve invalide' });
      return;
    }
    let body;
    try {
      body = await readJsonBody(req);
    } catch (error) {
      sendJson(res, 400, { success: false, error: 'JSON invalide' });
      return;
    }
    const message = cleanText(body.message, 1200);
    if (message.length < 10) {
      sendJson(res, 400, { success: false, error: 'Décrivez l\'erreur en quelques mots (10 caractères minimum)' });
      return;
    }
    const row = await epreuves.epreuveParId(epreuveId, { restGet: payments.supabaseRestGet });
    if (!row) {
      sendJson(res, 404, { success: false, error: 'Épreuve introuvable' });
      return;
    }
    const token = getBearerToken(req);
    const entitlements = await getEntitlements(req);
    const userId = entitlements && entitlements.userId ? entitlements.userId : null;
    const write = await payments.userRestWrite(token, '/rest/v1/epreuves_signalements', 'POST', {
      epreuve_id: row.id,
      user_id: userId,
      message
    });
    if (!write.ok) {
      sendJson(res, 500, { success: false, error: 'Signalement impossible pour le moment' });
      return;
    }
    await epreuves.journaliser(userId, row.id, 'signalement', { write: payments.supabaseRestWrite });
    sendJson(res, 200, { success: true });
  } catch (error) {
    console.error('handleSignalerEpreuve error:', error);
    sendJson(res, 500, { success: false, error: 'Erreur interne du serveur' });
  }
}

// ── Administration : refuse l'accès aux non-admins ──────────────────
async function exigerAdmin(req, res) {
  const entitlements = await getEntitlements(req);
  if (!entitlements || !entitlements.isAdmin) {
    sendJson(res, 403, { success: false, error: 'Réservé à l\'administration' });
    return null;
  }
  return entitlements;
}

/** Construit la ligne « epreuves » à partir d'un corps de requête. */
function construireEpreuve(body) {
  const type = body.type === 'corrige' ? 'corrige' : 'sujet';
  const fichierUrl = sanitizeString(body.fichier_url || body.fichier || '', 300);
  const anneeBrute = parseInt(body.annee, 10);
  return {
    slug: sanitizeString(body.slug || '', 140) || null,
    pays: (sanitizeString(body.pays || 'BJ', 3) || 'BJ').toUpperCase(),
    niveau: body.niveau === 'brevet' ? 'brevet' : 'bac',
    classe: sanitizeString(body.classe || '', 10) || null,
    serie: sanitizeString(body.serie || '', 10) || null,
    annee: Number.isFinite(anneeBrute) && anneeBrute > 1980 && anneeBrute < 2100 ? anneeBrute : null,
    matiere: sanitizeString(body.matiere || 'Mathématiques', 80) || 'Mathématiques',
    type,
    titre: sanitizeString(body.titre || '', 180),
    description: sanitizeString(body.description || '', 600) || null,
    fichier_url: fichierUrl,
    fichier_nom: fichierUrl ? (fichierUrl.split(/[?#]/)[0].split('/').pop() || null) : null,
    format: (sanitizeString(body.format || '', 12) || epreuves.detecterFormat(fichierUrl)).toLowerCase(),
    source_nom: sanitizeString(body.source_nom || '', 120) || null,
    source_url: sanitizeString(body.source_url || '', 300) || null,
    licence: sanitizeString(body.licence || '', 120) || null,
    is_free: body.is_free === true || type === 'sujet',
    price: Math.max(0, Math.min(200000, parseInt(body.price, 10) || 0)),
    published: body.published !== false
  };
}

/** Construit la ligne « epreuve_corrections » (la solution rédigée). */
function construireCorrection(body) {
  const difficulte = ['facile', 'moyen', 'difficile'].includes(String(body.difficulte || '').toLowerCase())
    ? String(body.difficulte).toLowerCase()
    : 'moyen';
  const bareme = parseInt(body.bareme, 10);
  return {
    solution: sanitizeString(body.solution || '', 20000) || null,
    bareme: Number.isFinite(bareme) && bareme > 0 ? bareme : 0,
    difficulte,
    validee: body.validee === true
  };
}

// ── Administration : catalogue complet (avec corrections) ───────────
async function handleAdminEpreuves(req, res) {
  try {
    if (!(await exigerAdmin(req, res))) return;
    const rows = await payments.supabaseRestGet('/rest/v1/epreuves?select=*&order=annee.desc,matiere.asc&limit=500');
    const liste = Array.isArray(rows) ? rows : [];
    const corrections = await epreuves.chargerCorrections(liste.map(r => r.id), { restGet: payments.supabaseRestGet });
    const activites = await payments.supabaseRestGet('/rest/v1/epreuves_activites?select=epreuve_id,action&limit=2000');
    const unlocks = await payments.supabaseRestGet('/rest/v1/unlocked_epreuves?select=epreuve_id&limit=2000');
    const signalements = await payments.supabaseRestGet('/rest/v1/epreuves_signalements?select=epreuve_id,statut&limit=2000');

    const compter = (liste2, id) => liste2.filter(x => String(x.epreuve_id) === String(id)).length;
    const reponses = liste.map(row => {
      const corr = corrections[String(row.id)] || {};
      return {
        id: row.id,
        slug: row.slug || '',
        pays: row.pays,
        niveau: row.niveau,
        classe: row.classe || null,
        serie: row.serie || null,
        annee: row.annee,
        matiere: row.matiere,
        type: row.type,
        titre: row.titre,
        description: row.description || '',
        fichier_url: row.fichier_url || '',
        fichier_nom: row.fichier_nom || '',
        format: row.format || epreuves.detecterFormat(row.fichier_url),
        pages: row.pages || null,
        source_nom: row.source_nom || '',
        source_url: row.source_url || '',
        licence: row.licence || '',
        is_free: Boolean(row.is_free),
        price: Number(row.price) || 0,
        published: Boolean(row.published),
        solution: corr.solution || '',
        bareme: Number(corr.bareme) || 0,
        difficulte: corr.difficulte || 'moyen',
        validee: Boolean(corr.validee),
        // Combien d'élèves ont acheté / téléchargé / signalé.
        achats: compter(Array.isArray(unlocks) ? unlocks : [], row.id),
        telechargements: compter((Array.isArray(activites) ? activites : []).filter(a => a.action === 'telechargement'), row.id),
        consultations: compter((Array.isArray(activites) ? activites : []).filter(a => a.action === 'consultation'), row.id),
        signalements: compter(Array.isArray(signalements) ? signalements : [], row.id)
      };
    });
    sendJson(res, 200, { success: true, epreuves: reponses });
  } catch (error) {
    console.error('handleAdminEpreuves error:', error);
    sendJson(res, 500, { success: false, error: 'Erreur interne du serveur' });
  }
}

// ── Administration : publier une épreuve ───────────────────────────
async function handleAdminCreateEpreuve(req, res) {
  try {
    if (!(await exigerAdmin(req, res))) return;
    let body;
    try {
      body = await readJsonBody(req);
    } catch (error) {
      sendJson(res, 400, { success: false, error: 'JSON invalide' });
      return;
    }
    const ligne = construireEpreuve(body);
    const correction = construireCorrection(body);
    if (!ligne.titre || !ligne.fichier_url) {
      sendJson(res, 400, { success: false, error: 'Titre et fichier obligatoires' });
      return;
    }
    if (ligne.published) {
      const erreurs = epreuves.verifierPublication(ligne, correction);
      if (erreurs.length) {
        sendJson(res, 400, { success: false, error: erreurs.join(' · '), erreurs });
        return;
      }
    }
    const token = getBearerToken(req);
    const write = await payments.userRestWrite(token, '/rest/v1/epreuves', 'POST', ligne, { prefer: 'return=representation' });
    if (!write.ok) {
      sendJson(res, 500, { success: false, error: write.error || 'Publication impossible' });
      return;
    }
    const data = write.data && Array.isArray(write.data) ? write.data[0] : null;
    const id = data ? data.id : null;
    if (id && (correction.solution || correction.bareme || correction.validee)) {
      await payments.userRestWrite(token, '/rest/v1/epreuve_corrections', 'POST', {
        epreuve_id: id,
        solution: correction.solution,
        bareme: correction.bareme,
        difficulte: correction.difficulte,
        validee: correction.validee
      });
    }
    sendJson(res, 200, { success: true, id: id });
  } catch (error) {
    console.error('handleAdminCreateEpreuve error:', error);
    sendJson(res, 500, { success: false, error: 'Erreur interne du serveur' });
  }
}

// ── Administration : modifier une épreuve ───────────────────────────
async function handleAdminUpdateEpreuve(req, res, epreuveId) {
  try {
    if (!(await exigerAdmin(req, res))) return;
    if (!validateUuid(epreuveId)) {
      sendJson(res, 400, { success: false, error: 'identifiant d\'épreuve invalide' });
      return;
    }
    let body;
    try {
      body = await readJsonBody(req);
    } catch (error) {
      sendJson(res, 400, { success: false, error: 'JSON invalide' });
      return;
    }
    const row = await epreuves.epreuveParId(epreuveId, { restGet: payments.supabaseRestGet });
    if (!row) {
      sendJson(res, 404, { success: false, error: 'Épreuve introuvable' });
      return;
    }
    const existante = await epreuves.chargerCorrection(epreuveId, { restGet: payments.supabaseRestGet });
    // Fusion : ce que le corps ne mentionne pas est conservé.
    const fusion = Object.assign({}, row, body);
    const ligne = construireEpreuve(fusion);
    const correction = construireCorrection(Object.assign({}, existante || {}, body));

    if (ligne.published) {
      const erreurs = epreuves.verifierPublication(ligne, correction);
      if (erreurs.length) {
        sendJson(res, 400, { success: false, error: erreurs.join(' · '), erreurs });
        return;
      }
    }

    const token = getBearerToken(req);
    const write = await payments.userRestWrite(token, `/rest/v1/epreuves?id=eq.${encodeURIComponent(epreuveId)}`, 'PATCH', ligne);
    if (!write.ok) {
      sendJson(res, 500, { success: false, error: write.error || 'Mise à jour impossible' });
      return;
    }
    if (correction.solution || correction.bareme || correction.validee || existante) {
      const charge = {
        solution: correction.solution,
        bareme: correction.bareme,
        difficulte: correction.difficulte,
        validee: correction.validee,
        updated_at: new Date().toISOString()
      };
      if (existante) {
        await payments.userRestWrite(token, `/rest/v1/epreuve_corrections?epreuve_id=eq.${encodeURIComponent(epreuveId)}`, 'PATCH', charge);
      } else {
        await payments.userRestWrite(token, '/rest/v1/epreuve_corrections', 'POST', Object.assign({ epreuve_id: epreuveId }, charge));
      }
    }
    sendJson(res, 200, { success: true, id: epreuveId });
  } catch (error) {
    console.error('handleAdminUpdateEpreuve error:', error);
    sendJson(res, 500, { success: false, error: 'Erreur interne du serveur' });
  }
}

// ── Administration : déposer un document d'épreuve ─────────────────
// L'admin dépose le PDF/Word directement depuis le back-office. Le
// fichier part dans le bucket privé « epreuves » (ou, à défaut de clé
// service, dans le dossier local du serveur) ; le serveur ne le sert
// qu'à l'élève qui a les droits.
const TAILLE_MAX_DOCUMENT = 15 * 1024 * 1024; // 15 Mo

async function televerserDansBucket(nom, buffer, typeMime) {
  const urlBase = process.env.SUPABASE_URL || '';
  const cle = process.env.SUPABASE_SERVICE_KEY || '';
  if (!urlBase || !cle) return false;
  const url = `${urlBase.replace(/\/$/, '')}/storage/v1/object/${epreuves.BUCKET}/${encodeURIComponent(nom)}`;
  try {
    const reponse = await fetch(url, {
      method: 'POST',
      headers: {
        apikey: cle,
        Authorization: `Bearer ${cle}`,
        'Content-Type': typeMime || 'application/octet-stream',
        'x-upsert': 'true'
      },
      body: buffer
    });
    if (!reponse.ok) {
      console.warn('[EPREUVES] téléversement bucket refusé :', reponse.status);
      return false;
    }
    return true;
  } catch (error) {
    console.warn('[EPREUVES] téléversement bucket impossible :', error.message);
    return false;
  }
}

async function handleAdminUploadEpreuve(req, res) {
  try {
    if (!(await exigerAdmin(req, res))) return;
    let body;
    try {
      body = await readJsonBody(req, 24 * 1024 * 1024);
    } catch (error) {
      sendJson(res, 413, { success: false, error: 'Fichier trop volumineux (15 Mo maximum)' });
      return;
    }
    const nomBrut = sanitizeString(body.nom || 'document.pdf', 140);
    const extension = (nomBrut.split('.').pop() || '').toLowerCase();
    if (!epreuves.EXTENSIONS_AUTORISEES.includes(extension)) {
      sendJson(res, 400, {
        success: false,
        error: `Format non accepté (${extension || 'sans extension'}). Formats autorisés : ${epreuves.EXTENSIONS_AUTORISEES.join(', ')}`
      });
      return;
    }
    const data = String(body.data || '');
    if (!data) {
      sendJson(res, 400, { success: false, error: 'Fichier vide' });
      return;
    }
    const buffer = Buffer.from(data, 'base64');
    if (!buffer.length) {
      sendJson(res, 400, { success: false, error: 'Fichier illisible' });
      return;
    }
    if (buffer.length > TAILLE_MAX_DOCUMENT) {
      sendJson(res, 413, { success: false, error: 'Fichier trop volumineux (15 Mo maximum)' });
      return;
    }
    const nomPropre = nomBrut.replace(/[^a-zA-Z0-9._-]/g, '-').replace(/^-+/, '') || 'document.pdf';
    const typeMime = epreuves.infosFormat(extension, nomPropre).mime;

    // 1. Bucket privé (durable, recommandé)
    if (await televerserDansBucket(nomPropre, buffer, typeMime)) {
      sendJson(res, 200, { success: true, reference: `supabase:${nomPropre}`, stockage: 'bucket', octets: buffer.length });
      return;
    }
    // 2. Repli : dossier local du serveur
    try {
      fs.mkdirSync(epreuves.dossierEpreuves(), { recursive: true });
      fs.writeFileSync(path.join(epreuves.dossierEpreuves(), nomPropre), buffer);
    } catch (error) {
      sendJson(res, 500, { success: false, error: 'Dépôt impossible : ' + error.message });
      return;
    }
    sendJson(res, 200, { success: true, reference: nomPropre, stockage: 'local', octets: buffer.length });
  } catch (error) {
    console.error('handleAdminUploadEpreuve error:', error);
    sendJson(res, 500, { success: false, error: 'Erreur interne du serveur' });
  }
}

// ── Administration : l'élève a fait quoi ────────────────────────────
// Achats, téléchargements, consultations et signalements, avec le profil
// de l'élève (pays, classe, niveau) : l'admin voit l'activité réelle.
async function handleAdminActivite(req, res) {
  try {
    if (!(await exigerAdmin(req, res))) return;
    const [unlocks, activites, signalements, epreuvesRows, profils] = await Promise.all([
      payments.supabaseRestGet('/rest/v1/unlocked_epreuves?select=*&order=created_at.desc&limit=500'),
      payments.supabaseRestGet('/rest/v1/epreuves_activites?select=*&order=created_at.desc&limit=1000'),
      payments.supabaseRestGet('/rest/v1/epreuves_signalements?select=*&order=created_at.desc&limit=300'),
      payments.supabaseRestGet('/rest/v1/epreuves?select=id,titre,matiere,type,pays,niveau,annee,classe,serie&limit=500'),
      payments.supabaseRestGet('/rest/v1/profiles?select=id,email,name,pays,classe,niveau&limit=1000')
    ]);

    const parEpreuve = new Map((Array.isArray(epreuvesRows) ? epreuvesRows : []).map(e => [String(e.id), e]));
    const parProfil = new Map((Array.isArray(profils) ? profils : []).map(p => [String(p.id), p]));

    const decrire = (userId) => {
      const p = parProfil.get(String(userId || ''));
      if (!p) return { id: userId || null, email: '', nom: '', pays: '', classe: '', niveau: '' };
      return {
        id: String(p.id),
        email: p.email || '',
        nom: p.name || '',
        pays: p.pays || '',
        classe: p.classe || '',
        niveau: p.niveau || ''
      };
    };
    const decrireEpreuve = (id) => {
      const e = parEpreuve.get(String(id || ''));
      if (!e) return { id: id || null, titre: '', matiere: '', type: '', pays: '', niveau: '', annee: null, classe: '', serie: '' };
      return {
        id: String(e.id),
        titre: e.titre || '',
        matiere: e.matiere || '',
        type: e.type || '',
        pays: e.pays || '',
        niveau: e.niveau || '',
        annee: e.annee || null,
        classe: e.classe || '',
        serie: e.serie || ''
      };
    };

    const achats = (Array.isArray(unlocks) ? unlocks : []).map(u => ({
      eleve: decrire(u.user_id),
      epreuve: decrireEpreuve(u.epreuve_id),
      prix: Number(u.price) || 0,
      date: u.created_at || null
    }));
    const actions = (Array.isArray(activites) ? activites : []).map(a => ({
      eleve: decrire(a.user_id),
      epreuve: decrireEpreuve(a.epreuve_id),
      action: a.action || '',
      date: a.created_at || null
    }));
    const rapports = (Array.isArray(signalements) ? signalements : []).map(s => ({
      eleve: decrire(s.user_id),
      epreuve: decrireEpreuve(s.epreuve_id),
      message: s.message || '',
      statut: s.statut || 'nouveau',
      date: s.created_at || null
    }));

    // Statistiques par épreuve.
    const stats = new Map();
    for (const a of achats) {
      const cle = a.epreuve.id;
      if (!cle) continue;
      const s = stats.get(cle) || { epreuve: a.epreuve, achats: 0, telechargements: 0, consultations: 0, signalements: 0, revenu: 0 };
      s.achats += 1;
      s.revenu += a.prix || 0;
      stats.set(cle, s);
    }
    for (const a of actions) {
      const cle = a.epreuve.id;
      if (!cle) continue;
      const s = stats.get(cle) || { epreuve: a.epreuve, achats: 0, telechargements: 0, consultations: 0, signalements: 0, revenu: 0 };
      if (a.action === 'telechargement') s.telechargements += 1;
      if (a.action === 'consultation') s.consultations += 1;
      stats.set(cle, s);
    }
    for (const r of rapports) {
      const cle = r.epreuve.id;
      if (!cle) continue;
      const s = stats.get(cle) || { epreuve: r.epreuve, achats: 0, telechargements: 0, consultations: 0, signalements: 0, revenu: 0 };
      s.signalements += 1;
      stats.set(cle, s);
    }

    sendJson(res, 200, {
      success: true,
      achats,
      actions,
      signalements: rapports,
      stats: Array.from(stats.values()),
      // L'admin sait tout de suite si la clé service est là : sans elle,
      // les téléchargements ne sont pas journalisés.
      journalActif: Boolean(process.env.SUPABASE_SERVICE_KEY)
    });
  } catch (error) {
    console.error('handleAdminActivite error:', error);
    sendJson(res, 500, { success: false, error: 'Erreur interne du serveur' });
  }
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

async function route(req, res) {
  const requestPath = (req.url || '/').split('?')[0];

  // ── Rate limiting global ───────────────────────────────────────
  if (isRateLimited(req)) {
    res.writeHead(429, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: 'Trop de requêtes. Attendez un moment.' }));
    return;
  }

  // ── Endpoint : Récupérer les chapitres filtrés par pays, classe, série ──
  if (req.method === 'GET' && requestPath === '/v1/chapters/student') {
    return handleGetChaptersForStudent(req, res);
  }

  // ── Épreuves (sujets gratuits / corrigés payants) ─────────────────
  if (req.method === 'GET' && requestPath === '/v1/epreuves') {
    return handleGetEpreuves(req, res);
  }

  const telechargerEpreuve = requestPath.match(/^\/v1\/epreuves\/([^/]+)\/telecharger$/);
  if (req.method === 'GET' && telechargerEpreuve) {
    return handleTelechargerEpreuve(req, res, decodeURIComponent(telechargerEpreuve[1]));
  }

  // Consulter le corrigé (solution rédigée, barème, difficulté).
  const consulterEpreuve = requestPath.match(/^\/v1\/epreuves\/([^/]+)$/);
  if (req.method === 'GET' && consulterEpreuve) {
    return handleConsulterEpreuve(req, res, decodeURIComponent(consulterEpreuve[1]));
  }

  // Signaler une erreur sur un corrigé.
  const signalerEpreuve = requestPath.match(/^\/v1\/epreuves\/([^/]+)\/signaler$/);
  if (req.method === 'POST' && signalerEpreuve) {
    return handleSignalerEpreuve(req, res, decodeURIComponent(signalerEpreuve[1]));
  }

  // ── Administration des épreuves ───────────────────────────────────
  if (requestPath === '/v1/admin/epreuves') {
    if (req.method === 'GET') return handleAdminEpreuves(req, res);
    if (req.method === 'POST') return handleAdminCreateEpreuve(req, res);
  }

  if (requestPath === '/v1/admin/epreuves/activite' && req.method === 'GET') {
    return handleAdminActivite(req, res);
  }

  if (requestPath === '/v1/admin/epreuves/televerser' && req.method === 'POST') {
    return handleAdminUploadEpreuve(req, res);
  }

  const modifierEpreuve = requestPath.match(/^\/v1\/admin\/epreuves\/([^/]+)$/);
  if (req.method === 'PATCH' && modifierEpreuve) {
    return handleAdminUpdateEpreuve(req, res, decodeURIComponent(modifierEpreuve[1]));
  }

  if (req.method === 'POST' && requestPath === '/v1/ai/generate-course') {
    if (isSensitiveRateLimited(req, requestPath)) {
      res.writeHead(429, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Trop de requêtes de génération de cours. Attendez un moment.' }));
      return;
    }
    return handleGenerateCourse(req, res);
  }

  if (req.method === 'POST' && requestPath === '/v1/ai/chat') {
    if (isSensitiveRateLimited(req, requestPath)) {
      res.writeHead(429, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Trop de requêtes de chat IA. Attendez un moment.' }));
      return;
    }
    return handleChat(req, res);
  }

  if (requestPath === '/v1/ai/health') {
    return handleAiHealth(req, res);
  }

  if (req.method === 'POST' && requestPath === '/v1/ai/program-outline') {
    if (isSensitiveRateLimited(req, requestPath)) {
      res.writeHead(429, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Trop de requêtes de programme. Attendez un moment.' }));
      return;
    }
    return handleProgramOutline(req, res);
  }

  if (req.method === 'POST' && requestPath === '/v1/ai/quiz-bank') {
    if (isSensitiveRateLimited(req, requestPath)) {
      res.writeHead(429, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Trop de requêtes de banque d\'exercices. Attendez un moment.' }));
      return;
    }
    return handleQuizBank(req, res);
  }

  if (req.method === 'POST' && requestPath === '/v1/ai/chapter-exercises') {
    if (isSensitiveRateLimited(req, requestPath)) {
      res.writeHead(429, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Trop de requêtes d\'exercices. Attendez un moment.' }));
      return;
    }
    return handleChapterExercises(req, res);
  }

  if (req.method === 'POST' && requestPath === '/v1/payments/create-transaction') {
    if (isSensitiveRateLimited(req, requestPath)) {
      res.writeHead(429, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Trop de tentatives de paiement. Attendez un moment.' }));
      return;
    }
    return handleCreateTransaction(req, res);
  }

  if (req.method === 'POST' && requestPath === '/v1/payments/verify') {
    if (isSensitiveRateLimited(req, requestPath)) {
      res.writeHead(429, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Trop de vérifications de paiement. Attendez un moment.' }));
      return;
    }
    return handleVerifyPayment(req, res);
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
    let slug;
    try {
      slug = decodeURIComponent(countryCourse[2]);
    } catch (_) {
      slug = '';
    }
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
    if (isSensitiveRateLimited(req, requestPath)) {
      res.writeHead(429, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Trop de webhooks. Attendez un moment.' }));
      return;
    }
    return handleFedapayWebhook(req, res);
  }

  return serveStatic(req, res);
}

const server = http.createServer(async (req, res) => {
  // ── Headers de sécurité HTTP ───────────────────────────────────
  // Appliquer les headers de sécurité à toutes les réponses
  const originalWriteHead = res.writeHead;
  res.writeHead = function(statusCode, statusMessage, headers) {
    if (!headers && typeof statusMessage === 'object') {
      headers = statusMessage;
      statusMessage = undefined;
    }
    headers = headers || {};
    
    // Headers de sécurité
    headers['X-Content-Type-Options'] = 'nosniff';
    headers['X-Frame-Options'] = 'DENY';
    headers['X-XSS-Protection'] = '1; mode=block';
    headers['Referrer-Policy'] = 'strict-origin-when-cross-origin';
    headers['Permissions-Policy'] = 'geolocation=(), microphone=(), camera=()';
    
    return originalWriteHead.call(this, statusCode, statusMessage, headers);
  };

  try {
    await route(req, res);
  } catch (error) {
    console.error('Erreur non gérée', req.method, (req.url || '').split('?')[0], error && error.stack || error);
    if (!res.headersSent) {
      sendJson(res, 500, { success: false, error: 'Erreur interne du serveur' });
    } else {
      res.end();
    }
  }
});

process.on('unhandledRejection', reason => {
  console.error('Promesse rejetée non gérée :', reason && reason.stack || reason);
});

// Le serveur n'est démarré que s'il est exécuté directement : les fonctions
// pures restent testables (voir tools/test-serveur.js).
if (require.main === module) {
  server.listen(PORT, () => {
    console.log('Revizy listening on port ' + PORT);
  });
}

module.exports = {
  normalizeChapters,
  normalizeChapterExercises,
  buildCoursePrompt,
  buildChapterExercisesPrompt,
  buildQuizBankPrompt,
  instructionLangue,
  libellesEcriture,
  optionsVraiFaux,
  contextFromRequest,
  extractJson,
  cleanText,
  slugify,
  protectChapters,
  saveCourseChapters,
  readCourseChapters,
  readChapterExercises,
  construireCoursLocal,
  etatQuotaIA,
  budgetIA: budgetPourCle,
  cacheDisque,
  server
};
