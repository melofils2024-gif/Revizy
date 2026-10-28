/**
 * Tests de la banque d'épreuves (tools/test-epreuves.js).
 *
 * Le point critique : un corrigé payant ne doit JAMAIS être livrée à
 * quelqu'un qui n'a pas payé. Ces tests vérifient les règles d'accès,
 * la traçabilité (source + licence) et la résolution du fichier.
 *
 * Usage : node tools/test-epreuves.js
 */
const fs = require('fs');
const path = require('path');

process.chdir(path.resolve(__dirname, '..'));
const epreuves = require(path.resolve(__dirname, '..', 'server_epreuves.js'));

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

const SUJET = {
  id: '11111111-1111-4111-8111-111111111111',
  pays: 'BJ', niveau: 'bac', annee: 2024, matiere: 'Mathématiques',
  type: 'sujet', titre: 'Épreuve de Mathématiques — BAC 2024',
  description: 'Session normale', fichier_url: 'bj-bac-2024-math-sujet.pdf',
  source_nom: 'ONEB', source_url: 'https://oneb.bj', licence: 'domaine public',
  is_free: true, price: 0, published: true
};

const CORRIGE = {
  ...SUJET,
  id: '22222222-2222-4222-8222-222222222222',
  type: 'corrige',
  titre: 'Corrigé de Mathématiques — BAC 2024',
  fichier_url: 'bj-bac-2024-math-corrige.pdf',
  is_free: false,
  price: 200
};

// ── Règles d'accès ───────────────────────────────────────────────────
test('le sujet gratuit est accessible à tous', epreuves.aAcces(SUJET, null) === true);
test('le sujet gratuit reste accessible sans session', epreuves.aAcces(SUJET, { isAdmin: false, niveaux: new Set(), epreuves: new Set() }) === true);
test('le corrigé payant est refusé sans droits', epreuves.aAcces(CORRIGE, null) === false);
test('le corrigé payant est refusé à un élève sans achat',
  epreuves.aAcces(CORRIGE, { isAdmin: false, niveaux: new Set(), epreuves: new Set() }) === false);
test('le corrigé est accepté après achat',
  epreuves.aAcces(CORRIGE, { isAdmin: false, niveaux: new Set(), epreuves: new Set([CORRIGE.id]) }) === true);
test('l\'abonnement mensuel donne accès au corrigé',
  epreuves.aAcces(CORRIGE, { isAdmin: false, niveaux: new Set(['bac']), epreuves: new Set() }) === true);
test('l\'abonnement d\'un autre niveau ne donne pas accès',
  epreuves.aAcces(CORRIGE, { isAdmin: false, niveaux: new Set(['brevet']), epreuves: new Set() }) === false);
test('l\'admin accède à tout',
  epreuves.aAcces(CORRIGE, { isAdmin: true, niveaux: new Set(), epreuves: new Set() }) === true);
test('un achat sur une autre épreuve ne donne pas accès',
  epreuves.aAcces(CORRIGE, { isAdmin: false, niveaux: new Set(), epreuves: new Set([SUJET.id]) }) === false);

// ── Vue publique : aucune fuite du chemin interne ───────────────────
const vue = epreuves.epreuvePublique(CORRIGE, { isAdmin: false, niveaux: new Set(), epreuves: new Set() });
test('la vue publique ne contient pas le chemin du fichier', !('fichier_url' in vue));
test('la vue publique expose le type', vue.type === 'corrige');
test('la vue publique expose le prix', vue.price === 200);
test('la vue publique indique que ce n\'est pas accessible', vue.accessible === false);
test('la vue publique garde la traçabilité', vue.source.nom === 'ONEB' && vue.source.licence === 'domaine public');
test('la vue publique ne rend pas le sujet pay downloadable', vue.telechargeable === false);
const vueSujet = epreuves.epreuvePublique(SUJET, null);
test('le sujet gratuit est téléchargeable', vueSujet.telechargeable === true);

// ── Type normalisé ──────────────────────────────────────────────────
test('le type par défaut est sujet', epreuves.normaliserType('') === 'sujet');
test('le type corrigé est reconnu', epreuves.normaliserType('Corrige') === 'corrige');
test('un type inconnu retombe sur sujet', epreuves.normaliserType('n\'importe quoi') === 'sujet');

