/**
 * Épreuves types Revisy — BAC (Terminale, séries A, B, C, D et G).
 *
 * Documents ORIGINAUX écrits en interne : aucun sujet officiel n'est
 * recopié. Chaque série reçoit les deux disciplines qui la caractérisent,
 * en sujet ET en corrigé, pour que chaque élève de Terminale trouve des
 * épreuves téléchargeables correspondant à SA série.
 */

const LICENCE = "Document original Revisy — libre de reproduction et de rediffusion";
const SOURCE_URL = "https://revisy.onrender.com";

const BAREME_20 = {
  entetes: ["Exercice", "Notation", "Points"],
  lignes: [
    ["Exercice 1", "Questions a, b, c", "10"],
    ["Exercice 2", "Questions a, b, c", "10"],
    ["Total", "", "20"]
  ]
};

/** Fabrique un document à partir de son identité et de ses blocs. */
function document(base, blocs) {
  const identite = Object.assign({ annee: 2026, niveau: "bac", classe: "Tle", sourceUrl: SOURCE_URL }, base);
  return Object.assign({}, identite, {
    id: `${identite.fichier}`,
    sourceNom: identite.type === "corrige"
      ? "Revisy — corrigé d'épreuve type rédigé en interne"
      : "Revisy — épreuve type rédigée en interne",
    licence: LICENCE,
    blocs
  });
}

// ══════════════════════════════════════════════════════════════════
// SÉRIE A — FRANÇAIS
// ══════════════════════════════════════════════════════════════════

const A_FRANCAIS_SUJET = document({
  fichier: "bac-tle-a-francais-sujet",
  titre: "Épreuve types de Français — BAC série A",
  description: "Commentaire d'un texte narratif original puis sujet de dissertation sur l'école et la réussite. Barème sur 20.",
  examen: "BAC", serie: "A", matiere: "Français", type: "sujet"
}, [
  { type: "titre", texte: "BACCALAURÉAT — SÉRIE A — ÉPREUVE TYPES DE FRANÇAIS" },
  { type: "consigne", lignes: [
    "Durée : 4 heures — Coefficient : 4",
    "L'usage du dictionnaire est autorisé. Les deux parties sont obligatoires.",
    "Partie 1 : compréhension et analyse du texte (10 points).",
    "Partie 2 : production écrite, au choix du candidat (10 points)."
  ] },
  { type: "sousTitre", texte: "Texte" },
  { type: "texte", texte: "À l'aube, la cour de l'école de Zogbodomey s'éveillait avant le village. Les balayeurs traçaient des lignes claires dans la poussière rouge, et les premiers élèves, serrés autour du vieux manguier, ouvraient leurs cahiers comme des ailes. Le maître arrivait, sa craie à la main, et le silence se faisait si dense qu'on entendait les coqs au loin. Ici, nul ne parlait de fortune : on parlait de dictée, de problèmes et de courage. Le soir, les mêmes enfants repartaient avec, dans la tête, une lumière que personne ne pouvait leur retirer." },
  { type: "sousTitre", texte: "Partie 1 — Compréhension et analyse (10 points)" },
  { type: "liste", items: [
    "1) Dégage l'idée directrice de ce texte. (2 points)",
    "2) Relève le champ lexical de l'école et commente-le. (2 points)",
    "3) Identifie et explique la figure de style contenue dans « leurs cahiers comme des ailes ». (2 points)",
    "4) En quoi ce texte est-il un éloge de l'école ? Appuie ta réponse sur deux éléments du texte. (4 points)"
  ] },
  { type: "sousTitre", texte: "Partie 2 — Production écrite (10 points)" },
  { type: "texte", texte: "Sujet : « L'école n'est pas la seule voie de la réussite, mais elle en reste la plus sûre. » Discute cette affirmation dans un développement argumenté et illustré d'exemples." },
  { type: "consigne", lignes: [
    "Introduction : amener le sujet, poser la problématique, annoncer le plan.",
    "Développement : deux ou trois parties, chacune avec des arguments et des exemples.",
    "Conclusion : bilan et ouverture. Ton neutre et correct attendu."
  ] }
]);

const A_FRANCAIS_CORRIGE = document({
  fichier: "bac-tle-a-francais-corrige",
  titre: "Corrigé — Épreuve types de Français (BAC série A)",
  description: "Corrigé rédigé et barème détaillé : compréhension, figures de style et plan de dissertation.",
  examen: "BAC", serie: "A", matiere: "Français", type: "corrige"
}, [
  { type: "titre", texte: "CORRIGÉ — ÉPREUVE TYPES DE FRANÇAIS (BAC SÉRIE A)" },
  { type: "consigne", lignes: ["Barème détaillé sur 20 points.", "Une réponse juste mais non justifiée vaut la moitié des points."] },
  { type: "sousTitre", texte: "Partie 1 — Compréhension et analyse (10 points)" },
  { type: "texte", texte: "1) Idée directrice (2 pts) : le texte montre l'école comme un lieu de travail modeste mais lumineux, où le savoir constitue une richesse que rien ne peut retirer. On attend une formulation personnelle, appuyée sur le mouvement du texte (de l'aube au soir)." },
  { type: "texte", texte: "2) Champ lexical de l'école (2 pts) : « école », « balayeurs », « élèves », « cahiers », « maître », « craie », « dictée ». Ce lexique concret installe un décor quotidien et familier ; il donne au texte sa dimension réaliste." },
  { type: "texte", texte: "3) Figure de style (2 pts) : comparaison (« comme des ailes »), outil comparatif « comme ». Les cahiers ouverts sont assimilés à des ailes : ils suggèrent l'envol, l'ouverture au monde, l'émancipation par le savoir." },
  { type: "texte", texte: "4) Éloge de l'école (4 pts) : deux éléments attendus, par exemple « on parlait de courage » (l'école valorise l'effort plutôt que la fortune) et « une lumière que personne ne pouvait leur retirer » (le savoir comme bien inaliénable). Toute réponse construite, citant le texte, est acceptée." },
  { type: "sousTitre", texte: "Partie 2 — Production écrite (10 points)" },
  { type: "texte", texte: "Introduction attendue : l'école est souvent présentée comme la seule voie de la réussite ; or des exemples montrent d'autres chemins (artisanat, sport, commerce). Problématique : l'école demeure-t-elle malgré tout la voie la plus sûre ?" },
  { type: "liste", items: [
    "I. L'école n'est pas la seule voie : des réussites existent hors de l'école (artisanat, entreprenariat, sport).",
    "II. Mais l'école reste la plus sûre : elle donne des diplômes reconnus, un socle de compétences et un accès au marché du travail.",
    "III. Synthèse : l'école forme la capacité à apprendre toute sa vie, ce qui rend les autres voies plus accessibles."
  ] },
  { type: "texte", texte: "Conclusion attendue : nuance entre réussite matérielle et réussite personnelle, ouverture sur la formation professionnelle continue." },
  { type: "sousTitre", texte: "Critères de notation" },
  { type: "tableau", entetes: ["Critère", "Attendu", "Points"], lignes: [
    ["Compréhension", "Réponses justes et citées", "10"],
    ["Organisation", "Plan clair, transitions", "4"],
    ["Langue", "Orthographe et syntaxe", "4"],
    ["Exemples", "Références pertinentes", "2"]
  ] }
]);

