/**
 * Épreuves types Revizy — Allemand (BEPC 3e).
 * Textes et sujets originaux, écrits en interne (niveau A1/A2).
 */

const TEXTE_DE = "Ich heiße Yovo und ich bin vierzehn Jahre alt. Ich wohne in Abomey mit meiner Mutter und meinem kleinen Bruder. Jeden Morgen stehe ich um fünf Uhr auf, frühstücke und gehe zu Fuß zur Schule. Der Weg dauert ungefähr zwanzig Minuten. In der Schule gefallen mir Mathematik und Geographie. Deutsch ist für mich schwieriger, weil ich zu Hause Französisch spreche. Am Samstag helfe ich meiner Mutter auf dem Markt; sie verkauft Tomaten und Ananas, und ich lerne die Preise. Nachmittags spiele ich Fußball mit meinen Freunden. Mein Traum ist, Ingenieur zu werden und einmal nach Deutschland reisen.";

const SUJET = {
  id: 'bepc-3e-allemand-sujet',
  fichier: 'bepc-3e-allemand-sujet',
  titre: 'Épreuve types d\'Allemand — BEPC 3e',
  description: 'Sujet d\'entraînement : compréhension de l\'écrit, expression écrite, grammaire et vocabulaire.',
  examen: 'BEPC', niveau: 'brevet', classe: '3e', serie: null, annee: 2026,
  matiere: 'Allemand', type: 'sujet',
  sourceNom: 'Revizy — épreuve type rédigée en interne',
  sourceUrl: 'https://revisy.onrender.com',
  licence: 'Document original Revizy — libre de reproduction et de rediffusion',
  blocs: [
    { type: 'titre', texte: 'BREVET D\'ÉTUDES DU PREMIER CYCLE — SESSION DE RÉVISION' },
    { type: 'consigne', lignes: [
      'ÉPREUVE D\'ALLEMAND',
      'Durée : 1 heure — Coefficient : 4',
      'Partie A : 5 points — Partie B : 6 points — Partie C : 5 points'
    ] },
    { type: 'sousTitre', texte: 'Partie A (5 points) — Compréhension de l\'écrit' },
    { type: 'texte', texte: "Lies den Text und antworte auf Französisch." },
    { type: 'texte', texte: TEXTE_DE },
    { type: 'liste', items: [
      "a) Wie heißt der Junge und wo wohnt er? (1 point)",
      "b) Wann steht er auf und wie lange dauert sein Weg zur Schule? (1 point)",
      "c) Welche Fächer mag er? Welches Fach ist für ihn schwierig und warum? (1 point)",
      "d) Was macht er am Samstagvormittag und was lernt er dabei? (1 point)",
      "e) Was ist sein Traum? (1 point)"
    ] },
    { type: 'sousTitre', texte: 'Partie B (6 points) — Expression écrite' },
    { type: 'texte', texte: "Schreibe einen Text von 8 bis 10 Zeilen auf Deutsch, um dich einem Kameraden aus einem anderen Land vorzustellen: deine persönlichen Daten, deine Klasse, dein Schulalltag und deine Pläne für die Zukunft. Benutze das Präsens und mindestens fünf der gelernten Verben. Kopiere den Text aus Teil A nicht." },
    { type: 'sousTitre', texte: 'Partie C (5 points) — Grammaire et vocabulaire' },
    { type: 'liste', items: [
      "a) Complète avec la forme correcte : Ich (sein / haben) vierzehn Jahre alt. Meine Mutter (sein / haben) Lehrerin.",
      "b) Conjugue au présent : ich (gehen) jeden Tag zu Fuß ; wir (lernen) Deutsch ; sie (spielen) Fußball.",
      "c) Mets l'article défini : (der / die) Schule ; (der / die) Lehrer ; (der / die) Bruder.",
      "d) Traduis en allemand : l'école ; la bibliothèque ; le marché ; la sœur.",
      "e) Complète : Woher (kommen / sein) deine Eltern? — Sie (kommen / sein) aus Benin."
    ] }
  ]
};

const CORRIGE = {
  id: 'bepc-3e-allemand-corrige',
  fichier: 'bepc-3e-allemand-corrige',
  titre: 'Corrigé — Épreuve types d\'Allemand (BEPC 3e)',
  description: 'Corrigé rédigé : réponses de compréhension, modèle de texte, grammaire et vocabulaire.',
  examen: 'BEPC', niveau: 'brevet', classe: '3e', serie: null, annee: 2026,
  matiere: 'Allemand', type: 'corrige',
  sourceNom: 'Revizy — corrigé d\'épreuve type rédigé en interne',
  sourceUrl: 'https://revisy.onrender.com',
  licence: 'Document original Revizy — libre de reproduction et de rediffusion',
  blocs: [
    { type: 'titre', texte: 'CORRIGÉ — ÉPREUVE TYPES D\'ALLEMAND (BEPC 3e)' },
    { type: 'consigne', lignes: ['Barème sur 16 points.', 'Plusieurs formulations sont acceptables : le barème juge le contenu.'] },
    { type: 'sousTitre', texte: 'Partie A — Compréhension (5 points)' },
    { type: 'liste', items: [
      "a) Er heißt Yovo und wohnt in Abomey, mit seiner Mutter und seinem kleinen Bruder (1 point).",
      "b) Er steht um fünf Uhr auf; der Weg zur Schule dauert ungefähr zwanzig Minuten (1 point).",
      "c) Mathematik und Geographie gefallen ihm; Deutsch ist schwieriger, weil er zu Hause Französisch spricht (1 point).",
      "d) Er hilft seiner Mutter auf dem Markt und lernt dort die Preise (1 point).",
      "e) Er will Ingenieur werden und einmal nach Deutschland reisen (1 point)."
    ] },
    { type: 'sousTitre', texte: 'Partie B — Expression écrite (6 points)' },
    { type: 'texte', texte: "Modell (nicht wörtlich verlangt) : « Ich heiße Yovo und ich bin vierzehn Jahre alt. Ich komme aus Benin und wohne in Abomey. Jetzt bin ich in der Klasse 3e, in der Realschule. In der Schule gefallen mir Mathematik und Geographie. Am Montag habe ich Deutsch und am Mittwoch Geschichte. Der Samstag ist mein freier Tag: dann helfe ich meiner Mutter auf dem Markt. In Zukunft möchte ich Ingenieur werden, weil ich Technik liebe. Ich möchte auch einmal nach Deutschland reisen und eine neue Sprache lernen. »" },
    { type: 'liste', items: [
      'Persönliche Daten vollständig (2 pts) — Schulalltag (2 pts) — Zukunftspläne (1 pt) — sprachlich korrekt, 8 bis 10 Zeilen und mindestens 5 konjugierte Verben (1 pt).',
      'Häufige Fehler: fehlende Großschreibung der Substantive, falsches Genus des Artikels, Verben nicht konjugiert, direkte Übersetzung aus dem Französischen.'
    ] },
    { type: 'sousTitre', texte: 'Partie C — Grammaire et vocabulaire (5 points)' },
    { type: 'liste', items: [
      "a) Ich bin vierzehn Jahre alt (sein : âge, état) ; Meine Mutter ist Lehrerin (sein : profession) (1 point).",
      "b) ich gehe, wir lernen, sie spielen (1 point).",
      "c) die Schule, der Lehrer, der Bruder (1 point).",
      "d) die Schule, die Bibliothek, der Markt, die Schwester (1 point).",
      "e) Woher kommen deine Eltern? — Sie kommen aus Benin (kommen : origine) (1 point)."
    ] }
  ]
};

module.exports = { DOCUMENTS: [SUJET, CORRIGE] };
