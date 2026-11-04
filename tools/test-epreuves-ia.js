/**
 * tools/test-epreuves-ia.js — tests de la génération automatique d'épreuves.
 *
 * Aucun réseau : le modèle et la base sont simulés. Ce qui est vérifié :
 *   1. le prompt contient le programme, mot pour mot (la base pilote) ;
 *   2. une réponse IA incomplète est refusée (exercices, barème, solution) ;
 *   3. une réponse valide produit des blocs de document exploitables ;
 *   4. l'écriture en base crée la fiche, le contenu et la correction ;
 *   5. un corrigé payant reste NON validé et NON publié ;
 *   6. le PDF rendu à la volée est un PDF valide ;
 *   7. une base absente (clé service manquante) est signalée clairement.
 *
 * Usage : node tools/test-epreuves-ia.js
 */
const path = require('path');
const epreuvesIA = require('../server_epreuves_ia.js');
const epreuves = require('../server_epreuves.js');
const { rendreBlocsPdf } = require('./lib/pdf-mini.js');

let ok = 0;
let ko = 0;

function test(nom, condition, detail = '') {
  if (condition) { ok++; console.log(`OK    | ${nom}`); }
  else { ko++; console.log(`KO    | ${nom}${detail ? ' -> ' + detail : ''}`); }
}

const PROGRAMME = ['Statistiques : moyenne, médiane, étendue', 'Proportionnalité', 'Thalès', 'Aires', 'Calcul littéral'];

const REPONSE_VALIDE = {
  titre: 'Épreuve de Mathématiques — BEPC 2026',
  consigne: ['Durée : 2 heures', 'Calculatrice interdite'],
  exercices: [
    { titre: 'Exercice 1', enonce: 'Calcule la moyenne de la série 8 ; 12 ; 14 ; 10.', points: 8 },
    { titre: 'Exercice 2', enonce: 'Un vendeur achète 25 sacs à 8 500 F CFA. Calcule le coût.', points: 6 },
    { titre: 'Exercice 3', enonce: 'Dans un triangle, EF parallèle à BC avec AE = 6 cm. Calcule AF.', points: 6 }
  ],
  solution: "Exercice 1 : la moyenne vaut 11 points (8 points).\nExercice 2 : le coût total vaut 212 500 F CFA (6 points).\nExercice 3 : AF = 12 cm (6 points).",
  bareme: 20,
  difficulte: 'moyen'
};

/** Faux modèle : renvoie la réponse préparée. */
function fauxGemini(reponse) {
  return async () => ({
    ok: true,
    status: 200,
    modele: 'modele-de-test',
    data: { candidates: [{ content: { parts: [{ text: JSON.stringify(reponse) }] } }] }
  });
}

/** Fausse base : enregistre ce qu'on lui écrit. */
function fausseBase() {
  const tables = { epreuves: [], epreuve_contenus: [], epreuve_corrections: [] };
  let compteur = 0;
  return {
    tables,
    restWrite: async (endpoint, methode, corps) => {
      if (endpoint.includes('/epreuves?')) {
        const ligne = Object.assign({}, corps, { id: `uuid-${++compteur}` });
        tables.epreuves.push(ligne);
        return { ok: true, data: [ligne] };
      }
      if (endpoint.includes('/epreuve_contenus?')) {
        tables.epreuve_contenus.push(corps);
        return { ok: true, data: corps };
      }
      if (endpoint.includes('/epreuve_corrections?')) {
        tables.epreuve_corrections.push(corps);
        return { ok: true, data: corps };
      }
      return { ok: false, error: 'endpoint inconnu : ' + endpoint };
    }
  };
}