// ══════════════════════════════════════════════════════════════════
// SÉRIE A — PHILOSOPHIE
// ══════════════════════════════════════════════════════════════════

const A_PHILO_SUJET = document({
  fichier: "bac-tle-a-philosophie-sujet",
  titre: "Épreuve types de Philosophie — BAC série A",
  description: "Dissertation : la liberté consiste-t-elle à faire tout ce que l'on veut ?",
  examen: "BAC", serie: "A", matiere: "Philosophie", type: "sujet"
}, [
  { type: "titre", texte: "BACCALAURÉAT — SÉRIE A — ÉPREUVE TYPES DE PHILOSOPHIE" },
  { type: "consigne", lignes: [
    "Durée : 4 heures — Coefficient : 4",
    "Traiter UN seul sujet au choix. Le plan doit être apparent.",
    "Une copie sans problématique claire ne peut dépasser 8/20."
  ] },
  { type: "sousTitre", texte: "Sujet 1 — Dissertation" },
  { type: "texte", texte: "La liberté consiste-t-elle à faire tout ce que l'on veut ?" },
  { type: "consigne", lignes: [
    "Analyse les termes du sujet : liberté, « tout ce que l'on veut », « consister à ».",
    "Dégage le présupposé : le désir serait la mesure de la liberté.",
    "Propose un plan progressif (thèse, antithèse, synthèse) et illustre chaque partie."
  ] },
  { type: "sousTitre", texte: "Sujet 2 — Commentaire de texte (au choix du candidat)" },
  { type: "texte", texte: "« Nul n'est libre s'il ne commande à soi-même. » Explique et discute cette affirmation à l'aide d'exemples et de références philosophiques." }
]);

const A_PHILO_CORRIGE = document({
  fichier: "bac-tle-a-philosophie-corrige",
  titre: "Corrigé — Épreuve types de Philosophie (BAC série A)",
  description: "Corrigé rédigé : problématique, plan en trois temps, références et conclusion.",
  examen: "BAC", serie: "A", matiere: "Philosophie", type: "corrige"
}, [
  { type: "titre", texte: "CORRIGÉ — ÉPREUVE TYPES DE PHILOSOPHIE (BAC SÉRIE A)" },
  { type: "consigne", lignes: ["Barème sur 20 : problématique 4, développement 10, conclusion 3, langue et références 3."] },
  { type: "sousTitre", texte: "Analyse du sujet" },
  { type: "texte", texte: "Spontanément, être libre c'est n'obéir à aucune contrainte extérieure et suivre ses désirs. Mais le sujet demande si la liberté SE RÉDUIT à cette absence d'obstacle. Or faire tout ce que l'on veut peut conduire à dépendre de ses désirs, donc à perdre la maîtrise de soi." },
  { type: "sousTitre", texte: "Plan détaillé attendu" },
  { type: "liste", items: [
    "I. Oui : la liberté semble d'abord l'absence de contrainte (liberté négative). Exemple : la liberté de circulation ; référence à Hobbes sur la liberté naturelle.",
    "II. Mais non : désirer tout faire, c'est obéir à ses impulsions. Spinoza : « les hommes se croient libres parce qu'ils sont conscients de leurs désirs et ignorants des causes ». L'esclave de ses passions n'est pas libre.",
    "III. Synthèse : la liberté est autonomie, capacité de se donner à soi-même sa loi (Kant), et non simple absence d'obstacle. Être libre, c'est vouloir ce que l'on juge bon, non tout ce qui nous traverse."
  ] },
  { type: "sousTitre", texte: "Conclusion" },
  { type: "texte", texte: "La liberté n'est pas la toute-puissance du désir : elle est la capacité de choisir en connaissance de cause et de répondre de ses actes. Faire tout ce que l'on veut peut être une forme de servitude ; vouloir ce que l'on a compris être juste est une forme de liberté." },
  { type: "sousTitre", texte: "Erreurs fréquentes" },
  { type: "liste", items: [
    "Réciter un cours sur la liberté sans interroger le « tout ce que l'on veut ».",
    "Confondre liberté et absence de loi (anomie).",
    "Multiplier les exemples sans les analyser."
  ] }
]);

