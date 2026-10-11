// Benchmark des modèles Gemini : stabilité, latence, qualité du JSON de cours.
// Usage : node tools/benchmark-models.js
const fs = require('fs');
const path = require('path');

function loadEnv() {
  const env = {};
  const envPath = path.join(__dirname, '..', '.env');
  fs.readFileSync(envPath, 'utf8').split(/\r?\n/).forEach(line => {
    const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/);
    if (m) env[m[1]] = m[2].trim();
  });
  return env;
}

const env = loadEnv();
const API_KEY = env.GEMINI_API_KEY;
const MODELS = process.argv[2]
  ? process.argv[2].split(',')
  : ['gemini-3.5-flash', 'gemini-3.6-flash', 'gemini-3.7-flash', 'gemini-3.8-flash', 'gemini-flash-latest'];

const CHAT_BODY = {
  contents: [{ role: 'user', parts: [{ text: "Explique brievement la photosynthese pour un eleve de 3eme." }] }],
  generationConfig: { temperature: 0.5, maxOutputTokens: 800 }
};

const COURSE_BODY = {
  contents: [{ parts: [{ text: 'Reponds uniquement en JSON strict : {"chapitres":[{"title":"...","cours":"...","exercice":{"type":"qcm","options":["a) x","b) y","c) z","d) w"],"correctOption":"a"}}]} avec exactement 2 chapitres sur le theme des fractions, chacun avec un cours de 40 mots.' }] }],
  generationConfig: { temperature: 0.35, maxOutputTokens: 4096, responseMimeType: 'application/json' }
};

async function call(model, body, timeoutMs = 120000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const start = Date.now();
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(API_KEY)}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: controller.signal }
    );
    const data = await res.json();
    const ms = Date.now() - start;
    if (!res.ok) return { ok: false, ms, status: res.status, error: data?.error?.message || 'HTTP ' + res.status };
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return { ok: !!text, ms, text, tokens: data.usageMetadata?.candidatesTokenCount || 0, finish: data.candidates?.[0]?.finishReason };
  } catch (e) {
    return { ok: false, ms: Date.now() - start, status: 0, error: e.message };
  } finally {
    clearTimeout(timer);
  }
}

function validJson(text) {
  try {
    const parsed = JSON.parse(String(text || '').replace(/^```json\s*/i, '').replace(/```$/i, '').trim());
    return { valid: true, chapitres: (parsed.chapitres || []).length };
  } catch {
    return { valid: false, chapitres: 0 };
  }
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const rows = [];
  for (const model of MODELS) {
    const chats = [];
    for (let i = 0; i < 3; i++) {
      chats.push(await call(model, CHAT_BODY, 60000));
      await sleep(4000);
    }
    const course = await call(model, COURSE_BODY, 150000);
    await sleep(4000);

    const okChats = chats.filter(c => c.ok).length;
    const lat = chats.filter(c => c.ok).map(c => c.ms);
    const j = validJson(course.text);
    rows.push({
      model,
      chatOk: `${okChats}/3`,
      latMoy: lat.length ? Math.round(lat.reduce((a, b) => a + b, 0) / lat.length) : '-',
      latMax: lat.length ? Math.max(...lat) : '-',
      jsonOk: course.ok && j.valid ? `oui (${j.chapitres} ch.)` : `non`,
      genMs: course.ok ? course.ms : '-',
      erreurs: [...new Set([...chats, course].filter(r => !r.ok).map(r => `${r.status}:${String(r.error).slice(0, 60)}`))].join(' | ') || 'aucune'
    });
    console.log(JSON.stringify(rows[rows.length - 1]));
  }

  console.log('\n=== SYNTHESE ===');
  console.table(rows);
  const scored = rows
    .map(r => ({ model: r.model, score: (Number(r.chatOk.split('/')[0]) / 3) * 60 + (r.jsonOk === 'oui (2 ch.)' ? 40 : r.jsonOk === 'oui' ? 25 : 0), r }))
    .sort((a, b) => b.score - a.score);
  console.log('\nClassement :');
  scored.forEach(s => console.log(`  ${s.score.toFixed(0)}/100  ${s.model}  (chat ${s.r.chatOk}, latence moy ${s.r.latMoy}ms, JSON ${s.r.jsonOk})`));
})();