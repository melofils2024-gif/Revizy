// API IA optionnelle (pas encore sur Render). La base de données = Supabase via config.js
const API_BASE_URL = (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
  ? "http://localhost:5000/v1"
  : "https://revisy.onrender.com/v1";

const FEDAPAY_PUBLIC_KEY = 'pk_live_f9-BhipsvocdGhiSS2CxeyBA';

const MAX_ADMINS = 2;

const cfg = window.REVIZY_CONFIG || {};
const supabaseConfigured = Boolean(
  cfg.SUPABASE_URL &&
  cfg.SUPABASE_ANON_KEY &&
  !String(cfg.SUPABASE_URL).includes('VOTRE_PROJECT_REF') &&
  !String(cfg.SUPABASE_ANON_KEY).includes('VOTRE_CLE')
);

const _supabaseLib = window.supabase;
const supabaseClient = (supabaseConfigured && _supabaseLib)
  ? _supabaseLib.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY)
  : null;

function requireSupabase() {
  if (!supabaseClient) {
    alert("Supabase n'est pas configuré. Remplis SUPABASE_URL et SUPABASE_ANON_KEY dans config.js.");
    return false;
  }
  return true;
}

const state = {
  currentView: 'dashboard',
  currentNiveau: 'bac',
  currentSerie: 'C',
  user: null,
  unlockedChapterIds: [],
  unlockedMap: {},

  globalStats: {
    totalUsers: 0,
    unlockedChapters: 0,
    successRate: "0%"
  },

  adminStats: {
    revenue: 0,
    studentsCount: 0,
    fichesCount: 0
  },

  transactions: [],
  usersList: []
};

async function getAccessToken() {
  if (!supabaseClient) return '';
  const { data: { session } } = await supabaseClient.auth.getSession();
  return (session && session.access_token) || '';
}

const chapitresDatabase = {
  bac: {},
  brevet: {}
};