// ══════════════════════════════════════════════════════════════════
// SÉRIE B — ÉCONOMIE
// ══════════════════════════════════════════════════════════════════

const B_ECO_SUJET = document({
  fichier: "bac-tle-b-economie-sujet",
  titre: "Épreuve types d'Économie — BAC série B",
  description: "Circuit économique, calcul du PIB et taux de croissance. Barème sur 20.",
  examen: "BAC", serie: "B", matiere: "Économie", type: "sujet"
}, [
  { type: "titre", texte: "BACCALAURÉAT — SÉRIE B — ÉPREUVE TYPES D'ÉCONOMIE" },
  { type: "consigne", lignes: ["Durée : 3 heures — Coefficient : 4", "Calculatrice non programmable autorisée. Les deux exercices sont obligatoires."] },
  { type: "sousTitre", texte: "Exercice 1 (10 points) — Le circuit économique" },
  { type: "liste", items: [
    "a) Définis : ménage, entreprise, marché. (3 points)",
    "b) Distingue flux réel et flux monétaire, puis donne un exemple de chacun. (4 points)",
    "c) Explique le rôle de l'État dans le circuit économique. (3 points)"
  ] },
  { type: "sousTitre", texte: "Exercice 2 (10 points) — Production et croissance" },
  { type: "texte", texte: "Une économie a produit, en 2025 : des biens de consommation pour 120 milliards de FCFA, des biens d'investissement pour 40 milliards et des services pour 60 milliards. Les consommations intermédiaires s'élèvent à 80 milliards. La population est de 2 000 000 d'habitants. En 2024, le PIB était de 125 milliards." },
  { type: "liste", items: [
    "a) Calcule la production totale, puis le PIB de 2025. (4 points)",
    "b) Calcule le PIB par habitant. (2 points)",
    "c) Calcule le taux de croissance du PIB entre 2024 et 2025. (4 points)"
  ] }
]);

const B_ECO_CORRIGE = document({
  fichier: "bac-tle-b-economie-corrige",
  titre: "Corrigé — Épreuve types d'Économie (BAC série B)",
  description: "Corrigé rédigé : définitions, flux, calculs de PIB, PIB/habitant et croissance.",
  examen: "BAC", serie: "B", matiere: "Économie", type: "corrige"
}, [
  { type: "titre", texte: "CORRIGÉ — ÉPREUVE TYPES D'ÉCONOMIE (BAC SÉRIE B)" },
  { type: "sousTitre", texte: "Exercice 1 (10 points)" },
  { type: "texte", texte: "a) Le ménage est une unité économique qui consomme et offre du travail ; l'entreprise produit des biens et services marchands ; le marché est le lieu de rencontre de l'offre et de la demande (3 pts)." },
  { type: "texte", texte: "b) Le flux réel est un mouvement de biens, de services ou de travail ; le flux monétaire est le mouvement d'argent qui l'accompagne. Exemple : le travail fourni par le ménage (réel) est rémunéré par un salaire (monétaire) (4 pts)." },
  { type: "texte", texte: "c) L'État prélève des impôts, produit des services publics, redistribue les revenus et régule l'activité économique ; il s'ajoute aux ménages et aux entreprises comme troisième grand acteur (3 pts)." },
  { type: "sousTitre", texte: "Exercice 2 (10 points)" },
  { type: "texte", texte: "a) Production totale = 120 + 40 + 60 = 220 milliards. PIB = production totale - consommations intermédiaires = 220 - 80 = 140 milliards de FCFA (4 pts)." },
  { type: "texte", texte: "b) PIB par habitant = 140 000 000 000 / 2 000 000 = 70 000 FCFA par habitant (2 pts)." },
  { type: "texte", texte: "c) Taux de croissance = (140 - 125) / 125 x 100 = 15 / 125 x 100 = 12 %. Le PIB a augmenté de 12 % (4 pts)." },
  { type: "sousTitre", texte: "Barème" },
  { type: "tableau", entetes: BAREME_20.entetes, lignes: BAREME_20.lignes }
]);

// ══════════════════════════════════════════════════════════════════
// SÉRIE B — MATHÉMATIQUES
// ══════════════════════════════════════════════════════════════════

const B_MATHS_SUJET = document({
  fichier: "bac-tle-b-mathematiques-sujet",
  titre: "Épreuve types de Mathématiques — BAC série B",
  description: "Statistiques à données regroupées, système d'équations et pourcentages. Barème sur 20.",
  examen: "BAC", serie: "B", matiere: "Mathématiques", type: "sujet"
}, [
  { type: "titre", texte: "BACCALAURÉAT — SÉRIE B — ÉPREUVE TYPES DE MATHÉMATIQUES" },
  { type: "consigne", lignes: ["Durée : 3 heures — Coefficient : 3", "Calculatrice autorisée. Justifier chaque calcul."] },
  { type: "sousTitre", texte: "Exercice 1 (8 points) — Statistiques" },
  { type: "texte", texte: "Les salaires mensuels (en milliers de FCFA) de 40 employés se répartissent ainsi : [60 ; 80[ : 8 employés ; [80 ; 100[ : 12 ; [100 ; 120[ : 14 ; [120 ; 140[ : 6." },
  { type: "liste", items: [
    "a) Donne les effectifs cumulés croissants. (2 points)",
    "b) Calcule le salaire moyen. (3 points)",
    "c) Détermine la classe médiane. (2 points)",
    "d) Quel est le pourcentage d'employés touchant au moins 100 000 FCFA ? (1 point)"
  ] },
  { type: "sousTitre", texte: "Exercice 2 (6 points) — Système d'équations" },
  { type: "texte", texte: "Résous le système : 2x + 3y = 12 et x - y = 1." },
  { type: "sousTitre", texte: "Exercice 3 (6 points) — Pourcentages" },
  { type: "texte", texte: "Un article coûte 25 000 FCFA. Le vendeur accorde une remise de 12 %, puis applique sur le prix remisé une augmentation de 5 %." },
  { type: "liste", items: [
    "a) Calcule le prix après la remise.",
    "b) Calcule le prix final payé par le client.",
    "c) Le prix final est-il supérieur ou inférieur au prix initial ? Justifie."
  ] }
]);

