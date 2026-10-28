/**
 * test-securite.js — contrôles de sécurité de Revizy.
 *
 * Deux parties :
 *   A. Analyse statique : ce qui DOIT être dans le code.
 *   B. Essais HTTP réels (vrai serveur + faux Supabase) : ce qui doit être
 *      REFUSÉ, et ce qui doit fonctionner.
 *
 * L'objectif : un visiteur ne doit pas atteindre l'espace administrateur,
 * même en forçant le rôle dans le navigateur.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const net = require('net');

const RACINE = path.resolve(__dirname, '..');

let ok = 0;
let ko = 0;
function test(nom, condition, detail) {
  if (condition) {
    ok++;
    console.log(`OK    | ${nom}`);
  } else {
    ko++;
    console.log(`KO    | ${nom}${detail ? ' → ' + detail : ''}`);
  }
}

// ── A. Analyse statique ───────────────────────────────────────────────
console.log('\n═══ A. Analyse statique ═══');

const indexHtml = fs.readFileSync(path.join(RACINE, 'index.html'), 'utf8');
const adminHtml = fs.readFileSync(path.join(RACINE, 'admin.html'), 'utf8');
const appJs = fs.readFileSync(path.join(RACINE, 'app.js'), 'utf8');
const serverJs = fs.readFileSync(path.join(RACINE, 'server.js'), 'utf8');
const sqlSecu = fs.readFileSync(path.join(RACINE, 'schema_securite.sql'), 'utf8');

test('le HTML public ne contient pas la vue admin', !indexHtml.includes('view-admin-dashboard'));
test('le HTML public ne contient pas le formulaire d\'épreuve',
  !indexHtml.includes('adminEpreuveForm'));
test('le HTML public ne contient pas le tableau des élèves',
  !indexHtml.includes('adminUserList'));
test('la page admin est dans un fichier séparé', adminHtml.includes('view-admin-dashboard'));
test('la page admin contient le formulaire d\'épreuve', adminHtml.includes('adminEpreuveForm'));
test('la page admin contient le tableau des élèves', adminHtml.includes('adminUserList'));

test('admin.html n\'est pas dans la liste des fichiers publics',
  !/PUBLIC_FILES[\s\S]{0,400}admin\.html/.test(serverJs));

test('la base protège le rôle (déclencheur)', sqlSecu.includes('protect_profile_role'));
test('la base limite les colonnes modifiables par un élève',
  sqlSecu.includes('revoke update on public.profiles'));
test('la base tient un journal des actions admin', sqlSecu.includes('admin_journal'));

test('le navigateur n\'écrit plus le rôle',
  !appJs.includes("role: 'client'") && !/update\(\{[^}]*role:/.test(appJs));
test('le client gère la double authentification',
  appJs.includes('exigerDoubleAuthentification') && appJs.includes('mfa.challenge'));
test('le client charge la page admin à la demande',
  appJs.includes('chargerPanneauAdmin') && appJs.includes('/admin-panel'));

// Toutes les fonctions qui gèrent l'espace admin doivent passer par
// exigerAdmin (le contrôle unique : rôle en base + double authentification).
// handleAdminPanel fait exception : il teste lui-même l'accès pour répondre
// 404 (page inexistante) au lieu de 401/403.
const handlersAdmin = (serverJs.match(/async function handleAdmin\w+/g) || [])
  .filter(nom => !nom.includes('handleAdminPanel'));
const appelsExiger = (serverJs.match(/await exigerAdmin\(req, res\)/g) || []).length;
test(`tous les handlers admin passent par exigerAdmin (${handlersAdmin.length} handlers)`,
  handlersAdmin.length > 0 && appelsExiger >= handlersAdmin.length,
  `${appelsExiger} appels pour ${handlersAdmin.length} handlers`);
test('la page admin teste elle-même l\'accès (404 plutôt que 401)',
  /async function handleAdminPanel[\s\S]{0,900}is_admin\(\)|async function handleAdminPanel[\s\S]{0,900}entitlements\.isAdmin/.test(serverJs));
test('le contrôle admin exige le rôle ET la double authentification',
  /async function exigerAdmin[\s\S]{0,1200}mfaExige\(\)/.test(serverJs));
test('les réponses admin ne sont pas mises en cache',
  /no-store/.test(serverJs));
test('une réponse admin porte la protection no-store',
  /chemin\.startsWith\('\/v1\/admin'\)/.test(serverJs));

// ── Formulaire de questions : champ « Chapitre » et minimum 4 options ──
test('le formulaire de question a un sélecteur de chapitre',
  adminHtml.includes('id="adminQChapitre"'));
test('le formulaire de question a un groupe « chapitre » masqué',
  adminHtml.includes('id="adminQChapitreGroup"'));
test('le formulaire d\'exercice a aussi un sélecteur de chapitre',
  adminHtml.includes('id="adminExChapitre"'));
test('le QCM propose 4 options (A, B, C, D)',
  ['adminQcmOptA', 'adminQcmOptB', 'adminQcmOptC', 'adminQcmOptD'].every(id => adminHtml.includes(`id="${id}"`)));
test('le message « au moins 4 options » est affiché',
  /au moins 4 options/i.test(adminHtml));
test('le changement de SA recharge la liste des chapitres',
  /onchange="[^"]*updateAdminQChapitres\(\)/.test(adminHtml)
  && /onchange="[^"]*updateAdminExChapitres\(\)/.test(adminHtml));
test('le client sait remplir la liste des chapitres',
  appJs.includes('function fillChapitreSelect') && appJs.includes('function updateAdminQChapitres')
  && appJs.includes('function updateAdminExChapitres'));
test('le client enregistre la question côté serveur',
  appJs.includes('/admin/exercices') && /async function handleAddQCM/.test(appJs)
  && /async function handleAddExercice/.test(appJs));
test('le serveur exige au moins 4 options',
  /OPTIONS_QCM_MIN\s*=\s*4/.test(serverJs)
  && /Un QCM exige au moins/.test(serverJs));

// ── B. Essais HTTP ────────────────────────────────────────────────────
console.log('\n═══ B. Essais HTTP (serveur réel + faux Supabase) ═══');

const UTILISATEURS = {
  ELEVE: { id: '11111111-1111-4111-8111-111111111111', email: 'eleve@test.bj', user_metadata: {} },
  ADMIN: { id: '22222222-2222-4222-8222-222222222222', email: 'admin@test.bj', user_metadata: {} }
};

function jetonTest(nom, aal) {
  const entete = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const charge = Buffer.from(JSON.stringify({
    sub: nom, aal, role: 'authenticated', exp: Math.floor(Date.now() / 1000) + 3600
  })).toString('base64url');
  return `${entete}.${charge}.signature-de-test`;
}

const JETONS = {
  ELEVE: jetonTest('ELEVE', 'aal1'),
  ADMIN_SANS_MFA: jetonTest('ADMIN', 'aal1'),
  ADMIN: jetonTest('ADMIN', 'aal2')
};
const NOM_PAR_JETON = new Map([
  [JETONS.ELEVE, 'ELEVE'],
  [JETONS.ADMIN_SANS_MFA, 'ADMIN'],
  [JETONS.ADMIN, 'ADMIN']
]);

const TABLES = {
  profiles: [
    { id: UTILISATEURS.ELEVE.id, email: UTILISATEURS.ELEVE.email, name: 'Élève', role: 'client', pays: 'BJ', classe: 'Tle', niveau: 'bac', user_token: 'ELEVE' },
    { id: UTILISATEURS.ADMIN.id, email: UTILISATEURS.ADMIN.email, name: 'Admin', role: 'admin', pays: 'BJ', classe: 'Tle', niveau: 'bac', user_token: 'ADMIN' }
  ],
  chapters: [
    {
      id: '33333333-3333-4333-8333-333333333333',
      slug: 'bj-bac-tle-c-genetique-1',
      title: 'Génétique formelle — chromosome 1',
      niveau_code: 'bac',
      serie_code: 'C',
      subject_name: 'SVT',
      prix: 200,
      price: 200,
      exercices: []
    }
  ],
  epreuves: [],
  epreuve_corrections: [],
  admin_journal: [],
  subscriptions: [],
  unlocked_chapters: [],
  unlocked_epreuves: [],
  payment_receipts: [],
  epreuves_activites: [],
  epreuves_signalements: [],
  chapters_banque: [],
  profiles_chapitre: []
};

// Transaction FedaPay simulée (le serveur la relit via l'API).
const ETAT_FEDAPAY = {
  id: 'tx-test-1',
  status: 'approved',
  amount: 200,
  currency: 'XOF',
  reference: 'tx-test-1',
  metadata: { kind: 'chapter', niveau: 'bac', chapter_id: 'chapitre-1', user_id: UTILISATEURS.ELEVE.id },
  customer: { email: UTILISATEURS.ELEVE.email, firstname: 'Aline', lastname: 'Test' }
};

function fauxSupabase() {
  return http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://127.0.0.1');
    const json = (code, data) => {
      const corps = JSON.stringify(data);
      res.writeHead(code, { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(corps) });
      res.end(corps);
    };
    const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
    const nom = NOM_PAR_JETON.get(token) || token;

    if (url.pathname === '/auth/v1/user') {
      if (UTILISATEURS[nom]) json(200, UTILISATEURS[nom]);
      else json(401, { message: 'invalid token' });
      return;
    }

    // API FedaPay simulée : le serveur relit la transaction avant de
    // déblocer quoi que ce soit.
    if (/^\/v1\/transactions\/[^/]+$/.test(url.pathname)) {
      json(200, { 'v1/transaction': ETAT_FEDAPAY });
      return;
    }

    const m = url.pathname.match(/^\/rest\/v1\/([a-z_]+)/);
    if (!m) { json(404, { message: 'not found' }); return; }
    const table = m[1];
    if (!TABLES[table]) TABLES[table] = [];

    if (req.method === 'POST' || req.method === 'PATCH') {
      let brut = '';
      for await (const morceau of req) brut += morceau;
      let corps = {};
      try { corps = brut ? JSON.parse(brut) : {}; } catch (_) { corps = {}; }
      const lignes = Array.isArray(corps) ? corps : [corps];
      const ajouts = lignes.map((l, i) => Object.assign({}, l, {
        id: l.id || `id-${table}-${Date.now()}-${i}`
      }));
      if (req.method === 'POST') {
        TABLES[table].push(...ajouts);
      } else {
        // Le PATCH ne touche que les lignes filtrées (comme PostgREST).
        let cibles = TABLES[table].slice();
        for (const [cle, valeur] of url.searchParams.entries()) {
          if (['select', 'order', 'limit'].includes(cle)) continue;
          const [col, op, val] = cle.split('.');
          if (!col) continue;
          if (op === 'eq') cibles = cibles.filter(l => String(l[col]) === String(val));
          else if (op === 'in') {
            const liste = val.replace(/^\(|\)$/g, '').split(',').map(s => s.replace(/"/g, ''));
            cibles = cibles.filter(l => liste.includes(String(l[col])));
          }
        }
        cibles.forEach(l => Object.assign(l, ajouts[0] || {}));
      }
      json(req.method === 'POST' ? 201 : 200, ajouts);
      return;
    }

    // La RPC du programme : le back-office s'en sert pour retrouver un
    // chapitre réel avant d'y attacher une question.
    if (url.pathname === '/rest/v1/rpc/get_curriculum_chapters') {
      json(200, TABLES.chapters.map(c => ({
        id: c.id,
        title: c.title,
        slug: c.slug,
        niveau_code: c.niveau_code,
        serie_code: c.serie_code,
        subject_name: c.subject_name,
        locked: false,
        exercices: c.exercices
      })));
      return;
    }

    // GET : on filtre comme PostgREST (eq, gt, is.null).
    let lignes = TABLES[table].slice();
    if (table === 'profiles') lignes = lignes.filter(l => l.user_token === nom);
    for (const [cle, valeur] of url.searchParams.entries()) {
      if (['select', 'order', 'limit'].includes(cle)) continue;
      const [col, op, val] = cle.split('.');
      if (!col) continue;
      if (op === 'is' && val === 'null') lignes = lignes.filter(l => l[col] === null || l[col] === undefined);
      else if (op === 'eq') lignes = lignes.filter(l => String(l[col]) === String(val));
      else if (op === 'gt') lignes = lignes.filter(l => String(l[col]) > String(val));
      else if (op === 'in') {
        const liste = val.replace(/^\(|\)$/g, '').split(',').map(s => s.replace(/"/g, ''));
        lignes = lignes.filter(l => liste.includes(String(l[col])));
      }
    }
    json(200, lignes);
  });
}

function portLibre() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.listen(0, '127.0.0.1', () => {
      const port = srv.address().port;
      srv.close(() => resolve(port));
    });
    srv.on('error', reject);
  });
}

async function get(url, token) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${JETONS[token] || token}`;
  const res = await fetch(url, { headers });
  const type = res.headers.get('content-type') || '';
  const body = type.includes('application/json') ? await res.json() : await res.text();
  return { status: res.status, body, headers: res.headers };
}

async function post(url, token, charge) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${JETONS[token] || token}`;
  const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(charge) });
  const type = res.headers.get('content-type') || '';
  const body = type.includes('application/json') ? await res.json() : await res.text();
  return { status: res.status, body, headers: res.headers };
}

async function demarrer(port, supabasePort, envExtra) {
  const base = `http://localhost:${port}`;
  const enfant = spawn(process.execPath, ['server.js'], {
    cwd: RACINE,
    env: Object.assign({}, process.env, {
      PORT: String(port),
      APP_BASE_URL: base,
      APP_BASE_URL_FRONT: base,
      SUPABASE_URL: `http://127.0.0.1:${supabasePort}`,
      SUPABASE_ANON_KEY: 'jeton-anon-de-test',
      SUPABASE_SERVICE_KEY: 'jeton-service-de-test',
      FEDAPAY_API_URL: `http://127.0.0.1:${supabasePort}/v1`,
      FEDAPAY_SECRET_KEY: 'secret-de-test',
      FEDAPAY_PUBLIC_KEY: 'public-de-test',
      FEDAPAY_ENVIRONMENT: 'sandbox',
      GEMINI_API_KEY: '',
      JWT_SECRET: 'secret-jwt-de-test'
    }, envExtra || {}),
    stdio: ['ignore', 'pipe', 'pipe']
  });
  let sortie = '';
  enfant.stdout.on('data', d => { sortie += d.toString(); });
  enfant.stderr.on('data', d => { sortie += d.toString(); });

  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(`${base}/v1/ai/health`);
      if (r.ok) return { enfant, base, sortie: () => sortie };
    } catch (_) { /* pas encore prêt */ }
    await new Promise(r => setTimeout(r, 200));
  }
  return { enfant, base, sortie: () => sortie };
}