const matieresData = {
  bac: {
    "A": [
      { name: 'Français & Littérature', icon: '📚' },
      { name: 'Philosophie', icon: '🧠' },
      { name: 'Anglais', icon: '🔤' },
      { name: 'Histoire-Géographie', icon: '🗺️' },
      { name: 'Mathématiques', icon: '📐' },
      { name: 'SVT', icon: '🧬' }
    ],
    "B": [
      { name: 'Économie', icon: '📊' },
      { name: 'Histoire-Géographie', icon: '🗺️' },
      { name: 'Mathématiques', icon: '📐' },
      { name: 'Français & Littérature', icon: '📚' },
      { name: 'Philosophie', icon: '🧠' },
      { name: 'Anglais', icon: '🔤' }
    ],
    "C": [
      { name: 'Mathématiques', icon: '📐' },
      { name: 'Physique-Chimie', icon: '🧪' },
      { name: 'SVT', icon: '🧬' },
      { name: 'Philosophie', icon: '🧠' },
      { name: 'Français & Littérature', icon: '📚' },
      { name: 'Histoire-Géographie', icon: '🗺️' },
      { name: 'Anglais', icon: '🔤' }
    ],
    "D": [
      { name: 'SVT', icon: '🧬' },
      { name: 'Mathématiques', icon: '📐' },
      { name: 'Physique-Chimie', icon: '🧪' },
      { name: 'Philosophie', icon: '🧠' },
      { name: 'Français & Littérature', icon: '📚' },
      { name: 'Histoire-Géographie', icon: '🗺️' },
      { name: 'Anglais', icon: '🔤' }
    ],
    "G": [
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

// Programme officiel du système éducatif béninois (MEMP/OBB)
const KNOWLEDGE_BASE = {
  brevet: {
    "Mathématiques": {
      chapters: [
        { title: "Nombres entiers et rationnels", sa: "SA 1", 
          cours: "Nombres entiers relatifs Z, opérations (+,-,×,÷). Nombres rationnels Q = a/b (b≠0), addition/soustraction de fractions. PPCM, PGCD, décomposition en facteurs premiers. Puissances entières a^n, règles (a^m×a^n = a^{m+n})." },
        { title: "Calcul littéral et équations", sa: "SA 1",
          cours: "Expressions littérales, développement (a+b)(c+d) = ac+ad+bc+bd, factorisation par facteur commun. Identités remarquables : (a+b)² = a²+2ab+b², (a-b)² = a²-2ab+b², (a+b)(a-b) = a²-b². Équations du 1er degré ax+b=0." },
        { title: "Proportionnalité et statistiques", sa: "SA 2",
          cours: "Proportionnalité : tableaux, coefficient k, pourcentages, échelles. Règle de trois. Statistiques : effectifs, fréquences, moyennes pondérées, médiane, quartiles. Représentations graphiques : diagrammes en secteurs, histogrammes." },
        { title: "Géométrie plane : Théorème de Thalès", sa: "SA 2",
          cours: "Configuration de Thalès : droites parallèles coupant 2 sécantes. Rapport de proportionnalité AB/AC = AM/AN = BM/CN. Réciproque : si rapports égaux → droites parallèles. Applications : agrandissement/réduction, calculs de longueurs." },
        { title: "Triangle rectangle et trigonométrie", sa: "SA 3",
          cours: "Théorème de Pythagore : a²+b² = c² (c hypoténuse). Réciproque : si relation vérifiée → triangle rectangle. Trigonométrie : cos α = adjacent/hypoténuse, sin α = opposé/hypoténuse, tan α = opposé/adjacent. Valeurs remarquables 30°, 45°, 60°." },
        { title: "Fonctions affines et systèmes", sa: "SA 3",
          cours: "Fonction affine f(x) = ax+b. Représentation graphique : droite de pente a, ordonnée à l'origine b. Fonction linéaire f(x) = ax (droite passant par origine). Systèmes d'équations à 2 inconnues : substitution, combinaisons linéaires." }
      ],
      vf: [
        { q: "Dans un triangle rectangle, le carré de l'hypoténuse est égal à la somme des carrés des deux autres côtés.", a: true, e: "C'est le théorème de Pythagore : a²+b²=c²." },
        { q: "La tangente d'un angle est égale au rapport côté adjacent sur hypoténuse.", a: false, e: "La tangente = côté opposé / côté adjacent. C'est le cosinus qui utilise adjacent/hypoténuse." }
      ]
    },
    "SVT": {
      chapters: [
        { title: "Nutrition et digestion chez l'Homme", sa: "SA 1",
          cours: "Aliments : glucides (amidon, glucose), protides, lipides, sels minéraux, vitamines. Digestion : transformations mécaniques (mastication) et chimiques (enzymes). Tube digestif : bouche → œsophage → estomac → intestin grêle → gros intestin. Absorption intestinale des nutriments." },
        { title: "Respiration et circulation", sa: "SA 1",
          cours: "Respiration : ventilation pulmonaire (inspiration/expiration), échanges gazeux alvéolaires (O₂/CO₂). Circulation sanguine : cœur (4 cavités), petite circulation (cœur-poumons), grande circulation (cœur-organes). Sang : plasma, globules rouges (transport O₂), globules blancs (défense)." },
        { title: "Reproduction humaine", sa: "SA 2",
          cours: "Appareil génital masculin : testicules (spermatozoïdes), canal déférent. Appareil génital féminin : ovaires (ovules), trompes, utérus. Cycle menstruel (28 jours), ovulation (14e jour). Fécondation, développement embryonnaire, grossesse (9 mois)." },
        { title: "Hérédité et génétique", sa: "SA 2",
          cours: "Chromosomes : ADN, gènes, allèles. Caryotype humain : 46 chromosomes (23 paires). Transmission héréditaire : dominance/récessivité, homozygote/hétérozygote. Croisements, échiquier de Punnett. Maladies génétiques." },
        { title: "Écologie et environnement", sa: "SA 3",
          cours: "Écosystème : biotope (milieu) + biocénose (êtres vivants). Chaînes alimentaires : producteurs → consommateurs primaires → secondaires → décomposeurs. Cycles de la matière (C, N, P). Pollution : causes, conséquences, solutions. Biodiversité du Bénin." },
        { title: "Géologie : sols et roches du Bénin", sa: "SA 3",
          cours: "Formation des sols : altération des roches, horizon A (humus), B (accumulation), C (roche altérée). Types de roches : magmatiques (granite), sédimentaires (grès), métamorphiques (gneiss). Ressources minières béninoises : calcaire, argile, sable. Érosion et conservation des sols." }
      ],
      vf: [
        { q: "Les globules rouges transportent l'oxygène dans le sang.", a: true, e: "Grâce à l'hémoglobine qu'ils contiennent, ils fixent l'O₂ dans les poumons et le libèrent aux organes." },
        { q: "L'ovulation se produit au début du cycle menstruel.", a: false, e: "L'ovulation a lieu vers le 14e jour d'un cycle de 28 jours, soit au MILIEU du cycle." }
      ]
    },
    "Physique-Chimie-Technologie": {
      chapters: [
        { title: "États de la matière et transformations", sa: "SA 1",
          cours: "États : solide (forme/volume fixes), liquide (volume fixe, forme variable), gaz (forme/volume variables). Changements d'état : fusion, solidification, vaporisation, condensation, sublimation. Température de fusion/ébullition. Mélanges : homogènes, hétérogènes. Techniques de séparation : décantation, filtration, distillation." },
        { title: "Atomes et molécules", sa: "SA 1",
          cours: "Atome : noyau (protons + neutrons) + électrons. Numéro atomique Z = nombre de protons. Molécule : assemblage d'atomes liés. Formules chimiques : H₂O (eau), CO₂ (dioxyde carbone), O₂ (dioxygène). Réactions chimiques : réactifs → produits, conservation de la masse." },
        { title: "Forces et mouvements", sa: "SA 2",
          cours: "Force : action mécanique caractérisée par point d'application, direction, sens, intensité (Newton). Poids P = mg (g = 10 N/kg). Forces de contact : normale, frottement. Mouvement rectiligne uniforme : v = d/t constante. Accélération : variation de vitesse." },
        { title: "Énergie et électricité", sa: "SA 2",
          cours: "Énergie : capacité à produire du travail. Formes : cinétique (mouvement), potentielle (position), thermique, électrique. Conservation de l'énergie. Circuit électrique : générateur, conducteurs, récepteurs. Loi d'Ohm : U = R×I. Puissance P = U×I." },
        { title: "Optique et ondes", sa: "SA 3",
          cours: "Propagation rectiligne de la lumière. Réflexion : angle incident = angle réfléchi. Réfraction : changement de direction à l'interface. Lentilles convergentes/divergentes. Formation d'images. Ondes sonores : fréquence (Hz), amplitude, vitesse du son (340 m/s dans l'air)." },
        { title: "Technologie et environnement", sa: "SA 3",
          cours: "Sources d'énergie : renouvelables (solaire, éolien, hydraulique) vs non renouvelables (pétrole, charbon). Impact environnemental. Technologies au Bénin : agriculture, artisanat, industrie. Développement durable : besoins actuels sans compromettre les générations futures." }
      ],
      vf: [
        { q: "Dans un circuit en série, l'intensité est la même partout.", a: true, e: "En série, les électrons suivent un seul chemin : même débit (intensité) en chaque point." },
        { q: "La vitesse du son est plus grande dans l'air que dans l'eau.", a: false, e: "Le son se propage plus vite dans l'eau (≈1500 m/s) que dans l'air (≈340 m/s)." }
      ]
    },
    "Français": {
      chapters: [
        { title: "Grammaire : Classes et fonctions grammaticales", sa: "SA 1",
          cours: "Classes grammaticales : nom, adjectif, verbe, adverbe, préposition, conjonction, pronom, déterminant. Fonctions : sujet, COD, COI, CC (temps, lieu, manière, cause), attribut du sujet, épithète, apposition. Analyse grammaticale vs analyse logique." },
        { title: "Conjugaison : Modes et temps", sa: "SA 1",
          cours: "Modes personnels : indicatif (présent, imparfait, passé simple, futur), subjonctif (présent, imparfait), conditionnel, impératif. Modes impersonnels : infinitif, participe, gérondif. Accord du participe passé : avec être, avoir, verbes pronominaux." },
        { title: "Vocabulaire et orthographe", sa: "SA 2",
          cours: "Formation des mots : préfixes, suffixes, radicaux. Familles de mots. Synonymes, antonymes, homonymes, paronymes. Champ lexical vs champ sémantique. Orthographe : règles d'accord, homophones grammaticaux (à/a, et/est, son/sont), pluriels particuliers." },
        { title: "Expression écrite : Types de textes", sa: "SA 2",
          cours: "Types : narratif (récit, chronologie), descriptif (portrait, paysage), explicatif (définition, causes/conséquences), argumentatif (thèse, arguments, exemples), injonctif (consignes, recettes). Structure : introduction, développement, conclusion. Connecteurs logiques." },
        { title: "Littérature africaine et béninoise", sa: "SA 3",
          cours: "Auteurs béninois : Olympe Bhêly-Quenum, Paulin Joachim, Jean Pliya. Littérature orale : contes, proverbes, épopées. Thèmes : tradition vs modernité, colonisation, indépendance, société africaine. Analyse littéraire : personnages, cadre spatio-temporel, thèmes, style." },
        { title: "Communication et expression orale", sa: "SA 3",
          cours: "Situation de communication : émetteur, récepteur, message, code, canal, contexte. Registres de langue : familier, courant, soutenu. Exposé oral : plan, gestuelle, intonation. Débat : arguments, contre-arguments, modération. Expression corporelle et théâtrale." }
      ],
      vf: [
        { q: "Le COD répond aux questions 'qui ?' ou 'quoi ?' posées après le verbe.", a: true, e: "Exemple : 'Pierre mange une pomme' → mange quoi ? → une pomme (COD)." },
        { q: "Au passé composé, le participe passé s'accorde toujours avec le sujet.", a: false, e: "Avec l'auxiliaire AVOIR, l'accord se fait avec le COD placé AVANT le verbe. Avec ÊTRE, accord avec le sujet." }
      ]
    }
  },
  bac: {
    "Mathématiques": {
      chapters: [
        { title: "Suites numériques : Arithmétiques et géométriques", sa: "SA 1",
          cours: "Suite arithmétique : u_{n+1} = u_n + r (raison r). Terme général : u_n = u_0 + nr. Somme : S_n = (n+1)(u_0+u_n)/2. Suite géométrique : u_{n+1} = q×u_n (raison q≠0). Terme général : u_n = u_0×q^n. Somme : S_n = u_0(1-q^{n+1})/(1-q) si q≠1." },
        { title: "Limites et continuité", sa: "SA 1",
          cours: "Limite finie/infinie en un point/à l'infini. Formes indéterminées : 0/0, ∞/∞, ∞-∞. Théorèmes : limite d'une somme, produit, quotient. Continuité : f continue en a si lim_{x→a} f(x) = f(a). Théorème des valeurs intermédiaires." },
        { title: "Dérivabilité et applications", sa: "SA 2",
          cours: "Nombre dérivé : f'(a) = lim_{h→0} [f(a+h)-f(a)]/h. Fonction dérivée. Règles : (u+v)' = u'+v', (uv)' = u'v+uv', (u/v)' = (u'v-uv')/v². Dérivées usuelles : (x^n)' = nx^{n-1}, (ln x)' = 1/x, (e^x)' = e^x, (sin x)' = cos x." },
        { title: "Étude de fonctions", sa: "SA 2",
          cours: "Variations : f'(x)>0 ⇒ f croissante, f'(x)<0 ⇒ f décroissante. Extremums : f'(x)=0 et changement de signe. Concavité : f''(x)>0 ⇒ convexe, f''(x)<0 ⇒ concave. Point d'inflexion : f''(x)=0 et changement de signe. Asymptotes." },
        { title: "Primitives et intégrales", sa: "SA 3",
          cours: "Primitive F de f : F'(x) = f(x). Primitives usuelles : ∫x^n dx = x^{n+1}/(n+1)+C, ∫(1/x)dx = ln|x|+C, ∫e^x dx = e^x+C. Intégrale définie : ∫_a^b f(x)dx = F(b)-F(a). Calcul d'aires." },
        { title: "Géométrie dans l'espace", sa: "SA 3",
          cours: "Repère orthonormé (O,i,j,k). Coordonnées 3D. Vecteurs dans l'espace : norme, produit scalaire, colinéarité, orthogonalité. Équations de plans : ax+by+cz+d=0. Droites dans l'espace : représentations paramétriques. Distances et angles." },
        { title: "Probabilités et statistiques", sa: "SA 4",
          cours: "Probabilité : P(A) = nombre de cas favorables / nombre de cas possibles. Événements : A∪B, A∩B, Ā (complémentaire). Probabilité conditionnelle : P(A|B) = P(A∩B)/P(B). Indépendance : P(A∩B) = P(A)×P(B). Variables aléatoires, espérance, variance." },
        { title: "Nombres complexes", sa: "SA 4",
          cours: "Forme algébrique : z = a+bi (i² = -1). Conjugué : z̄ = a-bi. Module : |z| = √(a²+b²). Forme trigonométrique : z = r(cos θ + i sin θ). Formule d'Euler : e^{iθ} = cos θ + i sin θ. Applications géométriques." }
      ],
      vf: [
        { q: "Une fonction dérivable en un point est nécessairement continue en ce point.", a: true, e: "La dérivabilité implique la continuité, mais la réciproque est fausse." },
        { q: "L'intégrale d'une fonction positive est toujours positive.", a: true, e: "Si f(x) ≥ 0 sur [a,b] avec a ≤ b, alors ∫_a^b f(x)dx ≥ 0." }
      ]
    },
    "Physique-Chimie": {
      chapters: [
        { title: "Mécanique : Cinématique du point matériel", sa: "SA 1",
          cours: "Mouvement rectiligne uniforme : v = constante, x(t) = x_0 + vt. Mouvement rectiligne uniformément varié : a = constante, v(t) = v_0 + at, x(t) = x_0 + v_0t + ½at². Chute libre : a = g = 9,8 m/s². Mouvement circulaire uniforme : vitesse angulaire ω, période T = 2π/ω." },
        { title: "Dynamique : Lois de Newton", sa: "SA 1",
          cours: "1ère loi (inertie) : objet au repos ou MRU si ∑F = 0. 2ème loi : F = ma (principe fondamental). 3ème loi (action-réaction) : F_{A→B} = -F_{B→A}. Applications : poids P = mg, tension, frottements. Théorème de l'énergie cinétique : ΔE_c = W(F)." },
        { title: "Électrostatique et condensateurs", sa: "SA 2",
          cours: "Force de Coulomb : F = k q₁q₂/r² (k = 9×10⁹ N⋅m²/C²). Champ électrique : E = F/q, E = kQ/r². Potentiel électrique : V = kQ/r, E = -grad(V). Condensateur : C = Q/U, énergie E = ½CU². Associations série/parallèle." },
        { title: "Courants électriques et circuits", sa: "SA 2",
          cours: "Intensité : I = Q/t (ampères). Loi d'Ohm : U = RI. Puissance : P = UI = RI² = U²/R. Lois de Kirchhoff : ∑I_entrées = ∑I_sorties (nœuds), ∑U = 0 (mailles). Circuits RC : charge/décharge, τ = RC." },
        { title: "Ondes mécaniques et sonores", sa: "SA 3",
          cours: "Onde progressive : perturbation qui se propage. Célérité c = λf (longueur d'onde × fréquence). Ondes sinusoïdales : y(x,t) = A sin(ωt - kx + φ). Réflexion, réfraction, diffraction. Son : onde de pression, intensité, décibels." },
        { title: "Optique géométrique", sa: "SA 3",
          cours: "Propagation rectiligne de la lumière. Réflexion : i₁ = i₂. Réfraction : n₁sin i₁ = n₂sin i₂ (loi de Snell-Descartes). Lentilles minces : convergente (f > 0), divergente (f < 0). Relation de conjugaison : 1/OA' - 1/OA = 1/f." },
        { title: "Chimie organique : Alcanes et alcools", sa: "SA 4",
          cours: "Alcanes : C_nH_{2n+2}, liaisons σ, tétraédrie du carbone. Nomenclature IUPAC. Isomérisme de chaîne. Combustion : C_nH_{2n+2} + O₂ → CO₂ + H₂O. Alcools : groupe -OH, classification (1°, 2°, 3°). Oxydation ménagée." },
        { title: "Transformations chimiques et équilibres", sa: "SA 4",
          cours: "Équations-bilans, stœchiométrie, réactif limitant. Avancement x, tableau d'avancement. Constante d'équilibre K_eq. Principe de Le Chatelier : effet température, pression, concentration. pH, acides/bases, produit ionique de l'eau K_e = 10^{-14}." }
      ],
      vf: [
        { q: "Dans un mouvement rectiligne uniformément accéléré, la vitesse augmente linéairement avec le temps.", a: true, e: "v(t) = v₀ + at, donc v augmente (ou diminue si a < 0) linéairement." },
        { q: "Une lentille convergente donne toujours une image réelle.", a: false, e: "Si l'objet est entre F et O, l'image est virtuelle et droite (loupe)." }
      ]
    },
    "SVT": {
      chapters: [
        { title: "Biologie cellulaire : Structure et fonctions", sa: "SA 1",
          cours: "Cellule eucaryote : membrane, cytoplasme, noyau (ADN, chromosomes). Organites : mitochondries (respiration), chloroplastes (photosynthèse), ribosomes (synthèse protéique), réticulum endoplasmique, appareil de Golgi. Membrane plasmique : bicouche lipidique, protéines, transport actif/passif." },
        { title: "Génétique moléculaire : ADN et expression génique", sa: "SA 1",
          cours: "ADN : double hélice, bases A-T, G-C, antiparallélisme. Réplication semi-conservative. Code génétique : triplets, 64 codons → 20 acides aminés. Transcription : ADN → ARNm (ARN polymérase). Traduction : ARNm → protéines (ribosomes, ARNt)." },
        { title: "Immunologie : Défenses de l'organisme", sa: "SA 2",
          cours: "Immunité innée : barrières, phagocytose (macrophages, neutrophiles), inflammation, complément. Immunité adaptative : lymphocytes B (anticorps, immunité humorale), lymphocytes T CD4 (helper), CD8 (cytotoxiques). Mémoire immunologique, vaccins. Allergies, auto-immunité, immunodéficiences (SIDA)." },
        { title: "Neurophysiologie : Système nerveux", sa: "SA 2",
          cours: "Neurone : corps cellulaire, dendrites, axone, synapses. Potentiel d'action : dépolarisation/repolarisation, conduction saltatoire. Synapses chimiques : neurotransmetteurs (acétylcholine, dopamine). Réflexes : arc réflexe, moelle épinière. Cerveau : cortex, centres nerveux." },
        { title: "Reproduction et développement", sa: "SA 3",
          cours: "Gamétogenèse : spermatogenèse (testicules), ovogenèse (ovaires). Méiose : brassage génétique, crossing-over. Fécondation, embryogenèse, différenciation cellulaire. Régulation hormonale : FSH, LH, œstrogènes, progestérone, testosterone. Contraception, PMA." },
        { title: "Écologie des écosystèmes", sa: "SA 3",
          cours: "Écosystème : biotope + biocénose. Flux d'énergie : producteurs primaires → consommateurs → décomposeurs. Pyramides écologiques (nombres, biomasse, énergie). Cycles biogéochimiques : carbone, azote, phosphore. Successions écologiques, climax." },
        { title: "Évolution et phylogénie", sa: "SA 4",
          cours: "Théorie de l'évolution : Darwin, sélection naturelle. Mécanismes : mutations, dérive génétique, flux de gènes. Spéciation : allopatrique, sympatrique. Phylogénie : caractères dérivés, arbres phylogénétiques. Preuves : fossiles, anatomie comparée, biologie moléculaire." },
        { title: "Géologie : Tectonique des plaques", sa: "SA 4",
          cours: "Structure de la Terre : croûte, manteau, noyau. Plaques lithosphériques : dérive des continents, expansion océanique. Dorsales : accrétion, volcanisme. Zones de subduction : séismes, volcanisme explosif. Chaînes de montagnes : collision continentale. Cycle des roches." }
      ],
      vf: [
        { q: "Lors de la méiose, le nombre de chromosomes est divisé par deux.", a: true, e: "La méiose produit 4 gamètes haploïdes (n chromosomes) à partir d'une cellule diploïde (2n)." },
        { q: "Les antibiotiques sont efficaces contre les virus.", a: false, e: "Les antibiotiques agissent sur les bactéries. Contre les virus, on utilise des antiviraux." }
      ]
    },
    "Français": {
      chapters: [
        { title: "Analyse grammaticale approfondie", sa: "SA 1",
          cours: "Syntaxe complexe : propositions principales, subordonnées (relatives, complétives, circonstancielles). Fonctions avancées : sujet apparent/réel, attribut du COD, compléments d'agent, épithète détachée. Modes et temps : subjonctif (doute, sentiment), conditionnel (hypothèse), gérondif, participes." },
        { title: "Stylistique et figures de style", sa: "SA 1",
          cours: "Figures de ressemblance : métaphore, comparaison, personnification, allégorie. Figures d'opposition : antithèse, oxymore, chiasme. Figures d'insistance : anaphore, gradation, hyperbole, euphémisme. Effets stylistiques : rythme, sonorités, registres (lyrique, épique, pathétique)." },
        { title: "Dissertation littéraire", sa: "SA 2",
          cours: "Plan dialectique : thèse, antithèse, synthèse. Plan analytique : aspects du sujet. Argumentation : arguments, exemples précis, citations. Introduction : accroche, problématique, annonce du plan. Développement : transitions, progression logique. Conclusion : bilan, ouverture." },
        { title: "Commentaire composé", sa: "SA 2",
          cours: "Lecture analytique : compréhension globale, axes d'étude. Étude linéaire vs étude synthétique. Analyse du fond : thèmes, personnages, action. Analyse de la forme : style, procédés, effets. Plan du commentaire : 2-3 parties équilibrées, exemples textuels précis." },
        { title: "Littérature française classique", sa: "SA 3",
          cours: "XVIIe siècle : classicisme, règles théâtrales (3 unités). Corneille (Le Cid), Racine (Phèdre), Molière (Dom Juan). La Fontaine (Fables). XVIIIe siècle : Lumières, philosophie. Voltaire (Candide), Rousseau, Diderot. Roman épistolaire, conte philosophique." },
        { title: "Littérature africaine francophone", sa: "SA 3",
          cours: "Négritude : Senghor, Césaire, Damas. Roman colonial et postcolonial : Camara Laye (L'Enfant noir), Sembène Ousmane. Théâtre africain : Bernard Dadié, Sony Labou Tansi. Littérature béninoise : Olympe Bhêly-Quenum, Jean Pliya. Thèmes : identité, tradition/modernité." },
        { title: "Expression écrite créative", sa: "SA 4",
          cours: "Nouvelle littéraire : chute, ellipses temporelles, point de vue narratif. Récit autobiographique : pacte, mémoire, subjectivité. Écriture d'invention : pastiche, parodie, lettre, article de presse. Adaptation : transposition d'époque, changement de genre, réécriture." },
        { title: "Oral : Exposé et débat", sa: "SA 4",
          cours: "Exposé littéraire : recherche documentaire, plan structuré, supports visuels. Éloquence : gestuelle, intonation, captation de l'attention. Débat argumenté : écoute active, réfutation, concession. Entretien : présentation personnelle, motivation, culture générale." }
      ],
      vf: [
        { q: "Une métaphore est une comparaison sans outil de comparaison.", a: true, e: "Métaphore : 'Ses yeux sont des étoiles' (sans 'comme'). Comparaison : 'Ses yeux brillent comme des étoiles'." },
        { q: "Le plan dialectique convient à tous les sujets de dissertation.", a: false, e: "Le plan dialectique convient aux sujets polémiques. Pour d'autres sujets, préférer le plan thématique ou analytique." }
      ]
    }
  }
};

function escapeStr(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Fonction pour créer des QCM spécifiques aux chapitres (pas génériques)
function generateChapterSpecificQCM(chapterTitle, subjectName, niveau) {
  // Questions spécifiques selon le titre du chapitre et la matière
  const qcmDatabase = {
    // Mathématiques BAC
    "Suites numériques": {
      question: `Dans une suite arithmétique de raison r = 3 et de premier terme u₀ = 2, que vaut u₅ ?`,
      options: ["a) 14", "b) 17", "c) 20", "d) 23"],
      correctOption: "b",
      explication: "u₅ = u₀ + 5r = 2 + 5×3 = 2 + 15 = 17"
    },
    "Limites et continuité": {
      question: `Quelle est la limite de (2x+1)/(x-3) quand x tend vers +∞ ?`,
      options: ["a) 0", "b) 1", "c) 2", "d) +∞"],
      correctOption: "c",
      explication: "Limite = coefficient du terme de plus haut degré = 2/1 = 2"
    },
    "Dérivabilité": {
      question: `Quelle est la dérivée de f(x) = 3x² - 2x + 1 ?`,
      options: ["a) 6x - 2", "b) 3x - 2", "c) 6x + 1", "d) x² - 2x"],
      correctOption: "a",
      explication: "f'(x) = 3×2x - 2×1 + 0 = 6x - 2"
    },
    "Primitives et intégrales": {
      question: `Une primitive de f(x) = 2x + 3 est :`,
      options: ["a) x² + 3x", "b) x² + 3x + C", "c) 2", "d) 2x² + 3x"],
      correctOption: "b",
      explication: "∫(2x+3)dx = x² + 3x + C (constante d'intégration obligatoire)"
    },
    
    // SVT BAC  
    "Biologie cellulaire": {
      question: `Quel organite est spécialisé dans la synthèse des protéines ?`,
      options: ["a) Mitochondrie", "b) Ribosome", "c) Noyau", "d) Chloroplaste"],
      correctOption: "b", 
      explication: "Les ribosomes traduisent l'ARNm en protéines"
    },
    "Génétique moléculaire": {
      question: `Combien de bases azotées forment un codon ?`,
      options: ["a) 2", "b) 3", "c) 4", "d) 6"],
      correctOption: "b",
      explication: "Un codon = triplet de 3 bases qui code pour un acide aminé"
    },
    "Immunologie": {
      question: `Les lymphocytes B activés se différencient en :`,
      options: ["a) Lymphocytes T", "b) Macrophages", "c) Plasmocytes", "d) Neutrophiles"],
      correctOption: "c",
      explication: "Les plasmocytes produisent les anticorps (immunité humorale)"
    },
    
    // Mathématiques Brevet
    "Nombres entiers": {
      question: `Quelle est la décomposition en facteurs premiers de 12 ?`,
      options: ["a) 2 × 6", "b) 3 × 4", "c) 2² × 3", "d) 2 × 3²"],
      correctOption: "c",
      explication: "12 = 4 × 3 = 2² × 3"
    },
    "Calcul littéral": {
      question: `Développer (x + 3)² donne :`,
      options: ["a) x² + 9", "b) x² + 6x + 9", "c) x² + 3x + 9", "d) x² + 6x + 6"],
      correctOption: "b", 
      explication: "(a+b)² = a² + 2ab + b² donc (x+3)² = x² + 6x + 9"
    },
    "Théorème de Thalès": {
      question: `Si AB/AC = 2/3 et AM/AN = 2/3, alors :`,
      options: ["a) (BM) et (CN) sont perpendiculaires", "b) (BM) et (CN) sont parallèles", "c) BM = CN", "d) Les triangles sont égaux"],
      correctOption: "b",
      explication: "Réciproque de Thalès : rapports égaux ⇒ droites parallèles"
    }
  };
  
  // Chercher une question spécifique au chapitre
  for (let key in qcmDatabase) {
    if (chapterTitle.toLowerCase().includes(key.toLowerCase())) {
      return qcmDatabase[key];
    }
  }
  
  // Fallback : question générale adaptée à la matière
  const fallbackQCMs = {
    "Mathématiques": {
      question: `En mathématiques, quelle est l'approche recommandée pour résoudre un problème ?`,
      options: ["a) Deviner la réponse", "b) Identifier les données, appliquer les méthodes, vérifier", "c) Mémoriser toutes les formules", "d) Calculer au hasard"],
      correctOption: "b",
      explication: "Méthode rigoureuse : comprendre → appliquer → vérifier"
    },
    "SVT": {
      question: `En SVT, comment acquérir une bonne compréhension des phénomènes biologiques ?`,
      options: ["a) Apprendre par cœur uniquement", "b) Observer, comprendre les mécanismes, faire des liens", "c) Retenir seulement les définitions", "d) Éviter les expériences"],
      correctOption: "b",
      explication: "La SVT nécessite observation, compréhension et mise en relation des phénomènes"
    },
    "Physique-Chimie": {
      question: `En physique-chimie, quelle démarche adopter face à un exercice ?`,
      options: ["a) Appliquer des formules sans comprendre", "b) Analyser la situation, identifier les lois, résoudre méthodiquement", "c) Chercher la réponse dans le livre", "d) Faire des calculs approximatifs"],
      correctOption: "b", 
      explication: "Démarche scientifique : analyse → modélisation → résolution → validation"
    },
    "Français": {
      question: `Pour réussir un commentaire de texte, il faut :`,
      options: ["a) Résumer l'histoire", "b) Analyser le fond et la forme avec des exemples précis", "c) Donner son opinion personnelle", "d) Paraphraser le texte"],
      correctOption: "b",
      explication: "Le commentaire analyse les procédés littéraires et leurs effets sur le sens"
    }
  };
  
  return fallbackQCMs[subjectName] || fallbackQCMs["Mathématiques"];
}

function generateIntroChapter(subjectName, niveau, prefixId, niveauTexte, num) {
  const qcm = generateChapterSpecificQCM("Introduction " + subjectName, subjectName, niveau);
  
  return {
    id: `${niveau}_${prefixId}_intro_${Date.now()}`,
    num: num,
    title: `Introduction à ${subjectName} — Méthodologie et bases`,
    cours: `Bienvenue dans le cours de ${subjectName} pour ${niveauTexte}. Cette discipline suit le programme officiel du Ministère de l'Enseignement Maternel et Primaire (MEMP) du Bénin.

🎯 Objectifs du programme :
• Maîtriser les concepts fondamentaux selon le référentiel béninois
• Développer les compétences d'analyse et de résolution de problèmes  
• Préparer efficacement aux examens (BEPC/BAC)
• Appliquer les connaissances dans des situations concrètes

📚 Méthodologie de travail :
1. Étudier le cours théorique attentivement
2. Comprendre les exemples d'application
3. S'entraîner avec les QCM et exercices
4. Réviser régulièrement pour ancrer les acquis

Le programme ${subjectName} ${niveau === 'bac' ? 'BAC' : 'Brevet'} est conçu selon les standards éducatifs béninois pour une formation complète et adaptée au contexte national.`,
    exemple: {
      titre: `Méthode d'apprentissage — ${subjectName}`,
      enonce: `Comment organiser efficacement son travail en ${subjectName} ?`,
      solution: `1. Planification : répartir les chapitres sur l'année
2. Compréhension : ne pas apprendre par cœur sans comprendre
3. Application : faire des exercices variés
4. Révision : reprendre régulièrement les notions acquises
5. Entraide : échanger avec ses camarades et professeurs`
    },
    exercice: {
      consigne: "QCM — Méthodologie d'apprentissage",
      question: qcm.question,
      type: "qcm", 
      options: qcm.options,
      correctOption: qcm.correctOption,
      explication: qcm.explication
    }
  };
}

function generateKnowledgeChapter(knowledgeChapter, subjectName, niveau, prefixId, chapterNum, saNum) {
  const qcm = generateChapterSpecificQCM(knowledgeChapter.title, subjectName, niveau);
  
  return {
    id: `${niveau}_${prefixId}_kc_${chapterNum}_${Date.now()}`,
    num: chapterNum,
    title: `${knowledgeChapter.sa} : ${knowledgeChapter.title}`,
    cours: `📚 ${knowledgeChapter.title}

${knowledgeChapter.cours}

Ce chapitre fait partie du programme officiel béninois de ${subjectName} niveau ${niveau === 'bac' ? 'BAC' : 'Brevet'}. Il développe les compétences essentielles requises selon le référentiel du MEMP.

🎯 Compétences visées :
• Maîtriser les notions théoriques fondamentales
• Savoir appliquer les concepts dans des exercices types
• Développer un raisonnement logique et structuré
• Se préparer aux questions d'examen sur ce thème`,
    exemple: {
      titre: `Application pratique — ${knowledgeChapter.title}`,
      enonce: `Voici un exemple d'application des concepts de ce chapitre dans un contexte d'examen béninois.`,
      solution: `La résolution nécessite de mobiliser les notions clés du chapitre et de les appliquer méthodiquement selon les standards du programme national.`
    },
    exercice: {
      consigne: `QCM — ${knowledgeChapter.title}`,
      question: qcm.question,
      type: "qcm",
      options: qcm.options,
      correctOption: qcm.correctOption,
      explication: qcm.explication
    }
  };
}

function cleanQuizOption(value) {
  if (!value) return '';
  return String(value)
    .replace(/\s*\((?:correct|bonne réponse|réponse correcte|correct answer)\)\s*/gi, '')
    .replace(/\s*-\s*(?:correct|bonne réponse|réponse correcte|correct answer)\s*$/gi, '')
    .replace(/\s*\(✓\)\s*/gi, '')
    .replace(/\s*✓\s*$/gi, '')
    .trim();
}

document.addEventListener('DOMContentLoaded', async () => {
  updateNavbar();
  await checkSession();
  renderNiveauTabs();
  renderMatieres();
  await loadPublicStats();
  renderHomeStats();

  if (window.lucide) lucide.createIcons();
  if (window.MathJax) setTimeout(() => MathJax.typesetPromise(), 200);
});

function renderHomeStats() {
  const usersEl = document.getElementById('statTotalUsers');
  const chaptersEl = document.getElementById('statUnlockedChapters');
  const rateEl = document.getElementById('statSuccessRate');
  const heroRateEl = document.getElementById('statHeroRate');
  const fichesEl = document.getElementById('statFiches');
  const qcmEl = document.getElementById('statQcm');
  const elevesActifsEl = document.getElementById('statElevesActifs');
  const fichesPubEl = document.getElementById('statFichesPubilees');

  const total = state.globalStats.totalUsers;
  const chapters = state.globalStats.unlockedChapters;
  const rate = state.globalStats.successRate;

  if (usersEl) usersEl.textContent = total;
  if (chaptersEl) chaptersEl.textContent = chapters;
  if (rateEl) rateEl.textContent = rate;
  if (heroRateEl) heroRateEl.textContent = rate;
  if (fichesEl) fichesEl.textContent = chapters;
  if (qcmEl) qcmEl.textContent = total > 0 ? total * 3 : 0;
  if (elevesActifsEl) elevesActifsEl.textContent = total;
  if (fichesPubEl) fichesPubEl.textContent = chapters;
}

async function loadPublicStats() {
  if (!supabaseClient) return;
  try {
    const { data, error } = await supabaseClient.rpc('get_public_stats');
    if (error || !data) return;
    state.globalStats.totalUsers = data.total_users || 0;
    state.globalStats.unlockedChapters = data.unlocked_chapters || 0;
    state.globalStats.successRate = data.success_rate || '98%';
  } catch (e) {
    console.warn('Stats publiques indisponibles', e);
  }
}

async function checkSession() {
  state.unlockedChapterIds = [];
  state.unlockedMap = {};
  state.user = null;

  if (!supabaseClient) {
    updateNavbar();
    return;
  }

  try {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session?.user) {
      await hydrateUser(session.user);
      await loadUserUnlocks(session.user.id);
    }
  } catch (e) {
    console.warn('Session Supabase', e);
    state.user = null;
  }
  updateNavbar();
}

async function hydrateUser(authUser) {
  const { data: profile, error } = await supabaseClient
    .from('profiles')
    .select('id, email, name, role, niveau')
    .eq('id', authUser.id)
    .maybeSingle();

  if (error) console.warn('Profil', error);

  state.user = {
    id: authUser.id,
    email: (profile && profile.email) || authUser.email,
    name: (profile && profile.name) || (authUser.user_metadata && authUser.user_metadata.name) || authUser.email.split('@')[0],
    role: (profile && profile.role) || 'client',
    niveau: (profile && profile.niveau) || state.currentNiveau
  };
}

async function loadUserUnlocks(userId) {
  const { data, error } = await supabaseClient
    .from('unlocked_chapters')
    .select('chapter_id, title, niveau, subject, price')
    .eq('user_id', userId);

  if (error) {
    console.warn('Unlocks', error);
    return;
  }

  state.unlockedChapterIds = (data || []).map(r => r.chapter_id);
  state.unlockedMap = {};
  (data || []).forEach(r => {
    state.unlockedMap[r.chapter_id] = {
      title: r.title,
      niveau: r.niveau,
      subject: r.subject,
      price: r.price
    };
  });
}

function updateNavbar() {
  const container = document.getElementById('navActions');
  if (!container) return;

  if (state.user) {
    const isClient = state.user.role === 'client';
    container.innerHTML = `
      <button class="btn btn-outline" onclick="go('${isClient ? 'client-dashboard' : 'admin-dashboard'}')">
        ${isClient ? '👤 Mon Espace Élève' : '⚙️ Espace Admin'}
      </button>
      <button class="btn btn-ghost" onclick="logout()">Déconnexion</button>
    `;
  } else {
    container.innerHTML = `
      <button class="btn btn-primary" onclick="go('auth')">Se connecter / S'inscrire</button>
    `;
  }
}

async function logout() {
  if (supabaseClient) await supabaseClient.auth.signOut();
  state.user = null;
  state.unlockedChapterIds = [];
  state.unlockedMap = {};
  updateNavbar();
  go('dashboard');
}

function go(viewId) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  const target = document.getElementById(`view-${viewId}`);
  if (target) {
    target.classList.add('active');
    state.currentView = viewId;
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (viewId === 'client-dashboard' && state.user) renderClientDashboard();
  if (viewId === 'admin-dashboard' && state.user) renderAdminDashboard();
}

function switchNiveau(niveau) {
  state.currentNiveau = niveau;
  state.currentSerie = niveau === 'bac' ? 'C' : null;
  renderNiveauTabs();
  renderMatieres();
}

function switchSerie(serie) {
  state.currentSerie = serie;
  renderNiveauTabs();
  renderMatieres();
}

function renderNiveauTabs() {
  const tabs = document.getElementById('niveauTabs');
  if (!tabs) return;

  let html = `
    <button class="niveau-tab ${state.currentNiveau === 'brevet' ? 'active' : ''}" onclick="switchNiveau('brevet')">Brevet (3ème)</button>
    <button class="niveau-tab ${state.currentNiveau === 'bac' ? 'active' : ''}" onclick="switchNiveau('bac')">BAC (Terminale)</button>
  `;

  if (state.currentNiveau === 'bac') {
    html += `
      <div style="width:100%; display:flex; justify-content:center; margin-top:12px; gap:8px; flex-wrap:wrap;">
        ${['A', 'B', 'C', 'D', 'G'].map(s => `
          <button class="serie-badge ${state.currentSerie === s ? 'active' : ''}" onclick="switchSerie('${s}')">Série ${s}</button>
        `).join('')}
      </div>
    `;
  }
  tabs.innerHTML = html;
}

function renderMatieres() {
  const grid = document.getElementById('matiereGrid');
  if (!grid) return;

  let currentList;
  if (state.currentNiveau === 'bac') {
    currentList = (matieresData.bac && matieresData.bac[state.currentSerie]) ? matieresData.bac[state.currentSerie] : matieresData.bac["C"];
  } else {
    currentList = matieresData.brevet || [];
  }

  if (currentList.length === 0) {
    grid.innerHTML = `<p style="text-align:center; color:var(--text-muted);">Aucune matière disponible.</p>`;
    return;
  }

  grid.innerHTML = currentList.map(m => `
    <div class="matiere-card" onclick="openMatiere('${escapeStr(m.name)}')">
      <span class="icone">${m.icon}</span>
      <h3>${escapeStr(m.name)}</h3>
      <div class="matiere-meta">
        ${state.currentNiveau === 'bac' ? `<span class="mini-badge serie">Série ${state.currentSerie}</span>` : '<span class="mini-badge brevet">Brevet</span>'}
      </div>
    </div>
  `).join('');
}

function getAllChaptersAndSubjects() {
  const all = [];
  for (const niveau of Object.keys(chapitresDatabase)) {
    const bySubj = chapitresDatabase[niveau];
    for (const subject of Object.keys(bySubj)) {
      for (const chap of bySubj[subject]) {
        all.push({ ...chap, niveau, subject });
      }
    }
  }
  return all;
}

function generateAutoContentFallback(subjectName, niveau) {
  return generateSubjectSpecificContent(subjectName, niveau);
}

function generateSubjectSpecificContent(subjectName, niveau) {
  const knowledge = (KNOWLEDGE_BASE[niveau] && KNOWLEDGE_BASE[niveau][subjectName]) ? KNOWLEDGE_BASE[niveau][subjectName] : null;
  const prefixId = subjectName.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const niveauTexte = niveau === 'bac' ? `Terminale (BAC Série ${state.currentSerie})` : '3ème (Brevet)';
  const price = niveau === 'brevet' ? 100 : 150;
  const FREE_CHAPTER_COUNT = 3; // les 3 premiers chapitres sont gratuits

  const chapters = [];

  // Generate first introductory chapter with subject-specific content
  chapters.push(generateIntroChapter(subjectName, niveau, prefixId, niveauTexte, 1));

  // Generate knowledge-based chapters with unique QCMs
  if (knowledge && knowledge.chapters) {
    knowledge.chapters.forEach((kc, i) => {
      chapters.push(generateKnowledgeChapter(kc, subjectName, niveau, prefixId, chapters.length + 1, i + 2));
    });
  } else {
    // Generate default subject-specific chapters
    const defaultChapters = generateDefaultChaptersForSubject(subjectName, niveau);
    defaultChapters.forEach((dc, i) => {
      chapters.push(generateGenericChapter(dc, subjectName, niveau, prefixId, chapters.length + 1));
    });
  }

  // Generate final comprehensive chapter
  chapters.push(generateFinalChapter(subjectName, niveau, prefixId, niveauTexte, chapters.length + 1));

  // Apply pricing rules: first 3 chapters are free
  return chapters.map((chap, index) => ({
    ...chap,
    isFree: index < FREE_CHAPTER_COUNT,
    price: index < FREE_CHAPTER_COUNT ? 0 : price
  }));
}

async function fetchChaptersFromSupabase(subjectName, niveau, serie = null) {
  if (!supabaseClient) {
    console.warn('Supabase client not available');
    return null;
  }

  try {
    console.log(`🔍 Fetching curriculum for: ${subjectName}, niveau: ${niveau}, serie: ${serie}`);
    
    // Call the get_curriculum_topics RPC function
    const { data, error } = await supabaseClient.rpc('get_curriculum_topics', {
      p_niveau: niveau,
      p_serie: serie,
      p_subject: subjectName
    });

    console.log('📊 RPC Response:', { data, error });

    // If RPC doesn't exist (database not seeded), gracefully return null
    if (error) {
      if (error.code === 'PGRST202' || error.message?.includes('function') || error.message?.includes('404')) {
        console.info(`Database RPC not available (likely not seeded yet): ${error.message}`);
        return null; // Will trigger fallback to AI content
      }
      console.error('Supabase RPC error:', error);
      return null;
    }

    if (!Array.isArray(data) || data.length === 0) {
      console.info(`No curriculum data found for ${subjectName} (${niveau}/${serie}) - using fallback`);
      return null;
    }

    // Get the first matching result
    const row = data[0];
    const topics = row.topics || [];
    
    if (!Array.isArray(topics) || topics.length === 0) {
      console.info(`No topics found for ${subjectName} - using fallback`);
      return null;
    }

    // Transform topics into chapter format compatible with the existing structure
    const price = niveau === 'brevet' ? 100 : 150;
    const FREE_CHAPTER_COUNT = 3; // First 3 chapters are free per business rule

    console.info(`✅ Loaded ${topics.length} chapters for ${subjectName} from database`);

    return topics.map((title, index) => ({
      id: `${niveau}_${subjectName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_db_${index + 1}_${Date.now()}`,
      num: index + 1,
      title: title,
      cours: `📚 ${title}

Ce chapitre fait partie du programme officiel béninois pour ${subjectName} niveau ${niveau === 'bac' ? `BAC série ${serie}` : 'Brevet'}.

Le contenu détaillé du cours, avec toutes les notions essentielles, définitions, formules, méthodes et exemples d'application, est disponible dans ce chapitre débloqué.

🎯 Objectifs d'apprentissage :
• Maîtriser les concepts fondamentaux
• Appliquer les méthodes dans des exercices
• Réussir les questions d'examen sur ce thème

📋 Contenu : Cours complet selon le référentiel MEMP/OBB du Bénin, avec exercices d'application et corrections détaillées.`,
      exemple: {
        titre: `Exemple pratique - ${title.split(':')[0]}`,
        enonce: "Cet exemple illustre une application concrète des concepts de ce chapitre, dans le style des examens béninois.",
        solution: "La solution détaillée est disponible dans le contenu complet de ce chapitre après déblocage."
      },
      exercice: {
        consigne: "QCM de révision - Application du cours",
        question: `Quel est l'objectif principal de l'étude de "${title.split(':').pop()?.trim() || title}" ?`,
        type: "qcm",
        options: [
          "a) Mémoriser des définitions sans comprendre",
          "b) Comprendre et savoir appliquer les concepts dans des situations concrètes", 
          "c) Résoudre uniquement des calculs complexes",
          "d) Apprendre par cœur les formules"
        ],
        correctOption: "b",
        explication: "L'objectif est de comprendre les concepts pour les appliquer efficacement dans diverses situations d'examen."
      },
      isFree: index < FREE_CHAPTER_COUNT,
      price: index < FREE_CHAPTER_COUNT ? 0 : price
    }));

  } catch (error) {
    console.error('Error fetching from Supabase:', error);
    return null;
  }
}

async function fetchAutoContentFromAI(subjectName, niveau) {
  try {
    const token = await getAccessToken();
    const response = await fetch(`${API_BASE_URL}/ai/generate-course`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ subjectName, niveau, serie: state.currentSerie })
    });

    const data = await response.json();
    if (response.ok && data.success && data.chapitres) return data.chapitres;
  } catch (err) {
    console.warn("IA backend indisponible, passage en fallback intelligent.", err);
  }
  return generateAutoContentFallback(subjectName, niveau);
}