const B_MATHS_CORRIGE = document({
  fichier: "bac-tle-b-mathematiques-corrige",
  titre: "Corrigé — Épreuve types de Mathématiques (BAC série B)",
  description: "Corrigé détaillé : moyenne pondérée, médiane, système et calcul de pourcentages.",
  examen: "BAC", serie: "B", matiere: "Mathématiques", type: "corrige"
}, [
  { type: "titre", texte: "CORRIGÉ — ÉPREUVE TYPES DE MATHÉMATIQUES (BAC SÉRIE B)" },
  { type: "sousTitre", texte: "Exercice 1 (8 points)" },
  { type: "texte", texte: "a) Effectifs cumulés croissants : 8 ; 20 ; 34 ; 40 (2 pts)." },
  { type: "texte", texte: "b) Centres de classes : 70 ; 90 ; 110 ; 130. Somme = 8x70 + 12x90 + 14x110 + 6x130 = 560 + 1 080 + 1 540 + 780 = 3 960. Moyenne = 3 960 / 40 = 99, soit 99 000 FCFA (3 pts)." },
  { type: "texte", texte: "c) N/2 = 20. Les effectifs cumulés atteignent 8 puis 20 puis 34 : la 20e valeur est la dernière de la deuxième classe. La classe médiane est donc [80 ; 100[ (2 pts)." },
  { type: "texte", texte: "d) Effectif d'au moins 100 000 FCFA = 14 + 6 = 20, soit 20/40 = 50 % (1 pt)." },
  { type: "sousTitre", texte: "Exercice 2 (6 points)" },
  { type: "texte", texte: "De x - y = 1 on tire x = y + 1. En remplaçant : 2(y + 1) + 3y = 12, donc 5y + 2 = 12, donc y = 2 et x = 3. Solution : (x ; y) = (3 ; 2). Vérification : 2x3 + 3x2 = 12 et 3 - 2 = 1." },
  { type: "sousTitre", texte: "Exercice 3 (6 points)" },
  { type: "texte", texte: "a) Remise = 25 000 x 12/100 = 3 000, donc prix remisé = 22 000 FCFA (2 pts)." },
  { type: "texte", texte: "b) Augmentation = 22 000 x 5/100 = 1 100, donc prix final = 23 100 FCFA (2 pts)." },
  { type: "texte", texte: "c) 23 100 < 25 000 : le prix final est inférieur au prix initial, car une baisse de 12 % suivie d'une hausse de 5 % ne se compensent pas (coefficient global 0,88 x 1,05 = 0,924) (2 pts)." }
]);

// ══════════════════════════════════════════════════════════════════
// SÉRIE C — MATHÉMATIQUES
// ══════════════════════════════════════════════════════════════════

const C_MATHS_SUJET = document({
  fichier: "bac-tle-c-mathematiques-sujet",
  titre: "Épreuve types de Mathématiques — BAC série C",
  description: "Suite arithmétique, étude de fonction polynôme et probabilités. Barème sur 20.",
  examen: "BAC", serie: "C", matiere: "Mathématiques", type: "sujet"
}, [
  { type: "titre", texte: "BACCALAURÉAT — SÉRIE C — ÉPREUVE TYPES DE MATHÉMATIQUES" },
  { type: "consigne", lignes: ["Durée : 4 heures — Coefficient : 5", "Calculatrice non programmable autorisée. Toute réponse doit être justifiée."] },
  { type: "sousTitre", texte: "Exercice 1 (6 points) — Suite arithmétique" },
  { type: "texte", texte: "Soit la suite (Un) définie pour tout entier n >= 0 par Un = 3 + 4n." },
  { type: "liste", items: [
    "a) Montre que (Un) est arithmétique et donne sa raison.",
    "b) Calcule U10.",
    "c) Calcule la somme S = U0 + U1 + ... + U10."
  ] },
  { type: "sousTitre", texte: "Exercice 2 (8 points) — Étude d'une fonction" },
  { type: "texte", texte: "Soit f définie sur [-2 ; 2] par f(x) = x^3 - 3x + 2." },
  { type: "liste", items: [
    "a) Calcule f'(x) et étudie son signe sur [-2 ; 2].",
    "b) Dresse le tableau de variations de f.",
    "c) Donne les extremums locaux de f."
  ] },
  { type: "sousTitre", texte: "Exercice 3 (6 points) — Probabilités" },
  { type: "texte", texte: "Une urne contient 3 boules rouges et 2 boules vertes, indiscernables au toucher. On tire simultanément deux boules." },
  { type: "liste", items: [
    "a) Combien y a-t-il de tirages possibles ?",
    "b) Calcule la probabilité d'obtenir deux boules rouges.",
    "c) Calcule la probabilité d'obtenir au moins une boule verte."
  ] }
]);

