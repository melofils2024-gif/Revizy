/**
 * Épreuves types Revisy — Espagnol (BEPC 3e).
 * Textes et sujets originaux, écrits en interne (niveau A2/B1).
 */

const TEXTE_ES = "Me llamo Adjovi y tengo catorce años. Estudio en el CEG de Godomey y vivo con mi madre y mi hermana pequeña. Cada mañana salgo de casa a las seis y media: primero ayuno y después tomo la moto con mi padre hasta la escuela. En clase me gusta la matemática y la geografía, pero la lengua española es más difícil para mí, porque las reglas no son las mismas que las del francés. El sábado por la mañana ayudo a mi madre en el mercado; ella vende yuca y yo aprendo los precios. Después de clase juego al fútbol con mis amigos. Me gusta mucho este país, aunque a veces hace demasiado calor. Mi sueño es ser ingeniero y viajar a España para conocer a mi tía.";

const SUJET = {
  id: 'bepc-3e-espagnol-sujet',
  fichier: 'bepc-3e-espagnol-sujet',
  titre: 'Épreuve types d\'Espagnol — BEPC 3e',
  description: 'Sujet d\'entraînement : compréhension de l\'écrit, expression écrite, grammaire et vocabulaire.',
  examen: 'BEPC', niveau: 'brevet', classe: '3e', serie: null, annee: 2026,
  matiere: 'Espagnol', type: 'sujet',
  sourceNom: 'Revisy — épreuve type rédigée en interne',
  sourceUrl: 'https://revisy.onrender.com',
  licence: 'Document original Revisy — libre de reproduction et de rediffusion',
  blocs: [
    { type: 'titre', texte: 'BREVET D\'ÉTUDES DU PREMIER CYCLE — SESSION DE RÉVISION' },
    { type: 'consigne', lignes: [
      'ÉPREUVE D\'ESPAGNOL',
      'Durée : 1 heure — Coefficient : 4',
      'Partie A : 5 points — Partie B : 6 points — Partie C : 5 points'
    ] },
    { type: 'sousTitre', texte: 'Partie A (5 points) — Compréhension de l\'écrit' },
    { type: 'texte', texte: "Lee el texto y responde en francés." },
    { type: 'texte', texte: TEXTE_ES },
    { type: 'liste', items: [
      "a) ¿Cómo se llama el chico y dónde vive? (1 point)",
      "b) ¿A qué hora sale de casa y por qué? (1 point)",
      "c) ¿Qué materias le gustan y cuál le parece más difícil? (1 point)",
      "d) ¿Qué hace el sábado por la mañana y qué aprende? (1 point)",
      "e) ¿Cuál es su sueño? (1 point)"
    ] },
    { type: 'sousTitre', texte: 'Partie B (6 points) — Expression écrite' },
    { type: 'texte', texte: "Escribe un texto de 8 a 10 líneas en español para presentarte a un camarada (compañero) de otro país: tus datos personales, tu clase, tu vida escolar y tus planes (proyectos) para el futuro. Usa el presente de indicativo y al menos cinco verbos de los que has aprendido. No copies el texto de la parte A." },
    { type: 'sousTitre', texte: 'Partie C (5 points) — Grammaire et vocabulaire' },
    { type: 'liste', items: [
      "a) Complète avec la forme correcte : Hoy es (ser / estar) lunes. Mi casa (estar / ser) cerca de la escuela.",
      "b) Conjugue au présent : yo (hablar) español ; nosotros (vivir) en Cotonou ; ellos (tener) quince años.",
      "c) Mets l'article défini : (el / la) problema ; (el / la) ciudad ; (los / las) niños.",
      "d) Traduis en espagnol : l'école ; la bibliothèque ; le marché ; le professeur.",
      "e) Complète : ¿De dónde (ser / estar) tus padres? — (ser / estar) de Benín."
    ] }
  ]
};

const CORRIGE = {
  id: 'bepc-3e-espagnol-corrige',
  fichier: 'bepc-3e-espagnol-corrige',
  titre: 'Corrigé — Épreuve types d\'Espagnol (BEPC 3e)',
  description: 'Corrigé rédigé : réponses de compréhension, modèle de texte, grammaire et vocabulaire.',
  examen: 'BEPC', niveau: 'brevet', classe: '3e', serie: null, annee: 2026,
  matiere: 'Espagnol', type: 'corrige',
  sourceNom: 'Revisy — corrigé d\'épreuve type rédigé en interne',
  sourceUrl: 'https://revisy.onrender.com',
  licence: 'Document original Revisy — libre de reproduction et de rediffusion',
  blocs: [
    { type: 'titre', texte: 'CORRIGÉ — ÉPREUVE TYPES D\'ESPAGNOL (BEPC 3e)' },
    { type: 'consigne', lignes: ['Barème sur 16 points.', 'Plusieurs formulations sont acceptables : le barème juge le contenu.'] },
    { type: 'sousTitre', texte: 'Partie A — Compréhension (5 points)' },
    { type: 'liste', items: [
      "a) Se llama Adjovi y vive en Godomey, con su madre y su hermana (1 point).",
      "b) Sale a las seis y media, porque primero ayuna y luego va a la escuela (1 point).",
      "c) Le gustan las matemáticas y la geografía; la lengua española le parece más difícil (1 point).",
      "d) El sábado por la mañana ayuda a su madre en el mercado y aprende los precios (1 point).",
      "e) Quiere ser ingeniero y viajar a España para conocer a su tía (1 point)."
    ] },
    { type: 'sousTitre', texte: 'Partie B — Expression écrite (6 points)' },
    { type: 'texte', texte: "Modèle (à adapter, non exigé mot pour mot) : « Me llamo Adjovi y tengo catorce años. Soy de Benín y vivo en Godomey. Ahora estoy en la clase de 3e, en el CEG. En la escuela me gusta la matemática y la geografía. Los lunes tengo español y el miércoles historia. El sábado por la mañana ayudo a mi madre en el mercado. En el futuro quiero ser ingeniero, porque me gusta la tecnología y quiero ayudar a mi familia. También quiero viajar a España para conocer a mi tía. »" },
    { type: 'liste', items: [
      'Données personnelles complètes (2 pts) — vie scolaire (2 pts) — projets (1 pt) — langue correcte, 8 à 10 lignes et au moins 5 verbes conjugués (1 pt).',
      'Erreurs fréquentes : ser et estar confondus, verbes non conjugués, articles omis, traduction mot à mot de la version française.'
    ] },
    { type: 'sousTitre', texte: 'Partie C — Grammaire et vocabulaire (5 points)' },
    { type: 'liste', items: [
      "a) Hoy es lunes (ser : date et identité) ; Mi casa está cerca de la escuela (estar : localisation) (1 point).",
      "b) hablo, vivimos, tienen (1 point).",
      "c) el problema, la ciudad, los niños (1 point).",
      "d) la escuela, la biblioteca, el mercado, el profesor / la profesora (1 point).",
      "e) ¿De dónde son tus padres? — Son de Benín (ser : origine) (1 point)."
    ] }
  ]
};

module.exports = { DOCUMENTS: [SUJET, CORRIGE] };
