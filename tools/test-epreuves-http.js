/**
 * tools/test-epreuves-http.js
 * Test HTTP bout-en-bout de la banque d'épreuves.
 *
 * Différence avec tools/test-epreuves.js (tests unitaires du module) :
 * ici on démarre le VRAI serveur (server.js) et on lui parle en HTTP,
 * avec un faux serveur PostgREST à la place de Supabase.
 *
 * Ce qui est vérifié — c'est exactement la promesse faite à l'élève :
 *   1. le catalogue liste les épreuves sans jamais exposer le fichier ;
 *   2. le SUJET gratuit se télécharge sans compte, dans le bon format ;
 *   3. le CORRIGÉ payant renvoie 402 et AUCUNE URL ni solution si l'élève
 *      n'a pas payé ;
 *   4. le corrigé se consulte et se télécharge une fois débloqué ;
 *   5. un lien externe n'est révélé qu'après contrôle des droits ;
 *   6. une tentative de remontée de dossier (..) est neutralisée ;
 *   7. un corrigé payant sans correction validée ne peut pas être publié ;
 *   8. l'admin voit l'activité des élèves ;
 *   9. l'élève peut signaler une erreur sur un corrigé.
 *
 * Usage : node tools/test-epreuves-http.js
 */
const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const RACINE = path.resolve(__dirname, '..');
process.chdir(RACINE);

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

// ── Identifiants de test ───────────────────────────────────────────
const ID_SUJET = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const ID_CORRIGE = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const ID_EXTERNE = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const ID_TRAVERSEE = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
const ID_WORD = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';

const UTILISATEURS = {
  JETON_ACHETE: { id: '11111111-1111-4111-8111-111111111111', email: 'achete@test.bj', user_metadata: { name: 'Aline' } },
  JETON_SANS_ACHAT: { id: '22222222-2222-4222-8222-222222222222', email: 'essai@test.bj', user_metadata: {} },
  JETON_ABONNE: { id: '33333333-3333-4333-8333-333333333333', email: 'abo@test.bj', user_metadata: {} },
  JETON_ADMIN: { id: '44444444-4444-4444-8444-444444444444', email: 'admin@test.bj', user_metadata: {} }
};

const SUJET = {
  id: ID_SUJET, slug: 'bj-bac-2024-math-sujet', pays: 'BJ', niveau: 'bac', classe: 'Tle', serie: 'C', annee: 2024,
  matiere: 'Mathématiques', type: 'sujet', titre: 'Épreuve de Mathématiques — BAC 2024',
  description: 'Session normale', fichier_url: 'sujet-test.pdf', fichier_nom: 'sujet-test.pdf',
  format: 'pdf', pages: 4, source_nom: 'ONEB', source_url: 'https://oneb.bj', licence: 'domaine public',
  is_free: true, price: 0, published: true
};

const CORRIGE = {
  id: ID_CORRIGE, slug: 'bj-bac-2024-math-corrige', pays: 'BJ', niveau: 'bac', classe: 'Tle', serie: 'C', annee: 2024,
  matiere: 'Mathématiques', type: 'corrige', titre: 'Corrigé de Mathématiques — BAC 2024',
  description: 'Corrigé rédigé', fichier_url: 'corrige-test.pdf', fichier_nom: 'corrige-test.pdf',
  format: 'pdf', pages: 6, source_nom: 'ONEB', source_url: 'https://oneb.bj', licence: 'domaine public',
  is_free: false, price: 200, published: true
};

const EXTERNE = {
  ...CORRIGE,
  id: ID_EXTERNE, slug: 'bj-bac-2023-math-corrige', annee: 2023,
  titre: 'Corrigé de Mathématiques — BAC 2023 (source externe)',
  fichier_url: 'https://exemple.bj/corrige-2023.pdf', fichier_nom: 'corrige-2023.pdf', price: 300
};

const TRAVERSEE = {
  ...SUJET,
  id: ID_TRAVERSEE, slug: 'bj-bac-2024-math-traversee', annee: 2022,
  titre: 'Épreuve de Mathématiques — BAC 2022', fichier_url: '../../package.json',
  fichier_nom: 'package.json'
};