const C_MATHS_CORRIGE = document({
  fichier: "bac-tle-c-mathematiques-corrige",
  titre: "Corrigé — Épreuve types de Mathématiques (BAC série C)",
  description: "Corrigé détaillé : raison de suite, somme des termes, variations et probabilités.",
  examen: "BAC", serie: "C", matiere: "Mathématiques", type: "corrige"
}, [
  { type: "titre", texte: "CORRIGÉ — ÉPREUVE TYPES DE MATHÉMATIQUES (BAC SÉRIE C)" },
  { type: "sousTitre", texte: "Exercice 1 (6 points)" },
  { type: "texte", texte: "a) U(n+1) - Un = 3 + 4(n + 1) - (3 + 4n) = 4. La suite est arithmétique de raison r = 4 (2 pts)." },
  { type: "texte", texte: "b) U10 = 3 + 4 x 10 = 43 (2 pts)." },
  { type: "texte", texte: "c) Il y a 11 termes. S = 11 x (U0 + U10) / 2 = 11 x (3 + 43) / 2 = 11 x 23 = 253 (2 pts)." },
  { type: "sousTitre", texte: "Exercice 2 (8 points)" },
  { type: "texte", texte: "a) f'(x) = 3x^2 - 3 = 3(x - 1)(x + 1). Sur [-2 ; 2], f'(x) s'annule en -1 et 1 ; f'(x) > 0 sur [-2 ; -1[ et ]1 ; 2], f'(x) < 0 sur ]-1 ; 1[ (3 pts)." },
  { type: "texte", texte: "b) f est croissante sur [-2 ; -1], décroissante sur [-1 ; 1], croissante sur [1 ; 2]. Tableau : f(-2) = 0 ; f(-1) = 4 ; f(1) = 0 ; f(2) = 4 (3 pts)." },
  { type: "texte", texte: "c) Maximum local f(-1) = 4 ; minimum local f(1) = 0 (2 pts)." },
  { type: "sousTitre", texte: "Exercice 3 (6 points)" },
  { type: "texte", texte: "a) Nombre de tirages : C(5,2) = 10 (2 pts)." },
  { type: "texte", texte: "b) P(deux rouges) = C(3,2)/C(5,2) = 3/10 = 0,3 (2 pts)." },
  { type: "texte", texte: "c) P(au moins une verte) = 1 - P(aucune verte) = 1 - 3/10 = 7/10 = 0,7 (2 pts)." }
]);

// ══════════════════════════════════════════════════════════════════
// SÉRIE C — PHYSIQUE-CHIMIE
// ══════════════════════════════════════════════════════════════════

const C_PCT_SUJET = document({
  fichier: "bac-tle-c-physique-chimie-sujet",
  titre: "Épreuve types de Physique-Chimie — BAC série C",
  description: "Dosage acide-base, mouvement uniformément varié et énergie mécanique. Barème sur 20.",
  examen: "BAC", serie: "C", matiere: "Physique-Chimie", type: "sujet"
}, [
  { type: "titre", texte: "BACCALAURÉAT — SÉRIE C — ÉPREUVE TYPES DE PHYSIQUE-CHIMIE" },
  { type: "consigne", lignes: ["Durée : 3 heures — Coefficient : 4", "On prendra g = 10 N/kg. Les deux parties sont obligatoires."] },
  { type: "sousTitre", texte: "Partie A — Chimie (8 points)" },
  { type: "texte", texte: "On dose un volume VA = 20,0 mL d'une solution d'acide chlorhydrique (H3O+ + Cl-) par une solution d'hydroxyde de sodium de concentration CB = 0,10 mol/L. L'équivalence est obtenue pour VBE = 15,0 mL." },
  { type: "liste", items: [
    "a) Écris l'équation de la réaction de dosage. (2 points)",
    "b) Calcule la concentration CA de la solution acide. (4 points)",
    "c) Quelle est la valeur du pH à l'équivalence ? Justifie. (2 points)"
  ] },
  { type: "sousTitre", texte: "Partie B — Physique (12 points)" },
  { type: "texte", texte: "Un mobile part du repos (v0 = 0) et se déplace en ligne droite avec une accélération constante a = 2 m/s2 pendant 5 s." },
  { type: "liste", items: [
    "a) Calcule la vitesse atteinte à la fin de la 5e seconde. (3 points)",
    "b) Calcule la distance parcourue pendant ces 5 s. (3 points)",
    "c) Un corps de masse 2 kg est lâché sans vitesse d'une hauteur h = 5 m. Calcule son énergie potentielle initiale, puis sa vitesse au sol. (6 points)"
  ] }
]);

const C_PCT_CORRIGE = document({
  fichier: "bac-tle-c-physique-chimie-corrige",
  titre: "Corrigé — Épreuve types de Physique-Chimie (BAC série C)",
  description: "Corrigé rédigé : équation de dosage, concentration, cinématique et énergie.",
  examen: "BAC", serie: "C", matiere: "Physique-Chimie", type: "corrige"
}, [
  { type: "titre", texte: "CORRIGÉ — ÉPREUVE TYPES DE PHYSIQUE-CHIMIE (BAC SÉRIE C)" },
  { type: "sousTitre", texte: "Partie A — Chimie (8 points)" },
  { type: "texte", texte: "a) H3O+ + Cl- + Na+ + HO- donne 2 H2O + Na+ + Cl-. L'équation simplifiée est H3O+ + HO- donne 2 H2O (2 pts)." },
  { type: "texte", texte: "b) À l'équivalence : CA x VA = CB x VBE, donc CA = CB x VBE / VA = 0,10 x 15,0 / 20,0 = 0,075 mol/L (4 pts)." },
  { type: "texte", texte: "c) À l'équivalence, il ne reste que des ions Na+ et Cl- (spectateurs) : la solution est neutre, pH = 7 à 25 °C (2 pts)." },
  { type: "sousTitre", texte: "Partie B — Physique (12 points)" },
  { type: "texte", texte: "a) v = a x t = 2 x 5 = 10 m/s (3 pts)." },
  { type: "texte", texte: "b) d = 0,5 x a x t^2 = 0,5 x 2 x 25 = 25 m (3 pts)." },
  { type: "texte", texte: "c) Ep = m x g x h = 2 x 10 x 5 = 100 J (3 pts). Conservation de l'énergie : 0,5 x m x v^2 = m x g x h, donc v = racine(2 x 10 x 5) = 10 m/s (3 pts)." },
  { type: "sousTitre", texte: "Erreurs fréquentes" },
  { type: "liste", items: [
    "Oublier de convertir les volumes en litres dans le calcul de concentration.",
    "Utiliser v = d/t (vitesse moyenne) alors que la vitesse est variable.",
    "Confondre énergie potentielle et énergie cinétique."
  ] }
]);