async function openMatiere(subjectName) {
  const titleElem = document.getElementById('matiereTitle');
  const listElem = document.getElementById('chapitreList');

  if (titleElem) {
    titleElem.textContent = `${subjectName} — ${state.currentNiveau === 'bac' ? `BAC Série ${state.currentSerie}` : 'Brevet 3ème'}`;
  }
  if (!listElem) return;

  const levelDb = chapitresDatabase[state.currentNiveau] || {};
  let chapitres = levelDb[subjectName] || [];

  if (chapitres.length === 0) {
    listElem.innerHTML = `
      <div style="text-align:center; padding:40px; color:#64748b;">
        <p>📚 <strong>Chargement du programme</strong> depuis la base de données...</p>
      </div>
    `;
    
    // First try to load from Supabase database
    try {
      chapitres = await fetchChaptersFromSupabase(subjectName, state.currentNiveau, state.currentSerie);
      if (chapitres && chapitres.length > 0) {
        levelDb[subjectName] = chapitres;
      }
    } catch (error) {
      console.error('Erreur lors du chargement depuis Supabase:', error);
    }
    
    // Only fallback to AI if database loading failed
    if (!chapitres || chapitres.length === 0) {
      listElem.innerHTML = `
        <div style="text-align:center; padding:40px; color:#64748b;">
          <p>⚠️ Base de données indisponible. Génération de contenu de secours...</p>
        </div>
      `;
      chapitres = await fetchAutoContentFromAI(subjectName, state.currentNiveau);
      levelDb[subjectName] = chapitres;
    }
  }

  listElem.innerHTML = chapitres.map(chap => {
    const isUnlocked = chap.isFree || state.unlockedChapterIds.includes(chap.id);
    return `
      <div class="chapitre-card ${isUnlocked ? 'unlocked' : 'locked'}">
        <div class="chap-info">
          <div style="display:flex; gap:8px; align-items:center; margin-bottom:6px;">
            <span class="chip-num">Chap. ${chap.num}</span>
            ${chap.isFree ? '<span class="mini-badge free">Gratuit</span>' : `<span class="mini-badge paid">${chap.price} FCFA</span>`}
          </div>
          <h4>${escapeStr(chap.title)}</h4>
          <p class="chap-extrait">${escapeStr(chap.cours).substring(0, 140)}...</p>
        </div>
        <div class="chap-action">
          ${isUnlocked
            ? `<button class="btn btn-primary" onclick="viewChapterContent('${chap.id}')">Ouvrir le cours</button>`
            : `<button class="btn btn-outline" onclick="triggerPayChapter('${chap.id}', '${escapeStr(chap.title)}', ${chap.price})">Débloquer ${chap.price} FCFA</button>`
          }
        </div>
      </div>
    `;
  }).join('');

  console.log(`📋 Rendered ${chapitres.length} chapters for ${subjectName}:`, chapitres.map(c => c.title));

  go('matiere');
}

