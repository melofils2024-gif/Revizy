const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

loadLocalEnv();

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
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
const courseCache = new Map();

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

function extractJson(text) {
  const cleaned = String(text || '').trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch (error) {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) return JSON.parse(cleaned.slice(start, end + 1));
    throw error;
  }
}

function normalizeChapters(chapitres, niveau, subjectName) {
function normalizeChapters(chapitres, niveau, subjectName) {
  const basePrice = niveau === 'brevet' ? 100 : 150;
  const FREE_CHAPTER_COUNT = 3; // les 3 premiers chapitres sont gratuits
  return (Array.isArray(chapitres) ? chapitres : []).map((chapter, index) => {
    const title = cleanText(chapter.title || `Chapitre ${index + 1} — ${subjectName}`, 180);
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

const BENIN_CURRICULUM = {
  bac: {
    'Mathématiques': {
      C: ['Suites numériques et récurrence', 'Calcul vectoriel et produit scalaire', 'Fonctions exponentielles et logarithmes', 'Primitives et intégrales', 'Équations différentielles', 'Nombres complexes', 'Probabilités et statistiques', 'Géométrie dans l\'espace'],
      D: ['Suites numériques et récurrence', 'Calcul vectoriel et produit scalaire', 'Fonctions exponentielles et logarithmes', 'Primitives et intégrales', 'Probabilités et statistiques', 'Géométrie dans l\'espace'],
      A: ['Suites numériques', 'Fonctions et courbes', 'Statistiques et probabilités', 'Vecteurs dans le plan'],
      B: ['Suites numériques', 'Fonctions et courbes', 'Statistiques et probabilités', 'Mathématiques financières'],
      G: ['Mathématiques financières', 'Statistiques descriptives', 'Fonctions et courbes', 'Probabilités de base']
    },
    'Physique-Chimie': {
      C: ['Ondes mécaniques et sonores', 'Ondes lumineuses et optique', 'Mécanique newtonienne', 'Travail et énergie', 'Chimie organique : alcools, alcanes, alcènes', 'Électricité : circuits RC, RL, RLC', 'Thermodynamique'],
      D: ['Ondes mécaniques et sonores', 'Ondes lumineuses et optique', 'Mécanique newtonienne', 'Travail et énergie', 'Chimie organique : alcools, alcanes', 'Électricité : circuits RC, RL'],
    },
    'SVT': {
      C: ['Biologie cellulaire et ADN', 'Génétique et hérédité mendélienne', 'Immunologie et système immunitaire', 'Système nerveux et hormones', 'Reproduction humaine', 'Écologie et biosphère'],
      D: ['Biologie cellulaire et ADN', 'Génétique et hérédité mendélienne', 'Immunologie et système immunitaire', 'Système nerveux et hormones', 'Reproduction humaine', 'Écologie et biosphère'],
      A: ['Biologie de base', 'Santé et hygiène', 'Écologie'],
    },
    'Philosophie': {
      A: ['La connaissance et la vérité', 'La liberté et la responsabilité', 'L\'État et la société', 'Le travail et la technique', 'La conscience et l\'inconscient', 'La morale et les valeurs'],
      C: ['La connaissance et la vérité', 'La liberté', 'L\'État', 'La morale'],
      D: ['La connaissance et la vérité', 'La liberté', 'L\'État', 'La morale'],
      B: ['La connaissance', 'La liberté et la responsabilité', 'L\'État et la société', 'Le travail'],
      G: ['La connaissance', 'La liberté et la responsabilité', 'L\'État et la société', 'Le travail']
    },
    'Français & Littérature': {
      A: ['Texte argumentatif et dissertation', 'Commentaire composé', 'Résumé et synthèse', 'Littérature africaine et francophone', 'Littérature française classique et moderne', 'Expression écrite et orale'],
      C: ['Dissertation et argumentation', 'Commentaire de texte', 'Grammaire et lexique avancés'],
      D: ['Dissertation et argumentation', 'Commentaire de texte', 'Grammaire et lexique avancés'],
      B: ['Dissertation et argumentation', 'Commentaire de texte', 'Grammaire'],
      G: ['Dissertation et argumentation', 'Commentaire de texte', 'Grammaire']
    },
    'Histoire-Géographie': {
      A: ['Histoire contemporaine mondiale : guerres et paix', 'Décolonisation et indépendances africaines', 'Histoire du Bénin', 'Géographie économique mondiale', 'Géographie du Bénin et de l\'Afrique', 'Mondialisation et développement'],
      C: ['Histoire contemporaine', 'Géographie économique', 'Bénin et Afrique'],
      D: ['Histoire contemporaine', 'Géographie économique', 'Bénin et Afrique'],
      B: ['Histoire contemporaine', 'Géographie économique', 'Bénin et Afrique'],
      G: ['Histoire contemporaine', 'Géographie économique', 'Bénin et Afrique']
    },
    'Anglais': {
      A: ['Compréhension écrite et orale', 'Expression écrite : essay et letter writing', 'Grammaire anglaise avancée', 'Civilisation anglophone', 'Vocabulaire thématique'],
      C: ['Compréhension et expression écrite', 'Grammaire anglaise', 'Vocabulaire thématique'],
      D: ['Compréhension et expression écrite', 'Grammaire anglaise', 'Vocabulaire thématique'],
      B: ['Compréhension et expression écrite', 'Grammaire anglaise', 'Vocabulaire thématique'],
      G: ['Compréhension et expression écrite', 'Grammaire anglaise', 'Vocabulaire thématique']
    },
    'Économie': {
      B: ['Introduction à l\'économie et aux systèmes économiques', 'Offre, demande et marché', 'Monnaie et financement de l\'économie', 'Commerce international', 'Développement économique et croissance', 'Économie du Bénin et de l\'UEMOA'],
      G: ['Introduction à l\'économie', 'Marché et prix', 'Monnaie et financement', 'Commerce international']
    },
    'Comptabilité': {
      G: ['Comptabilité générale : plan comptable SYSCOHADA', 'Bilan et compte de résultat', 'Opérations commerciales et TVA', 'Amortissements et provisions', 'Rapprochement bancaire', 'Comptabilité analytique de base']
    }
  },
  brevet: {
    'Mathématiques': ['Calcul littéral et équations du premier degré', 'Systèmes d\'équations', 'Fonctions linéaires et affines', 'Géométrie plane : triangles, cercles, transformations', 'Statistiques et probabilités', 'Théorème de Pythagore et trigonométrie', 'Volumes et aires'],
    'Physique-Chimie-Technologie': ['Électricité : circuit série et parallèle, loi d\'Ohm', 'Optique : lumière, réflexion, réfraction', 'Mécanique : vitesse, forces', 'Chimie : atomes, molécules, solutions', 'Technologie : systèmes techniques'],
    'SVT': ['Cellule et organisation du vivant', 'Digestion et nutrition', 'Respiration et circulation sanguine', 'Système nerveux et reproduction', 'Génétique de base', 'Immunologie simplifiée', 'Écologie et environnement'],
    'Français': ['Lecture et compréhension de texte', 'Grammaire : nature et fonction, conjugaison', 'Orthographe et vocabulaire', 'Rédaction : récit, description, lettre', 'Expression orale'],
    'Histoire-Géographie': ['Histoire du Bénin : royaumes et colonisation', 'Indépendance et histoire contemporaine du Bénin', 'Géographie du Bénin : milieux naturels, population', 'Afrique : organisations et défis', 'Mondialisation'],
    'Anglais': ['Vocabulaire du quotidien et thématique', 'Grammaire : temps, modaux, questions', 'Compréhension de textes simples', 'Expression écrite : phrases et petits textes'],
    'Lecture / Dictée': ['Techniques de lecture à voix haute', 'Règles d\'orthographe et dictée', 'Compréhension de textes variés', 'Vocabulaire contextuel']
  }
};

// ── Curriculum topics ─────────────────────────────────────────────
// Priorité : Supabase → fallback hardcodé

/**
 * Récupère les topics depuis Supabase via la RPC get_curriculum_topics.
 * Retourne un tableau de strings, ou null si indisponible.
 */
async function getCurriculumTopicsFromSupabase(subjectName, niveau, serie) {
  const rows = await supabaseFetch('/rest/v1/rpc/get_curriculum_topics', {
    p_niveau:  niveau,
    p_serie:   serie  || null,
    p_subject: subjectName
  });
  if (!Array.isArray(rows) || rows.length === 0) return null;

  // La RPC retourne des lignes {subject_name, serie_code, topics[]}
  // On prend la première ligne correspondante
  const row = rows[0];
  return Array.isArray(row.topics) && row.topics.length > 0 ? row.topics : null;
}

/**
 * Fallback synchrone sur le curriculum hardcodé.
 */
function getCurriculumTopicsLocal(subjectName, niveau, serie) {
  const level = BENIN_CURRICULUM[niveau];
  if (!level) return [];
  const subject = level[subjectName];
  if (!subject) return [];
  if (Array.isArray(subject)) return subject;
  return subject[serie] || subject['C'] || subject['D'] || Object.values(subject)[0] || [];
}

/**
 * Point d'entrée : Supabase en priorité, fallback local.
 */
async function getCurriculumTopics(subjectName, niveau, serie) {
  const remote = await getCurriculumTopicsFromSupabase(subjectName, niveau, serie);
  if (remote) return remote;
  return getCurriculumTopicsLocal(subjectName, niveau, serie);
}

async function buildCoursePrompt({ subjectName, niveau, serie }) {
  const niveauLabel = niveau === 'bac' ? `Terminale BAC série ${serie}` : 'classe de 3ème Brevet';
  const topics = await getCurriculumTopics(subjectName, niveau, serie);
  const chapCount = topics.length > 0 ? topics.length : 5;
  const topicsBlock = topics.length > 0
    ? `\nLe programme officiel béninois pour cette matière couvre ces chapitres principaux :\n${topics.map((t, i) => `${i + 1}. ${t}`).join('\n')}\nGénère exactement ${chapCount} chapitres en suivant strictement cet ordre et ce programme.`
    : `\nGénère exactement ${chapCount} chapitres couvrant les notions essentielles du programme.`;
  const priceRef = niveau === 'brevet' ? 100 : 150;

  return `Tu es un professeur expert du système éducatif béninois (programme MEMP/OBB). Génère un contenu de révision complet pour ${subjectName}, niveau ${niveauLabel}.${topicsBlock}

Réponds uniquement en JSON valide, sans markdown, sous cette forme exacte :
{
  "chapitres": [
    {
      "title": "SA 1 : Titre exact du chapitre selon le programme",
      "price": ${priceRef},
      "cours": "Cours complet et explicite : définitions précises, toutes les notions clés, formules, démonstrations importantes, méthodes de résolution, exemples numériques ou littéraires concrets, pièges fréquents à l'examen béninois.",
      "exemple": {
        "titre": "Exemple résolu — type examen béninois",
        "enonce": "Énoncé réaliste tel qu'il apparaît aux examens du Bénin",
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
- La bonne réponse est indiquée uniquement dans correctOption.
- Utilise uniquement le français, avec le vocabulaire scolaire béninois.`;
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

  if (!subjectName || !['bac', 'brevet'].includes(niveau)) {
    sendJson(res, 400, { success: false, error: 'Paramètres invalides' });
    return;
  }

  const cacheKey = `${niveau}:${serie}:${subjectName}`.toLowerCase();
  if (courseCache.has(cacheKey)) {
    sendJson(res, 200, { success: true, chapitres: courseCache.get(cacheKey), cached: true });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'cle_api_gemini_reelle') {
    sendJson(res, 503, { success: false, error: 'GEMINI_API_KEY non configurée' });
    return;
  }

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: await buildCoursePrompt({ subjectName, niveau, serie }) }] }],
        generationConfig: {
          temperature: 0.35,
          responseMimeType: 'application/json'
        }
      })
    });

    const geminiPayload = await response.json();
    if (!response.ok) {
      sendJson(res, 502, { success: false, error: 'Gemini indisponible' });
      return;
    }

    const text = geminiPayload.candidates && geminiPayload.candidates[0]
      && geminiPayload.candidates[0].content
      && geminiPayload.candidates[0].content.parts
      && geminiPayload.candidates[0].content.parts[0]
      && geminiPayload.candidates[0].content.parts[0].text;

    const parsed = extractJson(text);
    const chapitres = normalizeChapters(parsed.chapitres, niveau, subjectName);
    if (!chapitres.length) {
      sendJson(res, 502, { success: false, error: 'Réponse Gemini vide' });
      return;
    }

    courseCache.set(cacheKey, chapitres);
    sendJson(res, 200, { success: true, chapitres, cached: false });
  } catch (error) {
    console.error('Erreur Gemini:', error.message);
    sendJson(res, 502, { success: false, error: 'Génération impossible' });
  }
}

function serveStatic(req, res) {
  let filePath = safeJoin(ROOT, req.url === '/' ? '/index.html' : req.url);
  if (!filePath) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
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

const server = http.createServer((req, res) => {
  const requestPath = (req.url || '/').split('?')[0];

  if (req.method === 'POST' && requestPath === '/v1/ai/generate-course') {
    handleGenerateCourse(req, res);
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
