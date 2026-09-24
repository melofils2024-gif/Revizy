// Liste les modèles Gemini accessibles avec ta clé API
const fs = require('fs');
const path = require('path');

function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env');
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
loadEnv();

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) { console.error('Pas de clé'); process.exit(1); }

(async () => {
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`;
  try {
    const r = await fetch(url);
    const text = await r.text();
    console.log(`HTTP ${r.status}`);
    if (!r.ok) { console.error(text.substring(0, 500)); return; }
    const data = JSON.parse(text);
    const flashModels = (data.models || [])
      .filter(m => /flash|gemini/i.test(m.name))
      .map(m => m.name.replace('models/', ''));
    console.log(`\n${flashModels.length} modèles gemini/flash accessibles :`);
    flashModels.sort().forEach(n => console.log(`  - ${n}`));
  } catch (e) {
    console.error('Erreur:', e.message);
  }
})();
