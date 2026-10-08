// Configuration globale dynamique via config.js
const cfg = window.REVIZY_CONFIG || {};

const API_BASE_URL = cfg.API_BASE_URL || (
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
    ? "http://localhost:5000/v1"
    : "https://revisy.onrender.com/v1"
);

const FEDAPAY_PUBLIC_KEY = cfg.FEDAPAY_PUBLIC_KEY || '';
const MAX_ADMINS = typeof cfg.MAX_ADMINS === 'number' ? cfg.MAX_ADMINS : 2;

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
        { title: "Nombres entiers, rationnels et puissances", sa: "SA 1",
          cours: "Nombres entiers relatifs Z, opérations (+, -, ×, ÷) et priorités opératoires. Nombres rationnels Q = a/b (b≠0), simplification, addition, soustraction, multiplication et division de fractions. Puissances entières positives et négatives : a^n, règles de calcul (a^m × a^n = a^{m+n}, (a^m)^n = a^{m×n}, a^n / a^m = a^{n-m}). Décomposition en produit de facteurs premiers, calcul du PGCD et du PPCM, fractions irréductibles." },
        { title: "Calcul littéral, factorisation et identités remarquables", sa: "SA 1",
          cours: "Expressions littérales : réduction et ordonnancement selon les puissances décroissantes. Développement par distributivité simple k(a+b) = ka+kb et double (a+b)(c+d) = ac+ad+bc+bd. Les 3 identités remarquables fondamentales : (a+b)² = a² + 2ab + b², (a-b)² = a² - 2ab + b², (a+b)(a-b) = a² - b². Factorisation par recherche d'un facteur commun évident ou par reconnaissance d'une identité remarquable." },
        { title: "Équations et inéquations du premier degré", sa: "SA 1",
          cours: "Équation du premier degré à une inconnue ax + b = 0 (avec a≠0) : méthode d'isolation de l'inconnue x = -b/a. Équations-produits nuls : (ax+b)(cx+d) = 0 équivaut à ax+b = 0 ou cx+d = 0. Inéquations du premier degré : résolution, représentation des solutions sur une droite graduée, inversion du sens de l'inégalité lors de la multiplication ou division par un nombre négatif. Mise en équation et résolution de problèmes de la vie courante." },
        { title: "Propriété de Thalès dans le triangle", sa: "SA 2",
          cours: "Théorème de Thalès direct : dans un triangle ABC, si M ∈ [AB], N ∈ [AC] et les droites (MN) et (BC) sont parallèles, alors AM/AB = AN/AC = MN/BC. Configuration papillon ou sablier. Réciproque du théorème de Thalès : condition d'alignement des points dans le même ordre et égalité des rapports pour prouver le parallélisme de deux droites. Applications aux partages de segments et réductions/agrandissements de figures géométriques." },
        { title: "Triangle rectangle, Théorème de Pythagore et Trigonométrie", sa: "SA 2",
          cours: "Théorème de Pythagore : dans un triangle ABC rectangle en A, BC² = AB² + AC² (le carré de l'hypoténuse est égal à la somme des carrés des côtés de l'angle droit). Réciproque de Pythagore : caractérisation du triangle rectangle. Trigonométrie de l'angle aigu α : cos α = côté adjacent / hypoténuse, sin α = côté opposé / hypoténuse, tan α = côté opposé / côté adjacent = sin α / cos α. Propriétés : 0 < cos α < 1, 0 < sin α < 1, cos² α + sin² α = 1. Angles remarquables 30°, 45°, 60°." },
        { title: "Fonctions linéaires et affines", sa: "SA 3",
          cours: "Fonction linéaire f(x) = ax : coefficient de proportionnalité a, droite passant par l'origine du repère O(0,0). Fonction affine f(x) = ax + b : coefficient directeur (pente) a = (f(x₂)-f(x₁))/(x₂-x₁), ordonnée à l'origine b. Représentation graphique dans un repère orthonormé. Sens de variation : croissante si a > 0, décroissante si a < 0, constante si a = 0. Détermination d'une fonction affine à partir de deux points." },
        { title: "Systèmes de deux équations à deux inconnues", sa: "SA 3",
          cours: "Forme générale : { ax + by = c ; a'x + b'y = c' }. Méthodes de résolution algébrique : méthode par substitution (exprimer une variable en fonction de l'autre), méthode par combinaisons linéaires (élimination d'une variable par multiplication des lignes). Interprétation graphique : coordonnées du point d'intersection des deux droites. Cas des droites parallèles (aucune solution) ou confondues (infinité de solutions). Problèmes concrets d'achat et de partage." },
        { title: "Statistiques et organisation de données", sa: "SA 4",
          cours: "Série statistique : population, caractère (qualitatif ou quantitatif discret/continu), effectifs, effectif total N. Fréquences relatives f = n/N et pourcentages. Moyenne simple et moyenne pondérée x̄ = ∑(n_i × x_i) / N. Médiane Me (valeur qui partage la série ordonnée en deux groupes de même effectif). Représentations graphiques : diagramme en bâtons, histogramme, diagramme circulaire (angle = fréquence × 360°)." }
      ]
    },
    "Physique-Chimie-Technologie": {
      chapters: [
        { title: "Le courant électrique alternatif sinusoïdal", sa: "SA 1",
          cours: "Production du courant alternatif : rotation d'un aimant devant une bobine fixe (phénomène d'induction électromagnétique, alternateur). Caractéristiques visualisées à l'oscilloscope : tension maximale U_max (en volts), tension crête à crête U_cc = 2 U_max. Période T : durée d'un motif élémentaire en secondes (s). Fréquence f = 1/T en Hertz (Hz). Réseau électrique béninois de la SBEE : f = 50 Hz, tension efficace nominale U_eff = 220 V. Relation fondamentale pour une tension sinusoïdale : U_max = U_eff × √2 (avec √2 ≈ 1,414)." },
        { title: "Puissance et énergie électriques — Sécurité domestique", sa: "SA 1",
          cours: "Puissance électrique consommée en régime alternatif : P = U_eff × I_eff (pour récepteur purement thermique) en Watts (W). Énergie électrique : E = P × t (en Joules J si t en secondes, en kilowattheure kWh si t en heures ; 1 kWh = 3,6 × 10⁶ J). Effet Joule : dégagement de chaleur Q = R × I² × t. Mesure par compteur électrique SBEE. Sécurité domestique au Bénin : rôle de la prise de terre, disjoncteur différentiel contre les électrocutions, fusibles calibrés en série pour couper les surintensités et courts-circuits." },
        { title: "Propagation rectiligne de la lumière et réflexion", sa: "SA 2",
          cours: "Principe de propagation rectiligne de la lumière dans un milieu homogène et transparent. Notion de rayon lumineux et faisceau lumineux (parallèle, convergent, divergent). Phénomène de réflexion sur miroir plan : rayon incident, point d'incidence, normale au miroir, rayon réfléchi. Première loi de Snell-Descartes pour la réflexion : le rayon incident, la normale et le rayon réfléchi sont dans le même plan. Deuxième loi : angle d'incidence i égale angle de réflexion r (i = r). Formation d'images virtuelles symétriques." },
        { title: "Réfraction de la lumière et lentilles minces", sa: "SA 2",
          cours: "Réfraction : changement brusque de direction de la lumière à la traversée d'un dioptre séparant deux milieux transparents d'indices n₁ et n₂. Loi de Snell-Descartes : n₁ sin(i₁) = n₂ sin(i₂). Lentilles minces : à bords minces (convergentes), à bords épais (divergentes). Éléments d'une lentille convergente : centre optique O, axe optique principal, foyer objet F, foyer image F', distance focale f' = OF' en mètres. Vergence C = 1/f' exprimée en dioptries (δ). Construction géométrique de l'image A'B' d'un objet AB : rayon passant par O non dévié, rayon parallèle à l'axe émergeant par F', rayon passant par F émergeant parallèle à l'axe. Formule de conjugaison 1/OA' - 1/OA = 1/OF'." },
        { title: "Poids, masse et équilibre d'un solide", sa: "SA 2",
          cours: "Distinction fondamentale entre masse m (quantité de matière invariable, mesurée avec une balance en kg) et poids P (force d'attraction gravitationnelle exercée par la Terre, mesurée avec un dynamomètre en Newtons N). Relation vectorielle P = m × g où g est l'intensité de la pesanteur (au Bénin g ≈ 9,8 N/kg ou 10 N/kg). Caractéristiques du poids : point d'application (centre de gravité G), direction (verticale du lieu), sens (vers le bas, centre de la Terre), intensité P en N. Conditions d'équilibre d'un solide soumis à deux forces F₁ et F₂ : même droite d'action, sens opposés, intensités égales (F₁ + F₂ = 0). Solide soumis à trois forces concourantes et coplanaires." },
        { title: "Structure de l'atome, formation des ions et solutions aqueuses", sa: "SA 3",
          cours: "L'atome est électriquement neutre : constitué d'un noyau central dense (protons de charge +e et neutrons sans charge) et d'un nuage d'électrons périphériques (charge -e). Numéro atomique Z = nombre de protons = nombre d'électrons. Ions monoatomiques et polyatomiques : un cation est issu de la perte d'électrons (ex: Na⁺, Cu²⁺, Fe²⁺, Fe³⁺), un anion est issu du gain d'électrons (ex: Cl⁻, SO₄²⁻, OH⁻). Conduction électrique : dans les métaux par déplacement des électrons libres ; dans les solutions aqueuses (électrolytes) par déplacement simultané des ions (cations vers la cathode -, anions vers l'anode +)." },
        { title: "Électrolyse de l'eau et des solutions salines", sa: "SA 3",
          cours: "Définition de l'électrolyse : réaction chimique forcée provoquée par le passage d'un courant électrique continu dans une solution ionique. Électrolyseur à électrodes inattaquables (platine ou graphite). Électrolyse de l'eau acidifiée : à la cathode (borne négative), dégagement de gaz dihydrogène H₂ (qui détonne à la flamme) ; à l'anode (borne positive), dégagement de gaz dioxygène O₂ (qui rallume une bûchette incandescente). Bilan volumique : Volume H₂ = 2 × Volume O₂. Équation-bilan : 2 H₂O → 2 H₂ + O₂. Électrolyse du chlorure de sodium (NaCl) : dégagement de dichlore Cl₂ à l'anode et soude + H₂ à la cathode." },
        { title: "Solutions acides, basiques et réactions chimiques", sa: "SA 3",
          cours: "Notion de pH (potentiel hydrogène) à 25°C : échelle de 0 à 14. Solution acide : pH < 7 (prépondérance des ions H⁺/H₃O⁺). Solution neutre : pH = 7 (ex: eau pure). Solution basique : pH > 7 (prépondérance des ions hydroxyde OH⁻). Mesure du pH par papier pH ou pH-mètre. Réaction entre acide chlorhydrique (H⁺ + Cl⁻) et fer métal (Fe) : attaque effervescente, dégagement de dihydrogène H₂ et formation d'ions fer II Fe²⁺ (testés par précipité vert avec NaOH). Équation : Fe + 2 H⁺ → Fe²⁺ + H₂. Neutralisation acido-basique : H⁺ + OH⁻ → H₂O (réaction exothermique)." },
        { title: "Pression des fluides et mécanique des fluides", sa: "SA 4",
          cours: "Définition d'un fluide : corps qui prend la forme de son contenant (liquide ou gaz). Pression dans un fluide : force exercée perpendiculairement par unité de surface, unité le Pascal (Pa = N/m²). Pression atmosphérique au niveau de la mer P₀ = 101 325 Pa ≈ 1 013 hPa (mesurée par le baromètre à mercure, hauteur de mercure h = 76 cm). Loi fondamentale de l'hydrostatique (pression dans un liquide au repos) : P = P_surface + ρ × g × h (avec ρ la masse volumique du liquide en kg/m³, g ≈ 10 N/kg, h la profondeur en m). Conséquences : les surfaces libres des liquides dans des vases communicants sont à la même hauteur si les liquides sont identiques. Poussée d'Archimède : tout corps immergé dans un fluide reçoit de la part de ce fluide une force verticale vers le haut F_A = ρ_fluide × g × V_immergé (V_immergé en m³). Applications : flottaison (corps flotte si ρ_corps < ρ_fluide), sous-marins, densimètre. Pression sanguine (systolique et diastolique) mesurée par tensiomètre au Bénin." },
        { title: "Énergie mécanique, chaleur et thermodynamique élémentaire", sa: "SA 4",
          cours: "Les formes d'énergie mécaniques : énergie cinétique E_c = ½mv² (associée au mouvement, dépend de la masse m et du carré de la vitesse v) et énergie potentielle de pesanteur E_pp = m × g × h (associée à la hauteur h au-dessus d'un niveau de référence). Énergie mécanique totale E_mec = E_c + E_pp. Principe de conservation de l'énergie mécanique en l'absence de frottements : E_mec = constante. Travail d'une force : W = F × d × cos α (en Joules J). Puissance mécanique : P = W / t (en Watts W). Énergie thermique (chaleur) : agitation désordonnée des molécules. Unité : Joule (J) ou calorie (1 cal = 4,18 J). Capacité thermique massique c : quantité de chaleur Q = m × c × ΔT nécessaire pour élever d'une unité la température de 1 kg de substance. Transferts thermiques : conduction (solides), convection (fluides) et rayonnement. Applications à la cuisine traditionnelle béninoise, au stockage solaire thermique et à la construction écologique." },
        { title: "Chimie organique de base et matériaux du quotidien", sa: "SA 5",
          cours: "La chimie organique : branche de la chimie étudiant les composés du carbone (C), atome tétravalent capable de former 4 liaisons covalentes avec H, O, N, S, halogènes. Hydrocarbures aliphatiques saturés (alcanes, formule C_nH_{2n+2} : méthane CH₄, éthane C₂H₆, propane C₃H₈, butane C₄H₁₀) et insaturés (alcènes avec double liaison C=C : éthylène C₂H₄). Groupes fonctionnels courants : fonction alcool (–OH, ex: éthanol C₂H₅OH, alcool de désinfection). Corps gras et savons : les huiles végétales (huile de palme, de coco, d'arachide) et les graisses animales sont des esters d'acides gras et de glycérol (triglycérides). Saponification : action d'une solution de soude NaOH sur un corps gras → savon (sel d'acide gras) + glycérol. Fabrication artisanale du savon au Bénin. Plastiques et polymères synthétiques : polyéthylène, polypropylène, PVC. Pollution par les sachets plastiques et alternatives biodégradables. Matériaux de construction traditionnels béninois : argile cuite (briques), banco (terre crue stabilisée), ciment Portland, béton armé." },
        { title: "Les ressources énergétiques et les matériaux de technologie", sa: "SA 5",
          cours: "Classification des sources d'énergie : énergies non renouvelables fossiles (pétrole, gaz naturel, charbon) issues de la décomposition anaérobie de matière organique sur des millions d'années ; énergie nucléaire (fission de l'uranium 235). Énergies renouvelables : énergie solaire photovoltaïque (panneaux solaires transformant le rayonnement solaire en électricité par effet photoélectrique, très développée au Bénin en zones rurales), énergie éolienne (turbines actionnées par le vent), énergie hydraulique (barrages fluviaux et microcentrales comme Nangbéto sur le Mono), biomasse (bois-énergie, biogaz issu de la fermentation des déchets organiques). Contexte béninois : mix énergétique fortement dépendant des importations de la CEB (Communauté Électrique du Bénin) depuis le Ghana et le Nigeria, délestages fréquents, politique nationale de développement des énergies renouvelables. Conducteurs et isolants électriques et thermiques : applications dans les circuits, câbles, isolation thermique des bâtiments. Matériaux magnétiques : aimants permanents, électroaimants et applications (moteurs, haut-parleurs, disques durs)." },
        { title: "Technologie, machines et développement durable au Bénin", sa: "SA 6",
          cours: "La technologie comme application des connaissances scientifiques pour concevoir des objets et systèmes techniques utiles à la société. Les machines simples et leurs avantages mécaniques : levier (bras de levier, conditions d'équilibre), poulie fixe et poulie mobile (réduction de l'effort par rapport à la charge), plan incliné, vis-écrou. La machine thermique à vapeur et les moteurs à combustion interne (moteur à 4 temps : admission, compression, explosion-détente, échappement) qui équipent les véhicules et groupes électrogènes très présents au Bénin. Les télécommunications modernes : téléphonie mobile (réseau GSM/4G/5G), fibre optique, satellite et accès à Internet. Impact socioéconomique du numérique au Bénin : Mobile Money, e-gouvernement, télémédecine rurale. Développement durable : satisfaction des besoins du présent sans compromettre la capacité des générations futures à satisfaire les leurs (définition de Brundtland). Les 3 piliers : économique (croissance et emploi), social (équité et inclusion) et environnemental (préservation de l'écosystème). Défis béninois : érosion côtière de Cotonou à Grand-Popo, gestion des déchets électroniques et plastiques, accès à l'eau potable dans les zones rurales, protection de la biodiversité dans le parc national de la Pendjari."
        }
      ]
    },
    "SVT": {
      chapters: [
        { title: "Nutrition et digestion des aliments chez l'Homme", sa: "SA 1",
          cours: "Groupes d'aliments : glucides énergétiques (amidon, saccharose, glucose), protides bâtisseurs (viandes, poissons, légumineuses), lipides de réserve, eau, sels minéraux (calcium, fer) et vitamines. Phénomènes mécaniques (mastication buccale, brassage gastrique, péristaltisme intestinal) et chimiques de la digestion. Rôle des enzymes digestives spécifiques (amylase salivaire, pepsine gastrique, protéases, lipases et maltases pancréatiques/intestinales) qui hydrolysent les macromolécules insolubles en nutriments simples solubles. L'absorption intestinale au niveau des villosités de l'intestin grêle : passage dans le sang (glucose, acides aminés, eau, sels) et dans la lymphe (acides gras et glycérol)." },
        { title: "Respiration et circulation sanguine", sa: "SA 1",
          cours: "Ventilation pulmonaire : inspiration active (contraction du diaphragme et muscles intercostaux) et expiration passive. Échanges gazeux alvéolaires : diffusion de l'O₂ des alvéoles vers le sang et du CO₂ du sang vers les alvéoles selon les gradients de pression partielle. Hématose : transformation du sang veineux sombre en sang artériel rouge vif. Rôle de l'hémoglobine des hématies : Hb + 4 O₂ ⇄ Hb(O₂)₄ (oxyhémoglobine). Le cœur : muscle creux (myocarde) à 4 cavités (2 oreillettes, 2 ventricules), cloison étanche évitant le mélange des sangs. Double circulation : petite circulation pulmonaire (cœur droit vers poumons vers cœur gauche) et grande circulation générale systémique (cœur gauche vers tous les organes vers cœur droit)." },
        { title: "Reproduction humaine et fécondation", sa: "SA 2",
          cours: "Puberté et caractères sexuels secondaires. Appareil reproducteur masculin : testicules (production continue de spermatozoïdes par spermatogenèse et sécrétion de testostérone), épididyme, canaux déférents, prostate, vésicules séminales, urètre et pénis. Appareil féminin : ovaires (ovogenèse cyclique, sécrétion d'œstrogènes et progestérone), trompes de Fallope, utérus (myomètre et endomètre), vagin et vulve. Le cycle menstruel féminin (durée moyenne 28 jours) : phase folliculaire (J1 à J13), ovulation (J14), phase lutéinique (J15 à J28) et règles en l'absence de fécondation. La fécondation : fusion du spermatozoïde et de l'ovocyte II dans le tiers supérieur de la trompe, formation de la cellule-œuf (zygote), migration et nidation dans l'endomètre utérin (grossesse de 9 mois)." },
        { title: "Hérédité, chromosomes et transmission des gènes", sa: "SA 2",
          cours: "Support de l'information génétique : le noyau cellulaire contenant les chromosomes constitués d'ADN (acide désoxyribonucléique). Caryotype de l'espèce humaine : 46 chromosomes répartis en 23 paires, dont 22 paires d'autosomes et 1 paire d'hétérochromosomes sexuels (XX chez la femme, XY chez l'homme). Gène : fragment d'ADN codant pour un caractère héréditaire. Allèles : versions différentes d'un même gène. Notions d'allèle dominant, récessif ou codominant. Génotype (constitution allélique, homozygote ou hétérozygote) et phénotype (manifestation observable). Transmission héréditaire : ségrégation des allèles lors de la formation des gamètes haploïdes (23 chromosomes), fécondation rétablissant la diploïdie (46 chromosomes). Échiquier de croisement et étude d'arbres généalogiques." },
        { title: "Système nerveux et comportement réflexe", sa: "SA 3",
          cours: "Organisation générale : système nerveux central (encéphale et moelle épinière) et système nerveux périphérique (nerfs sensitifs et moteurs). Le neurone : unité fonctionnelle excitable, comprenant corps cellulaire avec noyau, dendrites réceptrices et axone conducteur protégé par la gaine de myéline. L'arc réflexe médullaire inné (ex: réflexe rotulien, réflexe de retrait face à une brûlure) : récepteur sensoriel → nerf sensitif afférent (racine postérieure) → centre nerveux médullaire (moelle épinière) → nerf moteur efférent (racine antérieure) → organe effecteur (muscle). Notion de synapse : zone de jonction et transmission chimique par neurotransmetteurs. Effets des drogues, alcool et fatigue sur la vigilance et les réflexes." },
        { title: "Immunité de l'organisme et défenses contre les microbes", sa: "SA 3",
          cours: "Le monde microbien : bactéries, virus, champignons microscopiques et protozoaires. Microbes pathogènes et flore commensale. Barrières naturelles : mécaniques (peau, muqueuses, cils) et chimiques (sueur, larmes, sucs gastriques). Réaction inflammatoire locale non spécifique (chaleur, rougeur, douleur, œdème) et phagocytose par les polynucléaires et macrophages. Immunité acquise spécifique : immunité humorale par lymphocytes B produisant des anticorps spécifiques neutralisant les antigènes ; immunité cellulaire par lymphocytes T cytotoxiques détruisant les cellules infectées. Mémoire immunologique : principe de la vaccination (prévention active durable) vs sérothérapie (curative passive immédiate). Cas du VIH/SIDA détruisant les lymphocytes T4." },
        { title: "Écologie, écosystèmes et chaînes trophiques", sa: "SA 4",
          cours: "Définition d'un écosystème : interaction dynamique entre un biotope (milieu physico-chimique : sol, eau, température, lumière) et une biocénose (ensemble des êtres vivants animaux, végétaux et microbiens). Chaînes trophiques et réseaux alimentaires : producteurs primaires autotrophes photosynthétiques (végétaux verts), consommateurs primaires herbivores (phytophages), consommateurs secondaires et tertiaires carnivores (zoophages), et décomposeurs du sol (bactéries, champignons, vers recyclant la matière organique en sels minéraux). Flux unidirectionnel d'énergie et cycle biogéochimique de la matière. Équilibres écologiques, impact des feux de brousse, déforestation et pollution au Bénin." },
        { title: "Géologie, formation des sols et ressources minières au Bénin", sa: "SA 4",
          cours: "Les couches géologiques et l'altération des roches mères : altération physique (thermoclastie, action de l'eau) et altération chimique (hydrolyse, dissolution). Profil pédologique d'un sol : horizon superficiel O/A riche en litière et humus fertile, horizon B d'accumulation de minéraux et argiles, horizon C de roche mère altérée. Types de sols au Bénin : sols ferrallitiques rouges sur plateaux du Sud, sols ferrugineux tropicaux sur socle cristallin au Centre et Nord, sols hydromorphes des bas-fonds et vallées alluviales. Ressources géologiques béninoises : gisements de calcaire d'Onigbolo pour la cimenterie, argiles pour la briqueterie, marbre d'Idadjo, sables siliceux côtiers, or alluvionnaire de Perma dans l'Atacora. Préservation des sols contre l'érosion pluviale et éolienne." }
      ]
    },
    "Histoire-Géographie": {
      chapters: [
        { title: "L'impérialisme européen et le partage de l'Afrique au XIXe siècle", sa: "SA 1",
          cours: "Origines et causes de l'impérialisme : économiques (recherche de matières premières agricoles et minières suite aux révolutions industrielles, débouchés pour les produits manufacturés), démographiques (surpeuplement de l'Europe), politiques et stratégiques (rivalités entre grandes puissances France, Royaume-Uni, Allemagne, Belgique), idéologiques et religieuses (mission civilisatrice autoproclamée, évangélisation par les missionnaires catholiques et protestants). Les explorations géographiques (Barth, Livingstone, Stanley). La Conférence de Berlin (15 novembre 1884 - 26 février 1885) convoquée par le chancelier Otto von Bismarck : fixation des règles du partage colonial sans aucune représentation africaine (principe de l'occupation effective de l'arrière-pays à partir de la côte, liberté de navigation sur les fleuves Congo et Niger)." },
        { title: "Les résistances africaines et dahoméennes à la conquête coloniale", sa: "SA 1",
          cours: "Les formes de pénétration coloniale : traités de protectorat trompeurs suivis d'expéditions militaires brutales. Les grandes figures de résistance en Afrique : Samory Touré dans l'empire Wassoulou, El Hadj Omar Tall, Rabah au Tchad. Au Dahomey (actuel Bénin) : le règne héroïque du roi Dada Gbêhanzin (1889-1894). Causes du conflit : protectorat français imposé sur Porto-Novo par le gouverneur Victor Ballot et revendication de la souveraineté de Cotonou par le Danxomè. Première guerre franco-dahoméenne (1890) et seconde guerre (1892-1894) menée par le colonel Alfred Dodds. Rôle des guerrières Agoodjié (Amazones du Dahomey), batailles acharnées de Dogba, Pogué et Cana. Reddition patriotique de Gbêhanzin en janvier 1894 pour épargner son peuple du massacre, déportation en Martinique puis en Algérie (Blida). Autres héros nationaux : résistance armée de Bio Guéra dans le Borgou (1916) et de Kaba dans l'Atacora (1916-1917) contre le recrutement forcé." },
        { title: "Le système colonial en Afrique Occidentale Française (AOF)", sa: "SA 1",
          cours: "Création de la fédération de l'Afrique Occidentale Française en 1895 avec pour capitale Dakar. Statut du Dahomey : colonie de l'AOF administrée par un gouverneur subordonné au Gouverneur général. L'administration directe française : division du territoire en cercles administrés par des commandants de cercle européens, cantons et villages confiés à des chefs traditionnels subordonnés. Le Code de l'indigénat (1887) privant les sujets coloniaux de libertés fondamentales. L'exploitation économique coloniale : économie de traite basée sur la monoculture d'exportation (huile de palme et palmiste au Dahomey), travail forcé pour la construction d'infrastructures (chemin de fer Cotonou-Parakou, wharfs), corvées et imposition par capitation. Conséquences socioculturelles : scolarisation sélective pour former des commis indigènes, acculturation et bouleversement des structures sociales traditionnelles." },
        { title: "Les guerres mondiales, l'émancipation et l'accession du Dahomey à l'indépendance", sa: "SA 2",
          cours: "Participation décisive des soldats africains (Tirailleurs sénégalais et dahoméens) à la Première (1914-1918) et Seconde Guerre mondiale (1939-1945). Impact de la Conférence de Brazzaville (1944) et de la Charte de l'ONU proclamant le droit des peuples à disposer d'eux-mêmes. Éveil du nationalisme dahoméen : syndicats, presse locale, mouvements d'étudiants (FEANF). Vie politique dahoméenne après 1946 (Union française) dominée par le triumvirat : Sourou Migan Apithy (Sud-Est), Justin Tometin Ahomadégbé (Sud-Ouest) et Hubert Coutoucou Maga (Nord). La Loi-Cadre Defferre de 1956 et le référendum constitutionnel gaulliste du 28 septembre 1958 instaurant la République du Dahomey au sein de la Communauté française. Proclamation solennelle de l'Indépendance nationale le 1er août 1960 avec Hubert Maga comme premier Président de la République. Défis initiaux : construction de l'unité nationale, rivalités régionalistes et instabilité politique des années 1960." },
        { title: "Géographie physique du Bénin : Relief, climats, hydrographie et végétation", sa: "SA 2",
          cours: "Localisation géographique : Afrique de l'Ouest dans la zone intertropicale, s'étendant du Golfe de Guinée au fleuve Niger entre les méridiens 1° et 3°40' Est et les parallèles 6°30' et 12°30' Nord. Superficie : 114 763 km². Le relief béninois : ensemble tabulaire peu accidenté comprenant le cordon littoral sablonneux et lagunes au Sud, les plateaux de terre de barre et plateaux gréseux du Centre, la pénéplaine cristalline du Nord et la chaîne de l'Atacora (point culminant : Mont Sokbaro, 658 m). Le réseau hydrographique : bassin côtier du Sud (fleuve Ouémé long de 510 km, fleuve Mono frontière avec le Togo, fleuve Couffo) et bassins du Nord (fleuve Niger et ses affluents Alibori, Sota, Mékrou, et la Pendjari). Deux grands domaines climatiques : climat subéquatorial béninien au Sud (bimodal avec deux saisons des pluies et deux saisons sèches, 1200 mm/an) et climat soudanien au Nord (unimodal avec une seule saison pluvieuse de mai à octobre et une longue saison sèche marquée par l'harmattan). Végétations : mangrove côtière, savanes boisées et arbustives, forêts claires." },
        { title: "La population béninoise : Dynamique, structures et mouvements", sa: "SA 3",
          cours: "Évolution démographique : population estimée à plus de 13 millions d'habitants avec un taux de croissance naturel élevé (environ 2,8% par an). Structures par âge et par sexe : extrême jeunesse de la population (plus de 45% ont moins de 15 ans et 65% moins de 25 ans), légère supériorité numérique des femmes. Diversité socioculturelle et ethnique : Fon et apparentés au Sud et Centre, Yoruba et Nago à l'Est, Adja à l'Ouest, Bariba et Dendi au Nord, Peuls éleveurs, Batammariba et Otammari dans l'Atacora. Répartition spatiale très contrastée : fortes densités au Sud littoral (> 300 hab/km² dans l'Ouémé, Atlantique, Littoral) et faibles densités dans le Nord et Centre (< 40 hab/km² dans l'Alibori). Phénomènes migratoires : exode rural massif vers les pôles urbains (Cotonou, Abomey-Calavi, Porto-Novo, Parakou), migrations saisonnières de main-d'œuvre vers le Nigeria et les plantations de Côte d'Ivoire. Problèmes liés à la poussée urbaine : prolifération des quartiers précaires, gestion des déchets solides et liquides, chômage des jeunes et pression sur les infrastructures scolaires et sanitaires." },
        { title: "Les activités économiques du Bénin : Agriculture, industrie et commerce", sa: "SA 3",
          cours: "Le secteur primaire : moteur de l'économie béninoise employant plus de 60% de la population active. Cultures vivrières : maïs, manioc, igname, niébé, riz, sorgho. Cultures industrielles d'exportation : le coton (appelé l'or blanc, 1ère source de devises du pays plaçant le Bénin parmi les premiers producteurs africains), anacarde (noix de cajou), palmier à huile, ananas. Élevage bovin, ovin et caprin au Nord. Pêche maritime artisanale et continentale dans les lagunes (système traditionnel des acadjas sur le lac Nokoué). Le secteur secondaire : industrie embryonnaire dominée par l'agroalimentaire (huileries, égrainage du coton), la cimenterie (Onigbolo, CIMBENIN) et le textile (développement de la zone industrielle de Glo-Djigbé - GDIZ pour la transformation locale). Le secteur tertiaire : prépondérant grâce au Port Autonome de Cotonou (PAC), porte d'entrée maritime stratégique pour les pays de l'hinterland (Niger, Mali, Burkina Faso) et commerce de réexportation vers le géant voisin Nigeria. Poids considérable du secteur informel." },
        { title: "Les défis de développement du Bénin et l'intégration sous-régionale", sa: "SA 4",
          cours: "Les contraintes majeures au développement durable : vulnérabilité aux chocs climatiques (inondations répétées, sécheresses), forte dépendance économique vis-à-vis du Nigeria (fluctuations de la monnaie Naira et fermeture périodique des frontières), déficit énergétique en voie de résorption, sous-emploi des diplômés et accès limité aux soins de santé de qualité. Stratégies et programmes de développement : investissements massifs dans les infrastructures routières, portuaires et énergétiques, modernisation de l'agriculture et promotion du tourisme patrimonial (musées d'Abomey et de Ouidah, parcs nationaux de la Pendjari et du W). L'intégration économique et diplomatique : appartenance active à l'Union Économique et Monétaire Ouest-Africaine (UEMOA) avec la monnaie commune Franc CFA, à la Communauté Économique des États de l'Afrique de l'Ouest (CEDEAO) favorisant la libre circulation des personnes et des biens, et à l'Union Africaine (UA). Rôle de la Zone de Libre-Échange Continentale Africaine (ZLECAf) pour dynamiser le commerce intra-africain." }
      ]
    },
    "Français": {
      chapters: [
        { title: "Grammaire : Classes et fonctions grammaticales", sa: "SA 1",
          cours: "Les classes grammaticales : mots variables (noms communs/propres, déterminants articles, possessifs, démonstratifs, indéfinis ; adjectifs qualificatifs ; pronoms personnels, relatifs, démonstratifs ; verbes) et mots invariables (adverbes, prépositions, conjonctions de coordination et de subordination, interjections). Les fonctions par rapport au verbe : sujet, complément d'objet direct (COD), complément d'objet indirect (COI), complément d'objet second (COS), compléments circonstanciels de temps, lieu, manière, cause, but, moyen. Fonctions par rapport au nom : épithète liée ou détachée (apposition), complément du nom. Attribut du sujet et attribut du COD." },
        { title: "La phrase complexe : Coordination, juxtaposition et subordination", sa: "SA 1",
          cours: "Définition de la proposition : noyau verbal conjugué. Juxtaposition par signe de ponctuation faible (virgule, point-virgule, deux-points). Coordination par conjonction de coordination (mais, ou, et, donc, or, ni, car) ou adverbe de liaison. La subordination : proposition principale et proposition subordonnée. Les subordonnées relatives introduites par pronom relatif (qui, que, quoi, dont, où, lequel), ayant une fonction d'épithète de l'antécédent. Les subordonnées complétives (conjonctives pures en que, interrogatives indirectes, infinitives) compléments d'objet. Les subordonnées circonstancielles : de temps (quand, lorsque), de cause (parce que, puisque), de but (pour que, afin que + subjonctif), de conséquence (si bien que), de concession ou d'opposition (bien que, quoique + subjonctif)." },
        { title: "Conjugaison : Modes et valeurs des temps", sa: "SA 2",
          cours: "Les modes personnels : indicatif (mode du réel et de la certitude), subjonctif (mode de l'incertitude, du souhait, du doute, de la nécessité), conditionnel (mode de l'hypothèse, de l'imaginaire ou de l'atténuation de politesse), impératif (mode de l'ordre, de la prière ou du conseil). Les temps de l'indicatif dans le récit : alternance imparfait (actions d'arrière-plan, descriptions, habitudes, actions non délimitées) et passé simple (actions de premier plan, ponctuelles, successives). Les temps composés et l'expression de l'antériorité. Règles d'accord du participe passé : employé sans auxiliaire (s'accorde comme un adjectif), employé avec l'auxiliaire être (s'accorde avec le sujet), employé avec l'auxiliaire avoir (s'accorde avec le COD seulement si celui-ci est placé avant le verbe). Verbes pronominaux." },
        { title: "Vocabulaire, formation des mots et figures de style", sa: "SA 2",
          cours: "Morphologie lexicale : radical, préfixation (modifie le sens : re-, dé-, in-, pré-), suffixation (modifie la classe grammaticale : -able, -ment, -tion). Familles de mots. Relations de sens : synonymie, antonymie, homonymie (homophones et homographes), paronymie. Champ lexical (mots liés à un même thème) vs champ sémantique (multiplicité de sens d'un même mot selon le contexte). Les figures de style au collège : comparaison (avec outil comparatif : comme, tel que, pareil à), métaphore (analogie directe sans outil de comparaison), personnification (attribuer un comportement humain à un objet ou animal), anaphore (répétition en début de phrase ou vers), hyperbole (exagération expressive), énumération et gradation." },
        { title: "Typologie textuelle : Récit, description et dialogue", sa: "SA 3",
          cours: "Le texte narratif : schéma narratif quinaire (situation initiale stable, élément modificateur ou déclencheur, péripéties et rebondissements, dénouement ou élément d'équilibre, situation finale). Le schéma actantiel : sujet, quête, objet, destinateur, destinataire, adjuvants et opposants. Statut du narrateur : narrateur intérieur ou participant (je) vs narrateur extérieur (il/elle). Le texte descriptif : fonction documentaire, réaliste ou symbolique ; progression spatiale ; richesse des adjectifs qualificatifs et verbes de perception sensorielle. Le dialogue inséré dans le récit : disposition typographique (guillemets, tirets de réplique), verbes de parole (incises) et ponctuation expressive." },
        { title: "L'argumentation : Convaincre, persuader et débattre", sa: "SA 3",
          cours: "Structure d'un texte argumentatif : le thème abordé, la thèse défendue ou réfutée, la problématique. Les arguments : preuves logiques, morales, d'autorité ou d'expérience appuyant la thèse. Les exemples illustratifs : faits précis, données chiffrées, citations littéraires concrets qui donnent du poids aux arguments. Les connecteurs logiques d'organisation : d'abord, ensuite, de plus, en outre (addition) ; mais, cependant, néanmoins, en revanche (opposition) ; parce que, car, en effet (cause) ; donc, par conséquent, ainsi (conséquence) ; pour conclure, enfin. Stratégies de discours : convaincre par la raison et la logique rigoureuse ; persuader en touchant la sensibilité, l'émotion ou l'indignation du lecteur." },
        { title: "Littérature béninoise et africaine francophone", sa: "SA 4",
          cours: "Richesse de la littérature orale africaine : contes initiatiques, légendes, mythes d'origine, proverbes et panégyriques claniques (Oriki au pays yoruba / nago). Les grands pionniers de la littérature béninoise : Paulin Joachim (poète engagé et journaliste), Jean Pliya (dramaturge et conteur, auteur de Kondo le Requin retraçant la résistance de Béhanzin, et La Secrétaire particulière dénonçant la corruption administrative), Olympe Bhêly-Quenum (Un piège sans fin, Le chant du lac explorant croyances et modernité), Félix Couchoro, Florent Couao-Zotti. Thématiques majeures : affirmation de l'identité culturelle noire, choc des cultures entre tradition et modernisme occidental, critique des abus de pouvoir et plaidoyer pour l'éducation et la solidarité." },
        { title: "Expression écrite et communication orale", sa: "SA 4",
          cours: "Méthodologie de la rédaction et de la composition française au BEPC : lecture analytique du sujet, repérage des mots de consigne, recherche des idées au brouillon, élaboration d'un plan détaillé et rédaction soignée. Structure canonique : introduction (mise en contexte, énonciation du sujet, annonce du plan), développement en paragraphes distincts reliés par des transitions logiques, conclusion (bilan des idées et ouverture finale). Maîtrise des registres de langue : familier, courant, soutenu. Communication orale : posture physique, regard, articulation, modulation vocale, écoute active et respect du temps de parole dans un débat contradictoire." }
      ]
    },
    "Anglais": {
      chapters: [
        { title: "Grammar Basics: Present and Past Tenses", sa: "SA 1",
          cours: "Simple Present: habit, general truth, routine (third person singular takes -s or -es). Present Continuous (am/is/are + verb-ing): ongoing actions at the moment of speaking or planned future events. Stative verbs that do not take continuous forms (know, understand, like, believe). Simple Past: regular verbs ending in -ed, common irregular verbs (go/went, see/saw, buy/bought). Past Continuous (was/were + verb-ing): past action in progress interrupted by a sudden simple past event with 'when' or simultaneous past actions with 'while'." },
        { title: "Perfect Tenses and Expressing the Future", sa: "SA 1",
          cours: "Present Perfect (have/has + past participle): past actions with clear results or relevance in the present, unfinished time periods, or life experiences. Use of time markers: already, just, yet, ever, never, since (starting point), for (duration). Future forms: will + bare infinitive (spontaneous decisions, predictions), be going to + infinitive (prior intentions, plans, evident facts based on current signs), Present Continuous for confirmed arrangements." },
        { title: "Modal Auxiliaries and Conditionals", sa: "SA 2",
          cours: "Modal verbs (must, can, could, may, might, should, ought to, have to): obligation, physical or mental ability, polite requests, permission, probability and advice. Negative forms and nuances (mustn't for strict prohibition vs don't have to for absence of obligation). Conditionals: Zero Conditional (If + present, present) for scientific facts; First Conditional (If + present, will + verb) for likely future conditions and outcomes; Second Conditional (If + past simple, would + verb) for imaginary, hypothetical or advice situations ('If I were you, I would study harder')." },
        { title: "Passive Voice and Reported Speech", sa: "SA 2",
          cours: "Passive Voice formation: subject + appropriate tense of auxiliary 'be' + past participle of the main verb (+ by + agent). Uses: when the action or the receiver of the action is more significant than the doer, or when the agent is unknown. Reported Speech (Indirect Speech): changes in verb tenses (present simple becomes past simple, present continuous becomes past continuous, will becomes would), changes in pronouns, possessive adjectives and time/place adverbs (today -> that day, tomorrow -> the next day, yesterday -> the day before, here -> there)." },
        { title: "Reading Comprehension and Text Analysis", sa: "SA 3",
          cours: "Techniques for reading tests in the BEPC exam: skimming (rapid reading to grasp the general gist, main idea and topic) and scanning (searching rapidly for specific details, figures, names or keywords). Identifying paragraph topic sentences. Using context clues and roots/prefixes to deduce the meaning of unfamiliar words without a dictionary. Formulating clear, grammatically accurate answers using full English sentences." },
        { title: "Vocabulary: Health, Environment, Education and Technology", sa: "SA 3",
          cours: "Lexical fields related to everyday and social life in Benin: health and diseases (malaria prevention, hygiene, nutrition, clean water), environmental protection (deforestation, plastic pollution, bush fires, climate change, recycling), education and youth (school facilities, examinations, hard work, success, gender equality), technology and modern communication (smartphones, computers, internet, social media benefits and dangers)." },
        { title: "Writing Skills: Guided Essays, Paragraphs and Formal Letters", sa: "SA 4",
          cours: "Paragraph organization: clear topic sentence stating the focal point, supporting sentences providing explanations, evidence and illustrations, concluding sentence. Linking words: addition (and, moreover, furthermore), contrast (but, however, although, on the one hand... on the other hand), cause and effect (because, since, therefore, as a result). Format of a formal letter vs an informal friendly letter: addresses, date, salutations, body, and closing formulas." },
        { title: "Communication in English and Culture of English-Speaking Countries", sa: "SA 4",
          cours: "Everyday dialogues and functional English: greetings, introducing oneself and others, asking for and giving directions, expressing opinions, polite agreement and disagreement. English as an international lingua franca and regional integration in West Africa (neighboring Nigeria and Ghana, member states of ECOWAS). Cultural awareness: traditions, flags, holidays and values in the UK, USA and Anglophone Africa." }
      ]
    },
    "Lecture/Dictée": {
      chapters: [
        { title: "Techniques de lecture expressive et compréhension littéraire", sa: "SA 1",
          cours: "Objectifs de la lecture au collège : articulation nette, respect scrupuleux de la ponctuation, débit adapté, intonation expressive traduisant les émotions des personnages. Stratégies de compréhension : identification du thème central, des idées secondaires et de la structure du texte. Reconnaissance des indices textuels : cadre spatio-temporel, intentions de l'auteur, tonalité dominante (tragique, comique, lyrique, polémique)." },
        { title: "Orthographe d'usage, consonnes doubles et accents", sa: "SA 1",
          cours: "Règles d'écriture des consonnes doubles : mots commençant par ap-, ac-, af-, ef-, of-, op- (exceptions : apercevoir, apaiser, aplanir). Les accents sur la lettre e : accent aigu (é) en syllabe ouverte, accent grave (è) ou circonflexe (ê) en syllabe fermée ou devant consonne muette. Emploi du tréma (ë, ï) pour marquer la prononciation séparée de deux voyelles adjacentes (ex: maïs, coïncidence). La cédille sous la lettre c devant a, o, u pour conserver le son [s] (ex: leçon, aperçu)." },
        { title: "Accords grammaticaux : Sujet, verbe et groupe nominal", sa: "SA 2",
          cours: "Accord en nombre et en personne du verbe avec son sujet : sujet inversé, sujets multiples coordonnés, sujet collectif (une foule de gens, la majorité). Accord des adjectifs qualificatifs : règles générales de féminin et de pluriel, adjectifs de couleur simples (s'accordent : des robes bleues) vs adjectifs de couleur composés ou dérivés de noms de fruits/fleurs (invariables : des chemises bleu marine, des rubans marron). Accord du participe passé avec être, avoir et verbes pronominaux." },
        { title: "Les homophones grammaticaux pièges", sa: "SA 2",
          cours: "Méthode de substitution pour ne plus commettre de fautes : a (verbe avoir, remplacer par avait) vs à (préposition invariable) ; et (conjonction d'addition, remplacer par et puis) vs est (verbe être, remplacer par était) ; son (adjectif possessif, remplacer par mon) vs sont (verbe être, remplacer par étaient) ; on (pronom personnel sujet, remplacer par il) vs ont (verbe avoir, remplacer par avaient) ; ou (choix, remplacer par ou bien) vs où (lieu ou temps) ; ce/se ; ces/ses/c'est/s'est ; leur (pronom invariable devant un verbe) vs leur/leurs (déterminant s'accordant avec le nom)." },
        { title: "Ponctuation, majuscules et structure textuelle", sa: "SA 3",
          cours: "Rôle de la ponctuation : délimitation des phrases et clarification du sens. La ponctuation de fin de phrase : point, point d'interrogation, point d'exclamation, points de suspension. La ponctuation interne : la virgule (isole les compléments circonstanciels déplacés, les apostrophes et les propositions juxtaposées), le point-virgule (sépare deux propositions liées par le sens), les deux-points (annoncent une énumération, une explication ou un dialogue). Emploi obligatoire des majuscules : premier mot d'une phrase, noms propres, noms de peuples et nationalités utilisés comme substantifs." },
        { title: "Vocabulaire en contexte et questions de compréhension de dictée", sa: "SA 3",
          cours: "Méthode pour répondre aux questions de compréhension associées à la dictée d'examen : explication d'un mot ou d'une expression selon son contexte d'apparition, identification des synonymes et des antonymes, analyse de la valeur d'un temps verbal employé dans le texte, justification d'un accord grammatical complexe. Formulation de réponses complètes et soignées sans rature." },
        { title: "Enrichissement lexical, néologismes et emprunts", sa: "SA 4",
          cours: "Formation des mots savants : racines grecques et latines courantes dans la langue française et scientifique (bio, chrono, gé, hydro, télé, phono, graphie, logie). Mots composés avec ou sans trait d'union. Emprunts linguistiques et termes spécifiques du français d'Afrique et du Bénin acceptés par la francophonie. Polysémie et sens figuré des expressions usuelles." },
        { title: "Entraînement intensif à l'épreuve de dictée du BEPC", sa: "SA 4",
          cours: "Déroulement standard de l'épreuve de dictée : 1ère lecture magistrale par le surveillant pour saisir le sens global du texte ; 2ème étape de dictée phrase par phrase avec annonce de la ponctuation ; 3ème lecture de relecture collective. Méthode d'auto-relecture en 4 balayages systématiques : 1. Balayage des verbes et accords avec les sujets ; 2. Balayage des groupes nominaux (déterminants, noms, adjectifs) ; 3. Vérification des homophones grammaticaux ; 4. Vérification de la ponctuation, accents et majuscules." }
      ]
    }
  },
  bac: {
    "Mathématiques": {
      chapters: [
        { title: "Suites numériques : Limites, récurrence et convergence", sa: "SA 1",
          cours: "Suites arithmétiques et géométriques : rappels des termes généraux, sommes finies et variations. Raisonnement par récurrence : initialisation, hérédité et conclusion. Suites monotones, suites bornées (majorée, minorée). Théorème de convergence monotone : toute suite croissante et majorée (resp. décroissante et minorée) est convergente. Limites de suites, théorèmes d'encadrement (théorème des gendarmes) et théorèmes de comparaison. Suites adjacentes." },
        { title: "Limites, continuité et théorème des valeurs intermédiaires", sa: "SA 1",
          cours: "Limites finies et infinies d'une fonction en un point et en l'infini. Formes indéterminées (0/0, ∞/∞, 0×∞, +∞-∞) et méthodes de levée d'indétermination (factorisation par le terme dominant, quantité conjuguée, taux d'accroissement). Continuité en un point et sur un intervalle. Théorème des Valeurs Intermédiaires (TVI) et son corollaire pour les fonctions strictement monotones (théorème de la bijection) : existence et unicité de solutions à l'équation f(x) = k." },
        { title: "Dérivabilité, étude de fonctions et branches infinies", sa: "SA 2",
          cours: "Nombre dérivé, équation de la tangente y = f'(a)(x-a) + f(a). Règles de dérivation : somme, produit, quotient, composée (g∘f)' = (g'∘f) × f'. Dérivée des fonctions usuelles. Sens de variation et tableau complet. Dérivée seconde, convexité, concavité et points d'inflexion. Branches infinies : asymptotes verticales, horizontales, obliques (y = ax+b si lim [f(x)-(ax+b)] = 0) et branches paraboliques de directions asymptotiques." },
        { title: "Fonction Logarithme népérien et fonction Exponentielle", sa: "SA 2",
          cours: "Fonction ln : unique primitive s'annulant en 1 de la fonction x ↦ 1/x sur ]0, +∞[. Propriétés algébriques : ln(ab) = ln a + ln b, ln(a/b) = ln a - ln b, ln(a^n) = n ln a. Limites remarquables et croissances comparées : lim_{x→0} x ln x = 0, lim_{x→+∞} (ln x)/x = 0. Fonction exponentielle exp(x) = e^x : bijection réciproque de ln. Propriétés : e^{a+b} = e^a × e^b, e^{a-b} = e^a / e^b, (e^a)^b = e^{ab}. Dérivée (e^u)' = u' e^u. Croissances comparées : lim_{x→+∞} e^x / x^n = +∞, lim_{x→-∞} x^n e^x = 0. Fonctions puissances." },
        { title: "Primitives, calcul intégral et équations différentielles", sa: "SA 3",
          cours: "Définition d'une primitive : F'(x) = f(x). Primitives des fonctions usuelles et composées (u' u^n, u'/u, u' e^u). Intégrale d'une fonction continue sur [a, b] : ∫_a^b f(x)dx = [F(x)]_a^b = F(b) - F(a). Propriétés : linéarité, positivité, relation de Chasles. Intégration par parties : ∫ u v' = [uv] - ∫ u' v. Calcul d'aires et de valeurs moyennes. Équations différentielles linéaires du 1er ordre y' = ay + b et du 2nd ordre y'' + ω²y = 0." },
        { title: "Nombres complexes : Algèbre, géométrie et trigonométrie", sa: "SA 3",
          cours: "Ensemble C des nombres complexes : unité imaginaire i telle que i² = -1. Forme algébrique z = a + bi (partie réelle Re(z)=a, partie imaginaire Im(z)=b). Conjugué z̄ = a - bi. Module |z| = √(a² + b²). Forme trigonométrique z = r(cos θ + i sin θ) et forme exponentielle z = r e^{iθ}. Formules d'Euler et de Moivre. Résolution d'équations du second degré à coefficients réels ou complexes. Interprétation géométrique : affixe d'un point et d'un vecteur, distance AB = |z_B - z_A|, angle orienté (AB, CD) = arg((z_D - z_C)/(z_B - z_A)). Transformations du plan : translation, homothétie, rotation et similitudes directes." },
        { title: "Probabilités conditionnelles, variables aléatoires et lois de probabilité", sa: "SA 4",
          cours: "Univers fini, événements, équiprobabilité. Probabilité conditionnelle P_B(A) = P(A ∩ B) / P(B). Formule des probabilités totales. Événements indépendants : P(A ∩ B) = P(A) × P(B). Variable aléatoire discrète X : loi de probabilité, fonction de répartition, espérance mathématique E(X), variance V(X) et écart-type σ(X). Épreuves répétées indépendantes, schéma de Bernoulli et loi binomiale B(n, p) avec P(X = k) = C_n^k p^k (1-p)^{n-k}." },
        { title: "Géométrie dans l'espace et produit scalaire", sa: "SA 4",
          cours: "Repère orthonormé (O, i, j, k) de l'espace. Vecteurs dans l'espace, colinéarité, orthogonalité. Produit scalaire u · v = xx' + yy' + zz'. Norme d'un vecteur. Équations cartésiennes de plans : ax + by + cz + d = 0 où le vecteur n(a, b, c) est normal au plan. Représentations paramétriques de droites dans l'espace. Distance d'un point à un plan. Positions relatives de droites et de plans. Sphères dans l'espace." }
      ]
    },
    "Physique-Chimie": {
      chapters: [
        { title: "Cinématique et dynamique du point matériel — Lois de Newton", sa: "SA 1",
          cours: "Vecteur position OM(t), vecteur vitesse v(t) = dOM/dt, vecteur accélération a(t) = dv/dt dans le repère cartésien et dans la base de Frenet (a = dv/dt t + v²/ρ n). Mouvements rectilignes (uniforme, uniformément varié) et mouvement circulaire uniforme. Les trois lois de Newton : 1ère loi (principe d'inertie), 2ème loi (principe fondamental de la dynamique ∑ F_ext = m a), 3ème loi (action-réaction). Mouvement d'un projectile dans un champ de pesanteur uniforme sans frottement : équations horaires, équation de la trajectoire parabolique, portée et flèche. Travail d'une force constante, théorème de l'énergie cinétique et de l'énergie mécanique." },
        { title: "Mouvements dans les champs E et B uniformes et champ de gravitation", sa: "SA 1",
          cours: "Champ électrique uniforme E entre deux plaques parallèles sous tension U (E = U/d). Force électrostatique F_e = q E. Accélération et déviation électrostatique d'un électron. Champ magnétique uniforme B : force magnétique de Lorentz F_m = q (v ∧ B), règle de la main droite. Mouvement d'une particule chargée injectée orthogonalement à un champ B uniforme : trajectoire circulaire uniforme, rayon de l'orbite R = mv / (|q|B), période cyclotron T = 2πm / (|q|B). Application au spectromètre de masse et cyclotron. Loi de gravitation universelle de Newton F = G·(M·m)/r², champ de gravitation terrestre, mouvement des satellites en orbite circulaire et lois de Kepler." },
        { title: "Cinétique chimique : Vitesse de réaction et facteurs cinétiques", sa: "SA 2",
          cours: "Définition de la vitesse volumique de réaction v = (1/V)(dx/dt). Vitesse volumique de disparition d'un réactif et d'apparition d'un produit. Méthodes de suivi temporel d'une transformation chimique : méthodes physiques (pressiométrie, conductimétrie, spectrophotométrie, pH-métrie) et méthodes chimiques (dosages volumétriques après trempe). Facteurs cinétiques influençant la vitesse : concentration initiale des réactifs, température du milieu réactionnel (loi d'Arrhenius), surface de contact et présence d'un catalyseur. Rôle et types de catalyse : homogène, hétérogène et enzymatique. Temps de demi-réaction t_{1/2} : définition et détermination graphique sur la courbe d'avancement x(t)." },
        { title: "Équilibres acido-basiques, pH-métrie, solutions tampons et dosages", sa: "SA 2",
          cours: "Théorie de Brönsted des acides et des bases (échange de proton H⁺). Autoprotolyse de l'eau : produit ionique Ke = [H₃O⁺][OH⁻] = 10⁻¹⁴ à 25°C. Constante d'acidité Ka = ([Base][H₃O⁺]) / [Acide] et pKa = -log Ka d'un couple acido-basique. Relation fondamentale de Henderson-Hasselbalch : pH = pKa + log([Base]/[Acide]). Diagramme de prédominance des espèces en solution. Solutions tampons : définition, pouvoir tampon optimal (pH ≈ pKa), rôle régulateur dans le sang humain. Courbes de titrage acido-basique pH-métriques et conductimétriques : acide fort/base forte, acide faible/base forte, point d'équivalence (méthode des tangentes parallèles, dérivée dpH/dV), choix de l'indicateur coloré approprié dont la zone de virage englobe le pH à l'équivalence." },
        { title: "Systèmes oscillants mécaniques et phénomène de résonance", sa: "SA 3",
          cours: "Le pendule élastique horizontal ou vertical (ressort à spires non jointives de constante de raideur k et solide de masse m). Force de rappel élastique F = -k x i. Équation différentielle du mouvement sans frottement : x'' + (k/m)x = 0, pulsation propre ω₀ = √(k/m), période propre T₀ = 2π√(m/k). Pendule pesant et pendule simple : approximation des petites oscillations, période T₀ = 2π√(l/g). Énergie mécanique du système : somme de l'énergie cinétique E_c = ½mv² et de l'énergie potentielle élastique E_pe = ½kx² (ou de pesanteur E_pp = mgz). Conservation de l'énergie mécanique. Oscillations amorties par frottements fluides ou solides : régimes pseudo-périodique, apériodique, critique. Oscillations forcées : excitateur, résonateur et phénomène de résonance mécanique d'amplitude." },
        { title: "Circuits RLC et oscillations électriques libres ou forcées", sa: "SA 3",
          cours: "Dipôle RC : charge et décharge d'un condensateur sous tension continue, constante de temps τ = RC. Dipôle RL : phénomène d'auto-induction électromagnétique dans une bobine d'inductance L et résistance r, f.é.m d'auto-induction e = -L(di/dt), constante de temps τ = L/R_total, énergie magnétique emmagasinée E_L = ½Li². Circuit RLC série libre : échange mutuel d'énergie entre condensateur et bobine, amortissement par effet Joule, équation différentielle q'' + (R/L)q' + (1/LC)q = 0. Circuit RLC série en régime sinusoïdal forcé : impédance Z = √(R² + (Lω - 1/(Cω))²), déphasage φ de la tension par rapport à l'intensité, construction de Fresnel. Phénomène de résonance d'intensité pour Lω = 1/(Cω) (soit ω = ω₀ = 1/√(LC)), acuité de la résonance et facteur de qualité Q = (Lω₀)/R." },
        { title: "Fonctions organiques oxygénées : Alcools, composés carbonylés et acides", sa: "SA 4",
          cours: "Classes d'alcools : primaires R-CH₂OH, secondaires R-CH(OH)-R', tertiaires R-C(OH)R'R''. Oxydation ménagée des alcools par les ions dichromate Cr₂O₇²⁻ ou permanganate MnO₄⁻ en milieu acide : alcool primaire donne aldéhyde puis acide carboxylique ; alcool secondaire donne cétone ; alcool tertiaire ne s'oxyde pas. Tests d'identification des composés carbonylés : formation de précipité jaune-orangé avec la 2,4-DNPH (pour aldéhydes et cétones) ; réduction de la liqueur de Fehling (précipité rouge brique d'oxyde de cuivre I Cu₂O) et réactif de Tollens (miroir d'argent) spécifiques aux aldéhydes. Les acides carboxyliques R-COOH et leurs dérivés activés : chlorures d'acyle R-COCl (préparés avec SOCl₂ ou PCl₅) et anhydrides d'acide (R-CO)₂O." },
        { title: "Estérification, saponification, polymères et composés azotés", sa: "SA 4",
          cours: "Réaction d'estérification directe entre acide carboxylique et alcool : formation d'un ester et d'eau. Équilibre chimique réversible, athermique, lent et limité par la réaction inverse d'hydrolyse d'ester. Méthodes d'optimisation du rendement : excès de l'un des réactifs, élimination de l'eau formée par distillation, ou utilisation d'un réactif dérivé total et rapide (chlorure d'acyle ou anhydride d'acide). Saponification : hydrolyse basique des esters et triglycérides (corps gras) par les ions hydroxyde OH⁻ (soude NaOH ou potasse KOH) donnant du savon (sel d'acide gras) et du glycérol, réaction totale et rapide. Polymères synthétiques : polymérisation par polyaddition (polyéthylène, PVC) et polycondensation (polyesters, polyamides type Nylon 6-6). Composés azotés : amines (primaire, secondaire, tertiaire) et acides alpha-aminés (stéréochimie, énantiomères, liaison peptidique)." },
        { title: "Propagation des ondes mécaniques et diffraction", sa: "SA 5",
          cours: "Définition d'une onde mécanique : phénomène de propagation d'une perturbation dans un milieu matériel élastique sans transport global de matière mais avec transport d'énergie. Ondes longitudinales (ressort, son dans l'air) et ondes transversales (corde vibrante, vagues à la surface de l'eau). Célérité v = d/Δt. Onde progressive périodique sinusoïdale : double périodicité temporelle (période T, fréquence f = 1/T) et spatiale (longueur d'onde λ = v × T = v/f). Retard temporel d'un point M par rapport à la source S : θ = SM/v, équation horaire du mouvement y_M(t) = y_S(t - θ). Phénomène de diffraction à la traversée d'une fente de largeur a comparable à la longueur d'onde λ : modification de la forme de l'onde sans changement de sa fréquence ni de sa longueur d'onde (demi-angle de diffraction θ ≈ λ/a). Milieu dispersif : milieu où la célérité dépend de la fréquence de l'onde." },
        { title: "Optique ondulatoire : Interférences lumineuses et dispersion", sa: "SA 5",
          cours: "Nature ondulatoire de la lumière : onde électromagnétique se propageant dans le vide à la célérité c = 3 × 10⁸ m/s. Domaine visible : longueurs d'onde dans le vide comprises entre 400 nm (violet) et 800 nm (rouge). Indice de réfraction d'un milieu transparent n = c/v ≥ 1. Dispersion de la lumière blanche par un prisme ou un réseau. Dispositif des fentes d'Young : deux sources secondaires cohérentes et synchrones S₁ et S₂ distantes de a. Écran d'observation placé à la distance D (avec D >> a). Différence de marche au point M d'abscisse x : δ = S₂M - S₁M = (a × x) / D. Conditions d'interférences constructives (franges brillantes) : δ = k × λ (avec k ∈ Z). Conditions d'interférences destructives (franges sombres) : δ = (k + ½) × λ. Interfrange i : distance séparant les centres de deux franges brillantes ou sombres consécutives, formule fondamentale i = (λ × D) / a. Application à la mesure précise de longueurs d'onde laser." },
        { title: "Noyaux atomiques, radioactivité et réactions nucléaires", sa: "SA 6",
          cours: "Structure du noyau atomique : Z protons et N neutrons (nucléons A = Z + N). Notations isotopiques. Équivalence masse-énergie d'Einstein E = m × c². Défaut de masse du noyau Δm = [Z·m_p + (A-Z)·m_n] - m_{noyau} > 0. Énergie de liaison du noyau E_l = Δm × c² et énergie de liaison par nucléon E_l / A (mesure de la stabilité nucléaire, courbe d'Aston). Radioactivité spontanée : émission α (noyaux d'hélium ⁴₂He), émission β⁻ (électron ⁰₋₁e issu de la conversion n → p + e⁻ + ν̄), émission β⁺ (positon ⁰₊₁e issu de p → n + e⁺ + ν) et désexcitation γ électromagnétique. Lois de conservation de Soddy (conservation de la charge Z et du nombre de masse A). Loi de décroissance radioactive N(t) = N₀ e^{-λt}, constante radioactive λ, demi-vie radioactive ou période t_{1/2} = (ln 2) / λ. Activité radioactive A(t) = λ N(t) en Becquerels (Bq). Réactions nucléaires provoquées : fission des noyaux lourds d'uranium 235 sous l'impact d'un neutron thermique, et fusion des noyaux légers d'isotopes de l'hydrogène (deutérium et tritium), bilan d'énergie libérée." },
        { title: "Niveaux d'énergie de l'atome, spectres et effet photoélectrique", sa: "SA 6",
          cours: "Insuffisance de la physique classique et postulat de Planck : quantification des échanges d'énergie sous forme de quanta d'énergie E = h × ν = (h × c) / λ (constante de Planck h = 6,626 × 10⁻³⁴ J·s). Modèle de Bohr de l'atome d'hydrogène : les électrons gravitent sur des orbites circulaires stationnaires sans rayonner d'énergie. Quantification des niveaux d'énergie de l'atome d'hydrogène : E_n = -E₀ / n² = -13,6 / n² (en eV, avec 1 eV = 1,6 × 10⁻¹⁹ J et n entier naturel non nul). État fondamental (n = 1, E₁ = -13,6 eV), états excités (n > 1) et état ionisé (n → ∞, E_∞ = 0 eV). Émission d'un photon lors d'une transition d'un niveau supérieur E_p vers un niveau inférieur E_n : ΔE = E_p - E_n = hν. Absorption d'un photon de même énergie. Spectres de raies de l'hydrogène (séries de Lyman, Balmer, Paschen). Effet photoélectrique : extraction d'électrons d'un métal sous l'action d'un rayonnement électromagnétique incident. Fréquence seuil ν₀ et travail d'extraction W₀ = h × ν₀. Équation d'Einstein de l'effet photoélectrique : hν = W₀ + E_{c,max} = hν₀ + ½m v_{max}². Dualité onde-corpuscule de Louis de Broglie : à toute particule matérielle de quantité de mouvement p = mv est associée une onde de longueur d'onde λ = h / p." },
        { title: "Synthèse et révision générale du programme SPCT Terminale CD", sa: "SA 6",
          cours: "Ce chapitre récapitulatif mobilise l'ensemble des 6 Situations d'Apprentissage (SA) du programme officiel de SPCT des séries scientifiques C et D du Baccalauréat béninois : SA 1 (Mécanique newtonienne, mouvements dans les champs E, B et gravitationnels), SA 2 (Cinétique chimique, titrages et équilibres acido-basiques), SA 3 (Oscillations mécaniques et circuits électriques RLC en régimes libre et forcé), SA 4 (Chimie organique, alcools, dérivés carbonylés, acides, estérification, saponification et polymères), SA 5 (Ondes mécaniques, diffraction et interférences lumineuses), SA 6 (Physique nucléaire, décroissance radioactive, niveaux d'énergie de l'atome et effet photoélectrique). Méthodologie des épreuves du BAC : analyse critique des situations-problèmes, rigueur des schémas et bilans des forces, cohérence des unités dans le Système International et rédaction soignée des justifications scientifiques." }
      ]
    },
    "SVT": {
      chapters: [
        { title: "Génétique formelle : Monohybridisme et dihybridisme", sa: "SA 1",
          cours: "Lois fondamentales de Mendel : pureté des gamètes, ségrégation indépendante des allèles. Monohybridisme : croisement de parents de lignées pures différant par un seul caractère. Cas de dominance complète (proportions F2 : 3/4 phénotype dominant, 1/4 phénotype récessif) et de codominance (1/4, 2/4, 1/4). Test-cross (croisement-test) pour déterminer le génotype d'un individu de phénotype dominant. Dihybridisme : étude de deux couples d'allèles. Cas de gènes indépendants (proportions F2 : 9/16, 3/16, 3/16, 1/16 ; test-cross : 1/4, 1/4, 1/4, 1/4). Cas de gènes liés (linkage partiel avec crossing-over lors de la méiose, proportions de recombinaison et établissement de cartes génétiques factorielles)." },
        { title: "Génétique humaine et anomalies chromosomiques", sa: "SA 1",
          cours: "Méthodologie de la génétique humaine : analyse d'arbres généalogiques (pédigrées). Caractères héréditaires autosomiques dominants (présents à chaque génération, parents sains n'ayant pas d'enfants atteints) vs autosomiques récessifs (sauts de générations, enfants atteints issus de parents hétérozygotes sains dits porteurs sains, consanguinité augmentant le risque). Hérédité liée au sexe (chromosome X) : daltonisme, hémophilie (femmes transmettrices saines, hommes atteints). Anomalies chromosomiques : de nombre (aneuploïdies par non-disjonction méiotique : trisomie 21 ou syndrome de Down, syndrome de Turner 45,X0, syndrome de Klinefelter 47,XXY) et de structure (délétions, translocations réciproques ou robertsoniennes)." },
        { title: "Biologie moléculaire : ADN, réplication et synthèse des protéines", sa: "SA 2",
          cours: "Structure de l'ADN en double hélice antiparallèle : nucléotides formés d'un désoxyribose, d'un groupement phosphate et d'une base azotée (adénine-thymine, guanine-cytosine reliées par liaisons hydrogène). Réplication semi-conservative de l'ADN lors de la phase S de l'interphase sous l'action de l'ADN polymérase. Le code génétique : universel, dégénéré (redondant) et non chevauchant, associant 64 triplets de nucléotides (codons) à 20 acides aminés (dont 3 codons stop UAA, UAG, UGA). Transcription dans le noyau : ARN polymérase synthétisant l'ARNm précurseur, maturation par épissage. Traduction dans le cytoplasme : initiation, élongation et terminaison au niveau des ribosomes avec les ARNt porteurs d'anticodons." },
        { title: "Immunologie : Coopération cellulaire et réponse immunitaire adaptative", sa: "SA 2",
          cours: "Distinction du soi (antigènes du complexe majeur d'histocompatibilité CMH / HLA) et du non-soi (antigènes étrangers). Les cellules de l'immunité : Cellules Présentatrices d'Antigène (CPA, macrophages, cellules dendritiques), Lymphocytes T CD4 helpers (LT4), Lymphocytes T CD8 pré-cytotoxiques (LT8), Lymphocytes B (LB). Déroulement de la réponse spécifique : phase d'induction (reconnaissance de l'antigène par les récepteurs BCR des LB et TCR des LT), phase d'amplification clonale et de différenciation sous l'action des interleukines sécrétées par les LT4 auxiliaires activés. Phase effectrice : les plasmocytes sécrètent des anticorps circulants neutralisant les toxines et bactéries (immunité humorale) ; les LT cytotoxiques détruisent par perforation membranaire (perforine/granzymes) les cellules infectées par des virus ou cancéreuses (immunité cellulaire). Dysfonctionnement : infection par le VIH détruisant sélectivement les LT4." },
        { title: "Neurophysiologie : Message nerveux et transmission synaptique", sa: "SA 3",
          cours: "Potentiel de repos transmembranaire du neurone (-70 mV) maintenu par la pompe Na⁺/K⁺ ATPase. Potentiel d'action (PA) : dépolarisation brutale (entrée massive d'ions Na⁺ par canaux voltage-dépendants), repolarisation (sortie d'ions K⁺) et hyperpolarisation transitoire. Propriétés du PA : loi du tout ou rien, durée brève (1 à 2 ms), période réfractaire. Conduction du message nerveux : continue le long des fibres amyéliniques, saltatoire de nœud de Ranvier en nœud de Ranvier le long des fibres myélinisées (beaucoup plus rapide). Codage en fréquence de potentiels d'action. Transmission synaptique neuro-neuronale et neuromusculaire : arrivée du PA, entrée de Ca²⁺, exocytose de neurotransmetteurs (ex: acétylcholine) dans la fente synaptique, fixation sur récepteurs postsynaptiques, création d'un potentiel postsynaptique excitateur (PPSE) ou inhibiteur (PPSI)." },
        { title: "Régulation hormonale de la reproduction chez l'Homme et chez la Femme", sa: "SA 3",
          cours: "Chez l'homme : fonctionnement continu de l'axe hypothalamo-hypophysaire-testiculaire dès la puberté. L'hypothalamus sécrète par pulses la GnRH qui stimule l'adénohypophyse sécrétant FSH (stimule les cellules de Sertoli pour la spermatogenèse) et LH (stimule les cellules de Leydig pour la synthèse de testostérone). Rétrocontrôle négatif de la testostérone sur l'axe gonadotrope assurant une stabilité hormonale. Chez la femme : fonctionnement cyclique synchronisé des ovaires et de l'utérus. Phase folliculaire : FSH stimulant la croissance folliculaire et la sécrétion d'œstrogènes. Rétrocontrôle positif des œstrogènes à forte dose déclenchant le pic pré-ovulatoire de LH (décharge ovulante à J14). Phase lutéinique : formation du corps jaune sécrétant œstrogènes et progestérone exerçant un rétrocontrôle négatif." },
        { title: "Écologie des populations et flux de matière / énergie", sa: "SA 4",
          cours: "Structure des populations écologiques : densité, distribution spatiale, taux de natalité et de mortalité. Capacité de charge d'un écosystème. Relations interspécifiques : symbiose mutualiste, commensalisme, parasitisme, prédation et compétition. Rendement écologique de production et de transfert d'énergie à chaque niveau trophique (règle des 10%). Pyramides des nombres, de la biomasse et de l'énergie. Perturbations anthropiques : eutrophisation des milieux aquatiques, bioaccumulation des métaux lourds et pesticides le long des chaînes trophiques, perte de biodiversité et dérèglement climatique." },
        { title: "Géologie : Tectonique des plaques et phénomènes associés", sa: "SA 4",
          cours: "Structure interne de la Terre : croûte continentale granitique et océanique basaltique, manteau supérieur rigide formant avec la croûte la lithosphère (divisée en plaques rigides mobiles), asthénosphère ductile, manteau inférieur et noyau (externe liquide, interne solide). Frontières de plaques divergentes : dorsales océaniques avec accrétion magmatique et rifting continental. Frontières convergentes : subduction (plaque océanique plongeant sous une plaque continentale, séismes selon le plan de Wadati-Benioff, volcanisme explosif andésitique) et collision continentale (orogenèse, formation de chaînes de montagnes). Métamorphisme régional et cycle des roches." }
      ]
    },
    "Philosophie": {
      chapters: [
        { title: "La conscience, l'inconscient et le sujet", sa: "SA 1",
          cours: "Définition de la conscience : présence immédiate à soi-même et au monde extérieur. Conscience spontanée vs réflexive. Le doute cartésien et la certitude inaugurale du Cogito : 'Je pense, donc je suis' (Descartes), érigeant le sujet pensant en substance autonome. Critiques de la transparence du sujet : Spinoza et l'illusion du libre arbitre. La psychanalyse freudienne : l'hypothèse de l'inconscient psychique rendant compte des actes manqués, rêves, lapsus et névroses. Première topique (Inconscient, Préconscient, Conscient) et seconde topique (Ça pulsionnel, Moi médiateur et Surmoi censeur moral). Sartre et la critique de l'inconscient comme 'mauvaise foi'." },
        { title: "Autrui, l'intersubjectivité et la reconnaissance", sa: "SA 1",
          cours: "Le problème philosophique d'autrui : autrui comme un autre moi-même et comme radicalement différent de moi. Le risque du solipsisme. L'expérience du regard d'autrui chez Sartre : autrui est le médiateur indispensable entre moi et moi-même, mais son regard m'objective ('L'enfer, c'est les autres'). La dialectique hégélienne du maître et de l'esclave : la lutte à mort des consciences pour la reconnaissance mutuelle. L'éthique de la vulnérabilité chez Emmanuel Levinas : l'épiphanie du visage d'autrui comme commandement éthique ('Tu ne tueras point') imposant une responsabilité infinie et asymétrique envers le prochain." },
        { title: "Le désir, le bonheur et les passions", sa: "SA 2",
          cours: "Distinction conceptuelle entre besoin (vital, physiologique, borné) et désir (psychologique, culturel, potentiellement illimité). Platon dans Le Banquet : le désir comme manque et recherche perpétuelle de ce qu'on ne possède pas (mythe de la naissance d'Éros entre Poros et Pénia). Le désir comme puissance affirmative de vivre chez Spinoza : le conatus (l'effort par lequel chaque être persévère dans son être). L'épicurisme : hiérarchisation des plaisirs (naturels et nécessaires, naturels et non nécessaires, vains et non naturels) pour atteindre l'ataraxie (tranquillité de l'âme). Le stoïcisme : distinguer ce qui dépend de nous de ce qui n'en dépend pas." },
        { title: "La liberté et le déterminisme", sa: "SA 2",
          cours: "Les acceptions de la liberté : liberté d'action (absence de contrainte physique extérieure) vs libre arbitre (pouvoir de la volonté de choisir entre contraires sans détermination préalable). Les déterminismes : physique, biologique, psychologique et sociologique (Marx, Bourdieu). Spinoza et la liberté comme nécessité comprise : les hommes ont conscience de leurs désirs mais ignorent les causes qui les déterminent. Kant et la liberté comme autonomie de la volonté : obéissance à la loi morale dictée par la raison pratique (l'impératif catégorique). L'existentialisme de Sartre : 'L'existence précède l'essence', l'homme n'est rien d'autre que ce qu'il se fait, 'l'homme est condamné à être libre'." },
        { title: "La raison, le réel et la vérité", sa: "SA 3",
          cours: "Définition de la vérité : conformité de la pensée avec la réalité (vérité matérielle) et cohérence logique interne du discours (vérité formelle). Opposition rationalisme (Descartes, Spinoza : la raison pure est source première de vérité) et empirisme (Locke, Hume : toute connaissance procède des impressions sensibles). Le criticisme kantien : synthèse des formes a priori de la sensibilité/entendement et de la matière fournie par l'expérience. Théorie et expérimentation dans les sciences : démarche hypothético-déductive. La vérité scientifique est-elle absolue ? Popper et le critère de réfutabilité (falsifiabilité) : une proposition n'est scientifique que si elle est testable et susceptible d'être réfutée." },
        { title: "Le travail, la technique et la nature", sa: "SA 3",
          cours: "Le travail : étymologie tripallium (instrument de torture) vs acte d'humanisation. Hegel : par le travail, l'homme transforme la nature extérieure et se forme lui-même. Karl Marx et la critique du travail aliéné sous le mode de production capitaliste : l'ouvrier est dépossédé du produit de son travail, de l'acte de production et de son essence générique. La technique : prolongement des organes humains vs arraisonnement généralisé de la nature (Heidegger). L'homme maître et possesseur de la nature (Descartes) face aux impératifs de la responsabilité écologique contemporaine (Hans Jonas et le principe responsabilité)." },
        { title: "L'État, la justice et le droit", sa: "SA 4",
          cours: "L'état de nature comme fiction théorique et le pacte social : Hobbes (la guerre de tous contre tous, pacte de soumission au Léviathan pour garantir la sécurité), Locke (sauvegarde des droits naturels inaliénables de propriété et liberté), Rousseau (le Contrat social fondant la souveraineté populaire sur la volonté générale). Droit naturel vs droit positif (législation instituée par l'État). Antigone de Sophocle : le conflit entre la loi morale divine et les lois positives de la cité. Aristote : justice commutative (égalité arithmétique stricte) et justice distributive (égalité géométrique proportionnelle aux mérites). John Rawls et la Théorie de la justice sous le voile d'ignorance." },
        { title: "La philosophie africaine : Histoire, débats et enjeux contemporains", sa: "SA 4",
          cours: "L'émergence du débat sur la philosophie africaine au XXe siècle : controverse autour de l'ouvrage du Père Placide Tempels La Philosophie bantoue (1945). Le débat sur l'ethnophilosophie : dénonciation par Paulin Hountondji (philosophe béninois, auteur de Sur la 'philosophie africaine') de l'ethnophilosophie comme une vision collective, anonyme et figée qui confond mythes/proverbes traditionnels avec l'activité critique, individuelle et rigoureuse qu'est la philosophie. Critiques convergentes de Marcien Towa et Kwasi Wiredu. Les sagesses orales comme matériaux à penser plutôt que pensée toute faite. Les défis actuels de la pensée africaine : démocratie, décolonisation des savoirs, développement endogène, universalisme critique et renaissance africaine." }
      ]
    },
    "Histoire-Géographie": {
      chapters: [
        { title: "Les relations internationales de 1945 à la fin de la Guerre froide", sa: "SA 1",
          cours: "Le monde au lendemain de la Seconde Guerre mondiale : création de l'ONU à San Francisco (1945), accords de Yalta et Potsdam. La rupture de la Grande Alliance et l'instauration d'un monde bipolaire : doctrine Truman (endiguement) et plan Marshall d'un côté, doctrine Jdanov et Kominform de l'autre. Les crises emblématiques de la Guerre froide : le blocus de Berlin (1948-1949), la guerre de Corée (1950-1953), la construction du mur de Berlin (1961), la crise des missiles de Cuba (1962). La coexistence pacifique et la détente (1962-1975) suivie de la 'guerre fraîche' (invasion de l'Afghanistan, guerre des étoiles de Reagan). L'effondrement du bloc soviétique : perestroïka et glasnost de Gorbatchev, chute du mur de Berlin (9 novembre 1989), dislocation de l'URSS (décembre 1991)." },
        { title: "Les décolonisations en Asie et en Afrique et l'émergence du Tiers-Monde", sa: "SA 1",
          cours: "Facteurs de la décolonisation : affaiblissement des métropoles européennes après 1945, anticolonialisme des deux superpuissances (USA, URSS), action de l'ONU, rôle des intellectuels et syndicats africains et asiatiques. Les voies de l'émancipation : décolonisations négociées pacifiques (Inde 1947 par la non-violence de Gandhi, Ghana 1957 de Kwame Nkrumah, Afrique noire francophone en 1960) vs guerres de libération armées (Indochine 1946-1954, Algérie 1954-1962, colonies portugaises Angola et Mozambique). L'affirmation du Tiers-Monde : conférence afro-asiatique de Bandung (1955), création du Mouvement des non-alignés à Belgrade (1961). Naissance de l'Organisation de l'Unité Africaine (OUA) à Addis-Abeba en 1963." },
        { title: "L'Afrique contemporaine : De l'indépendance aux transitions démocratiques", sa: "SA 2",
          cours: "L'héritage colonial : frontières artificielles balkanisées, économies extraverties de rente. Les crises post-indépendances : instabilité politique chronique, succession de coups d'État militaires (au Dahomey/Bénin : coups de 1963, 1965, 1967, 1969, 1972), guerres civiles (Biafra, Congo-Kinshasa). L'expérience du marxisme-béninisme sous la République Populaire du Bénin (1974-1989) dirigée par Mathieu Kérékou : nationalisations, crise bancaire et faillite économique. Le tournant historique des années 1990 : la Conférence Nationale des Forces Vives de la Nation tenue à Cotonou à l'Hôtel PLM Alédjo (19-28 février 1990), présidée par Mgr Isidore de Souza. Modèle de transition démocratique pacifique qui a inspiré l'Afrique subsaharienne : adoption de la Constitution du 11 décembre 1990, multipartisme et alternance pacifique au pouvoir." },
        { title: "La mondialisation contemporaine : Acteurs, flux et réseaux", sa: "SA 2",
          cours: "Définition de la mondialisation : processus multidimensionnel d'interconnexion planétaire et d'interdépendance croissante des économies, des cultures et des sociétés. Les moteurs : révolution des transports maritimes (conteneurisation), aériens et de l'information numérique (Internet). Les acteurs clés : Firmes Multinationales (FMN) avec division internationale du travail (DIT), organisations économiques mondiales (OMC, FMI, Banque mondiale), États, Organisations Non Gouvernementales (ONG) et diasporas. La multiplicité des flux : flux matériels de marchandises (matières premières, hydrocarbures, produits manufacturés), flux immatériels financiers (IDE, spéculation boursière), flux d'informations et flux migratoires légaux et clandestins. Réseaux et hubs mondiaux." },
        { title: "Les pôles de puissance de l'espace mondial", sa: "SA 3",
          cours: "L'hyperpuissance américaine : superpuissance complète conjuguant 'hard power' (suprématie militaire mondiale, premier PIB mondial, dollar comme monnaie de réserve internationale) et 'soft power' (cinéma d'Hollywood, universités d'élite, marques globales). L'Union Européenne : géant économique et commercial de 27 pays, zone euro, mais puissance géopolitique et diplomatique incomplète. La montée en puissance fulgurante de la Chine : 'l'usine du monde' devenue deuxième économie mondiale, initiatives des Nouvelles Routes de la Soie (Belt and Road Initiative), modernisation militaire et affirmation géopolitique. Les puissances émergentes du groupe des BRICS (Brésil, Russie, Inde, Chine, Afrique du Sud) et la contestation de l'hégémonie occidentale vers un monde multipolaire." },
        { title: "Les pays du Sud et l'Afrique face aux défis de la mondialisation", sa: "SA 3",
          cours: "Hétérogénéité des pays en développement : pays émergents industrialisés vs Pays les Moins Avancés (PMA). L'Afrique dans la mondialisation : continent riche en ressources stratégiques (pétrole, gaz, minerais rares, terres arables) mais marginalisé dans le commerce mondial (moins de 3% des échanges mondiaux). Problématique du piège des matières premières : dépendance à la volatilité des cours mondiaux et insuffisance de transformation locale des produits. La transition démographique africaine : atout d'une jeunesse dynamique vs défi colossal de création d'emplois, d'éducation et de santé. Les grands projets structurants : Zone de Libre-Échange Continentale Africaine (ZLECAf), corridors régionaux et émergence de hubs technologiques et financiers." },
        { title: "Le Bénin : Organisation de l'espace national et atouts géostratégiques", sa: "SA 4",
          cours: "Organisation territoriale du Bénin : 12 départements administratifs, 77 communes. Les déséquilibres régionaux : macrocéphalie de l'axe urbain littoral Cotonou-Abomey-Calavi-Porto-Novo concentrant l'essentiel des activités économiques, des services et des flux, face à un arrière-pays septentrional et central à dominante agro-pastorale. Rôle géostratégique du Bénin : pays-transit carrefour de l'Afrique de l'Ouest, façade maritime reliant l'Océan Atlantique aux pays enclavés de l'hinterland (Niger, Burkina Faso, Mali) par le Port Autonome de Cotonou (PAC). Projets d'infrastructures d'envergure : modernisation et extension du PAC, création du port sec de Parakou, construction de la Zone Industrielle Spéciale de Glo-Djigbé (GDIZ) et de l'aéroport international de Glo-Djigbé." },
        { title: "Enjeux géopolitiques contemporains et environnement planétaire", sa: "SA 4",
          cours: "La gouvernance mondiale à l'épreuve des crises contemporaines : conflits asymétriques, terrorisme transnational dans la région sahélienne et menace sur les frontières septentrionales des pays côtiers ouest-africains. Cybersécurité et guerre de l'information. Les défis environnementaux planétaires : réchauffement climatique dû aux émissions de gaz à effet de serre (accords de Paris COP 21), montée des eaux menaçant le littoral ouest-africain (érosion côtière sévère au Sud du Bénin : Grand-Popo, Cotonou), déforestation, désertification et raréfaction des ressources en eau douce. L'impératif de transition écologique et énergétique : mix énergétique solaire et développement durable conciliant croissance économique, équité sociale et respect des écosystèmes." }
      ]
    },
    "Français & Littérature": {
      chapters: [
        { title: "La dissertation littéraire et philosophique", sa: "SA 1",
          cours: "Objectif et méthodologie de la dissertation littéraire au BAC : analyse rigoureuse du sujet (mots-clés, présupposés, paradoxe sous-jacent). Formulation de la problématique centrale. Les types de plans : plan dialectique (thèse, antithèse, synthèse/dépassement pour les sujets polémiques ou discutables), plan thématique (exploration de différentes facettes d'une même question), plan analytique (constat, causes, conséquences, perspectives). Rédaction de l'introduction canonique en 3 étapes : amorce/accroche, insertion et reformulation de la citation/sujet, problématique et annonce claire du plan. Construction des paragraphes selon la règle AEI : Affirmation de l'argument, Explication développée, Illustration textuelle précise (œuvres, auteurs, citations exactes). Transitions soignées et conclusion synthétique avec ouverture." },
        { title: "Le commentaire composé littéraire", sa: "SA 1",
          cours: "Méthode du commentaire de texte littéraire (poésie, théâtre, roman, essai) : lecture attentive, repérage des thèmes, des registres et de la structure du passage. Établissement d'une problématique de lecture montrant l'adéquation entre le fond (les idées, les sentiments, le message de l'auteur) et la forme (choix lexicaux, syntaxe, figures de style, versification, didascalies). Élaboration d'un plan en deux ou trois parties équilibrées, chacune subdivisée en deux ou trois sous-parties ordonnées. Proscription absolue de la paraphrase : chaque analyse doit s'appuyer sur une citation textuelle commentée dans son effet esthétique et émotionnel." },
        { title: "Les grands mouvements littéraires français : Du Classicisme aux Lumières", sa: "SA 2",
          cours: "Le Classicisme du XVIIe siècle : idéal de l'honnête homme, culte de la raison, clarté, vraisemblance et bienséance. La règle des trois unités au théâtre (action, temps, lieu). Corneille (Le Cid et le dilemme cornélien), Racine (Phèdre et la fatalité des passions), Molière (Dom Juan, Le Misanthrope et la critique sociale par le rire), La Fontaine (Les Fables instruisant par le détour animal). Le Siècle des Lumières (XVIIIe siècle) : combat de la raison contre l'obscurantisme, l'intolérance religieuse et la tyrannie politique. Voltaire (Candide et le conte philosophique), Montesquieu (De l'Esprit des lois et la séparation des pouvoirs), Rousseau (Du Contrat social), Diderot et d'Alembert (L'Encyclopédie)." },
        { title: "Du Romantisme au Réalisme et Symbolisme du XIXe siècle", sa: "SA 2",
          cours: "Le Romantisme : libération de l'imagination, expression du 'moi' lyrique, mal du siècle, communion avec la nature sauvage et engagement politique (Victor Hugo, Lamartine, Musset, Chateaubriand). La bataille d'Hernani et l'éclatement des règles classiques. Le Réalisme : ambition de peindre fidèlement la société contemporaine dans toutes ses classes sans fard ni complaisance (Balzac et La Comédie humaine, Stendhal, Flaubert et Madame Bovary). Le Naturalisme : influence des sciences expérimentales et de la physiologie héréditaire (Émile Zola et les Rougon-Macquart). Le Symbolisme et la modernité poétique : recherche des correspondances et de la musicalité pure du vers (Baudelaire et Les Fleurs du mal, Rimbaud, Verlaine, Mallarmé)." },
        { title: "La Négritude et les pionniers de la littérature négro-africaine", sa: "SA 3",
          cours: "Naissance du mouvement de la Négritude à Paris dans les années 1930 : revue L'Étudiant noir animée par Aimé Césaire (Martinique), Léopold Sédar Senghor (Sénégal) et Léon-Gontran Damas (Guyane). Définition de la Négritude selon Césaire dans Cahier d'un retour au pays natal : 'la simple reconnaissance du fait d'être noir, et l'acceptation de ce fait, de notre destin de noir, de notre histoire et de notre culture'. Senghor et l'affirmation des valeurs de civilisation du monde noir et de l'émotion créatrice. Damas et la révolte poétique dans Pigments. Les romans pré- et post-indépendance dénonçant l'oppression coloniale : Ferdinand Oyono (Une vie de boy, Le Vieux Nègre et la médaille), Mongo Beti (Le Pauvre Christ de Bomba), Camara Laye (L'Enfant noir)." },
        { title: "Le roman et le théâtre contemporains d'Afrique subsaharienne", sa: "SA 3",
          cours: "L'évolution de la littérature africaine après 1960 : désillusion face aux dérives des régimes autoritaires postcoloniaux, dénonciation de la corruption, de la dictature et de la misère populaire. Ahmadou Kourouma : renouvellement audacieux de la langue française par l'intrusion des tournures malinké dans Les Soleils des indépendances et En attendant le vote des bêtes sauvages. Sony Labou Tansi et l'écriture de la démesure baroque et carnavalesque (La Vie et demie). Le théâtre africain engagé : Bernard Dadié, Guillaume Oyônô Mbia (Trois prétendants... un mari). L'émergence des voix féminines majeures : Mariama Bâ (Une si longue lettre dénonçant la polygamie subie et les pesanteurs patriarcales), Aminata Sow Fall." },
        { title: "Les maîtres des lettres béninoises", sa: "SA 4",
          cours: "Panthéon littéraire béninois : Félix Couchoro, pionnier du roman populaire ouest-africain (L'Esclave, 1929). Paulin Joachim, poète incandescent du renouveau nègre (Un nègre raconte). Olympe Bhêly-Quenum, maître du réalisme psychologique et magique explorant l'âme dahoméenne et le mystère de l'existence (Un piège sans fin, Le Chant du lac, L'Initié). Jean Pliya, dramaturge majeur : Kondo le Requin (épopée historique immortalisant le sacrifice de Béhanzin pour la liberté du Danxomè), La Secrétaire particulière (satire grinçante des mœurs de bureau). Écrivains contemporains : Florent Couao-Zotti (romans policiers et urbains de Cotonou : Les Fantômes du Brésil, Western tchopédie), Daté Atavito Barnabé-Akayi, Jérôme Carlos." },
        { title: "Rhétorique, stylistique et analyse du discours", sa: "SA 4",
          cours: "Les registres littéraires : lyrique (émotion personnelle, plainte, amour), pathétique (compassion et larmes devant la souffrance), tragique (terreur et fatalité inéluctable), épique (célébration héroïque, surdimensionnement), comique, satirique (dénonciation par l'ironie et la caricature), polémique (affrontement violent des idées). Étude avancée des figures de style : figures de rhétorique (chiasme, oxymore, antithèse, prétérition, litote, antiphrase ironique). Prosodie et métrique en poésie : césure à l'hémistiche dans l'alexandrin, enjambement, rejet, contre-rejet, allitérations et assonances. Cohérence et cohésion textuelle." }
      ]
    },
    "Anglais": {
      chapters: [
        { title: "Advanced Grammar: Complex Clause Structures and Inversion", sa: "SA 1",
          cours: "Complex sentences: relative clauses (defining vs non-defining with commas and no 'that'), noun clauses, adverbial clauses of concession, condition, cause and result. Negative and restrictive inversions for emphasis (Hardly had I arrived when..., Seldom do we see..., Not only did he pass, but he also won an award). Cleft sentences (It was John who..., What I really need is...). Subjunctive mood in English (I suggest that he be present; It is imperative that she study)." },
        { title: "Mastery of Conditionals and Wish Clauses", sa: "SA 1",
          cours: "Complete review of conditionals: Zero, First, Second and Third Conditionals (If + past perfect, would have + past participle). Mixed Conditionals connecting past hypothetical actions to present results (If I had won the lottery, I would be rich today) or permanent traits to past outcomes. Alternative conditional conjunctions: provided that, as long as, unless (= if not), in case, but for, supposing. Expressing wishes and regrets: wish / if only + past simple (present regret), wish + past perfect (past regret), wish + would (complaint about another person's habit)." },
        { title: "Academic Writing: Argumentative Essays and Critical Analysis", sa: "SA 2",
          cours: "Requirements of the BAC English writing paper: argumentative essay, article for publication, speech and debate composition. Strict structural framework: Hook/general introduction, clearly formulated thesis statement, topic sentences for each body paragraph, development with concrete evidence, counterarguments and refutations, logical conclusion with broad perspective. High-level connectors and academic discourse markers: consequently, nonetheless, in light of this, it is widely acknowledged that, on balance." },
        { title: "Postcolonial African Literature in English", sa: "SA 2",
          cours: "Chinua Achebe (Things Fall Apart): cultural clash, destruction of Igbo traditional society by British colonization and Christian missionaries. Wole Soyinka (Nobel Prize in Literature): Death and the King's Horseman, blending traditional Yoruba mythology, ritual suicide and European colonial misunderstanding. Ngugi wa Thiong'o (Weep Not, Child, Decolonising the Mind): Mau Mau struggle in Kenya and advocacy for African mother tongues. Chimamanda Ngozi Adichie (Purple Hibiscus, Half of a Yellow Sun): post-civil war Nigeria, religious fundamentalism, gender dynamics and modern African identities." },
        { title: "Global Socio-Economic and Environmental Challenges", sa: "SA 3",
          cours: "Globalization and economic disparities: multinational corporations, brain drain vs diaspora remittances, fair trade. Global environmental crises: carbon footprint, renewable energies, deforestation in tropical basins, rising sea levels threatening coastal cities like Cotonou and Lagos, COP international climate agreements. Sustainable development goals (SDGs): eradicating poverty, promoting girls' education, universal healthcare access." },
        { title: "Science, Technology, Ethics and Modern Society", sa: "SA 3",
          cours: "The digital revolution: artificial intelligence, automation, machine learning and the future of work for African youth. Social media impacts: connectivity and digital entrepreneurship vs misinformation, cyberbullying and loss of privacy. Bioethics: genetic engineering, GMOs in African agriculture, cloning, access to vaccines and clinical trials ethics. The digital divide and technological sovereignty in developing nations." },
        { title: "Business English, Media Literacy and Formal Correspondence", sa: "SA 4",
          cours: "Business communication: curriculum vitae (CV) and professional resume drafting, formal cover letters for job and scholarship applications, interview preparation and negotiation language. Media literacy: critical consumption of news, identifying ideological bias, propaganda techniques, clickbait, and fact-checking methods. Writing business memos, reports, minutes of meetings, and executive summaries." },
        { title: "Oral Presentation Skills and Cross-Cultural Communication", sa: "SA 4",
          cours: "Techniques for oral examination and public speaking: vocal projection, eye contact, body language, effective visual aids, persuasive rhetorical devices (triplets, rhetorical questions). Cross-cultural communication nuances: high-context vs low-context cultures, non-verbal cues, etiquette in international settings. English as a tool for African unity, trade and diplomacy within ECOWAS and the African Union." }
      ]
    },
    "Économie": {
      chapters: [
        { title: "Fondements de l'économie, rareté et circuit économique", sa: "SA 1",
          cours: "Objet de la science économique : lutte contre la rareté des ressources face à des besoins humains illimités. Les grands choix économiques : que produire, comment produire et pour qui produire ? Typologie des biens (biens économiques, biens libres, biens collectifs, biens de consommation vs biens de production). Les agents économiques : ménages (consommation, fourniture de travail), sociétés non financières (production de biens et services marchands), institutions financières (intermédiation financière, création monétaire), administrations publiques (redistribution, production de services non marchands), reste du monde. Le circuit économique : flux réels et flux monétaires, interdépendance des marchés." },
        { title: "Microéconomie : Comportement des agents, marchés et formation des prix", sa: "SA 1",
          cours: "Théorie du consommateur : utilité totale et utilité marginale décroissante, contrainte budgétaire, courbe de demande décroissante par rapport au prix. Élasticité-prix de la demande et élasticité-revenu. Théorie du producteur : facteurs de production (travail L, capital K), fonction de production, rendements d'échelle, coûts fixes, coûts variables, coût marginal et maximisation du profit (recette marginale = coût marginal). Les structures de marché : le modèle de Concurrence Pure et Parfaite (CPP) et ses 5 conditions (atomicité, homogénéité, libre entrée/sortie, transparence, mobilité des facteurs). Les marchés de concurrence imparfaite : monopole (naturel, légal, d'innovation), oligopole, cartel et concurrence monopolistique." },
        { title: "Macroéconomie : Agrégats, PIB et croissance économique", sa: "SA 2",
          cours: "La comptabilité nationale et la mesure de l'activité économique. Le Produit Intérieur Brut (PIB) : somme des valeurs ajoutées brutes + impôts sur les produits - subventions. Les trois optiques de calcul du PIB : production, dépenses/demande (PIB = C + I + G + X - M) et revenus. PIB nominal vs PIB réel (corrigé de l'inflation par le déflateur). Limites du PIB comme indicateur de bien-être (non prise en compte de l'économie informelle, du travail domestique, des inégalités et des dégradations environnementales). L'Indice de Développement Humain (IDH). Les sources de la croissance économique : accumulation des facteurs (croissance extensive) et progrès technique / Productivité Globale des Facteurs PGF (croissance intensive). Théories de la croissance endogène (Romer, Lucas, Barro)." },
        { title: "Monnaie, système bancaire et politique monétaire", sa: "SA 2",
          cours: "Les trois fonctions traditionnelles de la monnaie : intermédiaire des échanges, unité de compte, réserve de valeur. Les formes de la monnaie : de la monnaie marchandise à la monnaie fiduciaire (billets et pièces) et scripturale (dépôts bancaires). La création monétaire par les banques commerciales de second rang : 'les crédits font les dépôts'. Le rôle des banques centrales : institut d'émission, prêteur en dernier ressort, contrôle prudentiel. La Banque Centrale des États de l'Afrique de l'Ouest (BCEAO) et la zone Franc CFA (UEMOA) : parité fixe avec l'Euro, compte d'opérations et réformes vers l'Eco. Les instruments de la politique monétaire : taux directeurs, réserves obligatoires, opérations d'open market. Inflation (causes par la demande, par les coûts, par la monnaie), déflation et désinflation." },
        { title: "Commerce international, mondialisation et politiques commerciales", sa: "SA 3",
          cours: "Les théories traditionnelles du commerce international : théorie des avantages absolus d'Adam Smith, théorie des avantages comparatifs de David Ricardo, modèle HOS (Heckscher-Ohlin-Samuelson) basé sur les dotations factorielles. Les gains à l'échange. Les nouvelles théories du commerce : différenciation des produits, économies d'échelle (Krugman). Le débat séculaire Libre-échange vs Protectionnisme : arguments du protectionnisme éducateur (List) et stratégique vs risques de rétorsion et inefficacité. Les instruments protectionnistes tarifaires (droits de douane) et non tarifaires (quotas, normes techniques et sanitaires, subventions à l'exportation). L'Organisation Mondiale du Commerce (OMC) et les accords régionaux d'intégration (UEMOA, CEDEAO, ZLECAf)." },
        { title: "Développement économique et lutte contre la pauvreté", sa: "SA 3",
          cours: "Distinction conceptuelle entre croissance économique (phénomène quantitatif) et développement (phénomène qualitatif, transformation des structures économiques, sociales et institutionnelles). Les étapes de la croissance selon Rostow. Les théories de la dépendance et de l'échange inégal (Samir Amin). Les pièges de la pauvreté : trappes à faible productivité, insuffisance de l'épargne et de l'investissement. Les stratégies d'industrialisation dans les pays du Sud : industrialisation par substitution aux importations (ISI) vs promotion des exportations. Politiques d'ajustement structurel (PAS) du FMI/Banque mondiale et leurs impacts sociaux. Le rôle du microcrédit et de l'inclusion financière des femmes et des jeunes entrepreneurs." },
        { title: "L'économie béninoise : Structures, potentialités et défis", sa: "SA 4",
          cours: "Analyse sectorielle de l'économie du Bénin : poids prépondérant de l'agriculture (coton comme principale culture de rente, diversification vers l'anacarde, le karité, l'ananas), fragilité du secteur secondaire et prédominance du secteur tertiaire marchand (commerce et transport). Le Port Autonome de Cotonou : poumon de l'économie nationale. La dépendance commerciale et monétaire vis-à-vis du Nigeria (commerce transfrontalier formel et informel, fluctuations du Naira). L'importance du secteur informel : amortisseur social mais manque à gagner fiscal pour l'État. Le Plan National de Développement (PND) et le Programme d'Action du Gouvernement (PAG) : grands chantiers d'infrastructures, réformes fiscales, digitalisation des services publics et promotion de l'investissement privé à la GDIZ." },
        { title: "Défis économiques contemporains : Emploi, climat et numérique", sa: "SA 4",
          cours: "Le marché du travail au Bénin et en Afrique : chômage des diplômés, sous-emploi endémique, précarité de l'emploi des jeunes et inadéquation formation-emploi. Politiques actives de l'emploi : formation technique et professionnelle, entrepreneuriat des jeunes. L'économie verte et la transition écologique : concilier développement et préservation des ressources, impact économique du réchauffement climatique sur les rendements agricoles et le littoral. L'économie numérique et les Fintech : explosion du Mobile Money (MTN MoMo, Moov Money, Celtiis), e-commerce, inclusion financière accélérée et modernisation des moyens de paiement au Bénin." }
      ]
    },
    "Comptabilité": {
      chapters: [
        { title: "Cadre conceptuel et principes comptables SYSCOHADA", sa: "SA 1",
          cours: "Définition et rôle de la comptabilité générale : système d'organisation de l'information financière permettant de saisir, classer, enregistrer des données de base chiffrées et présenter des états financiers reflétant une image fidèle du patrimoine, de la situation financière et du résultat de l'entité. Le Système Comptable OHADA (SYSCOHADA révisé) applicable dans les 17 États membres de l'espace OHADA dont le Bénin. Les principes comptables fondamentaux : continuité d'exploitation, prudence, régularité et sincérité, permanence des méthodes, coût historique, spécialisation des exercices (indépendance des exercices), transparence, importance significative, prééminence de la réalité économique sur l'apparence juridique." },
        { title: "Le Bilan comptable et le Compte de résultat", sa: "SA 1",
          cours: "Le Bilan : état financier de synthèse décrivant la situation patrimoniale de l'entreprise à une date donnée. L'Actif (emplois de ressources) : Actif immobilisé (classe 2 : immobilisations incorporelles, corporelles et financières), Actif circulant (classe 3 : stocks, classe 4 : créances d'exploitation) et Trésorerie-Actif (classe 5 : banques, caisses). Le Passif (origines des ressources) : Ressources stables (classe 1 : capitaux propres, emprunts et dettes financières), Passif circulant (dettes d'exploitation fournisseurs, fiscales, sociales) et Trésorerie-Passif (découverts bancaires). Équation fondamentale : Total Actif = Total Passif. Le Compte de résultat : synthèse des charges (appauvrissements, classe 6) et des produits (enrichissements, classe 7) de l'exercice. Résultat net = Total Produits - Total Charges." },
        { title: "Mécanisme de la partie double et organisation comptable", sa: "SA 2",
          cours: "Principe universel de la partie double : chaque opération donne lieu à une écriture affectant au moins deux comptes, l'un étant débité et l'autre crédité d'un montant rigoureusement équivalent (Total Débits = Total Crédits). La codification décimale des comptes du SYSCOHADA (classes 1 à 9). L'organisation des documents comptables obligatoires : les pièces justificatives (factures, reçus, pièces de caisse), le Livre-Journal (enregistrement chronologique au jour le jour), le Grand-Livre (regroupement des écritures par compte en 'T'), la Balance générale des comptes (tableau de contrôle périodique vérifiant l'égalité des débits et des crédits et des soldes débiteurs et créditeurs)." },
        { title: "Opérations courantes d'achats, de ventes et facturation avec TVA", sa: "SA 2",
          cours: "Les factures de 'Doit' et factures d'Avoir. Les réductions commerciales : rabais (pour défaut de conformité ou retard), remise (pour fidélité ou volume important), ristourne (périodique). Les réductions financières : escompte de règlement (pour paiement comptant ou anticipé). Règle comptable : les réductions commerciales sur facture de doit ne sont pas comptabilisées (on enregistre le Net Commercial), tandis que l'escompte financier est toujours comptabilisé (compte 673 pour le fournisseur, compte 773 pour le client). Frais accessoires d'achat : transports (compte 611/612). Mécanisme de la Taxe sur la Valeur Ajoutée (TVA au taux de 18% au Bénin) : TVA facturée/collectée sur les ventes (compte 4431), TVA récupérable/déductible sur les achats et immobilisations (comptes 4452 et 4451), calcul de la TVA due (TVA collectée - TVA déductible, compte 4441) ou du crédit de TVA." },
        { title: "Gestion et comptabilisation des règlements : Effets de commerce et trésorerie", sa: "SA 3",
          cours: "Les instruments de paiement au comptant : chèques bancaires, virements, paiements électroniques Mobile Money, espèces en caisse (compte 571). Les effets de commerce : lettre de change (tirée par le fournisseur-tireur sur le client-tiré) et billet à ordre (émis par le client-souscripteur). Création et acceptation de l'effet (comptes 412 Clients - Effets à recevoir et 402 Fournisseurs - Effets à payer). Utilisation de la lettre de change : encaissement à l'échéance par la banque (compte 512), négociation par escompte avant l'échéance auprès de la banque (agios = escompte d'intérêt + commissions bancaires + TVA sur agios, compte 675 et compte de trésorerie), endossement au profit d'un tiers. L'état de rapprochement bancaire : pointage et régularisation des décalages d'écritures entre le compte 512 de l'entreprise et l'extrait de compte envoyé par la banque." },
        { title: "Rémunération du personnel et charges sociales / fiscales", sa: "SA 3",
          cours: "Structure du bulletin de paie au Bénin : Salaire de base + heures supplémentaires + primes et indemnités imposables = Salaire Brut Imposable. Déductions salariales à la source : cotisations sociales ouvrières à la Caisse Nationale de Sécurité Sociale (CNSS, 3,6% pour les prestations de vieillesse), Impôt Progressif sur les Traitements et Salaires (IPTS) retenu à la source par l'employeur. Salaire net à payer au salarié (compte 422). Les charges patronales supportées par l'entreprise : cotisations patronales CNSS (prestations familiales, accidents du travail, vieillesse) et Versement Patronal sur Salaires (VPS au taux de 4%). Comptabilisation : débit des comptes 661/662 (rémunérations du personnel) et 664 (charges sociales), crédit des comptes 422 (personnel, rémunérations dues), 431 (sécurité sociale) et 447 (impôts d'État retenus à la source)." },
        { title: "Travaux d'inventaire : Amortissements et dépréciations d'actifs", sa: "SA 4",
          cours: "Principe de l'inventaire physique obligatoire de fin d'exercice. Les amortissements des immobilisations : constatation de la dépréciation irréversible de la valeur d'un actif résultant de l'usure, du temps ou de l'obsolescence. Amortissement linéaire (annuité constante = Valeur d'Origine VO × taux t) et amortissement dégressif. Valeur Nette Comptable VNC = VO - Cumul des amortissements. Enregistrement : débit du compte 681 (Dotations aux amortissements d'exploitation) et crédit du compte 28 (Amortissements des immobilisations). Les dépréciations d'actifs (stocks, créances douteuses, titres) : constatation de pertes de valeur réversibles et probables. Ajustement des dépréciations d'une année sur l'autre (dotation complémentaire au compte 659/681 ou reprise de dépréciation au compte 759/781)." },
        { title: "Régularisations de fin d'exercice et états financiers de synthèse", sa: "SA 4",
          cours: "Principe d'indépendance des exercices : rattacher à chaque exercice les charges et les produits qui le concernent effectivement, et ceux-là seulement. Régularisation des charges : Charges à payer (factures non parvenues, compte 408) et Charges constatées d'avance (payées d'avance pour l'exercice suivant, compte 476). Régularisation des produits : Produits à recevoir (factures à établir, compte 418) et Produits constatés d'avance (compte 477). Les variations de stocks de fin d'exercice : annulation du stock initial et constatation du stock final physique (comptes 6031 pour marchandises, 6032 pour matières, 736 pour produits finis). Élaboration des états financiers de synthèse annuels du SYSCOHADA : le Bilan, le Compte de résultat, le Tableau des flux de trésorerie (TFT) et les Notes annexes." }
      ]
    }
  }
};