function findChapterByIdAny(chapId) {
  const all = getAllChaptersAndSubjects();
  return all.find(c => c.id === chapId) || null;
}

function viewChapterContent(chapId) {
  let chapter = findChapterByIdAny(chapId);
  if (!chapter) {
    alert("Chapitre non trouvé dans la base de connaissances.");
    return;
  }

  const oldModal = document.getElementById('chapterContentModal');
  if (oldModal) oldModal.remove();

  const modalHtml = `
    <div id="chapterContentModal" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); display:flex; align-items:center; justify-content:center; z-index:9999; padding:20px; box-sizing:border-box;">
      <div style="background:#fff; border-radius:12px; max-width:820px; width:100%; max-height:88vh; overflow-y:auto; padding:28px; box-shadow:0 10px 25px rgba(0,0,0,0.2); position:relative;">

        <button onclick="document.getElementById('chapterContentModal').remove()" style="position:absolute; top:15px; right:15px; border:none; background:transparent; font-size:1.5rem; cursor:pointer; color:#64748b;">✕</button>

        <div style="display:flex; gap:10px; flex-wrap:wrap; margin-bottom:10px;">
          <span class="mini-badge serie">${chapter.niveau.toUpperCase()}</span>
          <span class="mini-badge brevet">${escapeStr(chapter.subject)}</span>
          ${chapter.isFree ? '<span class="mini-badge free">Gratuit</span>' : '<span class="mini-badge paid">Premium</span>'}
        </div>

        <h2 style="margin-top:0; color:#1e293b; border-bottom:2px solid #e2e8f0; padding-bottom:10px;">${escapeStr(chapter.title)}</h2>

        <div style="margin-bottom:25px;">
          <h3 style="color:#2563eb; margin-bottom:8px;">📖 Cours complet</h3>
          <p style="line-height:1.7; color:#334155; background:#f8fafc; padding:18px; border-radius:8px; border-left:4px solid #2563eb; margin:0; white-space: pre-wrap;">
            ${escapeStr(chapter.cours)}
          </p>
        </div>

        ${chapter.exemple ? `
        <div style="margin-bottom:25px;">
          <h3 style="color:#059669; margin-bottom:8px;">💡 ${escapeStr(chapter.exemple.titre || 'Exemple guidé')}</h3>
          <div style="background:#ecfdf5; padding:18px; border-radius:8px; border:1px solid #a7f3d0;">
            <p style="margin-top:0;"><strong>Énoncé :</strong> ${escapeStr(chapter.exemple.enonce)}</p>
            <p style="margin-bottom:0; color:#065f46;"><strong>Solution :</strong> ${escapeStr(chapter.exemple.solution)}</p>
          </div>
        </div>
        ` : ''}

        ${chapter.exercice ? `
        <div>
          <h3 style="color:#d97706; margin-bottom:8px;">✏️ ${escapeStr(chapter.exercice.consigne || 'Exercice QCM / Vrai-Faux')}</h3>
          <div style="background:#fffbeb; padding:18px; border-radius:8px; border:1px solid #fde68a;">
            <p style="margin-top:0;"><strong>Question :</strong> ${escapeStr(chapter.exercice.question)}</p>
            <div id="exerciseArea_${chapId}" style="margin:14px 0;">
              ${chapter.exercice.type === 'vf' ? `
                <label style="display:block; margin-bottom:8px; cursor:pointer;"><input type="radio" name="exOpt_${chapId}" value="vrai"> VRAI</label>
                <label style="display:block; margin-bottom:8px; cursor:pointer;"><input type="radio" name="exOpt_${chapId}" value="faux"> FAUX</label>
              ` : (chapter.exercice.options || []).map(opt => `
                <label style="display:block; margin-bottom:8px; cursor:pointer; color:#1e293b;">
                  <input type="radio" name="exOpt_${chapId}" value="${opt.charAt(0).toLowerCase()}" style="margin-right:8px;">
                  ${escapeStr(cleanQuizOption(opt))}
                </label>
              `).join('')}
            </div>
            <button class="btn btn-primary" onclick="checkChapterExercise('${chapId}')" style="margin-top:8px;">Vérifier ma réponse</button>
            <div id="chapExFeedback_${chapId}" style="margin-top:12px; display:none; padding:12px; border-radius:6px; font-weight:500; line-height:1.6;"></div>
          </div>
        </div>
        ` : ''}

      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHtml);
  if (window.MathJax) setTimeout(() => MathJax.typesetPromise(), 100);
}

function checkChapterExercise(chapId) {
  const chapter = findChapterByIdAny(chapId);
  if (!chapter || !chapter.exercice) return;

  const selected = document.querySelector(`input[name="exOpt_${chapId}"]:checked`);
  const feedback = document.getElementById(`chapExFeedback_${chapId}`);
  if (!feedback) return;

  if (!selected) {
    alert("Veuillez d'abord sélectionner une réponse.");
    return;
  }

  feedback.style.display = 'block';
  let ok = false;
  if (chapter.exercice.type === 'vf') {
    const correct = chapter.exercice.correctOption === 'vrai' ? 'vrai' : 'faux';
    ok = selected.value === correct;
  } else {
    const correct = String(chapter.exercice.correctOption || '').toLowerCase();
    ok = selected.value === correct;
  }

  if (ok) {
    feedback.style.background = '#dcfce7';
    feedback.style.color = '#166534';
    feedback.innerHTML = `<strong>✅ Bravo !</strong> Bonne réponse.<br>${escapeStr(chapter.exercice.explication || 'Excellent travail.')}`;
  } else {
    feedback.style.background = '#fee2e2';
    feedback.style.color = '#991b1b';
    const correctTxt = chapter.exercice.type === 'vf'
      ? (chapter.exercice.correctOption === 'vrai' ? 'VRAI' : 'FAUX')
      : `Réponse : ${String(chapter.exercice.correctOption || '').toUpperCase()}`;
    feedback.innerHTML = `<strong>❌ Incorrect.</strong> La bonne réponse était <strong>${correctTxt}</strong>.<br>${escapeStr(chapter.exercice.explication || 'Revois le cours et réessaie !')}`;
  }
}

function switchAuthTab(tab) {
  const isLogin = tab === 'login';
  document.getElementById('tabLogin').classList.toggle('active', isLogin);
  document.getElementById('tabSignup').classList.toggle('active', !isLogin);
  document.getElementById('formLogin').style.display = isLogin ? 'block' : 'none';
  document.getElementById('formSignup').style.display = isLogin ? 'none' : 'block';
}

async function handleLogin(e) {
  if (e && e.preventDefault) e.preventDefault();
  if (!requireSupabase()) return false;

  const email = document.getElementById('loginEmail').value.trim();
  const pass = document.getElementById('loginPass').value;

  if (!email || !pass) {
    alert("Renseignez votre email et mot de passe.");
    return false;
  }

  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password: pass });
  if (error) {
    alert("Connexion impossible : " + error.message);
    return false;
  }

  await hydrateUser(data.user);
  await loadUserUnlocks(data.user.id);
  updateNavbar();
  await loadPublicStats();
  renderHomeStats();

  if (state.user.role === 'admin') { go('admin-dashboard'); renderAdminDashboard(); }
  else { go('client-dashboard'); renderClientDashboard(); }
  return false;
}

async function countAdmins() {
  if (!supabaseClient) return 0;
  const { count, error } = await supabaseClient
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('role', 'admin');
  if (error) return state.usersList.filter(u => u.role === 'admin').length;
  return count || 0;
}

async function handleSignup(e) {
  if (e && e.preventDefault) e.preventDefault();
  if (!requireSupabase()) return false;

  const name = document.getElementById('signupName').value.trim();
  const email = document.getElementById('signupEmail').value.trim();
  const pass = document.getElementById('signupPass').value;
  const passConf = document.getElementById('signupPassConfirm').value;
  const role = document.querySelector('input[name="signupRole"]:checked').value;

  if (!name || !email || !pass || !passConf) { alert("Veuillez remplir tous les champs."); return false; }
  if (pass.length < 6) { alert("Le mot de passe doit contenir au moins 6 caractères."); return false; }
  if (pass !== passConf) { alert("⚠️ Les deux mots de passe ne correspondent pas !"); return false; }
  if (role === 'admin' && (await countAdmins()) >= MAX_ADMINS) {
    alert(`🚫 Limite atteinte : maximum ${MAX_ADMINS} administrateurs autorisés.`);
    return false;
  }

  const { data, error } = await supabaseClient.auth.signUp({
    email,
    password: pass,
    options: {
      data: { name, role, niveau: state.currentNiveau }
    }
  });

  if (error) {
    alert("Inscription impossible : " + error.message);
    return false;
  }

  if (!data.session) {
    alert("Compte créé ! Vérifie ton email pour confirmer, puis connecte-toi.");
    switchAuthTab('login');
    return false;
  }

  await hydrateUser(data.user);
  await loadUserUnlocks(data.user.id);
  updateNavbar();
  await loadPublicStats();
  renderHomeStats();

  if (state.user.role === 'admin') { go('admin-dashboard'); renderAdminDashboard(); }
  else { go('client-dashboard'); renderClientDashboard(); }
  return false;
}

function triggerPayChapter(chapId, title, price) {
  if (!state || !state.user) {
    alert("Veuillez vous connecter (ou créer un compte) pour débloquer ce chapitre premium.");
    go('auth');
    return;
  }

  if (typeof FedaPay !== 'undefined') {
    try {
      const widget = FedaPay.init({
        public_key: FEDAPAY_PUBLIC_KEY,
        environment: 'live',
        transaction: { amount: price, description: `Revizy - Achat ${title}` },
        customer: { email: state.user.email || 'eleve@revizy.bj', lastname: state.user.name || 'Élève' },
        onComplete: (response) => {
          const ok = response && (
            response.reason === FedaPay.CHECKOUT_COMPLETED ||
            response.status === 'approved' ||
            response.reason === 'APPROVED'
          );
          if (ok) finishUnlock(chapId, title, price, 'FedaPay (MoMo)');
          else alert("Paiement annulé ou échoué.");
        }
      });
      widget.open();
      return;
    } catch (e) { console.error(e); }
  }

  go('client-dashboard');
  switchClientTab('momo');
  populateMomoChapterSelect(chapId, title, price);
  alert("Redirection vers le paiement Mobile Money manuel. Remplissez et validez !");
}

function populateMomoChapterSelect(preselectId, title, price) {
  const select = document.getElementById('momoChapterSelect');
  if (!select) return;

  const all = getAllChaptersAndSubjects().filter(c => !c.isFree);
  select.innerHTML = all.map(c => {
    const chapTitle = `[${c.niveau.toUpperCase()}] ${c.subject} — ${c.title} (${c.price} FCFA)`;
    const pre = (preselectId && c.id === preselectId) ? 'selected' : '';
    return `<option value="${c.id}" data-price="${c.price}" ${pre}>${chapTitle}</option>`;
  }).join('');
}

function handleMoMoPayment(e) {
  if (e && e.preventDefault) e.preventDefault();
  const providerElem = document.getElementById('momoProvider');
  const phoneElem = document.getElementById('momoPhone');
  const select = document.getElementById('momoChapterSelect');
  if (!select || select.selectedIndex === -1) { alert("Choisissez un chapitre."); return false; }

  const provider = providerElem ? providerElem.value : 'MTN MoMo';
  const phone = phoneElem ? phoneElem.value.replace(/[^0-9]/g, '').trim() : '';
  const chapId = select.value;
  const selectedOption = select.options[select.selectedIndex];
  const chapTitle = selectedOption ? selectedOption.text.split('(')[0].trim() : 'Chapitre';
  const price = parseInt(selectedOption ? (selectedOption.dataset.price || 0) : 0, 10) || (state.currentNiveau === 'brevet' ? 150 : 200);

  if (!phone || phone.length < 8) { alert("Numéro de téléphone invalide (8 chiffres minimum)."); return false; }

  alert(`💬 Demande envoyée au ${phone} (${provider}). Validez sur votre téléphone la somme de ${price} FCFA.`);

  setTimeout(() => finishUnlock(chapId, chapTitle, price, `${provider} MoMo`), 1500);
  return false;
}

async function finishUnlock(chapId, title, price, providerLabel) {
  if (!state.user) {
    alert("Connecte-toi pour enregistrer ton achat.");
    go('auth');
    return;
  }

  const chap = findChapterByIdAny(chapId);
  const meta = {
    title: (chap && chap.title) || title,
    niveau: (chap && chap.niveau) || state.currentNiveau,
    subject: (chap && chap.subject) || '',
    price
  };

  if (supabaseClient) {
    const { error: unlockErr } = await supabaseClient.from('unlocked_chapters').upsert({
      user_id: state.user.id,
      chapter_id: chapId,
      title: meta.title,
      niveau: meta.niveau,
      subject: meta.subject,
      price,
      provider: providerLabel
    }, { onConflict: 'user_id,chapter_id' });

    if (unlockErr) {
      console.error(unlockErr);
      alert("Paiement OK mais enregistrement échoué : " + unlockErr.message);
      return;
    }

    await supabaseClient.from('transactions').insert({
      user_id: state.user.id,
      chapter_id: chapId,
      chapter_title: meta.title,
      amount: price,
      provider: providerLabel
    });
  }

  if (!state.unlockedChapterIds.includes(chapId)) {
    state.unlockedChapterIds.push(chapId);
  }
  state.unlockedMap[chapId] = meta;

  state.transactions.unshift({
    date: new Date().toLocaleDateString('fr-FR'),
    phone: `+229 (${providerLabel})`,
    provider: providerLabel,
    chapter: title,
    amount: `${price} FCFA`
  });

  await loadPublicStats();
  updateRealtimeStats();
  renderUnlockedChapters();
  alert(`🎉 Paiement de ${price} FCFA réussi ! Le chapitre "${title}" est désormais débloqué à vie sur votre compte.`);
  if (state.currentView === 'client-dashboard') switchClientTab('cours');
}

function renderUnlockedChapters() {
  const container = document.getElementById('clientUnlockedGrid');
  const countElem = document.getElementById('clientUnlockedCount');

  if (countElem) countElem.textContent = state.unlockedChapterIds.length;
  if (!container) return;

  const freeChapters = getAllChaptersAndSubjects().filter(c => c.isFree);
  const allUnlockedMeta = state.unlockedChapterIds.map(id => {
    const fromDb = findChapterByIdAny(id);
    if (fromDb) return fromDb;
    const m = state.unlockedMap[id];
    return { id, title: m ? m.title : id.replace(/_/g, ' '), niveau: m ? m.niveau : '?', subject: m ? m.subject : '?', isFree: false };
  });

  const combined = [...freeChapters.map(c => ({ ...c, source: 'free' })), ...allUnlockedMeta.map(c => ({ ...c, source: 'paid' }))];
  const seen = new Set();
  const unique = combined.filter(c => seen.has(c.id) ? false : (seen.add(c.id), true));

  if (unique.length === 0) {
    container.innerHTML = `
      <p style="color:var(--text-muted, #64748b); font-size:0.9rem;">
        Aucun chapitre pour l'instant. Rappel : Le <strong>Chapitre 1</strong> de chaque matière est <strong>GRATUIT</strong>, les autres sont payants.
      </p>`;
    return;
  }

  container.innerHTML = unique.sort((a, b) => (a.niveau + a.subject).localeCompare(b.niveau + b.subject)).map(c => `
    <div class="unlocked-card">
      <div class="unlocked-meta">
        <div style="display:flex; gap:6px; flex-wrap:wrap; margin-bottom:4px;">
          <span class="mini-badge ${c.niveau === 'bac' ? 'serie' : 'brevet'}">${c.niveau.toUpperCase()}</span>
          <span class="mini-badge">${escapeStr(c.subject)}</span>
          ${c.source === 'free' ? '<span class="mini-badge free">Gratuit</span>' : '<span class="mini-badge paid">Premium</span>'}
        </div>
        <strong style="font-size:0.95rem;">${escapeStr(c.title)}</strong><br>
        <span style="font-size:0.8rem; color:var(--text-muted, #64748b);">Accès illimité ✓</span>
      </div>
      <button class="btn btn-primary" style="padding: 6px 12px; font-size:0.8rem;" onclick="viewChapterContent('${escapeStr(c.id)}')">
        Accéder
      </button>
    </div>
  `).join('');
}

function renderClientDashboard() {
  if (!state.user) return;
  const welcome = document.getElementById('clientWelcomeTitle');
  const avatar = document.getElementById('clientAvatar');
  const niveauText = document.getElementById('clientUserNiveau');

  const userName = state.user.name || 'Élève';
  if (welcome) welcome.textContent = `Ravi de te revoir, ${escapeStr(userName)} ! 👋`;
  if (avatar) avatar.textContent = userName.charAt(0).toUpperCase();
  if (niveauText) niveauText.textContent = state.currentNiveau === 'bac' ? `Terminale (BAC Série ${state.currentSerie})` : '3ème (Brevet)';

  renderUnlockedChapters();
  renderClientQcmTab();
  populateMomoChapterSelect();
}

function switchClientTab(tabName) {
  const tabs = ['cours', 'qcm', 'momo'];
  tabs.forEach(t => {
    const el = document.getElementById(`clientTab${t.charAt(0).toUpperCase() + t.slice(1)}`);
    if (el) el.style.display = (t === tabName) ? 'block' : 'none';
  });
  const buttons = document.querySelectorAll('#view-client-dashboard .dash-tab');
  buttons.forEach((btn, index) => {
    if (btn) btn.classList.toggle('active', tabs[index] === tabName);
  });
  if (tabName === 'qcm') renderClientQcmTab();
}

function renderClientQcmTab() {
  const section = document.getElementById('clientTabQcm');
  if (!section) return;

  const pool = getAllChaptersAndSubjects()
    .filter(c => c.isFree || state.unlockedChapterIds.includes(c.id))
    .filter(c => c.exercice);

  const container = section.querySelector('.qcm-container') || section.querySelector('.client-section');
  if (!container) return;

  if (pool.length === 0) {
    container.innerHTML = `
      <h3><i data-lucide="check-square"></i> Test de Connaissances</h3>
      <p class="text-muted" style="margin:20px 0;">Aucun cours débloqué pour proposer des QCM. Débloque un chapitre (ou profite des CHAPITRES 1 GRATUITS) !</p>
    `;
    if (window.lucide) setTimeout(() => lucide.createIcons(), 50);
    return;
  }

  const pick = pool[Math.floor(Math.random() * pool.length)];
  state.currentClientQcm = pick;

  const isVf = pick.exercice.type === 'vf';
  container.innerHTML = `
    <h3><i data-lucide="check-square"></i> Test de Connaissances — ${escapeStr(pick.subject)} (${pick.niveau.toUpperCase()})</h3>
    <p class="text-muted" style="margin-bottom:20px;">
      Question tirée aléatoirement de tes cours débloqués — <em>${escapeStr(pick.title)}</em>
    </p>

    <div class="qcm-card">
      <div class="qcm-question" id="qcmQuestionText">
        <strong>Question :</strong> ${escapeStr(pick.exercice.question)}
        <div style="margin-top:8px;"><span class="mini-badge ${isVf ? 'paid' : 'serie'}">${isVf ? 'VRAI / FAUX' : 'QCM'}</span></div>
      </div>
      <div class="qcm-options" id="qcmOptionsBox">
        ${isVf ? `
          <label class="qcm-opt"><input type="radio" name="qcmOpt" value="vrai"> <span>VRAI</span></label>
          <label class="qcm-opt"><input type="radio" name="qcmOpt" value="faux"> <span>FAUX</span></label>
        ` : (pick.exercice.options || []).map(opt => `
          <label class="qcm-opt"><input type="radio" name="qcmOpt" value="${opt.charAt(0).toLowerCase()}"> <span>${escapeStr(cleanQuizOption(opt))}</span></label>
        `).join('')}
      </div>
      <div style="margin-top:15px; display:flex; gap:10px; flex-wrap:wrap;">
        <button class="btn btn-primary" onclick="submitQCMAnswer()">Valider ma réponse</button>
        <button class="btn btn-outline" onclick="renderClientQcmTab()">🔄 Nouvelle question</button>
      </div>
      <div id="qcmFeedback" class="qcm-feedback" style="display:none; margin-top:15px; line-height:1.6;"></div>
    </div>
  `;
  if (window.lucide) setTimeout(() => lucide.createIcons(), 50);
  if (window.MathJax) setTimeout(() => MathJax.typesetPromise(), 100);
}

function submitQCMAnswer() {
  const selected = document.querySelector('input[name="qcmOpt"]:checked');
  const feedback = document.getElementById('qcmFeedback');
  if (!feedback) return;
  if (!selected) { alert("Veuillez sélectionner une réponse."); return; }

  const pick = state.currentClientQcm;
  if (!pick) return;
  const isVf = pick.exercice.type === 'vf';
  let ok;
  if (isVf) ok = selected.value === (pick.exercice.correctOption === 'vrai' ? 'vrai' : 'faux');
  else ok = selected.value === String(pick.exercice.correctOption || '').toLowerCase();

  feedback.style.display = 'block';
  if (ok) {
    feedback.className = 'qcm-feedback success';
    feedback.innerHTML = `<strong>✅ Bravo, bon travail !</strong><br>${escapeStr(pick.exercice.explication || '')}`;
  } else {
    const correct = isVf
      ? (pick.exercice.correctOption === 'vrai' ? 'VRAI' : 'FAUX')
      : `Option ${String(pick.exercice.correctOption || '').toUpperCase()}`;
    feedback.className = 'qcm-feedback error';
    feedback.innerHTML = `<strong>❌ Raté.</strong> La bonne réponse était <strong>${correct}</strong>.<br>${escapeStr(pick.exercice.explication || '')}`;
  }
}

function updateRealtimeStats() {
  state.adminStats.revenue = state.transactions.reduce((total, tx) => {
    const n = parseInt(String(tx.amount).replace(/[^0-9]/g, ''), 10) || 0;
    return total + n;
  }, 0);
  state.adminStats.studentsCount = state.usersList.filter(u => u.role === 'client').length;
  state.globalStats.totalUsers = state.usersList.length;
  state.globalStats.unlockedChapters = state.transactions.length;
  renderHomeStats();
  renderAdminDashboard();
}

function renderAdminDashboard() {
  const rev = document.getElementById("adminTotalRevenue");
  if (rev) rev.innerText = state.adminStats.revenue.toLocaleString() + " FCFA";

  const txTable = document.getElementById("adminTxTableBody");
  if (txTable) {
    txTable.innerHTML = state.transactions.map(tx => {
      const p = String(tx.provider || '').toLowerCase();
      const cls = p.includes('mtn') ? 'mtn' : 'moov';
      return `
        <tr>
          <td>${escapeStr(tx.date)}</td>
          <td>${escapeStr(tx.phone)}</td>
          <td><span class="badge-mmo ${cls}">${escapeStr(tx.provider)}</span></td>
          <td>${escapeStr(tx.chapter)}</td>
          <td><strong>${escapeStr(tx.amount)}</strong></td>
        </tr>`;
    }).join('');
  }

  const userList = document.getElementById("adminUserList");
  if (userList) {
    userList.innerHTML = state.usersList.map(u => `
      <li>
        <div><strong>${escapeStr(u.name)}</strong> (${escapeStr(u.email)})</div>
        <span class="badge-free">${u.role === 'admin' ? 'Admin' : `Élève ${u.niveau === 'bac' ? 'BAC' : 'Brevet'}`}</span>
      </li>`).join('');
  }
}

function switchAdminTab(tabName) {
  const tabs = ['content', 'transactions', 'users'];
  tabs.forEach(t => {
    const el = document.getElementById(`adminTab${t.charAt(0).toUpperCase() + t.slice(1)}`);
    if (el) el.style.display = (t === tabName) ? 'block' : 'none';
  });
  const buttons = document.querySelectorAll('#view-admin-dashboard .dash-tab');
  buttons.forEach((btn, index) => {
    if (btn) btn.classList.toggle('active', tabs[index] === tabName);
  });
}

function toggleChatbot() {
  const box = document.getElementById('chatbotBox');
  if (box) box.style.display = (box.style.display === 'none' || !box.style.display) ? 'flex' : 'none';
}

async function generateAiResponse(userPrompt) {
  const level = state.currentNiveau === 'bac' ? `Terminale BAC Série ${state.currentSerie} Bénin` : '3ème Brevet Bénin';
  try {
    const token = await getAccessToken();
    const response = await fetch(`${API_BASE_URL}/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ prompt: userPrompt, niveau: level })
    });
    const data = await response.json();
    if (response.ok && data.reply) return data.reply;
    return data.message || buildLocalReply(userPrompt, level);
  } catch (e) {
    return buildLocalReply(userPrompt, level);
  }
}