// ══════════════════════════════════════════════════════════════════
// SÉRIE D — SVT
// ══════════════════════════════════════════════════════════════════

const D_SVT_SUJET = document({
  fichier: "bac-tle-d-svt-sujet",
  titre: "Épreuve types de SVT — BAC série D",
  description: "Dihybridisme chez la drosophile et réponse immunitaire. Barème sur 20.",
  examen: "BAC", serie: "D", matiere: "SVT", type: "sujet"
}, [
  { type: "titre", texte: "BACCALAURÉAT — SÉRIE D — ÉPREUVE TYPES DE SCIENCES DE LA VIE ET DE LA TERRE" },
  { type: "consigne", lignes: ["Durée : 3 heures — Coefficient : 4", "Les deux exercices sont obligatoires."] },
  { type: "sousTitre", texte: "Exercice 1 (12 points) — Génétique" },
  { type: "texte", texte: "On croise des drosophiles homozygotes à corps gris et ailes longues avec des drosophiles homozygotes à corps noir et ailes vestigiales. Les gènes sont indépendants. On note G (corps gris, dominant), g (corps noir), L (ailes longues, dominant) et l (ailes vestigiales)." },
  { type: "liste", items: [
    "a) Donne les génotypes des parents. (2 points)",
    "b) Détermine le génotype et le phénotype de la F1. (3 points)",
    "c) Fais l'échiquier de croisement F1 x F1 et donne les proportions phénotypiques attendues. (5 points)",
    "d) Ces proportions confirment-elles l'indépendance des gènes ? Justifie. (2 points)"
  ] },
  { type: "sousTitre", texte: "Exercice 2 (8 points) — Immunologie" },
  { type: "liste", items: [
    "a) Compare la réponse immunitaire humorale et la réponse cellulaire (acteurs, mécanisme, effet). (5 points)",
    "b) Explique le rôle des lymphocytes T4 dans la coordination de la réponse immunitaire. (3 points)"
  ] }
]);

const D_SVT_CORRIGE = document({
  fichier: "bac-tle-d-svt-corrige",
  titre: "Corrigé — Épreuve types de SVT (BAC série D)",
  description: "Corrigé rédigé : génotypes, échiquier de croisement, proportions 9:3:3:1 et immunologie.",
  examen: "BAC", serie: "D", matiere: "SVT", type: "corrige"
}, [
  { type: "titre", texte: "CORRIGÉ — ÉPREUVE TYPES DE SVT (BAC SÉRIE D)" },
  { type: "sousTitre", texte: "Exercice 1 (12 points)" },
  { type: "texte", texte: "a) Parents homozygotes : GGLL (corps gris, ailes longues) et ggll (corps noir, ailes vestigiales) (2 pts)." },
  { type: "texte", texte: "b) La F1 reçoit GL de l'un et gl de l'autre : génotype GgLl, phénotype corps gris et ailes longues (double dominance) (3 pts)." },
  { type: "texte", texte: "c) La F1 produit quatre types de gamètes équiprobables : GL, Gl, gL, gl. L'échiquier 4 x 4 donne 16 combinaisons. Proportions attendues : 9 corps gris / ailes longues, 3 corps gris / ailes vestigiales, 3 corps noirs / ailes longues, 1 corps noir / ailes vestigiales (5 pts)." },
  { type: "texte", texte: "d) Oui : les proportions 9:3:3:1 correspondent à une ségrégation indépendante des deux gènes, avec des gamètes recombinés en proportions égales (2 pts)." },
  { type: "sousTitre", texte: "Exercice 2 (8 points)" },
  { type: "texte", texte: "a) Réponse humorale : lymphocytes B activés, différenciation en plasmocytes, production d'anticorps spécifiques qui neutralisent l'antigène extracellulaire. Réponse cellulaire : lymphocytes T8 cytotoxiques qui détruisent les cellules infectées (antigène intracellulaire). Les deux réponses sont spécifiques et laissent une mémoire immunitaire (5 pts)." },
  { type: "texte", texte: "b) Les lymphocytes T4 sécrètent des interleukines qui activent les lymphocytes B et les lymphocytes T8 : sans eux, la réponse immunitaire est très affaiblie (3 pts)." }
]);

// ══════════════════════════════════════════════════════════════════
// SÉRIE D — MATHÉMATIQUES
// ══════════════════════════════════════════════════════════════════

const D_MATHS_SUJET = document({
  fichier: "bac-tle-d-mathematiques-sujet",
  titre: "Épreuve types de Mathématiques — BAC série D",
  description: "Équation avec logarithmes, étude de fonction et probabilités discrètes. Barème sur 20.",
  examen: "BAC", serie: "D", matiere: "Mathématiques", type: "sujet"
}, [
  { type: "titre", texte: "BACCALAURÉAT — SÉRIE D — ÉPREUVE TYPES DE MATHÉMATIQUES" },
  { type: "consigne", lignes: ["Durée : 3 heures — Coefficient : 4", "Justifier chaque étape des calculs."] },
  { type: "sousTitre", texte: "Exercice 1 (5 points) — Équation logarithmique" },
  { type: "texte", texte: "Résous dans ]0 ; +infini[ l'équation ln(x) + ln(x - 3) = ln(4)." },
  { type: "sousTitre", texte: "Exercice 2 (10 points) — Étude de fonction" },
  { type: "texte", texte: "Soit f définie sur ]0 ; +infini[ par f(x) = x - 2 ln(x)." },
  { type: "liste", items: [
    "a) Calcule f'(x) et étudie son signe.",
    "b) Dresse le tableau de variations de f.",
    "c) Calcule f(2) et donne le minimum de f."
  ] },
  { type: "sousTitre", texte: "Exercice 3 (5 points) — Probabilités" },
  { type: "texte", texte: "On lance trois fois une pièce de monnaie équilibrée." },
  { type: "liste", items: [
    "a) Combien d'issues y a-t-il ?",
    "b) Calcule la probabilité d'obtenir exactement deux faces."
  ] }
]);

