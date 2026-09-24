/* eslint-disable */
// Génère seed_curriculum.sql à partir du programme béninois officiel.
// Lancable avec : node tools/generate-seed.js
// Pré-requis : schema_v2.sql a déjà été appliqué dans Supabase.

const fs = require('fs');
const path = require('path');

const NIVEAUX = [
  { code: 'bac',    label: 'BAC (Terminale)',    base_price: 150, free_chapter_count: 3, display_order: 1 },
  { code: 'brevet', label: 'Brevet (3ème)',      base_price: 100, free_chapter_count: 3, display_order: 2 }
];

const SERIES = [
  { code: 'A', label: 'Série A (Littéraire)',         niveau_code: 'bac', display_order: 1 },
  { code: 'B', label: 'Série B (Sciences sociales)',  niveau_code: 'bac', display_order: 2 },
  { code: 'C', label: 'Série C (Sciences exactes)',   niveau_code: 'bac', display_order: 3 },
  { code: 'D', label: 'Série D (Sciences naturelles)',niveau_code: 'bac', display_order: 4 },
  { code: 'G', label: 'Série G (Gestion/Compta)',     niveau_code: 'bac', display_order: 5 }
];

// Curriculum béninois (synchronisé avec server.js: BENIN_CURRICULUM)
const CURRICULUM = {
  bac: {
    C: {
      'Mathématiques': ['Suites numériques et récurrence', 'Calcul vectoriel et produit scalaire', 'Fonctions exponentielles et logarithmes', 'Primitives et intégrales', 'Équations différentielles', 'Nombres complexes', 'Probabilités et statistiques', 'Géométrie dans l\'espace'],
      'Physique-Chimie': ['Ondes mécaniques et sonores', 'Ondes lumineuses et optique', 'Mécanique newtonienne', 'Travail et énergie', 'Chimie organique : alcools, alcanes, alcènes', 'Électricité : circuits RC, RL, RLC', 'Thermodynamique'],
      'SVT': ['Biologie cellulaire et ADN', 'Génétique et hérédité mendélienne', 'Immunologie et système immunitaire', 'Système nerveux et hormones', 'Reproduction humaine', 'Écologie et biosphère'],
      'Philosophie': ['La connaissance et la vérité', 'La liberté', 'L\'État', 'La morale'],
      'Français & Littérature': ['Dissertation et argumentation', 'Commentaire de texte', 'Grammaire et lexique avancés'],
      'Histoire-Géographie': ['Histoire contemporaine', 'Géographie économique', 'Bénin et Afrique'],
      'Anglais': ['Compréhension et expression écrite', 'Grammaire anglaise', 'Vocabulaire thématique']
    },
    D: {
      'Mathématiques': ['Suites numériques et récurrence', 'Calcul vectoriel et produit scalaire', 'Fonctions exponentielles et logarithmes', 'Primitives et intégrales', 'Probabilités et statistiques', 'Géométrie dans l\'espace'],
      'Physique-Chimie': ['Ondes mécaniques et sonores', 'Ondes lumineuses et optique', 'Mécanique newtonienne', 'Travail et énergie', 'Chimie organique : alcools, alcanes', 'Électricité : circuits RC, RL'],
      'SVT': ['Biologie cellulaire et ADN', 'Génétique et hérédité mendélienne', 'Immunologie et système immunitaire', 'Système nerveux et hormones', 'Reproduction humaine', 'Écologie et biosphère'],
      'Philosophie': ['La connaissance et la vérité', 'La liberté', 'L\'État', 'La morale'],
      'Français & Littérature': ['Dissertation et argumentation', 'Commentaire de texte', 'Grammaire et lexique avancés'],
      'Histoire-Géographie': ['Histoire contemporaine', 'Géographie économique', 'Bénin et Afrique'],
      'Anglais': ['Compréhension et expression écrite', 'Grammaire anglaise', 'Vocabulaire thématique']
    },
    A: {
      'Mathématiques': ['Suites numériques', 'Fonctions et courbes', 'Statistiques et probabilités', 'Vecteurs dans le plan'],
      'SVT': ['Biologie de base', 'Santé et hygiène', 'Écologie'],
      'Philosophie': ['La connaissance et la vérité', 'La liberté et la responsabilité', 'L\'État et la société', 'Le travail et la technique', 'La conscience et l\'inconscient', 'La morale et les valeurs'],
      'Français & Littérature': ['Texte argumentatif et dissertation', 'Commentaire composé', 'Résumé et synthèse', 'Littérature africaine et francophone', 'Littérature française classique et moderne', 'Expression écrite et orale'],
      'Histoire-Géographie': ['Histoire contemporaine mondiale : guerres et paix', 'Décolonisation et indépendances africaines', 'Histoire du Bénin', 'Géographie économique mondiale', 'Géographie du Bénin et de l\'Afrique', 'Mondialisation et développement'],
      'Anglais': ['Compréhension écrite et orale', 'Expression écrite : essay et letter writing', 'Grammaire anglaise avancée', 'Civilisation anglophone', 'Vocabulaire thématique']
    },
    B: {
      'Mathématiques': ['Suites numériques', 'Fonctions et courbes', 'Statistiques et probabilités', 'Mathématiques financières'],
      'Philosophie': ['La connaissance', 'La liberté et la responsabilité', 'L\'État et la société', 'Le travail'],
      'Français & Littérature': ['Dissertation et argumentation', 'Commentaire de texte', 'Grammaire'],
      'Histoire-Géographie': ['Histoire contemporaine', 'Géographie économique', 'Bénin et Afrique'],
      'Anglais': ['Compréhension et expression écrite', 'Grammaire anglaise', 'Vocabulaire thématique'],
      'Économie': ['Introduction à l\'économie et aux systèmes économiques', 'Offre, demande et marché', 'Monnaie et financement de l\'économie', 'Commerce international', 'Développement économique et croissance', 'Économie du Bénin et de l\'UEMOA']
    },
    G: {
      'Mathématiques': ['Mathématiques financières', 'Statistiques descriptives', 'Fonctions et courbes', 'Probabilités de base'],
      'Philosophie': ['La connaissance', 'La liberté et la responsabilité', 'L\'État et la société', 'Le travail'],
      'Français & Littérature': ['Dissertation et argumentation', 'Commentaire de texte', 'Grammaire'],
      'Histoire-Géographie': ['Histoire contemporaine', 'Géographie économique', 'Bénin et Afrique'],
      'Anglais': ['Compréhension et expression écrite', 'Grammaire anglaise', 'Vocabulaire thématique'],
      'Économie': ['Introduction à l\'économie', 'Marché et prix', 'Monnaie et financement', 'Commerce international'],
      'Comptabilité': ['Comptabilité générale : plan comptable SYSCOHADA', 'Bilan et compte de résultat', 'Opérations commerciales et TVA', 'Amortissements et provisions', 'Rapprochement bancaire', 'Comptabilité analytique de base']
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

const ICONS = {
  'Mathématiques': '📐',
  'Physique-Chimie': '🧪',
  'Physique-Chimie-Technologie': '🧪',
  'SVT': '🧬',
  'Philosophie': '🧠',
  'Français & Littérature': '📚',
  'Français': '📚',
  'Histoire-Géographie': '🗺️',
  'Anglais': '🔤',
  'Économie': '📊',
  'Comptabilité': '💼',
  'Lecture / Dictée': '📝'
};

function subjectCode(name) {
  return name.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function escapeSql(s) {
  if (s == null) return 'NULL';
  return "'" + String(s).replace(/'/g, "''") + "'";
}

function saLabel(num) {
  // SA 1 pour les 3 premiers, puis SA 2, SA 3...
  if (num <= 3) return `SA ${num}`;
  return `SA ${Math.ceil((num - 3) / 3) + 1}`;
}

function generateCours(title, niveauLabel) {
  const short = title.length > 60 ? title.substring(0, 57) + '...' : title;
  return `📚 ${title}

🎯 Objectifs d'apprentissage
• Maîtriser les notions clés : ${short}
• Connaître les définitions, propriétés et théorèmes essentiels
• Savoir appliquer les formules et méthodes dans un exercice type

📖 Contenu du chapitre
Ce chapitre présente ${short} dans le cadre du programme officiel ${niveauLabel}. Tu y trouveras les définitions précises, les théorèmes essentiels, des démonstrations commentées et des méthodes de résolution structurées. L'objectif : te donner tout ce qu'il faut pour réussir ce thème à l'examen, sans devoir chercher ailleurs.

🔍 Pièges classiques à éviter
• Confusions entre notions voisines (mots-clés proches, conditions d'application)
• Erreurs de signe, d'indice ou de domaine de validité
• Lecture trop rapide de l'énoncé qui fait passer à côté de la question réelle

📝 À la fin de ce chapitre, tu sauras
• Reconnaître le type de problème posé
• Choisir la bonne méthode parmi celles vues dans le cours
• Rédiger une solution claire, structurée et justifiée

💡 Astuce révision : refais les exercices du chapitre après 24h puis 7j (répétition espacée) pour ancrer la notion en mémoire longue.`;
}

function generateExemple(title) {
  return {
    titre: 'Exemple type — Examen béninois',
    enonce: `Sujet réaliste portant sur « ${title} ». L'élève doit mobiliser les définitions et méthodes vues dans le cours pour proposer une solution complète et rigoureuse. Reformuler l'énoncé, identifier la notion clé, appliquer la méthode, rédiger.`,
    solution: `Étape 1 — Analyse : identifier la notion clé (${title}) et les données utiles.\nÉtape 2 — Méthode : appliquer la formule ou la démarche vue dans le cours.\nÉtape 3 — Calcul / rédaction : développer le raisonnement pas-à-pas avec justifications.\nÉtape 4 — Vérification : contrôler la cohérence du résultat (unités, signe, ordre de grandeur).\nConclusion : réponse rédigée, justifiée et mise en perspective.`
  };
}

function generateExercice(title, num) {
  // Alterne QCM et Vrai/Faux pour varier les formats
  const useVF = (num % 3 === 0);
  if (useVF) {
    return {
      consigne: 'Vrai ou Faux — Notion clé',
      question: `« ${title} » : l'affirmation suivante est-elle correcte selon le cours ?`,
      type: 'vf',
      options: ['Vrai', 'Faux'],
      correctOption: 'vrai',
      explication: `Cette affirmation est correcte car elle énonce une définition / propriété vue dans le cours. À retenir pour l'examen : les conditions exactes d'application et les limites de cette notion.`
    };
  }
  return {
    consigne: 'QCM — Vérification rapide',
    question: `Parmi les affirmations suivantes sur « ${title} », laquelle est correcte ?`,
    type: 'qcm',
    options: [
      'a) Affirmation incorrecte (piège classique)',
      'b) Affirmation correcte — correspond à la définition vue dans le cours',
      'c) Affirmation incorrecte (confusion avec une notion voisine)',
      'd) Affirmation incorrecte (cas particulier mal identifié)'
    ],
    correctOption: 'b',
    explication: `La bonne réponse est (b) car elle énonce précisément la définition / propriété vue dans ce chapitre. Les autres options reprennent des confusions classiques à éviter : (a) confond deux notions, (c) oublie une condition d'application, (d) ne couvre qu'un cas particulier alors que le cours énonce le cas général.`
  };
}

// =============================================================
// GÉNÉRATION DU SQL
// =============================================================
const out = [];
out.push(`-- ============================================================`);
out.push(`-- Revizy — Seed du programme béninois`);
out.push(`-- Généré automatiquement par tools/generate-seed.js`);
out.push(`-- Pré-requis : schema.sql + schema_v2.sql appliqués`);
out.push(`-- Règle tarifaire : 3 premiers chapitres gratuits par matière`);
out.push(`--                    150 FCFA (BAC) / 100 FCFA (Brevet) au-delà`);
out.push(`-- ============================================================`);
out.push(``);
out.push(`begin;`);
out.push(``);

// --- Niveaux
out.push(`-- Niveaux`);
out.push(`insert into public.niveaux (code, label, base_price, free_chapter_count, display_order) values`);
NIVEAUX.forEach((n, i) => {
  out.push(`  (${escapeSql(n.code)}, ${escapeSql(n.label)}, ${n.base_price}, ${n.free_chapter_count}, ${n.display_order})${i < NIVEAUX.length - 1 ? ',' : ';'}`);
});
out.push(``);

// --- Series
out.push(`-- Séries (BAC uniquement)`);
out.push(`insert into public.series (code, label, niveau_code, display_order) values`);
SERIES.forEach((s, i) => {
  out.push(`  (${escapeSql(s.code)}, ${escapeSql(s.label)}, ${escapeSql(s.niveau_code)}, ${s.display_order})${i < SERIES.length - 1 ? ',' : ';'}`);
});
out.push(``);

// --- Subjects
const subjects = [];
out.push(`-- Matières`);
out.push(`insert into public.subjects (code, name, icon, niveau_code, serie_code, display_order) values`);

// BAC
for (const [serie, bySubj] of Object.entries(CURRICULUM.bac)) {
  let order = 0;
  for (const [name, chapters] of Object.entries(bySubj)) {
    subjects.push({ niveau: 'bac', serie, code: subjectCode(name), name, icon: ICONS[name] || '📚', order: order++ });
  }
}
// Brevet
{
  let order = 0;
  for (const [name, chapters] of Object.entries(CURRICULUM.brevet)) {
    subjects.push({ niveau: 'brevet', serie: null, code: subjectCode(name), name, icon: ICONS[name] || '📚', order: order++ });
  }
}

subjects.forEach((s, i) => {
  const serieVal = s.serie === null ? 'NULL' : escapeSql(s.serie);
  out.push(`  (${escapeSql(s.code)}, ${escapeSql(s.name)}, ${escapeSql(s.icon)}, ${escapeSql(s.niveau)}, ${serieVal}, ${s.order})${i < subjects.length - 1 ? ',' : ';'}`);
});
out.push(``);

// --- Chapters
out.push(`-- Chapitres (avec prix calculé automatiquement par trigger)`);
out.push(`-- Chaque chapitre a : titre, slug, cours structuré, exemple guidé, exercice QCM/VF`);
out.push(``);

for (const subj of subjects) {
  const niveauLabel = subj.niveau === 'bac' ? `BAC Série ${subj.serie}` : 'Brevet 3ème';
  const chapterList = subj.niveau === 'bac'
    ? CURRICULUM.bac[subj.serie][subj.name]
    : CURRICULUM.brevet[subj.name];

  out.push(`-- ${subj.niveau === 'bac' ? `BAC ${subj.serie}` : 'Brevet'} — ${subj.name} (${chapterList.length} chapitres)`);

  // One INSERT per subject with VALUES
  chapterList.forEach((title, idx) => {
    const num = idx + 1;
    const slug = `${subj.niveau}_${subj.serie || 'x'}_${subj.code}_${num}`;
    const sa = saLabel(num);
    const cours = generateCours(title, niveauLabel);
    const ex = generateExemple(title);
    const er = generateExercice(title, num);
    const optsJson = JSON.stringify(er.options).replace(/'/g, "''");

    const subjectLookup = subj.serie === null
      ? `niveau_code = ${escapeSql(subj.niveau)} and serie_code is null and code = ${escapeSql(subj.code)}`
      : `niveau_code = ${escapeSql(subj.niveau)} and serie_code = ${escapeSql(subj.serie)} and code = ${escapeSql(subj.code)}`;

    out.push(`insert into public.chapters (slug, subject_id, num, title, sa_label, cours, exemple_titre, exemple_enonce, exemple_solution, exercice_consigne, exercice_question, exercice_type, exercice_options, exercice_correct_option, exercice_explication)`);
    out.push(`select ${escapeSql(slug)}, s.id, ${num}, ${escapeSql(title)}, ${escapeSql(sa)}, ${escapeSql(cours)}, ${escapeSql(ex.titre)}, ${escapeSql(ex.enonce)}, ${escapeSql(ex.solution)}, ${escapeSql(er.consigne)}, ${escapeSql(er.question)}, ${escapeSql(er.type)}, '${optsJson}'::jsonb, ${escapeSql(er.correctOption)}, ${escapeSql(er.explication)}`);
    out.push(`from public.subjects s where ${subjectLookup};`);
    out.push(``);
  });
}

// Pricing rules (audit + ajustements futurs)
out.push(`-- Règles de tarification (audit)`);
out.push(`insert into public.pricing_rules (niveau_code, base_price, free_chapter_count) values`);
NIVEAUX.forEach((n, i) => {
  out.push(`  (${escapeSql(n.code)}, ${n.base_price}, ${n.free_chapter_count})${i < NIVEAUX.length - 1 ? ',' : ';'}`);
});
out.push(``);

out.push(`commit;`);
out.push(``);
out.push(`-- ============================================================`);
out.push(`-- Fin seed_curriculum.sql`);
out.push(`-- Statistiques attendues après exécution :`);
const totalSubjects = subjects.length;
let totalChapters = 0;
for (const s of subjects) {
  const cl = s.niveau === 'bac' ? CURRICULUM.bac[s.serie][s.name] : CURRICULUM.brevet[s.name];
  totalChapters += cl.length;
}
const freeCount = subjects.reduce((acc, s) => {
  const cl = s.niveau === 'bac' ? CURRICULUM.bac[s.serie][s.name] : CURRICULUM.brevet[s.name];
  return acc + Math.min(3, cl.length);
}, 0);
out.push(`--   ${totalSubjects} matières`);
out.push(`--   ${totalChapters} chapitres`);
out.push(`--   ${freeCount} chapitres gratuits (3 par matière)`);
out.push(`--   ${totalChapters - freeCount} chapitres payants (150/100 FCFA)`);
out.push(`-- ============================================================`);

const sql = out.join('\n');
const outPath = path.join(__dirname, '..', 'seed_curriculum.sql');
fs.writeFileSync(outPath, sql, 'utf8');
console.log(`✅ Généré : ${outPath}`);
console.log(`   ${totalSubjects} matières, ${totalChapters} chapitres, ${(sql.length / 1024).toFixed(1)} KB`);