function slugify(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'cours';
}

function escapeStr(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getKnowledgeSubject(niveau, subjectName) {
  if (!KNOWLEDGE_BASE[niveau]) return null;
  if (KNOWLEDGE_BASE[niveau][subjectName]) return KNOWLEDGE_BASE[niveau][subjectName];

  // Correspondance tolérante pour les variantes de libellés
  // Ex: "Français & Littérature" <-> "Français", "Lecture / Dictée" <-> "Lecture/Dictée"
  const norm = String(subjectName).toLowerCase().replace(/[^a-z0-9]/g, '');
  for (const key of Object.keys(KNOWLEDGE_BASE[niveau])) {
    const keyNorm = key.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (norm.includes(keyNorm) || keyNorm.includes(norm)) {
      return KNOWLEDGE_BASE[niveau][key];
    }
  }
  return null;
}

// =========================================================================
// MOTEUR DE GÉNÉRATION D'EXERCICES (2 à 3 QCM / VRAI-FAUX PAR CHAPITRE)
// =========================================================================
// MOTEUR DE GÉNÉRATION D'EXERCICES DE BASE (QCM / VRAI-FAUX PAR CHAPITRE)
// COUVRE TOUTES LES MATIÈRES DU BREVET & BAC (BÉNIN MEMP/OBB)
// =========================================================================
function _rawGenerateChapterExerciseSet(chapterTitle, subjectName, niveau, coursContent) {
  const normTitle = String(chapterTitle || '').toLowerCase();
  const normSubj = String(subjectName || '').toLowerCase();

  // 1. HISTOIRE-GÉOGRAPHIE BREVET
  if (normSubj.includes('histoire') || normSubj.includes('geo')) {
    if (normTitle.includes('imperialisme') || normTitle.includes('berlin') || normTitle.includes('partage')) {
      return [
        {
          consigne: "Question 1 — QCM de compréhension",
          question: "Quelle conférence diplomatique a fixé les règles du partage colonial de l'Afrique en 1884-1885 ?",
          type: "qcm",
          options: ["a) La Conférence de Paris", "b) La Conférence de Berlin", "c) La Conférence de Brazzaville", "d) Le Traité de Versailles"],
          correctOption: "b",
          explication: "La Conférence de Berlin (1884-1885), convoquée par le chancelier allemand Bismarck, a organisé le partage de l'Afrique entre puissances européennes sans consulter les Africains."
        },
        {
          consigne: "Question 2 — Vrai ou Faux",
          question: "Des représentants de souverains africains participaient officiellement aux débats de la Conférence de Berlin.",
          type: "vf",
          options: ["Vrai", "Faux"],
          correctOption: "faux",
          explication: "FAUX. Aucun délégué ou roi africain n'a été invité ou consulté lors de la Conférence de Berlin."
        },
        {
          consigne: "Question 3 — QCM d'approfondissement examen",
          question: "Quel principe retenu à Berlin a déclenché la course effrénée aux colonies ?",
          type: "qcm",
          options: ["a) Le principe de l'occupation effective de l'arrière-pays", "b) L'obligation de convertir les souverains", "c) Le vote des populations locales", "d) L'interdiction des comptoirs côtiers"],
          correctOption: "a",
          explication: "Le principe de l'occupation effective obligeait toute puissance revendiquant une côte à occuper et administrer l'intérieur des terres pour faire reconnaître sa possession."
        }
      ];
    }
    if (normTitle.includes('behanzin') || normTitle.includes('resistance') || normTitle.includes('bio guera')) {
      return [
        {
          consigne: "Question 1 — QCM de compréhension",
          question: "Quel roi héroïque du Danxomè (Dahomey) a mené la résistance armée contre l'armée coloniale du colonel Dodds ?",
          type: "qcm",
          options: ["a) Le roi Glèlè", "b) Le roi Dada Gbêhanzin", "c) Le roi Agadja", "d) Le roi Toffa 1er"],
          correctOption: "b",
          explication: "Le roi Dada Gbêhanzin a courageusement résisté aux troupes coloniales françaises de 1890 à 1894."
        },
        {
          consigne: "Question 2 — Vrai ou Faux",
          question: "Bio Guéra a dirigé une résistance populaire armée contre le recrutement militaire forcé dans le Borgou en 1916.",
          type: "vf",
          options: ["Vrai", "Faux"],
          correctOption: "vrai",
          explication: "VRAI. Le prince guerrier Bio Guéra s'est illustré dans le Borgou en 1916 contre les exactions et l'enrôlement forcé pour la Grande Guerre."
        },
        {
          consigne: "Question 3 — QCM d'approfondissement examen",
          question: "Quel corps d'élite féminin s'est illustré lors des batailles acharnées de Pogué et Dogba sous Gbêhanzin ?",
          type: "qcm",
          options: ["a) Les tirailleuses dahoméennes", "b) Les Agoodjié (Amazones du Dahomey)", "c) Les hussardes d'Abomey", "d) La garde suisse"],
          correctOption: "b",
          explication: "Les Agoodjié (ou Amazones du Dahomey) formaient un régiment militaire féminin réputé pour sa bravoure légendaire au combat."
        }
      ];
    }
    if (normTitle.includes('aof') || normTitle.includes('systeme colonial') || normTitle.includes('indigenat')) {
      return [
        {
          consigne: "Question 1 — QCM de compréhension",
          question: "Quelle ville était la capitale fédérale de l'Afrique Occidentale Française (AOF) ?",
          type: "qcm",
          options: ["a) Cotonou", "b) Dakar", "c) Abidjan", "d) Saint-Louis"],
          correctOption: "b",
          explication: "Dakar (Sénégal) était la capitale administrative de toute la fédération de l'AOF de 1902 à 1958."
        },
        {
          consigne: "Question 2 — Vrai ou Faux",
          question: "Le Code de l'indigénat conférait aux sujets coloniaux les mêmes droits politiques qu'aux citoyens français.",
          type: "vf",
          options: ["Vrai", "Faux"],
          correctOption: "faux",
          explication: "FAUX. Le régime de l'indigénat privait les populations colonisées de libertés civiques et les soumettait au travail forcé et aux peines sans jugement."
        },
        {
          consigne: "Question 3 — QCM d'approfondissement examen",
          question: "Quelle production agricole d'exportation était le pilier de l'économie de traite au Dahomey colonial ?",
          type: "qcm",
          options: ["a) Le cacao", "b) L'huile et les amandes de palme", "c) Le café arabica", "d) Le thé"],
          correctOption: "b",
          explication: "Le palmier à huile (huile de palme et palmiste) constituait la quasi-totalité des exportations dahoméennes sous la colonisation."
        }
      ];
    }
    if (normTitle.includes('independance') || normTitle.includes('1960') || normTitle.includes('maga')) {
      return [
        {
          consigne: "Question 1 — QCM de compréhension",
          question: "À quelle date historique le Dahomey (actuel Bénin) a-t-il accédé à son indépendance nationale ?",
          type: "qcm",
          options: ["a) 1er août 1958", "b) 1er août 1960", "c) 11 décembre 1990", "d) 28 février 1960"],
          correctOption: "b",
          explication: "Le Dahomey a proclamé solennellement son indépendance le 1er août 1960, date célébrée chaque année comme fête nationale."
        },
        {
          consigne: "Question 2 — Vrai ou Faux",
          question: "Hubert Coutoucou Maga est le premier Président de la République du Dahomey indépendant.",
          type: "vf",
          options: ["Vrai", "Faux"],
          correctOption: "vrai",
          explication: "VRAI. Hubert Maga a été investi comme le premier chef d'État du Dahomey en août 1960."
        },
        {
          consigne: "Question 3 — QCM d'approfondissement examen",
          question: "Quel texte français adopté en 1956 a introduit l'autonomie interne et le suffrage universel en AOF ?",
          type: "qcm",
          options: ["a) Le Traité de Rome", "b) La Loi-Cadre Defferre", "c) L'Ordonnance de Brazzaville", "d) Le décret Ballot"],
          correctOption: "b",
          explication: "La Loi-Cadre Defferre (1956) a créé des conseils de gouvernement locaux élus au suffrage universel dans chaque territoire."
        }
      ];
    }
    if (normTitle.includes('relief') || normTitle.includes('physique') || normTitle.includes('climat') || normTitle.includes('atacora')) {
      return [
        {
          consigne: "Question 1 — QCM de compréhension",
          question: "Quel est le point culminant du Bénin et dans quelle chaîne de montagnes se trouve-t-il ?",
          type: "qcm",
          options: ["a) Mont Nimba (1752 m)", "b) Mont Sokbaro (658 m) dans l'Atacora", "c) Mont Cameroun (4040 m)", "d) Colline de Dassa (320 m)"],
          correctOption: "b",
          explication: "Le mont Sokbaro culmine à 658 m dans la chaîne de l'Atacora au Nord-Ouest du Bénin."
        },
        {
          consigne: "Question 2 — Vrai ou Faux",
          question: "Le fleuve Ouémé est le plus long cours d'eau entièrement situé sur le territoire béninois.",
          type: "vf",
          options: ["Vrai", "Faux"],
          correctOption: "vrai",
          explication: "VRAI. Le fleuve Ouémé mesure environ 510 km de long et draine le plus grand bassin hydrographique national."
        },
        {
          consigne: "Question 3 — QCM d'approfondissement examen",
          question: "Quel régime climatique caractérise la région Sud du Bénin ?",
          type: "qcm",
          options: ["a) Un climat désertique avec une seule pluie par an", "b) Un climat subéquatorial bimodal à 4 saisons (2 pluvieuses, 2 sèches)", "c) Un climat méditerranéen", "d) Un climat polaire"],
          correctOption: "b",
          explication: "Le Sud béninois connaît un climat subéquatorial avec deux saisons des pluies (avril-juillet et septembre-novembre) et deux saisons sèches."
        }
      ];
    }
    if (normTitle.includes('population') || normTitle.includes('demographie') || normTitle.includes('urbanisation')) {
      return [
        {
          consigne: "Question 1 — QCM de compréhension",
          question: "Quelle caractéristique majeure définit la structure par âge de la population béninoise ?",
          type: "qcm",
          options: ["a) Une population très vieillissante", "b) Une extrême jeunesse (plus de 60% ont moins de 25 ans)", "c) Une majorité absolue de retraités", "d) L'absence totale d'enfants"],
          correctOption: "b",
          explication: "Le Bénin se caractérise par une population extrêmement jeune, représentant un formidable potentiel mais aussi un défi éducatif majeur."
        },
        {
          consigne: "Question 2 — Vrai ou Faux",
          question: "Cotonou est à la fois la capitale politique officielle et le siège du Parlement du Bénin.",
          type: "vf",
          options: ["Vrai", "Faux"],
          correctOption: "faux",
          explication: "FAUX. Porto-Novo est la capitale politique et administrative officielle (siège de l'Assemblée nationale), tandis que Cotonou est la capitale économique."
        },
        {
          consigne: "Question 3 — QCM d'approfondissement examen",
          question: "Quel département béninois enregistre la plus forte densité de population au kilomètre carré ?",
          type: "qcm",
          options: ["a) L'Alibori", "b) Le Littoral (Cotonou)", "c) La Donga", "d) Le Borgou"],
          correctOption: "b",
          explication: "Le département du Littoral (qui correspond à la municipalité de Cotonou) dépasse 8 000 hab/km² en raison de son urbanisation totale."
        }
      ];
    }
    if (normTitle.includes('activites') || normTitle.includes('coton') || normTitle.includes('port')) {
      return [
        {
          consigne: "Question 1 — QCM de compréhension",
          question: "Quelle culture agricole constitue la principale source d'exportation et de devises du Bénin ?",
          type: "qcm",
          options: ["a) Le blé", "b) Le coton (or blanc)", "c) La pomme de terre", "d) Le café"],
          correctOption: "b",
          explication: "Le coton est la première filière agricole d'exportation du Bénin, lui conférant une position de leader parmi les producteurs africains."
        },
        {
          consigne: "Question 2 — Vrai ou Faux",
          question: "Le Port Autonome de Cotonou dessert des pays enclavés voisins comme le Niger, le Burkina Faso et le Mali.",
          type: "vf",
          options: ["Vrai", "Faux"],
          correctOption: "vrai",
          explication: "VRAI. Cotonou est le débouché maritime naturel et stratégique pour les pays de l'hinterland ouest-africain."
        },
        {
          consigne: "Question 3 — QCM d'approfondissement examen",
          question: "Comment appelle-t-on le système traditionnel de parcs piscicoles aménagés dans le lac Nokoué ?",
          type: "qcm",
          options: ["a) Les dragues à filet", "b) Les acadjas", "c) Les casiers métalliques", "d) Les barrages en béton"],
          correctOption: "b",
          explication: "Les acadjas sont des enclos branchus traditionnels développés sur le lac Nokoué et les lagunes pour stimuler la faune aquatique."
        }
      ];
    }
    if (normTitle.includes('defis') || normTitle.includes('integration') || normTitle.includes('sous-regionale') || normTitle.includes('uemoa')) {
      return [
        {
          consigne: "Question 1 — QCM de compréhension",
          question: "À quelle organisation sous-régionale ouest-africaine partageant la monnaie Franc CFA appartient le Bénin ?",
          type: "qcm",
          options: ["a) La CEMAC", "b) L'UEMOA", "c) La SADC", "d) L'Union Européenne"],
          correctOption: "b",
          explication: "Le Bénin est membre de l'UEMOA (Union Économique et Monétaire Ouest-Africaine), dont la monnaie commune est le Franc CFA émis par la BCEAO."
        },
        {
          consigne: "Question 2 — Vrai ou Faux",
          question: "La Zone Industrielle de Glo-Djigbé (GDIZ) vise à exporter des matières premières brutes sans aucune transformation locale.",
          type: "vf",
          options: ["Vrai", "Faux"],
          correctOption: "faux",
          explication: "FAUX. La GDIZ vise précisément la transformation sur place des produits agricoles locaux (coton, soja, cajou) pour créer de la valeur ajoutée."
        },
        {
          consigne: "Question 3 — QCM d'approfondissement examen",
          question: "Quelle organisation sous-régionale de 15 États ouest-africains garantit la libre circulation des personnes et des biens ?",
          type: "qcm",
          options: ["a) La CEDEAO", "b) L'OTAN", "c) Le Commonwealth", "d) Le Mercosur"],
          correctOption: "a",
          explication: "La CEDEAO (Communauté Économique des États de l'Afrique de l'Ouest) favorise l'intégration et la libre circulation au sein de l'espace ouest-africain."
        }
      ];
    }
  }

  // 2. PHYSIQUE-CHIMIE-TECHNOLOGIE (PCT) — BREVET & BAC (TERMINALE CD)
  if (normSubj.includes('physique') || normSubj.includes('pct') || normSubj.includes('technologie')) {
    // === TERMINALE C & D — LES 6 SA OFFICIELLES DU BÉNIN ===
    if (normTitle.includes('cinematique') || normTitle.includes('dynamique') || (normTitle.includes('newton') && normTitle.includes('loi')) || normTitle.includes('frenet') || normTitle.includes('projectile')) {
      return [
        {
          consigne: "Question 1 — QCM de compréhension",
          question: "Dans la base de Frenet (T, N), quelle est l'expression de l'accélération normale a_n pour un mobile de vitesse v sur une trajectoire de rayon de courbure ρ ?",
          type: "qcm",
          options: ["a) a_n = dv/dt", "b) a_n = v² / ρ", "c) a_n = v × ρ", "d) a_n = 0"],
          correctOption: "b",
          explication: "Dans la base de Frenet, le vecteur accélération s'écrit a = (dv/dt) T + (v²/ρ) N. L'accélération normale vaut a_n = v²/ρ et est dirigée vers le centre de courbure."
        },
        {
          consigne: "Question 2 — Vrai ou Faux",
          question: "Selon la 2ème loi de Newton (RFD), l'accélération d'un solide est nulle si la somme vectorielle des forces extérieures qui s'exercent sur lui est nulle.",
          type: "vf",
          options: ["Vrai", "Faux"],
          correctOption: "vrai",
          explication: "VRAI. ∑ F_ext = m a. Si ∑ F_ext = 0, alors a = 0 : le centre d'inertie est soit immobile, soit en mouvement rectiligne uniforme (principe d'inertie)."
        },
        {
          consigne: "Question 3 — QCM d'approfondissement examen",
          question: "Dans le champ de pesanteur uniforme sans frottement, un projectile lancé de l'origine avec une vitesse v₀ sous un angle α a pour équation de trajectoire :",
          type: "qcm",
          options: ["a) y(x) = ax + b (droite)", "b) y(x) = -g/(2 v₀² cos²α) x² + (tan α) x (parabole)", "c) y(x) = R² - x² (cercle)", "d) y(x) = ln(x)"],
          correctOption: "b",
          explication: "En éliminant le temps t entre x(t) = v₀ cos α · t et y(t) = -½gt² + v₀ sin α · t, on obtient l'équation de la trajectoire parabolique caractéristique."
        }
      ];
    }
    if ((normTitle.includes('champ') && (normTitle.includes('e') || normTitle.includes('b'))) || normTitle.includes('lorentz') || normTitle.includes('cyclotron') || normTitle.includes('gravitation') || normTitle.includes('satellite') || normTitle.includes('kepler')) {
      return [
        {
          consigne: "Question 1 — QCM de compréhension",
          question: "Quelle est l'expression de la force magnétique de Lorentz exercée sur une particule de charge q animée d'une vitesse v dans un champ magnétique B ?",
          type: "qcm",
          options: ["a) F_m = q × E", "b) F_m = q (v ∧ B)", "c) F_m = m × g", "d) F_m = q / B"],
          correctOption: "b",
          explication: "La force magnétique de Lorentz est le produit vectoriel F_m = q (v ∧ B). Son intensité vaut F = |q|·v·B·sin(v, B)."
        },
        {
          consigne: "Question 2 — Vrai ou Faux",
          question: "La force magnétique de Lorentz ne travaille jamais car elle est constamment perpendiculaire au vecteur vitesse de la particule chargée.",
          type: "vf",
          options: ["Vrai", "Faux"],
          correctOption: "vrai",
          explication: "VRAI. La puissance instantanée P = F_m · v = q (v ∧ B) · v = 0. L'énergie cinétique de la particule reste constante : la vitesse scalaire ne change pas."
        },
        {
          consigne: "Question 3 — QCM d'approfondissement examen",
          question: "Un électron (charge -e, masse m) pénètre orthogonalement dans un champ B uniforme à la vitesse v. Le rayon R de sa trajectoire circulaire vaut :",
          type: "qcm",
          options: ["a) R = eB / (mv)", "b) R = mv / (eB)", "c) R = mv² / e", "d) R = e / (mB)"],
          correctOption: "b",
          explication: "En appliquant la RFD en base de Frenet : e·v·B = m·v²/R d'où le rayon R = mv / (eB). C'est le principe du spectromètre de masse."
        }
      ];
    }
    if (normTitle.includes('cinetique chimique') || (normTitle.includes('vitesse') && normTitle.includes('reaction')) || normTitle.includes('demi-reaction')) {
      return [
        {
          consigne: "Question 1 — QCM de compréhension",
          question: "Comment est définie la vitesse volumique v d'une réaction chimique dans un réacteur de volume V constant pour un avancement x ?",
          type: "qcm",
          options: ["a) v = (1/V) × (dx/dt)", "b) v = V × (dx/dt)", "c) v = dx / dt", "d) v = x / (V × t)"],
          correctOption: "a",
          explication: "La vitesse volumique de réaction est la dérivée première de l'avancement par rapport au temps divisée par le volume : v = (1/V)(dx/dt) en mol·L⁻¹·s⁻¹."
        },
        {
          consigne: "Question 2 — Vrai ou Faux",
          question: "Une augmentation de la température du milieu réactionnel accélère la transformation chimique en augmentant la fréquence des chocs efficaces.",
          type: "vf",
          options: ["Vrai", "Faux"],
          correctOption: "vrai",
          explication: "VRAI. La température est un facteur cinétique majeur : selon la loi d'Arrhenius, une hausse de température accroît l'énergie cinétique moléculaire et la vitesse de réaction."
        },
        {
          consigne: "Question 3 — QCM d'approfondissement examen",
          question: "Le temps de demi-réaction t_{1/2} correspond à la durée au bout de laquelle :",
          type: "qcm",
          options: ["a) La totalité des réactifs a disparu", "b) L'avancement x atteint la moitié de sa valeur finale (x = x_f / 2)", "c) La température du milieu a diminué de moitié", "d) Le pH devient neutre"],
          correctOption: "b",
          explication: "Par définition, à t = t_{1/2}, l'avancement chimique x(t_{1/2}) = x_f / 2 (la moitié de l'avancement final)."
        }
      ];
    }
    if (normTitle.includes('equilibre acido-basique') || normTitle.includes('ph-metrie') || normTitle.includes('tampon') || normTitle.includes('titrage')) {
      return [
        {
          consigne: "Question 1 — QCM de compréhension",
          question: "Quelle relation de Henderson-Hasselbalch relie le pH au pKa pour un couple acide faible/base faible (AH/A⁻) ?",
          type: "qcm",
          options: ["a) pH = pKa - log([A⁻]/[AH])", "b) pH = pKa + log([A⁻]/[AH])", "c) pH = pKa × [A⁻]", "d) pH = [AH] / [A⁻]"],
          correctOption: "b",
          explication: "pH = pKa + log([Base conjuguée] / [Acide]). Lorsque [Base] = [Acide], pH = pKa (point de demi-équivalence)."
        },
        {
          consigne: "Question 2 — Vrai ou Faux",
          question: "Lors du dosage d'un acide faible par une base forte, le pH à l'équivalence est strictement supérieur à 7.",
          type: "vf",
          options: ["Vrai", "Faux"],
          correctOption: "vrai",
          explication: "VRAI. À l'équivalence, tout l'acide faible AH a été transformé en sa base conjuguée A⁻, ce qui donne une solution basique de pH_E > 7."
        },
        {
          consigne: "Question 3 — QCM d'approfondissement examen",
          question: "Une solution tampon est une solution dont le pH varie très peu lors :",
          type: "qcm",
          options: ["a) D'une ébullition prolongée", "b) D'une addition modérée d'acide, de base forte ou d'une dilution modérée", "c) D'une exposition au soleil", "d) D'un changement de récipient"],
          correctOption: "b",
          explication: "Une solution tampon résiste aux variations de pH lors d'un apport modéré d'acide fort ou de base forte, ou lors d'une dilution modérée."
        }
      ];
    }
    if (normTitle.includes('oscillant') || (normTitle.includes('oscillation') && normTitle.includes('mecanique')) || normTitle.includes('pendule elastique')) {
      return [
        {
          consigne: "Question 1 — QCM de compréhension",
          question: "Quelle est l'expression de la période propre T₀ d'un pendule élastique constitué d'un solide de masse m fixé à un ressort de constante de raideur k ?",
          type: "qcm",
          options: ["a) T₀ = 2π √(k/m)", "b) T₀ = 2π √(m/k)", "c) T₀ = 2π √(g/l)", "d) T₀ = m / k"],
          correctOption: "b",
          explication: "L'équation différentielle x'' + (k/m)x = 0 donne une pulsation ω₀ = √(k/m), d'où la période propre T₀ = 2π/ω₀ = 2π √(m/k)."
        },
        {
          consigne: "Question 2 — Vrai ou Faux",
          question: "À la résonance mécanique, l'amplitude des oscillations du résonateur est maximale lorsque la fréquence de l'excitateur est proche de sa fréquence propre.",
          type: "vf",
          options: ["Vrai", "Faux"],
          correctOption: "vrai",
          explication: "VRAI. Le phénomène de résonance correspond au transfert optimal d'énergie de l'excitateur vers l'oscillateur, maximisant l'amplitude."
        },
        {
          consigne: "Question 3 — QCM d'approfondissement examen",
          question: "Pour un oscillateur harmonique sans frottement, que vaut l'énergie mécanique totale E_m en fonction de l'amplitude maximale X_m ?",
          type: "qcm",
          options: ["a) E_m = ½ m X_m", "b) E_m = ½ k X_m²", "c) E_m = k / X_m", "d) E_m = 0"],
          correctOption: "b",
          explication: "Aux élongations extrêmes x = ±X_m, la vitesse est nulle donc E_c = 0 et toute l'énergie est potentielle : E_m = E_pe = ½ k X_m² = constante."
        }
      ];
    }
    if (normTitle.includes('rlc') || (normTitle.includes('oscillation') && normTitle.includes('electrique')) || normTitle.includes('auto-induction')) {
      return [
        {
          consigne: "Question 1 — QCM de compréhension",
          question: "Quelle est l'expression de l'impédance Z d'un circuit RLC série alimenté par une tension sinusoïdale de pulsation ω ?",
          type: "qcm",
          options: ["a) Z = R + Lω + 1/(Cω)", "b) Z = √(R² + (Lω - 1/(Cω))²)", "c) Z = R / (Lω)", "d) Z = √(L/C)"],
          correctOption: "b",
          explication: "Par la construction de Fresnel ou les nombres complexes, l'impédance du dipôle RLC série est Z = √(R² + (Lω - 1/(Cω))²)."
        },
        {
          consigne: "Question 2 — Vrai ou Faux",
          question: "À la résonance d'intensité d'un circuit RLC série, l'impédance est minimale et égale à la résistance R (Z = R).",
          type: "vf",
          options: ["Vrai", "Faux"],
          correctOption: "vrai",
          explication: "VRAI. À la résonance, Lω = 1/(Cω), le terme réactif s'annule, l'impédance Z = R est minimale et l'intensité efficace I_eff = U_eff / R est maximale."
        },
        {
          consigne: "Question 3 — QCM d'approfondissement examen",
          question: "La f.é.m d'auto-induction e qui apparaît dans une bobine d'inductance L traversée par un courant i(t) variable est donnée par :",
          type: "qcm",
          options: ["a) e = L × i", "b) e = -L (di/dt)", "c) e = L / (di/dt)", "d) e = -R × i"],
          correctOption: "b",
          explication: "Selon la loi de Faraday-Lenz, l'auto-induction s'oppose à la variation du courant : e = -dΦ/dt = -L(di/dt)."
        }
      ];
    }
    if (normTitle.includes('fonctions organiques') || normTitle.includes('carbonyles') || (normTitle.includes('acide') && normTitle.includes('carboxyli'))) {
      return [
        {
          consigne: "Question 1 — QCM de compréhension",
          question: "Quel test caractéristique permet de distinguer spécifiquement un aldéhyde d'une cétone ?",
          type: "qcm",
          options: ["a) Le test à la 2,4-DNPH (précipité jaune)", "b) Le test à la liqueur de Fehling (précipité rouge brique)", "c) Le test au papier tournesol", "d) L'évaporation sous vide"],
          correctOption: "b",
          explication: "La liqueur de Fehling est réduite à chaud par les aldéhydes (qui sont réducteurs) formant un précipité rouge brique de Cu₂O. Les cétones ne réagissent pas."
        },
        {
          consigne: "Question 2 — Vrai ou Faux",
          question: "L'oxydation ménagée d'un alcool primaire par un oxydant en excès conduit directement à un acide carboxylique.",
          type: "vf",
          options: ["Vrai", "Faux"],
          correctOption: "vrai",
          explication: "VRAI. L'alcool primaire R-CH₂OH s'oxyde d'abord en aldéhyde R-CHO, qui s'oxyde immédiatement en acide carboxylique R-COOH si l'oxydant est en excès."
        },
        {
          consigne: "Question 3 — QCM d'approfondissement examen",
          question: "Quelle est la formule générale d'un chlorure d'acyle (dérivé réactif d'acide carboxylique) ?",
          type: "qcm",
          options: ["a) R-CH₂-Cl", "b) R-CO-Cl", "c) R-O-Cl", "d) R-COO-R'"],
          correctOption: "b",
          explication: "Un chlorure d'acyle a pour groupement fonctionnel -COCl lié à un radical carboné R."
        }
      ];
    }
    if (normTitle.includes('esterification') || normTitle.includes('saponification') || normTitle.includes('polymere') || normTitle.includes('azotes')) {
      return [
        {
          consigne: "Question 1 — QCM de compréhension",
          question: "Quelles sont les caractéristiques thermodynamiques et cinétiques de la réaction d'estérification directe entre un acide carboxylique et un alcool ?",
          type: "qcm",
          options: ["a) Rapide, totale et très exothermique", "b) Lente, réversible (équilibrée) et athermique", "c) Instantanée et athermique", "d) Impossible en milieu acide"],
          correctOption: "b",
          explication: "L'estérification directe est lente, limitée par l'hydrolyse d'ester (rendement ≈ 67% pour un alcool primaire) et athermique (ΔH ≈ 0)."
        },
        {
          consigne: "Question 2 — Vrai ou Faux",
          question: "La saponification d'un corps gras par une base forte (NaOH) est une réaction totale et rapide produisant du savon et du glycérol.",
          type: "vf",
          options: ["Vrai", "Faux"],
          correctOption: "vrai",
          explication: "VRAI. Contrairement à l'hydrolyse acide, l'hydrolyse basique (saponification) est irréversible (totale) car l'ion carboxylate formé ne réagit pas avec l'alcool."
        },
        {
          consigne: "Question 3 — QCM d'approfondissement examen",
          question: "Quelle liaison covalente se forme lors de la condensation du groupement amine (-NH₂) d'un acide aminé avec le carboxyle (-COOH) d'un autre ?",
          type: "qcm",
          options: ["a) Une liaison ester (-COO-)", "b) Une liaison peptidique (-CO-NH-)", "c) Une liaison hydrogène", "d) Une liaison éther (-O-)"],
          correctOption: "b",
          explication: "La condensation entre deux acides alpha-aminés crée une liaison amide appelée liaison peptidique (-CO-NH-) avec élimination d'une molécule d'eau."
        }
      ];
    }
    if ((normTitle.includes('onde') && normTitle.includes('mecanique')) || (normTitle.includes('diffraction') && !normTitle.includes('optique'))) {
      return [
        {
          consigne: "Question 1 — QCM de compréhension",
          question: "Quelle relation fondamentale relie la célérité v, la longueur d'onde spatiale λ et la fréquence temporelle f d'une onde progressive ?",
          type: "qcm",
          options: ["a) v = λ × f = λ / T", "b) v = λ / f", "c) v = f / λ", "d) v = λ² × f"],
          correctOption: "a",
          explication: "La longueur d'onde est la distance parcourue pendant une période T : λ = v × T, d'où la formule fondamentale v = λ × f."
        },
        {
          consigne: "Question 2 — Vrai ou Faux",
          question: "Lorsqu'une onde mécanique subit le phénomène de diffraction à travers une petite ouverture, sa fréquence et sa célérité restent rigoureusement inchangées.",
          type: "vf",
          options: ["Vrai", "Faux"],
          correctOption: "vrai",
          explication: "VRAI. La diffraction modifie uniquement la direction de propagation et la forme géométrique des fronts d'ondes, sans altérer la fréquence ni la vitesse."
        },
        {
          consigne: "Question 3 — QCM d'approfondissement examen",
          question: "Dans une cuve à ondes, quel est l'ordre de grandeur de la largeur de la fente a pour observer une diffraction très nette d'ondes de longueur λ ?",
          type: "qcm",
          options: ["a) a >> 1 000 λ", "b) a de l'ordre de λ ou inférieure à λ (a ≤ λ)", "c) a = 100 m", "d) a = 0 (fente fermée)"],
          correctOption: "b",
          explication: "La diffraction est d'autant plus marquée que la dimension a de l'obstacle ou de la fente est voisine ou inférieure à la longueur d'onde λ de l'onde incidente."
        }
      ];
    }
    if (normTitle.includes('interferences lumineuses') || (normTitle.includes('optique') && normTitle.includes('ondulatoire')) || normTitle.includes('fentes d\'young')) {
      return [
        {
          consigne: "Question 1 — QCM de compréhension",
          question: "Dans l'expérience des fentes d'Young (sources distantes de a, écran à distance D), quelle est l'expression de l'interfrange i pour une lumière de longueur d'onde λ ?",
          type: "qcm",
          options: ["a) i = (λ × D) / a", "b) i = (a × D) / λ", "c) i = (λ × a) / D", "d) i = λ × a × D"],
          correctOption: "a",
          explication: "L'interfrange (distance entre deux franges brillantes consécutives) est donné par la formule officielle : i = (λ × D) / a."
        },
        {
          consigne: "Question 2 — Vrai ou Faux",
          question: "Pour obtenir des interférences lumineuses stables et observables, les deux sources secondaires doivent être cohérentes (même fréquence et déphasage constant).",
          type: "vf",
          options: ["Vrai", "Faux"],
          correctOption: "vrai",
          explication: "VRAI. Deux sources indépendantes ne peuvent pas interférer de manière stable car leurs trains d'ondes ont des phases aléatoires ; il faut diviser une même onde source."
        },
        {
          consigne: "Question 3 — QCM d'approfondissement examen",
          question: "Sur l'écran, une frange brillante d'interférence constructive apparaît en tout point où la différence de marche δ = S₂M - S₁M vaut :",
          type: "qcm",
          options: ["a) δ = (k + ½) λ", "b) δ = k × λ (avec k ∈ Z)", "c) δ = λ / 4", "d) δ = 2k + 1"],
          correctOption: "b",
          explication: "Les ondes arrivent en phase et s'additionnent constructivement si la différence de marche est un multiple entier de la longueur d'onde : δ = k·λ."
        }
      ];
    }
    if ((normTitle.includes('noyau') && normTitle.includes('atomique')) || (normTitle.includes('radioactivite') && !normTitle.includes('niveau')) || normTitle.includes('reactions nucleaires')) {
      return [
        {
          consigne: "Question 1 — QCM de compréhension",
          question: "Quelle est la particule émise lors d'une désintégration radioactive de type alpha (α) ?",
          type: "qcm",
          options: ["a) Un électron", "b) Un noyau d'hélium ⁴₂He", "c) Un photon γ", "d) Un neutron libre"],
          correctOption: "b",
          explication: "Le rayonnement alpha (α) est constitué de noyaux d'hélium 4 (deux protons et deux neutrons : ⁴₂He²⁺)."
        },
        {
          consigne: "Question 2 — Vrai ou Faux",
          question: "La constante radioactive λ et la demi-vie t_{1/2} d'un radioélément sont liées par la relation t_{1/2} = (ln 2) / λ.",
          type: "vf",
          options: ["Vrai", "Faux"],
          correctOption: "vrai",
          explication: "VRAI. À t = t_{1/2}, N(t_{1/2}) = N₀ / 2 = N₀ e^{-λ t_{1/2}}, d'où ln(1/2) = -λ t_{1/2}, soit t_{1/2} = (ln 2) / λ ≈ 0,693 / λ."
        },
        {
          consigne: "Question 3 — QCM d'approfondissement examen",
          question: "La fission nucléaire induite de l'uranium 235 consiste en :",
          type: "qcm",
          options: ["a) La fusion de deux noyaux légers en un noyau lourd", "b) L'éclatement d'un noyau lourd sous l'impact d'un neutron en deux noyaux plus légers avec libération d'énergie", "c) La simple perte d'un électron périphérique", "d) Une réaction chimique avec l'oxygène"],
          correctOption: "b",
          explication: "La fission est la scission d'un noyau fissile lourd (comme ²³⁵U) sous l'impact d'un neutron lent en deux fragments plus légers et d'autres neutrons, libérant une grande quantité d'énergie."
        }
      ];
    }
    if (normTitle.includes('niveaux d\'energie') || normTitle.includes('bohr') || normTitle.includes('photoelectrique') || normTitle.includes('spectre')) {
      return [
        {
          consigne: "Question 1 — QCM de compréhension",
          question: "Selon la relation de Planck-Einstein, quelle est l'énergie E transportée par un photon de fréquence ν et de longueur d'onde λ dans le vide ?",
          type: "qcm",
          options: ["a) E = h × ν = (h × c) / λ", "b) E = h / ν", "c) E = m × c", "d) E = h × λ / c"],
          correctOption: "a",
          explication: "L'énergie d'un quantum de lumière (photon) est proportionnelle à sa fréquence : E = h·ν = hc/λ, avec h la constante de Planck (6,626×10⁻³⁴ J·s)."
        },
        {
          consigne: "Question 2 — Vrai ou Faux",
          question: "L'effet photoélectrique ne se produit que si la fréquence ν de la lumière incidente est supérieure ou égale à la fréquence seuil ν₀ propre au métal éclairé.",
          type: "vf",
          options: ["Vrai", "Faux"],
          correctOption: "vrai",
          explication: "VRAI. L'énergie du photon incident hν doit être suffisante pour arracher l'électron : hν ≥ W₀ = hν₀. Si ν < ν₀, aucun électron n'est émis quelle que soit l'intensité lumineuse."
        },
        {
          consigne: "Question 3 — QCM d'approfondissement examen",
          question: "Pour l'atome d'hydrogène dont les niveaux d'énergie sont E_n = -13,6 / n² (en eV), que vaut l'énergie minimale d'ionisation depuis l'état fondamental (n=1) ?",
          type: "qcm",
          options: ["a) 0 eV", "b) 13,6 eV", "c) 3,4 eV", "d) 1,51 eV"],
          correctOption: "b",
          explication: "L'énergie d'ionisation est E_ion = E_∞ - E₁ = 0 - (-13,6 eV) = +13,6 eV. C'est l'énergie nécessaire pour arracher l'électron de son état fondamental."
        }
      ];
    }
    if (normTitle.includes('synthese') && (normTitle.includes('spct') || normTitle.includes('cd') || normTitle.includes('physique'))) {
      return [
        {
          consigne: "Question 1 — QCM de compréhension",
          question: "Combien de Situations d'Apprentissage (SA) officielles structurent le programme de SPCT en Terminale C et D au Bénin ?",
          type: "qcm",
          options: ["a) 3 SA", "b) 4 SA", "c) 6 SA (de la SA 1 à la SA 6)", "d) 8 SA"],
          correctOption: "c",
          explication: "Le programme officiel de SPCT (Sciences Physiques, Chimiques et Technologie) en Terminale C et D au Bénin est rigoureusement structuré en 6 SA (Champs, Solutions, Oscillations, Organique, Ondes, Nucléaire)."
        },
        {
          consigne: "Question 2 — Vrai ou Faux",
          question: "Les lois de Soddy imposent la conservation de la charge électrique totale Z et du nombre total de nucléons A dans toute réaction nucléaire.",
          type: "vf",
          options: ["Vrai", "Faux"],
          correctOption: "vrai",
          explication: "VRAI. Dans toute transformation nucléaire, ∑ A_réactifs = ∑ A_produits et ∑ Z_réactifs = ∑ Z_produits (lois fondamentales de conservation de Soddy)."
        },
        {
          consigne: "Question 3 — QCM d'approfondissement examen",
          question: "Quelle démarche méthodologique assure la note maximale à l'épreuve de SPCT au Baccalauréat béninois ?",
          type: "qcm",
          options: ["a) Donner les résultats numériques sans calculs intermédiaires", "b) Énoncer le principe théorique, poser l'expression littérale avant tout calcul et préciser l'unité légale du résultat", "c) Recopier le texte du sujet sans développer", "d) Utiliser des unités arbitraires"],
          correctOption: "b",
          explication: "Les grilles de correction du BAC béninois valorisent l'explicitation du principe physique, la formule littérale complète, l'application numérique avec conversion en unités du Système International et la phrase de conclusion."
        }
      ];
    }

    // === BREVET & PATTERNS GÉNÉRAUX ===
    if (normTitle.includes('alternatif') || normTitle.includes('sinusoidal') || normTitle.includes('oscilloscope')) {
      return [
        {
          consigne: "Question 1 — QCM de compréhension",
          question: "Quelle est la relation entre la tension maximale U_max et la tension efficace U_eff pour une tension sinusoïdale ?",
          type: "qcm",
          options: ["a) U_max = U_eff / 2", "b) U_max = U_eff × √2", "c) U_max = U_eff × 2", "d) U_max = U_eff - 220"],
          correctOption: "b",
          explication: "Pour une tension sinusoïdale, U_max = U_eff × √2 (avec √2 ≈ 1,414). Ex: si U_eff = 220 V, U_max ≈ 311 V."
        },
        {
          consigne: "Question 2 — Vrai ou Faux",
          question: "La fréquence du courant électrique distribué par la SBEE dans les ménages au Bénin est de 50 Hertz.",
          type: "vf",
          options: ["Vrai", "Faux"],
          correctOption: "vrai",
          explication: "VRAI. Le réseau électrique béninois de la SBEE fonctionne à une fréquence normalisée de 50 Hz (50 périodes par seconde)."
        },
        {
          consigne: "Question 3 — QCM d'application examen",
          question: "Si la période d'un signal alternatif est T = 0,02 seconde, que vaut sa fréquence f ?",
          type: "qcm",
          options: ["a) 20 Hz", "b) 50 Hz", "c) 100 Hz", "d) 5 Hz"],
          correctOption: "b",
          explication: "Formule : f = 1 / T. Donc f = 1 / 0,02 s = 50 Hz."
        }
      ];
    }
    if (normTitle.includes('puissance') || normTitle.includes('energie') || normTitle.includes('joule') || normTitle.includes('securite')) {
      return [
        {
          consigne: "Question 1 — QCM de compréhension",
          question: "Quelle formule donne l'énergie électrique E consommée par un appareil de puissance P pendant un temps t ?",
          type: "qcm",
          options: ["a) E = P / t", "b) E = P × t", "c) E = P + t", "d) E = U / I"],
          correctOption: "b",
          explication: "L'énergie consommée est le produit de la puissance par le temps : E = P × t (en Joules si t en secondes, en kWh si t en heures)."
        },
        {
          consigne: "Question 2 — Vrai ou Faux",
          question: "Un fusible doit toujours être branché en parallèle avec le récepteur qu'il protège.",
          type: "vf",
          options: ["Vrai", "Faux"],
          correctOption: "faux",
          explication: "FAUX. Le coupe-circuit à fusible est obligatoirement branché en SÉRIE sur le fil de phase pour interrompre le courant en cas de surcharge."
        },
        {
          consigne: "Question 3 — QCM d'application examen",
          question: "Un fer à repasser de 1 000 W fonctionne pendant 3 heures. Quelle énergie en kilowattheures (kWh) a-t-il consommée ?",
          type: "qcm",
          options: ["a) 300 kWh", "b) 3 kWh", "c) 0,33 kWh", "d) 3 000 kWh"],
          correctOption: "b",
          explication: "P = 1 000 W = 1 kW. E = 1 kW × 3 h = 3 kWh."
        }
      ];
    }
    if (normTitle.includes('propagation') || normTitle.includes('reflexion') || normTitle.includes('miroir')) {
      return [
        {
          consigne: "Question 1 — QCM de compréhension",
          question: "Selon la loi de Snell-Descartes pour la réflexion sur un miroir plan, l'angle de réflexion r est égal à :",
          type: "qcm",
          options: ["a) La moitié de l'angle d'incidence", "b) L'angle d'incidence i (i = r)", "c) 90 degrés", "d) Le double de l'angle d'incidence"],
          correctOption: "b",
          explication: "La deuxième loi de Descartes pour la réflexion énonce que l'angle d'incidence i est égal à l'angle de réflexion r (i = r)."
        },
        {
          consigne: "Question 2 — Vrai ou Faux",
          question: "Dans un milieu transparent et homogène, la lumière se propage toujours en ligne droite.",
          type: "vf",
          options: ["Vrai", "Faux"],
          correctOption: "vrai",
          explication: "VRAI. C'est le principe fondamental de propagation rectiligne de la lumière."
        },
        {
          consigne: "Question 3 — QCM d'application examen",
          question: "L'image d'un objet donnée par un miroir plan est :",
          type: "qcm",
          options: ["a) Réelle et inversée", "b) Virtuelle et symétrique de l'objet", "c) Plus petite et floue", "d) Située sur la surface du miroir"],
          correctOption: "b",
          explication: "Un miroir plan donne d'un objet réel une image virtuelle de même taille, symétrique par rapport au plan du miroir."
        }
      ];
    }
    if (normTitle.includes('lentille') || normTitle.includes('vergence') || normTitle.includes('optique') || normTitle.includes('refraction')) {
      return [
        {
          consigne: "Question 1 — QCM de compréhension",
          question: "Comment s'appelle l'inverse de la distance focale exprimée en mètres (C = 1/f') ?",
          type: "qcm",
          options: ["a) L'indice de réfraction", "b) La vergence (en dioptries)", "c) Le grossissement", "d) La vitesse de la lumière"],
          correctOption: "b",
          explication: "La vergence C = 1/f' mesure la capacité d'une lentille à faire converger les rayons lumineux et s'exprime en dioptries (δ)."
        },
        {
          consigne: "Question 2 — Vrai ou Faux",
          question: "Tout rayon lumineux passant par le centre optique O d'une lentille mince traverse la lentille sans être dévié.",
          type: "vf",
          options: ["Vrai", "Faux"],
          correctOption: "vrai",
          explication: "VRAI. Le centre optique O est un point particulier : tout rayon passant par O poursuit sa trajectoire rectiligne sans déviation."
        },
        {
          consigne: "Question 3 — QCM d'application examen",
          question: "Une lentille convergente a une distance focale f' = 20 cm (soit 0,2 m). Quelle est sa vergence C ?",
          type: "qcm",
          options: ["a) 2 dioptries", "b) 5 dioptries", "c) 20 dioptries", "d) 0,05 dioptries"],
          correctOption: "b",
          explication: "C = 1 / f' = 1 / 0,2 m = 5 dioptries (δ)."
        }
      ];
    }
    if (normTitle.includes('poids') || normTitle.includes('masse') || normTitle.includes('equilibre') || normTitle.includes('force')) {
      return [
        {
          consigne: "Question 1 — QCM de compréhension",
          question: "Quelle est la relation physique liant le poids P d'un objet à sa masse m ?",
          type: "qcm",
          options: ["a) P = m / g", "b) P = m × g", "c) P = g / m", "d) P = m + g"],
          correctOption: "b",
          explication: "Le poids est le produit de la masse par l'intensité de la pesanteur : P = m × g (avec P en Newtons N, m en kg et g en N/kg)."
        },
        {
          consigne: "Question 2 — Vrai ou Faux",
          question: "La masse d'un cosmonaute change lorsqu'il voyage de la Terre à la Lune.",
          type: "vf",
          options: ["Vrai", "Faux"],
          correctOption: "faux",
          explication: "FAUX. La masse (quantité de matière en kg) est invariable partout. C'est son poids P qui diminue sur la Lune car g y est 6 fois plus faible."
        },
        {
          consigne: "Question 3 — QCM d'application examen",
          question: "Au Bénin où g = 10 N/kg, quel est le poids d'un sac d'ignames de masse m = 25 kg ?",
          type: "qcm",
          options: ["a) 2,5 N", "b) 250 N", "c) 25 N", "d) 2 500 N"],
          correctOption: "b",
          explication: "P = m × g = 25 kg × 10 N/kg = 250 N."
        }
      ];
    }
    if (normTitle.includes('atome') || normTitle.includes('ion') || normTitle.includes('solution')) {
      return [
        {
          consigne: "Question 1 — QCM de compréhension",
          question: "Un ion positif (cation) provient d'un atome neutre qui a :",
          type: "qcm",
          options: ["a) Gagné un ou plusieurs électrons", "b) Perdu un ou plusieurs électrons", "c) Perdu des protons", "d) Reçu des neutrons"],
          correctOption: "b",
          explication: "L'atome perdant des électrons (chargés négativement) se retrouve avec un excès de charges positives du noyau : il devient un cation (ex: Na⁺, Cu²⁺)."
        },
        {
          consigne: "Question 2 — Vrai ou Faux",
          question: "Dans les solutions aqueuses salines, le passage du courant est assuré par le déplacement d'électrons libres.",
          type: "vf",
          options: ["Vrai", "Faux"],
          correctOption: "faux",
          explication: "FAUX. Dans les solutions électrolytiques, ce sont les IONS (cations et anions) qui transportent le courant, et non les électrons libres."
        },
        {
          consigne: "Question 3 — QCM d'application examen",
          question: "L'ion sulfate a pour formule chimique SO₄²⁻. Cet ion est un :",
          type: "qcm",
          options: ["a) Cation monoatomique", "b) Anion polyatomique", "c) Cation polyatomique", "d) Atome neutre"],
          correctOption: "b",
          explication: "SO₄²⁻ porte une charge négative (-2) et contient plusieurs atomes (soufre et oxygène) : c'est un anion polyatomique."
        }
      ];
    }
    if (normTitle.includes('electrolyse') || normTitle.includes('eau')) {
      return [
        {
          consigne: "Question 1 — QCM de compréhension",
          question: "Lors de l'électrolyse de l'eau acidifiée, quel gaz inflammable se dégage à la cathode (électrode négative) ?",
          type: "qcm",
          options: ["a) Le dioxyde de carbone CO₂", "b) Le dihydrogène H₂", "c) Le dichlore Cl₂", "d) L'azote N₂"],
          correctOption: "b",
          explication: "Le dihydrogène H₂ se dégage à la cathode (-) et produit une petite détonation caractéristique en présence d'une flamme."
        },
        {
          consigne: "Question 2 — Vrai ou Faux",
          question: "Le volume de dihydrogène produit est exactement le double du volume de dioxygène recueilli.",
          type: "vf",
          options: ["Vrai", "Faux"],
          correctOption: "vrai",
          explication: "VRAI. L'équation 2 H₂O → 2 H₂ + O₂ montre que l'électrolyse produit 2 volumes de H₂ pour 1 volume de O₂."
        },
        {
          consigne: "Question 3 — QCM d'application examen",
          question: "Comment identifie-t-on le dioxygène O₂ recueilli à l'anode lors de l'électrolyse ?",
          type: "qcm",
          options: ["a) Il trouble l'eau de chaux", "b) Il rallume vivement une bûchette incandescente", "c) Il détonne avec un 'pop'", "d) Il a une couleur verte"],
          correctOption: "b",
          explication: "Le dioxygène entretient la combustion : une braise ou bûchette d'allumette incandescente se rallume instantanément en sa présence."
        }
      ];
    }
    if (normTitle.includes('acide') || normTitle.includes('base') || normTitle.includes('ph')) {
      return [
        {
          consigne: "Question 1 — QCM de compréhension",
          question: "À 25°C, une solution aqueuse est qualifiée d'acide si son pH est :",
          type: "qcm",
          options: ["a) Strictement supérieur à 7", "b) Strictement inférieur à 7", "c) Égal à 14", "d) Égal à 7"],
          correctOption: "b",
          explication: "Sur l'échelle de 0 à 14, un pH inférieur à 7 indique un milieu acide (riche en ions hydrogène H⁺)."
        },
        {
          consigne: "Question 2 — Vrai ou Faux",
          question: "L'attaque du fer par l'acide chlorhydrique produit un dégagement gazeux de dioxygène O₂.",
          type: "vf",
          options: ["Vrai", "Faux"],
          correctOption: "faux",
          explication: "FAUX. La réaction Fe + 2 H⁺ → Fe²⁺ + H₂ produit du DIHYDROGÈNE H₂ (gaz détonant) et non du dioxygène."
        },
        {
          consigne: "Question 3 — QCM d'application examen",
          question: "Quel test met en évidence la présence des ions fer II (Fe²⁺) dans une solution issue de l'attaque acide ?",
          type: "qcm",
          options: ["a) Un précipité vert avec l'hydroxyde de sodium (soude)", "b) Un précipité rouille avec le nitrate d'argent", "c) Une décoloration complète de l'eau", "d) Un précipité blanc qui noircit à la lumière"],
          correctOption: "a",
          explication: "Les ions Fe²⁺ réagissent avec les ions OH⁻ de la soude pour former un précipité vert caractéristique d'hydroxyde de fer II Fe(OH)₂."
        }
      ];
    }
    if (normTitle.includes('pression') || normTitle.includes('fluide') || normTitle.includes('archimede') || normTitle.includes('hydrostatique')) {
      return [
        {
          consigne: "Question 1 — QCM de compréhension",
          question: "Quelle est la valeur approximative de la pression atmosphérique normale au niveau de la mer ?",
          type: "qcm",
          options: ["a) 101 325 Pa (≈ 1 013 hPa)", "b) 0 Pa (le vide)", "c) 1 000 000 Pa", "d) 9,8 Pa"],
          correctOption: "a",
          explication: "La pression atmosphérique standard au niveau de la mer est P₀ = 101 325 Pa ≈ 1 013 hPa, mesurée par le baromètre à mercure (colonne de 76 cm de Hg)."
        },
        {
          consigne: "Question 2 — Vrai ou Faux",
          question: "La poussée d'Archimède est dirigée vers le bas, dans le sens du poids du fluide déplacé.",
          type: "vf",
          options: ["Vrai", "Faux"],
          correctOption: "faux",
          explication: "FAUX. La poussée d'Archimède est une force verticale dirigée vers le HAUT, opposée au poids. F_A = ρ_fluide × g × V_immergé en Newtons."
        },
        {
          consigne: "Question 3 — QCM d'application examen",
          question: "Un objet de masse m = 2 kg flotte à la surface de l'eau. Quelle affirmation est correcte ?",
          type: "qcm",
          options: ["a) La poussée d'Archimède est supérieure au poids", "b) La poussée d'Archimède est égale au poids de l'objet", "c) La poussée d'Archimède est nulle", "d) L'objet coule car sa masse est trop grande"],
          correctOption: "b",
          explication: "Condition de flottaison : l'objet flotte quand F_A = P (poussée d'Archimède = poids de l'objet). Les deux forces s'équilibrent."
        }
      ];
    }
    if (normTitle.includes('energie mecanique') || normTitle.includes('chaleur') || normTitle.includes('thermodynamique') || normTitle.includes('cinetique')) {
      return [
        {
          consigne: "Question 1 — QCM de compréhension",
          question: "Quelle formule exprime l'énergie cinétique E_c d'un objet de masse m se déplaçant à la vitesse v ?",
          type: "qcm",
          options: ["a) E_c = m × g × h", "b) E_c = ½ × m × v²", "c) E_c = m × v", "d) E_c = P × t"],
          correctOption: "b",
          explication: "L'énergie cinétique est E_c = ½mv² (en Joules). Elle dépend de la masse m en kg et du carré de la vitesse v en m/s."
        },
        {
          consigne: "Question 2 — Vrai ou Faux",
          question: "En l'absence de frottements, l'énergie mécanique totale d'un système se conserve.",
          type: "vf",
          options: ["Vrai", "Faux"],
          correctOption: "vrai",
          explication: "VRAI. Sans frottements ni forces dissipatives, E_mec = E_c + E_pp = constante (principe de conservation de l'énergie mécanique)."
        },
        {
          consigne: "Question 3 — QCM d'application examen",
          question: "Un transfert thermique par contact entre deux solides sans déplacement de matière est appelé :",
          type: "qcm",
          options: ["a) La convection", "b) Le rayonnement thermique", "c) La conduction thermique", "d) L'évaporation"],
          correctOption: "c",
          explication: "La conduction est le mode de transfert thermique par contact direct dans les solides (ex: manche d'une casserole qui chauffe). La convection est dans les fluides, le rayonnement se fait à distance."
        }
      ];
    }
    if (normTitle.includes('organique') || normTitle.includes('savon') || normTitle.includes('plastique') || normTitle.includes('materiau') || normTitle.includes('alcool') || normTitle.includes('hydrocarbure')) {
      return [
        {
          consigne: "Question 1 — QCM de compréhension",
          question: "Quelle est la formule moléculaire générale des alcanes (hydrocarbures saturés) ?",
          type: "qcm",
          options: ["a) C_nH_{2n}", "b) C_nH_{2n+2}", "c) C_nH_n", "d) C_nO_n"],
          correctOption: "b",
          explication: "Les alcanes ont la formule générale C_nH_{2n+2}. Exemples : méthane CH₄ (n=1), éthane C₂H₆ (n=2), propane C₃H₈ (n=3)."
        },
        {
          consigne: "Question 2 — Vrai ou Faux",
          question: "La saponification est la réaction d'un corps gras avec une base (soude NaOH) pour former du savon et du glycérol.",
          type: "vf",
          options: ["Vrai", "Faux"],
          correctOption: "vrai",
          explication: "VRAI. La saponification (hydrolyse basique des esters d'acides gras) produit un sel d'acide gras (le savon) et du glycérol. C'est le principe de la fabrication artisanale du savon."
        },
        {
          consigne: "Question 3 — QCM d'application examen",
          question: "Les sachets plastiques couramment utilisés au Bénin sont principalement fabriqués à partir de quel polymère ?",
          type: "qcm",
          options: ["a) Le bois compressé", "b) Le polyéthylène", "c) Le verre recyclé", "d) La cellulose végétale"],
          correctOption: "b",
          explication: "La majorité des sachets plastiques sont en polyéthylène (PE), un polymère synthétique issu du pétrole, très résistant mais très difficile à biodégrader."
        }
      ];
    }
    if (normTitle.includes('energetique') || normTitle.includes('renouvelable') || normTitle.includes('solaire') || normTitle.includes('ressource') || normTitle.includes('conducteur') || normTitle.includes('magnetique')) {
      return [
        {
          consigne: "Question 1 — QCM de compréhension",
          question: "Quelle source d'énergie est classée comme énergie renouvelable ?",
          type: "qcm",
          options: ["a) Le charbon de bois fossile", "b) Le pétrole brut", "c) L'énergie solaire photovoltaïque", "d) Le gaz naturel extrait"],
          correctOption: "c",
          explication: "L'énergie solaire photovoltaïque est renouvelable car elle est inépuisable à l'échelle humaine. Elle est très développée en zones rurales béninoises pour l'électrification décentralisée."
        },
        {
          consigne: "Question 2 — Vrai ou Faux",
          question: "Les métaux comme le cuivre et l'aluminium sont de bons conducteurs électriques.",
          type: "vf",
          options: ["Vrai", "Faux"],
          correctOption: "vrai",
          explication: "VRAI. Le cuivre et l'aluminium possèdent de nombreux électrons libres permettant le transport aisé du courant électrique. Ils sont utilisés dans les câbles et circuits."
        },
        {
          consigne: "Question 3 — QCM d'application examen",
          question: "Le barrage de Nangbéto sur le fleuve Mono produit de l'électricité grâce à :",
          type: "qcm",
          options: ["a) L'énergie solaire photovoltaïque", "b) L'énergie hydraulique (force de l'eau)", "c) L'énergie nucléaire", "d) La combustion du gaz naturel"],
          correctOption: "b",
          explication: "Nangbéto est une centrale hydroélectrique : la force de l'eau du Mono fait tourner des turbines qui entraînent des générateurs électriques (énergie hydraulique renouvelable)."
        }
      ];
    }
    if (normTitle.includes('technologie') || normTitle.includes('machine') || normTitle.includes('developpement durable') || normTitle.includes('levier') || normTitle.includes('poulie') || normTitle.includes('moteur') || normTitle.includes('numerique')) {
      return [
        {
          consigne: "Question 1 — QCM de compréhension",
          question: "Quel est l'avantage mécanique d'une poulie mobile par rapport à une poulie fixe ?",
          type: "qcm",
          options: ["a) Elle multiplie la vitesse", "b) Elle divise l'effort nécessaire par 2 (on soulève avec la moitié de la force)", "c) Elle augmente la charge soulevée", "d) Elle supprime tous les frottements"],
          correctOption: "b",
          explication: "Une poulie mobile permet de diviser l'effort par 2 : pour soulever une charge P, on exerce une force F = P/2 sur la corde (au prix d'un déplacement double)."
        },
        {
          consigne: "Question 2 — Vrai ou Faux",
          question: "Le développement durable vise à satisfaire les besoins du présent sans compromettre ceux des générations futures.",
          type: "vf",
          options: ["Vrai", "Faux"],
          correctOption: "vrai",
          explication: "VRAI. C'est la définition exacte donnée par la Commission Brundtland (1987). Il repose sur 3 piliers : économique, social et environnemental."
        },
        {
          consigne: "Question 3 — QCM d'approfondissement examen",
          question: "Au Bénin, quel défi environnemental majeur menace le littoral de Cotonou à Grand-Popo ?",
          type: "qcm",
          options: ["a) Les tsunamis volcaniques", "b) La désertification et les dunes de sable", "c) L'érosion côtière accélérée par la montée des eaux", "d) La déforestation des mangroves de l'Atacora"],
          correctOption: "c",
          explication: "L'érosion côtière est un défi majeur au Bénin : la montée du niveau marin liée aux changements climatiques accélère la destruction des plages et des infrastructures du littoral béninois."
        }
      ];
    }
  }

  // 3. SVT BREVET & BAC
  if (normSubj.includes('svt') || normSubj.includes('biologie') || normSubj.includes('géologie')) {
    if (normTitle.includes('nutrition') || normTitle.includes('digestion') || normTitle.includes('aliment')) {
      return [
        {
          consigne: "Question 1 — QCM de compréhension",
          question: "Quel groupe d'aliments simples fournit l'énergie d'utilisation rapide à l'organisme ?",
          type: "qcm",
          options: ["a) Les glucides (sucres)", "b) Les vitamines", "c) L'eau pure", "d) Les fibres cellulosiques"],
          correctOption: "a",
          explication: "Les glucides simples (glucose) sont le carburant énergétique préférentiel et immédiatement utilisable par les cellules."
        },
        {
          consigne: "Question 2 — Vrai ou Faux",
          question: "L'amylase salivaire commence la digestion chimique de l'amidon dès la bouche.",
          type: "vf",
          options: ["Vrai", "Faux"],
          correctOption: "vrai",
          explication: "VRAI. L'amylase salivaire hydrolyse l'amidon en maltose dès la mastication buccale."
        },
        {
          consigne: "Question 3 — QCM d'approfondissement examen",
          question: "Dans quelle structure de l'intestin grêle s'effectue le passage des nutriments vers le sang et la lymphe ?",
          type: "qcm",
          options: ["a) Dans le gros intestin", "b) Au niveau des villosités intestinales", "c) Dans l'estomac", "d) Dans la vésicule biliaire"],
          correctOption: "b",
          explication: "Les villosités et microvillosités intestinales offrent une immense surface d'échange permettant l'absorption rapide des nutriments."
        }
      ];
    }
    if (normTitle.includes('respiration') || normTitle.includes('circulation') || normTitle.includes('sang') || normTitle.includes('coeur')) {
      return [
        {
          consigne: "Question 1 — QCM de compréhension",
          question: "Quel gaz indispensable à la vie diffuse des alvéoles pulmonaires vers le sang lors de l'hématose ?",
          type: "qcm",
          options: ["a) Le dioxygène O₂", "b) Le dioxyde de carbone CO₂", "c) Le diazote N₂", "d) Le monoxyde de carbone CO"],
          correctOption: "a",
          explication: "L'hématose alvéolaire permet d'enrichir le sang en dioxygène O₂ et d'éliminer le dioxyde de carbone CO₂."
        },
        {
          consigne: "Question 2 — Vrai ou Faux",
          question: "Le cœur humain possède 4 cavités étanches évitant le mélange entre sang oxygéné et sang désoxygéné.",
          type: "vf",
          options: ["Vrai", "Faux"],
          correctOption: "vrai",
          explication: "VRAI. Le cœur est composé de 2 oreillettes et 2 ventricules, avec une cloison étanche séparant le cœur droit du cœur gauche."
        },
        {
          consigne: "Question 3 — QCM d'approfondissement examen",
          question: "Quelle protéine rouge contenue dans les hématies est chargée du transport du dioxygène ?",
          type: "qcm",
          options: ["a) L'insuline", "b) L'hémoglobine", "c) La pepsine", "d) Le glycogène"],
          correctOption: "b",
          explication: "L'hémoglobine fixe réversiblement 4 molécules d'O₂ pour former l'oxyhémoglobine rouge vif."
        }
      ];
    }
    if (normTitle.includes('reproduction') || normTitle.includes('fecondation') || normTitle.includes('cycle')) {
      return [
        {
          consigne: "Question 1 — QCM de compréhension",
          question: "Dans quelle partie des voies génitales féminines la fécondation naturelle a-t-elle lieu ?",
          type: "qcm",
          options: ["a) Dans la cavité utérine", "b) Dans le tiers supérieur de la trompe de Fallope", "c) Dans l'ovaire", "d) Dans le vagin"],
          correctOption: "b",
          explication: "La rencontre et la fusion du spermatozoïde avec l'ovocyte II ont lieu dans le tiers supérieur de la trompe de Fallope."
        },
        {
          consigne: "Question 2 — Vrai ou Faux",
          question: "L'ovulation survient généralement vers le 14e jour d'un cycle menstruel régulier de 28 jours.",
          type: "vf",
          options: ["Vrai", "Faux"],
          correctOption: "vrai",
          explication: "VRAI. Le pic d'hormone lutéinisante (LH) déclenche l'expulsion de l'ovocyte au 14e jour d'un cycle de 28 jours."
        },
        {
          consigne: "Question 3 — QCM d'approfondissement examen",
          question: "Quelle hormone mâle est sécrétée par les cellules interstitielles (de Leydig) du testicule ?",
          type: "qcm",
          options: ["a) La progestérone", "b) La testostérone", "c) L'œstrogène", "d) La prolactine"],
          correctOption: "b",
          explication: "La testostérone est l'hormone androgène responsable des caractères sexuels primaires et secondaires masculins."
        }
      ];
    }
    if (normTitle.includes('heredite') || normTitle.includes('chromosome') || normTitle.includes('genetique') || normTitle.includes('adn')) {
      return [
        {
          consigne: "Question 1 — QCM de compréhension",
          question: "Combien de chromosomes comporte le caryotype d'une cellule somatique humaine normale ?",
          type: "qcm",
          options: ["a) 23 chromosomes", "b) 46 chromosomes (soit 23 paires)", "c) 92 chromosomes", "d) 48 chromosomes"],
          correctOption: "b",
          explication: "L'espèce humaine possède 46 chromosomes (2n = 46), dont 22 paires d'autosomes et 1 paire de chromosomes sexuels (XX ou XY)."
        },
        {
          consigne: "Question 2 — Vrai ou Faux",
          question: "Un allèle récessif ne s'exprime au phénotype que s'il est présent à l'état homozygote.",
          type: "vf",
          options: ["Vrai", "Faux"],
          correctOption: "vrai",
          explication: "VRAI. En présence d'un allèle dominant, l'allèle récessif est masqué au niveau du phénotype chez l'hétérozygote."
        },
        {
          consigne: "Question 3 — QCM d'approfondissement examen",
          question: "Quelle combinaison de chromosomes sexuels détermine biologiquement le sexe masculin chez l'Homme ?",
          type: "qcm",
          options: ["a) XX", "b) XY", "c) YY", "d) X0"],
          correctOption: "b",
          explication: "La présence du chromosome Y (paire XY) apporté par le spermatozoïde détermine le sexe masculin."
        }
      ];
    }
    if (normTitle.includes('nerveux') || normTitle.includes('reflexe') || normTitle.includes('neurone') || normTitle.includes('synapse')) {
      return [
        {
          consigne: "Question 1 — QCM de compréhension",
          question: "Quelle cellule excitable est l'unité structurale et fonctionnelle de base du système nerveux ?",
          type: "qcm",
          options: ["a) L'érythrocyte", "b) Le neurone", "c) Le néphron", "d) Le fibroblaste"],
          correctOption: "b",
          explication: "Le neurone est la cellule spécialisée dans la genèse, la conduction et la transmission du message nerveux."
        },
        {
          consigne: "Question 2 — Vrai ou Faux",
          question: "Dans un réflexe médullaire inné (ex: réflexe rotulien), le centre nerveux de commande est la moelle épinière.",
          type: "vf",
          options: ["Vrai", "Faux"],
          correctOption: "vrai",
          explication: "VRAI. L'arc réflexe inné est involontaire et instantané, son intégration se fait directement dans la moelle épinière."
        },
        {
          consigne: "Question 3 — QCM d'approfondissement examen",
          question: "Comment appelle-t-on la zone de jonction et de transmission chimique entre deux neurones ?",
          type: "qcm",
          options: ["a) La synapse", "b) Le dendrite", "c) L'axone", "d) Le péricaryon"],
          correctOption: "a",
          explication: "La synapse est la zone de communication où des neurotransmetteurs transmettent le signal d'un neurone à un autre."
        }
      ];
    }
    if (normTitle.includes('immunite') || normTitle.includes('microbe') || normTitle.includes('vaccin') || normTitle.includes('anticorps')) {
      return [
        {
          consigne: "Question 1 — QCM de compréhension",
          question: "Quelles cellules immunitaires sécrètent les anticorps spécifiques neutralisant les antigènes ?",
          type: "qcm",
          options: ["a) Les hématies", "b) Les lymphocytes B (plasmocytes)", "c) Les plaquettes sanguines", "d) Les cellules hépatiques"],
          correctOption: "b",
          explication: "Les lymphocytes B activés se différencient en plasmocytes, usines produisant des millions d'anticorps spécifiques."
        },
        {
          consigne: "Question 2 — Vrai ou Faux",
          question: "La vaccination confère une protection active, spécifique et durable grâce à la mémoire immunitaire.",
          type: "vf",
          options: ["Vrai", "Faux"],
          correctOption: "vrai",
          explication: "VRAI. Le vaccin stimule le système immunitaire sans rendre malade, créant des cellules mémoires prêtes à réagir vigoureusement."
        },
        {
          consigne: "Question 3 — QCM d'approfondissement examen",
          question: "Quel mécanisme de défense non spécifique permet aux globules blancs d'englober et digérer les bactéries ?",
          type: "qcm",
          options: ["a) La mitose", "b) La phagocytose", "c) La transcription", "d) La coagulation"],
          correctOption: "b",
          explication: "La phagocytose est la première ligne de défense cellulaire non spécifique réalisée par les polynucléaires et macrophages."
        }
      ];
    }
    if (normTitle.includes('ecologie') || normTitle.includes('ecosysteme') || normTitle.includes('trophique')) {
      return [
        {
          consigne: "Question 1 — QCM de compréhension",
          question: "Quel rôle jouent les végétaux verts autotrophes dans une chaîne trophique ?",
          type: "qcm",
          options: ["a) Consommateurs secondaires", "b) Producteurs primaires", "c) Décomposeurs", "d) Prédateurs tertiaires"],
          correctOption: "b",
          explication: "Les végétaux chlorophylliens produisent leur propre matière organique par photosynthèse : ils sont producteurs primaires."
        },
        {
          consigne: "Question 2 — Vrai ou Faux",
          question: "Les décomposeurs du sol recyclent la matière organique morte en sels minéraux assimilables par les plantes.",
          type: "vf",
          options: ["Vrai", "Faux"],
          correctOption: "vrai",
          explication: "VRAI. Bactéries, champignons et vers de terre ferment le cycle de la matière en minéralisant la matière organique."
        },
        {
          consigne: "Question 3 — QCM d'approfondissement examen",
          question: "Que désigne le biotope au sein d'un écosystème naturel ?",
          type: "qcm",
          options: ["a) L'ensemble des êtres vivants", "b) Le milieu de vie physico-chimique (sol, eau, climat, lumière)", "c) La population d'herbivores", "d) Les parasites microbiens"],
          correctOption: "b",
          explication: "Un écosystème est l'association d'un biotope (milieu physico-chimique) et d'une biocénose (communauté des êtres vivants)."
        }
      ];
    }
    if (normTitle.includes('geologie') || normTitle.includes('sol') || normTitle.includes('minerai') || normTitle.includes('roche')) {
      return [
        {
          consigne: "Question 1 — QCM de compréhension",
          question: "Quel type de sol rouge est caractéristique des plateaux du Sud du Bénin ?",
          type: "qcm",
          options: ["a) Sol volcanique", "b) Sol ferrallitique sur terre de barre", "c) Sol d'arène granitique", "d) Sol calcaire pur"],
          correctOption: "b",
          explication: "Les plateaux du Sud béninois (Atlantique, Ouémé, Mono) portent des sols ferrallitiques rouges développés sur la terre de barre."
        },
        {
          consigne: "Question 2 — Vrai ou Faux",
          question: "Le gisement de calcaire d'Onigbolo au Bénin est exploité pour la production industrielle de ciment.",
          type: "vf",
          options: ["Vrai", "Faux"],
          correctOption: "vrai",
          explication: "VRAI. Le complexe cimentier d'Onigbolo valorise le gisement calcaire pour l'industrie nationale et sous-régionale."
        },
        {
          consigne: "Question 3 — QCM d'approfondissement examen",
          question: "Dans un profil pédologique, quel horizon superficiel est le plus riche en matière organique fertile (humus) ?",
          type: "qcm",
          options: ["a) L'horizon C de roche mère", "b) L'horizon supérieur A (ou litière/humus)", "c) L'horizon d'accumulation B", "d) Le socle granitique"],
          correctOption: "b",
          explication: "L'horizon superficiel concentre l'humus issu de la décomposition des feuilles et débris végétaux, garantissant la fertilité."
        }
      ];
    }
  }

  // 4. FRANÇAIS BREVET & BAC
  if (normSubj.includes('francais') || normSubj.includes('litt')) {
    if (normTitle.includes('grammaire') || normTitle.includes('classe') || normTitle.includes('fonction')) {
      return [
        {
          consigne: "Question 1 — QCM de compréhension",
          question: "Quelle est la fonction grammaticale du groupe souligné : 'L'élève révise **ses leçons** avec rigueur' ?",
          type: "qcm",
          options: ["a) Sujet du verbe", "b) Complément d'Objet Direct (COD)", "c) Attribut du sujet", "d) Complément circonstanciel de lieu"],
          correctOption: "b",
          explication: "Il répond directement à la question 'révise quoi ?' posée après le verbe sans préposition : c'est un COD."
        },
        {
          consigne: "Question 2 — Vrai ou Faux",
          question: "Un adverbe est un mot invariable qui modifie le sens d'un verbe, d'un adjectif ou d'un autre adverbe.",
          type: "vf",
          options: ["Vrai", "Faux"],
          correctOption: "vrai",
          explication: "VRAI. Les adverbes (lentement, très, hier, bien) sont invariables en genre et en nombre."
        },
        {
          consigne: "Question 3 — QCM d'approfondissement examen",
          question: "Parmi les conjonctions suivantes, laquelle est une conjonction de coordination ?",
          type: "qcm",
          options: ["a) Mais", "b) Parce que", "c) Quand", "d) Puisque"],
          correctOption: "a",
          explication: "Les 7 conjonctions de coordination sont : mais, ou, et, donc, or, ni, car."
        }
      ];
    }
    if (normTitle.includes('phrase') || normTitle.includes('complexe') || normTitle.includes('subordination')) {
      return [
        {
          consigne: "Question 1 — QCM de compréhension",
          question: "Quel pronom relatif introduit une proposition subordonnée relative marquant le lieu ou le temps ?",
          type: "qcm",
          options: ["a) Qui", "b) Où", "c) Dont", "d) Que"],
          correctOption: "b",
          explication: "Le pronom relatif 'où' a pour antécédent un nom de lieu ou de temps (ex: la ville où je suis né)."
        },
        {
          consigne: "Question 2 — Vrai ou Faux",
          question: "Deux propositions indépendantes reliées par une virgule ou un point-virgule sont dites juxtaposées.",
          type: "vf",
          options: ["Vrai", "Faux"],
          correctOption: "vrai",
          explication: "VRAI. La juxtaposition réunit deux propositions sans mot de liaison, par un signe de ponctuation faible."
        },
        {
          consigne: "Question 3 — QCM d'approfondissement examen",
          question: "Quelle subordonnée est introduite par la locution 'afin que' suivie du mode subjonctif ?",
          type: "qcm",
          options: ["a) Subordonnée de cause", "b) Subordonnée circonstancielle de but", "c) Subordonnée de concession", "d) Subordonnée temporelle"],
          correctOption: "b",
          explication: "'Afin que' et 'pour que' introduisent une subordonnée de but et exigent toujours le subjonctif."
        }
      ];
    }
    if (normTitle.includes('conjugaison') || normTitle.includes('temps') || normTitle.includes('mode') || normTitle.includes('participe')) {
      return [
        {
          consigne: "Question 1 — QCM de compréhension",
          question: "Dans quelle phrase le participe passé employé avec 'avoir' est-il correctement accordé ?",
          type: "qcm",
          options: ["a) Les fleurs que j'ai cueillies sont fraîches", "b) Les fleurs que j'ai cueilli sont fraîches", "c) Les fleurs que j'ai cueillis sont fraîches", "d) J'ai cueillies des fleurs"],
          correctOption: "a",
          explication: "Le COD 'que' (mis pour 'les fleurs', féminin pluriel) est placé AVANT l'auxiliaire avoir : le participe s'accorde au féminin pluriel (-ies)."
        },
        {
          consigne: "Question 2 — Vrai ou Faux",
          question: "Dans un récit au passé, l'imparfait s'utilise pour les actions de premier plan rapides et ponctuelles.",
          type: "vf",
          options: ["Vrai", "Faux"],
          correctOption: "faux",
          explication: "FAUX. C'est le passé simple qui sert aux actions ponctuelles et successives de premier plan ; l'imparfait sert aux descriptions et actions d'arrière-plan."
        },
        {
          consigne: "Question 3 — QCM d'approfondissement examen",
          question: "À quel temps de l'indicatif correspond la forme verbale 'nous partîmes' ?",
          type: "qcm",
          options: ["a) Imparfait", "b) Passé simple", "c) Présent", "d) Plus-que-parfait"],
          correctOption: "b",
          explication: "'Nous partîmes' est le verbe partir conjugué au passé simple à la première personne du pluriel."
        }
      ];
    }
    if (normTitle.includes('vocabulaire') || normTitle.includes('figure') || normTitle.includes('style') || normTitle.includes('metaphore')) {
      return [
        {
          consigne: "Question 1 — QCM de compréhension",
          question: "Quelle figure de style établit une analogie directe sans aucun outil de comparaison ?",
          type: "qcm",
          options: ["a) La comparaison", "b) La métaphore", "c) La litote", "d) L'anaphore"],
          correctOption: "b",
          explication: "La métaphore opère une assimilation directe sans mot comparatif comme 'comme', 'tel que' ou 'pareil à'."
        },
        {
          consigne: "Question 2 — Vrai ou Faux",
          question: "L'hyperbole est une figure de style qui atténue l'expression pour blesser moins.",
          type: "vf",
          options: ["Vrai", "Faux"],
          correctOption: "faux",
          explication: "FAUX. L'hyperbole est une figure d'EXAGÉRATION expressive (ex: 'mourir de soif'). L'atténuation est un euphémisme."
        },
        {
          consigne: "Question 3 — QCM d'approfondissement examen",
          question: "Dans le mot 'inaccessible', quel est le sens du préfixe 'in-' ?",
          type: "qcm",
          options: ["a) La répétition", "b) La négation / le contraire", "c) L'antériorité", "d) L'intensité"],
          correctOption: "b",
          explication: "Le préfixe latin in-/im- exprime la négation ou la privation : ce qui ne peut pas être accédé."
        }
      ];
    }
    if (normTitle.includes('typologie') || normTitle.includes('recit') || normTitle.includes('description') || normTitle.includes('dialogue')) {
      return [
        {
          consigne: "Question 1 — QCM de compréhension",
          question: "Dans le schéma narratif, comment appelle-t-on l'événement qui rompt l'équilibre initial ?",
          type: "qcm",
          options: ["a) La situation finale", "b) L'élément déclencheur (perturbateur)", "c) Le dénouement", "d) Les péripéties"],
          correctOption: "b",
          explication: "L'élément déclencheur vient perturber la situation initiale stable et déclenche les aventures du récit."
        },
        {
          consigne: "Question 2 — Vrai ou Faux",
          question: "Dans un dialogue de récit, chaque changement d'interlocuteur est obligatoirement marqué par un retour à la ligne et un tiret.",
          type: "vf",
          options: ["Vrai", "Faux"],
          correctOption: "vrai",
          explication: "VRAI. C'est la règle typographique officielle pour structurer la prise de parole des personnages."
        },
        {
          consigne: "Question 3 — QCM d'approfondissement examen",
          question: "Quel rôle joue un adjuvant dans le schéma actantiel d'un récit ?",
          type: "qcm",
          options: ["a) Il combat et bloque le héros", "b) Il apporte son aide au sujet pour accomplir sa quête", "c) Il reçoit la récompense finale", "d) Il est le narrateur extérieur"],
          correctOption: "b",
          explication: "L'adjuvant est l'allié ou le secours qui facilite la réussite de la quête du héros."
        }
      ];
    }
    if (normTitle.includes('argumentation') || normTitle.includes('convaincre') || normTitle.includes('persuader')) {
      return [
        {
          consigne: "Question 1 — QCM de compréhension",
          question: "Dans un texte argumentatif, comment appelle-t-on l'opinion centrale soutenue par l'auteur ?",
          type: "qcm",
          options: ["a) L'exemple", "b) La thèse", "c) La métaphore", "d) L'antithèse"],
          correctOption: "b",
          explication: "La thèse est la proposition ou position défendue par l'auteur à l'aide d'arguments et d'exemples."
        },
        {
          consigne: "Question 2 — Vrai ou Faux",
          question: "Convaincre s'adresse à la raison logique du destinataire, tandis que persuader fait appel à ses sentiments et émotions.",
          type: "vf",
          options: ["Vrai", "Faux"],
          correctOption: "vrai",
          explication: "VRAI. Convaincre mobilise des preuves rationnelles et démonstratives ; persuader touche la sensibilité du lecteur."
        },
        {
          consigne: "Question 3 — QCM d'approfondissement examen",
          question: "Quel connecteur logique permet d'introduire une objection ou une opposition forte ?",
          type: "qcm",
          options: ["a) En outre", "b) Cependant", "c) C'est pourquoi", "d) Premièrement"],
          correctOption: "b",
          explication: "'Cependant', 'néanmoins' et 'pourtant' marquent une opposition ou concession dans l'enchaînement argumentatif."
        }
      ];
    }
    if (normTitle.includes('litterature') || normTitle.includes('africaine') || normTitle.includes('pliya') || normTitle.includes('conte')) {
      return [
        {
          consigne: "Question 1 — QCM de compréhension",
          question: "Quel dramaturge et écrivain béninois a écrit 'Kondo le Requin' retraçant l'épopée de Béhanzin ?",
          type: "qcm",
          options: ["a) Olympe Bhêly-Quenum", "b) Jean Pliya", "c) Félix Couchoro", "d) Florent Couao-Zotti"],
          correctOption: "b",
          explication: "Jean Pliya (1931-2015) est le grand auteur de 'Kondo le Requin' et de 'La Secrétaire particulière'."
        },
        {
          consigne: "Question 2 — Vrai ou Faux",
          question: "Le roman 'Un piège sans fin', chef-d'œuvre de la littérature béninoise, a été rédigé par Olympe Bhêly-Quenum.",
          type: "vf",
          options: ["Vrai", "Faux"],
          correctOption: "vrai",
          explication: "VRAI. Olympe Bhêly-Quenum a publié 'Un piège sans fin' en 1960, traduit en de multiples langues."
        },
        {
          consigne: "Question 3 — QCM d'approfondissement examen",
          question: "Comment appelle-t-on les panégyriques claniques poétiques traditionnels en pays yoruba et nago au Bénin ?",
          type: "qcm",
          options: ["a) Les fables", "b) Les Oriki", "c) Les épigrammes", "d) Les sonnets"],
          correctOption: "b",
          explication: "Les Oriki sont des poèmes laudatifs et généalogiques chantés pour louer la lignée et les ancêtres."
        }
      ];
    }
    if (normTitle.includes('expression') || normTitle.includes('redaction') || normTitle.includes('communication') || normTitle.includes('orale')) {
      return [
        {
          consigne: "Question 1 — QCM de compréhension",
          question: "Quelles sont les trois étapes incontournables d'une bonne introduction de rédaction au BEPC ?",
          type: "qcm",
          options: ["a) Conclusion, thèse, exemple", "b) Amener le sujet, poser la problématique, annoncer le plan", "c) Formule de politesse, date, signature", "d) Citation, résumé, ouverture"],
          correctOption: "b",
          explication: "L'introduction académique se décompose en 3 moments : accroche/mise en contexte, énonciation du problème, annonce du plan."
        },
        {
          consigne: "Question 2 — Vrai ou Faux",
          question: "Dans une lettre administrative formelle, le registre de langue familier est parfaitement accepté.",
          type: "vf",
          options: ["Vrai", "Faux"],
          correctOption: "faux",
          explication: "FAUX. Une correspondance administrative exige obligatoirement le registre soutenu et le vouvoiement de déférence."
        },
        {
          consigne: "Question 3 — QCM d'approfondissement examen",
          question: "Quelle méthode permet de structurer efficacement chaque paragraphe du corps du devoir ?",
          type: "qcm",
          options: ["a) Écrire sans alinéa ni ponctuation", "b) Une idée directrice claire, un argument explicatif et un exemple concret", "c) Répéter la même phrase trois fois", "d) Mettre uniquement des citations"],
          correctOption: "b",
          explication: "La formule IDÉE - ARGUMENT - EXEMPLE garantit la cohérence et la solidité de l'argumentation."
        }
      ];
    }
  }

  // 5. ANGLAIS BREVET
  if (normSubj.includes('anglais') || normSubj.includes('english')) {
    if (normTitle.includes('present') || normTitle.includes('past') || normTitle.includes('tense')) {
      return [
        {
          consigne: "Question 1 — QCM de compréhension",
          question: "In the Simple Present, what suffix is added to regular verbs with third-person singular subjects (he/she/it)?",
          type: "qcm",
          options: ["a) -ing", "b) -s or -es", "c) -ed", "d) -ly"],
          correctOption: "b",
          explication: "In the Simple Present, regular verbs take -s or -es with he, she, or it (e.g., 'He speaks English')."
        },
        {
          consigne: "Question 2 — Vrai ou Faux",
          question: "The sentence 'She was cooking when Koffi arrived' uses Past Continuous interrupted by Simple Past.",
          type: "vf",
          options: ["Vrai", "Faux"],
          correctOption: "vrai",
          explication: "VRAI. Past continuous ('was cooking') expresses the action in progress, interrupted by the simple past ('arrived')."
        },
        {
          consigne: "Question 3 — QCM d'approfondissement examen",
          question: "What is the irregular past simple form of the verb 'buy'?",
          type: "qcm",
          options: ["a) buyed", "b) bought", "c) brought", "d) buying"],
          correctOption: "b",
          explication: "The irregular past simple of 'buy' is 'bought' (not to be confused with 'brought' from 'bring')."
        }
      ];
    }
    if (normTitle.includes('perfect') || normTitle.includes('future')) {
      return [
        {
          consigne: "Question 1 — QCM de compréhension",
          question: "Which preposition correctly fills the blank: 'I have been studying in this school _____ three years'?",
          type: "qcm",
          options: ["a) since", "b) for", "c) during", "d) while"],
          correctOption: "b",
          explication: "'For' is used for a duration (three years), whereas 'since' indicates a specific starting point in the past (since 2021)."
        },
        {
          consigne: "Question 2 — Vrai ou Faux",
          question: "The structure 'be going to + verb' is used for intentions and future plans made before the moment of speaking.",
          type: "vf",
          options: ["Vrai", "Faux"],
          correctOption: "vrai",
          explication: "VRAI. 'Be going to' indicates premeditated plans or evident predictions based on present evidence."
        },
        {
          consigne: "Question 3 — QCM d'approfondissement examen",
          question: "Which adverb of time is typically placed at the end of negative Present Perfect sentences meaning 'jusqu'à présent'?",
          type: "qcm",
          options: ["a) already", "b) yet", "c) just", "d) ever"],
          correctOption: "b",
          explication: "'Yet' is placed at the end of negative sentences and questions (e.g., 'He hasn't arrived yet')."
        }
      ];
    }
    if (normTitle.includes('modal') || normTitle.includes('conditional')) {
      return [
        {
          consigne: "Question 1 — QCM de compréhension",
          question: "Complete the First Conditional sentence: 'If you study your lessons regularly, you _____ the BEPC exam.'",
          type: "qcm",
          options: ["a) pass", "b) will pass", "c) would pass", "d) passed"],
          correctOption: "b",
          explication: "First Conditional rule: If + Simple Present, Future with 'will' (If you study..., you will pass)."
        },
        {
          consigne: "Question 2 — Vrai ou Faux",
          question: "The modal auxiliary 'mustn't' expresses an absence of obligation, meaning 'you don't have to'.",
          type: "vf",
          options: ["Vrai", "Faux"],
          correctOption: "faux",
          explication: "FAUX. 'Mustn't' expresses strict PROHIBITION (it is forbidden). Absence of obligation is expressed by 'don't have to'."
        },
        {
          consigne: "Question 3 — QCM d'approfondissement examen",
          question: "Which modal verb is best suited to give friendly advice or recommendation to a classmate?",
          type: "qcm",
          options: ["a) should", "b) must", "c) can", "d) might"],
          correctOption: "a",
          explication: "'Should' is the standard modal auxiliary used to offer advice (e.g., 'You should sleep early before the exam')."
        }
      ];
    }
    if (normTitle.includes('passive') || normTitle.includes('reported')) {
      return [
        {
          consigne: "Question 1 — QCM de compréhension",
          question: "Transform into Passive Voice: 'The teacher corrects the homework.'",
          type: "qcm",
          options: ["a) The homework was corrected by the teacher", "b) The homework is corrected by the teacher", "c) The homework has been correcting", "d) The teacher is corrected"],
          correctOption: "b",
          explication: "The active sentence is in Simple Present: passive formation is subject + is/are + past participle ('is corrected')."
        },
        {
          consigne: "Question 2 — Vrai ou Faux",
          question: "In reported speech with a past reporting verb, 'tomorrow' normally changes to 'the next day' or 'the following day'.",
          type: "vf",
          options: ["Vrai", "Faux"],
          correctOption: "vrai",
          explication: "VRAI. Time markers change in reported speech: today -> that day, yesterday -> the day before, tomorrow -> the next day."
        },
        {
          consigne: "Question 3 — QCM d'approfondissement examen",
          question: "How does the Simple Present 'I like music' change when reported as 'He said that he _____ music'?",
          type: "qcm",
          options: ["a) like", "b) liked", "c) will like", "d) has liked"],
          correctOption: "b",
          explication: "Backshift of tenses rule: Simple Present shifts back to Simple Past in reported speech."
        }
      ];
    }
    if (normTitle.includes('reading') || normTitle.includes('health') || normTitle.includes('environment') || normTitle.includes('vocabulary')) {
      return [
        {
          consigne: "Question 1 — QCM de compréhension",
          question: "What reading skill consists of quickly searching a text for a specific name, date or figure?",
          type: "qcm",
          options: ["a) Skimming", "b) Scanning", "c) Translating", "d) Memorizing"],
          correctOption: "b",
          explication: "Scanning is reading rapidly in order to locate specific facts or data without reading the whole text."
        },
        {
          consigne: "Question 2 — Vrai ou Faux",
          question: "Sleeping under long-lasting insecticide-treated nets is an effective way to prevent malaria in Benin.",
          type: "vf",
          options: ["Vrai", "Faux"],
          correctOption: "vrai",
          explication: "VRAI. Mosquito bed nets protect families from nighttime mosquito bites transmitting the Plasmodium parasite."
        },
        {
          consigne: "Question 3 — QCM d'approfondissement examen",
          question: "Which English word designates the cutting down and clearing of natural forests?",
          type: "qcm",
          options: ["a) Reforestation", "b) Deforestation", "c) Agriculture", "d) Irrigation"],
          correctOption: "b",
          explication: "Deforestation is the destruction of forests, which accelerates climate change and soil erosion."
        }
      ];
    }
  }

  // 6. LECTURE / DICTÉE BREVET
  if (normSubj.includes('lecture') || normSubj.includes('dictee') || normSubj.includes('dictée')) {
    if (normTitle.includes('orthographe') || normTitle.includes('consonne') || normTitle.includes('accent')) {
      return [
        {
          consigne: "Question 1 — QCM de compréhension",
          question: "Parmi ces verbes commençant par 'ap-', lequel prend deux 'p' conformément à la règle générale ?",
          type: "qcm",
          options: ["a) Apercevoir", "b) Apprendre", "c) Apaiser", "d) Aplanir"],
          correctOption: "b",
          explication: "Les mots en ap- prennent deux 'p' (apprendre, apporter, appeler), sauf apercevoir, apaiser, aplanir, apeurer, apostropher."
        },
        {
          consigne: "Question 2 — Vrai ou Faux",
          question: "La cédille se place sous la lettre 'c' devant les voyelles a, o, u pour produire le son [s].",
          type: "vf",
          options: ["Vrai", "Faux"],
          correctOption: "vrai",
          explication: "VRAI. Devant a, o, u, la cédille permet à la lettre c de garder le son doux [s] (ex: français, garçon, reçu)."
        },
        {
          consigne: "Question 3 — QCM d'approfondissement examen",
          question: "Quel mot prend obligatoirement un tréma sur la voyelle pour séparer sa prononciation ?",
          type: "qcm",
          options: ["a) Maitre", "b) Maïs", "c) Maire", "d) Maison"],
          correctOption: "b",
          explication: "Dans 'maïs', le tréma sépare le 'a' du 'i' (se prononce ma-is et non mais)."
        }
      ];
    }
    if (normTitle.includes('accord') || normTitle.includes('sujet') || normTitle.includes('nominal') || normTitle.includes('adjectif')) {
      return [
        {
          consigne: "Question 1 — QCM de compréhension",
          question: "Comment s'accorde l'adjectif de couleur dérivé d'un nom de fruit dans 'Des tissus _____ ' ?",
          type: "qcm",
          options: ["a) oranges", "b) orange", "c) orangeants", "d) oranger"],
          correctOption: "b",
          explication: "Les adjectifs de couleur issus de noms d'objets, de fruits ou de fleurs (orange, marron, cerise) sont invariables."
        },
        {
          consigne: "Question 2 — Vrai ou Faux",
          question: "Dans le cas d'un sujet inversé (ex: 'Dans la forêt chantaient les oiseaux'), le verbe s'accorde avec le sujet placé après lui.",
          type: "vf",
          options: ["Vrai", "Faux"],
          correctOption: "vrai",
          explication: "VRAI. L'inversion du sujet ne change pas la règle : 'les oiseaux' est au pluriel, donc 'chantaient' s'accorde à la 3e personne du pluriel."
        },
        {
          consigne: "Question 3 — QCM d'approfondissement examen",
          question: "Dans 'Des chemises bleu clair', pourquoi 'bleu clair' reste-t-il invariable ?",
          type: "qcm",
          options: ["a) C'est une faute", "b) Les adjectifs de couleur composés sont toujours invariables", "c) Le mot chemise est masculin", "d) C'est un adverbe"],
          correctOption: "b",
          explication: "Tous les adjectifs de couleur composés (bleu clair, vert foncé, gris perle) restent invariables."
        }
      ];
    }
    if (normTitle.includes('homophone')) {
      return [
        {
          consigne: "Question 1 — QCM de compréhension",
          question: "Compléter : 'Il est parti _____ Parakou car il _____ un examen.'",
          type: "qcm",
          options: ["a) a / a", "b) à / a", "c) à / à", "d) a / à"],
          correctOption: "b",
          explication: "Le premier est la préposition invariable 'à', le second est le verbe avoir 'a' (remplaçable par 'avait')."
        },
        {
          consigne: "Question 2 — Vrai ou Faux",
          question: "L'homophone 'ou' marquant le choix peut être remplacé par 'ou bien'.",
          type: "vf",
          options: ["Vrai", "Faux"],
          correctOption: "vrai",
          explication: "VRAI. 'Ou' sans accent exprime l'alternative (remplaçable par 'ou bien'). 'Où' avec accent indique le lieu."
        },
        {
          consigne: "Question 3 — QCM d'approfondissement examen",
          question: "Compléter : '_____ enfants ont révisé _____ leçons.'",
          type: "qcm",
          options: ["a) Ces / leurs", "b) Ses / leur", "c) C'est / leurs", "d) S'est / leur"],
          correctOption: "a",
          explication: "'Ces' désigne démonstrativement les enfants, 'leurs' s'accorde au pluriel avec le nom 'leçons'."
        }
      ];
    }
    if (normTitle.includes('ponctuation') || normTitle.includes('relecture') || normTitle.includes('entrainement') || normTitle.includes('bepc')) {
      return [
        {
          consigne: "Question 1 — QCM de compréhension",
          question: "Lors de la relecture systématique d'une dictée, quel balayage prioritaire permet d'éviter le plus d'erreurs pénalisantes ?",
          type: "qcm",
          options: ["a) Compter le nombre de lignes", "b) Repérer chaque verbe et vérifier scrupuleusement l'accord avec son sujet", "c) Effacer toutes les virgules", "d) Souligner les adjectifs"],
          correctOption: "b",
          explication: "L'accord sujet-verbe est l'erreur la plus lourdement sanctionnée en dictée d'examen."
        },
        {
          consigne: "Question 2 — Vrai ou Faux",
          question: "On ne doit JAMAIS placer de virgule directement entre un groupe sujet et son verbe conjugué.",
          type: "vf",
          options: ["Vrai", "Faux"],
          correctOption: "vrai",
          explication: "VRAI. C'est une règle d'or fondamentale de ponctuation en français : le sujet n'est jamais séparé de son verbe par une virgule seule."
        },
        {
          consigne: "Question 3 — QCM d'approfondissement examen",
          question: "Quel signe de ponctuation annonce une énumération, une explication ou une prise de parole au discours direct ?",
          type: "qcm",
          options: ["a) Le point-virgule", "b) Les deux-points (:)", "c) Le point d'exclamation", "d) La parenthèse"],
          correctOption: "b",
          explication: "Les deux-points introduisent une citation entre guillemets, une explication de cause ou une énumération détaillée."
        }
      ];
    }
  }

  // 7. MATHÉMATIQUES BREVET & BAC
  if (normSubj.includes('math')) {
    if (normTitle.includes('puissance') || normTitle.includes('rationnel') || normTitle.includes('fraction') || normTitle.includes('entier')) {
      return [
        {
          consigne: "Question 1 — QCM de calcul",
          question: "Quelle est l'écriture sous forme d'une seule puissance de 2³ × 2⁴ ?",
          type: "qcm",
          options: ["a) 2⁷", "b) 2¹²", "c) 4⁷", "d) 2¹"],
          correctOption: "a",
          explication: "Règle des puissances : aᵐ × aⁿ = aᵐ⁺ⁿ. Donc 2³ × 2⁴ = 2³⁺⁴ = 2⁷."
        },
        {
          consigne: "Question 2 — Vrai ou Faux",
          question: "La fraction 15/20 sous forme irréductible est égale à 3/4.",
          type: "vf",
          options: ["Vrai", "Faux"],
          correctOption: "vrai",
          explication: "VRAI. En divisant le numérateur et le dénominateur par leur PGCD (qui est 5), on obtient 3/4."
        },
        {
          consigne: "Question 3 — QCM d'approfondissement examen",
          question: "Que vaut la somme de fractions 3/4 + 1/2 sous forme simplifiée ?",
          type: "qcm",
          options: ["a) 4/6", "b) 5/4", "c) 4/4", "d) 3/8"],
          correctOption: "b",
          explication: "Mettre au dénominateur commun 4 : 3/4 + 2/4 = 5/4."
        }
      ];
    }
    if (normTitle.includes('litteral') || normTitle.includes('identite') || normTitle.includes('factorisation')) {
      return [
        {
          consigne: "Question 1 — QCM de calcul",
          question: "Quel est le développement de l'identité remarquable (x + 5)² ?",
          type: "qcm",
          options: ["a) x² + 25", "b) x² + 10x + 25", "c) x² + 5x + 25", "d) 2x + 10"],
          correctOption: "b",
          explication: "Formule : (a + b)² = a² + 2ab + b². Ici (x + 5)² = x² + 2(x)(5) + 5² = x² + 10x + 25."
        },
        {
          consigne: "Question 2 — Vrai ou Faux",
          question: "Pour tous réels a et b, (a - b)(a + b) = a² - b².",
          type: "vf",
          options: ["Vrai", "Faux"],
          correctOption: "vrai",
          explication: "VRAI. C'est la 3e identité remarquable fondamentale."
        },
        {
          consigne: "Question 3 — QCM d'approfondissement examen",
          question: "Quelle est la forme factorisée de 4x² - 9 ?",
          type: "qcm",
          options: ["a) (2x - 3)²", "b) (2x - 3)(2x + 3)", "c) (4x - 9)(4x + 9)", "d) 4(x - 3)"],
          correctOption: "b",
          explication: "Reconnaître a² - b² avec a = 2x et b = 3 : (2x - 3)(2x + 3)."
        }
      ];
    }
    if (normTitle.includes('equation') || normTitle.includes('inequation') || normTitle.includes('premier degre')) {
      return [
        {
          consigne: "Question 1 — QCM de résolution",
          question: "Quelle est la solution de l'équation 3x - 12 = 0 ?",
          type: "qcm",
          options: ["a) x = -4", "b) x = 4", "c) x = 15", "d) x = 9"],
          correctOption: "b",
          explication: "3x = 12 donc x = 12 / 3 = 4."
        },
        {
          consigne: "Question 2 — Vrai ou Faux",
          question: "Quand on multiplie ou divise les deux membres d'une inéquation par un nombre négatif, on conserve le sens de l'inégalité.",
          type: "vf",
          options: ["Vrai", "Faux"],
          correctOption: "faux",
          explication: "FAUX. La multiplication ou division par un nombre négatif INVERSE obligatoirement le sens de l'inégalité."
        },
        {
          consigne: "Question 3 — QCM d'approfondissement examen",
          question: "Quelles sont les solutions de l'équation-produit nul (x - 2)(2x + 6) = 0 ?",
          type: "qcm",
          options: ["a) x = 2 et x = -3", "b) x = -2 et x = 3", "c) x = 2 et x = 6", "d) x = 0 et x = 2"],
          correctOption: "a",
          explication: "Un produit est nul si l'un au moins des facteurs est nul : x - 2 = 0 (x = 2) ou 2x + 6 = 0 (x = -3)."
        }
      ];
    }
    if (normTitle.includes('thales') || normTitle.includes('triangle')) {
      return [
        {
          consigne: "Question 1 — QCM de géométrie",
          question: "Dans un triangle ABC, si M ∈ [AB], N ∈ [AC] et (MN) // (BC), avec AM = 2, AB = 6 et AN = 3, que vaut AC ?",
          type: "qcm",
          options: ["a) 6", "b) 9", "c) 5", "d) 12"],
          correctOption: "b",
          explication: "D'après Thalès : AM / AB = AN / AC ⇔ 2 / 6 = 3 / AC ⇔ AC = (6 × 3) / 2 = 9."
        },
        {
          consigne: "Question 2 — Vrai ou Faux",
          question: "La réciproque du théorème de Thalès sert à calculer des longueurs de segments inconnues.",
          type: "vf",
          options: ["Vrai", "Faux"],
          correctOption: "faux",
          explication: "FAUX. La réciproque sert à PROUVER que deux droites sont parallèles. C'est le théorème direct qui sert à calculer des longueurs."
        },
        {
          consigne: "Question 3 — QCM d'approfondissement examen",
          question: "Quelle condition sur l'alignement des points est indispensable pour appliquer la réciproque de Thalès ?",
          type: "qcm",
          options: ["a) Les points doivent être alignés dans le même ordre", "b) Les points doivent former un triangle rectangle", "c) Tous les angles doivent valoir 60°", "d) Aucun ordre particulier"],
          correctOption: "a",
          explication: "Pour conclure au parallélisme, les points doivent être alignés dans le même ordre sur les deux droites sécantes."
        }
      ];
    }
    if (normTitle.includes('pythagore') || normTitle.includes('trigonometrie') || normTitle.includes('rectangle')) {
      return [
        {
          consigne: "Question 1 — QCM de géométrie",
          question: "Dans un triangle ABC rectangle en A avec AB = 6 cm et AC = 8 cm, quelle est la longueur de l'hypoténuse BC ?",
          type: "qcm",
          options: ["a) 14 cm", "b) 10 cm", "c) 12 cm", "d) 48 cm"],
          correctOption: "b",
          explication: "D'après Pythagore : BC² = AB² + AC² = 6² + 8² = 36 + 64 = 100, donc BC = √100 = 10 cm."
        },
        {
          consigne: "Question 2 — Vrai ou Faux",
          question: "Pour tout angle aigu α d'un triangle rectangle, on a toujours cos² α + sin² α = 1.",
          type: "vf",
          options: ["Vrai", "Faux"],
          correctOption: "vrai",
          explication: "VRAI. C'est la relation fondamentale de trigonométrie découlant directement du théorème de Pythagore."
        },
        {
          consigne: "Question 3 — QCM d'approfondissement examen",
          question: "Dans un triangle rectangle, quelle formule donne la tangente de l'angle aigu α ?",
          type: "qcm",
          options: ["a) côté adjacent / hypoténuse", "b) côté opposé / côté adjacent", "c) côté opposé / hypoténuse", "d) hypoténuse / adjacent"],
          correctOption: "b",
          explication: "tan α = côté opposé / côté adjacent = sin α / cos α."
        }
      ];
    }
    if (normTitle.includes('fonction') || normTitle.includes('affine') || normTitle.includes('lineaire')) {
      return [
        {
          consigne: "Question 1 — QCM d'analyse",
          question: "Soit la fonction affine f(x) = 3x - 5. Quelle est l'image de 4 par f ?",
          type: "qcm",
          options: ["a) 7", "b) 12", "c) -5", "d) 2"],
          correctOption: "a",
          explication: "f(4) = 3(4) - 5 = 12 - 5 = 7."
        },
        {
          consigne: "Question 2 — Vrai ou Faux",
          question: "La représentation graphique d'une fonction linéaire f(x) = ax passe toujours par l'origine du repère (0, 0).",
          type: "vf",
          options: ["Vrai", "Faux"],
          correctOption: "vrai",
          explication: "VRAI. Pour x = 0, f(0) = a × 0 = 0, donc la droite passe nécessairement par l'origine O(0,0)."
        },
        {
          consigne: "Question 3 — QCM d'approfondissement examen",
          question: "Dans l'expression d'une fonction affine f(x) = ax + b, que représente le coefficient 'a' ?",
          type: "qcm",
          options: ["a) L'ordonnée à l'origine", "b) Le coefficient directeur (pente de la droite)", "c) L'antécédent", "d) La racine"],
          correctOption: "b",
          explication: "Le coefficient 'a' détermine la pente ou coefficient directeur de la droite, tandis que 'b' est l'ordonnée à l'origine."
        }
      ];
    }
    if (normTitle.includes('systeme') || normTitle.includes('inconnue')) {
      return [
        {
          consigne: "Question 1 — QCM d'algèbre",
          question: "Soit le système { x + y = 10 ; x - y = 2 }. Quelles sont les valeurs de x et y ?",
          type: "qcm",
          options: ["a) x = 6, y = 4", "b) x = 5, y = 5", "c) x = 8, y = 2", "d) x = 7, y = 3"],
          correctOption: "a",
          explication: "Par addition des deux lignes : 2x = 12 ⇒ x = 6. Puis y = 10 - 6 = 4."
        },
        {
          consigne: "Question 2 — Vrai ou Faux",
          question: "Graphiquement, la solution d'un système de deux équations correspond aux coordonnées du point d'intersection des deux droites.",
          type: "vf",
          options: ["Vrai", "Faux"],
          correctOption: "vrai",
          explication: "VRAI. Le point commun aux deux droites vérifie simultanément les deux équations."
        },
        {
          consigne: "Question 3 — QCM d'approfondissement examen",
          question: "Si les deux droites représentant un système sont strictement parallèles (même pente, ordonnées différentes), le système admet :",
          type: "qcm",
          options: ["a) Exactement une solution", "b) Aucune solution", "c) Une infinité de solutions", "d) Deux solutions"],
          correctOption: "b",
          explication: "Deux droites strictement parallèles ne se coupent jamais : il n'y a donc aucun point commun et aucune solution."
        }
      ];
    }
    if (normTitle.includes('statistique') || normTitle.includes('donnee') || normTitle.includes('moyenne')) {
      return [
        {
          consigne: "Question 1 — QCM de statistiques",
          question: "Quelle est la moyenne simple de la série de notes : 8, 10, 12, 14, 16 ?",
          type: "qcm",
          options: ["a) 10", "b) 12", "c) 14", "d) 11"],
          correctOption: "b",
          explication: "Somme = 8 + 10 + 12 + 14 + 16 = 60. Moyenne = 60 / 5 = 12."
        },
        {
          consigne: "Question 2 — Vrai ou Faux",
          question: "La médiane d'une série ordonnée est la valeur qui sépare l'effectif en deux parties égales de 50%.",
          type: "vf",
          options: ["Vrai", "Faux"],
          correctOption: "vrai",
          explication: "VRAI. Par définition, au moins 50% des valeurs sont inférieures ou égales à la médiane, et au moins 50% supérieures ou égales."
        },
        {
          consigne: "Question 3 — QCM d'approfondissement examen",
          question: "Dans un diagramme circulaire représentant une population, quel angle en degrés correspond à une fréquence de 25% (un quart) ?",
          type: "qcm",
          options: ["a) 45°", "b) 90°", "c) 180°", "d) 25°"],
          correctOption: "b",
          explication: "Angle = 0,25 × 360° = 90° (un angle droit)."
        }
      ];
    }
    if (normTitle.includes('suite')) {
      return [
        {
          consigne: "Question 1 — QCM de compréhension",
          question: "Dans une suite arithmétique de raison r = 3 et de premier terme u₀ = 2, que vaut le terme u₅ ?",
          type: "qcm",
          options: ["a) 14", "b) 17", "c) 20", "d) 23"],
          correctOption: "b",
          explication: "u₅ = u₀ + 5r = 2 + 5×3 = 2 + 15 = 17."
        },
        {
          consigne: "Question 2 — Vrai ou Faux",
          question: "Toute suite géométrique de raison q strictement comprise entre 0 et 1 (0 < q < 1) avec u₀ > 0 est décroissante et converge vers 0.",
          type: "vf",
          options: ["Vrai", "Faux"],
          correctOption: "vrai",
          explication: "VRAI. Lorsque 0 < q < 1, qⁿ tend vers 0 en +∞, donc la suite est décroissante et converge vers 0."
        },
        {
          consigne: "Question 3 — QCM d'approfondissement examen",
          question: "Quelle est la somme des 10 premiers termes de la suite géométrique uₙ = 2ⁿ (u₀ = 1, raison q = 2) ?",
          type: "qcm",
          options: ["a) 512", "b) 1023", "c) 1024", "d) 2048"],
          correctOption: "b",
          explication: "S₁₀ = u₀ × (1 - 2¹⁰) / (1 - 2) = 1 × (1 - 1024) / (-1) = 1023."
        }
      ];
    }
    if (normTitle.includes('derive') || normTitle.includes('limite') || normTitle.includes('integrale')) {
      return [
        {
          consigne: "Question 1 — QCM de compréhension",
          question: "Quelle est la dérivée de la fonction f(x) = ln(3x² + 1) ?",
          type: "qcm",
          options: ["a) 1 / (3x² + 1)", "b) 6x / (3x² + 1)", "c) 6x ln(3x² + 1)", "d) 3x / (3x² + 1)"],
          correctOption: "b",
          explication: "Formule (ln u)' = u' / u. Ici u = 3x² + 1 donc u' = 6x, d'où f'(x) = 6x / (3x² + 1)."
        },
        {
          consigne: "Question 2 — Vrai ou Faux",
          question: "Une fonction continue sur un intervalle fermé [a, b] est nécessairement dérivable sur cet intervalle.",
          type: "vf",
          options: ["Vrai", "Faux"],
          correctOption: "faux",
          explication: "FAUX. La dérivabilité implique la continuité, mais l'inverse est faux (ex: la fonction valeur absolue f(x)=|x| est continue en 0 mais non dérivable en 0)."
        },
        {
          consigne: "Question 3 — QCM d'application examen",
          question: "Quelle est la valeur de l'intégrale I = ∫₀¹ (2x + 3) dx ?",
          type: "qcm",
          options: ["a) 3", "b) 4", "c) 5", "d) 6"],
          correctOption: "b",
          explication: "Primitive F(x) = x² + 3x. I = F(1) - F(0) = (1² + 3×1) - 0 = 4."
        }
      ];
    }
  }

  // 8. PHILOSOPHIE BAC
  if (normSubj.includes('philo')) {
    return [
      {
        consigne: "Question 1 — QCM conceptuel",
        question: "Dans les Méditations métaphysiques, quelle certitude résiste au doute radical de René Descartes ?",
        type: "qcm",
        options: ["a) L'existence prouvée du monde matériel", "b) Le Cogito ('Je pense, donc je suis')", "c) La perfection des sens", "d) Les vérités historiques"],
        correctOption: "b",
        explication: "Même si un malin génie me trompe, pour être trompé, il faut nécessairement que je sois : l'acte de penser prouve immédiatement mon existence."
      },
      {
        consigne: "Question 2 — Vrai ou Faux",
        question: "Pour Paulin Hountondji, la philosophie africaine doit consister à recueillir passivement les mythes et contes oraux du passé.",
        type: "vf",
        options: ["Vrai", "Faux"],
        correctOption: "faux",
        explication: "FAUX. Dans Sur la 'philosophie africaine', Paulin Hountondji combat l'ethnophilosophie et soutient que la philosophie est une littérature scientifique, critique et individuelle."
      },
      {
        consigne: "Question 3 — QCM d'application examen",
        question: "Selon Jean-Paul Sartre, que signifie l'expression fondamentale 'L'existence précède l'essence' ?",
        type: "qcm",
        options: ["a) L'homme est déterminé à sa naissance par une nature divine", "b) L'homme existe d'abord, se rencontre, surgit dans le monde, et se définit ensuite par ses actes", "c) L'homme ne possède aucune conscience", "d) La liberté est une illusion génétique"],
        correctOption: "b",
        explication: "Chez l'homme, il n'y a pas de nature humaine prédéfinie : chacun est responsable de ses choix et se crée par ses actions."
      }
    ];
  }

  // FALLBACK UNIVERSEL RICHE ET CONTEXTUEL (garantit 3 exercices pour tout chapitre)
  const safeTitle = chapterTitle || "cette leçon";
  return [
    {
      consigne: "Question 1 — QCM de compréhension notionnelle",
      question: "Dans l'étude de " + safeTitle + ", quel principe fondamental doit retenir l'élève pour les examens ?",
      type: "qcm",
      options: [
        "a) Mémoriser sans justification rigoureuse",
        "b) Maîtriser les définitions clés et appliquer la méthode officielle du programme béninois",
        "c) Se contenter d'approximations intuitives",
        "d) Négliger les propriétés énoncées dans le cours"
      ],
      correctOption: "b",
      explication: "La réussite au programme national exige d'assimiler les concepts clés et de justifier chaque raisonnement avec précision."
    },
    {
      consigne: "Question 2 — Vrai ou Faux",
      question: "L'apprentissage régulier et l'application méthodique des notions de " + safeTitle + " sont indispensables pour valider les compétences de cette Situation d'Apprentissage.",
      type: "vf",
      options: ["Vrai", "Faux"],
      correctOption: "vrai",
      explication: "VRAI. Le référentiel de compétences du MEMP évalue à la fois la justesse conceptuelle et la rigueur dans la démarche de résolution."
    },
    {
      consigne: "Question 3 — QCM d'application d'examen",
      question: "Face à une épreuve officielle portant sur " + safeTitle + ", quelle attitude garantit la note maximale ?",
      type: "qcm",
      options: [
        "a) Rédiger rapidement sans relire la consigne",
        "b) Analyser les hypothèses, citer les lois ou règles appropriées et formuler une conclusion claire",
        "c) Recopier textuellement l'énoncé sans développement",
        "d) Laisser la question sans réponse dès la moindre difficulté"
      ],
      correctOption: "b",
      explication: "Le barème officiel des examens nationaux (BEPC et BAC) accorde la majorité des points à la démarche logique, aux justifications et au soin rédactionnel."
    }
  ];
}

// =========================================================================
// MOTEUR D'EXTENSION À 6 EXERCICES COMPLETS PAR CHAPITRE
// Ajoute Questions 4, 5 et 6 ciblées selon la discipline et le programme béninois
// =========================================================================
function completeToSixExercises(initialList, chapterTitle, subjectName, niveau, coursContent) {
  const safeList = Array.isArray(initialList) ? [...initialList] : [];
  if (safeList.length >= 6) return safeList.slice(0, 6);

  const safeTitle = chapterTitle || "cette leçon";
  const normSubj = String(subjectName || '').toLowerCase();
  const isBac = niveau === 'bac';
  const examName = isBac ? "BAC" : "BEPC";

  let q4, q5, q6;

  if (normSubj.includes('math')) {
    q4 = {
      consigne: "Question 4 — QCM de méthode et rigueur de calcul",
      question: "Pour aborder un problème de mathématiques portant sur " + safeTitle + ", quelle démarche méthodique est impérative ?",
      type: "qcm",
      options: [
        "a) Écrire immédiatement les résultats sans poser les hypothèses",
        "b) Préciser le domaine de validité, énoncer les théorèmes mobilisés et détailler chaque étape logique",
        "c) Se fier uniquement à une approximation graphique sans démonstration analytique",
        "d) Conclure sans vérifier la cohérence des solutions trouvées"
      ],
      correctOption: "b",
      explication: "Aux épreuves de Mathématiques du " + examName + ", le barème officiel valorise en priorité l'explicitation du domaine de validité et la rigueur de chaque enchaînement déductif."
    };
    q5 = {
      consigne: "Question 5 — Vrai ou Faux : Propriétés et théorèmes",
      question: "En mathématiques, une propriété générale étudiée dans " + safeTitle + " peut être considérée comme démontrée pour tout réel sur la base d'un simple exemple particulier vérifié.",
      type: "vf",
      options: ["Vrai", "Faux"],
      correctOption: "faux",
      explication: "FAUX. Un exemple particulier permet uniquement d'illustrer ou d'émettre une conjecture (ou de fournir un contre-exemple), mais ne constitue jamais une preuve générale."
    };
    q6 = {
      consigne: "Question 6 — QCM d'épreuve officielle (" + examName + ")",
      question: "Dans une situation d'évaluation officielle sur " + safeTitle + ", quel réflexe permet de sécuriser la totalité des points ?",
      type: "qcm",
      options: [
        "a) Rendre sa copie dès le calcul achevé sans relecture",
        "b) Contrôler la cohérence du résultat (signe, ordre de grandeur, cas limites) et encadrer clairement la conclusion",
        "c) Raturer abondamment sans présenter clairement les étapes",
        "d) Négliger les justifications géométriques ou algébriques"
      ],
      correctOption: "b",
      explication: "Le contrôle systématique de la vraisemblance et le soin de la présentation évitent les pertes de points évitables et facilitent la correction par le jury."
    };
  } else if (normSubj.includes('physique') || normSubj.includes('chim') || normSubj.includes('pct')) {
    q4 = {
      consigne: "Question 4 — QCM de grandeurs et unités légales",
      question: "Lors de l'application des lois et formules relatives à " + safeTitle + ", quelle règle sur les unités est obligatoire ?",
      type: "qcm",
      options: [
        "a) Utiliser directement les grandeurs sans convertir",
        "b) Convertir toutes les grandeurs dans les unités légales du Système International (SI) avant tout calcul",
        "c) Omettre les unités dans la rédaction du résultat final",
        "d) Arrondir de façon arbitraire les valeurs intermédiaires"
      ],
      correctOption: "b",
      explication: "Toutes les relations fondamentales de physique-chimie exigent les unités SI (mètres, secondes, kilogrammes, Joules, mol/L...) pour produire un résultat numériquement exact."
    };
    q5 = {
      consigne: "Question 5 — Vrai ou Faux : Lois de conservation",
      question: "Dans l'étude de " + safeTitle + ", les principes de conservation (de la matière, de la charge électrique, ou de l'énergie) demeurent rigoureusement vérifiés.",
      type: "vf",
      options: ["Vrai", "Faux"],
      correctOption: "vrai",
      explication: "VRAI. Les principes d'invariance et de conservation constituent les piliers intangibles régissant l'ensemble des phénomènes de physique et de chimie."
    };
    q6 = {
      consigne: "Question 6 — QCM de démarche expérimentale (" + examName + ")",
      question: "Face à une situation d'évaluation en PCT portant sur " + safeTitle + ", quelle étape doit précéder l'application numérique ?",
      type: "qcm",
      options: [
        "a) Taper des chiffres au hasard sur sa calculatrice",
        "b) Définir le système d'étude, préciser le référentiel ou écrire l'équation-bilan équilibrée avant de poser la formule littérale",
        "c) Recopier la question sans apporter d'explication",
        "d) Ignorer les conditions initiales du problème"
      ],
      correctOption: "b",
      explication: "Le guide de correction officiel du " + examName + " pénalise l'absence d'expression littérale et accorde la priorité à la modélisation théorique claire."
    };
  } else if (normSubj.includes('svt')) {
    q4 = {
      consigne: "Question 4 — QCM d'analyse de documents biologiques",
      question: "Dans l'exploitation d'une expérience ou d'un schéma biologique relatif à " + safeTitle + ", comment l'élève doit-il structurer sa réponse ?",
      type: "qcm",
      options: [
        "a) Paraphraser le document sans mobiliser ses connaissances",
        "b) Saisir les données objectives (variations chiffrées, observations), les interpréter avec le cours puis déduire une conclusion",
        "c) Exprimer son sentiment personnel sans justification scientifique",
        "d) Ignorer les expériences témoins"
      ],
      correctOption: "b",
      explication: "La démarche scientifique en SVT exige la rigueur de la trilogie : 'Je vois que' (saisie d'informations), 'Or je sais que' (connaissances), 'Donc je conclus que' (déduction)."
    };
    q5 = {
      consigne: "Question 5 — Vrai ou Faux : Mécanismes du vivant",
      question: "Les processus biologiques étudiés dans " + safeTitle + " reposent sur des régulations et rétrocontrôles assurant l'homéostasie ou la transmission de la vie.",
      type: "vf",
      options: ["Vrai", "Faux"],
      correctOption: "vrai",
      explication: "VRAI. Le maintien des équilibres physiologiques et la pérennité génétique sont assurés par des systèmes régulateurs précis."
    };
    q6 = {
      consigne: "Question 6 — QCM de synthèse problème (" + examName + ")",
      question: "Lors de la résolution d'une Situation Problème en SVT sur " + safeTitle + ", quel critère d'évaluation garantit le maximum de points ?",
      type: "qcm",
      options: [
        "a) Aligner des mots scientifiques sans fil conducteur logique",
        "b) Produire un texte argumenté avec introduction, développement structuré et conclusion répondant au problème biologique posé",
        "c) Donner une réponse en une seule phrase télégraphique",
        "d) Recopier l'énoncé sans analyse personnelle"
      ],
      correctOption: "b",
      explication: "Les grilles officielles du MEMP au " + examName + " évaluent la pertinence, la correction scientifique et la cohérence de la production écrite."
    };
  } else if (normSubj.includes('histoire') || normSubj.includes('geo')) {
    q4 = {
      consigne: "Question 4 — QCM de repères spatiotemporels",
      question: "Dans l'analyse des faits historiques et géographiques de " + safeTitle + ", quelle compétence est essentielle ?",
      type: "qcm",
      options: [
        "a) Dissocier les événements de leur contexte temporel et spatial",
        "b) Maîtriser la chronologie des faits, localiser avec précision sur une carte et distinguer causes structurelles et conjoncturelles",
        "c) Se limiter à une récitation sans recul critique",
        "d) Confondre les échelles d'analyse (locale, régionale, internationale)"
      ],
      correctOption: "b",
      explication: "L'intelligence historique et géographique repose sur la contextualisation temporelle précise et la compréhension des interactions spatiales."
    };
    q5 = {
      consigne: "Question 5 — Vrai ou Faux : Dynamiques territoriales",
      question: "L'explication des phénomènes abordés dans " + safeTitle + " implique la prise en compte conjointe des facteurs politiques, économiques, sociaux et environnementaux.",
      type: "vf",
      options: ["Vrai", "Faux"],
      correctOption: "vrai",
      explication: "VRAI. L'approche globale et systémique est au cœur des programmes d'histoire-géographie au Bénin pour éclairer les défis contemporains."
    };
    q6 = {
      consigne: "Question 6 — QCM de dissertation et commentaire (" + examName + ")",
      question: "Dans une production écrite officielle en Histoire-Géographie portant sur " + safeTitle + ", quelle règle de composition est déterminante ?",
      type: "qcm",
      options: [
        "a) Rédiger sans transition ni paragraphes distincts",
        "b) Organiser la réflexion en parties équilibrées, illustrer chaque idée par des faits vérifiés et soigner les transitions",
        "c) Multiplier les jugements de valeur subjectifs",
        "d) Omettre la conclusion récapitulative"
      ],
      correctOption: "b",
      explication: "L'argumentation équilibrée, le respect du plan annoncé et la rigueur des exemples historiques/géographiques assurent la note maximale au " + examName + "."
    };
  } else if (normSubj.includes('philo')) {
    q4 = {
      consigne: "Question 4 — QCM de distinction conceptuelle",
      question: "Dans la réflexion philosophique menée autour de " + safeTitle + ", quelle démarche de pensée distingue le philosophe de l'opinion commune ?",
      type: "qcm",
      options: [
        "a) Adhérer sans réserve aux préjugés reçus",
        "b) Définir rigoureusement les concepts, distinguer les notions voisines (ex: contrainte vs obligation) et problématiser le sujet",
        "c) Affirmer des vérités absolues sans examen critique",
        "d) Réduire la philosophie à un recueil d'anecdotes"
      ],
      correctOption: "b",
      explication: "L'art de philosopher consiste à interroger ce qui semble aller de soi par le travail du concept et la rigueur de l'argumentation rationnelle."
    };
    q5 = {
      consigne: "Question 5 — Vrai ou Faux : Pensée critique et philosophie africaine",
      question: "Les philosophes contemporains s'accordent à affirmer que la réflexion sur " + safeTitle + " exige un examen libre et individuel de la raison, sans dogmatisme.",
      type: "vf",
      options: ["Vrai", "Faux"],
      correctOption: "vrai",
      explication: "VRAI. La philosophie se définit universellement comme une entreprise critique d'émancipation intellectuelle par la libre raison."
    };
    q6 = {
      consigne: "Question 6 — QCM de dissertation philosophique (" + examName + ")",
      question: "Pour réussir la conclusion d'une dissertation philosophique portant sur " + safeTitle + ", que doit faire le candidat ?",
      type: "qcm",
      options: [
        "a) Introduire de nouveaux arguments contradictoires jamais évoqués",
        "b) Faire le bilan succinct du parcours réflexif, formuler une réponse claire et nuancée à la problématique, et ouvrir une perspective",
        "c) Recopier mot pour mot le paragraphe d'introduction",
        "d) Refuser de trancher en déclarant que tout est relatif"
      ],
      correctOption: "b",
      explication: "La conclusion philosophique au " + examName + " doit apporter une réponse synthétique nette au problème posé tout en mesurant la portée de la réflexion."
    };
  } else if (normSubj.includes('francais') || normSubj.includes('litt') || normSubj.includes('lecture') || normSubj.includes('dictee')) {
    q4 = {
      consigne: "Question 4 — QCM de maîtrise lexicale et stylistique",
      question: "Dans l'étude stylistique et grammaticale de " + safeTitle + ", quel élément confère force et élégance à l'expression ?",
      type: "qcm",
      options: [
        "a) L'utilisation de phrases incomplètes ou ambiguës",
        "b) La précision du vocabulaire, l'exactitude des accords grammaticaux et l'adéquation des figures de style au propos",
        "c) L'accumulation désordonnée de termes précieux sans lien",
        "d) L'absence de variété dans les connecteurs logiques"
      ],
      correctOption: "b",
      explication: "La justesse syntaxique, la richesse lexicale et la pertinence stylistique sont les critères majeurs évalués dans les épreuves de français au " + examName + "."
    };
    q5 = {
      consigne: "Question 5 — Vrai ou Faux : Rigueur littéraire",
      question: "Dans un commentaire composé ou une dissertation littéraire portant sur " + safeTitle + ", chaque affirmation sur le texte doit être justifiée par une citation ou un procédé précis.",
      type: "vf",
      options: ["Vrai", "Faux"],
      correctOption: "vrai",
      explication: "VRAI. L'analyse littéraire ne supporte aucune gratuité : le sens dégagé doit être démontré par l'étude conjointe du fond et de la forme."
    };
    q6 = {
      consigne: "Question 6 — QCM d'épreuve littéraire (" + examName + ")",
      question: "Quelle étape garantit la pertinence du plan dans une production écrite officielle portant sur " + safeTitle + " ?",
      type: "qcm",
      options: [
        "a) Se lancer dans la rédaction immédiate sans brouillon préalable",
        "b) Analyser les mots-clés du sujet, dégager la problématique et bâtir un plan détaillé au brouillon avec arguments et citations",
        "c) Écrire au fil de la plume sans plan ordonné",
        "d) Répéter la même idée sous des formes différentes"
      ],
      correctOption: "b",
      explication: "L'élaboration préalable du plan au brouillon prévient le hors-sujet et assure une progression thématique fluide et convaincante au " + examName + "."
    };
  } else if (normSubj.includes('anglais')) {
    q4 = {
      consigne: "Question 4 — Multiple Choice: Accuracy and Sentence Structure",
      question: "In mastering English concepts related to " + safeTitle + ", what grammatical rule must always be observed?",
      type: "qcm",
      options: [
        "a) Omitting auxiliary verbs in negative and interrogative structures",
        "b) Ensuring subject-verb agreement and using correct sequence of tenses according to the context",
        "c) Translating French idioms word-for-word into English",
        "d) Writing sentences without verbs"
      ],
      correctOption: "b",
      explication: "Subject-verb agreement and consistent tense sequencing are strictly examined in national English papers at " + examName + " level."
    };
    q5 = {
      consigne: "Question 5 — True or False: Reading and Vocabulary",
      question: "Contextual clues and surrounding vocabulary are reliable keys to understand unfamiliar words in texts about " + safeTitle + ".",
      type: "vf",
      options: ["Vrai", "Faux"],
      correctOption: "vrai",
      explication: "TRUE. Reading skills emphasize deducing meaning from textual context rather than guessing at random."
    };
    q6 = {
      consigne: "Question 6 — Multiple Choice: Writing and Essay Strategy (" + examName + ")",
      question: "Which link word is appropriate to express a logical conclusion in an English essay dealing with " + safeTitle + " ?",
      type: "qcm",
      options: [
        "a) Although",
        "b) Therefore / Consequently",
        "c) Whereas",
        "d) Despite"
      ],
      correctOption: "b",
      explication: "'Therefore' and 'Consequently' correctly express logical results and conclusions in structured English writing."
    };
  } else if (normSubj.includes('eco') || normSubj.includes('compta')) {
    q4 = {
      consigne: "Question 4 — QCM de rigueur technique et financière",
      question: "Dans le traitement des opérations et cas pratiques portant sur " + safeTitle + ", quel principe technique doit être scrupuleusement respecté ?",
      type: "qcm",
      options: [
        "a) Effectuer des écritures sans référence aux pièces justificatives",
        "b) Appliquer la réglementation SYSCOHADA (ou principes économiques), justifier les calculs et veiller à l'égalité fondamentale emplois = ressources",
        "c) Négliger l'incidence de la fiscalité (TVA, impôts)",
        "d) Confondre résultat net et flux de trésorerie"
      ],
      correctOption: "b",
      explication: "Le respect des normes comptables et des modèles macroéconomiques officiels conditionne la validité des états financiers et des analyses économiques."
    };
    q5 = {
      consigne: "Question 5 — Vrai ou Faux : Principes de gestion",
      question: "Dans la gestion de " + safeTitle + ", le principe d'indépendance des exercices oblige à rattacher à chaque période comptable uniquement les charges et produits qui la concernent.",
      type: "vf",
      options: ["Vrai", "Faux"],
      correctOption: "vrai",
      explication: "VRAI. Le principe de spécialisation des exercices évite les reports indus de résultat et garantit une image fidèle de l'entreprise."
    };
    q6 = {
      consigne: "Question 6 — QCM d'analyse de cas (" + examName + ")",
      question: "Face à un sujet de synthèse au BAC portant sur " + safeTitle + ", quelle démarche d'analyse apporte la meilleure note ?",
      type: "qcm",
      options: [
        "a) Se contenter de calculs bruts sans commentaire qualitatif",
        "b) Calculer avec exactitude les grandeurs, interpréter les écarts et formuler des recommandations managériales pertinentes",
        "c) Recopier textuellement les annexes sans traitement",
        "d) Ignorer le contexte économique sectoriel de l'entreprise"
      ],
      correctOption: "b",
      explication: "Au BAC technique et tertiaire, le jury valorise l'esprit de synthèse, la rigueur calculatoire et la capacité d'interprétation critique des résultats."
    };
  } else {
    q4 = {
      consigne: "Question 4 — QCM d'analyse méthodique",
      question: "Dans l'approfondissement de " + safeTitle + ", quelle démarche assure l'assimilation durable des notions ?",
      type: "qcm",
      options: [
        "a) Réviser de manière passive sans s'exercer",
        "b) Alterner lecture active, fiches de synthèse et résolution d'exercices d'application variés",
        "c) Ignorer les corrections détaillées des exercices",
        "d) Accumuler les retards jusqu'à la veille de l'examen"
      ],
      correctOption: "b",
      explication: "L'entraînement régulier et l'auto-évaluation active sont les méthodes éprouvées pour garantir la réussite aux examens nationaux."
    };
    q5 = {
      consigne: "Question 5 — Vrai ou Faux : Approfondissement",
      question: "La maîtrise de " + safeTitle + " requiert à la fois la connaissance théorique et la capacité d'appliquer ces concepts dans des situations nouvelles.",
      type: "vf",
      options: ["Vrai", "Faux"],
      correctOption: "vrai",
      explication: "VRAI. L'Approche Par Compétences (APC) en vigueur au Bénin évalue le transfert des acquis dans des contextes de vie ou d'évaluation diversifiés."
    };
    q6 = {
      consigne: "Question 6 — QCM de synthèse d'examen (" + examName + ")",
      question: "Pour maximiser ses chances de réussite le jour de l'épreuve sur " + safeTitle + ", quel conseil doit suivre l'élève ?",
      type: "qcm",
      options: [
        "a) Rédiger vite sans structuration",
        "b) Bien lire l'ensemble du sujet, gérer son temps méthodiquement et soigner la rédaction de chaque réponse",
        "c) Abandonner dès qu'une question paraît difficile",
        "d) Négliger la relecture finale de la copie"
      ],
      correctOption: "b",
      explication: "La gestion rigoureuse du temps et le soin apporté à la clarté rédactionnelle permettent d'obtenir la note maximale aux examens officiels."
    };
  }

  const extraQuestions = [q4, q5, q6];
  for (const ex of extraQuestions) {
    if (safeList.length < 6) {
      const idx = safeList.length + 1;
      const typeLabel = ex.type === 'vf' ? 'Vrai ou Faux' : 'QCM';
      ex.consigne = "Question " + idx + " — " + typeLabel + " d'approfondissement";
      safeList.push(ex);
    }
  }

  while (safeList.length < 6) {
    const idx = safeList.length + 1;
    safeList.push({
      consigne: "Question " + idx + " — QCM de synthèse",
      question: "Dans la maîtrise de " + safeTitle + ", quel élément fondamental assure la réussite à l'examen officiel du " + examName + " ?",
      type: "qcm",
      options: [
        "a) L'apprentissage superficiel sans entraînement",
        "b) La rigueur dans l'application des concepts et la clarté de la justification",
        "c) Le hasard et la conjecture non démontrée",
        "d) La négligence des consignes de l'énoncé"
      ],
      correctOption: "b",
      explication: "Le barème officiel valorise avant tout la rigueur conceptuelle et la pertinence de la démarche méthodique."
    });
  }

  return safeList.slice(0, 6);
}

function generateChapterExerciseSet(chapterTitle, subjectName, niveau, coursContent) {
  const baseExercises = _rawGenerateChapterExerciseSet(chapterTitle, subjectName, niveau, coursContent);
  return completeToSixExercises(baseExercises, chapterTitle, subjectName, niveau, coursContent);
}


function generateIntroChapter(subjectName, niveau, prefixId, niveauTexte, num) {
  const exercises = generateChapterExerciseSet("Introduction et méthodologie", subjectName, niveau, "");
  return {
    id: niveau + '_' + prefixId + '_intro_' + num,
    num: num,
    title: 'Introduction à ' + subjectName + ' — Méthodologie et bases',
    cours: 'Bienvenue dans le cours de ' + subjectName + ' pour ' + niveauTexte + '. Cette discipline suit le programme officiel du Ministère de l\'Enseignement Secondaire et de la Formation Technique et Professionnelle du Bénin.\n\n🎯 Objectifs du programme :\n• Maîtriser les concepts fondamentaux selon le référentiel béninois\n• Développer les compétences d\'analyse et de résolution de problèmes\n• Préparer efficacement aux examens nationaux (BEPC/BAC)\n• Appliquer les connaissances dans des situations concrètes\n\n📚 Méthodologie de travail :\n1. Étudier le cours théorique attentivement et retenir les définitions clés\n2. Comprendre les exemples d\'application et la méthode de rédaction\n3. S\'entraîner avec les QCM et exercices résolus\n4. Réviser régulièrement pour ancrer les acquis\n\nLe programme de ' + subjectName + ' ' + (niveau === 'bac' ? 'BAC' : 'Brevet') + ' est conçu selon les standards éducatifs béninois pour assurer un parcours d\'excellence.',
    exemple: {
      titre: 'Méthode d\'apprentissage — ' + subjectName,
      enonce: 'Comment organiser efficacement son travail en ' + subjectName + ' pour réussir aux examens ?',
      solution: '1. Planification : répartir les chapitres sur l\'année sans accumuler de retard\n2. Compréhension : ne pas apprendre par cœur sans comprendre les principes\n3. Application : s\'entraîner régulièrement sur les annales officielles\n4. Révision : reprendre régulièrement les notions acquises\n5. Auto-évaluation : tester ses connaissances avec les QCM de fin de chapitre'
    },
    exercices: exercises,
    exercice: exercises[0]
  };
}

function generateKnowledgeChapter(knowledgeChapter, subjectName, niveau, prefixId, chapterNum, saNum) {
  const exercises = generateChapterExerciseSet(knowledgeChapter.title, subjectName, niveau, knowledgeChapter.cours);
  return {
    id: niveau + '_' + prefixId + '_kc_' + chapterNum,
    num: chapterNum,
    title: knowledgeChapter.sa + ' : ' + knowledgeChapter.title,
    cours: '📚 ' + knowledgeChapter.title + '\n\n' + knowledgeChapter.cours + '\n\nCe chapitre fait partie du programme officiel béninois de ' + subjectName + ' niveau ' + (niveau === 'bac' ? 'BAC' : 'Brevet') + '. Il développe les compétences requises par le référentiel du MEMP.\n\n🎯 Compétences visées :\n• Maîtriser les notions théoriques fondamentales\n• Savoir appliquer les concepts dans des exercices types\n• Développer un raisonnement logique et structuré\n• Se préparer aux questions d\'examen sur ce thème',
    exemple: {
      titre: 'Application pratique — ' + knowledgeChapter.title,
      enonce: 'Voici un exemple d\'application des concepts de ce chapitre dans un contexte d\'examen béninois.',
      solution: 'La résolution nécessite de mobiliser les notions clés du chapitre et de les appliquer méthodiquement selon les standards du programme national.'
    },
    exercices: exercises,
    exercice: exercises[0]
  };
}

function generateGenericChapter(dc, subjectName, niveau, prefixId, num) {
  const exercises = generateChapterExerciseSet(dc.title, subjectName, niveau, dc.cours);
  return {
    id: niveau + '_' + prefixId + '_gen_' + num,
    num: num,
    title: (dc.sa || 'SA') + ' : ' + dc.title,
    cours: '📚 ' + dc.title + '\n\n' + dc.cours + '\n\nCe chapitre fait partie du programme officiel béninois de ' + subjectName + ' niveau ' + (niveau === 'bac' ? 'BAC' : 'Brevet') + '. Il développe les compétences requises par le référentiel national.\n\n🎯 Objectifs pédagogiques :\n• Assimiler le vocabulaire et les notions indispensables\n• Savoir rédiger ou calculer conformément aux exigences de correction\n• Préparer activement les épreuves officielles',
    exemple: {
      titre: 'Exemple résolu — ' + dc.title,
      enonce: 'Comment aborder un exercice sur ' + dc.title + ' lors d\'un examen national ?',
      solution: '1. Lire attentivement la consigne et repérer les mots-clés.\n2. Formuler les propriétés et règles applicables.\n3. Rédiger une conclusion claire et justifiée.'
    },
    exercices: exercises,
    exercice: exercises[0]
  };
}

function generateDefaultChaptersForSubject(subjectName, niveau) {
  return [
    { sa: "SA 1", title: 'Notions fondamentales en ' + subjectName, cours: 'Ce chapitre aborde les définitions clés et principes de base en ' + subjectName + ' selon les exigences du programme béninois.' },
    { sa: "SA 2", title: 'Méthodes et techniques d\'analyse', cours: 'Approfondissement des démarches méthodologiques, résolution des cas pratiques et exercices types.' },
    { sa: "SA 3", title: 'Applications pratiques et raisonnement', cours: 'Mise en œuvre des connaissances dans des contextes réels et préparation aux questions fréquentes d\'examen.' },
    { sa: "SA 4", title: 'Approfondissement et synthèse', cours: 'Synthèse des compétences, maîtrise des concepts avancés et révision globale de la matière.' }
  ];
}

function generateFinalChapter(subjectName, niveau, prefixId, niveauTexte, num) {
  const exercises = generateChapterExerciseSet('Synthèse et examen en ' + subjectName, subjectName, niveau, '');
  return {
    id: niveau + '_' + prefixId + '_final_' + num,
    num: num,
    title: 'Sujet type examen et synthèse globale — ' + subjectName,
    cours: '📚 Épreuve de synthèse et préparation à l\'examen en ' + subjectName + ' (' + niveauTexte + ')\n\nCe chapitre récapitule l\'ensemble du programme et propose un entraînement intensif au format officiel :\n1. Rappel des compétences transversales exigées par le jury d\'examen.\n2. Gestion du temps : découpage recommandé pour chaque épreuve.\n3. Pièges fréquents et critères d\'évaluation des correcteurs béninois.\n4. Conseils pour la rédaction : rigueur, clarté, soin de la copie.\n\nRévisez régulièrement vos fiches, refaites les QCM et maîtrisez les exemples résolus pour maximiser vos points le jour J.',
    exemple: {
      titre: 'Annales type examen — ' + subjectName,
      enonce: 'Extrait d\'un sujet d\'examen officiel : mobiliser vos connaissances pour résoudre le problème posé.',
      solution: 'Méthode de résolution complète :\n• Décomposition du problème en sous-questions ordonnées\n• Justification rigoureuse de chaque étape avec la règle appropriée\n• Vérification de la cohérence du résultat final'
    },
    exercices: exercises,
    exercice: exercises[0]
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
  if (qcmEl) qcmEl.textContent = total > 0 ? total * 6 : 0;
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

let authListenerInitialized = false;

async function checkSession() {
  state.unlockedChapterIds = [];
  state.unlockedMap = {};
  state.user = null;

  if (!supabaseClient) {
    updateNavbar();
    return;
  }

  // Écouteur en temps réel pour synchroniser l'authentification
  if (!authListenerInitialized) {
    authListenerInitialized = true;
    supabaseClient.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        if (session?.user) {
          await hydrateUser(session.user);
          await loadUserUnlocks(session.user.id);
          updateNavbar();
          if (state.user?.role === 'admin') {
            await loadAdminData();
          }
        }
      } else if (event === 'SIGNED_OUT') {
        state.user = null;
        state.unlockedChapterIds = [];
        state.unlockedMap = {};
        state.usersList = [];
        state.transactions = [];
        updateNavbar();
        if (state.currentView === 'client-dashboard' || state.currentView === 'admin-dashboard') {
          go('dashboard');
        }
      }
    });
  }

  try {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session?.user) {
      await hydrateUser(session.user);
      await loadUserUnlocks(session.user.id);
      if (state.user?.role === 'admin') {
        await loadAdminData();
      }
    }
  } catch (e) {
    console.warn('Session Supabase', e);
    state.user = null;
  }
  updateNavbar();
}