const D_MATHS_CORRIGE = document({
  fichier: "bac-tle-d-mathematiques-corrige",
  titre: "Corrigé — Épreuve types de Mathématiques (BAC série D)",
  description: "Corrigé détaillé : résolution logarithmique, variations et dénombrement.",
  examen: "BAC", serie: "D", matiere: "Mathématiques", type: "corrige"
}, [
  { type: "titre", texte: "CORRIGÉ — ÉPREUVE TYPES DE MATHÉMATIQUES (BAC SÉRIE D)" },
  { type: "sousTitre", texte: "Exercice 1 (5 points)" },
  { type: "texte", texte: "Domaine : x > 0 et x - 3 > 0, donc x > 3. ln(x) + ln(x - 3) = ln(4) donne ln(x(x - 3)) = ln(4), donc x(x - 3) = 4, soit x^2 - 3x - 4 = 0. Les racines sont -1 et 4. Seule x = 4 convient (x > 3). Solution : S = {4}." },
  { type: "sousTitre", texte: "Exercice 2 (10 points)" },
  { type: "texte", texte: "a) f'(x) = 1 - 2/x = (x - 2)/x. Sur ]0 ; +infini[, x > 0 : f'(x) est du signe de (x - 2). Négative sur ]0 ; 2[, nulle en 2, positive sur ]2 ; +infini[ (4 pts)." },
  { type: "texte", texte: "b) f est décroissante sur ]0 ; 2] et croissante sur [2 ; +infini[ (3 pts)." },
  { type: "texte", texte: "c) f(2) = 2 - 2 ln(2) = 2 - 1,386 = 0,614 environ. Le minimum de f vaut 2 - 2 ln(2) (3 pts)." },
  { type: "sousTitre", texte: "Exercice 3 (5 points)" },
  { type: "texte", texte: "a) Chaque lancer a 2 issues ; sur 3 lancers indépendants : 2^3 = 8 issues équiprobables (2 pts)." },
  { type: "texte", texte: "b) Exactement deux faces : P, P, F ; P, F, P ; F, P, P, soit 3 cas. P = 3/8 = 0,375 (3 pts)." }
]);

// ══════════════════════════════════════════════════════════════════
// SÉRIE G — COMPTABILITÉ
// ══════════════════════════════════════════════════════════════════

const G_COMPTA_SUJET = document({
  fichier: "bac-tle-g-comptabilite-sujet",
  titre: "Épreuve types de Comptabilité — BAC série G",
  description: "Écritures au journal, règlement fournisseur et détermination du résultat. Barème sur 20.",
  examen: "BAC", serie: "G", matiere: "Comptabilité", type: "sujet"
}, [
  { type: "titre", texte: "BACCALAURÉAT — SÉRIE G — ÉPREUVE TYPES DE COMPTABILITÉ" },
  { type: "consigne", lignes: ["Durée : 3 heures — Coefficient : 4", "Présenter les écritures dans un tableau conforme au plan comptable."] },
  { type: "sousTitre", texte: "Exercice 1 (12 points) — Écritures au journal" },
  { type: "texte", texte: "L'entreprise KOKOU réalise, en janvier 2026, les opérations suivantes (montants en FCFA, TVA 18 %) :" },
  { type: "liste", items: [
    "1) Achat de marchandises à crédit : 500 000 HT.",
    "2) Vente de marchandises à crédit : 800 000 HT.",
    "3) Règlement du fournisseur par banque : 300 000.",
    "4) Versement d'espèces en banque : 100 000."
  ] },
  { type: "liste", items: [
    "a) Enregistre ces quatre opérations au journal. (8 points)",
    "b) Indique pour chaque écriture le débit et le crédit. (4 points)"
  ] },
  { type: "sousTitre", texte: "Exercice 2 (8 points) — Résultat de l'exercice" },
  { type: "texte", texte: "Les produits de l'exercice s'élèvent à 900 000 FCFA et les charges à 650 000 FCFA." },
  { type: "liste", items: [
    "a) Calcule le résultat de l'exercice.",
    "b) S'agit-il d'un bénéfice ou d'une perte ?",
    "c) Indique au moins trois postes de charges courantes et deux postes de produits."
  ] }
]);

