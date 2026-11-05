/**
 * tools/test-epreuves-types.js
 * Test HTTP bout-en-bout du téléchargement des ÉPREUVES TYPES.
 *
 * Ces documents sont écrits par nos soins (document original) : ils doivent
 * être téléchargeables par l'élève, en PDF comme en Word, SANS base de
 * données (le catalogue des sujets officiels n'est pas encore migré).
 *
 * Vérifié :
 *   1. le catalogue liste les épreuves types (métadonnées + formats) ;
 *   2. le PDF se télécharge avec le bon Content-Type et un nom propre ;
 *   3. le Word se télécharge en pièce jointe ;
 *   4. une remontée de dossier (..) est neutralisée ;
 *   5. un fichier absent du catalogue est refusé ;
 *   6. une extension non autorisée (.sh, .js) est refusée ;
 *   7. seule la méthode GET est acceptée ;
 *   8. le contenu téléchargé est bien un PDF valide (en-tête %PDF).
 *
 * Usage : node tools/test-epreuvres-types.js
 */
const http = require('http');
const path = require('path');
const { spawn } = require('child_process');

const RACINE = path.resolve(__dirname, '..');
process.chdir(RACINE);

let ok = 0;
let ko = 0;

function test(nom, condition, detail = '') {
  if (condition) { ok++; console.log(`OK    | ${nom}`); }
  else { ko++; console.log(`KO    | ${nom}${detail ? ' -> ' + detail : ''}`); }
}

/**
 * Requête HTTP via fetch (comme le reste des tests) : le corps est rendu
 * en Buffer pour pouvoir vérifier l'en-tête %PDF / PK.
 */
async function requete(port, chemin, methode = 'GET') {
  try {
    const res = await fetch(`http://127.0.0.1:${port}${chemin}`, { method: methode });
    const buffer = Buffer.from(await res.arrayBuffer());
    return {
      status: res.status,
      headers: {
        'content-type': res.headers.get('content-type') || '',
        'content-disposition': res.headers.get('content-disposition') || ''
      },
      body: buffer
    };
  } catch (e) {
    return { status: 0, headers: {}, body: Buffer.from(String(e.message || e)) };
  }
}