async function hydrateUser(authUser) {
  let profile = null;
  try {
    const { data, error } = await supabaseClient
      .from('profiles')
      .select('id, email, name, role, niveau')
      .eq('id', authUser.id)
      .maybeSingle();

    if (!error && data) {
      profile = data;
    }
  } catch (err) {
    console.warn('Erreur lecture profil Supabase', err);
  }

  // Si le profil n'existe pas encore en table (ex: trigger absent), le synchroniser
  if (!profile && supabaseClient && authUser.id) {
    try {
      const fallbackData = {
        id: authUser.id,
        email: authUser.email,
        name: (authUser.user_metadata && authUser.user_metadata.name) || authUser.email.split('@')[0],
        role: (authUser.user_metadata && authUser.user_metadata.role) || 'client',
        niveau: (authUser.user_metadata && authUser.user_metadata.niveau) || state.currentNiveau
      };
      const { data: upserted } = await supabaseClient
        .from('profiles')
        .upsert(fallbackData, { onConflict: 'id' })
        .select('id, email, name, role, niveau')
        .maybeSingle();
      if (upserted) profile = upserted;
    } catch (upsertErr) {
      console.warn('Création profil automatique', upsertErr);
    }
  }

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
  if (viewId === 'client-dashboard' && state.user) renderClientDashboard();
  if (viewId === 'admin-dashboard' && state.user) {
    renderAdminDashboard();
    loadAdminData();
  }
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

  // Si la base en mémoire est vide, pré-peupler avec les chapitres disponibles du niveau actuel
  // pour que la recherche globale, les QCM et l'espace élève soient fonctionnels dès le chargement
  if (all.length === 0) {
    const currentNiveau = state.currentNiveau || 'bac';
    const currentSubjs = currentNiveau === 'bac'
      ? (matieresData.bac[state.currentSerie || 'C'] || matieresData.bac['C'])
      : matieresData.brevet;
    for (const m of currentSubjs) {
      const chaps = generateSubjectSpecificContent(m.name, currentNiveau);
      for (const c of chaps) {
        all.push({ ...c, niveau: currentNiveau, subject: m.name });
      }
    }
  }
  return all;
}

