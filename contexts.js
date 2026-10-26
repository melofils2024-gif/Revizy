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
        A: ['Dénombrement', 'Statistiques descriptives', 'Suites arithmétiques', 'Suites géométriques', 'Limites et continuité', 'Dérivation et étude de fonctions', 'Probabilités sur un univers fini', 'Variables aléatoires et lois de probabilité'],
        B: ['Suites arithmétiques et géométriques', 'Dénombrement', 'Limites et Continuité', 'Dérivation et Étude Complète de Fonctions', 'Fonction Logarithme Népérien', 'Fonction Exponentielle', 'Statistiques Descriptives à Deux Variables', 'Probabilités'],
        G: ['Statistiques descriptives : séries à une variable', 'Statistiques à deux variables et ajustement affine', 'Intérêts simples et escompte commercial', 'Intérêts composés et annuités', 'Fonctions numériques pour la gestion', 'Logarithmes, exponentielles et croissance', 'Dénombrement et combinaisons', 'Probabilités et variables aléatoires']
      },
      'Physique-Chimie': {
        C: ['Cinématique et dynamique du point matériel — Lois de Newton', 'Mouvements dans les champs E et B uniformes et champ de gravitation', 'Cinétique chimique : Vitesse de réaction et facteurs cinétiques', 'Équilibres acido-basiques, pH-métrie, solutions tampons et dosages', 'Systèmes oscillants mécaniques et phénomène de résonance', 'Circuits RLC et oscillations électriques libres ou forcées', 'Fonctions organiques oxygénées : Alcools, composés carbonylés et acides', 'Estérification, saponification, polymères et composés azotés', 'Propagation des ondes mécaniques et diffraction', 'Optique ondulatoire : Interférences lumineuses et dispersion', 'Noyaux atomiques, radioactivité et réactions nucléaires', 'Niveaux d\'énergie de l\'atome, spectres et effet photoélectrique'],
        D: ['Cinématique et dynamique du point matériel — Lois de Newton', 'Mouvements dans les champs E et B uniformes et champ de gravitation', 'Cinétique chimique : Vitesse de réaction et facteurs cinétiques', 'Équilibres acido-basiques, pH-métrie, solutions tampons et dosages', 'Systèmes oscillants mécaniques et phénomène de résonance', 'Circuits RLC et oscillations électriques libres ou forcées', 'Fonctions organiques oxygénées : Alcools, composés carbonylés et acides', 'Estérification, saponification, polymères et composés azotés', 'Propagation des ondes mécaniques et diffraction', 'Optique ondulatoire : Interférences lumineuses et dispersion', 'Noyaux atomiques, radioactivité et réactions nucléaires', 'Niveaux d\'énergie de l\'atome, spectres et effet photoélectrique'],
      },
      'SVT': {
        C: ['Génétique formelle : Monohybridisme et dihybridisme', 'Génétique humaine et anomalies chromosomiques', 'Biologie moléculaire : ADN, réplication et synthèse des protéines', 'Immunologie : Coopération cellulaire et réponse adaptative', 'Neurophysiologie : Message nerveux et transmission synaptique', 'Régulation hormonale de la reproduction', 'Écologie des populations et flux de matière / énergie', 'Géologie : Tectonique des plaques et phénomènes associés'],
        D: ['Génétique formelle : Monohybridisme et dihybridisme', 'Génétique humaine et anomalies chromosomiques', 'Biologie moléculaire : ADN, réplication et synthèse des protéines', 'Immunologie : Coopération cellulaire et réponse adaptative', 'Neurophysiologie : Message nerveux et transmission synaptique', 'Régulation hormonale de la reproduction', 'Écologie des populations et flux de matière / énergie', 'Géologie : Tectonique des plaques et phénomènes associés'],
        A: ['Génétique humaine de base et transmission des caractères', 'Santé et hygiène : maladies infectieuses et immunité', 'Alimentation, nutrition et équilibre physiologique', 'Écologie, environnement et développement durable'],
      },
      'Philosophie': {
        A: ['La conscience, l\'inconscient et le sujet', 'Autrui, l\'intersubjectivité et la reconnaissance', 'Le désir, le bonheur et les passions', 'La liberté et le déterminisme', 'La raison, le réel et la vérité', 'Le travail, la technique et la nature', 'L\'État, la justice et le droit', 'La philosophie africaine : Histoire, débats et enjeux'],
        C: ['La conscience et la liberté', 'La raison et le réel', 'L\'État et la justice', 'Le travail et la technique'],
        D: ['La conscience et la liberté', 'La raison et le réel', 'L\'État et la justice', 'Le travail et la technique'],
        B: ['La conscience, la liberté et le sujet', 'Le travail, la technique et la société', 'L\'État, la justice et le droit', 'La raison et la vérité'],
        G: ['La conscience, la liberté et le travail', 'L\'État, la justice et le droit', 'La technique et la nature', 'La vérité et la morale']
      },
      'Français & Littérature': {
        A: ['La dissertation littéraire et philosophique', 'Le commentaire composé littéraire', 'Les grands mouvements littéraires : Du Classicisme aux Lumières', 'Du Romantisme au Réalisme et Symbolisme', 'La Négritude et les pionniers de la littérature négro-africaine', 'Le roman et le théâtre contemporains d\'Afrique', 'Les maîtres des lettres béninoises', 'Rhétorique, stylistique et analyse du discours'],
        C: ['La dissertation littéraire et l\'argumentation', 'Le commentaire composé littéraire', 'La littérature africaine engagée et les lettres béninoises'],
        D: ['La dissertation littéraire et l\'argumentation', 'Le commentaire composé littéraire', 'La littérature africaine engagée et les lettres béninoises'],
        B: ['La dissertation littéraire', 'Le commentaire composé', 'Littérature africaine et francophone contemporaine'],
        G: ['La dissertation littéraire', 'Le commentaire de texte', 'Littérature africaine et béninoise']
      },
      'Histoire-Géographie': {
        A: ['Les relations internationales de 1945 à la fin de la Guerre froide', 'Les décolonisations en Asie et en Afrique et le Tiers-Monde', 'L\'Afrique contemporaine : De l\'indépendance aux démocraties', 'La mondialisation contemporaine : Acteurs, flux et réseaux', 'Les pôles de puissance de l\'espace mondial', 'Les pays du Sud et l\'Afrique face à la mondialisation', 'Le Bénin : Organisation spatiale et atouts géostratégiques', 'Enjeux géopolitiques contemporains et environnement'],
        C: ['Les relations internationales de 1945 à nos jours', 'La mondialisation contemporaine et ses acteurs', 'Le Bénin et l\'Afrique dans l\'espace mondial'],
        D: ['Les relations internationales de 1945 à nos jours', 'La mondialisation contemporaine et ses acteurs', 'Le Bénin et l\'Afrique dans l\'espace mondial'],
        B: ['Relations internationales et décolonisation', 'La mondialisation économique et flux mondiaux', 'L\'Afrique contemporaine et le Bénin'],
        G: ['Le monde de 1945 à 1991 : Bipolarisation, Guerre froide et crises', 'Le monde depuis 1991 : Fin de la bipolarité et nouvelles puissances', 'L\'Afrique de la décolonisation aux transitions démocratiques', 'Le Bénin contemporain : Du Dahomey au renouveau démocratique', 'La mondialisation : Acteurs, flux commerciaux et financiers', 'Les espaces économiques majeurs : Triade et émergents', 'Le Bénin : Organisation spatiale, PAC et GDIZ', 'L\'intégration régionale ouest-africaine : UEMOA et CEDEAO']
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
        { name: 'Histoire-Géographie', icon: '🗺️' },
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
      providers: ['mtn', 'moov', 'celtiis'],
      reseauxPaiement: [
        { id: 'MTN', nom: 'MTN Mobile Money (Bénin)', icon: '🟡', pill: 'mtn', placeholder: 'Ex: 97 00 00 00' },
        { id: 'MOOV', nom: 'Moov Africa Money (Bénin)', icon: '🔵', pill: 'moov', placeholder: 'Ex: 95 00 00 00' },
        { id: 'CELTIIS', nom: 'Celtiis Cash (Bénin)', icon: '🟢', pill: 'celtiis', placeholder: 'Ex: 40 00 00 00' }
      ],
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
        programmeOfficiel: 'programme officiel du Bénin (MEMP / OBB)',
        examens: 'examens béninois (BEPC, BAC)',
        vocabulaire: 'vocabulaire scolaire béninois',
        paysLocution: 'au Bénin',
        paysTitre: 'au Bénin',
        slogan: 'Réussir le Brevet et le BAC au Bénin',
        credential: 'BEPC, BAC'
      },
      curriculum: CURRICULUM_BENIN,
      matieres: MATIERES_BENIN
    },

    TG: {
      code: 'TG',
      slug: 'togo',
      nom: 'Togo',
      nomLong: 'République Togolaise',
      langue: 'fr',
      actif: true,
      devise: 'FCFA',
      codeDevise: 'XOF',
      providers: ['togocel', 'moov'],
      reseauxPaiement: [
        { id: 'TMONEY', nom: 'T-Money (Togocel)', icon: '🔵', pill: 'togocel', placeholder: 'Ex: 90 00 00 00' },
        { id: 'FLOOZ', nom: 'Flooz (Moov Togo)', icon: '🟠', pill: 'moov', placeholder: 'Ex: 99 00 00 00' }
      ],
      organisme: 'Ministère des Enseignements Primaire, Secondaire et Technique',
      libelleExamen: { bac: 'BAC', brevet: 'BEPC' },
      classes: { bac: 'Terminale', brevet: '3ème' },
      series: ['A', 'C', 'D', 'E', 'F', 'G'],
      prix: {
        chapitre: { brevet: 100, bac: 150 },
        abonnement: { brevet: 2000, bac: 3000 }
      },
      textes: {
        systemeEducatif: 'système éducatif togolais',
        programmeOfficiel: 'programme officiel du Togo (MEPST)',
        examens: 'examens togolais (BEPC, BAC)',
        vocabulaire: 'vocabulaire scolaire togolais',
        paysLocution: 'au Togo',
        paysTitre: 'au Togo',
        slogan: 'Réussir le BEPC et le BAC au Togo',
        credential: 'BEPC, BAC'
      },
      curriculum: CURRICULUM_BENIN,
      matieres: MATIERES_BENIN
    },

    CI: {
      code: 'CI',
      slug: 'cote-divoire',
      nom: 'Côte d\'Ivoire',
      nomLong: 'République de Côte d\'Ivoire',
      langue: 'fr',
      actif: true,
      devise: 'FCFA',
      codeDevise: 'XOF',
      providers: ['wave', 'orange', 'mtn', 'moov'],
      reseauxPaiement: [
        { id: 'WAVE', nom: 'Wave Côte d\'Ivoire', icon: '🌊', pill: 'wave', placeholder: 'Ex: 07 00 00 00 00' },
        { id: 'ORANGE', nom: 'Orange Money CI', icon: '🟠', pill: 'orange', placeholder: 'Ex: 07 00 00 00 00' },
        { id: 'MTN', nom: 'MTN Mobile Money CI', icon: '🟡', pill: 'mtn', placeholder: 'Ex: 05 00 00 00 00' },
        { id: 'MOOV', nom: 'Moov Money CI', icon: '🔵', pill: 'moov', placeholder: 'Ex: 01 00 00 00 00' }
      ],
      organisme: 'Ministère de l\'Éducation Nationale et de l\'Alphabétisation (MENA)',
      libelleExamen: { bac: 'BAC', brevet: 'BEPC' },
      classes: { bac: 'Terminale', brevet: '3ème' },
      series: ['A', 'C', 'D'],
      prix: {
        chapitre: { brevet: 100, bac: 150 },
        abonnement: { brevet: 2000, bac: 3000 }
      },
      textes: {
        systemeEducatif: 'système éducatif ivoirien',
        programmeOfficiel: 'programme officiel de Côte d\'Ivoire (MENA)',
        examens: 'examens ivoiriens (BEPC, BAC)',
        vocabulaire: 'vocabulaire scolaire ivoirien',
        paysLocution: 'en Côte d\'Ivoire',
        paysTitre: 'en Côte d\'Ivoire',
        slogan: 'Réussir le BEPC et le BAC en Côte d\'Ivoire',
        credential: 'BEPC, BAC'
      },
      curriculum: CURRICULUM_BENIN,
      matieres: MATIERES_BENIN
    },

    SN: {
      code: 'SN',
      slug: 'senegal',
      nom: 'Sénégal',
      nomLong: 'République du Sénégal',
      langue: 'fr',
      actif: true,
      devise: 'FCFA',
      codeDevise: 'XOF',
      providers: ['wave', 'orange', 'free'],
      reseauxPaiement: [
        { id: 'WAVE', nom: 'Wave Sénégal', icon: '🌊', pill: 'wave', placeholder: 'Ex: 76 000 00 00' },
        { id: 'ORANGE', nom: 'Orange Money Sénégal', icon: '🟠', pill: 'orange', placeholder: 'Ex: 77 000 00 00' },
        { id: 'FREE', nom: 'Free Money Sénégal', icon: '🔴', pill: 'free', placeholder: 'Ex: 78 000 00 00' }
      ],
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
        examens: 'examens sénégalais (BFEM, BAC)',
        vocabulaire: 'vocabulaire scolaire sénégalais',
        paysLocution: 'au Sénégal',
        paysTitre: 'au Sénégal',
        slogan: 'Réussir le BFEM et le BAC au Sénégal',
        credential: 'BFEM, BAC'
      },
      curriculum: CURRICULUM_BENIN,
      matieres: MATIERES_BENIN
    }
  };

  // ── Examens officiels par pays ─────────────────────────────────
  // L'intitulé exact de l'examen national : il est repris dans les
  // prompts IA pour que le programme généré corresponde à l'examen
  // réellement passé dans ce pays.
  const EXAMEN_PAR_PAYS = {
    BJ: { bac: 'BAC', brevet: 'BEPC' },
    SN: { bac: 'BAC', brevet: 'BFEM' },
    CI: { bac: 'BAC', brevet: 'BEPC' },
    CM: { bac: 'BAC', brevet: 'BEPC' },
    BF: { bac: 'BAC', brevet: 'BEPC' },
    ML: { bac: 'BAC', brevet: 'BEPC' },
    NE: { bac: 'BAC', brevet: 'BEPC' },
    TG: { bac: 'BAC', brevet: 'BEPC' },
    GN: { bac: 'BAC', brevet: 'BEPC' },
    CD: { bac: "Examen d'État", brevet: 'Épreuve nationale' },
    GH: { bac: 'WASSCE', brevet: 'BECE' },
    NG: { bac: 'WAEC / NECO', brevet: 'JSSCE' },
    KE: { bac: 'KCSE', brevet: 'KCPE' },
    TZ: { bac: 'ACSEE', brevet: 'CSEE' },
    UG: { bac: 'UCE', brevet: 'PLE' },
    RW: { bac: 'HECB', brevet: 'PPE' },
    ET: { bac: 'UEE', brevet: 'Grade 10 Exam' },
    ZA: { bac: 'NSC (National Senior Certificate)', brevet: 'NSC' },
    ZW: { bac: 'A Level ZIMSEC', brevet: 'O Level ZIMSEC' },
    ZM: { bac: 'School Certificate', brevet: 'Junior School Certificate' },
    MW: { bac: 'MSCE', brevet: 'JCE' },
    BW: { bac: 'BGCSE', brevet: 'CISCE' },
    NA: { bac: 'NSSCO', brevet: 'NSPO' },
    MZ: { bac: 'Exame de Certificação', brevet: 'Certificado' },
    AO: { bac: 'Exame Geral', brevet: 'Certificado' },
    CV: { bac: 'Exame Nacional', brevet: 'Certificado' },
    ST: { bac: 'Exame Geral', brevet: 'Certificado' },
    MA: { bac: 'Baccalauréat', brevet: 'BRE' },
    DZ: { bac: 'Baccalauréat', brevet: 'BEM' },
    TN: { bac: 'Baccalauréat', brevet: 'BEM' },
    EG: { bac: 'Thanaweya Amma', brevet: 'Preparatory Certificate' },
    LY: { bac: 'Baccalauréat', brevet: 'Shahada' },
    SD: { bac: 'Sudanese Secondary Certificate', brevet: 'Basic Certificate' },
    GM: { bac: 'WAEC', brevet: 'Gambia Basic Certificate Examination' },
    SL: { bac: 'WAEC', brevet: 'GCE' },
    LR: { bac: 'WAEC', brevet: 'GCE' },
    KM: { bac: 'Baccalauréat', brevet: 'BEPC' },
    MG: { bac: 'Baccalauréat', brevet: 'BEPC' },
    BI: { bac: 'Baccalauréat', brevet: 'Concours d\'entrée en 7ème' },
    DJ: { bac: 'Baccalauréat', brevet: 'BEPC' },
    BW2: { bac: 'BAC', brevet: 'BEPC' }
  };

  const EXAMEN_PAR_DEFAUT = { bac: 'BAC', brevet: 'Brevet' };

  /** Intitulés des examens officiels d'un pays. */
  function examenDe(code) {
    const c = normalizeCode(code);
    return EXAMEN_PAR_PAYS[c] || EXAMEN_PAR_DEFAUT;
  }

  // ── Noms des matières par langue ───────────────────────────────
  // La base garde les noms canoniques (ceux utilisés en base et par
  // l'API) ; l'affichage est traduit dans la langue du pays.
  const MATIERES_LANGUE = {
    fr: {
      'Mathématiques': 'Mathématiques',
      'Physique-Chimie': 'Physique-Chimie',
      'Physique-Chimie-Technologie': 'Physique-Chimie-Technologie',
      'SVT': 'SVT',
      'Philosophie': 'Philosophie',
      'Français & Littérature': 'Français & Littérature',
      'Français': 'Français',
      'Anglais': 'Anglais',
      'Histoire-Géographie': 'Histoire-Géographie',
      'Économie': 'Économie',
      'Comptabilité': 'Comptabilité',
      'Lecture / Dictée': 'Lecture / Dictée'
    },
    en: {
      'Mathématiques': 'Mathematics',
      'Physique-Chimie': 'Physics and Chemistry',
      'Physique-Chimie-Technologie': 'Physics, Chemistry and Technology',
      'SVT': 'Biology and Earth Science',
      'Philosophie': 'Philosophy',
      'Français & Littérature': 'French and Literature',
      'Français': 'French',
      'Anglais': 'English',
      'Histoire-Géographie': 'History and Geography',
      'Économie': 'Economics',
      'Comptabilité': 'Accounting',
      'Lecture / Dictée': 'Reading and Dictation'
    },
    ar: {
      'Mathématiques': 'الرياضيات',
      'Physique-Chimie': 'الفيزياء والكيمياء',
      'Physique-Chimie-Technologie': 'الفيزياء والكيمياء والتكنولوجيا',
      'SVT': 'علوم الحياة والأرض',
      'Philosophie': 'الفلسفة',
      'Français & Littérature': 'الأدب الفرنسي',
      'Français': 'اللغة الفرنسية',
      'Anglais': 'اللغة الإنجليزية',
      'Histoire-Géographie': 'التاريخ والجغرافيا',
      'Économie': 'الاقتصاد',
      'Comptabilité': 'المحاسبة',
      'Lecture / Dictée': 'القراءة والإملاء'
    },
    pt: {
      'Mathématiques': 'Matemática',
      'Physique-Chimie': 'Física e Química',
      'Physique-Chimie-Technologie': 'Física, Química e Tecnologia',
      'SVT': 'Biologia e Geologia',
      'Philosophie': 'Filosofia',
      'Français & Littérature': 'Francês e Literatura',
      'Français': 'Francês',
      'Anglais': 'Inglês',
      'Histoire-Géographie': 'História e Geografia',
      'Économie': 'Economia',
      'Comptabilité': 'Contabilidade',
      'Lecture / Dictée': 'Leitura e Ditado'
    },
    es: {
      'Mathématiques': 'Matemáticas',
      'Physique-Chimie': 'Física y Química',
      'Physique-Chimie-Technologie': 'Física, Química y Tecnología',
      'SVT': 'Biología y Ciencias de la Tierra',
      'Philosophie': 'Filosofía',
      'Français & Littérature': 'Francés y Literatura',
      'Français': 'Francés',
      'Anglais': 'Inglés',
      'Histoire-Géographie': 'Historia y Geografía',
      'Économie': 'Economía',
      'Comptabilité': 'Contabilidad',
      'Lecture / Dictée': 'Lectura y Dictado'
    },
    it: {
      'Mathématiques': 'Matematica',
      'Physique-Chimie': 'Fisica e Chimica',
      'Physique-Chimie-Technologie': 'Fisica, Chimica e Tecnologia',
      'SVT': 'Biologia e Scienze della Terra',
      'Philosophie': 'Filosofia',
      'Français & Littérature': 'Francese e Letteratura',
      'Français': 'Francese',
      'Anglais': 'Inglese',
      'Histoire-Géographie': 'Storia e Geografia',
      'Économie': 'Economia',
      'Comptabilité': 'Contabilità',
      'Lecture / Dictée': 'Lettura e Detttatura'
    },
    ru: {
      'Mathématiques': 'Математика',
      'Physique-Chimie': 'Физика и химия',
      'Physique-Chimie-Technologie': 'Физика, химия и технология',
      'SVT': 'Биология и география',
      'Philosophie': 'Философия',
      'Français & Littérature': 'Французский язык и литература',
      'Français': 'Французский язык',
      'Anglais': 'Английский язык',
      'Histoire-Géographie': 'История и география',
      'Économie': 'Экономика',
      'Comptabilité': 'Бухгалтерский учёт',
      'Lecture / Dictée': 'Чтение и диктант'
    },
    zh: {
      'Mathématiques': '数学',
      'Physique-Chimie': '物理与化学',
      'Physique-Chimie-Technologie': '物理、化学与技术',
      'SVT': '生物与地球科学',
      'Philosophie': '哲学',
      'Français & Littérature': '法语与文学',
      'Français': '法语',
      'Anglais': '英语',
      'Histoire-Géographie': '历史与地理',
      'Économie': '经济',
      'Comptabilité': '会计',
      'Lecture / Dictée': '阅读与听写'
    }
  };

  /**
   * Nom d'affichage d'une matière dans la langue du pays.
   * Le nom canonique (base / API) n'est jamais modifié.
   */
  function traduireMatiere(code, nomCanonique) {
    const nom = String(nomCanonique || '');
    const langue = langueDe(code);
    const table = MATIERES_LANGUE[langue] || MATIERES_LANGUE.fr;
    return table[nom] || nom;
  }

  // ── Langue d'enseignement par pays ─────────────────────────────
  // Langue officielle du système éducatif : elle pilote la langue du
  // site ET la langue des cours, exercices et réponses du tuteur IA.
  const LANGUE_PAR_PAYS = {
    BJ: 'fr', SN: 'fr', CI: 'fr', BF: 'fr', ML: 'fr', NE: 'fr', TG: 'fr', GW: 'fr',
    GN: 'fr', BI: 'fr', DJ: 'fr', KM: 'fr', MG: 'fr', CM: 'fr', CF: 'fr', CG: 'fr',
    TD: 'fr', GA: 'fr', GQ: 'fr', CD: 'fr', FR: 'fr', BE: 'fr', CH: 'fr',
    GM: 'en', LR: 'en', SL: 'en', NG: 'en', GH: 'en', KE: 'en', TZ: 'en', UG: 'en',
    RW: 'en', SS: 'en', ZA: 'en', NA: 'en', BW: 'en', ZW: 'en', MW: 'en', ZM: 'en',
    MU: 'en', SC: 'en', LS: 'en', SZ: 'en', CA: 'en', US: 'en', GB: 'en', IN: 'en',
    ET: 'en', ER: 'en', SO: 'en',
    ST: 'pt', AO: 'pt', CV: 'pt', MZ: 'pt', PT: 'pt', BR: 'pt',
    MA: 'ar', DZ: 'ar', TN: 'ar', EG: 'ar', LY: 'ar', SD: 'ar',
    ES: 'es', IT: 'it', RU: 'ru', CN: 'zh'
  };

  // ── Catalogue des pays disponibles ──────────────────────────────
  // Liste des pays proposés à l'inscription (et dans la barre de
  // navigation). Les pays africains apparaissent en premier : c'est la
  // zone cible de Revizy, et leur devise est gérée nativement.
  //
  //   zone : 'afrique' | 'monde'
  //   programme : true si le programme officiel du pays est publié
  //   actif : true si le pays peut être choisi
  const PAYS_DISPONIBLES = [
    // ── Afrique de l'Ouest ──────────────────────────────────────
    { code: 'BJ', nom: 'Bénin', devise: 'FCFA', codeDevise: 'XOF', zone: 'afrique', programme: true, actif: true },
    { code: 'SN', nom: 'Sénégal', devise: 'FCFA', codeDevise: 'XOF', zone: 'afrique', programme: false, actif: true },
    { code: 'CI', nom: "Côte d'Ivoire", devise: 'FCFA', codeDevise: 'XOF', zone: 'afrique', programme: false, actif: true },
    { code: 'BF', nom: 'Burkina Faso', devise: 'FCFA', codeDevise: 'XOF', zone: 'afrique', programme: false, actif: true },
    { code: 'ML', nom: 'Mali', devise: 'FCFA', codeDevise: 'XOF', zone: 'afrique', programme: false, actif: true },
    { code: 'NE', nom: 'Niger', devise: 'FCFA', codeDevise: 'XOF', zone: 'afrique', programme: false, actif: true },
    { code: 'TG', nom: 'Togo', devise: 'FCFA', codeDevise: 'XOF', zone: 'afrique', programme: false, actif: true },
    { code: 'GN', nom: 'Guinée', devise: 'GNF', codeDevise: 'GNF', zone: 'afrique', programme: false, actif: true },
    { code: 'GW', nom: 'Guinée-Bissau', devise: 'FCFA', codeDevise: 'XOF', zone: 'afrique', programme: false, actif: true },
    { code: 'GM', nom: 'Gambie', devise: 'GMD', codeDevise: 'GMD', zone: 'afrique', programme: false, actif: true },
    { code: 'LR', nom: 'Libéria', devise: 'LR$', codeDevise: 'LRD', zone: 'afrique', programme: false, actif: true },
    { code: 'SL', nom: 'Sierra Leone', devise: 'SLE', codeDevise: 'SLE', zone: 'afrique', programme: false, actif: true },
    { code: 'NG', nom: 'Nigéria', devise: '₦', codeDevise: 'NGN', zone: 'afrique', programme: false, actif: true },
    { code: 'GH', nom: 'Ghana', devise: 'GHS', codeDevise: 'GHS', zone: 'afrique', programme: false, actif: true },
    { code: 'CV', nom: 'Cap-Vert', devise: 'CVE', codeDevise: 'CVE', zone: 'afrique', programme: false, actif: true },

    // ── Afrique centrale ─────────────────────────────────────────
    { code: 'CM', nom: 'Cameroun', devise: 'FCFA', codeDevise: 'XAF', zone: 'afrique', programme: false, actif: true },
    { code: 'CF', nom: 'République centrafricaine', devise: 'FCFA', codeDevise: 'XAF', zone: 'afrique', programme: false, actif: true },
    { code: 'CG', nom: 'Congo', devise: 'FCFA', codeDevise: 'XAF', zone: 'afrique', programme: false, actif: true },
    { code: 'TD', nom: 'Tchad', devise: 'FCFA', codeDevise: 'XAF', zone: 'afrique', programme: false, actif: true },
    { code: 'GA', nom: 'Gabon', devise: 'FCFA', codeDevise: 'XAF', zone: 'afrique', programme: false, actif: true },
    { code: 'GQ', nom: 'Guinée équatoriale', devise: 'FCFA', codeDevise: 'XAF', zone: 'afrique', programme: false, actif: true },
    { code: 'ST', nom: 'Sao Tomé-et-Principe', devise: 'Db', codeDevise: 'STN', zone: 'afrique', programme: false, actif: true },
    { code: 'CD', nom: 'RD Congo', devise: 'CDF', codeDevise: 'CDF', zone: 'afrique', programme: false, actif: true },
    { code: 'AO', nom: 'Angola', devise: 'Kz', codeDevise: 'AOA', zone: 'afrique', programme: false, actif: true },

    // ── Afrique de l'Est ─────────────────────────────────────────
    { code: 'ET', nom: 'Éthiopie', devise: 'ETB', codeDevise: 'ETB', zone: 'afrique', programme: false, actif: true },
    { code: 'KE', nom: 'Kenya', devise: 'KSh', codeDevise: 'KES', zone: 'afrique', programme: false, actif: true },
    { code: 'TZ', nom: 'Tanzanie', devise: 'TSh', codeDevise: 'TZS', zone: 'afrique', programme: false, actif: true },
    { code: 'UG', nom: 'Ouganda', devise: 'USh', codeDevise: 'UGX', zone: 'afrique', programme: false, actif: true },
    { code: 'RW', nom: 'Rwanda', devise: 'FRw', codeDevise: 'RWF', zone: 'afrique', programme: false, actif: true },
    { code: 'BI', nom: 'Burundi', devise: 'FBu', codeDevise: 'BIF', zone: 'afrique', programme: false, actif: true },
    { code: 'SO', nom: 'Somalie', devise: 'Sh', codeDevise: 'SOS', zone: 'afrique', programme: false, actif: true },
    { code: 'DJ', nom: 'Djibouti', devise: 'Fdj', codeDevise: 'DJF', zone: 'afrique', programme: false, actif: true },
    { code: 'ER', nom: 'Érythrée', devise: 'Nfk', codeDevise: 'ERN', zone: 'afrique', programme: false, actif: true },
    { code: 'SS', nom: 'Soudan du Sud', devise: '£', codeDevise: 'SSP', zone: 'afrique', programme: false, actif: true },
    { code: 'KM', nom: 'Comores', devise: 'CF', codeDevise: 'KMF', zone: 'afrique', programme: false, actif: true },

    // ── Afrique du Nord ──────────────────────────────────────────
    { code: 'MA', nom: 'Maroc', devise: 'DH', codeDevise: 'MAD', zone: 'afrique', programme: false, actif: true },
    { code: 'DZ', nom: 'Algérie', devise: 'DA', codeDevise: 'DZD', zone: 'afrique', programme: false, actif: true },
    { code: 'TN', nom: 'Tunisie', devise: 'DT', codeDevise: 'TND', zone: 'afrique', programme: false, actif: true },
    { code: 'EG', nom: 'Égypte', devise: 'E£', codeDevise: 'EGP', zone: 'afrique', programme: false, actif: true },
    { code: 'LY', nom: 'Libye', devise: 'LD', codeDevise: 'LYD', zone: 'afrique', programme: false, actif: true },
    { code: 'SD', nom: 'Soudan', devise: 'ج.س', codeDevise: 'SDG', zone: 'afrique', programme: false, actif: true },

    // ── Afrique australe et océan Indien ─────────────────────────
    { code: 'ZA', nom: 'Afrique du Sud', devise: 'R', codeDevise: 'ZAR', zone: 'afrique', programme: false, actif: true },
    { code: 'NA', nom: 'Namibie', devise: 'N$', codeDevise: 'NAD', zone: 'afrique', programme: false, actif: true },
    { code: 'BW', nom: 'Botswana', devise: 'P', codeDevise: 'BWP', zone: 'afrique', programme: false, actif: true },
    { code: 'ZW', nom: 'Zimbabwe', devise: 'US$', codeDevise: 'ZWL', zone: 'afrique', programme: false, actif: true },
    { code: 'MZ', nom: 'Mozambique', devise: 'MT', codeDevise: 'MZN', zone: 'afrique', programme: false, actif: true },
    { code: 'MW', nom: 'Malawi', devise: 'MK', codeDevise: 'MWK', zone: 'afrique', programme: false, actif: true },
    { code: 'ZM', nom: 'Zambie', devise: 'ZK', codeDevise: 'ZMW', zone: 'afrique', programme: false, actif: true },
    { code: 'MG', nom: 'Madagascar', devise: 'Ar', codeDevise: 'MGA', zone: 'afrique', programme: false, actif: true },
    { code: 'MU', nom: 'Maurice', devise: 'Rs', codeDevise: 'MUR', zone: 'afrique', programme: false, actif: true },
    { code: 'SC', nom: 'Seychelles', devise: 'SR', codeDevise: 'SCR', zone: 'afrique', programme: false, actif: true },
    { code: 'LS', nom: 'Lesotho', devise: 'L', codeDevise: 'LSL', zone: 'afrique', programme: false, actif: true },
    { code: 'SZ', nom: 'Eswatini', devise: 'E', codeDevise: 'SZL', zone: 'afrique', programme: false, actif: true },

    // ── Reste du monde ────────────────────────────────────────────
    { code: 'FR', nom: 'France', devise: '€', codeDevise: 'EUR', zone: 'monde', programme: false, actif: true },
    { code: 'BE', nom: 'Belgique', devise: '€', codeDevise: 'EUR', zone: 'monde', programme: false, actif: true },
    { code: 'CA', nom: 'Canada', devise: '$', codeDevise: 'CAD', zone: 'monde', programme: false, actif: true },
    { code: 'CH', nom: 'Suisse', devise: 'CHF', codeDevise: 'CHF', zone: 'monde', programme: false, actif: true },
    { code: 'US', nom: 'États-Unis', devise: '$', codeDevise: 'USD', zone: 'monde', programme: false, actif: true },
    { code: 'GB', nom: 'Royaume-Uni', devise: '£', codeDevise: 'GBP', zone: 'monde', programme: false, actif: true },
    { code: 'ES', nom: 'Espagne', devise: '€', codeDevise: 'EUR', zone: 'monde', programme: false, actif: true },
    { code: 'IT', nom: 'Italie', devise: '€', codeDevise: 'EUR', zone: 'monde', programme: false, actif: true },
    { code: 'PT', nom: 'Portugal', devise: '€', codeDevise: 'EUR', zone: 'monde', programme: false, actif: true },
    { code: 'BR', nom: 'Brésil', devise: 'R$', codeDevise: 'BRL', zone: 'monde', programme: false, actif: true },
    { code: 'IN', nom: 'Inde', devise: '₹', codeDevise: 'INR', zone: 'monde', programme: false, actif: true },
    { code: 'CN', nom: 'Chine', devise: '¥', codeDevise: 'CNY', zone: 'monde', programme: false, actif: true },
    { code: 'RU', nom: 'Russie', devise: '₽', codeDevise: 'RUB', zone: 'monde', programme: false, actif: true }
  ];

  // La langue d'enseignement de chaque pays est déduite de son pays
  // (tableau LANGUE_PAR_PAYS) : elle pilote la langue du site ET celle
  // des cours, exercices et réponses du tuteur IA.
  PAYS_DISPONIBLES.forEach(p => {
    p.langue = LANGUE_PAR_PAYS[p.code] || 'fr';
  });

  // ── Langues du site ─────────────────────────────────────────────
  // Chaque pays impose sa langue d'enseignement : le site (boutons,
  // formulaires, bandeaux) ET le contenu des cours, des exercices et
  // des réponses du tuteur IA sont produits dans cette langue.
  //
  // `fr` est la langue de référence (source de vérité des libellés).
  // Une clé absente d'une langue retombe sur `en`, puis sur `fr`.
  const LANGUES = {
    fr: {
      nom: 'Français',
      dir: 'ltr',
      instructionIA: 'Rédige l\'intégralité de ta réponse en français.',
      ui: {
        'nav.signin': 'Se connecter / S\'inscrire',
        'nav.space': '👤 Mon Espace Élève',
        'nav.admin': '⚙️ Espace Admin',
        'nav.logout': 'Déconnexion',
        'hero.title': 'Révise intelligemment pour réussir tes examens.',
        'hero.title1': 'Révise intelligemment pour',
        'hero.title2': 'réussir tes examens.',
        'hero.sub': 'Fiches synthétiques, résumés de cours et QCM interactifs pour le Brevet (3ème) et le BAC.',
        'hero.guide': 'Guide Vidéo (1 min) : Comment réussir avec Revizy ?',
        'hero.search': 'Que veux-tu réviser aujourd\'hui ? (ex: Pythagore, Génétique...)',
        'hero.cta': 'Commencer gratuitement',
        'hero.statFiches': 'Fiches PDF',
        'hero.statQcm': 'QCM Corrigés',
        'hero.statTaux': 'Taux de réussite',
        'lib.bibliotheque': 'Bibliothèque de Révision',
        'lib.bibliothequeSub': 'Sélectionne ton examen et commence à réviser.',
        'chat.aide': "Besoin d'aide ?",
        'pricing.badge': '💎 FORMULES SANS ENGAGEMENT',
        'pricing.title': 'Tarifs clairs & Abonnements Mensuels Illimités',
        'pricing.sub': 'Profite de 3 chapitres gratuits par matière, puis choisis la liberté à la pièce ou l\'accès total illimité.',
        'pricing.decouverte': '3 Chapitres Gratuits',
        'pricing.decouverteSub': 'Idéal pour tester la qualité pédagogique de chaque discipline sans payer un franc.',
        'pricing.passBrevet': 'Abonnement Mensuel 3ème',
        'pricing.passBrevetSub': 'Débloque l\'intégralité du programme officiel du BEPC en illimité.',
        'pricing.passBac': 'Abonnement Mensuel BAC',
        'pricing.passBacSub': 'Accès illimité à toutes les séries BAC : A, B, C, D et G.',
        'pricing.ctaBrevet': 'Activer Pass Brevet',
        'pricing.ctaBac': 'Activer Pass BAC',
        'pricing.perMonth': '/ mois',
        'pricing.free': '3 premiers chapitres de chaque matière',
        'pricing.qcm': '50 QCM et Vrai/Faux avec corrigés détaillés',
        'pricing.fiches': 'Fiches de cours synthétiques + Exemples résolus',
        'pricing.ia': 'Assistant IA de révision 24h/24',
        'pricing.unlock': '100% des chapitres débloqués',
        'pricing.ia2': 'Accès illimité pendant 30 jours',
        'banner.title': 'Programme officiel {pays} bientôt disponible.',
        'banner.body': 'Tu es en {pays} — les prix sont affichés en {devise}. En attendant la publication du programme {pays}, tu révises sur le programme officiel disponible (Bénin). Le contenu {pays} se chargera automatiquement ici dès sa mise en ligne.',
        'auth.signupNote': 'Création d\'un compte élève uniquement.',
        'auth.name': 'Nom complet',
        'auth.email': 'Adresse email',
        'auth.password': 'Mot de passe',
        'auth.passwordConfirm': 'Confirmer le mot de passe',
        'auth.classe': 'Ma classe',
        'auth.serie': 'Ma série',
        'auth.pays': 'Mon pays',
        'auth.paysHint': 'Le programme officiel et les prix sont adaptés à ton pays. Les pays africains sont proposés en premier.',
        'auth.create': 'Créer mon compte',
        'auth.login': 'Se connecter',
        'dash.welcome': 'Ravi de te revoir ! 👋',
        'dash.pays': 'Ton pays :',
        'dash.classe': 'Ta classe :',
        'dash.modifier': 'Modifier',
        'dash.compteActif': 'Compte Élève Actif',
        'exercices.titre': 'Exercices du chapitre',
        'exercices.info': 'exercices affichés',
        'exercices.preparation': 'Exercices en préparation…',
        'exercices.lot': 'Questions {de} à {au}',
        'exercices.clic': '(cliquez pour afficher)',
        'exercices.resume': '{n} exercices QCM / Vrai-Faux pour ce chapitre',
        'exercices.partage': '(banque partagée)',
        'exercices.generes': '(générés pour vous)',
        'exercices.cache': '(cache local)',
        'exercices.local': '(hors-ligne)',
        'quota.titre': 'Mode hors-ligne (quota IA atteint)',
        'quota.corps': "Le quota d'IA du jour est atteint : ce contenu provient de ton cache local. Les nouveaux chapitres seront générés automatiquement dans {minutes} minutes.",
        'cours.introTitre': 'Introduction et méthode de travail',
        'cours.intro': "Bienvenue dans le cours de {matiere} pour {pays}.\n\n🎯 Objectifs :\n• Maîtriser les notions du programme officiel de {pays}\n• Développer la méthode de résolution de problèmes\n• S'entraîner avec les QCM et exercices de chaque chapitre\n\n📚 Méthode de travail :\n1. Lire le cours et retenir les définitions clés\n2. Comprendre les exemples et la méthode de rédaction\n3. S'entraîner sur les exercices du chapitre\n4. Revenir sur les acquis chaque semaine",
        'cours.chapitre': '📚 {titre}\n\nCe chapitre suit le programme officiel de {pays}. Le contenu détaillé est en cours de préparation.',
        'cours.exempleTitre': 'Exemple guidé',
        'cours.exempleEnonce': 'Énoncé type examen.',
        'cours.exempleSolution': 'Correction détaillée.',
        'chat.titre': 'Assistant Revizy AI',
        'chat.bienvenue': 'Salut ! 👋 Bloqué sur un exercice ou une question ? Pose-moi ton problème !',
        'chat.placeholder': 'Pose ta question...',
        'chat.suggestion1': 'Explique le théorème de Pythagore',
        'chat.suggestion2': "C'est quoi la photosynthèse ?",
        'chat.suggestion3': 'Rappelle-moi les lois de Newton',
        'chat.suggestion4': 'Comment calculer une dérivée ?',
        'chat.suggestion5': 'Aide-moi en économie (offre/demande)',
        'chat.rateLimit': "⏳ Tu as posé beaucoup de questions d'affilée. Patiente quelques minutes, puis réessaie.",
        'chat.indisponible': "⚠️ Le tuteur IA est momentanément indisponible : voici une réponse de secours. Réessaie dans quelques instants.",
        'chat.sansReponse': "Désolé, je n'ai pas de réponse précise pour ça dans ma base de connaissances locale. 🤔\n\nNiveau actuel : {niveau}\n\nEssaie de me poser une question sur un cours précis, ou clique sur une suggestion ci-dessus. Tu peux aussi ouvrir tes fiches dans « Mes Cours » ou faire un QCM !",
        'chat.fiche': '📘 Fiche de révision (base de connaissances locale) :'
      }
    },
    en: {
      nom: 'English',
      dir: 'ltr',
      instructionIA: 'Write your entire answer in English.',
      ui: {
        'nav.signin': 'Sign in / Sign up',
        'nav.space': '👤 My learning space',
        'nav.admin': '⚙️ Admin area',
        'nav.logout': 'Log out',
        'hero.title': 'Revise smarter to pass your exams.',
        'hero.title1': 'Revise smarter to',
        'hero.title2': 'pass your exams.',
        'hero.sub': 'Clear revision notes, course summaries and interactive quizzes for the Brevet (3rd year) and the BAC.',
        'hero.guide': 'Video guide (1 min): how to succeed with Revizy?',
        'hero.search': 'What do you want to revise today? (e.g. Pythagoras, Genetics...)',
        'hero.cta': 'Start for free',
        'hero.statFiches': 'PDF lessons',
        'hero.statQcm': 'Quizzes with answers',
        'hero.statTaux': 'Success rate',
        'lib.bibliotheque': 'Revision Library',
        'lib.bibliothequeSub': 'Choose your exam and start revising.',
        'chat.aide': 'Need help?',
        'pricing.badge': '💎 NO COMMITMENT PLANS',
        'pricing.title': 'Clear prices & unlimited monthly plans',
        'pricing.sub': 'Get 3 free chapters in every subject, then pay per chapter or unlock everything.',
        'pricing.decouverte': '3 Free Chapters',
        'pricing.decouverteSub': 'The ideal way to test the teaching quality of every subject without paying a cent.',
        'pricing.passBrevet': 'Monthly plan — 3rd year',
        'pricing.passBrevetSub': 'Unlock the entire official Brevet programme.',
        'pricing.passBac': 'Monthly plan — BAC',
        'pricing.passBacSub': 'Unlimited access to all BAC series: A, B, C, D and G.',
        'pricing.ctaBrevet': 'Activate the Brevet plan',
        'pricing.ctaBac': 'Activate the BAC plan',
        'pricing.perMonth': '/ month',
        'pricing.free': 'First 3 chapters of every subject',
        'pricing.qcm': '50 multiple-choice and true/false questions with detailed answers',
        'pricing.fiches': 'Revision notes + worked examples',
        'pricing.ia': 'AI revision assistant, 24/7',
        'pricing.unlock': '100% of chapters unlocked',
        'pricing.ia2': 'Unlimited access for 30 days',
        'banner.title': 'The official {pays} programme is coming soon.',
        'banner.body': 'You are in {pays} — prices are shown in {devise}. Until the {pays} programme is published, you revise with the official programme available (Benin). The {pays} content will load here automatically as soon as it is online.',
        'auth.signupNote': 'Student account only.',
        'auth.name': 'Full name',
        'auth.email': 'Email address',
        'auth.password': 'Password',
        'auth.passwordConfirm': 'Confirm password',
        'auth.classe': 'My class',
        'auth.serie': 'My series',
        'auth.pays': 'My country',
        'auth.paysHint': 'The official programme and the prices adapt to your country. African countries come first.',
        'auth.create': 'Create my account',
        'auth.login': 'Sign in',
        'dash.welcome': 'Welcome back! 👋',
        'dash.pays': 'Your country:',
        'dash.classe': 'Your class:',
        'dash.modifier': 'Change',
        'dash.compteActif': 'Active student account',
        'exercices.titre': 'Chapter exercises',
        'exercices.info': 'exercises displayed',
        'exercices.preparation': 'Preparing exercises…',
        'exercices.lot': 'Questions {de} to {au}',
        'exercices.clic': '(click to display)',
        'exercices.resume': '{n} QCM / True-False exercises for this chapter',
        'exercices.partage': '(shared bank)',
        'exercices.generes': '(generated for you)',
        'exercices.cache': '(local cache)',
        'exercices.local': '(offline)',
        'quota.titre': 'Offline mode (AI quota reached)',
        'quota.corps': 'The daily AI quota is reached: this content comes from your local cache. New chapters will be generated automatically in {minutes} minutes.',
        'cours.introTitre': 'Introduction and study method',
        'cours.intro': "Welcome to the {matiere} course for {pays}.\n\n🎯 Goals:\n• Master the topics of the official {pays} programme\n• Build a solid problem-solving method\n• Practise with the quizzes and exercises of every chapter\n\n📚 How to study:\n1. Read the lesson and note the key definitions\n2. Understand the worked examples and the writing method\n3. Practise with the chapter exercises\n4. Review what you have learnt every week",
        'cours.chapitre': '📚 {titre}\n\nThis chapter follows the official {pays} programme. The detailed content is being prepared.',
        'cours.exempleTitre': 'Worked example',
        'cours.exempleEnonce': 'Typical exam question.',
        'cours.exempleSolution': 'Detailed answer.',
        'chat.titre': 'Revizy AI Assistant',
        'chat.bienvenue': 'Hi there! 👋 Stuck on an exercise or a question? Tell me your problem!',
        'chat.placeholder': 'Ask your question...',
        'chat.suggestion1': 'Explain the Pythagorean theorem',
        'chat.suggestion2': 'What is photosynthesis?',
        'chat.suggestion3': 'Remind me of Newton’s laws',
        'chat.suggestion4': 'How do I calculate a derivative?',
        'chat.suggestion5': 'Help me with economics (supply/demand)',
        'chat.rateLimit': "⏳ You have asked a lot of questions in a row. Wait a few minutes, then try again.",
        'chat.indisponible': "⚠️ The AI tutor is temporarily unavailable: here is a fallback answer. Try again in a few moments.",
        'chat.sansReponse': "Sorry, I don't have a precise answer for that in my local knowledge base. 🤔\n\nCurrent level: {niveau}\n\nTry asking me about a specific lesson, or click a suggestion below. You can also open your sheets in “My Courses” or do a quiz!",
        'chat.fiche': '📘 Revision sheet (local knowledge base):'
      }
    },
    ar: {
      nom: 'العربية',
      dir: 'rtl',
      instructionIA: 'اكتب جوابك بالكامل باللغة العربية.',
      ui: {
        'nav.signin': 'تسجيل الدخول / إنشاء حساب',
        'nav.space': '👤 مساحتي التعليمية',
        'nav.admin': '⚙️ فضاء الإدارة',
        'nav.logout': 'تسجيل الخروج',
        'hero.title': 'راجع بذكاء لنجح في امتحاناتك.',
        'hero.title1': 'راجع بذكاء',
        'hero.title2': 'لتنجح في امتحاناتك.',
        'hero.sub': 'ملخصات الدروس والمواد المراجعة واختبارات تفاعلية لشهادة التعليم المتوسط وال bac.',
        'hero.guide': 'دليل فيديو (دقيقة واحدة): كيف تنجح مع Revizy؟',
        'hero.search': 'ما الذي تريد مراجعته اليوم؟ (مثال: فيثاغورس، وراثة...)',
        'hero.cta': 'ابدأ مجاناً',
        'hero.statFiches': 'مذكرات PDF',
        'hero.statQcm': 'اختبارات مصححة',
        'hero.statTaux': 'نسبة النجاح',
        'lib.bibliotheque': 'مكتبة المراجعة',
        'lib.bibliothequeSub': 'اختر امتحانك وابدأ المراجعة.',
        'chat.aide': 'هل تحتاج إلى مساعدة؟',
        'pricing.badge': '💎 عروض بدون التزام',
        'pricing.title': 'أسعار واضحة واشتراكات شهرية غير محدودة',
        'pricing.sub': 'استفد من 3 فصول مجانية في كل مادة، ثم اختر الدفع لكل فصل أو الوصول الكامل.',
        'pricing.decouverte': '3 فصول مجانية',
        'pricing.decouverteSub': 'الطريقة المثالية لاختبار جودة التعليم في كل مادة دون دفع أي مبلغ.',
        'pricing.passBrevet': 'اشتراك شهري — السنة الثالثة',
        'pricing.passBrevetSub': 'افتح كامل البرنامج الرسمي لشهادة التعليم المتوسط.',
        'pricing.passBac': 'اشتراك شهري — البكالوريا',
        'pricing.passBacSub': 'وصول غير محدود إلى كل فروع البكالوريا: A، B، C، D و G.',
        'pricing.ctaBrevet': 'تفعيل اشتراك التخرج',
        'pricing.ctaBac': 'تفعيل اشتراك البكالوريا',
        'pricing.perMonth': '/ شهر',
        'banner.title': 'البرنامج الرسمي لـ {pays} سيتوفر قريباً.',
        'banner.body': 'أنت في {pays} — الأسعار معروضة بـ {devise}. إلى حين نشر برنامج {pays}،ستراجع البرنامج الرسمي المتاح (بنين). سيُحمَّل محتوى {pays} هنا تلقائياً عند توفره.',
        'auth.name': 'الاسم الكامل',
        'auth.email': 'البريد الإلكتروني',
        'auth.password': 'كلمة المرور',
        'auth.passwordConfirm': 'تأكيد كلمة المرور',
        'auth.classe': 'فوجي',
        'auth.serie': 'السلسلة',
        'auth.pays': 'بلدي',
        'auth.paysHint': 'البرنامج الرسمي والأسعار تتكيف مع بلدك. تُعرض الدول الأفريقية أولاً.',
        'auth.create': 'إنشاء حسابي',
        'auth.login': 'تسجيل الدخول',
        'dash.welcome': 'مرحباً بعودتك! 👋',
        'dash.pays': 'بلدك:',
        'dash.classe': 'فوجك:',
        'dash.modifier': 'تغيير',
        'dash.compteActif': 'حساب تلميذ نشط',
        'exercices.titre': 'تمارين الفصل',
        'exercices.info': 'تمارين معروضة',
        'exercices.preparation': 'جارٍ تحضير التمارين…',
        'exercices.lot': 'الأسئلة {de} إلى {au}',
        'exercices.clic': '(انقر للعرض)',
        'exercices.resume': '{n} تمارين اختيار من متعدد / صح وخطأ لهذا الفصل',
        'exercices.partage': '(بنك مشترك)',
        'exercices.generes': '(مولّدة لك)',
        'exercices.cache': '(ذاكرة التخزين المحلية)',
        'exercices.local': '(دون اتصال)',
        'quota.titre': 'وضع عدم الاتصال (تم بلوغ حصة الذكاء الاصطناعي)',
        'quota.corps': 'تم بلوغ حصة الذكاء الاصطناعي اليومية: هذا المحتوى يأتي من ذاكرة التخزين المحلية. سيتم توليد الفصول الجديدة تلقائيًا خلال {minutes} دقيقة.',
        'chat.titre': 'مساعد Revizy الذكي',
        'chat.bienvenue': 'مرحباً! 👋 هل علقت في تمرين أو سؤال؟ أخبرني بالمشكلة!',
        'chat.placeholder': 'اكتب سؤالك...',
        'chat.suggestion1': 'اشرح مبرهنة فيثاغورس',
        'chat.suggestion2': 'ما هو التمثيل الضوئي؟',
        'chat.suggestion3': 'ذكّرني بقوانين نيوتن',
        'chat.suggestion4': 'كيف أحسب المشتقة؟',
        'chat.suggestion5': 'ساعدني في الاقتصاد (العرض/الطلب)',
        'chat.rateLimit': '⏳ طرحت أسئلة كثيرة متتالية. انتظر بضع دقائق ثم أعد المحاولة.',
        'chat.indisponible': '⚠️ المعلم الذكي غير متاح مؤقتاً: إليك إجابة احتياطية. أعد المحاولة بعد قليل.',
        'chat.sansReponse': "عذراً، لا لدي جواب دقيق لهذا في قاعدة معرفتي المحلية. 🤔\n\nالمستوى الحالي: {niveau}\n\nاسألني عن درس محدد، أو اضغط على أحد الاقتراحات. يمكنك أيضاً فتح ملخصاتك في «دروسي» أو حل اختبار!",
        'chat.fiche': '📘 ملخص المراجعة (قاعدة المعرفة المحلية):'
      }
    },
    pt: {
      nom: 'Português',
      dir: 'ltr',
      instructionIA: 'Escreva toda a sua resposta em português.',
      ui: {
        'nav.signin': 'Entrar / Criar conta',
        'nav.space': '👤 Meu espaço de aprendizagem',
        'nav.admin': '⚙️ Área do administrador',
        'nav.logout': 'Sair',
        'hero.title': 'Estude de forma inteligente para passar nos exames.',
        'hero.title1': 'Estude de forma inteligente',
        'hero.title2': 'para passar nos exames.',
        'hero.sub': 'Resumos de aulas, sínteses e(questionários) interativos para o Brevet (3.º ano) e o BAC.',
        'hero.guide': 'Guia em vídeo (1 min): como ter sucesso com o Revizy?',
        'hero.search': 'O que queres estudar hoje? (ex.: Pitágoras, Genética...)',
        'hero.cta': 'Começar grátis',
        'hero.statFiches': 'Aulas em PDF',
        'hero.statQcm': 'Questionários corrigidos',
        'hero.statTaux': 'Taxa de sucesso',
        'lib.bibliotheque': 'Biblioteca de Revisão',
        'lib.bibliothequeSub': 'Escolhe o teu exame e começa a estudar.',
        'chat.aide': 'Precisas de ajuda?',
        'pricing.badge': '💎 PLANOS SEM COMPROMISSO',
        'pricing.title': 'Preços claros e planos mensais ilimitados',
        'pricing.sub': 'Aproveita 3 capítulos grátis em cada disciplina e escolhe pagar por capítulo ou desbloquear tudo.',
        'pricing.decouverte': '3 Capítulos Grátis',
        'pricing.decouverteSub': 'A forma ideal de testar a qualidade pedagógica de cada disciplina sem pagar nada.',
        'pricing.passBrevet': 'Plano Mensal — 3.º ano',
        'pricing.passBrevetSub': 'Desbloqueia todo o programa oficial do Brevet.',
        'pricing.passBac': 'Plano Mensal — BAC',
        'pricing.passBacSub': 'Acesso ilimitado a todas as séries do BAC: A, B, C, D e G.',
        'pricing.ctaBrevet': 'Ativar o plano Brevet',
        'pricing.ctaBac': 'Ativar o plano BAC',
        'pricing.perMonth': '/ mês',
        'banner.title': 'O programa oficial de {pays} chega em breve.',
        'banner.body': 'Estás em {pays} — os preços são exibidos em {devise}. Até a publicação do programa de {pays}, estudas pelo programa oficial disponível (Benim). O conteúdo de {pays} será carregado aqui automaticamente assim que estiver disponível.',
        'auth.name': 'Nome completo',
        'auth.email': 'Endereço de e-mail',
        'auth.password': 'Palavra-passe',
        'auth.passwordConfirm': 'Confirmar palavra-passe',
        'auth.classe': 'A minha turma',
        'auth.serie': 'A minha série',
        'auth.pays': 'O meu país',
        'auth.paysHint': 'O programa oficial e os preços adaptam-se ao teu país. Os países africanos aparecem primeiro.',
        'auth.create': 'Criar a minha conta',
        'auth.login': 'Entrar',
        'dash.welcome': 'Bem-vindo de volta! 👋',
        'dash.pays': 'O teu país:',
        'dash.classe': 'A tua turma:',
        'dash.modifier': 'Alterar',
        'dash.compteActif': 'Conta de aluno ativa',
        'exercices.titre': 'Exercícios do capítulo',
        'exercices.info': 'exercícios apresentados',
        'exercices.preparation': 'A preparar exercícios…',
        'exercices.lot': 'Perguntas {de} a {au}',
        'exercices.clic': '(clique para mostrar)',
        'exercices.resume': '{n} exercícios de múltipla escolha / verdadeiro-falso para este capítulo',
        'exercices.partage': '(banco compartilhado)',
        'exercices.generes': '(gerados para você)',
        'exercices.cache': '(cache local)',
        'exercices.local': '(offline)',
        'quota.titre': 'Modo offline (cota de IA atingida)',
        'quota.corps': 'A cota diária de IA foi atingida: este conteúdo vem do seu cache local. Os novos capítulos serão gerados automaticamente em {minutes} minutos.',
        'chat.titre': 'Assistente Revizy IA',
        'chat.bienvenue': 'Olá! 👋 Com dificuldade num exercício ou numa dúvida? Explica-me o teu problema!',
        'chat.placeholder': 'Escreve a tua pergunta...',
        'chat.suggestion1': 'Explica o teorema de Pitágoras',
        'chat.suggestion2': 'O que é a fotossíntese?',
        'chat.suggestion3': 'Lembra-me as leis de Newton',
        'chat.suggestion4': 'Como se calcula uma derivada?',
        'chat.suggestion5': 'Ajuda-me em economia (oferta/procura)',
        'chat.rateLimit': '⏳ Fizeste muitas perguntas seguidas. Espera alguns minutos e tenta outra vez.',
        'chat.indisponible': '⚠️ O tutor de IA está temporariamente indisponível: aqui tens uma resposta de reserva. Tenta outra vez daqui a pouco.',
        'chat.sansReponse': "Desculpa, não tenho uma resposta precisa para isso na minha base de conhecimento local. 🤔\n\nNível atual: {niveau}\n\nTenta perguntar-me sobre uma aula específica, ou clica numa sugestão. Também podes abrir os teus resumos em «Os Meus Cursos» ou fazer um quiz!",
        'chat.fiche': '📘 Ficha de revisão (base de conhecimento local):'
      }
    },
    es: {
      nom: 'Español',
      dir: 'ltr',
      instructionIA: 'Escribe toda tu respuesta en español.',
      ui: {
        'nav.signin': 'Iniciar sesión / Registrarse',
        'nav.space': '👤 Mi espacio de aprendizaje',
        'nav.admin': '⚙️ Área del administrador',
        'nav.logout': 'Cerrar sesión',
        'hero.title': 'Estudia mejor para aprobar tus exámenes.',
        'hero.title1': 'Estudia mejor',
        'hero.title2': 'para aprobar tus exámenes.',
        'hero.sub': 'Resúmenes de lecciones, fichas y cuestionarios interactivos para el Brevet (3.º) y el BAC.',
        'hero.guide': 'Guía en vídeo (1 min): ¿cómo aprobar con Revizy?',
        'hero.search': '¿Qué quieres estudiar hoy? (ej.: Pitágoras, Genética...)',
        'hero.cta': 'Empezar gratis',
        'hero.statFiches': 'Fichas PDF',
        'hero.statQcm': 'Cuestionarios corregidos',
        'hero.statTaux': 'Tasa de éxito',
        'lib.bibliotheque': 'Biblioteca de Repaso',
        'lib.bibliothequeSub': 'Elige tu examen y empieza a estudiar.',
        'chat.aide': '¿Necesitas ayuda?',
        'pricing.badge': '💎 PLANES SIN COMPROMISO',
        'pricing.title': 'Precios claros y planes mensuales ilimitados',
        'pricing.sub': 'Disfruta de 3 capítulos gratis por asignatura y elige pagar por capítulo o desbloquearlo todo.',
        'pricing.decouverte': '3 Capítulos Gratis',
        'pricing.decouverteSub': 'La forma ideal de probar la calidad de cada asignatura sin pagar nada.',
        'pricing.passBrevet': 'Plan Mensual — 3.º',
        'pricing.passBrevetSub': 'Desbloquea todo el programa oficial del Brevet.',
        'pricing.passBac': 'Plan Mensual — BAC',
        'pricing.passBacSub': 'Acceso ilimitado a todas las series del BAC: A, B, C, D y G.',
        'pricing.ctaBrevet': 'Activar el plan Brevet',
        'pricing.ctaBac': 'Activar el plan BAC',
        'pricing.perMonth': '/ mes',
        'banner.title': 'El programa oficial de {pays} llegará pronto.',
        'banner.body': 'Estás en {pays} — los precios se muestran en {devise}. Hasta que se publique el programa de {pays}, estudiarás con el programa oficial disponible (Benín). El contenido de {pays} se cargará aquí automáticamente en cuanto esté disponible.',
        'auth.name': 'Nombre completo',
        'auth.email': 'Correo electrónico',
        'auth.password': 'Contraseña',
        'auth.passwordConfirm': 'Confirmar contraseña',
        'auth.classe': 'Mi clase',
        'auth.serie': 'Mi serie',
        'auth.pays': 'Mi país',
        'auth.paysHint': 'El programa oficial y los precios se adaptan a tu país. Los países africanos aparecen primero.',
        'auth.create': 'Crear mi cuenta',
        'auth.login': 'Iniciar sesión',
        'dash.welcome': '¡Hola de nuevo! 👋',
        'dash.pays': 'Tu país:',
        'dash.classe': 'Tu clase:',
        'dash.modifier': 'Cambiar',
        'dash.compteActif': 'Cuenta de estudiante activa',
        'exercices.titre': 'Ejercicios del capítulo',
        'exercices.info': 'ejercicios mostrados',
        'exercices.preparation': 'Preparando ejercicios…',
        'exercices.lot': 'Preguntas {de} a {au}',
        'exercices.clic': '(haz clic para mostrar)',
        'exercices.resume': '{n} ejercicios de opción múltiple / verdadero-falso para este capítulo',
        'exercices.partage': '(banco compartido)',
        'exercices.generes': '(generados para ti)',
        'exercices.cache': '(caché local)',
        'exercices.local': '(sin conexión)',
        'quota.titre': 'Modo sin conexión (cuota de IA alcanzada)',
        'quota.corps': 'Se alcanzó la cuota diaria de IA: este contenido viene de tu caché local. Los nuevos capítulos se generarán automáticamente en {minutes} minutos.',
        'chat.titre': 'Asistente Revizy IA',
        'chat.bienvenue': '¡Hola! 👋 ¿Atascado con un ejercicio o una duda? ¡Cuéntame tu problema!',
        'chat.placeholder': 'Escribe tu pregunta...',
        'chat.suggestion1': 'Explica el teorema de Pitágoras',
        'chat.suggestion2': '¿Qué es la fotosíntesis?',
        'chat.suggestion3': 'Recuérdame las leyes de Newton',
        'chat.suggestion4': '¿Cómo se calcula una derivada?',
        'chat.suggestion5': 'Ayúdame en economía (oferta/demanda)',
        'chat.rateLimit': '⏳ Has hecho muchas preguntas seguidas. Espera unos minutos e inténtalo de nuevo.',
        'chat.indisponible': '⚠️ El tutor de IA no está disponible ahora mismo: aquí tienes una respuesta de respaldo. Inténtalo de nuevo en unos instantes.',
        'chat.sansReponse': "Lo siento, no tengo una respuesta precisa para eso en mi base de conocimiento local. 🤔\n\nNivel actual: {niveau}\n\nPrueba a preguntarme sobre una lección concreta, o haz clic en una sugerencia. También puedes abrir tus fichas en «Mis cursos» o hacer un cuestionario.",
        'chat.fiche': '📘 Ficha de repaso (base de conocimiento local):'
      }
    },
    it: {
      nom: 'Italiano',
      dir: 'ltr',
      instructionIA: 'Scrivi tutta la tua risposta in italiano.',
      ui: {
        'nav.signin': 'Accedi / Registrati',
        'nav.space': '👤 Il mio spazio di studio',
        'nav.admin': '⚙️ Area amministratore',
        'nav.logout': 'Esci',
        'hero.title': 'Studia in modo smart per superare gli esami.',
        'hero.title1': 'Studia in modo smart',
        'hero.title2': 'per superare gli esami.',
        'hero.sub': 'Sintesi delle lezioni, appunti e quiz interattivi per il Brevet (3ª) e il BAC.',
        'hero.guide': 'Guida video (1 min): come riuscire con Revizy?',
        'hero.search': 'Cosa vuoi studiare oggi? (es.: Pitagora, Genetica...)',
        'hero.cta': 'Inizia gratis',
        'hero.statFiches': 'Schede PDF',
        'hero.statQcm': 'Quiz con soluzioni',
        'hero.statTaux': 'Tasso di successo',
        'lib.bibliotheque': 'Biblioteca di Ripasso',
        'lib.bibliothequeSub': 'Scegli il tuo esame e inizia a studiare.',
        'chat.aide': 'Ti serve aiuto?',
        'pricing.badge': '💎 OFFERTE SENZA IMPEGNO',
        'pricing.title': 'Prezzi chiari e abbonamenti mensili illimitati',
        'pricing.sub': 'Prova 3 capitoli gratis per ogni materia, poi scegli di pagare a capitolo o sbloccare tutto.',
        'pricing.decouverte': '3 Capitoli Gratis',
        'pricing.decouverteSub': 'Il modo ideale per testare la qualità di ogni materia senza pagare nulla.',
        'pricing.passBrevet': 'Abbonamento Mensile — 3ª',
        'pricing.passBrevetSub': 'Sblocca tutto il programma ufficiale del Brevet.',
        'pricing.passBac': 'Abbonamento Mensile — BAC',
        'pricing.passBacSub': 'Accesso illimitato a tutte le serie del BAC: A, B, C, D e G.',
        'pricing.ctaBrevet': 'Attiva il piano Brevet',
        'pricing.ctaBac': 'Attiva il piano BAC',
        'pricing.perMonth': '/ mese',
        'banner.title': 'Il programma ufficiale di {pays} è in arrivo.',
        'banner.body': 'Sei in {pays} — i prezzi sono mostrati in {devise}. Fino alla pubblicazione del programma di {pays} studierai con il programma ufficiale disponibile (Benin). I contenuti di {pays} verranno caricati qui automaticamente.',
        'auth.name': 'Nome completo',
        'auth.email': 'Indirizzo email',
        'auth.password': 'Password',
        'auth.passwordConfirm': 'Conferma password',
        'auth.classe': 'La mia classe',
        'auth.serie': 'La mia serie',
        'auth.pays': 'Il mio paese',
        'auth.paysHint': 'Il programma ufficiale e i prezzi si adattano al tuo paese. I paesi africani compaiono per primi.',
        'auth.create': 'Crea il mio account',
        'auth.login': 'Accedi',
        'dash.welcome': 'Bentornato! 👋',
        'dash.pays': 'Il tuo paese:',
        'dash.classe': 'La tua classe:',
        'dash.modifier': 'Modifica',
        'dash.compteActif': 'Account studente attivo',
        'exercices.titre': 'Esercizi del capitolo',
        'exercices.info': 'esercizi mostrati',
        'exercices.preparation': 'Preparazione degli esercizi…',
        'exercices.lot': 'Domande {de} a {au}',
        'exercices.clic': '(clic per mostrare)',
        'exercices.resume': '{n} esercizi a scelta multipla / vero-falso per questo capitolo',
        'exercices.partage': '(banco condiviso)',
        'exercices.generes': '(generati per te)',
        'exercices.cache': '(cache locale)',
        'exercices.local': '(offline)',
        'quota.titre': 'Modalità offline (quota IA raggiunta)',
        'quota.corps': 'La quota giornaliera di IA è stata raggiunta: questo contenuto proviene dalla tua cache locale. I nuovi capitoli verranno generati automaticamente tra {minutes} minuti.',
        'chat.titre': 'Assistente Revizy IA',
        'chat.bienvenue': 'Ciao! 👋 Bloccato su un esercizio o un dubbio? Raccontami il tuo problema!',
        'chat.placeholder': 'Scrivi la tua domanda...',
        'chat.suggestion1': 'Spiega il teorema di Pitagora',
        'chat.suggestion2': 'Che cos’è la fotosintesi?',
        'chat.suggestion3': 'Ricordami le leggi di Newton',
        'chat.suggestion4': 'Come si calcola una derivata?',
        'chat.suggestion5': 'Aiutami in economia (offerta/domanda)',
        'chat.rateLimit': '⏳ Hai fatto molte domande di fila. Aspetta qualche minuto e riprova.',
        'chat.indisponible': '⚠️ Il tutor IA non è disponibile in questo momento: ecco una risposta di riserva. Riprova tra poco.',
        'chat.sansReponse': "Scusa, non ho una risposta precisa per questo nella mia base di conoscenze locale. 🤔\n\nLivello attuale: {niveau}\n\nProva a chiedermi su una lezione precisa, oppure clicca un suggerimento. Puoi anche aprire le tue schede in «I miei corsi» o fare un quiz!",
        'chat.fiche': '📘 Scheda di ripasso (base di conoscenze locale):'
      }
    },
    ru: {
      nom: 'Русский',
      dir: 'ltr',
      instructionIA: 'Отвечай полностью на русском языке.',
      ui: {
        'nav.signin': 'Войти / Зарегистрироваться',
        'nav.space': '👤 Мой учебный кабинет',
        'nav.admin': '⚙️ Раздел администратора',
        'nav.logout': 'Выйти',
        'hero.title': 'Учись умнее — сдавай экзамены.',
        'hero.title1': 'Учись умнее —',
        'hero.title2': 'сдавай экзамены.',
        'hero.sub': 'Конспекты, краткие уроки и интерактивные тесты для Brevet (3 класс) и BAC.',
        'hero.guide': 'Видео-руководство (1 мин): как преуспеть с Revizy?',
        'hero.search': 'Что ты хочешь повторить сегодня? (например: Пифагор, генетика...)',
        'hero.cta': 'Начать бесплатно',
        'hero.statFiches': 'Конспекты PDF',
        'hero.statQcm': 'Тесты с ответами',
        'hero.statTaux': 'Успеваемость',
        'lib.bibliotheque': 'Библиотека повторения',
        'lib.bibliothequeSub': 'Выбери экзамен и начни готовиться.',
        'chat.aide': 'Нужна помощь?',
        'pricing.badge': '💎 ТАРИФЫ БЕЗ ОБЯЗАТЕЛЬСТВ',
        'pricing.title': 'Понятные цены и безлимитные месячные подписки',
        'pricing.sub': 'Получи 3 бесплатных главы по каждому предмету, затем плати за главу или открой всё.',
        'pricing.decouverte': '3 главы бесплатно',
        'pricing.decouverteSub': 'Идеальный способ проверить качество материала по каждому предмету, ничего не платя.',
        'pricing.passBrevet': 'Месячная подписка — 3 класс',
        'pricing.passBrevetSub': 'Открывает всю официальную программу Brevet.',
        'pricing.passBac': 'Месячная подписка — BAC',
        'pricing.passBacSub': 'Безлимитный доступ ко всем сериям BAC: A, B, C, D и G.',
        'pricing.ctaBrevet': 'Подключить подписку Brevet',
        'pricing.ctaBac': 'Подключить подписку BAC',
        'pricing.perMonth': '/ месяц',
        'banner.title': 'Официальная программа страны {pays} скоро появится.',
        'banner.body': 'Ты в стране {pays} — цены показаны в {devise}. Пока программа {pays} не опубликована, ты готовишься по доступной официальной программе (Бенин). Содержимое {pays} загрузится здесь автоматически.',
        'auth.name': 'Полное имя',
        'auth.email': 'Электронная почта',
        'auth.password': 'Пароль',
        'auth.passwordConfirm': 'Подтвердите пароль',
        'auth.classe': 'Мой класс',
        'auth.serie': 'Моя серия',
        'auth.pays': 'Моя страна',
        'auth.paysHint': 'Официальная программа и цены адаптируются к твоей стране. Африканские страны идут первыми.',
        'auth.create': 'Создать аккаунт',
        'auth.login': 'Войти',
        'dash.welcome': 'С возвращением! 👋',
        'dash.pays': 'Твоя страна:',
        'dash.classe': 'Твой класс:',
        'dash.modifier': 'Изменить',
        'dash.compteActif': 'Активный аккаунт ученика',
        'exercices.titre': 'Упражнения к главе',
        'exercices.info': 'упражнений показано',
        'exercices.preparation': 'Готовим упражнения…',
        'exercices.lot': 'Вопросы {de}—{au}',
        'exercices.clic': '(нажмите, чтобы показать)',
        'exercices.resume': '{n} заданий с выбором ответа / верно-неверно для этой главы',
        'exercices.partage': '(общий банк)',
        'exercices.generes': '(созданы для вас)',
        'exercices.cache': '(локальный кэш)',
        'exercices.local': '(офлайн)',
        'quota.titre': 'Офлайн-режим (квота ИИ исчерпана)',
        'quota.corps': 'Дневная квота ИИ исчерпана: этот контент взят из локального кэша. Новые главы будут созданы автоматически через {minutes} минут.',
        'chat.titre': 'ИИ-помощник Revizy',
        'chat.bienvenue': 'Привет! 👋 Застрял на упражнении или вопросе? Расскажи, в чём дело!',
        'chat.placeholder': 'Напиши свой вопрос...',
        'chat.suggestion1': 'Объясни теорему Пифагора',
        'chat.suggestion2': 'Что такое фотосинтез?',
        'chat.suggestion3': 'Напомни законы Ньютона',
        'chat.suggestion4': 'Как вычислить производную?',
        'chat.suggestion5': 'Помоги с экономикой (предложение/спрос)',
        'chat.rateLimit': '⏳ Ты задал много вопросов подряд. Подожди несколько минут и попробуй снова.',
        'chat.indisponible': '⚠️ ИИ-репетитор временно недоступен: вот запасной ответ. Попробуй ещё раз через несколько минут.',
        'chat.sansReponse': "Извини, у меня нет точного ответа на это в моей локальной базе знаний. 🤔\n\nТекущий уровень: {niveau}\n\nСпроси меня про конкретный урок или нажми одну из подсказок. Ты также можешь открыть свои конспекты в «Мои курсы» или пройти тест!",
        'chat.fiche': '📘 Шпаргалка (локальная база знаний):'
      }
    },
    zh: {
      nom: '中文',
      dir: 'ltr',
      instructionIA: '请用中文完整作答。',
      ui: {
        'nav.signin': '登录 / 注册',
        'nav.space': '👤 我的学习中心',
        'nav.admin': '⚙️ 管理后台',
        'nav.logout': '退出登录',
        'hero.title': '聪明复习，考试顺利通过。',
        'hero.title1': '聪明复习，',
        'hero.title2': '考试顺利通过。',
        'hero.sub': '课程提纲、知识摘要与互动题库，助你备考 Brevet（初三）和 BAC。',
        'hero.guide': '视频指南（1 分钟）：如何用 Revizy 成功提分？',
        'hero.search': '今天想复习什么？（例如：勾股定理、遗传学……）',
        'hero.cta': '免费开始',
        'hero.statFiches': 'PDF 讲义',
        'hero.statQcm': '带解析的题库',
        'hero.statTaux': '通过率',
        'lib.bibliotheque': '复习资料库',
        'lib.bibliothequeSub': '选择你的考试，开始复习。',
        'chat.aide': '需要帮助吗？',
        'pricing.badge': '💎 无长期合约的套餐',
        'pricing.title': '清晰价格 + 无限月度套餐',
        'pricing.sub': '每科先免费解锁 3 章，之后按章付费或整套解锁。',
        'pricing.decouverte': '3 章免费',
        'pricing.decouverteSub': '零成本体验每一科的教学质量。',
        'pricing.passBrevet': '月度套餐 — 初三',
        'pricing.passBrevetSub': '解锁 Brevet 全部官方课程。',
        'pricing.passBac': '月度套餐 — BAC',
        'pricing.passBacSub': '无限访问所有 BAC 科目：A、B、C、D、G。',
        'pricing.ctaBrevet': '开通 Brevet 套餐',
        'pricing.ctaBac': '开通 BAC 套餐',
        'pricing.perMonth': '/ 月',
        'banner.title': '{pays} 官方课程即将上线。',
        'banner.body': '你当前在 {pays}，价格以 {devise} 显示。在 {pays} 课程发布前，你将使用现有官方课程（贝宁）复习。{pays} 内容上线后会自动加载到这里。',
        'auth.name': '姓名',
        'auth.email': '电子邮箱',
        'auth.password': '密码',
        'auth.passwordConfirm': '确认密码',
        'auth.classe': '我的班级',
        'auth.serie': '我的科系',
        'auth.pays': '我的国家',
        'auth.paysHint': '官方课程和价格会适应你的国家，非洲国家排在前面。',
        'auth.create': '创建账号',
        'auth.login': '登录',
        'dash.welcome': '欢迎回来！👋',
        'dash.pays': '你的国家：',
        'dash.classe': '你的班级：',
        'dash.modifier': '修改',
        'dash.compteActif': '已激活的学生账号',
        'exercices.titre': '本章练习',
        'exercices.info': '道练习已显示',
        'exercices.preparation': '正在准备练习……',
        'exercices.lot': '第 {de} 至 {au} 题',
        'exercices.clic': '（点击展开）',
        'exercices.resume': '本章 {n} 道选择题 / 判断题',
        'exercices.partage': '（共享题库）',
        'exercices.generes': '（为你生成）',
        'exercices.cache': '（本地缓存）',
        'exercices.local': '（离线）',
        'quota.titre': '离线模式（AI 配额已用尽）',
        'quota.corps': '当天的 AI 配额已用尽：当前内容来自本地缓存。新章节将在 {minutes} 分钟后自动生成。',
        'chat.titre': 'Revizy AI 助手',
        'chat.bienvenue': '你好！👋 遇到习题或问题卡住了？把你的问题告诉我！',
        'chat.placeholder': '输入你的问题……',
        'chat.suggestion1': '讲解勾股定理',
        'chat.suggestion2': '什么是光合作用？',
        'chat.suggestion3': '提醒我牛顿三大定律',
        'chat.suggestion4': '如何求导数？',
        'chat.suggestion5': '帮我讲解经济学（供给/需求）',
        'chat.rateLimit': '⏳ 你连续问了很多问题。请等几分钟后再试。',
        'chat.indisponible': '⚠️ AI 导师暂时不可用：这是备用回答。请过几分钟再试。',
        'chat.sansReponse': "抱歉，我的本地知识库里没有这个问题的准确答案。🤔\n\n当前级别：{niveau}\n\n可以问我某一课的具体内容，或点击下面的建议。你也可以在「我的课程」中打开讲义或做测验！",
        'chat.fiche': '📘 复习提纲（本地知识库）：'
      }
    }
  };

  const LANGUE_PAR_DEFAUT = 'fr';

  /**
   * Libellés des fiches de révision de secours (base de connaissances locale
   * du tuteur). Les formules sont universelles, seuls les mots-clés sont
   * traduits pour que la fiche reste lisible dans la langue du pays.
   */
  const CHAT_LIBELLES = {
    fr: { definition: 'Définition', exemple: 'Exemple', reciproque: 'Réciproque', proprietes: 'Propriétés', methodes: 'Méthodes', formules: 'Formules de base', interpretation: 'Interprétation', sommation: 'Sommation' },
    en: { definition: 'Definition', exemple: 'Example', reciproque: 'Converse', proprietes: 'Properties', methodes: 'Methods', formules: 'Basic formulas', interpretation: 'Interpretation', sommation: 'Summation' },
    ar: { definition: 'التعريف', exemple: 'مثال', reciproque: 'العكس', proprietes: 'الخصائص', methodes: 'ال طرق', formules: 'الصيغ الأساسية', interpretation: 'التفسير', sommation: 'المجموع' },
    pt: { definition: 'Definição', exemple: 'Exemplo', reciproque: 'Recíproco', proprietes: 'Propriedades', methodes: 'Métodos', formules: 'Fórmulas básicas', interpretation: 'Interpretação', sommation: 'Somatória' },
    es: { definition: 'Definición', exemple: 'Ejemplo', reciproque: 'Recíproco', proprietes: 'Propiedades', methodes: 'Métodos', formules: 'Fórmulas básicas', interpretation: 'Interpretación', sommation: 'Sumatoria' },
    it: { definition: 'Definizione', exemple: 'Esempio', reciproque: 'Reciproco', proprietes: 'Proprietà', methodes: 'Metodi', formules: 'Formule di base', interpretation: 'Interpretazione', sommation: 'Sommatoria' },
    ru: { definition: 'Определение', exemple: 'Пример', reciproque: 'Обратное', proprietes: 'Свойства', methodes: 'Методы', formules: 'Основные формулы', interpretation: 'Интерпретация', sommation: 'Суммирование' },
    zh: { definition: '定义', exemple: '示例', reciproque: '逆命题', proprietes: '性质', methodes: '方法', formules: '基本公式', interpretation: '解读', sommation: '求和' }
  };

  /** Langue d'enseignement d'un pays (jamais dérivée de l'IP). */
  function langueDe(code) {
    const c = normalizeCode(code);
    if (!c) return LANGUE_PAR_DEFAUT;
    if (LANGUE_PAR_PAYS[c]) return LANGUE_PAR_PAYS[c];
    const info = infosPays(c);
    if (info && info.langue) return info.langue;
    const ctx = CONTEXTS[c];
    if (ctx && ctx.langue) return ctx.langue;
    return LANGUE_PAR_DEFAUT;
  }

  /** Dictionnaire d'une langue (avec repli sur l'anglais puis le français). */
  function langueUI(code) {
    const l = langueDe(code);
    return LANGUES[l] || LANGUES[LANGUE_PAR_DEFAUT];
  }

  /**
   * Traduit un libellé dans la langue du pays.
   * Les paramètres {pays}, {devise} sont remplacés.
   */
  function traduire(code, cle, params = {}) {
    const langue = langueUI(code);
    const texte = (langue.ui && langue.ui[cle])
      || (LANGUES.en.ui && LANGUES.en.ui[cle])
      || (LANGUES.fr.ui && LANGUES.fr.ui[cle])
      || cle;
    return String(texte).replace(/\{(\w+)\}/g, (m, nom) => (
      Object.prototype.hasOwnProperty.call(params, nom) ? params[nom] : m
    ));
  }

  // Taux de conversion : nombre d'unités de la devise pour 1 FCFA.
  // Valeurs indicatives à mettre à jour (le FCFA est pegué à l'euro).
  const TAUX_DE_CHANGE = {
    XOF: 1, XAF: 1, EUR: 0.00152, USD: 0.00167, CAD: 0.00228, GBP: 0.0021, CHF: 0.00185,
    NGN: 2.5, GHS: 0.025, GMD: 0.03, GNF: 0.005, LRD: 0.17, SLE: 0.05, CVE: 0.008,
    CDF: 4.5, AOA: 0.28, STN: 0.17,
    ETB: 0.04, KES: 0.216, TZS: 4.5, UGX: 6.3, RWF: 0.6, BIF: 0.6, SOS: 0.03, DJF: 0.03, ERN: 0.03, SSP: 0.3, KMF: 0.6,
    MAD: 0.0166, DZD: 0.22, TND: 0.0052, EGP: 0.08, LYD: 0.02, SDG: 0.3,
    ZAR: 0.031, NAD: 0.031, BWP: 0.25, ZWL: 0.02, MZN: 0.16, MWK: 0.5, ZMW: 0.1, MGA: 0.2, MUR: 0.4, SCR: 0.16, LSL: 0.03, SZL: 0.03,
    BRL: 0.009, INR: 0.012, CNY: 0.012, RUB: 0.011
  };

  /**
   * Symbole lisible d'une devise (« 3 000 FCFA » et non « 3 000 XOF »).
   * La table est construite à partir du catalogue des pays ; les devises
   * internationales absentes du catalogue ont une valeur de repli explicite.
   */
  const SYMBOLE_DEVISE = {
    XOF: 'FCFA', XAF: 'FCFA', EUR: '€', USD: '$', GBP: '£', CHF: 'CHF',
    CAD: '$', BRL: 'R$', INR: '₹', CNY: '¥', RUB: '₽'
  };
  PAYS_DISPONIBLES.forEach(p => {
    if (p && p.codeDevise && p.devise && !SYMBOLE_DEVISE[p.codeDevise]) SYMBOLE_DEVISE[p.codeDevise] = p.devise;
  });
  Object.keys(CONTEXTS).forEach(code => {
    const ctx = CONTEXTS[code];
    if (ctx && ctx.codeDevise && ctx.devise && !SYMBOLE_DEVISE[ctx.codeDevise]) SYMBOLE_DEVISE[ctx.codeDevise] = ctx.devise;
  });

  /** Symbole d'affichage d'un code devise. */
  function symboleDevise(codeDevise) {
    return SYMBOLE_DEVISE[codeDevise] || codeDevise || 'FCFA';
  }

  /** Prix exprimés dans la devise d'un pays. */
  function prixEnDevise(montantXof, codeDevise) {
    const taux = TAUX_DE_CHANGE[codeDevise];
    const devise = symboleDevise(codeDevise);
    if (!taux) return { montant: montantXof, devise, codeDevise, converti: false };
    if (!montantXof) return { montant: 0, devise, codeDevise, converti: true };
    const valeur = montantXof * taux;
    const arrondi = valeur >= 100 ? Math.round(valeur / 10) * 10 : (valeur >= 10 ? Math.round(valeur) : Math.ceil(valeur));
    return { montant: Math.max(arrondi, 1), devise, codeDevise, converti: true };
  }

  /** Informations d'un pays du catalogue (devise, zone, programme). */
  function infosPays(code) {
    const c = normalizeCode(code);
    return PAYS_DISPONIBLES.find(p => p.code === c) || null;
  }

  /** Devise d'un pays (ou du contexte s'il a un programme). */
  function devisePour(code) {
    const ctx = CONTEXTS[normalizeCode(code)];
    if (ctx && ctx.codeDevise) return { devise: ctx.devise, codeDevise: ctx.codeDevise };
    const info = infosPays(code);
    if (info) return { devise: info.devise, codeDevise: info.codeDevise };
    return { devise: 'FCFA', codeDevise: 'XOF' };
  }

  /**
   * Liste des pays pour les sélecteurs : pays africains d'abord,
   * puis le reste du monde. À l'intérieur de chaque zone, par nom.
   */
  function listePaysPourSelecteur(options = {}) {
    const avecProgramme = options.avecProgramme === true;
    return PAYS_DISPONIBLES
      .filter(p => p.actif)
      .filter(p => !avecProgramme || p.programme)
      .slice()
      .sort((a, b) => {
        if (a.zone !== b.zone) return a.zone === 'afrique' ? -1 : 1;
        return a.nom.localeCompare(b.nom, 'fr');
      });
  }

  const DEFAULT_CODE = 'BJ';

  function normalizeCode(value) {
    return String(value || '').trim().toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2);
  }

  function getContext(code) {
    const c = normalizeCode(code);
    return CONTEXTS[c] || CONTEXTS[DEFAULT_CODE];
  }

  /**
   * Contexte léger pour un pays du catalogue dont le programme officiel
   * n'est pas encore publié.
   * Il porte ce qui est déjà connu : nom, devise, langue d'enseignement.
   * Le programme et les matières restent ceux du pays de référence, et le
   * front l'annonce (bandeau) au lieu d'afficher une page vide.
   */
  function contexteCatalogue(code) {
    const info = infosPays(code);
    if (!info) return null;
    const langue = langueDe(info.code);
    const nom = info.nom;
    return {
      code: info.code,
      slug: info.slug || info.code.toLowerCase(),
      nom,
      nomLong: info.nomLong || nom,
      langue,
      actif: true,
      bientot: !info.programme,
      devise: info.devise,
      codeDevise: info.codeDevise,
      providers: info.providers || [],
      organisme: info.organisme || '',
      libelleExamen: info.libelleExamen || examenDe(info.code),
      classes: info.classes || { bac: 'Terminale', brevet: '3ème' },
      series: info.series || ['A', 'B', 'C', 'D', 'G'],
      // Les paiements sont débités en FCFA (FedaPay) : les prix du
      // contexte restent donc en XOF, seule l'affichage change.
      prix: info.prix || { chapitre: { brevet: 100, bac: 150 }, abonnement: { brevet: 2000, bac: 3000 } },
      textes: {
        systemeEducatif: `système éducatif ${nom}`,
        programmeOfficiel: `programme officiel de ${nom}`,
        examens: `examens ${nom}`,
        vocabulaire: `vocabulaire scolaire ${nom}`,
        paysLocution: `à ${nom}`,
        paysTitre: `à ${nom}`,
        slogan: `Réussir les examens à ${nom}`,
        credential: info.credential || 'BAC'
      },
      curriculum: null,
      matieres: { bac: {}, brevet: [] }
    };
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
    if (explicit) {
      if (CONTEXTS[explicit]) return CONTEXTS[explicit];
      // Pays du catalogue sans programme publié : on renvoie son contexte
      // léger (langue, devise) pour que la réponse soit dans la bonne
      // langue, tout en servant le programme disponible.
      const light = contexteCatalogue(explicit);
      if (light) return light;
    }

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

  /**
   * Contexte dont le programme est réellement publié.
   * Un pays dont le programme officiel n'est pas encore publié continue
   * d'être sélectionnable (et sa devise s'applique), mais on affiche le
   * programme disponible le plus proche plutôt qu'une page vide.
   */
  function contexteAvecProgramme(code) {
    const ctx = getContext(code);
    const matieres = (ctx && ctx.matieres) || {};
    const aDesMatieres =
      (Array.isArray(matieres.brevet) && matieres.brevet.length > 0) ||
      (matieres.bac && Object.keys(matieres.bac).length > 0);
    return aDesMatieres ? ctx : CONTEXTS[DEFAULT_CODE];
  }

  /** Vrai si le pays a son propre programme officiel publié. */
  function programmeDisponible(code) {
    const c = normalizeCode(code);
    const info = PAYS_DISPONIBLES.find(p => p.code === c);
    if (info) return info.programme === true;
    const ctx = getContext(c);
    const matieres = (ctx && ctx.matieres) || {};
    return (
      (Array.isArray(matieres.brevet) && matieres.brevet.length > 0) ||
      (matieres.bac && Object.keys(matieres.bac).length > 0)
    );
  }

  return {
    CONTEXTS,
    PAYS_DISPONIBLES,
    TAUX_DE_CHANGE,
    LANGUES,
    CHAT_LIBELLES,
    LANGUE_PAR_PAYS,
    LANGUE_PAR_DEFAUT,
    EXAMEN_PAR_PAYS,
    DEFAULT_CODE,
    getContext,
    getContextBySlug,
    contexteCatalogue,
    listContexts,
    listePaysPourSelecteur,
    infosPays,
    devisePour,
    symboleDevise,
    SYMBOLE_DEVISE,
    prixEnDevise,
    contexteAvecProgramme,
    programmeDisponible,
    langueDe,
    langueUI,
    traduire,
    traduireMatiere,
    MATIERES_LANGUE,
    examenDe,
    resolveContext
  };
});