(async () => {
  const faux = fauxSupabase();
  await new Promise(resolve => faux.listen(0, '127.0.0.1', resolve));
  const portSupabase = faux.address().port;

  const portApp = await portLibre();
  const app = await demarrer(portApp, portSupabase, {});
  const base = app.base;

  // ── La page admin ───────────────────────────────────────────────────
  const panelAnonyme = await get(`${base}/admin-panel`);
  test('la page admin est introuvable pour un visiteur anonyme', panelAnonyme.status === 404,
    `statut ${panelAnonyme.status}`);

  const panelEleve = await get(`${base}/admin-panel`, 'ELEVE');
  test('la page admin est introuvable pour un élève', panelEleve.status === 404,
    `statut ${panelEleve.status}`);

  const panelSansMfa = await get(`${base}/admin-panel`, 'ADMIN_SANS_MFA');
  test('la page admin est refusée sans double authentification', panelSansMfa.status === 403,
    `statut ${panelSansMfa.status}`);

  const panelAdmin = await get(`${base}/admin-panel`, 'ADMIN');
  test('la page admin est servie à un admin doublement authentifié', panelAdmin.status === 200,
    `statut ${panelAdmin.status}`);
  test('la page admin servie contient bien le back-office',
    typeof panelAdmin.body === 'string' && panelAdmin.body.includes('view-admin-dashboard'));

  const panelFichier = await get(`${base}/admin.html`);
  test('le fichier admin.html n\'est pas téléchargeable en direct', panelFichier.status === 404,
    `statut ${panelFichier.status}`);

  // ── Les API admin ───────────────────────────────────────────────────
  const apiAnonyme = await get(`${base}/v1/admin/epreuves`);
  test('une API admin sans jeton est refusée (401)', apiAnonyme.status === 401,
    `statut ${apiAnonyme.status}`);

  const apiEleve = await get(`${base}/v1/admin/epreuves`, 'ELEVE');
  test('une API admin pour un élève est refusée (403)', apiEleve.status === 403,
    `statut ${apiEleve.status}`);

  const apiSansMfa = await get(`${base}/v1/admin/epreuves`, 'ADMIN_SANS_MFA');
  test('une API admin sans second facteur est refusée',
    apiSansMfa.status === 403 && apiSansMfa.body && apiSansMfa.body.code === 'MFA_REQUIS',
    `statut ${apiSansMfa.status} ${JSON.stringify(apiSansMfa.body || {}).slice(0, 120)}`);

  const apiAdmin = await get(`${base}/v1/admin/epreuves`, 'ADMIN');
  test('une API admin est accessible à un admin doublement authentifié', apiAdmin.status === 200,
    `statut ${apiAdmin.status}`);
  test('une réponse admin n\'est pas mise en cache',
    String(apiAdmin.headers.get('cache-control') || '').includes('no-store'),
    String(apiAdmin.headers.get('cache-control')));

  // ── L'état de la double authentification ────────────────────────────
  const moiSansMfa = await get(`${base}/v1/auth/me`, 'ADMIN_SANS_MFA');
  test('/auth/me signale la double authentification manquante',
    moiSansMfa.status === 200 && moiSansMfa.body.mfa && moiSansMfa.body.mfa.requis === true
    && moiSansMfa.body.mfa.valide === false,
    JSON.stringify(moiSansMfa.body && moiSansMfa.body.mfa || {}));

  const moiAvecMfa = await get(`${base}/v1/auth/me`, 'ADMIN');
  test('/auth/me confirme la double authentification',
    moiAvecMfa.status === 200 && moiAvecMfa.body.mfa && moiAvecMfa.body.mfa.valide === true,
    JSON.stringify(moiAvecMfa.body && moiAvecMfa.body.mfa || {}));

  const moiEleve = await get(`${base}/v1/auth/me`, 'ELEVE');
  test('/auth/me ne réclame pas de MFA à un élève',
    moiEleve.status === 200 && moiEleve.body.isAdmin === false && moiEleve.body.mfa.requis === false);

  // ── Le journal des actions ──────────────────────────────────────────
  const avantJournal = TABLES.admin_journal.length;
  const refus = await post(`${base}/v1/admin/epreuves`, 'ADMIN_SANS_MFA', {
    pays: 'BJ', niveau: 'bac', classe: 'Tle', serie: 'C', annee: 2026,
    matiere: 'Mathématiques', type: 'sujet', titre: 'Test refus', source_nom: 'Source', licence: 'CC BY'
  });
  test('une publication sans second facteur est refusée', refus.status === 403,
    `statut ${refus.status}`);
  test('une publication refusée n\'est pas journalisée',
    TABLES.admin_journal.length === avantJournal);

  const publication = await post(`${base}/v1/admin/epreuves`, 'ADMIN', {
    pays: 'BJ', niveau: 'bac', classe: 'Tle', serie: 'C', annee: 2026,
    matiere: 'Mathématiques', type: 'sujet', titre: 'Test journal',
    fichier_url: 'sujet-test.pdf', source_nom: 'ONEB', licence: 'domaine public',
    is_free: true, price: 0, published: true
  });
  test('une publication par un admin est acceptée', publication.status === 200,
    `statut ${publication.status} ${JSON.stringify(publication.body || {}).slice(0, 160)}`);
  test('l\'action est journalisée',
    TABLES.admin_journal.some(l => l.action === 'epreuve_creee'),
    JSON.stringify(TABLES.admin_journal.slice(-2)));

  // ── Limitation de débit sur l'espace admin ──────────────────────────
  let bloque = false;
  let requetes = 0;
  for (let i = 0; i < 60; i++) {
    requetes++;
    const r = await get(`${base}/v1/admin/epreuves`, 'ADMIN');
    if (r.status === 429) { bloque = true; break; }
  }
  test('la rafale sur l\'administration est bloquée (429)', bloque, `${requetes} requêtes`);

  app.enfant.kill();

  // ── Mode dégradé (ADMIN_MFA_REQUIS=off) ─────────────────────────────
  const portApp2 = await portLibre();
  const app2 = await demarrer(portApp2, portSupabase, { ADMIN_MFA_REQUIS: 'off' });
  const degrade = await get(`${app2.base}/v1/admin/epreuves`, 'ADMIN_SANS_MFA');
  test('le mode dégradé (MFA désactivée) laisse passer un admin sans second facteur',
    degrade.status === 200, `statut ${degrade.status}`);
  const degradeEleve = await get(`${app2.base}/v1/admin/epreuves`, 'ELEVE');
  test('le mode dégradé refuse toujours un élève', degradeEleve.status === 403,
    `statut ${degradeEleve.status}`);
  app2.enfant.kill();

  // ── Enregistrement d'une question par l'administration ──────────────
  const portApp3 = await portLibre();
  const app3 = await demarrer(portApp3, portSupabase, {});
  const base3 = app3.base;

  const questionComplete = {
    niveau: 'bac', classe: 'Terminale', serie: 'C', subject: 'SVT',
    sa: 'SA 1', chapitre: 'Génétique formelle — chromosome 1',
    question: 'Quelle structure porte l\'information génétique ?',
    type: 'qcm',
    options: ['Le nucléotide', 'Le ribosome', 'Le lysosome', 'Le nucléole'],
    correctIndex: 0,
    explication: 'Réponse : Le nucléotide'
  };

  const qAnonyme = await post(`${base3}/v1/admin/exercices`, null, questionComplete);
  test('un visiteur anonyme ne peut pas enregistrer de question', qAnonyme.status === 401,
    `statut ${qAnonyme.status}`);

  const qEleve = await post(`${base3}/v1/admin/exercices`, 'ELEVE', questionComplete);
  test('un élève ne peut pas enregistrer de question', qEleve.status === 403,
    `statut ${qEleve.status}`);

  const qSansMfa = await post(`${base3}/v1/admin/exercices`, 'ADMIN_SANS_MFA', questionComplete);
  test('un admin sans second facteur ne peut pas enregistrer de question',
    qSansMfa.status === 403, `statut ${qSansMfa.status}`);

  const qOk = await post(`${base3}/v1/admin/exercices`, 'ADMIN', questionComplete);
  test('un admin doublement authentifié enregistre la question', qOk.status === 200,
    `statut ${qOk.status} ${JSON.stringify(qOk.body || {}).slice(0, 160)}`);
  test('la question est enregistrée dans le chapitre',
    Array.isArray(TABLES.chapters[0].exercices) && TABLES.chapters[0].exercices.length === 1,
    JSON.stringify(TABLES.chapters[0].exercices || []).slice(0, 160));
  test('la question enregistrée porte ses 4 options',
    TABLES.chapters[0].exercices[0] && TABLES.chapters[0].exercices[0].options.length === 4);
  test('l\'action est journalisée',
    TABLES.admin_journal.some(l => l.action === 'exercice_cree'));

  const qTroisOptions = await post(`${base3}/v1/admin/exercices`, 'ADMIN',
    Object.assign({}, questionComplete, { options: ['a', 'b', 'c'] }));
  test('un QCM à 3 options est refusé', qTroisOptions.status === 400,
    `statut ${qTroisOptions.status}`);

  const qDoublons = await post(`${base3}/v1/admin/exercices`, 'ADMIN',
    Object.assign({}, questionComplete, { options: ['même', 'même', 'autre', 'encore'] }));
  test('un QCM avec des options en double est refusé', qDoublons.status === 400,
    `statut ${qDoublons.status}`);

  const qSansChapitre = await post(`${base3}/v1/admin/exercices`, 'ADMIN',
    Object.assign({}, questionComplete, { chapitre: '' }));
  test('une question sans chapitre est refusée', qSansChapitre.status === 400,
    `statut ${qSansChapitre.status}`);

  const qChapitreInconnu = await post(`${base3}/v1/admin/exercices`, 'ADMIN',
    Object.assign({}, questionComplete, { chapitre: 'Chapitre qui nexiste pas' }));
  test('une question sur un chapitre hors programme est refusée',
    qChapitreInconnu.status === 404, `statut ${qChapitreInconnu.status}`);

  // ── Paiement : la transaction doit être liée au compte ─────────────
  const payBase = {
    kind: 'chapter', niveau: 'bac', chapterId: 'chapitre-1',
    transactionId: 'tx-test-1', title: 'Chapitre 1'
  };

  // Cas nominal : transaction créée par le serveur pour cet élève.
  ETAT_FEDAPAY.metadata = {
    kind: 'chapter', niveau: 'bac', chapter_id: 'chapitre-1', user_id: UTILISATEURS.ELEVE.id
  };
  const payOk = await post(`${base3}/v1/payments/verify`, 'ELEVE', payBase);
  test('un paiement correctement lié est accepté', payOk.status === 200,
    `statut ${payOk.status} ${JSON.stringify(payOk.body || {}).slice(0, 160)}`);

  // Transaction d'un autre élève : refusée.
  ETAT_FEDAPAY.metadata = {
    kind: 'chapter', niveau: 'bac', chapter_id: 'chapitre-1', user_id: UTILISATEURS.ADMIN.id
  };
  const payAutrui = await post(`${base3}/v1/payments/verify`, 'ELEVE', payBase);
  test('le paiement d\'un autre compte est refusé', payAutrui.status === 403,
    `statut ${payAutrui.status}`);

  // Transaction sans aucune liaison (ni métadonnées, ni e-mail) :
  // c'est le cas qu'un ancien contrôle laissait passer.
  ETAT_FEDAPAY.metadata = {};
  ETAT_FEDAPAY.customer = {};
  const paySansLien = await post(`${base3}/v1/payments/verify`, 'ELEVE', payBase);
  test('un paiement sans lien avec le compte est refusé', paySansLien.status === 403,
    `statut ${paySansLien.status}`);

  // Transaction sans métadonnées mais avec un e-mail différent : refusée.
  ETAT_FEDAPAY.customer = { email: 'quelquun@example.com', firstname: 'X', lastname: 'Y' };
  const payAutreEmail = await post(`${base3}/v1/payments/verify`, 'ELEVE', payBase);
  test('un paiement payé depuis un autre e-mail est refusé', payAutreEmail.status === 403,
    `statut ${payAutreEmail.status}`);

  // Montant inférieur au prix officiel : refusé.
  ETAT_FEDAPAY.metadata = {
    kind: 'chapter', niveau: 'bac', chapter_id: 'chapitre-1', user_id: UTILISATEURS.ELEVE.id
  };
  ETAT_FEDAPAY.customer = { email: UTILISATEURS.ELEVE.email, firstname: 'Aline', lastname: 'Test' };
  ETAT_FEDAPAY.amount = 10;
  const payInsuffisant = await post(`${base3}/v1/payments/verify`, 'ELEVE', payBase);
  test('un paiement inférieur au prix officiel est refusé', payInsuffisant.status === 402,
    `statut ${payInsuffisant.status} ${JSON.stringify(payInsuffisant.body || {}).slice(0, 120)}`);

  app3.enfant.kill();

  faux.close();

  console.log(`\n${ok} test(s) réussi(s), ${ko} échec(s).`);
  process.exit(ko ? 1 : 0);
})().catch(error => {
  console.error('Erreurfatale :', error);
  process.exit(1);
});
