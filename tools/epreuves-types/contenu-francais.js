/**
 * Épreuves types Revisy — Français (BEPC 3e).
 * Texte et sujet originaux, écrits en interne.
 */

const TEXTE = "Le samedi matin, Aïcha se rend au marché de Dantokpa avec sa mère. Avant d'entrer, elles passent chez une vendeuse de pain pour acheter deux baguettes : la baguette du matin est la plus tendre, dit la mère, et elle ne durcit pas avant midi. Sur le chemin, la radio diffuse les résultats du concours de l'Office national des examens. Aïcha écoute distraitement, mais sa mère, ancienne institutrice, lui explique que l'école reste « la seule chose qui ne coûte pas cher à un enfant ». Au marché, Aïcha observe les étals : les basins de tomatoes, les pagnes brodés, les pileuses à maïs. Elle connaît bien ce lieu, et yet elle y découvre les prix des nouveaux produits de saison. En rentrant, elle remarque que sa mère a negué le prix d'un sac de riz, et elle se demande, pour la première fois, ce que signifie « négocier ». Le soir, elle ouvre son livre et copie mot pour mot la leçon, en pensant à ce petit commerce de rue qui fait vivre des centaines de familles.";

const SUJET = {
  id: 'bepc-3e-francais-sujet',
  fichier: 'bepc-3e-francais-sujet',
  titre: 'Épreuve types de Français — BEPC 3e',
  description: 'Sujet d\'entraînement : résumé, questions de compréhension, communication écrite et orthographe.',
  examen: 'BEPC', niveau: 'brevet', classe: '3e', serie: null, annee: 2026,
  matiere: 'Français', type: 'sujet',
  sourceNom: 'Revisy — épreuve type rédigée en interne',
  sourceUrl: 'https://revisy.onrender.com',
  licence: 'Document original Revisy — libre de reproduction et de rediffusion',
  blocs: [
    { type: 'titre', texte: "BREVET D'ÉTUDES DU PREMIER CYCLE — SESSION DE RÉVISION" },
    { type: 'consigne', lignes: [
      'ÉPREUVE DE FRANÇAIS',
      'Durée : 1 heure — Coefficient : 4',
      'Partie A : 5 points — Partie B : 7 points — Partie C : 4 points'
    ] },
    { type: 'sousTitre', texte: 'Partie A (5 points) — Résumé du texte' },
    { type: 'texte', texte: "Résume le texte ci-dessous en 60 mots maximum, en respectant l'ordre du texte et sans commenter." },
    { type: 'texte', texte: TEXTE },
    { type: 'sousTitre', texte: 'Partie B (7 points) — Questions de compréhension' },
    { type: 'liste', items: [
      "a) Qui accompagne Aïcha au marché ? Quelle relation les unit ?",
      "b) Cite deux reasons qui expliquent l'achat de la baguette le matin.",
      "c) Que réplique la mère à propos de l'école ?",
      "d) À la fin du texte, qu'est-ce qui inquiète Aïcha ?",
      "e) Explique le titre possible de ce texte en une phrase."
    ] },
    { type: 'sousTitre', texte: 'Partie C (7 points) — Communication écrite' },
    { type: 'texte', texte: "Tu habites dans une commune où la bibliothèque est fermée et où les jeunes n'ont pas de lieu pour réviser. Tu écris au maire de ta commune pour lui demander l'ouverture d'une salle de révision, dans une école, le soir. Rédige ta lettre (10 à 15 lignes) : tu présentes la situation, tu expliques pourquoi elle gêne les élèves, tu proposes une solution précise, tu formules une demande claire. Termine par une formule de politesse." },
    { type: 'sousTitre', texte: 'Partie D (4 points) — Orthographe et syntaxe' },
    { type: 'liste', items: [
      "a) Recopie le passage « la baguette du matin est la plus tendre » et souligne le complément du nom « baguette ».",
      "b) Mets au pluriel : « un élève, une classe, le travail ».",
      "c) Conjugue au futur simple : « nous » → « écrire » : nous écrirons.",
      "d) Conjugue au passé composé : « elle ne durcit pas avant midi »."
    ] }
  ]
};