// ── Résolution du fichier ───────────────────────────────────────────
(async () => {
  const externe = await epreuves.resoudreLienFichier({ fichier_url: 'https://exemple.bj/sujet.pdf' }, {});
  test('un lien externe est renvoyé tel quel', externe.ok === true && externe.mode === 'externe');

  const sansCle = await epreuves.resoudreLienFichier({ fichier_url: 'supabase:bj/sujet.pdf' }, {});
  test('sans clé service, un objet du bucket n\'est pas signé',
    sansCle.ok === false && /SUPABASE_SERVICE_KEY/.test(String(sansCle.error || '')), JSON.stringify(sansCle));

  const absent = await epreuves.resoudreLienFichier({ fichier_url: 'fichier-inexistant.pdf' }, {});
  test('un fichier local absent est signalé', absent.ok === false);

  // Fichier local réel : on le place dans un dossier de test.
  const dossierTest = path.join(__dirname, '..', 'cache', 'test-epreuves');
  fs.mkdirSync(dossierTest, { recursive: true });
  fs.writeFileSync(path.join(dossierTest, 'sujet-test.pdf'), '%PDF-1.4 test');
  process.env.EPREUVES_DIR = dossierTest;
  const local = await epreuves.resoudreLienFichier({ fichier_url: 'sujet-test.pdf' }, {});
  test('un fichier local présent est servi par le serveur',
    local.ok === true && local.mode === 'local' && typeof local.chemin === 'string');
  test('le dossier local peut être surchargé (tests)', epreuves.dossierEpreuves() === dossierTest);

  delete process.env.EPREUVES_DIR;

  // ── Manifeste d'import : la source et la licence sont obligatoires ──
  const manifeste = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'epreuves', 'sources-exemple.json'), 'utf8'));
  const documents = Array.isArray(manifeste) ? manifeste : manifeste.documents || [];
  test('le manifeste d\'exemple contient des documents', documents.length > 0);
  test('chaque document du manifeste a une source', documents.every(d => !!d.source_nom));
  test('chaque document du manifeste a une licence', documents.every(d => !!d.licence));
  test('le manifeste distingue sujets et corrigés',
    documents.some(d => d.type === 'sujet') && documents.some(d => d.type === 'corrige'));
  test('les sujets du manifeste sont gratuits', documents.filter(d => d.type === 'sujet').every(d => d.is_free === true));
  test('les corrigés du manifeste sont payants', documents.filter(d => d.type === 'corrige').every(d => d.price > 0));

  // ── Formats multiples ────────────────────────────────────────────
  test('le format pdf est détecté', epreuves.detecterFormat('sujet-test.pdf') === 'pdf');
  test('le format Word est détecté', epreuves.detecterFormat('bj-bac-2024-math.docx') === 'docx');
  test('le format ZIP est détecté', epreuves.detecterFormat('archive.zip') === 'zip');
  test('une image est détectée', epreuves.detecterFormat('scan.png') === 'png');
  test('un format inconnu retombe sur pdf', epreuves.detecterFormat('sujet.exe') === 'pdf');
  test('un lien externe déduit son format', epreuves.detecterFormat('https://exemple.bj/corrige.pdf') === 'pdf');
  test('le PDF s\'affiche dans le navigateur', epreuves.infosFormat('pdf').inline === true);
  test('un Word se télécharge', epreuves.infosFormat('docx').inline === false);
  test('le type MIME du Word est correct',
    epreuves.infosFormat('docx').mime.includes('wordprocessingml'));

  // ── Rigueur du corrigé : règles de publication ───────────────────
  const SUJET_LIBRE = Object.assign({}, SUJET, { is_free: true, price: 0, source_nom: 'ONEB', licence: 'domaine public' });
  test('un sujet gratuit est publiable tel quel',
    epreuves.verifierPublication(SUJET_LIBRE, {}).length === 0);
  test('un corrigé payant sans solution est refusé',
    epreuves.verifierPublication(CORRIGE, { validee: true, bareme: 20 }).some(e => /solution/i.test(e)));
  test('un corrigé payant non validé est refusé',
    epreuves.verifierPublication(CORRIGE, { solution: 'x'.repeat(100), bareme: 20 }).some(e => /valid/i.test(e)));
  test('un corrigé payant sans barème est refusé',
    epreuves.verifierPublication(CORRIGE, { solution: 'x'.repeat(100), validee: true }).some(e => /barème/i.test(e)));
  test('un corrigé payant sans prix est refusé',
    epreuves.verifierPublication(Object.assign({}, CORRIGE, { price: 0 }), { solution: 'x'.repeat(100), bareme: 20, validee: true })
      .some(e => /prix/i.test(e)));
  test('un document sans source ni licence est refusé',
    epreuves.verifierPublication(Object.assign({}, SUJET_LIBRE, { source_nom: '', licence: '' }), {})
      .some(e => /source/i.test(e)));
  test('un corrigé complet et validé est publiable',
    epreuves.verifierPublication(CORRIGE, { solution: 'x'.repeat(120), bareme: 20, validee: true }).length === 0);

  // ── La solution n'est exposée qu'aux bons élèves ─────────────────
  const correction = { solution: 'Solution complète, étape par étape.', bareme: 20, difficulte: 'moyen', validee: true };
  const corrigePrive = epreuves.epreuvePublique(CORRIGE, { isAdmin: false, niveaux: new Set(), epreuves: new Set() }, correction);
  test('la solution n\'est pas exposée à un élève sans droits', corrigePrive.solution === ''
    && corrigePrive.aSolution === false);
  const corrigePublic = epreuves.epreuvePublique(CORRIGE, { isAdmin: false, niveaux: new Set(), epreuves: new Set([CORRIGE.id]) }, correction);
  test('la solution est exposée à l\'élève ayant payé',
    corrigePublic.solution === correction.solution && corrigePublic.aSolution === true);
  const corrigeAbonne = epreuves.epreuvePublique(CORRIGE, { isAdmin: false, niveaux: new Set(['bac']), epreuves: new Set() }, correction);
  test('l\'abonnement donne accès à la solution', corrigeAbonne.aSolution === true);
  const sujetAvecSolution = epreuves.epreuvePublique(SUJET, null, correction);
  test('un sujet n\'expose jamais de solution', sujetAvecSolution.solution === ''
    && sujetAvecSolution.aSolution === false);
  test('le barème et la difficulté sont annoncés même sans droits',
    corrigePrive.bareme === 20 && corrigePrive.difficulte === 'moyen' && corrigePrive.validee === true);

  // ── Nom de fichier servi ─────────────────────────────────────────
  test('le nom servi ne contient pas de chemin', epreuves.nomFichier({ fichier_url: 'dossier/sous/sujet.pdf' }) === 'sujet.pdf');
  test('le nom servi neutralise les guillemets',
    epreuves.nomFichier({ fichier_url: 'a"b.pdf' }).indexOf('"') < 0);
  test('le nom servi a une valeur de repli', epreuves.nomFichier({}) === 'epreuve.pdf');

  // ── Identité canonique (actualisation multi-classes) ─────────────
  // C'est LA clé de l'actualisation : sans classe ni série dans la clé,
  // deux séries s'écrasaient à l'import.
  const base = { pays: 'BJ', niveau: 'bac', classe: 'Tle', serie: 'C', annee: 2026, matiere: 'Mathématiques', type: 'sujet' };
  test('le slug est déterministe', epreuves.epreuveSlug(base) === epreuves.epreuveSlug(base));
  test('le slug contient la classe et la série',
    epreuves.epreuveSlug(base).includes('tle') && epreuves.epreuveSlug(base).includes('-c-'));
  test('deux séries ont deux slugs différents',
    epreuves.epreuveSlug(base) !== epreuves.epreuveSlug(Object.assign({}, base, { serie: 'D' })));
  test('deux classes ont deux slugs différents',
    epreuves.epreuveSlug(base) !== epreuves.epreuveSlug(Object.assign({}, base, { classe: '3e' })));
  test('deux matières ont deux slugs différents',
    epreuves.epreuveSlug(base) !== epreuves.epreuveSlug(Object.assign({}, base, { matiere: 'Philosophie' })));
  test('deux années ont deux slugs différents',
    epreuves.epreuveSlug(base) !== epreuves.epreuveSlug(Object.assign({}, base, { annee: 2027 })));
  test('le sujet et le corrigé ont deux slugs différents',
    epreuves.epreuveSlug(base) !== epreuves.epreuveSlug(Object.assign({}, base, { type: 'corrige' })));
  test('le slug ne contient ni accent ni espace',
    /^[a-z0-9-]+$/.test(epreuves.epreuveSlug(base)));
  test('le nom de fichier est unique par identité',
    epreuves.epreuveNomFichier(base, 'pdf') !== epreuves.epreuveNomFichier(Object.assign({}, base, { serie: 'D' }), 'pdf'));
  test('le nom de fichier porte l\'extension du format',
    epreuves.epreuveNomFichier(base, 'docx').endsWith('.docx'));

  // ── Matrice de couverture d'une campagne ─────────────────────────
  const grille = [
    { classe: 'Tle', serie: 'C', matieres: ['Mathématiques', 'Philosophie'] },
    { classe: 'Tle', serie: 'D', matieres: ['Mathématiques'] }
  ];
  const lignesBase = [
    Object.assign({}, SUJET, { slug: '', classe: 'Tle', serie: 'C', annee: 2026, type: 'sujet', published: true })
  ];
  const couverture = epreuves.couvertureEpreuves(lignesBase, { pays: 'BJ', annee: 2026, niveau: 'bac', grille });
  test('la couverture compte toutes les cases de la grille', couverture.totaux.cases === 3);
  test('la couverture compte les cases vides', couverture.totaux.vides === 2);
  test('la couverture compte les cases partielles', couverture.totaux.partiels === 1);
  test('la couverture compte les sujets trouvés', couverture.totaux.sujets === 1);
  test('la couverture exclut une autre année',
    epreuves.couvertureEpreuves(lignesBase, { pays: 'BJ', annee: 2027, niveau: 'bac', grille }).totaux.sujets === 0);
  test('la couverture exclut un autre pays',
    epreuves.couvertureEpreuves(lignesBase, { pays: 'TG', annee: 2026, niveau: 'bac', grille }).totaux.sujets === 0);
  test('la couverture exclut un autre niveau',
    epreuves.couvertureEpreuves(lignesBase, { pays: 'BJ', annee: 2026, niveau: 'brevet', grille }).totaux.sujets === 0);
  test('la couverture distingue les séries',
    couverture.lignes.filter(l => l.serie === 'C').length === 2
    && couverture.lignes.filter(l => l.serie === 'D').length === 1);
  test('un sujet publié est compté comme publié',
    couverture.totaux.publies === 1 && couverture.totaux.brouillons === 0);
  test('le taux de couverture est calculé', couverture.taux === 33);

  console.log(`\n${ok} test(s) réussi(s), ${ko} échec(s).`);
  process.exit(ko ? 1 : 0);
})();
