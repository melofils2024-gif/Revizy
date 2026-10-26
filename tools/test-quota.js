/**
 * Tests de la résilience au quota IA (tools/test-quota.js).
 *
 * Le quota gratuit Google (20 requêtes/JOUR et par modèle) n'est pas
 * extensible. Ces tests vérifient que le site :
 *   - plafonne ses appels IA (budget global + budget par modèle) ;
 *   - conserve le contenu déjà généré (cache disque durable) ;
 *   - reste utilisable quand l'IA est indisponible (repli local, pas 502).
 *
 * Usage : node tools/test-quota.js
 */
const path = require('path');
const { spawn } = require('child_process');

process.chdir(path.resolve(__dirname, '..'));
const srv = require(path.resolve(__dirname, '..', 'server.js'));
const { BudgetQuota, CacheDisque } = require(path.resolve(__dirname, '..', 'ai_quota.js'));
const { CONTEXTS, resolveContext } = require(path.resolve(__dirname, '..', 'contexts.js'));

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
// 1. Budget d'appels IA
// ─────────────────────────────────────────────────────────────
const budget = new BudgetQuota({ budgetTotal: 3, budgetParModele: 2 });

test('le budget autorise le premier appel', budget.autorise('modele-a').ok === true);
test('le budget autorise le deuxième appel du même modèle', budget.autorise('modele-a').ok === true);
const refusModele = budget.autorise('modele-a');
test('le quota par modèle est plafonné', refusModele.ok === false, JSON.stringify(refusModele));
test('le refus indique la raison', refusModele.raison === 'quota-modele-atteint', refusModele.raison);
test('un autre modèle passe encore', budget.autorise('modele-b').ok === true);
const refusGlobal = budget.autorise('modele-c');
test('le budget global est plafonné', refusGlobal.ok === false, JSON.stringify(refusGlobal));
test('le refus global indique la raison', refusGlobal.raison === 'budget-quotidien-atteint', refusGlobal.raison);

const etat = budget.etat();
test('l\'état compte les appels', etat.utilise === 3, `utilise=${etat.utilise}`);
test('l\'état expose le budget global', etat.budgetTotal === 3);
test('l\'état expose le budget par modèle', etat.budgetParModele === 2);
test('l\'état expose le délai avant réessai', etat.retryDansSecondes > 0, `retry=${etat.retryDansSecondes}`);
test('l\'état détaille chaque modèle', etat.parModele['modele-a'] === 2, JSON.stringify(etat.parModele));

budget.reinitialiser();
test('la réinitialisation libère le budget', budget.autorise('modele-a').ok === true);

// Le plafond dépend de la famille : les modèles « lite » ont un quota Google
// bien plus large (~1 500/j) que les modèles flash standard (~20/j).
const budgetFamilles = new BudgetQuota({ budgetTotal: 100, budgetParModele: 2, budgetParModeleLite: 6 });
test('le modèle standard est plafonné à son budget',
  budgetFamilles.autorise('gemini-3.5-flash').ok
  && budgetFamilles.autorise('gemini-3.5-flash').ok
  && budgetFamilles.autorise('gemini-3.5-flash').ok === false);
test('le modèle lite a un plafond plus large',
  budgetFamilles.autorise('gemini-3.5-flash-lite').ok === true);
test('le budget global reste prioritaire',
  (() => {
    const petit = new BudgetQuota({ budgetTotal: 1, budgetParModele: 10, budgetParModeleLite: 10 });
    const premier = petit.autorise('gemini-3.5-flash-lite').ok;
    const second = petit.autorise('gemini-3.5-flash-lite').ok;
    return premier === true && second === false;
  })());

// ─────────────────────────────────────────────────────────────
// 2. Cache durable sur disque
// ─────────────────────────────────────────────────────────────
const dossierCache = path.join(__dirname, '..', 'cache', 'test-quota');
const cache = new CacheDisque(dossierCache, { ttlMs: 60 * 1000, maxFichiers: 5 });

