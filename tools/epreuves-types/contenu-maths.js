/**
 * Épreuves types Revisy — Mathématiques (BEPC 3e).
 * Document original écrit en interne : aucune reprise d'un sujet tiers.
 */

const BAREME = {
  entetes: ['Exercice', 'Questions', 'Points'],
  lignes: [
    ['1 — Calcul numérique', 'a) 1 pt   b) 1 pt   c) 2 pts', '4'],
    ['2 — Proportionnalité et prix', 'a) 2 pts   b) 1 pt   c) 2 pts', '5'],
    ['3 — Thalès et aires', 'a) 1 pt   b) 2 pts   c) 2 pts   d) 1 pt', '6'],
    ['4 — Statistiques', 'a) 2 pts   b) 1 pt   c) 1 pt   d) 1 pt', '5'],
    ['Total', '', '20']
  ]
};

const SUJET = {
  id: 'bepc-3e-maths-sujet',
  fichier: 'bepc-3e-mathematiques-sujet',
  titre: 'Épreuve types de Mathématiques — BEPC 3e',
  description: 'Sujet d\'entraînement au BEPC : calcul numérique, proportionnalité, Thalès et statistiques. Barème sur 20.',
  examen: 'BEPC', niveau: 'brevet', classe: '3e', serie: null, annee: 2026,
  matiere: 'Mathématiques', type: 'sujet',
  sourceNom: 'Revisy — épreuve type rédigée en interne',
  sourceUrl: 'https://revisy.onrender.com',
  licence: 'Document original Revisy — libre de reproduction et de rediffusion',
  blocs: [
    { type: 'titre', texte: "BREVET D'ÉTUDES DU PREMIER CYCLE — SESSION DE RÉVISION" },
    { type: 'consigne', lignes: [
      'ÉPREUVE DE MATHÉMATIQUES',
      "Durée : 2 heures — Coefficient : 4 — L'usage de la calculatrice est interdit.",
      'Les quatre exercices sont obligatoires. Le total des points est de 20.'
    ] },
    { type: 'sousTitre', texte: 'Exercice 1 (4 points) — Calcul numérique' },
    { type: 'texte', texte: "Pour chaque question, écris le calcul puis le résultat." },
    { type: 'liste', items: [
      "a) Calcule A = (3/4 − 1/2) × 8 + 5/6.",
      "b) Calcule B = 12/5 ÷ 3/4.",
      "c) Écris le nombre décimal 0,125 sous la forme d'une fraction irréductible."
    ] },
    { type: 'sousTitre', texte: 'Exercice 2 (5 points) — Proportionnalité et prix' },
    { type: 'texte', texte: "Un ordinateur portable coûte 18 000 F CFA. Un enseignant achète 12 ordinateurs pour sa classe et bénéficie d'une remise de 5 % sur le montant total de la commande." },
    { type: 'liste', items: [
      "a) Calcule le montant de la commande avant la remise.",
      "b) Calcule le montant de la remise accordée.",
      "c) Calcule le prix réellement payé, en F CFA."
    ] },
    { type: 'sousTitre', texte: 'Exercice 3 (6 points) — Thalès et aires' },
    { type: 'texte', texte: "Dans un triangle ABC, le point E appartient à [AB] et le point F appartient à [AC]. On sait que AE = 6 cm, AB = 15 cm, AC = 30 cm et BC = 25 cm. La droite (EF) est parallèle à (BC). La hauteur issue de A relative à la base BC vaut 20 cm." },
    { type: 'liste', items: [
      "a) Calcule le rapport AE/AB.",
      "b) Calcule la longueur AF.",
      "c) Calcule la longueur EF.",
      "d) Calcule l'aire du triangle AEF, puis celle du triangle ABC."
    ] },
    { type: 'sousTitre', texte: 'Exercice 4 (5 points) — Statistiques' },
    { type: 'texte', texte: "Les notes sur 20 des 12 élèves d'une classe sont : 8 ; 12 ; 14 ; 10 ; 16 ; 18 ; 12 ; 9 ; 15 ; 17 ; 11 ; 13." },
    { type: 'liste', items: [
      "a) Calcule la moyenne de cette série, arrondie au centième.",
      "b) Détermine la médiane de cette série.",
      "c) Calcule l'étendue de la série.",
      "d) Combien d'élèves ont obtenu une note supérieure ou égale à 14 ?"
    ] },
    { type: 'texte', texte: 'Bon courage !' }
  ]
};