const CORRIGE = {
  id: 'bepc-3e-francais-corrige',
  fichier: 'bepc-3e-francais-corrige',
  titre: 'Corrigé — Épreuve types de Français (BEPC 3e)',
  description: 'Corrigé rédigé : résumé attendu, réponses de compréhension, plan de la lettre, règles d\'orthographe.',
  examen: 'BEPC', niveau: 'brevet', classe: '3e', serie: null, annee: 2026,
  matiere: 'Français', type: 'corrige',
  sourceNom: 'Revisy — corrigé d\'épreuve type rédigé en interne',
  sourceUrl: 'https://revisy.onrender.com',
  licence: 'Document original Revisy — libre de reproduction et de rediffusion',
  blocs: [
    { type: 'titre', texte: 'CORRIGÉ — ÉPREUVE TYPES DE FRANÇAIS (BEPC 3e)' },
    { type: 'consigne', lignes: ['Barème sur 16 points.', 'Les réponses modèles ne sont pas uniques : le barème récompense le contenu, pas la formulation.'] },
    { type: 'sousTitre', texte: 'Partie A — Résumé (5 points)' },
    { type: 'texte', texte: "Résumé attendu (50 à 60 mots) : « Le samedi, Aïcha va au marché de Dantokpa avec sa mère. Elles achètent du pain et écoutent les résultats du concours. Sa mère, ancienne institutrice, lui parle du prix de l'école. Aïcha observe les étals et la négociation d'un sac de riz. Le soir, elle révise en pensant à ces petits commerces qui font vivre les familles. »" },
    { type: 'liste', items: [
      "Barème : respect de l'ordre du texte (1 pt) — présence des éléments essentiels (2 pts) — reformulation sans copier le texte (1 pt) — 60 mots maximum respecté (1 pt)."
    ] },
    { type: 'sousTitre', texte: 'Partie B — Compréhension (7 points)' },
    { type: 'liste', items: [
      "a) Sa mère ; c'est sa fille (1 pt).",
      "b) La baguette du matin est la plus tendre et elle ne durcit pas avant midi (2 pts).",
      "c) Que l'école est la seule chose qui ne coûte pas cher à un enfant (1 pt).",
      "d) Le fait que sa mère négocie le prix du riz : Aïcha découvre ce que signifie négocier (1 pt).",
      "e) Titre possible : « Le marché du samedi » ou « Une leçon de vie au marché » (2 pts, une phrase complète).",
      "Rappel : la question d) réclame une justification, pas un mot isolé."
    ] },
    { type: 'sousTitre', texte: 'Partie C — Communication écrite (7 points)' },
    { type: 'texte', texte: "Plan attendu : 1) la situation (bibliothèque fermée, absence de lieu de révision) ; 2) la gêne concrète pour les élèves (transports, manque de place, travail en groupe impossible) ; 3) une solution précise (une salle d'école mise à disposition le soir de 18 h à 21 h, avec un enseignant ou un surveillant) ; 4) la demande claire et une formule de politesse (Je vous prie d'agréer, Monsieur le Maire, l'expression de mes salutations distinguées)." },
    { type: 'liste', items: [
      'Situation présentée : 1 pt — argument développé : 2 pts — solution précise et réaliste : 2 pts — demande claire et politesse : 2 pts.',
      'Erreurs fréquentes : la lettre sans objet ni formule finale, les solutions vagues (« il faut faire quelque chose »), le tutoiement du maire.'
    ] },
    { type: 'sousTitre', texte: 'Partie D — Orthographe et syntaxe (4 points)' },
    { type: 'liste', items: [
      "a) « la baguette » : le complément du nom est « du matin » ; il s'accorde en genre et en nombre avec le nom qu'il complète (1 pt).",
      "b) des élèves ; des classes ; les travaux (1 pt).",
      "c) nous écrirons (1 pt).",
      "d) « elle n'a pas durci avant midi » : au passé composé, un participe passé employé avec l'auxiliaire avoir ne s'accorde pas avec le sujet, car ici le verbe est d'état (1 pt)."
    ] }
  ]
};

module.exports = { DOCUMENTS: [SUJET, CORRIGE] };
