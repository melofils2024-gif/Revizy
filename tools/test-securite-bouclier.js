/**
 * tools/test-securite-bouclier.js
 *
 * Test du garde-fou du serveur (server_securite.js) : détection du
 * piratage, blocage automatique, alerte, levée du blocage.
 *
 * Ces tests sont hors réseau : le fetch du webhook est injecté, et les
 * requêtes HTTP sont simulées par de faux objets {headers, url}.
 *
 * Usage : node tools/test-securite-bouclier.js
 */
const securite = require('../server_securite.js');

let ok = 0;
let ko = 0;

function test(nom, condition, detail = '') {
  if (condition) { ok++; console.log(`OK    | ${nom}`); }
  else { ko++; console.log(`KO    | ${nom}${detail ? ' -> ' + detail : ''}`); }
}

/** Fausse requête : seule l'IP compte pour la garde. */
function requete(ip) {
  return { headers: {}, url: '/', ip };
}

const depsIp = { ipResolver: (req) => req.ip };

(async () => {
  console.log('— Détection et blocage —');

  // 1. Balayage d'URL : beaucoup de 404 depuis la même IP.
  const ipScan = '10.0.0.1';
  let evenementScan = null;
  for (let i = 0; i < securite.CONFIG.max404; i++) {
    evenementScan = securite.observerReponse(requete(ipScan), 404, '/fichier-inexistant-' + i, depsIp);
  }
  test('une rafale de fichiers introuvables est détectée',
    Boolean(evenementScan) && evenementScan.type === 'balayage_url',
    evenementScan ? evenementScan.type : 'aucun événement');
  test('le verdict est « alerte », pas critique',
    Boolean(evenementScan) && evenementScan.gravite === 'alerte');
  test('l\'IP est bloquée après le balayage',
    securite.verifierAcces(requete(ipScan), depsIp).autorise === false);
  test('le motif du blocage est explicite',
    /introuvables/.test(securite.verifierAcces(requete(ipScan), depsIp).motif || ''),
    securite.verifierAcces(requete(ipScan), depsIp).motif);

  // 2. Force brute sur l'espace d'administration.
  const ipAdmin = '10.0.0.2';
  let evenementAdmin = null;
  for (let i = 0; i < securite.CONFIG.maxAdmin; i++) {
    evenementAdmin = securite.observerReponse(requete(ipAdmin), 401, '/v1/admin/epreuves', depsIp);
  }
  test('une force brute sur l\'administration est détectée',
    Boolean(evenementAdmin) && evenementAdmin.type === 'force_brute_admin',
    evenementAdmin ? evenementAdmin.type : 'aucun événement');
  test('la force brute est classée critique',
    Boolean(evenementAdmin) && evenementAdmin.gravite === 'critique');
  test('l\'IP de force brute est bloquée',
    securite.verifierAcces(requete(ipAdmin), depsIp).autorise === false);

  // 3. Aspiration de contenu : beaucoup de ressources différentes.
  const ipAspir = '10.0.0.3';
  let evenementAspir = null;
  for (let i = 0; i < securite.CONFIG.maxIdentifiants; i++) {
    evenementAspir = securite.observerReponse(
      requete(ipAspir), 200, '/v1/epreuves/epreuve-iden-' + i, depsIp);
  }
  test('une aspiration de contenu est détectée',
    Boolean(evenementAspir) && evenementAspir.type === 'aspiration_contenu',
    evenementAspir ? evenementAspir.type : 'aucun événement');
  test('l\'IP qui aspire est bloquée',
    securite.verifierAcces(requete(ipAspir), depsIp).autorise === false);

  // 4. Une IP normale n'est jamais bloquée.
  const ipOk = '10.0.0.4';
  for (let i = 0; i < 10; i++) {
    securite.observerReponse(requete(ipOk), 200, '/v1/epreuves/' + i, depsIp);
  }
  test('un élève normal n\'est pas bloqué',
    securite.verifierAcces(requete(ipOk), depsIp).autorise === true);

  // 5. Levée du blocage.
  securite.debloquer(ipAdmin, {});
  test('le blocage peut être levé par l\'administrateur',
    securite.verifierAcces(requete(ipAdmin), depsIp).autorise === true);

  // 6. Alerte : le webhook doit être appelé, et l'événement écrit en base.
  let webhookRecu = null;
  let ecritBase = null;
  const ipAlerte = '10.0.0.5';
  const fauxFetch = (url, options) => {
    webhookRecu = { url, corps: JSON.parse(options.body) };
    return Promise.resolve({ ok: true });
  };
  for (let i = 0; i < securite.CONFIG.maxAdmin; i++) {
    securite.observerReponse(requete(ipAlerte), 403, '/v1/admin/admins', {
      ipResolver: (req) => req.ip,
      webhook: 'https://exemple.test/hook',
      fetchImpl: fauxFetch,
      restWrite: (endpoint, methode, corps) => {
        ecritBase = { endpoint, methode, corps };
        return Promise.resolve({ ok: true });
      }
    });
  }
  // L'envoi du webhook est asynchrone : on lui laisse un tour de boucle.
  await new Promise(r => setTimeout(r, 50));
  test('une alerte est envoyée au webhook configuré',
    Boolean(webhookRecu) && webhookRecu.url === 'https://exemple.test/hook',
    webhookRecu ? webhookRecu.url : 'aucun envoi');
  test('l\'alerte contient le type d\'événement',
    Boolean(webhookRecu) && webhookRecu.corps.evenement.type === 'force_brute_admin');
  test('l\'alerte contient l\'IP concernée',
    Boolean(webhookRecu) && webhookRecu.corps.evenement.ip === ipAlerte);
  test('l\'alerte contient un texte lisible',
    Boolean(webhookRecu) && /Revisy/.test(webhookRecu.corps.text || ''));
  test('l\'événement est journalisé en base',
    Boolean(ecritBase) && ecritBase.endpoint === '/rest/v1/securite_evenements',
    ecritBase ? ecritBase.endpoint : 'aucune écriture');
  test('l\'écriture en base porte la gravité',
    Boolean(ecritBase) && ['alerte', 'critique'].includes(ecritBase.corps.gravite),
    ecritBase ? String(ecritBase.corps.gravite) : '-');

  // 7. Fichiers internes : ils doivent être reconnus comme hostiles.
  test('un fichier interne est reconnu (/.env)',
    securite.detecterFichierInterdit('/.env') === true);
  test('un fichier interne est reconnu (/package.json)',
    securite.detecterFichierInterdit('/package.json') === true);
  test('un fichier interne est reconnu (/server.js)',
    securite.detecterFichierInterdit('/server.js') === true);
  test('une page normale n\'est pas signalée',
    securite.detecterFichierInterdit('/epreuves-types') === false);
  test('une page normale n\'est pas signalée (racine)',
    securite.detecterFichierInterdit('/') === false);

  // 8. État exposé à l'espace admin.
  const etat = securite.etatSecurite();
  test('l\'état de sécurité expose des compteurs',
    etat && etat.compteurs && typeof etat.compteurs.total === 'number');
  test('l\'état de sécurité expose les IP bloquées',
    Array.isArray(etat.bloques));
  test('l\'état de sécurité expose les événements récents',
    Array.isArray(etat.evenements) && etat.evenements.length > 0);

  // 9. Le compteur d'identifiants repère bien les UUID d'épreuve.
  test('un identifiant d\'épreuve est repéré',
    securite.extraireIdentifiant('/v1/epreuves/3f2a9c11-77bd-4c2e-9a10-abcdef123456') === 'epreuves/3f2a9c11-77bd-4c2e-9a10-abcdef123456',
    securite.extraireIdentifiant('/v1/epreuves/3f2a9c11-77bd-4c2e-9a10-abcdef123456'));
  test('une page sans identifiant ne renvoie rien',
    securite.extraireIdentifiant('/v1/epreuves') === null);

  console.log('\n====================================================');
  console.log(`${ok} test(s) réussi(s), ${ko} échec(s).`);
  process.exitCode = ko > 0 ? 1 : 0;
})();
