// ============================================================
// Revizy — contexts.js
// Registre des contextes nationaux (systèmes éducatifs, devise,
// paiements, textes).
//
// Le site est né pour le Bénin mais vise l'Afrique de l'Ouest
// puis l'international. Toute donnée propre à un pays vit ici :
// ajouter un pays = ajouter une entrée dans CONTEXTS (et son
// contenu dans la base / l'admin), sans toucher au reste du code.
//
// Ce module fonctionne des deux côtés (Node ET navigateur).
// ============================================================
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.REVIZY_CONTEXTS = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // ── Contenu du programme officiel (structures de chapitres) ─────
  // Curriculums des séries A/B/C/D/G du BAC et du Brevet 3ème.
  const CURRICULUM_BENIN = {
    bac: {
      'Mathématiques': {
        C: ['Suites numériques et récurrence', 'Calcul vectoriel et produit scalaire', 'Fonctions exponentielles et logarithmes', 'Primitives et intégrales', 'Équations différentielles', 'Nombres complexes', 'Probabilités et statistiques', 'Géométrie dans l\'espace'],
        D: ['Suites numériques et récurrence', 'Calcul vectoriel et produit scalaire', 'Fonctions exponentielles et logarithmes', 'Primitives et intégrales', 'Probabilités et statistiques', 'Géométrie dans l\'espace'],
        A: ['Suites numériques', 'Fonctions et courbes', 'Statistiques et probabilités', 'Vecteurs dans le plan'],
        B: ['Suites numériques', 'Fonctions et courbes', 'Statistiques et probabilités', 'Mathématiques financières'],
        G: ['Mathématiques financières', 'Statistiques descriptives', 'Fonctions et courbes', 'Probabilités de base']
      },
      'Physique-Chimie': {
        C: ['Ondes mécaniques et sonores', 'Ondes lumineuses et optique', 'Mécanique newtonienne', 'Travail et énergie', 'Chimie organique : alcools, alcanes, alcènes', 'Électricité : circuits RC, RL, RLC', 'Thermodynamique'],
        D: ['Ondes mécaniques et sonores', 'Ondes lumineuses et optique', 'Mécanique newtonienne', 'Travail et énergie', 'Chimie organique : alcools, alcanes', 'Électricité : circuits RC, RL'],
      },
      'SVT': {
        C: ['Biologie cellulaire et ADN', 'Génétique et hérédité mendélienne', 'Immunologie et système immunitaire', 'Système nerveux et hormones', 'Reproduction humaine', 'Écologie et biosphère'],
        D: ['Biologie cellulaire et ADN', 'Génétique et hérédité mendélienne', 'Immunologie et système immunitaire', 'Système nerveux et hormones', 'Reproduction humaine', 'Écologie et biosphère'],
        A: ['Biologie de base', 'Santé et hygiène', 'Écologie'],
      },
      'Philosophie': {
        A: ['La connaissance et la vérité', 'La liberté et la responsabilité', 'L\'État et la société', 'Le travail et la technique', 'La conscience et l\'inconscient', 'La morale et les valeurs'],
        C: ['La connaissance et la vérité', 'La liberté', 'L\'État', 'La morale'],
        D: ['La connaissance et la vérité', 'La liberté', 'L\'État', 'La morale'],
        B: ['La connaissance', 'La liberté et la responsabilité', 'L\'État et la société', 'Le travail'],
        G: ['La connaissance', 'La liberté et la responsabilité', 'L\'État et la société', 'Le travail']
      },
      'Français & Littérature': {
        A: ['Texte argumentatif et dissertation', 'Commentaire composé', 'Résumé et synthèse', 'Littérature africaine et francophone', 'Littérature française classique et moderne', 'Expression écrite et orale'],
        C: ['Dissertation et argumentation', 'Commentaire de texte', 'Grammaire et lexique avancés'],
        D: ['Dissertation et argumentation', 'Commentaire de texte', 'Grammaire et lexique avancés'],
        B: ['Dissertation et argumentation', 'Commentaire de texte', 'Grammaire'],
        G: ['Dissertation et argumentation', 'Commentaire de texte', 'Grammaire']
      },
      'Histoire-Géographie': {
        A: ['Histoire contemporaine mondiale : guerres et paix', 'Décolonisation et indépendances africaines', 'Histoire du Bénin', 'Géographie économique mondiale', 'Géographie du Bénin et de l\'Afrique', 'Mondialisation et développement'],
        C: ['Histoire contemporaine', 'Géographie économique', 'Bénin et Afrique'],
        D: ['Histoire contemporaine', 'Géographie économique', 'Bénin et Afrique'],
        B: ['Histoire contemporaine', 'Géographie économique', 'Bénin et Afrique'],
        G: ['Histoire contemporaine', 'Géographie économique', 'Bénin et Afrique']
      },
      'Anglais': {
        A: ['Compréhension écrite et orale', 'Expression écrite : essay et letter writing', 'Grammaire anglaise avancée', 'Civilisation anglophone', 'Vocabulaire thématique'],
        C: ['Compréhension et expression écrite', 'Grammaire anglaise', 'Vocabulaire thématique'],
        D: ['Compréhension et expression écrite', 'Grammaire anglaise', 'Vocabulaire thématique'],
        B: ['Compréhension et expression écrite', 'Grammaire anglaise', 'Vocabulaire thématique'],
        G: ['Compréhension et expression écrite', 'Grammaire anglaise', 'Vocabulaire thématique']
      },
      'Économie': {
        B: ['Introduction à l\'économie et aux systèmes économiques', 'Offre, demande et marché', 'Monnaie et financement de l\'économie', 'Commerce international', 'Développement économique et croissance', 'Économie du Bénin et de l\'UEMOA'],
        G: ['Introduction à l\'économie', 'Marché et prix', 'Monnaie et financement', 'Commerce international']
      },
      'Comptabilité': {
        G: ['Comptabilité générale : plan comptable SYSCOHADA', 'Bilan et compte de résultat', 'Opérations commerciales et TVA', 'Amortissements et provisions', 'Rapprochement bancaire', 'Comptabilité analytique de base']
      }
    },
    brevet: {
      'Mathématiques': ['Calcul littéral et équations du premier degré', 'Systèmes d\'équations', 'Fonctions linéaires et affines', 'Géométrie plane : triangles, cercles, transformations', 'Statistiques et probabilités', 'Théorème de Pythagore et trigonométrie', 'Volumes et aires'],
      'Physique-Chimie-Technologie': ['Électricité : circuit série et parallèle, loi d\'Ohm', 'Optique : lumière, réflexion, réfraction', 'Mécanique : vitesse, forces', 'Chimie : atomes, molécules, solutions', 'Technologie : systèmes techniques'],
      'SVT': ['Cellule et organisation du vivant', 'Digestion et nutrition', 'Respiration et circulation sanguine', 'Système nerveux et reproduction', 'Génétique de base', 'Immunologie simplifiée', 'Écologie et environnement'],
      'Français': ['Lecture et compréhension de texte', 'Grammaire : nature et fonction, conjugaison', 'Orthographe et vocabulaire', 'Rédaction : récit, description, lettre', 'Expression orale'],
      'Histoire-Géographie': ['Histoire du Bénin : royaumes et colonisation', 'Indépendance et histoire contemporaine du Bénin', 'Géographie du Bénin : milieux naturels, population', 'Afrique : organisations et défis', 'Mondialisation'],
      'Anglais': ['Vocabulaire du quotidien et thématique', 'Grammaire : temps, modaux, questions', 'Compréhension de textes simples', 'Expression écrite : phrases et petits textes'],
      'Lecture / Dictée': ['Techniques de lecture à voix haute', 'Règles d\'orthographe et dictée', 'Compréhension de textes variés', 'Vocabulaire contextuel']
    }
  };

  // ── Matières par niveau et série (cartes du catalogue) ──────────
  const MATIERES_BENIN = {
    bac: {
      A: [
        { name: 'Français & Littérature', icon: '📚' },
        { name: 'Philosophie', icon: '🧠' },
        { name: 'Anglais', icon: '🔤' },
        { name: 'Histoire-Géographie', icon: '🗺️' },
        { name: 'Mathématiques', icon: '📐' },
        { name: 'SVT', icon: '🧬' }
      ],
      B: [
        { name: 'Économie', icon: '📊' },
        { name: 'Histoire-Géographie', icon: '🗺️' },
        { name: 'Mathématiques', icon: '📐' },
        { name: 'Français & Littérature', icon: '📚' },
        { name: 'Philosophie', icon: '🧠' },
        { name: 'Anglais', icon: '🔤' }
      ],
      C: [
        { name: 'Mathématiques', icon: '📐' },
        { name: 'Physique-Chimie', icon: '🧪' },
        { name: 'SVT', icon: '🧬' },
        { name: 'Philosophie', icon: '🧠' },
        { name: 'Français & Littérature', icon: '📚' },
        { name: 'Histoire-Géographie', icon: '🗺️' },
        { name: 'Anglais', icon: '🔤' }
      ],
      D: [
        { name: 'SVT', icon: '🧬' },
        { name: 'Mathématiques', icon: '📐' },
        { name: 'Physique-Chimie', icon: '🧪' },
        { name: 'Philosophie', icon: '🧠' },
        { name: 'Français & Littérature', icon: '📚' },
        { name: 'Histoire-Géographie', icon: '🗺️' },
        { name: 'Anglais', icon: '🔤' }
      ],
      G: [
        { name: 'Comptabilité', icon: '💼' },
        { name: 'Économie', icon: '📊' },
        { name: 'Mathématiques', icon: '📐' },
        { name: 'Français & Littérature', icon: '📚' },
        { name: 'Philosophie', icon: '🧠' },
        { name: 'Anglais', icon: '🔤' }
      ]
    },
    brevet: [
      { name: 'Mathématiques', icon: '📐' },
      { name: 'Physique-Chimie-Technologie', icon: '🧪' },
      { name: 'SVT', icon: '🧬' },
      { name: 'Français', icon: '📚' },
      { name: 'Histoire-Géographie', icon: '🗺️' },
      { name: 'Anglais', icon: '🔤' },
      { name: 'Lecture / Dictée', icon: '📝' }
    ]
  };

  // ── Registre des contextes ───────────────────────────────────────
  // Clé = code pays ISO 3166-1 alpha-2 en majuscules.
  const CONTEXTS = {
    BJ: {
      code: 'BJ',
      slug: 'benin',
      nom: 'Bénin',
      nomLong: 'République du Bénin',
      langue: 'fr',
      actif: true,
      // Monnaie et paiement
      devise: 'FCFA',
      codeDevise: 'XOF',
      providers: ['mtn', 'moov'],
      // Système éducatif
      organisme: 'MEMP / OBB',
      libelleExamen: { bac: 'BAC', brevet: 'Brevet (BEPC)' },
      classes: { bac: 'Terminale', brevet: '3ème' },
      series: ['A', 'B', 'C', 'D', 'G'],
      // Tarifs (source de vérité serveur)
      prix: {
        chapitre: { brevet: 100, bac: 150 },
        abonnement: { brevet: 2000, bac: 3000 }
      },
      // Textes utilisés dans les prompts IA et les pages SEO
      textes: {
        systemeEducatif: 'système éducatif béninois',
        programmeOfficiel: 'programme MEMP/OBB',
        examens: 'examens béninois',
        vocabulaire: 'vocabulaire scolaire béninois',
        paysLocution: 'au Bénin',
        paysTitre: 'au Bénin',
        slogan: 'Réussir le Brevet et le BAC au Bénin',
        credential: 'BEPC, BAC'
      },
      curriculum: CURRICULUM_BENIN,
      matieres: MATIERES_BENIN
    },

    // Exemple de contexte préparé : le Sénégal partage la devise (XOF)
    // et la structure BREVET/BAC. Il suffit de remplir `curriculum`,
    // `matieres` et de passer `actif: true` pour l'ouvrir.
    SN: {
      code: 'SN',
      slug: 'senegal',
      nom: 'Sénégal',
      nomLong: 'République du Sénégal',
      langue: 'fr',
      actif: false,
      bientot: true,
      devise: 'FCFA',
      codeDevise: 'XOF',
      providers: ['mtn', 'moov', 'orange'],
      organisme: 'Direction de l\'Enseignement',
      libelleExamen: { bac: 'BAC', brevet: 'BFEM' },
      classes: { bac: 'Terminale', brevet: '3ème' },
      series: ['A', 'B', 'C', 'D', 'E', 'G'],
      prix: {
        chapitre: { brevet: 100, bac: 150 },
        abonnement: { brevet: 2000, bac: 3000 }
      },
      textes: {
        systemeEducatif: 'système éducatif sénégalais',
        programmeOfficiel: 'programme officiel du Sénégal',
        examens: 'examens sénégalais',
        vocabulaire: 'vocabulaire scolaire sénégalais',
        paysLocution: 'au Sénégal',
        paysTitre: 'au Sénégal',
        slogan: 'Réussir le BFEM et le BAC au Sénégal',
        credential: 'BFEM, BAC'
      },
      curriculum: { bac: {}, brevet: [] },
      matieres: { bac: {}, brevet: [] }
    }
  };

  const DEFAULT_CODE = 'BJ';

  function normalizeCode(value) {
    return String(value || '').trim().toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2);
  }

  function getContext(code) {
    const c = normalizeCode(code);
    return CONTEXTS[c] || CONTEXTS[DEFAULT_CODE];
  }

  function getContextBySlug(slug) {
    const s = String(slug || '').trim().toLowerCase();
    return Object.values(CONTEXTS).find(c => c.slug === s) || null;
  }

  /** Contextes accessibles au public (pour le sélecteur de pays). */
  function listContexts() {
    return Object.values(CONTEXTS).map(c => ({
      code: c.code,
      slug: c.slug,
      nom: c.nom,
      nomLong: c.nomLong,
      langue: c.langue,
      actif: c.actif,
      bientot: !!c.bientot,
      devise: c.devise,
      codeDevise: c.codeDevise,
      classes: c.classes,
      libelleExamen: c.libelleExamen,
      series: c.series
    }));
  }

  /**
   * Détermine le contexte d'une requête.
   * Ordre de priorité :
   *   1. paramètre explicite (query ?pays=XX ou en-tête X-Revizy-Pays)
   *   2. sous-domaine (senegal.revisy.onrender.com)
   *   3. préfixe d'URL (/senegal/cours/...)
   *   4. contexte par défaut (Bénin)
   */
  function resolveContext(input = {}) {
    const explicit = normalizeCode(input.code);
    if (explicit && CONTEXTS[explicit]) return CONTEXTS[explicit];

    const host = String(input.host || '').split(':')[0].toLowerCase();
    if (host) {
      const parts = host.split('.');
      if (parts.length > 2) {
        const byHost = getContextBySlug(parts[0]);
        if (byHost) return byHost;
      }
    }

    const path = String(input.path || '');
    const m = path.match(/^\/([a-z][a-z0-9-]{1,15})(?:\/|$)/i);
    if (m) {
      const byPath = getContextBySlug(m[1]);
      if (byPath) return byPath;
    }

    return CONTEXTS[DEFAULT_CODE];
  }

  return {
    CONTEXTS,
    DEFAULT_CODE,
    getContext,
    getContextBySlug,
    listContexts,
    resolveContext
  };
});
