/* eslint-disable */
// Test qualité Gemini sur 3 chapitres variés.
// Usage : node tools/test-gemini.js
// Pré-requis : GEMINI_API_KEY configurée dans .env

const fs = require('fs');
const path = require('path');

// ============================================================
// Charger .env (copie minimale de server.js pour ne pas
// importer tout le module et ses éventuels side-effects)
// ============================================================
function loadLocalEnv() {
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
loadLocalEnv();

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey || apiKey === 'cle_api_gemini_reelle' || apiKey.length < 20) {
  console.error('❌ GEMINI_API_KEY non configurée (ou placeholder) dans .env');
  console.error('   Édite .env à la racine du projet et ajoute ta vraie clé :');
  console.error('   GEMINI_API_KEY=AIzaSy...');
  process.exit(1);
}

// ============================================================
// 3 chapitres test — variety check
// ============================================================
const TESTS = [
  {
    subject: 'Mathématiques',
    niveau: 'bac',
    serie: 'C',
    chapter: 'Primitives et intégrales',
    why: 'Maths denses — formules, théorème fondamental, calculs'
  },
  {
    subject: 'SVT',
    niveau: 'bac',
    serie: 'D',
    chapter: 'Immunologie et système immunitaire',
    why: 'Biologie technique — vocabulaire spécialisé, schémas mentaux'
  },
  {
    subject: 'Français & Littérature',
    niveau: 'bac',
    serie: 'A',
    chapter: 'Texte argumentatif et dissertation',
    why: 'Littéraire — méthodologie, plan dialectique, exemples béninois'
  }
];

// ============================================================
// Curriculum (extrait — uniquement ce qui sert au test)
// ============================================================
const CURRICULUM = {
  bac: {
    C: { 'Mathématiques': ['Suites', 'Vecteurs', 'Logarithmes', 'Primitives et intégrales', 'Équations différentielles'] },
    D: { 'SVT': ['Cellule', 'Génétique', 'Immunologie et système immunitaire', 'Système nerveux'] },
    A: { 'Français & Littérature': ['Texte argumentatif et dissertation', 'Commentaire composé', 'Littérature africaine'] }
  }
};

// ============================================================
// Construction du prompt (aligné avec server.js:buildCoursePrompt)
// ============================================================
function buildPrompt(subjectName, niveau, serie, chapterTitle) {
  const niveauLabel = `Terminale BAC série ${serie}`;
  const topics = (CURRICULUM[niveau] && CURRICULUM[niveau][serie] && CURRICULUM[niveau][serie][subjectName]) || [];

  return `Tu es un professeur expert du système éducatif béninois (programme MEMP/OBB).
Génère un contenu de révision COMPLET pour le chapitre "${chapterTitle}" de ${subjectName}, niveau ${niveauLabel}.

Le programme officiel couvre : ${topics.join(', ')}.

Réponds UNIQUEMENT en JSON valide, sans markdown, sous cette forme exacte :
{
  "title": "Titre exact du chapitre",
  "cours": "Cours complet et explicite — entre 1500 et 2500 caractères. Inclus : définitions précises, théorèmes essentiels, formules, méthodes de résolution, exemples numériques ou concrets, pièges classiques à l'examen béninois. Rédige comme si l'élève n'avait aucun autre document.",
  "exemple": {
    "titre": "Exemple résolu — type examen béninois",
    "enonce": "Énoncé réaliste d'examen, contexte béninois si pertinent",
    "solution": "Solution détaillée pas-à-pas avec justifications et conclusion"
  },
  "exercice": {
    "consigne": "QCM — Application directe (ou Vrai/Faux)",
    "question": "Question précise portant sur une notion clé du chapitre",
    "type": "qcm" | "vf",
    "options": ["a) Proposition plausible", "b) Proposition correcte", "c) Proposition plausible mais fausse", "d) Proposition fausse"],
    "correctOption": "b" | "vrai" | "faux",
    "explication": "Explication claire et pédagogique (3-5 phrases) : pourquoi la bonne réponse est correcte, et pourquoi les autres sont fausses"
  }
}

Contraintes impératives :
- Cours substantiel et pédagogique (1500+ caractères)
- Vocabulaire scolaire béninois — pas d'anglicisme technique inutile
- L'exemple doit être réaliste et différent d'un sujet générique
- L'exercice doit tester une compréhension réelle, pas de la mémorisation
- Jamais le mot "Correct" ou "Bonne réponse" dans les options visibles
- La réponse correcte est indiquée UNIQUEMENT dans correctOption`;
}