const WORD = {
  ...SUJET,
  id: ID_WORD, slug: 'bj-bac-2021-math-word', annee: 2021,
  titre: 'Épreuve de Mathématiques — BAC 2021 (format Word)',
  fichier_url: 'sujet-word.docx', fichier_nom: 'sujet-word.docx', format: 'docx'
};

// La correction rédigée : c'est ce que l'élève achète.
const CORRECTIONS = {
  [ID_CORRIGE]: {
    epreuve_id: ID_CORRIGE,
    solution: '1) Résolution détaillée de la première question, avec les étapes et le barème. (8 points)\n2) Résolution de la deuxième question. (7 points)\n3) Interprétation. (5 points)\nBarème total : 20 points.',
    bareme: 20, difficulte: 'moyen', validee: true
  },
  [ID_EXTERNE]: {
    epreuve_id: ID_EXTERNE,
    solution: 'Correction externe, rédigée et validée par l\'équipe. (20 points)',
    bareme: 20, difficulte: 'difficile', validee: true
  }
};

// ── État du faux Supabase (muté par les requêtes) ──────────────────
const ETAT = {
  epreuves: [SUJET, CORRIGE, EXTERNE, TRAVERSEE, WORD],
  corrections: Object.values(CORRECTIONS),
  activites: [],
  signalements: [],
  epreuvesCreees: []
};

const TABLES = {
  profiles: Object.keys(UTILISATEURS).map(token => ({
    id: UTILISATEURS[token].id,
    email: UTILISATEURS[token].email,
    name: UTILISATEURS[token].user_metadata.name || 'Élève',
    role: token === 'JETON_ADMIN' ? 'admin' : 'client',
    pays: 'BJ', classe: 'Tle', niveau: 'bac',
    user_token: token
  })),
  subscriptions: [{
    user_id: UTILISATEURS.JETON_ABONNE.id,
    niveau: 'bac',
    expires_at: '2099-01-01T00:00:00Z'
  }],
  unlocked_chapters: [],
  unlocked_epreuves: [
    { user_id: UTILISATEURS.JETON_ACHETE.id, epreuve_id: ID_CORRIGE, price: 200, title: 'Corrigé', created_at: '2026-01-05T10:00:00Z' },
    { user_id: UTILISATEURS.JETON_ACHETE.id, epreuve_id: ID_EXTERNE, price: 300, title: 'Corrigé externe', created_at: '2026-01-06T10:00:00Z' }
  ],
  payment_receipts: []
};