function buildLocalReply(prompt, level) {
  const p = prompt.toLowerCase();
  if (p.includes('bonjour') || p.includes('salut') || p.includes('coucou'))
    return `Salut ! 👋 Je suis ton tuteur Revizy pour le ${level}. Pose-moi une question de cours, un exercice, une notion, je t'explique.`;
  if (p.includes('thales') || p.includes('thalès'))
    return "📐 Thalès : si deux droites sont parallèles et coupent deux droites sécantes → segments proportionnels. Réciproque vraie aussi ! Application : calcul de longueurs dans un triangle.";
  if (p.includes('pythagore'))
    return "📐 Pythagore : triangle rectangle → hypo² = côté² + autre côté². Ex : 3-4-5 → 25=9+16 ✅. Réciproque : si BC²=AB²+AC² alors triangle ABC rectangle en A.";
  if (p.includes('newton'))
    return "🧪 Lois de Newton : 1) inertie (repose si pas de force ou ∑F=0). 2) ∑F=m·a (RFD). 3) action-réaction : forces opposées de même intensité entre deux corps.";
  if (p.includes('dériv') || p.includes('deriv'))
    return "📐 Dérivée : (xⁿ)' = n·xⁿ⁻¹, (e^u)' = u'·e^u, (uv)' = u'v + uv', (u/v)' = (u'v-uv')/v². Interprétation géométrique : coefficient directeur tangente.";
  if (p.includes('mot de passe') || p.includes('mdp') || p.includes('mot de passe'))
    return "🔐 Pour réinitialiser un mot de passe (version démo), déconnecte-toi, puis réinscris-toi. Ou contacte support WhatsApp en pied de page.";
  return `[Hors-ligne Revizy IA] — Niveau : ${level}. Je n'ai pas de connexion IA en ce moment, mais n'hésite pas à : 1) Ouvrir tes fiches dans 'Mes Cours', 2) Faire le QCM d'auto-évaluation, 3) Me poser une question sur un cours précis (ex: 'Explique Pythagore').`;
}