// ── 1. Le prompt suit la base ────────────────────────────────────────
const prompt = epreuvesIA.construirePromptEpreuve({
  matiere: 'Mathématiques', niveau: 'brevet', classe: '3e', serie: '', annee: 2026, type: 'sujet', topics: PROGRAMME
});
test('le prompt contient chaque topic du programme', PROGRAMME.every(t => prompt.includes(t)));
test('le prompt annonce le niveau et l\'année', prompt.includes('BEPC') && prompt.includes('2026'));
test('le prompt impose un JSON', prompt.includes('"exercices"') && prompt.includes('"solution"'));
test('le prompt interdit de mentionner l\'IA', /ne mentionne pas|pas de mention/i.test(prompt));

// ── 2. Normalisation : cas invalides ─────────────────────────────────
const tropPeu = epreuvesIA.normaliserEpreuveIA({ titre: 'T', exercices: [{ titre: 'E1', enonce: 'x', points: 20 }] }, {});
test('moins de 3 exercices est refusé', !tropPeu.ok && tropPeu.erreurs.length > 0, JSON.stringify(tropPeu.erreurs));

const baremeFaux = epreuvesIA.normaliserEpreuveIA(
  Object.assign({}, REPONSE_VALIDE, { bareme: 20, exercices: REPONSE_VALIDE.exercices.map(e => Object.assign({}, e, { points: 5 })) }),
  {}
);
test('un barème incohérent est refusé', !baremeFaux.ok, JSON.stringify(baremeFaux.erreurs));

const solutionCourte = epreuvesIA.normaliserEpreuveIA(
  Object.assign({}, REPONSE_VALIDE, { solution: 'trop court' }),
  { type: 'corrige' }
);
test('une correction trop courte est refusée', !solutionCourte.ok, JSON.stringify(solutionCourte.erreurs));

// ── 3. Normalisation : cas valide ────────────────────────────────────
const normalise = epreuvesIA.normaliserEpreuveIA(REPONSE_VALIDE, { type: 'sujet', matiere: 'Mathématiques' });
test('une réponse valide est acceptée', normalise.ok, JSON.stringify(normalise.erreurs));
test('les blocs produits sont exploitables', Array.isArray(normalise.blocs) && normalise.blocs.length >= 8);
test('le titre est repris', normalise.titre.includes('Mathématiques'));
test('la consigne est conservée', normalise.blocs.some(b => b.type === 'consigne'));
test('chaque exercice a un sous-titre et un énoncé',
  normalise.blocs.filter(b => b.type === 'sousTitre').length === 3
  && normalise.blocs.filter(b => b.type === 'texte').length >= 3);

const normaliseCorrige = epreuvesIA.normaliserEpreuveIA(REPONSE_VALIDE, { type: 'corrige', matiere: 'Mathématiques' });
test('le corrigé contient la solution et le barème',
  normaliseCorrige.ok && normaliseCorrige.bareme === 20 && normaliseCorrige.solution.length > 80);
test('le corrigé contient un tableau de barème',
  normaliseCorrige.blocs.some(b => b.type === 'tableau'));