// ── Faux PostgREST ───────────────────────────────────────────────────
function comparer(row, col, op, target) {
  const valeur = row[col];
  if (valeur === undefined || valeur === null) return true; // colonne absente : on ignore
  switch (op) {
    case 'neq': return String(valeur) !== target;
    case 'gt': return new Date(valeur) > new Date(target);
    case 'gte': return new Date(valeur) >= new Date(target);
    case 'lt': return new Date(valeur) < new Date(target);
    case 'lte': return new Date(valeur) <= new Date(target);
    case 'in': {
      const liste = target.replace(/[()"]/g, '').split(',').map(v => v.trim()).filter(Boolean);
      return liste.includes(String(valeur));
    }
    default: return String(valeur) === target;
  }
}

function fauxSupabase() {
  return http.createServer((req, res) => {
    const url = new URL(req.url, 'http://127.0.0.1');
    const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
    const json = (code, data) => {
      res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(data));
    };

    if (url.pathname === '/auth/v1/user') {
      if (UTILISATEURS[token]) json(200, UTILISATEURS[token]);
      else json(401, { message: 'invalid token' });
      return;
    }

    const correspondance = url.pathname.match(/^\/rest\/v1\/([a-z_]+)$/);
    if (!correspondance) {
      json(404, { message: 'not found' });
      return;
    }

    const table = correspondance[1];
    let lignes;

    if (table === 'epreuves_activites') {
      if (req.method === 'POST') {
        let brut = '';
        req.on('data', d => { brut += d.toString(); });
        req.on('end', () => {
          const corps = JSON.parse(brut || '{}');
          ETAT.activites.push(Object.assign({ id: ETAT.activites.length + 1, created_at: new Date().toISOString() }, corps));
          json(201, corps);
        });
        return;
      }
      lignes = ETAT.activites.slice();
    } else if (table === 'epreuves_signalements') {
      if (req.method === 'POST') {
        let brut = '';
        req.on('data', d => { brut += d.toString(); });
        req.on('end', () => {
          const corps = JSON.parse(brut || '{}');
          ETAT.signalements.push(Object.assign({ id: ETAT.signalements.length + 1, statut: 'nouveau', created_at: new Date().toISOString() }, corps));
          json(201, corps);
        });
        return;
      }
      lignes = ETAT.signalements.slice();
    } else if (table === 'epreuve_corrections') {
      if (req.method === 'POST') {
        let brut = '';
        req.on('data', d => { brut += d.toString(); });
        req.on('end', () => {
          const corps = JSON.parse(brut || '{}');
          const existante = ETAT.corrections.find(c => c.epreuve_id === corps.epreuve_id);
          if (existante) Object.assign(existante, corps);
          else ETAT.corrections.push(corps);
          json(201, corps);
        });
        return;
      }
      lignes = ETAT.corrections.slice();
    } else if (table === 'epreuves') {
      if (req.method === 'POST') {
        let brut = '';
        req.on('data', d => { brut += d.toString(); });
        req.on('end', () => {
          const corps = JSON.parse(brut || '{}');
          const ligne = Object.assign({ id: 'ffffffff-ffff-4fff-8fff-ffffffffffff' }, corps);
          ETAT.epreuves.push(ligne);
          ETAT.epreuvesCreees.push(ligne);
          json(201, [ligne]);
        });
        return;
      }
      if (req.method === 'PATCH') {
        let brut = '';
        req.on('data', d => { brut += d.toString(); });
        req.on('end', () => {
          const corps = JSON.parse(brut || '{}');
          const cible = ETAT.epreuves.find(e => e.id === url.searchParams.get('id'));
          if (cible) Object.assign(cible, corps);
          json(200, cible ? [cible] : []);
        });
        return;
      }
      lignes = ETAT.epreuves.slice();
    } else {
      lignes = (TABLES[table] || []).slice();
    }

    // Les tables liées à l'utilisateur ne renvoient que les lignes du jeton.
    // La clé service, elle, voit tout (comme le vrai PostgREST).
    if (table === 'profiles' && UTILISATEURS[token]) {
      lignes = lignes.filter(l => l.user_token === token);
    }

    for (const [cle, brut] of url.searchParams.entries()) {
      if (['select', 'limit', 'order', 'offset', 'on_conflict', 'prefer'].includes(cle)) continue;
      const point = String(brut).indexOf('.');
      const op = point > -1 ? String(brut).slice(0, point) : 'eq';
      const cible = decodeURIComponent(point > -1 ? String(brut).slice(point + 1) : String(brut));
      lignes = lignes.filter(l => comparer(l, cle, op, cible));
    }

    const limite = url.searchParams.get('limit');
    if (limite) lignes = lignes.slice(0, Number(limite));

    json(200, lignes);
  });
}

// ── Utilitaires ─────────────────────────────────────────────────────
function portLibre() {
  return new Promise(resolve => {
    const srv = http.createServer();
    srv.listen(0, '127.0.0.1', () => {
      const port = srv.address().port;
      srv.close(() => resolve(port));
    });
  });
}

function attendre(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function get(url, token) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(url, { headers });
  const type = res.headers.get('content-type') || '';
  let body;
  if (type.includes('application/json')) body = await res.json();
  else body = await res.text();
  return { status: res.status, body, headers: res.headers };
}

async function post(url, token, charge) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(charge) });
  const type = res.headers.get('content-type') || '';
  const body = type.includes('application/json') ? await res.json() : await res.text();
  return { status: res.status, body, headers: res.headers };
}

async function patch(url, token, charge) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(url, { method: 'PATCH', headers, body: JSON.stringify(charge) });
  const type = res.headers.get('content-type') || '';
  const body = type.includes('application/json') ? await res.json() : await res.text();
  return { status: res.status, body, headers: res.headers };
}