const G_COMPTA_CORRIGE = document({
  fichier: "bac-tle-g-comptabilite-corrige",
  titre: "Corrigé — Épreuve types de Comptabilité (BAC série G)",
  description: "Corrigé rédigé : journal, TVA, résultat et analyse des charges et produits.",
  examen: "BAC", serie: "G", matiere: "Comptabilité", type: "corrige"
}, [
  { type: "titre", texte: "CORRIGÉ — ÉPREUVE TYPES DE COMPTABILITÉ (BAC SÉRIE G)" },
  { type: "sousTitre", texte: "Exercice 1 (12 points)" },
  { type: "texte", texte: "1) Achat de marchandises à crédit : 500 000 HT, TVA 90 000, total 590 000. Débit 601 Achats de marchandises 500 000 ; débit 4456 TVA déductible 90 000 ; crédit 401 Fournisseurs 590 000 (4 pts)." },
  { type: "texte", texte: "2) Vente à crédit : 800 000 HT, TVA 144 000, total 944 000. Débit 411 Clients 944 000 ; crédit 701 Ventes de marchandises 800 000 ; crédit 4437 TVA collectée 144 000 (2 pts)." },
  { type: "texte", texte: "3) Règlement au fournisseur par banque : débit 401 Fournisseurs 300 000 ; crédit 521 Banque 300 000 (1 pt)." },
  { type: "texte", texte: "4) Versement d'espèces en banque : débit 521 Banque 100 000 ; crédit 571 Caisse 100 000 (1 pt)." },
  { type: "texte", texte: "b) Chaque écriture respecte l'équilibre : total des débits = total des crédits. Totaux : 1 090 000 au débit contre 1 090 000 au crédit sur l'ensemble des opérations (4 pts)." },
  { type: "sousTitre", texte: "Exercice 2 (8 points)" },
  { type: "texte", texte: "a) Résultat = produits - charges = 900 000 - 650 000 = 250 000 FCFA (3 pts)." },
  { type: "texte", texte: "b) Les produits dépassent les charges : c'est un bénéfice de 250 000 FCFA (2 pts)." },
  { type: "texte", texte: "c) Charges courantes : achats de marchandises, salaires et charges sociales, loyers, électricité, transport. Produits : ventes de marchandises, prestations de services, produits financiers (3 pts)." }
]);

// ══════════════════════════════════════════════════════════════════
// SÉRIE G — ÉCONOMIE
// ══════════════════════════════════════════════════════════════════

const G_ECO_SUJET = document({
  fichier: "bac-tle-g-economie-sujet",
  titre: "Épreuve types d'Économie — BAC série G",
  description: "Charges, marge sur coût variable et seuil de rentabilité. Barème sur 20.",
  examen: "BAC", serie: "G", matiere: "Économie", type: "sujet"
}, [
  { type: "titre", texte: "BACCALAURÉAT — SÉRIE G — ÉPREUVE TYPES D'ÉCONOMIE" },
  { type: "consigne", lignes: ["Durée : 3 heures — Coefficient : 4", "Calculatrice autorisée. Les calculs doivent apparaître."] },
  { type: "sousTitre", texte: "Exercice 1 (8 points) — Notions de coûts" },
  { type: "liste", items: [
    "a) Distingue charges fixes et charges variables, avec deux exemples chacun. (4 points)",
    "b) Définis la marge sur coût variable et donne sa formule. (2 points)",
    "c) Explique l'intérêt du seuil de rentabilité pour un commerçant. (2 points)"
  ] },
  { type: "sousTitre", texte: "Exercice 2 (12 points) — Seuil de rentabilité" },
  { type: "texte", texte: "Une entreprise réalise un chiffre d'affaires de 12 000 000 FCFA. Ses charges variables s'élèvent à 7 200 000 FCFA et ses charges fixes à 3 000 000 FCFA." },
  { type: "liste", items: [
    "a) Calcule la marge sur coût variable, puis le taux de marge. (4 points)",
    "b) Calcule le seuil de rentabilité. (4 points)",
    "c) Calcule le résultat de l'exercice. (4 points)"
  ] }
]);

const G_ECO_CORRIGE = document({
  fichier: "bac-tle-g-economie-corrige",
  titre: "Corrigé — Épreuve types d'Économie (BAC série G)",
  description: "Corrigé détaillé : coûts, marge sur coût variable, seuil de rentabilité et résultat.",
  examen: "BAC", serie: "G", matiere: "Économie", type: "corrige"
}, [
  { type: "titre", texte: "CORRIGÉ — ÉPREUVE TYPES D'ÉCONOMIE (BAC SÉRIE G)" },
  { type: "sousTitre", texte: "Exercice 1 (8 points)" },
  { type: "texte", texte: "a) Les charges fixes ne dépendent pas du volume d'activité (loyer, salaires permanents) ; les charges variables évoluent avec l'activité (matières premières, transport des marchandises vendues) (4 pts)." },
  { type: "texte", texte: "b) Marge sur coût variable = chiffre d'affaires - charges variables. Taux de marge = marge / chiffre d'affaires (2 pts)." },
  { type: "texte", texte: "c) Le seuil de rentabilité indique le chiffre d'affaires à partir duquel l'entreprise commence à gagner de l'argent ; il aide à fixer les objectifs de vente et à décider d'un investissement (2 pts)." },
  { type: "sousTitre", texte: "Exercice 2 (12 points)" },
  { type: "texte", texte: "a) Marge sur coût variable = 12 000 000 - 7 200 000 = 4 800 000 FCFA. Taux de marge = 4 800 000 / 12 000 000 = 0,40, soit 40 % (4 pts)." },
  { type: "texte", texte: "b) Seuil de rentabilité = charges fixes / taux de marge = 3 000 000 / 0,40 = 7 500 000 FCFA (4 pts)." },
  { type: "texte", texte: "c) Résultat = marge sur coût variable - charges fixes = 4 800 000 - 3 000 000 = 1 800 000 FCFA (4 pts)." }
]);

module.exports = {
  DOCUMENTS: [
    A_FRANCAIS_SUJET, A_FRANCAIS_CORRIGE,
    A_PHILO_SUJET, A_PHILO_CORRIGE,
    B_ECO_SUJET, B_ECO_CORRIGE,
    B_MATHS_SUJET, B_MATHS_CORRIGE,
    C_MATHS_SUJET, C_MATHS_CORRIGE,
    C_PCT_SUJET, C_PCT_CORRIGE,
    D_SVT_SUJET, D_SVT_CORRIGE,
    D_MATHS_SUJET, D_MATHS_CORRIGE,
    G_COMPTA_SUJET, G_COMPTA_CORRIGE,
    G_ECO_SUJET, G_ECO_CORRIGE
  ]
};