// ============================================================
// Appel Gemini
// ============================================================
async function callGemini(prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.4,
        responseMimeType: 'application/json'
      }
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status} : ${text.substring(0, 200)}`);
  }
  return response.json();
}

function extractJson(text) {
  const cleaned = String(text || '').trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) return JSON.parse(cleaned.slice(start, end + 1));
    throw new Error('JSON invalide');
  }
}

// ============================================================
// Validation du contenu généré
// ============================================================
function validate(content) {
  const errors = [];
  const warnings = [];

  if (!content.title) errors.push('title manquant');
  if (!content.cours || content.cours.length < 800) errors.push(`cours trop court (${content.cours?.length || 0} chars, min 800)`);
  if (content.cours && content.cours.length < 1500) warnings.push(`cours < 1500 chars (recommandé)`);

  if (!content.exemple?.titre || !content.exemple?.enonce || !content.exemple?.solution) {
    errors.push('exemple incomplet (titre/enonce/solution requis)');
  }

  if (!content.exercice?.question) errors.push('exercice.question manquant');
  if (!content.exercice?.type) errors.push('exercice.type manquant');

  if (content.exercice?.type === 'qcm') {
    if (!Array.isArray(content.exercice.options) || content.exercice.options.length < 2) {
      errors.push('QCM : 2+ options requises');
    }
    if (!['a', 'b', 'c', 'd'].includes(content.exercice.correctOption)) {
      errors.push(`QCM : correctOption invalide (${content.exercice.correctOption})`);
    }
    // Vérifier qu'aucune option ne contient "Correct" ou "Bonne réponse"
    (content.exercice.options || []).forEach((opt, i) => {
      if (/correct|bonne r[eé]ponse/i.test(opt)) {
        warnings.push(`option ${i} révèle la réponse (contient "Correct" ou "Bonne réponse")`);
      }
    });
  } else if (content.exercice?.type === 'vf') {
    if (!['vrai', 'faux'].includes(content.exercice.correctOption)) {
      errors.push(`VF : correctOption invalide (${content.exercice.correctOption})`);
    }
  } else {
    errors.push(`exercice.type inconnu : ${content.exercice?.type}`);
  }

  return { errors, warnings };
}

// ============================================================
// Affichage résultats
// ============================================================
function displayChapter(test, content, elapsed, validation) {
  const { errors, warnings } = validation;

  console.log(`   ⏱️  Temps de génération : ${elapsed}s`);
  console.log(`   📏 Cours : ${content.cours?.length || 0} caractères`);
  console.log(`   🧪 Exercice : ${content.exercice?.type === 'qcm' ? 'QCM' : 'Vrai/Faux'} (${content.exercice?.options?.length || 0} options)`);

  const status = errors.length === 0 ? '✅ Valide' : '❌ Invalide';
  console.log(`   ${status}${warnings.length ? `  ⚠️  ${warnings.length} avertissement(s)` : ''}`);

  console.log(`\n   📖 APERÇU COURS (début) :`);
  const preview = (content.cours || '').substring(0, 400).replace(/\n/g, '\n   ');
  console.log(`   ${preview}${content.cours?.length > 400 ? '...' : ''}`);

  console.log(`\n   ❓ EXERCICE :`);
  console.log(`   Q : ${content.exercice?.question || '(vide)'}`);
  if (content.exercice?.type === 'qcm') {
    (content.exercice?.options || []).forEach(o => console.log(`      ${o}`));
  } else {
    (content.exercice?.options || []).forEach(o => console.log(`      ${o}`));
  }
  console.log(`   ✓ Réponse : ${content.exercice?.correctOption}`);

  console.log(`\n   💡 EXPLICATION :`);
  console.log(`   ${content.exercice?.explication || '(vide)'}`);

  if (errors.length) console.log(`\n   ❌ Erreurs : ${errors.join(' | ')}`);
  if (warnings.length) console.log(`   ⚠️  Warnings : ${warnings.join(' | ')}`);
}

// ============================================================
// MAIN
// ============================================================
(async () => {
  console.log('🧪 TEST QUALITÉ GEMINI — 3 CHAPITRES VARIÉS');
  console.log('━'.repeat(60));
  console.log(`📦 Modèle : ${GEMINI_MODEL}`);
  console.log(`🔑 Clé API : ${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`);
  console.log(`🎯 Objectif : valider que Gemini peut produire du contenu pédagogique utilisable\n`);

  const results = [];

  for (let i = 0; i < TESTS.length; i++) {
    const t = TESTS[i];
    const num = i + 1;

    console.log(`\n${'━'.repeat(60)}`);
    console.log(`📚 TEST ${num}/3 — ${t.subject} ${t.niveau === 'bac' ? `(BAC ${t.serie})` : 'Brevet'}`);
    console.log(`   Chapitre : ${t.chapter}`);
    console.log(`   Pourquoi : ${t.why}\n`);

    const start = Date.now();
    try {
      const prompt = buildPrompt(t.subject, t.niveau, t.serie, t.chapter);
      const raw = await callGemini(prompt);
      const text = raw.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const content = extractJson(text);
      const elapsed = ((Date.now() - start) / 1000).toFixed(1);
      const validation = validate(content);

      displayChapter(t, content, elapsed, validation);
      results.push({ test: t, content, elapsed, validation, success: true });

    } catch (err) {
      console.error(`   ❌ Erreur : ${err.message}`);
      results.push({ test: t, error: err.message, success: false });
    }

    if (i < TESTS.length - 1) {
      console.log('\n⏳ Pause 2s (rate limit)…');
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  // ============================================================
  // Résumé
  // ============================================================
  console.log(`\n\n${'═'.repeat(60)}`);
  console.log('📊 RÉSUMÉ');
  console.log('═'.repeat(60));

  results.forEach((r) => {
    if (!r.success) {
      console.log(`❌ ${r.test.subject} — ${r.test.chapter} : ERREUR (${r.error})`);
    } else {
      const v = r.validation;
      const status = v.errors.length === 0 ? '✅' : '❌';
      const detail = v.errors.length === 0
        ? `${r.elapsed}s, cours ${r.content.cours?.length || 0} chars`
        : `${v.errors.length} erreur(s)`;
      console.log(`${status} ${r.test.subject} — ${r.test.chapter} : ${detail}`);
    }
  });

  // Sauvegarde JSON pour analyse ultérieure
  const outPath = path.join(__dirname, 'test-results.json');
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2), 'utf8');
  console.log(`\n💾 Résultats détaillés sauvegardés : ${outPath}`);

  const allOk = results.every(r => r.success && r.validation.errors.length === 0);
  if (allOk) {
    console.log('\n✅ TOUS LES CHAPITRES PASSENT LA VALIDATION');
    console.log('   → On peut câbler la génération lazy en confiance.');
  } else {
    console.log('\n⚠️  Au moins un chapitre a des problèmes.');
    console.log('   → On ajustera le prompt ou le validateur avant d\'aller plus loin.');
  }
})();