function generateAutoContentFallback(subjectName, niveau) {
  return generateSubjectSpecificContent(subjectName, niveau);
}

// Fonction de tri stricte par Situation d'Apprentissage (SA 1 -> SA 2 -> SA 3 -> ...)
function sortChaptersByCurriculumOrder(chapters) {
  if (!Array.isArray(chapters) || chapters.length <= 1) return chapters;

  function extractSaRank(chap) {
    const text = `${chap.sa || ''} ${chap.title || ''}`;
    // Matcher "SA 1", "SA 2", "SA 3", "SA 4", "SA 5", "SA 6", etc.
    const match = text.match(/\bSA\s*(\d+)\b/i);
    if (match) {
      return parseInt(match[1], 10);
    }
    const lower = text.toLowerCase();
    if (lower.includes('intro') || lower.includes('méthodologie') || lower.includes('bases')) {
      return 0; // Toujours en 1er
    }
    if (lower.includes('synthèse') || lower.includes('examen') || lower.includes('annales') || lower.includes('sujet type')) {
      return 999; // Toujours en dernier
    }
    return 100; // Priorité intermédiaire si non spécifié
  }

  const sorted = [...chapters].sort((a, b) => {
    const rankA = extractSaRank(a);
    const rankB = extractSaRank(b);
    if (rankA !== rankB) return rankA - rankB;
    return (a.num || 0) - (b.num || 0);
  });

  return sorted;
}