async function sendChatMessage(e) {
  if (e && e.preventDefault) e.preventDefault();
  const input = document.getElementById('chatbotInput');
  const msgContainer = document.getElementById('chatbotMessages');
  if (!input || !msgContainer || !input.value.trim()) return false;

  const userText = input.value.trim();
  msgContainer.innerHTML += `<div class="msg user">${escapeStr(userText)}</div>`;
  input.value = '';
  msgContainer.scrollTop = msgContainer.scrollHeight;

  const loadingId = `loading-${Date.now()}`;
  msgContainer.innerHTML += `<div class="msg bot" id="${loadingId}"><em>Revizy IA réfléchit... 🤔</em></div>`;
  msgContainer.scrollTop = msgContainer.scrollHeight;

  const botReply = await generateAiResponse(userText);
  const loadingElem = document.getElementById(loadingId);
  if (loadingElem) loadingElem.innerHTML = escapeStr(botReply).replace(/\n/g, '<br>');
  msgContainer.scrollTop = msgContainer.scrollHeight;
  return false;
}

function handleGlobalSearch(query) {
  const dropdown = document.getElementById('searchResultsDropdown');
  if (!dropdown) return;
  if (!query.trim()) { dropdown.style.display = 'none'; return; }
  const q = query.toLowerCase().trim();

  const results = [];

  const subjectList = state.currentNiveau === 'bac'
    ? (matieresData.bac[state.currentSerie] || [])
    : matieresData.brevet;
  subjectList.filter(m => m.name.toLowerCase().includes(q)).forEach(m => {
    results.push({
      kind: 'subject',
      icon: m.icon,
      label: `Matière : ${m.name}`,
      onclick: `openMatiere('${escapeStr(m.name)}'); closeSearch()`
    });
  });

  getAllChaptersAndSubjects()
    .filter(c =>
      c.title.toLowerCase().includes(q) ||
      c.cours.toLowerCase().includes(q) ||
      c.subject.toLowerCase().includes(q)
    )
    .slice(0, 10)
    .forEach(c => {
      results.push({
        kind: 'chapter',
        icon: '📄',
        label: `Chapitre [${c.niveau.toUpperCase()} ${c.subject}] : ${c.title}`,
        onclick: `go('matiere'); openMatiere('${escapeStr(c.subject)}'); setTimeout(()=>{ window.scrollTo({top:0, behavior:'smooth'}); }, 50); closeSearch()`
      });
    });

  dropdown.style.display = 'block';
  if (results.length === 0) {
    dropdown.innerHTML = `<div style="padding:12px; color:var(--text-muted);">Aucun résultat pour « ${escapeStr(query)} »</div>`;
  } else {
    dropdown.innerHTML = results.map(r => `
      <div class="search-item" onclick="${r.onclick}">
        <span>${r.icon}</span> ${escapeStr(r.label)}
      </div>
    `).join('');
  }
}