// ── Scénario ────────────────────────────────────────────────────────
(async () => {
  const dossierEpreuves = fs.mkdtempSync(path.join(os.tmpdir(), 'revizy-epreuves-'));
  fs.writeFileSync(path.join(dossierEpreuves, 'sujet-test.pdf'), '%PDF-1.4 sujet de test');
  fs.writeFileSync(path.join(dossierEpreuves, 'corrige-test.pdf'), '%PDF-1.4 corrige de test');
  fs.writeFileSync(path.join(dossierEpreuves, 'sujet-word.docx'), 'PK\x03\x04 word');

  const faux = fauxSupabase();
  await new Promise(resolve => faux.listen(0, '127.0.0.1', resolve));
  const portSupabase = faux.address().port;

  const portApp = await portLibre();
  const base = `http://localhost:${portApp}`;

  const enfant = spawn(process.execPath, ['server.js'], {
    cwd: RACINE,
    env: {
      ...process.env,
      PORT: String(portApp),
      APP_BASE_URL: base,
      APP_BASE_URL_FRONT: base,
      SUPABASE_URL: `http://127.0.0.1:${portSupabase}`,
      SUPABASE_ANON_KEY: 'jeton-anon-de-test',
      SUPABASE_SERVICE_KEY: 'jeton-service-de-test',
      EPREUVES_DIR: dossierEpreuves,
      FEDAPAY_SECRET_KEY: 'secret-de-test',
      FEDAPAY_PUBLIC_KEY: 'public-de-test',
      FEDAPAY_ENVIRONMENT: 'sandbox',
      GEMINI_API_KEY: '',
      JWT_SECRET: 'secret-jwt-de-test'
    },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  let sortie = '';
  enfant.stdout.on('data', d => { sortie += d.toString(); });
  enfant.stderr.on('data', d => { sortie += d.toString(); });

  // Attendre que le serveur réponde.
  let pret = false;
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(`${base}/v1/epreuves`);
      if (r.status) { pret = true; break; }
    } catch (e) { /* pas encore prêt */ }
    await attendre(250);
  }
  if (!pret) {
    console.log('KO    | le serveur local n\'a pas démarré');
    console.log(sortie.slice(-1500));
    ko++;
  }

  if (pret) {
    // ── 1. Catalogue ────────────────────────────────────────────────
    const catalogue = await get(`${base}/v1/epreuves`);
    test('le catalogue répond 200', catalogue.status === 200, `statut ${catalogue.status}`);
    const liste = catalogue.body.epreuves || [];
    test('le catalogue contient les 5 épreuves', liste.length === 5, `${liste.length} trouvées`);
    test('aucune épreuve n\'expose le chemin du fichier',
      liste.every(e => !('fichier_url' in e) && !('fichier_nom' in e)));
    test('chaque épreuve garde sa source et sa licence',
      liste.every(e => e.source && e.source.nom && e.source.licence));
    test('le sujet est marqué gratuit et téléchargeable',
      liste.find(e => e.id === ID_SUJET) && liste.find(e => e.id === ID_SUJET).isFree === true
      && liste.find(e => e.id === ID_SUJET).telechargeable === true);
    test('le corrigé payant n\'est pas téléchargeable pour un visiteur',
      liste.find(e => e.id === ID_CORRIGE) && liste.find(e => e.id === ID_CORRIGE).telechargeable === false);
    test('le prix du corrigé est exposé', liste.find(e => e.id === ID_CORRIGE).price === 200);
    test('le catalogue annonce le format du document',
      liste.find(e => e.id === ID_WORD).format === 'docx'
      && liste.find(e => e.id === ID_WORD).formatLabel === 'Word');
    test('le catalogue expose la classe et la série',
      liste.find(e => e.id === ID_SUJET).classe === 'Tle' && liste.find(e => e.id === ID_SUJET).serie === 'C');
    test('le catalogue annonce le barème et la validation',
      liste.find(e => e.id === ID_CORRIGE).bareme === 20 && liste.find(e => e.id === ID_CORRIGE).validee === true);
    test('la solution rédigée n\'est PAS dans le catalogue public',
      liste.every(e => !e.solution), 'solution presente dans le catalogue');

    // ── 2. Filtres ──────────────────────────────────────────────────
    const filtreType = await get(`${base}/v1/epreuves?type=sujet`);
    test('le filtre par type ne renvoie que les sujets',
      filtreType.body.epreuves.length === 3 && filtreType.body.epreuves.every(e => e.type === 'sujet'),
      `${filtreType.body.epreuves.length} résultats`);
    const filtreMatiere = await get(`${base}/v1/epreuves?matiere=Physique`);
    test('un filtre sans résultat renvoie un catalogue vide',
      Array.isArray(filtreMatiere.body.epreuves) && filtreMatiere.body.epreuves.length === 0);
    const filtrePays = await get(`${base}/v1/epreuves?pays=BJ`);
    test('le filtre par pays fonctionne', filtrePays.body.epreuves.length === 5);
    const filtreClasse = await get(`${base}/v1/epreuves?classe=Tle`);
    test('le filtre par classe fonctionne',
      filtreClasse.body.epreuves.length === 5 && filtreClasse.body.epreuves.every(e => e.classe === 'Tle'),
      `${filtreClasse.body.epreuves.length} résultats`);
    const filtreClasseSerie = await get(`${base}/v1/epreuves?classe=Tle&serie=C`);
    test('le filtre classe + série fonctionne', filtreClasseSerie.body.epreuves.length === 5);
    const filtreSerie = await get(`${base}/v1/epreuves?serie=A`);
    test('le filtre par série exclut les autres séries', filtreSerie.body.epreuves.length === 0);
    const filtreInvalide = await get(`${base}/v1/epreuves?niveau=maternelle`);
    test('un niveau invalide est rejeté (400)', filtreInvalide.status === 400, `statut ${filtreInvalide.status}`);
    test('les classes et séries disponibles alimentent les filtres',
      Array.isArray(catalogue.body.classes) && catalogue.body.classes.includes('Tle')
      && Array.isArray(catalogue.body.series) && catalogue.body.series.includes('C'));

    // ── 3. Sujet gratuit : téléchargeable sans compte ──────────────
    const sujet = await get(`${base}/v1/epreuves/${ID_SUJET}/telecharger`);
    test('le sujet gratuit se télécharge sans être connecté', sujet.status === 200, `statut ${sujet.status}`);
    test('le sujet est bien servi en PDF',
      String(sujet.headers.get('content-type')).includes('application/pdf')
      && String(sujet.body).startsWith('%PDF'), String(sujet.headers.get('content-type')));
    test('le nom du fichier est transmis',
      String(sujet.headers.get('content-disposition')).includes('sujet-test.pdf'));

    // ── 4. Multi-format : un Word se télécharge, pas ne s'affiche ───
    const word = await get(`${base}/v1/epreuves/${ID_WORD}/telecharger`);
    test('un sujet Word se télécharge', word.status === 200, `statut ${word.status}`);
    test('un Word est servi avec le bon type MIME',
      String(word.headers.get('content-type')).includes('wordprocessingml'), String(word.headers.get('content-type')));
    test('un Word est proposé en téléchargement (pas en affichage)',
      String(word.headers.get('content-disposition')).startsWith('attachment'),
      String(word.headers.get('content-disposition')));

    // ── 5. Corrigé payant : 402, aucune URL, aucune solution ───────
    const corrigeAnon = await get(`${base}/v1/epreuves/${ID_CORRIGE}/telecharger`);
    test('le corrigé non payé renvoie 402', corrigeAnon.status === 402, `statut ${corrigeAnon.status}`);
    test('le 402 porte le code PAIEMENT_REQUIS', corrigeAnon.body.code === 'PAIEMENT_REQUIS');
    test('le 402 annonce le bon prix', corrigeAnon.body.price === 200);
    test('le 402 ne fuite aucune URL de fichier',
      !JSON.stringify(corrigeAnon.body).includes('corrige-test.pdf')
      && !JSON.stringify(corrigeAnon.body).includes('http'));

    const corrigeSansAchat = await get(`${base}/v1/epreuves/${ID_CORRIGE}/telecharger`, 'JETON_SANS_ACHAT');
    test('un élève connecté mais sans achat obtient 402', corrigeSansAchat.status === 402,
      `statut ${corrigeSansAchat.status}`);

    // ── 6. Consulter le corrigé : aperçu avant achat ───────────────
    const apercu = await get(`${base}/v1/epreuves/${ID_CORRIGE}`);
    test('consulter un corrigé non payé renvoie 402', apercu.status === 402, `statut ${apercu.status}`);
    test('l\'aperçu montre le barème et la difficulté',
      apercu.body.apercu && apercu.body.apercu.bareme === 20 && apercu.body.apercu.difficulte === 'moyen',
      JSON.stringify(apercu.body.apercu));
    test('l\'aperçu annonce la validation', apercu.body.apercu && apercu.body.apercu.validee === true);
    test('l\'aperçu ne contient jamais la solution',
      !JSON.stringify(apercu.body).includes('Résolution détaillée de la première question'));

    const apercuSansAchat = await get(`${base}/v1/epreuves/${ID_CORRIGE}`, 'JETON_SANS_ACHAT');
    test('un élève sans achat ne voit que l\'aperçu',
      apercuSansAchat.status === 402 && !JSON.stringify(apercuSansAchat.body).includes('Résolution détaillée'));

    // ── 7. Corrigé débloqué : solution et fichier ───────────────────
    const consultable = await get(`${base}/v1/epreuves/${ID_CORRIGE}`, 'JETON_ACHETE');
    test('le corrigé débloqué se consulte', consultable.status === 200, `statut ${consultable.status}`);
    test('le corrigé débloqué montre la solution rédigée',
      consultable.body.epreuve && consultable.body.epreuve.aSolution === true
      && consultable.body.epreuve.solution.includes('Barème total'),
      JSON.stringify(consultable.body.epreuve || {}).slice(0, 200));

    const corrigeAchat = await get(`${base}/v1/epreuves/${ID_CORRIGE}/telecharger`, 'JETON_ACHETE');
    test('le corrigé débloqué se télécharge', corrigeAchat.status === 200, `statut ${corrigeAchat.status}`);
    test('le corrigé débloqué est bien le PDF attendu',
      String(corrigeAchat.body).startsWith('%PDF') && String(corrigeAchat.body).includes('corrige de test'));

    // ── 8. Abonnement et admin ─────────────────────────────────────
    const corrigeAbo = await get(`${base}/v1/epreuves/${ID_CORRIGE}/telecharger`, 'JETON_ABONNE');
    test('l\'abonnement mensuel donne accès au corrigé', corrigeAbo.status === 200,
      `statut ${corrigeAbo.status}`);
    const corrigeAdmin = await get(`${base}/v1/epreuves/${ID_CORRIGE}/telecharger`, 'JETON_ADMIN');
    test('l\'admin accède au corrigé', corrigeAdmin.status === 200, `statut ${corrigeAdmin.status}`);

    // ── 9. Lien externe : révélé seulement après contrôle des droits ─
    const externeAnon = await get(`${base}/v1/epreuves/${ID_EXTERNE}/telecharger`);
    test('le lien externe est refusé sans droits', externeAnon.status === 402,
      `statut ${externeAnon.status}`);
    const externeAchat = await get(`${base}/v1/epreuves/${ID_EXTERNE}/telecharger`, 'JETON_ACHETE');
    test('le lien externe est révélé après déblocage',
      externeAchat.status === 200 && externeAchat.body.mode === 'externe', JSON.stringify(externeAchat.body));
    test('le lien externe pointe bien vers la source',
      externeAchat.body.url === 'https://exemple.bj/corrige-2023.pdf');

    // ── 10. Remontée de dossier : neutralisée ───────────────────────
    const traversee = await get(`${base}/v1/epreuves/${ID_TRAVERSEE}/telecharger`);
    test('une remontée de dossier est refusée (503)', traversee.status === 503,
      `statut ${traversee.status}`);
    test('la remontée ne renvoie pas le contenu du fichier visé',
      !String(traversee.body).includes('"revizy"'));

    // ── 11. Identifiants invalides ──────────────────────────────────
    const idInvalide = await get(`${base}/v1/epreuves/pas-un-uuid/telecharger`);
    test('un identifiant non-UUID est rejeté (400)', idInvalide.status === 400,
      `statut ${idInvalide.status}`);
    const idInconnu = await get(`${base}/v1/epreuves/99999999-9999-4999-8999-999999999999/telecharger`);
    test('une épreuve inconnue renvoie 404', idInconnu.status === 404, `statut ${idInconnu.status}`);

    // ── 12. Le catalogue reflète les droits ────────────────────────
    const catalogueAchat = await get(`${base}/v1/epreuves`, 'JETON_ACHETE');
    const vuAchat = catalogueAchat.body.epreuves.find(e => e.id === ID_CORRIGE);
    test('le catalogue marque le corrigé acheté comme accessible',
      vuAchat && vuAchat.accessible === true && vuAchat.telechargeable === true);
    test('le catalogue liste les épreuves déjà débloquées',
      Array.isArray(catalogueAchat.body.debloquees) && catalogueAchat.body.debloquees.includes(ID_CORRIGE));

    // ── 13. L'élève signale une erreur ──────────────────────────────
    const signalement = await post(`${base}/v1/epreuves/${ID_CORRIGE}/signaler`, 'JETON_ACHETE', {
      message: 'La question 3 du corrigé semble avoir une erreur de barème.'
    });
    test('un élève peut signaler une erreur', signalement.status === 200, `statut ${signalement.status}`);
    test('le signalement est enregistré', ETAT.signalements.length === 1);
    const signalementVide = await post(`${base}/v1/epreuves/${ID_CORRIGE}/signaler`, 'JETON_ACHETE', {
      message: 'bug'
    });
    test('un signalement trop court est refusé (400)', signalementVide.status === 400,
      `statut ${signalementVide.status}`);

    // ── 14. Le téléchargement est journalisé ────────────────────────
    await get(`${base}/v1/epreuves/${ID_SUJET}/telecharger`, 'JETON_SANS_ACHAT');
    test('le téléchargement est journalisé pour l\'admin',
      ETAT.activites.some(a => a.action === 'telechargement' && a.epreuve_id === ID_SUJET),
      JSON.stringify(ETAT.activites));

    // ── 15. Administration : accès réservé ──────────────────────────
    const adminInterdit = await get(`${base}/v1/admin/epreuves`, 'JETON_SANS_ACHAT');
    test('un élève ne peut pas voir le catalogue admin', adminInterdit.status === 403,
      `statut ${adminInterdit.status}`);
    const adminAnonyme = await get(`${base}/v1/admin/epreuves`);
    test('un visiteur anonyme ne peut pas voir le back-office', adminAnonyme.status === 403,
      `statut ${adminAnonyme.status}`);

    const adminListe = await get(`${base}/v1/admin/epreuves`, 'JETON_ADMIN');
    test('l\'admin voit le catalogue complet', adminListe.status === 200
      && Array.isArray(adminListe.body.epreuves) && adminListe.body.epreuves.length === 5,
      `statut ${adminListe.status}`);
    test('l\'admin voit la correction rédigée',
      adminListe.body.epreuves.find(e => e.id === ID_CORRIGE).solution.includes('Barème total'));
    test('l\'admin voit l\'activité par épreuve',
      adminListe.body.epreuves.find(e => e.id === ID_CORRIGE).achats >= 1
      && adminListe.body.epreuves.find(e => e.id === ID_CORRIGE).telechargements >= 1,
      JSON.stringify(adminListe.body.epreuves.find(e => e.id === ID_CORRIGE)));

    // ── 16. Administration : activité détaillée ─────────────────────
    const activite = await get(`${base}/v1/admin/epreuves/activite`, 'JETON_ADMIN');
    test('l\'admin récupère l\'activité des élèves', activite.status === 200
      && Array.isArray(activite.body.achats) && activite.body.achats.length >= 1,
      `statut ${activite.status}`);
    test('l\'activité associe un élève à une épreuve',
      activite.body.achats[0] && activite.body.achats[0].eleve.email === 'achete@test.bj'
      && activite.body.achats[0].epreuve.titre.includes('Corrigé'),
      JSON.stringify(activite.body.achats[0] || {}));
    test('l\'activité liste les signalements', activite.body.signalements.length === 1);
    test('l\'activité indique le nombre de téléchargements',
      activite.body.actions.some(a => a.action === 'telechargement'));
    test('le journal est signalé comme actif', activite.body.journalActif === true);

    // ── 17. Rigueur : un corrigé payant sans correction est refusé ─
    const publierSansCorrection = await post(`${base}/v1/admin/epreuves`, 'JETON_ADMIN', {
      pays: 'BJ', niveau: 'bac', matiere: 'Mathématiques', type: 'corrige',
      titre: 'Corrigé incomplet', fichier_url: 'corrige-test.pdf',
      source_nom: 'ONEB', licence: 'domaine public',
      is_free: false, price: 200, published: true
    });
    test('un corrigé payant sans solution rédigée est refusé (400)',
      publierSansCorrection.status === 400, `statut ${publierSansCorrection.status}`);
    test('le refus explique ce qui manque',
      publierSansCorrection.body.error && /valid/i.test(publierSansCorrection.body.error),
      JSON.stringify(publierSansCorrection.body));

    const publierNonValide = await post(`${base}/v1/admin/epreuves`, 'JETON_ADMIN', {
      pays: 'BJ', niveau: 'bac', matiere: 'Mathématiques', type: 'corrige',
      titre: 'Corrigé non relu', fichier_url: 'corrige-test.pdf',
      source_nom: 'ONEB', licence: 'domaine public',
      is_free: false, price: 200, published: true,
      solution: 'Une solution suffisamment longue pour passer le contrôle de longueur du serveur.',
      bareme: 20, difficulte: 'moyen', validee: false
    });
    test('un corrigé payant non validé est refusé (400)',
      publierNonValide.status === 400, `statut ${publierNonValide.status}`);

    const publierValide = await post(`${base}/v1/admin/epreuves`, 'JETON_ADMIN', {
      pays: 'BJ', niveau: 'bac', classe: 'Tle', serie: 'C', matiere: 'Mathématiques', type: 'corrige',
      titre: 'Corrigé complet et validé', fichier_url: 'corrige-test.pdf',
      source_nom: 'ONEB', licence: 'domaine public',
      is_free: false, price: 200, published: true,
      solution: 'Une solution suffisamment longue pour passer le contrôle de longueur du serveur, avec le barème.',
      bareme: 20, difficulte: 'moyen', validee: true
    });
    test('un corrigé payant complet et validé est publié (200)',
      publierValide.status === 200, `statut ${publierValide.status} ${JSON.stringify(publierValide.body)}`);
    test('la correction du corrigé publié est enregistrée',
      ETAT.corrections.some(c => c.epreuve_id === publierValide.body.id && c.validee === true));

    const publierSujet = await post(`${base}/v1/admin/epreuves`, 'JETON_ADMIN', {
      pays: 'BJ', niveau: 'bac', matiere: 'Mathématiques', type: 'sujet',
      titre: 'Sujet gratuit', fichier_url: 'sujet-test.pdf',
      source_nom: 'ONEB', licence: 'domaine public',
      is_free: true, price: 0, published: true
    });
    test('un sujet gratuit se publie sans correction (200)',
      publierSujet.status === 200, `statut ${publierSujet.status}`);

    const publierSansSource = await post(`${base}/v1/admin/epreuves`, 'JETON_ADMIN', {
      pays: 'BJ', niveau: 'bac', matiere: 'Mathématiques', type: 'sujet',
      titre: 'Sujet sans source', fichier_url: 'sujet-test.pdf',
      is_free: true, price: 0, published: true
    });
    test('un document sans source ni licence est refusé (400)',
      publierSansSource.status === 400, `statut ${publierSansSource.status}`);
  }

  enfant.kill('SIGTERM');
  await attendre(300);
  if (!enfant.killed) enfant.kill('SIGKILL');
  faux.close();
  try { fs.rmSync(dossierEpreuves, { recursive: true, force: true }); } catch (e) { /* ignoré */ }

  console.log(`\n${ok} test(s) réussi(s), ${ko} échec(s).`);
  process.exit(ko ? 1 : 0);
})().catch(error => {
  console.error('Erreur fatale du test :', error);
  process.exit(1);
});