cache.set('cle-test', { chapitres: [{ num: 1, title: 'Chapitre 1' }] });
const relu = cache.get('cle-test');
test('le cache disque relit une entrée', !!relu && Array.isArray(relu.chapitres) && relu.chapitres.length === 1);
test('le cache disque ignore une clé inconnue', cache.get('cle-inconnue') === null);

const cacheExpire = new CacheDisque(dossierCache, { ttlMs: -1 });
cacheExpire.set('cle-expiree', { valeur: 1 });
test('le cache disque respecte la durée de vie', cacheExpire.get('cle-expiree') === null);

test('le cache serveur est actif', srv.cacheDisque && srv.cacheDisque.actif === true,
  srv.cacheDisque ? `erreur=${srv.cacheDisque.erreur}` : 'absent');

// ─────────────────────────────────────────────────────────────
// 3. Repli local (cours construit sans IA)
// ─────────────────────────────────────────────────────────────
const coursBJ = srv.construireCoursLocal('Mathématiques', 'bac', 'C', CONTEXTS.BJ);
test('le repli local renvoie des chapitres', Array.isArray(coursBJ) && coursBJ.length > 0);
test('le repli local utilise le programme du pays', coursBJ.length > 1,
  `chapitres=${coursBJ.length}`);
test('le repli local donne un contenu non vide',
  typeof coursBJ[0].cours === 'string' && coursBJ[0].cours.length > 20);
test('le repli local est en français (pays francophone)',
  /programme officiel/i.test(coursBJ[0].cours), coursBJ[0].cours.slice(0, 60));
test('le repli local rend les chapitres gratuits', coursBJ.every(c => c.isFree === true && c.price === 0));
test('le repli local donne des identifiants stables',
  coursBJ.every(c => typeof c.id === 'string' && c.id.startsWith('bj_')),
  coursBJ[0] ? coursBJ[0].id : '');

const ctxGH = resolveContext({ code: 'GH' });
test('le contexte Ghana est résolu', ctxGH && ctxGH.code === 'GH', ctxGH ? ctxGH.code : 'null');
const coursGH = srv.construireCoursLocal('Mathematics', 'bac', 'C', ctxGH);
test('le repli local marche pour un pays sans programme embarqué',
  Array.isArray(coursGH) && coursGH.length > 0);
test('le repli local est en anglais pour le Ghana',
  /Welcome to the/i.test(coursGH[0].cours), coursGH[0].cours.slice(0, 60));
test('le repli local cite le pays de l\'apprenant',
  /Ghana/i.test(coursGH[0].cours), coursGH[0].cours.slice(0, 60));

const ctxTG = resolveContext({ code: 'TG' });
const coursTGNonProgramme = srv.construireCoursLocal('Mathématiques', 'bac', 'C', ctxTG);
test('un pays sans programme pour la matière ne reçoit pas le programme d\'un autre pays',
  Array.isArray(coursTGNonProgramme), JSON.stringify(coursTGNonProgramme).slice(0, 80));

// ─────────────────────────────────────────────────────────────
// 4. Budget appliqué par le serveur
// ─────────────────────────────────────────────────────────────
const etatIA = srv.etatQuotaIA();
test('le serveur expose son budget IA', typeof etatIA.utilise === 'number' && typeof etatIA.budgetTotal === 'number');
test('le budget du serveur est sous le quota Google (20/jour/modèle standard)',
  etatIA.budgetParModele <= 20, `budgetParModele=${etatIA.budgetParModele}`);
test('le budget des modèles lite est sous leur quota Google (~1 500/jour)',
  etatIA.budgetParModeleLite <= 1500, `budgetParModeleLite=${etatIA.budgetParModeleLite}`);
test('le budget global reste sous la capacité totale des modèles',
  etatIA.budgetTotal <= (etatIA.budgetParModeleLite * 4) + (etatIA.budgetParModele * 6),
  `budgetTotal=${etatIA.budgetTotal}`);