function generateSubjectSpecificContent(subjectName, niveau) {
  const knowledge = getKnowledgeSubject(niveau, subjectName);
  const prefixId = slugify(subjectName);
  const niveauTexte = niveau === 'bac' ? `Terminale (BAC Série ${state.currentSerie || 'C'})` : '3ème (Brevet)';
  const price = niveau === 'brevet' ? 100 : 150;
  const FREE_CHAPTER_COUNT = 3; // les 3 premiers chapitres sont gratuits

  const chapters = [];

  // 1. Premier chapitre introductif
  chapters.push(generateIntroChapter(subjectName, niveau, prefixId, niveauTexte, 1));

  // 2. Chapitres de contenu du référentiel béninois
  if (knowledge && Array.isArray(knowledge.chapters) && knowledge.chapters.length > 0) {
    knowledge.chapters.forEach((kc, i) => {
      chapters.push(generateKnowledgeChapter(kc, subjectName, niveau, prefixId, chapters.length + 1, i + 2));
    });
  } else {
    const defaultChapters = generateDefaultChaptersForSubject(subjectName, niveau);
    defaultChapters.forEach((dc) => {
      chapters.push(generateGenericChapter(dc, subjectName, niveau, prefixId, chapters.length + 1));
    });
  }

  // 3. Chapitre de synthèse type examen
  chapters.push(generateFinalChapter(subjectName, niveau, prefixId, niveauTexte, chapters.length + 1));

  // 4. Tri strict par ordre des SA (SA 1 -> SA 2 -> ...)
  const sortedChapters = sortChaptersByCurriculumOrder(chapters);

  // Application des règles tarifaires : 3 premiers gratuits, puis prix officiel
  return sortedChapters.map((chap, index) => ({
    ...chap,
    num: index + 1,
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
    console.log(`🔍 Fetching chapters for: ${subjectName}, niveau: ${niveau}, serie: ${serie}`);

    // RPC qui retourne le contenu RICHE (cours + exemple + exercice)
    let { data, error } = await supabaseClient.rpc('get_curriculum_chapters', {
      p_niveau: niveau,
      p_serie: serie,
      p_subject: subjectName
    });

    if (error) {
      if (error.code === 'PGRST202' || error.message?.includes('function') || error.message?.includes('404')) {
        console.info(`Database RPC not available (likely not seeded yet): ${error.message}`);
        return null;
      }
      console.error('Supabase RPC error:', error);
      return null;
    }

    // Si aucun chapitre pour la série précise, tenter sans filtre de série (ex: Philo ou Français pour série C)
    if ((!Array.isArray(data) || data.length === 0) && serie) {
      const fallbackRes = await supabaseClient.rpc('get_curriculum_chapters', {
        p_niveau: niveau,
        p_serie: null,
        p_subject: subjectName
      });
      if (fallbackRes.data && Array.isArray(fallbackRes.data) && fallbackRes.data.length > 0) {
        data = fallbackRes.data;
      }
    }

    if (!Array.isArray(data) || data.length === 0) {
      console.info(`No curriculum data found for ${subjectName} (${niveau}/${serie}) - will use knowledge fallback`);
      return null;
    }

    console.info(`✅ Loaded ${data.length} chapters for ${subjectName} from database`);

    const knowledge = getKnowledgeSubject(niveau, subjectName);
    const prefixId = slugify(subjectName);
    const niveauTexte = niveau === 'bac' ? `Terminale (BAC Série ${serie || state.currentSerie || 'C'})` : '3ème (Brevet)';
    const defaultPrice = niveau === 'brevet' ? 100 : 150;
    const FREE_CHAPTER_COUNT = 3;

    // 1. Convertir les chapitres existants reçus de Supabase et leur adjoindre 3 exercices
    const dbChapters = data.map((row, index) => {
      const options = Array.isArray(row.exercice_options) ? row.exercice_options : [];
      const fullTitle = row.sa_label ? `${row.sa_label} : ${row.title}` : row.title;
      const num = row.num || (index + 1);
      const cleanSubj = slugify(subjectName);
      const safeId = row.id || `${niveau}_${(row.serie_code || serie || 'commune').toLowerCase()}_${cleanSubj}_${num}`;

      // Générer l'ensemble de 3 exercices contextuels
      const generatedExercises = generateChapterExerciseSet(row.title, subjectName, niveau, row.cours);

      // Exercice spécifique provenant de la base de données
      const dbEx = {
        consigne: row.exercice_consigne || "Question 1 — QCM de compréhension",
        question: row.exercice_question || `Question sur ${row.title}`,
        type: row.exercice_type || 'qcm',
        options: options.length >= 2 ? options : [
          "a) Réponse A",
          "b) Réponse B",
          "c) Réponse C",
          "d) Réponse D"
        ],
        correctOption: row.exercice_correct_option || 'b',
        explication: row.exercice_explication || ''
      };

      let allExercises = [];
      if (row.exercice_question && String(row.exercice_question).trim()) {
        allExercises = [dbEx];
        if (generatedExercises && generatedExercises.length > 1) {
          allExercises.push(...generatedExercises.slice(1, 6));
        }
      } else {
        allExercises = generatedExercises && generatedExercises.length >= 6 ? generatedExercises.slice(0, 6) : generatedExercises;
      }

      return {
        id: safeId,
        num: num,
        title: fullTitle,
        cours: row.cours,
        exemple: {
          titre: row.exemple_titre || `Exemple — ${row.title}`,
          enonce: row.exemple_enonce || '',
          solution: row.exemple_solution || ''
        },
        exercices: allExercises,
        exercice: allExercises[0] || dbEx,
        isFree: typeof row.is_free === 'boolean' ? row.is_free : (index < FREE_CHAPTER_COUNT),
        price: Number(row.price) >= 0 ? Number(row.price) : (index < FREE_CHAPTER_COUNT ? 0 : defaultPrice)
      };
    });

    // 2. CHARGEMENT DYNAMIQUE DE LA SUITE DU PROGRAMME DU PAYS :
    // Si la base ne contient pas l'intégralité du programme officiel, compléter dynamiquement avec KNOWLEDGE_BASE
    const allFinalChapters = [...dbChapters];
    if (knowledge && Array.isArray(knowledge.chapters)) {
      const existingTitlesNorm = dbChapters.map(c =>
        String(c.title).toLowerCase().replace(/[^a-z0-9]/g, '')
      );

      knowledge.chapters.forEach((kc, i) => {
        const kcNorm = String(kc.title).toLowerCase().replace(/[^a-z0-9]/g, '');
        // Vérifier si la notion est déjà présente
        const alreadyPresent = existingTitlesNorm.some(et =>
          et.includes(kcNorm) || kcNorm.includes(et) || (kcNorm.length > 8 && et.includes(kcNorm.substring(0, 8)))
        );
        if (!alreadyPresent) {
          const nextNum = allFinalChapters.length + 1;
          const newChap = generateKnowledgeChapter(kc, subjectName, niveau, prefixId, nextNum, i + 1);
          newChap.isFree = nextNum <= FREE_CHAPTER_COUNT;
          newChap.price = newChap.isFree ? 0 : defaultPrice;
          allFinalChapters.push(newChap);
        }
      });
    }

    // 3. Ajouter le chapitre de synthèse finale / épreuve type examen si pas encore présent
    const hasFinal = allFinalChapters.some(c =>
      c.title.toLowerCase().includes('synthèse') || c.title.toLowerCase().includes('examen')
    );
    if (!hasFinal && allFinalChapters.length >= 3) {
      const finalNum = allFinalChapters.length + 1;
      const finalChap = generateFinalChapter(subjectName, niveau, prefixId, niveauTexte, finalNum);
      finalChap.isFree = finalNum <= FREE_CHAPTER_COUNT;
      finalChap.price = finalChap.isFree ? 0 : defaultPrice;
      allFinalChapters.push(finalChap);
    }

    // 4. Tri strict par ordre des SA (SA 1 -> SA 2 -> ...)
    const sortedFinalChapters = sortChaptersByCurriculumOrder(allFinalChapters);

    // 5. Numérotation continue et application stricte des tarifs officiels (3 premiers gratuits)
    return sortedFinalChapters.map((ch, idx) => ({
      ...ch,
      num: idx + 1,
      isFree: idx < FREE_CHAPTER_COUNT,
      price: idx < FREE_CHAPTER_COUNT ? 0 : defaultPrice
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
    if (response.ok && data.success && data.chapitres && Array.isArray(data.chapitres) && data.chapitres.length >= 5) {
      return data.chapitres;
    }
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
    
    // 1. Tenter d'abord de charger depuis Supabase (avec complétion dynamique automatique)
    try {
      chapitres = await fetchChaptersFromSupabase(subjectName, state.currentNiveau, state.currentSerie);
      if (chapitres && chapitres.length > 0) {
        levelDb[subjectName] = chapitres;
      }
    } catch (error) {
      console.error('Erreur lors du chargement depuis Supabase:', error);
    }
    
    // 2. Si la base est vide ou indisponible pour cette matière, charger directement le programme officiel complet
    if (!chapitres || chapitres.length === 0) {
      console.info(`Chargement direct du programme officiel pour ${subjectName}`);
      chapitres = generateAutoContentFallback(subjectName, state.currentNiveau);
      levelDb[subjectName] = chapitres;
    }
  }

  // Tri strict garanti par Situations d'Apprentissage (SA 1 -> SA 2 -> ...)
  chapitres = sortChaptersByCurriculumOrder(chapitres).map((chap, idx) => ({
    ...chap,
    num: idx + 1
  }));
  levelDb[subjectName] = chapitres;

  listElem.innerHTML = chapitres.map(chap => {
    const isUnlocked = chap.isFree || state.unlockedChapterIds.includes(chap.id);
    const saMatch = (chap.title || '').match(/\bSA\s*(\d+)\b/i) || (chap.sa || '').match(/\bSA\s*(\d+)\b/i);
    const saBadgeHtml = saMatch ? `<span class="mini-badge sa-badge">${saMatch[0].toUpperCase()}</span>` : '';

    return `
      <div class="chapitre-card ${isUnlocked ? 'unlocked' : 'locked'}">
        <div class="chap-info">
          <div style="display:flex; gap:8px; align-items:center; margin-bottom:6px; flex-wrap:wrap;">
            <span class="chip-num">Chap. ${chap.num}</span>
            ${saBadgeHtml}
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
  if (!all.length) return null;

  // 1. Correspondance exacte par ID (UUID Supabase ou ID généré)
  let found = all.find(c => String(c.id) === String(chapId));
  if (found) return found;

  // 2. Fallback : chapId est parfois un index numérique ou contient des chiffres
  const numericMatch = String(chapId).match(/(\d+)/);
  if (numericMatch) {
    const num = parseInt(numericMatch[1], 10);
    if (!Number.isNaN(num)) {
      // Priorité : chapitre du niveau/série courant (state)
      const currentSubj = (document.getElementById('matiereTitle')?.textContent || '').split(' — ')[0].trim();
      const fromState = all.find(c =>
        c.niveau === state.currentNiveau &&
        (!currentSubj || c.subject === currentSubj) &&
        c.num === num
      );
      if (fromState) return fromState;

      // Sinon, premier chapitre avec ce num
      const byNum = all.find(c => c.num === num);
      if (byNum) return byNum;
    }
  }

  return null;
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

        ${(chapter.exercices && chapter.exercices.length > 0) ? chapter.exercices.map((ex, idx) => `
        <div style="margin-bottom:20px;">
          <h3 style="color:#d97706; margin-bottom:8px;">✏️ ${escapeStr(ex.consigne || ('Exercice ' + (idx+1)))}</h3>
          <div style="background:#fffbeb; padding:18px; border-radius:8px; border:1px solid #fde68a;">
            <p style="margin-top:0;"><strong>Question :</strong> ${escapeStr(ex.question)}</p>
            <div id="exerciseArea_${chapId}_${idx}" style="margin:14px 0;">
              ${ex.type === 'vf' ? `
                <label style="display:block; margin-bottom:8px; cursor:pointer;"><input type="radio" name="exOpt_${chapId}_${idx}" value="vrai"> VRAI</label>
                <label style="display:block; margin-bottom:8px; cursor:pointer;"><input type="radio" name="exOpt_${chapId}_${idx}" value="faux"> FAUX</label>
              ` : (ex.options || []).map(opt => `
                <label style="display:block; margin-bottom:8px; cursor:pointer; color:#1e293b;">
                  <input type="radio" name="exOpt_${chapId}_${idx}" value="${opt.charAt(0).toLowerCase()}" style="margin-right:8px;">
                  ${escapeStr(cleanQuizOption(opt))}
                </label>
              `).join('')}
            </div>
            <button class="btn btn-primary" onclick="checkChapterSingleExercise('${chapId}', ${idx})" style="margin-top:8px;">Vérifier ma réponse</button>
            <div id="chapExFeedback_${chapId}_${idx}" style="margin-top:12px; display:none; padding:12px; border-radius:6px; font-weight:500; line-height:1.6;"></div>
          </div>
        </div>
        `).join('') : (chapter.exercice ? `
        <div style="margin-bottom:20px;">
          <h3 style="color:#d97706; margin-bottom:8px;">✏️ ${escapeStr(chapter.exercice.consigne || 'Exercice QCM / Vrai-Faux')}</h3>
          <div style="background:#fffbeb; padding:18px; border-radius:8px; border:1px solid #fde68a;">
            <p style="margin-top:0;"><strong>Question :</strong> ${escapeStr(chapter.exercice.question)}</p>
            <div id="exerciseArea_${chapId}_0" style="margin:14px 0;">
              ${chapter.exercice.type === 'vf' ? `
                <label style="display:block; margin-bottom:8px; cursor:pointer;"><input type="radio" name="exOpt_${chapId}_0" value="vrai"> VRAI</label>
                <label style="display:block; margin-bottom:8px; cursor:pointer;"><input type="radio" name="exOpt_${chapId}_0" value="faux"> FAUX</label>
              ` : (chapter.exercice.options || []).map(opt => `
                <label style="display:block; margin-bottom:8px; cursor:pointer; color:#1e293b;">
                  <input type="radio" name="exOpt_${chapId}_0" value="${opt.charAt(0).toLowerCase()}" style="margin-right:8px;">
                  ${escapeStr(cleanQuizOption(opt))}
                </label>
              `).join('')}
            </div>
            <button class="btn btn-primary" onclick="checkChapterSingleExercise('${chapId}', 0)" style="margin-top:8px;">Vérifier ma réponse</button>
            <div id="chapExFeedback_${chapId}_0" style="margin-top:12px; display:none; padding:12px; border-radius:6px; font-weight:500; line-height:1.6;"></div>
          </div>
        </div>
        ` : '')}

      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHtml);
  if (window.MathJax) setTimeout(() => MathJax.typesetPromise(), 100);
}

function checkChapterSingleExercise(chapId, exIndex) {
  const chapter = findChapterByIdAny(chapId);
  if (!chapter) return;

  // Determine which exercise object to use
  const ex = (chapter.exercices && chapter.exercices[exIndex]) ? chapter.exercices[exIndex] : chapter.exercice;
  if (!ex) return;

  const selected = document.querySelector(`input[name="exOpt_${chapId}_${exIndex}"]:checked`);
  const feedback = document.getElementById(`chapExFeedback_${chapId}_${exIndex}`);
  if (!feedback) return;

  if (!selected) {
    alert("Veuillez d'abord sélectionner une réponse.");
    return;
  }

  feedback.style.display = 'block';
  let ok = false;
  if (ex.type === 'vf') {
    const correct = String(ex.correctOption || '').toLowerCase();
    ok = selected.value === correct;
  } else {
    const correct = String(ex.correctOption || '').toLowerCase();
    ok = selected.value === correct;
  }

  if (ok) {
    feedback.style.background = '#dcfce7';
    feedback.style.color = '#166534';
    feedback.innerHTML = `<strong>✅ Bravo !</strong> Bonne réponse.<br>${escapeStr(ex.explication || 'Excellent travail.')}`;
  } else {
    feedback.style.background = '#fee2e2';
    feedback.style.color = '#991b1b';
    const correctTxt = ex.type === 'vf'
      ? (String(ex.correctOption || '').toLowerCase() === 'vrai' ? 'VRAI' : 'FAUX')
      : `Réponse : ${String(ex.correctOption || '').toUpperCase()}`;
    feedback.innerHTML = `<strong>❌ Incorrect.</strong> La bonne réponse était <strong>${correctTxt}</strong>.<br>${escapeStr(ex.explication || 'Revois le cours et réessaie !')}`;
  }
}

// Backward-compat wrapper (used by old inline HTML)
function checkChapterExercise(chapId) {
  checkChapterSingleExercise(chapId, 0);
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
  const selectedRole = document.querySelector('input[name="loginRole"]:checked')?.value || 'client';

  if (!email || !pass) {
    alert("Veuillez renseigner votre email et mot de passe.");
    return false;
  }

  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password: pass });
  if (error) {
    let msg = error.message;
    if (msg.includes('Invalid login credentials')) {
      msg = "Adresse email ou mot de passe incorrect.";
    } else if (msg.includes('Email not confirmed')) {
      msg = "Votre adresse email n'a pas encore été confirmée. Veuillez cliquer sur le lien reçu par email.";
    } else if (msg.includes('Too many requests')) {
      msg = "Trop de tentatives de connexion. Veuillez patienter un court instant avant de réessayer.";
    }
    alert("Connexion impossible : " + msg);
    return false;
  }

  await hydrateUser(data.user);
  await loadUserUnlocks(data.user.id);
  updateNavbar();
  await loadPublicStats();
  renderHomeStats();

  if (state.user.role === 'admin') {
    await loadAdminData();
    go('admin-dashboard');
  } else {
    if (selectedRole === 'admin') {
      alert("Connexion réussie ! Note : Ce compte est enregistré comme élève et n'a pas accès à l'administration. Redirection vers votre Espace Élève.");
    }
    go('client-dashboard');
    renderClientDashboard();
  }
  return false;
}

async function countAdmins() {
  if (!supabaseClient) return 0;
  try {
    const { count, error } = await supabaseClient
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'admin');
    if (!error && typeof count === 'number') return count;
  } catch (err) {
    console.warn('Erreur vérification limite admin', err);
  }
  return state.usersList.filter(u => u.role === 'admin').length;
}

async function handleSignup(e) {
  if (e && e.preventDefault) e.preventDefault();
  if (!requireSupabase()) return false;

  const name = document.getElementById('signupName').value.trim();
  const email = document.getElementById('signupEmail').value.trim();
  const pass = document.getElementById('signupPass').value;
  const passConf = document.getElementById('signupPassConfirm').value;
  const role = document.querySelector('input[name="signupRole"]:checked')?.value || 'client';

  if (!name || !email || !pass || !passConf) {
    alert("Veuillez remplir tous les champs.");
    return false;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    alert("Veuillez saisir une adresse email valide.");
    return false;
  }

  if (pass.length < 6) {
    alert("Le mot de passe doit contenir au moins 6 caractères.");
    return false;
  }

  if (pass !== passConf) {
    alert("⚠️ Les deux mots de passe ne correspondent pas !");
    return false;
  }

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
    let msg = error.message;
    if (msg.includes('User already registered')) {
      msg = "Un compte existe déjà avec cette adresse email. Veuillez vous connecter.";
    } else if (msg.includes('Password should be at least 6 characters')) {
      msg = "Le mot de passe doit comporter au moins 6 caractères.";
    }
    alert("Inscription impossible : " + msg);
    return false;
  }

  if (!data.session) {
    alert("🎉 Compte créé avec succès ! Un e-mail de confirmation vous a été envoyé. Veuillez confirmer votre email puis vous connecter.");
    switchAuthTab('login');
    const loginEmailInput = document.getElementById('loginEmail');
    if (loginEmailInput) loginEmailInput.value = email;
    return false;
  }

  await hydrateUser(data.user);
  await loadUserUnlocks(data.user.id);
  updateNavbar();
  await loadPublicStats();
  renderHomeStats();

  if (state.user.role === 'admin') {
    await loadAdminData();
    go('admin-dashboard');
  } else {
    go('client-dashboard');
    renderClientDashboard();
  }
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
  const exList = (Array.isArray(pick.exercices) && pick.exercices.length > 0) ? pick.exercices : (pick.exercice ? [pick.exercice] : []);
  const currentEx = exList.length > 0 ? exList[Math.floor(Math.random() * exList.length)] : pick.exercice;

  state.currentClientQcm = pick;
  state.currentClientQcmExercise = currentEx;

  const isVf = currentEx.type === 'vf';
  container.innerHTML = `
    <h3><i data-lucide="check-square"></i> Test de Connaissances — ${escapeStr(pick.subject)} (${pick.niveau.toUpperCase()})</h3>
    <p class="text-muted" style="margin-bottom:20px;">
      Question tirée aléatoirement de tes cours débloqués — <em>${escapeStr(pick.title)}</em>
    </p>

    <div class="qcm-card">
      <div class="qcm-question" id="qcmQuestionText">
        <strong>${escapeStr(currentEx.consigne || 'Question')} :</strong> ${escapeStr(currentEx.question)}
        <div style="margin-top:8px;"><span class="mini-badge ${isVf ? 'paid' : 'serie'}">${isVf ? 'VRAI / FAUX' : 'QCM'}</span></div>
      </div>
      <div class="qcm-options" id="qcmOptionsBox">
        ${isVf ? `
          <label class="qcm-opt"><input type="radio" name="qcmOpt" value="vrai"> <span>VRAI</span></label>
          <label class="qcm-opt"><input type="radio" name="qcmOpt" value="faux"> <span>FAUX</span></label>
        ` : (currentEx.options || []).map(opt => `
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
  const ex = state.currentClientQcmExercise || (pick && pick.exercice);
  if (!pick || !ex) return;
  const isVf = ex.type === 'vf';
  let ok;
  if (isVf) ok = selected.value === (ex.correctOption === 'vrai' ? 'vrai' : 'faux');
  else ok = selected.value === String(ex.correctOption || '').toLowerCase();

  feedback.style.display = 'block';
  if (ok) {
    feedback.className = 'qcm-feedback success';
    feedback.innerHTML = `<strong>✅ Bravo, bon travail !</strong><br>${escapeStr(ex.explication || '')}`;
  } else {
    const correct = isVf
      ? (ex.correctOption === 'vrai' ? 'VRAI' : 'FAUX')
      : `Option ${String(ex.correctOption || '').toUpperCase()}`;
    feedback.className = 'qcm-feedback error';
    feedback.innerHTML = `<strong>❌ Raté.</strong> La bonne réponse était <strong>${correct}</strong>.<br>${escapeStr(ex.explication || '')}`;
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

async function loadAdminData() {
  if (!supabaseClient || !state.user || state.user.role !== 'admin') return;

  try {
    // 1. Charger tous les profils réels d'utilisateurs depuis Supabase
    const { data: users, error: uErr } = await supabaseClient
      .from('profiles')
      .select('id, email, name, role, niveau, created_at')
      .order('created_at', { ascending: false });

    if (!uErr && Array.isArray(users)) {
      state.usersList = users;
    }

    // 2. Charger toutes les transactions réelles depuis Supabase
    const { data: txs, error: txErr } = await supabaseClient
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false });

    if (!txErr && Array.isArray(txs)) {
      state.transactions = txs.map(t => ({
        date: t.created_at ? new Date(t.created_at).toLocaleDateString('fr-FR') : 'Récent',
        phone: t.phone || 'Non renseigné',
        provider: (t.provider || 'MoMo').toUpperCase(),
        chapter: t.chapter_title || t.chapter_id || 'Chapitre',
        amount: `${t.amount || 0} FCFA`
      }));
      state.adminStats.revenue = txs.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    }

    // 3. Compter les fiches / chapitres publiés
    const { count: chCount, error: chErr } = await supabaseClient
      .from('chapters')
      .select('id', { count: 'exact', head: true });

    if (!chErr && typeof chCount === 'number') {
      state.adminStats.fichesCount = chCount;
    }

    state.adminStats.studentsCount = state.usersList.filter(u => u.role === 'client').length;
    renderAdminDashboard();
  } catch (err) {
    console.warn('Erreur chargement données admin Supabase:', err);
    renderAdminDashboard();
  }
}

function renderAdminDashboard() {
  const rev = document.getElementById("adminTotalRevenue");
  if (rev) rev.innerText = state.adminStats.revenue.toLocaleString() + " FCFA";

  const elevesEl = document.getElementById("statElevesActifs");
  if (elevesEl) elevesEl.innerText = state.adminStats.studentsCount || state.usersList.filter(u => u.role === 'client').length;

  const fichesEl = document.getElementById("statFichesPubilees");
  if (fichesEl) fichesEl.innerText = state.adminStats.fichesCount || 0;

  const txTable = document.getElementById("adminTxTableBody");
  if (txTable) {
    if (state.transactions.length === 0) {
      txTable.innerHTML = `
        <tr>
          <td colspan="5" style="text-align:center; padding:20px; color:var(--text-muted);">
            Aucune transaction enregistrée pour le moment.
          </td>
        </tr>`;
    } else {
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
  }

  const userList = document.getElementById("adminUserList");
  if (userList) {
    if (state.usersList.length === 0) {
      userList.innerHTML = `
        <li style="text-align:center; padding:15px; color:var(--text-muted); justify-content:center;">
          Aucun élève inscrit pour le moment.
        </li>`;
    } else {
      userList.innerHTML = state.usersList.map(u => `
        <li>
          <div><strong>${escapeStr(u.name || 'Utilisateur')}</strong> (${escapeStr(u.email || '')})</div>
          <span class="badge-free">${u.role === 'admin' ? 'Admin' : `Élève ${u.niveau === 'bac' ? 'BAC' : 'Brevet'}`}</span>
        </li>`).join('');
    }
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
  const price = 100;
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

// ============================================================================
// LECTEUR VIDÉO INTERACTIF REVIZY ("Comment ça marche ?")
// ============================================================================
let interactiveVideoState = {
  currentScene: 1,
  totalScenes: 6,
  isPlaying: false,
  timer: null,
  sceneDurationSec: 12, // 12 secondes par scène en lecture auto
  elapsedInScene: 0
};

function openInteractiveVideoModal() {
  const modal = document.getElementById('modalInteractiveVideo');
  if (!modal) return;
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
  setInteractiveVideoScene(1);
  startInteractiveVideoPlayback();
}

function closeInteractiveVideoModal() {
  const modal = document.getElementById('modalInteractiveVideo');
  if (!modal) return;
  pauseInteractiveVideoPlayback();
  modal.style.display = 'none';
  document.body.style.overflow = '';
}

function setInteractiveVideoScene(sceneNumber) {
  if (sceneNumber < 1 || sceneNumber > interactiveVideoState.totalScenes) return;
  interactiveVideoState.currentScene = sceneNumber;
  interactiveVideoState.elapsedInScene = 0;

  // Masquer toutes les scènes, afficher l'active
  for (let i = 1; i <= interactiveVideoState.totalScenes; i++) {
    const sceneElem = document.getElementById(`videoScene${i}`);
    const dotElem = document.getElementById(`videoSceneDot${i}`);
    if (sceneElem) sceneElem.classList.toggle('active', i === sceneNumber);
    if (dotElem) dotElem.classList.toggle('active', i === sceneNumber);
  }

  // Mettre à jour le titre et le compteur
  const titleElem = document.getElementById('videoSceneTitle');
  const counterElem = document.getElementById('videoSceneCounter');
  if (counterElem) counterElem.textContent = `Étape ${sceneNumber} / ${interactiveVideoState.totalScenes}`;

  const titles = [
    "1. Choisis ton examen et ta série (Brevet ou BAC A, B, C, D, G)",
    "2. 3 chapitres 100% gratuits par matière pour tester immédiatement",
    "3. Fiches de cours synthétiques & exemples résolus officiels",
    "4. 6 exercices d'entraînement interactifs avec corrigés détaillés",
    "5. Déblocage instantané par Mobile Money (MTN, Moov, Celtiis)",
    "6. Tuteur IA intelligent disponible 24h/24 pour répondre à tes doutes"
  ];
  if (titleElem) titleElem.textContent = titles[sceneNumber - 1] || "Guide Revizy";

  updateInteractiveVideoProgressBar();
}

function updateInteractiveVideoProgressBar() {
  const bar = document.getElementById('videoProgressBar');
  if (!bar) return;
  const progressPercent = ((interactiveVideoState.currentScene - 1) / interactiveVideoState.totalScenes) * 100;
  bar.style.width = `${progressPercent}%`;
}

function startInteractiveVideoPlayback() {
  interactiveVideoState.isPlaying = true;
  const playBtn = document.getElementById('videoPlayPauseBtn');
  if (playBtn) playBtn.innerHTML = '⏸ Pause';

  if (interactiveVideoState.timer) clearInterval(interactiveVideoState.timer);
  interactiveVideoState.timer = setInterval(() => {
    interactiveVideoState.elapsedInScene++;
    const progressPercent = ((interactiveVideoState.currentScene - 1 + (interactiveVideoState.elapsedInScene / interactiveVideoState.sceneDurationSec)) / interactiveVideoState.totalScenes) * 100;
    const bar = document.getElementById('videoProgressBar');
    if (bar) bar.style.width = `${Math.min(100, progressPercent)}%`;

    if (interactiveVideoState.elapsedInScene >= interactiveVideoState.sceneDurationSec) {
      if (interactiveVideoState.currentScene < interactiveVideoState.totalScenes) {
        setInteractiveVideoScene(interactiveVideoState.currentScene + 1);
      } else {
        pauseInteractiveVideoPlayback();
      }
    }
  }, 1000);
}

function pauseInteractiveVideoPlayback() {
  interactiveVideoState.isPlaying = false;
  const playBtn = document.getElementById('videoPlayPauseBtn');
  if (playBtn) playBtn.innerHTML = '▶ Lecture';
  if (interactiveVideoState.timer) {
    clearInterval(interactiveVideoState.timer);
    interactiveVideoState.timer = null;
  }
}

function toggleInteractiveVideoPlay() {
  if (interactiveVideoState.isPlaying) {
    pauseInteractiveVideoPlayback();
  } else {
    if (interactiveVideoState.currentScene >= interactiveVideoState.totalScenes && interactiveVideoState.elapsedInScene >= interactiveVideoState.sceneDurationSec) {
      setInteractiveVideoScene(1);
    }
    startInteractiveVideoPlayback();
  }
}

function prevInteractiveVideoScene() {
  if (interactiveVideoState.currentScene > 1) {
    setInteractiveVideoScene(interactiveVideoState.currentScene - 1);
  }
}

function nextInteractiveVideoScene() {
  if (interactiveVideoState.currentScene < interactiveVideoState.totalScenes) {
    setInteractiveVideoScene(interactiveVideoState.currentScene + 1);
  }
}

function testInteractiveVideoQuiz(choice, isCorrect) {
  const feedback = document.getElementById('videoQuizFeedback');
  if (!feedback) return;
  feedback.style.display = 'block';
  if (isCorrect) {
    feedback.className = 'quiz-feedback success';
    feedback.innerHTML = '🎉 <strong>Bravo ! Exact !</strong> La vitesse de propagation est v = λ × f. Tu vois comme c\'est simple et motivant de s\'entraîner avec Revizy ?';
  } else {
    feedback.className = 'quiz-feedback error';
    feedback.innerHTML = '❌ <strong>Pas tout à fait !</strong> La formule officielle est v = λ × f. Pas de panique : chaque question a une explication détaillée dans Revizy !';
  }
}