(async () => {
  const port = 8099;
  const serveur = spawn(process.execPath, [path.join(RACINE, 'server.js')], {
    env: Object.assign({}, process.env, { PORT: String(port), NODE_ENV: 'test' }),
    stdio: ['ignore', 'pipe', 'pipe']
  });
  serveur.stdout.on('data', () => { });
  serveur.stderr.on('data', () => { });

  // Attente du démarrage.
  let pret = false;
  for (let i = 0; i < 40 && !pret; i++) {
    await new Promise((r) => setTimeout(r, 250));
    const t = await requete(port, '/v1/ai/health');
    pret = t.status === 200;
  }
  if (!pret) {
    console.log('KO    | le serveur ne demarre pas');
    serveur.kill();
    process.exit(1);
  }

  // 1. Catalogue
  const catalogue = await requete(port, '/v1/epreuves-types');
  let data = {};
  try { data = JSON.parse(catalogue.body.toString('utf8')); } catch (e) { }
  const documents = Array.isArray(data.epreuves) ? data.epreuves : [];
  test('le catalogue des épreuves types répond 200', catalogue.status === 200, 'HTTP ' + catalogue.status);
  test('le catalogue contient des épreuves types', documents.length >= 8, `${documents.length} document(s)`);
  test('chaque épreuve type annonce ses formats',
    documents.every(d => Array.isArray(d.formats) && d.formats.length >= 2));
  test('chaque épreuve type porte sa source et sa licence',
    documents.every(d => d.source && d.source.nom && d.source.licence));

  const matieres = [...new Set(documents.map(d => d.matiere))].sort();
  test('les matières couvrent maths, français, espagnol et allemand',
    ['Allemand', 'Espagnol', 'Français', 'Mathématiques'].every(m => matieres.includes(m)),
    matieres.join(', '));

  // 2. Téléchargement PDF
  const pdf = await requete(port, '/v1/epreuves-types/bepc-3e-mathematiques-sujet.pdf');
  test('le PDF se télécharge', pdf.status === 200, 'HTTP ' + pdf.status);
  test('le PDF est servi en application/pdf', /application\/pdf/.test(pdf.headers['content-type'] || ''), pdf.headers['content-type']);
  test('le PDF est nommé proprement',
    /filename="bepc-3e-mathematiques-sujet\.pdf"/.test(pdf.headers['content-disposition'] || ''),
    pdf.headers['content-disposition']);
  test('le contenu téléchargé est un PDF', pdf.body.slice(0, 4).toString('latin1') === '%PDF');
  test('le PDF est servi en affichage (inline)', /inline/.test(pdf.headers['content-disposition'] || ''));

  // 3. Téléchargement Word
  const docx = await requete(port, '/v1/epreuves-types/bepc-3e-mathematiques-sujet.docx');
  test('le Word se télécharge', docx.status === 200, 'HTTP ' + docx.status);
  test('le Word est servi en pièce jointe', /attachment/.test(docx.headers['content-disposition'] || ''));
  test('le Word est une archive ZIP valide', docx.body.slice(0, 2).toString('latin1') === 'PK');

  // 4. Traversée de chemin
  const traversee = await requete(port, '/v1/epreuves-types/..%2F..%2Fserver.js');
  test('une remontée de dossier est refusée', traversee.status === 404, 'HTTP ' + traversee.status);
  const traversee2 = await requete(port, '/v1/epreuves-types/../server.js');
  test('un chemin relatif est refusé', traversee2.status === 404, 'HTTP ' + traversee2.status);

  // 5. Fichier absent du catalogue
  const inconnu = await requete(port, '/v1/epreuves-types/inexistant.pdf');
  test('un fichier absent du catalogue est refusé', inconnu.status === 404, 'HTTP ' + inconnu.status);

  // 6. Extension non autorisée
  const shell = await requete(port, '/v1/epreuves-types/whatever.sh');
  test('une extension non autorisée est refusée', shell.status === 404, 'HTTP ' + shell.status);

  // 7. Méthode non autorisée
  const poste = await requete(port, '/v1/epreuves-types/bepc-3e-mathematiques-sujet.pdf', 'POST');
  test('seule la méthode GET est acceptée', poste.status === 404 || poste.status === 405, 'HTTP ' + poste.status);

  // 8. Le catalogue des sujets officiels reste séparé
  const officiels = await requete(port, '/v1/epreuves');
  test('le catalogue des sujets officiels reste une route distincte', officiels.status === 200 || officiels.status === 500);

  // 9. Repli sur les épreuves types quand la base est vide ou pas migrée.
  //    Sans ce repli, l'onglet « Épreuves » de l'élève affiche « aucune
  //    épreuve » tant que la table « epreuves » n'existe pas.
  const vide = await requete(port, '/v1/epreuves');
  let dataVide = {};
  try { dataVide = JSON.parse(vide.body.toString('utf8')); } catch (e) { }
  const listeVide = Array.isArray(dataVide.epreuves) ? dataVide.epreuves : [];
  test('le catalogue élève n\'est jamais vide (repli sur les épreuves types)',
    listeVide.length >= 8, `${listeVide.length} épreuve(s)`);
  test('le repli est signalé par « source »',
    dataVide.source === 'epreuves-types', String(dataVide.source));
  test('chaque épreuve du repli se télécharge directement',
    listeVide.every(e => e.telechargementDirect === true && Array.isArray(e.formats) && e.formats.length >= 1));
  test('chaque épreuve du repli est gratuite (document original)',
    listeVide.every(e => e.isFree === true && e.price === 0));
  test('les identifiants du repli sont préfixés « type: »',
    listeVide.every(e => String(e.id).startsWith('type:')));
  test('les filtres du repli sont alimentés',
    Array.isArray(dataVide.matieres) && dataVide.matieres.length >= 4
    && Array.isArray(dataVide.annees) && dataVide.annees.length >= 1
    && Array.isArray(dataVide.classes) && dataVide.classes.length >= 1);

  // Le lien annoncé par le repli doit réellement télécharger le document.
  const premier = listeVide[0];
  const formatPdf = premier && premier.formats.find(f => f.format === 'pdf');
  test('le premier format PDF est annoncé',
    Boolean(formatPdf && formatPdf.nom && formatPdf.nom.endsWith('.pdf')));
  if (formatPdf) {
    const telecharge = await requete(port, '/v1/epreuves-types/' + encodeURIComponent(formatPdf.nom));
    test('le fichier annoncé par le repli se télécharge',
      telecharge.status === 200 && telecharge.body.slice(0, 4).toString('latin1') === '%PDF',
      'HTTP ' + telecharge.status);
  }

  // Un filtre qui ne correspond à rien doit vider la liste (le repli respecte
  // les filtres, sinon l'élève verrait des épreuves hors de son programme).
  const filtreBac = await requete(port, '/v1/epreuves?niveau=bac');
  let dataBac = {};
  try { dataBac = JSON.parse(filtreBac.body.toString('utf8')); } catch (e) { }
  const listeBac = Array.isArray(dataBac.epreuves) ? dataBac.epreuves : [];
  test('le repli respecte les filtres (niveau bac : aucune épreuve type BEPC)',
    listeBac.length === 0, `${listeBac.length} épreuve(s)`);

  serveur.kill();
  console.log('\n====================================================');
  console.log(`${ok} test(s) réussi(s), ${ko} échec(s).`);
  process.exitCode = ko > 0 ? 1 : 0;
})();