// ── 4. Écriture en base ──────────────────────────────────────────────
(async () => {
  const base = fausseBase();
  const resultat = await epreuvesIA.genererEpreuve({
    pays: 'BJ', niveau: 'brevet', classe: '3e', serie: '', matiere: 'Mathématiques',
    type: 'sujet', annee: 2026, topics: PROGRAMME
  }, {
    callGemini: fauxGemini(REPONSE_VALIDE),
    extractJson: (t) => JSON.parse(t),
    restWrite: base.restWrite,
    model: 'modele-de-test'
  });

  test('la génération aboutit', resultat.ok, JSON.stringify(resultat.erreurs));
  test('la fiche épreuve est écrite', base.tables.epreuves.length === 1);
  const fiche = base.tables.epreuves[0] || {};
  test('la fiche porte source et licence', !!fiche.source_nom && !!fiche.licence);
  test('la fiche est un sujet gratuit et publié', fiche.is_free === true && fiche.published === true);
  test('la fiche pointe vers un contenu généré', String(fiche.fichier_url || '').startsWith('genere:'));
  test('le contenu est écrit dans epreuve_contenus', base.tables.epreuve_contenus.length === 1);
  test('le contenu est marqué comme généré par IA', (base.tables.epreuve_contenus[0] || {}).origine === 'ia');

  // Corrigé : non validé, non publié.
  const base2 = fausseBase();
  const resultat2 = await epreuvesIA.genererEpreuve({
    pays: 'BJ', niveau: 'brevet', classe: '3e', serie: '', matiere: 'Mathématiques',
    type: 'corrige', annee: 2026, topics: PROGRAMME
  }, {
    callGemini: fauxGemini(REPONSE_VALIDE),
    extractJson: (t) => JSON.parse(t),
    restWrite: base2.restWrite,
    model: 'modele-de-test'
  });
  const fiche2 = base2.tables.epreuves[0] || {};
  const correction = base2.tables.epreuve_corrections[0] || {};
  test('la génération du corrigé aboutit', resultat2.ok, JSON.stringify(resultat2.erreurs));
  test('un corrigé payant est enregistré non validé', correction.validee === false);
  test('un corrigé payant est enregistré non publié', fiche2.published === false && fiche2.is_free === false);
  test('un corrigé payant porte un prix', Number(fiche2.price) > 0, String(fiche2.price));
  test('le corrigé porte un barème', Number(correction.bareme) > 0);

  // Garde-fou de publication : un corrigé non validé ne peut pas être publié.
  const refus = epreuves.verifierPublication(
    { titre: 'T', fichier_url: 'genere:x', source_nom: 's', licence: 'l', type: 'corrige', is_free: false, price: 200 },
    { solution: 'x'.repeat(100), bareme: 20, validee: false }
  );
  test('un corrigé non validé est refusé à la publication', refus.length > 0, JSON.stringify(refus));

  // ── 5. Base indisponible ──────────────────────────────────────────
  const sansBase = await epreuvesIA.genererEpreuve({
    pays: 'BJ', niveau: 'brevet', classe: '3e', matiere: 'Mathématiques', type: 'sujet', annee: 2026, topics: PROGRAMME
  }, { callGemini: fauxGemini(REPONSE_VALIDE), extractJson: (t) => JSON.parse(t) });
  test('sans écriture en base, l\'échec est explicite', !sansBase.ok && /base|clé|service/i.test(sansBase.erreurs.join(' ')));

  // ── 6. Rendu PDF à la volée ────────────────────────────────────────
  const contenu = {
    blocs: normalise.blocs
  };
  const trouve = epreuves.trouverEpreuveType ? null : null; // (réservé)
  const rendu = rendreBlocsPdf(contenu.blocs, { titre: 'Épreuve de test' });
  test('le rendu à la volée produit un PDF', rendu.slice(0, 4).toString('latin1') === '%PDF');
  test('le rendu à la volée contient des pages', rendu.includes('/Type /Page') && rendu.length > 1000, String(rendu.length));

  // ── 7. Résolution du lien « genere: » ──────────────────────────────
  const lien = await epreuves.resoudreLienFichier(
    { id: 'abc', fichier_url: 'genere:slug-test' },
    { restGet: async () => ({ ok: true, data: [{ blocs: normalise.blocs, origine: 'ia' }] }) }
  );
  test('une référence « genere: » renvoie les blocs', lien.ok && lien.mode === 'genere' && Array.isArray(lien.blocs));
  const lienVide = await epreuves.resoudreLienFichier(
    { id: 'abc', fichier_url: 'genere:slug-test' },
    { restGet: async () => ({ ok: true, data: [] }) }
  );
  test('un contenu généré absent est signalé', !lienVide.ok);

  console.log('\n====================================================');
  console.log(`${ok} test(s) réussi(s), ${ko} échec(s).`);
  process.exitCode = ko > 0 ? 1 : 0;
})();