const CORRIGE = {
  id: 'bepc-3e-maths-corrige',
  fichier: 'bepc-3e-mathematiques-corrige',
  titre: 'Corrigé — Épreuve types de Mathématiques (BEPC 3e)',
  description: 'Corrigé rédigé avec barème : calcul numérique, prix, Thalès et aires, statistiques.',
  examen: 'BEPC', niveau: 'brevet', classe: '3e', serie: null, annee: 2026,
  matiere: 'Mathématiques', type: 'corrige',
  sourceNom: 'Revisy — corrigé d\'épreuve type rédigé en interne',
  sourceUrl: 'https://revisy.onrender.com',
  licence: 'Document original Revisy — libre de reproduction et de rediffusion',
  blocs: [
    { type: 'titre', texte: 'CORRIGÉ — ÉPREUVE TYPES DE MATHÉMATIQUES (BEPC 3e)' },
    { type: 'consigne', lignes: ['Barème sur 20 points.', 'Une réponse exacte sans justification vaut la moitié des points.'] },
    { type: 'sousTitre', texte: 'Exercice 1 (4 points)' },
    { type: 'texte', texte: "a) 3/4 − 1/2 = 3/4 − 2/4 = 1/4 ; 1/4 × 8 = 2 ; 2 + 5/6 = 12/6 + 5/6 = 17/6. Donc A = 17/6 (1 point)." },
    { type: 'texte', texte: "b) 12/5 ÷ 3/4 = 12/5 × 4/3 = 48/15 = 16/5. Donc B = 16/5 (1 point)." },
    { type: 'texte', texte: "c) 0,125 = 125/1000 = 5/40 = 1/8. Le numérateur et le dénominateur sont premiers entre eux : la fraction est irréductible (2 points)." },
    { type: 'sousTitre', texte: 'Exercice 2 (5 points)' },
    { type: 'texte', texte: "a) 12 × 18 000 = 216 000 F CFA (2 points)." },
    { type: 'texte', texte: "b) Remise = 216 000 × 5/100 = 10 800 F CFA (1 point)." },
    { type: 'texte', texte: "c) Prix payé = 216 000 − 10 800 = 205 200 F CFA (2 points). Soit 17 100 F CFA par ordinateur." },
    { type: 'sousTitre', texte: 'Exercice 3 (6 points)' },
    { type: 'texte', texte: "a) AE/AB = 6/15 = 2/5 (1 point)." },
    { type: 'texte', texte: "b) Les triangles AEF et ABC sont semblables (Thalès) : AF/AC = AE/AB = 2/5, donc AF = 30 × 2/5 = 12 cm (2 points)." },
    { type: 'texte', texte: "c) EF/BC = 2/5, donc EF = 25 × 2/5 = 10 cm (2 points)." },
    { type: 'texte', texte: "d) Aire de ABC = (BC × hauteur)/2 = (25 × 20)/2 = 250 cm². L'aire de AEF vaut (2/5)² = 4/25 de celle de ABC, donc 250 × 4/25 = 40 cm² (1 point)." },
    { type: 'sousTitre', texte: 'Exercice 4 (5 points)' },
    { type: 'texte', texte: "a) Somme des notes = 155 ; moyenne = 155/12 ≈ 12,92 (2 points)." },
    { type: 'texte', texte: "b) Série ordonnée : 8 ; 9 ; 10 ; 11 ; 12 ; 12 ; 13 ; 14 ; 15 ; 16 ; 17 ; 18. Il y a 12 valeurs : la médiane est la moyenne des 6e et 7e valeurs, soit (12 + 13)/2 = 12,5 (1 point)." },
    { type: 'texte', texte: "c) Étendue = 18 − 8 = 10 (1 point)." },
    { type: 'texte', texte: "d) Notes supérieures ou égales à 14 : 14 ; 16 ; 18 ; 15 ; 17, soit 5 élèves (1 point)." },
    { type: 'sousTitre', texte: 'Barème' },
    { type: 'tableau', entetes: BAREME.entetes, lignes: BAREME.lignes },
    { type: 'texte', texte: "Erreurs les plus fréquentes : confondre 3/4 − 1/2 et 3/4 ÷ 1/2 ; oublier d'appliquer la remise au montant total ; inverser le rapport de Thalès ; ne pas ordonner les notes avant de chercher la médiane." }
  ]
};

module.exports = { DOCUMENTS: [SUJET, CORRIGE] };