function closeSearch() {
  const d = document.getElementById('searchResultsDropdown');
  if (d) d.style.display = 'none';
}

function handleAddChapter(e) {
  if (e && e.preventDefault) e.preventDefault();
  const title = document.getElementById('adminChapTitle').value.trim();
  const subject = document.getElementById('adminChapSubject').value;
  const niveau = document.getElementById('adminChapNiveau').value;
  const pdf = document.getElementById('adminChapPdfUrl').value.trim();

  if (!title || !subject || !pdf) { alert("Remplissez tous les champs."); return false; }

  const id = `${niveau}_admin_${subject.toLowerCase().replace(/[^a-z0-9]/g,'_')}_${Date.now()}`;
  const price = niveau === 'brevet' ? 100 : 150;
  const newChap = {
    id, num: 99, title,
    isFree: false, price,
    cours: `Chapitre publié par l'administrateur. PDF : ${pdf}. Contenu du cours à venir...`,
    exemple: { titre: "Exemple à venir", enonce: "À compléter.", solution: "À compléter." },
    exercice: { consigne: "QCM à ajouter", question: "À compléter.", type: "qcm", options: ["a)", "b)", "c)"], correctOption: "a", explication: "À ajouter." }
  };

  if (!chapitresDatabase[niveau][subject]) chapitresDatabase[niveau][subject] = [];
  chapitresDatabase[niveau][subject].push(newChap);
  state.adminStats.fichesCount++;

  alert(`✅ Chapitre ajouté !\nMatière : ${subject}\nNiveau : ${niveau.toUpperCase()}\nTitre : ${title}`);
  renderAdminDashboard();
  renderMatieres();
  e.target.reset();
  return false;
}

