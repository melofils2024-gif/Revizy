/**
 * Épreuves types Revisy — Anglais (BEPC 3e).
 * Document original écrit en interne.
 */
const SUJET = {
  id: 'bepc-3e-anglais-sujet',
  fichier: 'bepc-3e-anglais-sujet',
  titre: 'Épreuve type d\'Anglais — BEPC 3e',
  description: 'Sujet d\'entraînement BEPC en anglais : compréhension, grammaire, expression. Barème sur 20.',
  examen: 'BEPC', niveau: 'brevet', classe: '3e', serie: null, annee: 2026,
  matiere: 'Anglais', type: 'sujet',
  sourceNom: 'Revisy — épreuve type rédigée en interne',
  sourceUrl: 'https://revisy.onrender.com',
  licence: 'Document original Revisy — libre de reproduction et de rediffusion',
  blocs: [
    { type: 'titre', texte: "BREVET D'ÉTUDES DU PREMIER CYCLE — SESSION DE RÉVISION"},
    { type: 'consigne', lignes: ['ÉPREUVE D\'ANGLAIS','Durée : 2 heures — Coefficient : 3 — Aucune calculatrice n\'est nécessaire.','Les quatre parties sont obligatoires.']},
    { type: 'sousTitre', texte: 'Part 1 (5 points) — Reading comprehension' },
    { type: 'texte', texte: "Read the text and answer. In the town of Porto-Novo, school is built from a chief's old palace. Students arrive by bus and by moto. Their classrooms face the market road. The library is a small concrete building with windows open to the shade. At lunch, teachers measure out portions and call quietly. In the evening, the students walk home with books on their backs." },
    { type: 'liste', items: ['a) Where is the school built?','b) How do the students travel?','c) Describe the library.','d) What do teachers do at lunch?']},
    { type: 'sousTitre', texte: 'Part 2 (5 points) — Grammar' },
    { type: 'liste', items: ['a) Fill the gap: She ____ (go) to school by bus.','b) Fill the gap: They ____ (already / finish) the test.','c) Choose the correct word: He is ____ (more / most) careful than before.','d) Turn into passive: The chief sells the vegetables.']},
    { type: 'sousTitre', texte: 'Part 3 (5 points) — Writing' },
    { type: 'texte', texte: "Write a short paragraph (about 6 lines) about your own school: where it is, what you study, and one thing you like about it." },
    { type: 'sousTitre', texte: 'Part 4 (5 points) — Vocabulary' },
    { type: 'liste', items: ['a) Give two words related to the topic of travel.','b) Write two words for a school building.']},
    { type: 'texte', texte: 'Good luck!' }
  ]
};
const CORRIGE = {
  id: 'bepc-3e-anglais-corrige',
  fichier: 'bepc-3e-anglais-corrige',
  titre: 'Corrigé — Épreuve type d\'Anglais (BEPC 3e)',
  description: 'Corrigé rédigé avec barème : compréhension, grammaire, expression.',
  examen: 'BEPC', niveau: 'brevet', classe: '3e', serie: null, annee: 2026,
  matiere: 'Anglais', type: 'corrige',
  sourceNom: 'Revisy — corrigé d\'épreuve type rédigé en interne',
  sourceUrl: 'https://revisy.onrender.com',
  licence: 'Document original Revisy — libre de reproduction et de rediffusion',
  blocs: [
    { type: 'titre', texte: "CORRIGÉ — ÉPREUVE TYPE D'ANGLAIS (BEPC 3e)"},
    { type: 'consigne', lignes: ['Barème sur 20 points.','Points attribués selon la précision et la qualité de l’expression.'] },
    { type: 'sousTitre', texte: 'Part 1 — Responses' },
    { type: 'liste', items: ['a) It is built from a chief’s old palace.','b) They travel by bus and by moto.','c) It is a small concrete building with windows open to the shade.','d) They measure out portions and call quietly.'] },
    { type: 'sousTitre', texte: 'Part 2 — Grammar' },
    { type: 'liste', items: ['a) goes','b) have already finished','c) more','d) The vegetables are sold by the chief.'] },
    { type: 'sousTitre', texte: 'Part 3 — Writing' },
    { type: 'texte', texte: "Acceptable answers will mention a school, subjects, and a personal detail. Score accordingly: idea (1 pt), organisation (2 pts), language quality (2 pts)." },
    { type: 'sousTitre', texte: 'Part 4 — Vocabulary' },
    { type: 'liste', items: ['a) Examples: bus, moto, station, platform.','b) Examples: classroom, library, playground, building.'] }
  ]
};
module.exports = { DOCUMENTS: [SUJET, CORRIGE] };
