const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

loadLocalEnv();

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'openrouter/free';
const FREE_CHAPTER_COUNT = 3;
const CHAPTER_PRICES = { bac: 150, brevet: 100 };
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
  const basePrice = CHAPTER_PRICES[niveau] || CHAPTER_PRICES.bac;
  return (Array.isArray(chapitres) ? chapitres : []).slice(0, 6).map((chapter, index) => {
    const title = cleanText(chapter.title || `Chapitre ${index + 1} — ${subjectName}`, 180);
    const exercice = chapter.exercice || {};
    const type = exercice.type === 'vf' ? 'vf' : 'qcm';
    const options = Array.isArray(exercice.options) && exercice.options.length >= 2
      ? exercice.options.slice(0, 4).map(opt => cleanText(opt, 220))
      : [
          'a) Je ne sais pas',
          'b) Je sais appliquer la méthode (Correct)',
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

function buildCoursePrompt({ subjectName, niveau, serie }) {
  const niveauLabel = niveau === 'bac' ? `Terminale BAC série ${serie}` : 'classe de 3ème Brevet';
  return `Tu es un enseignant de référence au Bénin, spécialiste du programme officiel ${niveauLabel}. Génère un contenu de révision pour ${subjectName}, parfaitement aligné sur le programme national béninois et sur les attentes de l'examen.

Réponds uniquement en JSON valide, sans markdown, sous cette forme exacte :
{
  "chapitres": [
    {
      "title": "SA 1 : Titre du chapitre",
      "price": 150 ou 100 selon le niveau,
      "cours": "Cours complet, clair, structuré, avec définitions, formules ou méthodes utiles.",
      "exemple": {
        "titre": "Exemple guidé",
        "enonce": "Énoncé réaliste",
        "solution": "Solution détaillée étape par étape"
      },
      "exercice": {
        "consigne": "QCM — Application",
        "question": "Question d'exercice",
        "type": "qcm",
        "options": ["a) ...", "b) ... (Correct)", "c) ...", "d) ..."],
        "correctOption": "b",
        "explication": "Pourquoi cette réponse est correcte"
      }
    }
  ]
}

Contraintes strictes :
- Génère 4 à 6 chapitres.
- Les 3 premiers chapitres doivent être gratuits côté site (free = true) et très utiles pour comprendre les bases.
- Les chapitres 4, 5 et 6 sont payants selon le niveau : Brevet = 100 FCFA, BAC = 150 FCFA.
- Chaque chapitre doit suivre le programme officiel de la classe et de la série concernée, avec concepts clés, méthodes, notions, erreurs fréquentes et applications d'examen.
- Le premier chapitre doit être une introduction progressive de la matière et doit être accessible sans prérequis.
- Les cours doivent être concrets, surtout orientés vers l'examen et la réussite au Bénin.
- Les exercices doivent être différents selon le chapitre et bien gradués de simple à avancé.
- Utilise uniquement le français, avec un style pédagogique, clair et précis.
- Ne mets pas de texte hors JSON.
- Les titres doivent commencer par des intitulés réalistes comme SA 1, SA 2, SA 3, ou Unité 1, selon le programme.`;
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

  const prompt = buildCoursePrompt({ subjectName, niveau, serie });
  const geminiKey = process.env.GEMINI_API_KEY;
  const openRouterKey = process.env.OPENROUTER_API_KEY;
  try {
    let text;
    let provider;

    if (geminiKey && geminiKey !== 'cle_api_gemini_reelle') {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(geminiKey)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.35, responseMimeType: 'application/json' }
        })
      });
      const payload = await response.json();
      if (response.ok) {
        text = payload.candidates && payload.candidates[0]
          && payload.candidates[0].content
          && payload.candidates[0].content.parts
          && payload.candidates[0].content.parts[0]
          && payload.candidates[0].content.parts[0].text;
        provider = 'Gemini';
      } else {
        console.error('Gemini indisponible:', response.status);
      }
    }

    if (!text && openRouterKey) {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openRouterKey}`,
          'HTTP-Referer': process.env.OPENROUTER_SITE_URL || 'https://revizy.onrender.com',
          'X-Title': 'Revizy'
        },
        body: JSON.stringify({
          model: OPENROUTER_MODEL,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.35,
          response_format: { type: 'json_object' }
        })
      });
      const payload = await response.json();
      if (response.ok) {
        text = payload.choices && payload.choices[0]
          && payload.choices[0].message
          && payload.choices[0].message.content;
        provider = 'OpenRouter';
      } else {
        console.error('OpenRouter indisponible:', response.status);
      }
    }

    if (!text) {
      sendJson(res, 503, {
        success: false,
        error: 'Aucun service IA de génération n’est configuré ou disponible'
      });
      return;
    }

    const parsed = extractJson(text);
    const chapitres = normalizeChapters(parsed.chapitres, niveau, subjectName);
    if (!chapitres.length) {
      sendJson(res, 502, { success: false, error: `Réponse ${provider} vide` });
      return;
    }

    courseCache.set(cacheKey, chapitres);
    sendJson(res, 200, { success: true, chapitres, cached: false, provider });
  } catch (error) {
    console.error('Erreur génération IA:', error.message);
    sendJson(res, 502, { success: false, error: 'Génération IA impossible' });
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