// ─────────────────────────────────────────────────────────────
// 5. Test d'intégration : sans clé IA, le site répond quand même
// ─────────────────────────────────────────────────────────────
(async () => {
const PORT_TEST = 5099;
const serveur = spawn(process.execPath, ['server.js'], {
  cwd: path.resolve(__dirname, '..'),
  env: {
    ...process.env,
    PORT: String(PORT_TEST),
    // Valeur filtrée par le serveur : aucune clé IA exploitable.
    GEMINI_API_KEY: 'cle_api_gemini_reelle',
    GEMINI_API_KEY_2: '',
    // Base injoignable : on teste le repli sans IA, pas la lecture en base.
    SUPABASE_URL: 'http://127.0.0.1:9',
    SUPABASE_ANON_KEY: 'sb_injoignable',
    SUPABASE_SERVICE_KEY: '',
    // Cache isolé : le test ne doit pas lire le cache du serveur de dev.
    AI_CACHE_DIR: path.join(__dirname, '..', 'cache', 'test-quota-serveur')
  },
  stdio: ['ignore', 'pipe', 'pipe']
});

let sortieServeur = '';
serveur.stdout.on('data', d => { sortieServeur += d.toString(); });
serveur.stderr.on('data', d => { sortieServeur += d.toString(); });

async function attendreServeur(tentatives = 40) {
  for (let i = 0; i < tentatives; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT_TEST}/v1/ai/health`);
      if (res.ok) return true;
    } catch (_) { /* pas encore prêt */ }
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  return false;
}

async function post(url, body) {
  const res = await fetch(`http://127.0.0.1:${PORT_TEST}${url}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return { status: res.status, data: await res.json() };
}

const demarre = await attendreServeur();
test('le serveur de test démarre', demarre, sortieServeur.slice(-200));

if (demarre) {
  // Le cours d'un pays sans clé IA : repli local, jamais 502.
  const cours = await post('/v1/ai/generate-course', {
    subjectName: 'Mathématiques', niveau: 'bac', serie: 'C', pays: 'BJ'
  });
  test('sans IA, le cours répond 200', cours.status === 200, `status=${cours.status}`);
  test('sans IA, le cours est en mode local', cours.data.source === 'local', JSON.stringify(cours.data).slice(0, 120));
  test('sans IA, des chapitres sont livrés',
    Array.isArray(cours.data.chapitres) && cours.data.chapitres.length > 0);
  test('sans IA, le chapitre a du contenu',
    !!cours.data.chapitres && typeof cours.data.chapitres[0].cours === 'string' && cours.data.chapitres[0].cours.length > 20);

  // Les exercices : repli local, pas d'erreur 502.
  const exos = await post('/v1/ai/chapter-exercises', {
    subjectName: 'Mathématiques', niveau: 'bac', serie: 'C', pays: 'BJ',
    chapterTitle: 'Suites numériques', count: 50
  });
  test('sans IA, les exercices répondent 200', exos.status === 200, `status=${exos.status}`);
  test('sans IA, les exercices sont signalés locaux', exos.data.local === true, JSON.stringify(exos.data).slice(0, 120));

  // Le diagnostic reste utilisable et annonce le budget appliqué.
  const health = await fetch(`http://127.0.0.1:${PORT_TEST}/v1/ai/health`).then(r => r.json());
  test('le diagnostic annonce le budget appliqué',
    health.quota && typeof health.quota.budgetTotal === 'number', JSON.stringify(health.quota || {}).slice(0, 120));
  test('le diagnostic n\'épuise pas le quota de service',
    health.quota && health.quota.utilise === 0, `utilise=${health.quota && health.quota.utilise}`);
}

serveur.kill();

// ─────────────────────────────────────────────────────────────
console.log(`\n${ok} test(s) réussi(s), ${ko} échec(s).`);
process.exit(ko ? 1 : 0);
})();