function toggleQcmType(type) {
  const gq = document.getElementById('groupQCM');
  const gv = document.getElementById('groupVF');
  if (type === 'vf') {
    if (gq) gq.style.display = 'none';
    if (gv) gv.style.display = 'block';
  } else {
    if (gq) gq.style.display = 'block';
    if (gv) gv.style.display = 'none';
  }
}

function handleAddQCM(e) {
  if (e && e.preventDefault) e.preventDefault();
  const type = document.getElementById('adminQcmType')?.value || 'qcm';
  const question = document.getElementById('adminQcmQuestion').value.trim();
  if (!question) { alert("Énoncez la question."); return false; }

  if (type === 'vf') {
    const answer = document.getElementById('adminVfAnswer').value;
    alert(`✅ Vrai/Faux enregistré !\nQuestion : ${question}\nRéponse : ${answer.toUpperCase()}`);
  } else {
    const optA = document.getElementById('adminQcmOptA').value.trim() || 'A';
    const optB = document.getElementById('adminQcmOptB')?.value?.trim() || 'B';
    alert(`✅ QCM enregistré !\nQuestion : ${question}\nBonne réponse = Option A : ${optA}\nDistracteur B : ${optB}`);
  }
  e.target.reset();
  toggleQcmType('qcm');
  return false;
}

function generateAutoContent(subjectName, niveau) {
  return generateAutoContentFallback(subjectName, niveau);
}
