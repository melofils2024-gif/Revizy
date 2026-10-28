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
  epreuves: [],
  epreuve_corrections: [],
  admin_journal: [],
  subscriptions: [],
  unlocked_chapters: [],
  unlocked_epreuves: [],
  epreuves_activites: [],
  epreuves_signalements: [],
  chapters: [],
  profiles_chapitre: []
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
      if (req.method === 'POST') TABLES[table].push(...ajouts);
      else Object.assign(TABLES[table][0] || {}, ajouts[0] || {});
      json(req.method === 'POST' ? 201 : 200, ajouts);
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

  faux.close();

  console.log(`\n${ok} test(s) réussi(s), ${ko} échec(s).`);
  process.exit(ko ? 1 : 0);
})().catch(error => {
  console.error('Erreurfatale :', error);
  process.exit(1);
});
