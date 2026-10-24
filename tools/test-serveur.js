/**
 * Tests des fonctions pures du serveur (tools/test-serveur.js).
 *
 * Ces tests simulent une réponse de l'IA : ils vérifient que la chaîne
 * complète (prompt → normalisation → rendu) ne contient aucune variable
 * non définie et que la langue / le programme du pays sont respectés.
 *
 * Usage : node tools/test-serveur.js
 */
const path = require('path');

process.chdir(path.resolve(__dirname, '..'));
const srv = require(path.resolve(__dirname, '..', 'server.js'));

let ok = 0;
let ko = 0;

function test(nom, condition, detail = '') {
  if (condition) {
    ok++;
    console.log(`OK    | ${nom}`);
  } else {
    ko++;
    console.log(`KO    | ${nom}${detail ? ' → ' + detail : ''}`);
  }
}

// ─────────────────────────────────────────────────────────────
// 1. Normalisation des chapitres (le bug « serie is not defined »)
// ─────────────────────────────────────────────────────────────
const chapitresIA = [{
  title: 'SA 1 : Suites numériques et récurrence',
  cours: 'Définition : une suite est une fonction définie sur N.',
  exemple: { titre: 'Exemple', enonce: 'Calculer u3', solution: 'u3 = 7' },
  exercice: {
    consigne: 'Question 1',
    question: 'Que vaut u3 ?',
    type: 'qcm',
    options: ['a) 5', 'b) 7', 'c) 9', 'd) 11'],
    correctOption: 'b',
    explication: 'Par la définition.'
  }
}];

let normalises = null;
let erreurNormalisation = null;
try {
  normalises = srv.normalizeChapters(chapitresIA, 'bac', 'Mathématiques', 'C');
} catch (e) {
  erreurNormalisation = e;
}
test('normalizeChapters ne lève pas d\'erreur', !erreurNormalisation, erreurNormalisation && erreurNormalisation.message);
test('normalizeChapters renvoie un chapitre', Array.isArray(normalises) && normalises.length === 1);
if (normalises && normalises[0]) {
  const ch = normalises[0];
  test('le chapitre porte son niveau', ch.niveau === 'bac', `niveau=${ch.niveau}`);
  test('le chapitre porte sa matière', ch.subject === 'Mathématiques', `subject=${ch.subject}`);
  test('le chapitre porte sa série', ch.serie === 'C', `serie=${ch.serie}`);
  test('le chapitre garde son contenu', typeof ch.cours === 'string' && ch.cours.length > 0);
  test('le premier chapitre est gratuit', ch.isFree === true);
  test('la bonne réponse est conservée', ch.exercice && ch.exercice.correctOption === 'b');
}

// ─────────────────────────────────────────────────────────────
// 2. Prompt de cours : langue et programme du pays
// ─────────────────────────────────────────────────────────────
(async () => {
  const ctxGH = srv.contextFromRequest(
    { url: '/v1/ai/generate-course', headers: { host: 'revisy.onrender.com' } },
    { pays: 'GH' }
  );
  const ctxBJ = srv.contextFromRequest(
    { url: '/v1/ai/generate-course', headers: { host: 'revisy.onrender.com' } },
    { pays: 'BJ' }
  );

  test('le contexte Ghana est en anglais', ctxGH.langue === 'en', `langue=${ctxGH.langue}`);
  test('le contexte Bénin est en français', ctxBJ.langue === 'fr', `langue=${ctxBJ.langue}`);

  const promptGH = await srv.buildCoursePrompt({
    subjectName: 'Mathématiques', niveau: 'bac', serie: 'C', sequences: [], parts: [], ctx: ctxGH
  });
  test('le prompt GH impose l\'anglais', /anglais|English/i.test(promptGH));
  test('le prompt GH n\'impose plus le français', !/Utilise uniquement le français/.test(promptGH));
  test('le prompt GH demande le programme du pays', /Ghana/.test(promptGH));
  test('le prompt GH contient les options QCM en anglais', /Incorrect statement/.test(promptGH));

  const promptBJ = await srv.buildCoursePrompt({
    subjectName: 'Mathématiques', niveau: 'bac', serie: 'C', sequences: [], parts: [], ctx: ctxBJ
  });
  test('le prompt BJ impose le français', /français/i.test(promptBJ));
  test('le prompt BJ utilise le programme du Bénin', /Bénin/.test(promptBJ));

  // ───────────────────────────────────────────────────────────
  // 3. Prompt d'exercices : libellés localisés
  // ───────────────────────────────────────────────────────────
  const promptExGH = srv.buildChapterExercisesPrompt('Chapter 1', 'Mathematics', 'bac', 'C', 'course text', 50, ctxGH);
  test('le prompt d\'exercices GH est en anglais', /comprehension MCQ/.test(promptExGH));
  test('le prompt d\'exercices GH n\'impose pas le français', !/QCM de compréhension/.test(promptExGH));

  const promptExBJ = srv.buildChapterExercisesPrompt('Chapitre 1', 'Mathématiques', 'brevet', '', '', 50, ctxBJ);
  test('le prompt d\'exercices BJ est en français', /QCM de compréhension/.test(promptExBJ));

  // ───────────────────────────────────────────────────────────
  // 4. Normalisation des exercices (50 QCM + Vrai/Faux)
  // ───────────────────────────────────────────────────────────
  const exercicesIA = {
    exercices: [
      { consigne: 'Question 1', question: '2 + 2 = ?', type: 'qcm', options: ['a) 3', 'b) 4'], correctOption: 'b', explication: 'ok' },
      { consigne: 'Question 2', question: 'La terre est ronde.', type: 'vf', options: ['True', 'False'], correctOption: 'true', explication: 'ok' }
    ]
  };
  const exNorm = srv.normalizeChapterExercises(exercicesIA.exercices, ctxGH);
  test('les exercices sont normalisés', Array.isArray(exNorm) && exNorm.length === 2, `n=${exNorm && exNorm.length}`);
  if (exNorm && exNorm[0]) {
    test('la bonne réponse QCM est un index', typeof exNorm[0].correctIndex === 'number' && exNorm[0].correctIndex === 1, `correctIndex=${exNorm[0].correctIndex}`);
    test('les options Vrai/Faux sont en anglais', exNorm[1] && exNorm[1].options.join('|') === 'True|False', exNorm[1] && exNorm[1].options.join('|'));
  }

  // ───────────────────────────────────────────────────────────
  // 5. Contenu payant protégé
  // ───────────────────────────────────────────────────────────
  const quatre = srv.normalizeChapters(
    [0, 1, 2, 3].map(i => ({ ...chapitresIA[0], title: `SA ${i + 1} : Chapitre ${i + 1}` })),
    'bac', 'Mathématiques', 'C'
  );
  const proteges = srv.protectChapters(quatre, 'bac', null);
  test('les 3 premiers chapitres restent gratuits',
    !proteges[0].locked && !proteges[1].locked && !proteges[2].locked);
  test('un chapitre payant est verrouillé sans abonnement', proteges[3] && proteges[3].locked === true);
  test('le contenu payant est retiré', proteges[3] && proteges[3].cours === '');
  test('le chapitre verrouillé garde niveau et matière', proteges[3] && proteges[3].niveau === 'bac' && proteges[3].subject === 'Mathématiques');

  console.log('\n====================================================');
  console.log(`${ok} test(s) réussi(s), ${ko} échec(s).`);
  console.log('====================================================');
  process.exitCode = ko ? 1 : 0;
})();
