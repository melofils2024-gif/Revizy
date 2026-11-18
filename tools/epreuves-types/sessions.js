/**
 * Épreuves types Revisy — sessions 2023, 2024 et 2025.
 *
 * Objectif : que chaque élève, quelle que soit sa classe et sa série, trouve
 * plusieurs épreuves téléchargeables (sujet ET corrigé). Les documents sont
 * ORIGINAUX, écrits en interne à partir des programmes officiels : aucun sujet
 * officiel n'est recopié, on peut donc les héberger et les redistribuer.
 *
 * Le générateur assemble 3 exercices par épreuve, choisis dans la banque de la
 * matière avec un décalage lié à l'année : deux sessions ne donnent donc jamais
 * exactement le même sujet.
 */

const ANNEES = [2023, 2024, 2025];
const LICENCE = "Document original Revisy — libre de reproduction et de rediffusion";
const SOURCE_URL = "https://revisy.onrender.com";
const POINTS = [7, 7, 6];

/** Raccourci de déclaration d'un exercice. */
function ex(titre, enonce, questions, reponses) {
  return { titre, enonce, questions, reponses };
}

// ══════════════════════════════════════════════════════════════════════════
// BREVET — 3e
// ══════════════════════════════════════════════════════════════════════════

const BANQUES = {
  "BEPC|Mathématiques": {
    duree: "2 heures",
    coefficient: 4,
    exercices: [
      ex("Calcul numérique",
        "On donne A = 5/6 + 3/4 ; B = 2/3 × 9/8 ; C = (1,25 + 0,75) ÷ 0,5.",
        ["a) Calcule A et donne le résultat sous forme de fraction irréductible.",
         "b) Calcule B et simplifie.",
         "c) Calcule C."],
        ["a) 5/6 + 3/4 = 10/12 + 9/12 = 19/12.",
         "b) 2/3 × 9/8 = 18/24 = 3/4.",
         "c) 1,25 + 0,75 = 2, donc C = 2 ÷ 0,5 = 4."]),
      ex("Proportionnalité et pourcentages",
        "Un carnet coûte 350 F CFA. Un libraire commande 24 carnets et obtient une remise de 10 % sur le montant total.",
        ["a) Calcule le montant de la commande avant la remise.",
         "b) Calcule le montant de la remise.",
         "c) Déduis le prix réellement payé."],
        ["a) 24 × 350 = 8 400 F CFA.",
         "b) 8 400 × 10/100 = 840 F CFA.",
         "c) 8 400 − 840 = 7 560 F CFA."]),
      ex("Théorème de Thalès",
        "Dans un triangle ABC, E appartient à [AB] et F appartient à [AC]. On sait que (EF) est parallèle à (BC), AE = 4 cm, AB = 10 cm, AC = 25 cm et BC = 20 cm.",
        ["a) Calcule le rapport AE/AB.",
         "b) Calcule la longueur AF.",
         "c) Calcule la longueur EF."],
        ["a) AE/AB = 4/10 = 2/5.",
         "b) AF/AC = 2/5 donc AF = 25 × 2/5 = 10 cm.",
         "c) EF/BC = 2/5 donc EF = 20 × 2/5 = 8 cm."]),
      ex("Statistiques",
        "Voici les notes sur 20 obtenues par 8 élèves : 7 ; 9 ; 11 ; 11 ; 13 ; 15 ; 17 ; 19.",
        ["a) Calcule la moyenne de la série.",
         "b) Détermine la médiane.",
         "c) Calcule l'étendue."],
        ["a) Somme = 102, moyenne = 102/8 = 12,75.",
         "b) 8 valeurs : la médiane est la moyenne des 4e et 5e valeurs, soit (11 + 13)/2 = 12.",
         "c) Étendue = 19 − 7 = 12."])
    ]
  },

  "BEPC|Français": {
    duree: "2 heures",
    coefficient: 3,
    exercices: [
      ex("Compréhension de texte",
        "Chaque matin, Awa traverse le marché de Dantokpa pour rejoindre son lycée. Elle y apprend à négocier un prix, à écouter les langues qui se croisent et à observer les gestes des commerçantes. Un jour, elle comprend que ce marché est sa première école.",
        ["a) Où se déroule la scène ?",
         "b) Cite deux choses que le marché apprend à Awa.",
         "c) Explique l'expression « sa première école »."],
        ["a) Au marché de Dantokpa, à Cotonou.",
         "b) La négociation des prix et l'observation des gestes des commerçantes (aussi : l'écoute des langues).",
         "c) Le marché est pour elle un lieu d'apprentissage informel : elle y apprend des savoir-faire utiles à la vie."]),
      ex("Grammaire et fonctions",
        "Soit la phrase : « Les élèves studieux préparent leurs épreuves avec sérieux. »",
        ["a) Donne la nature et la fonction de « studieux ».",
         "b) Quelle est la fonction de « leurs épreuves » ?",
         "c) Quelle est la nature de « avec sérieux » ?"],
        ["a) Adjectif qualificatif, épithète du nom « élèves ».",
         "b) Complément d'objet direct du verbe « préparent ».",
         "c) Groupe nominal prépositionnel, complément circonstanciel de manière."]),
      ex("Conjugaison",
        "Conjugue les verbes entre parenthèses à la 1re personne du pluriel, au temps demandé.",
        ["a) (finir) — passé composé.",
         "b) (aller) — futur simple.",
         "c) (prendre) — imparfait."],
        ["a) Nous avons fini.",
         "b) Nous irons.",
         "c) Nous prenions."]),
      ex("Production écrite",
        "Sujet : raconte en une vingtaine de lignes un moment où tu as aidé quelqu'un, à l'école ou dans ton quartier.",
        ["a) Utilise la 1re personne et le passé composé.",
         "b) Décris au moins deux émotions ressenties.",
         "c) Termine par une phrase qui explique ce que cette expérience t'a apporté."],
        ["Critères de réussite : récit cohérent avec chronologie claire (4 pts) ; description des émotions (3 pts) ; phrase de conclusion personnelle (2 pts) ; langue correcte (orthographe, accords, ponctuation : 5 pts) ; présentation (2 pts)."])
    ]
  },

  "BEPC|Physique-Chimie-Technologie": {
    duree: "1 h 30",
    coefficient: 2,
    exercices: [
      ex("Électricité — loi d'Ohm",
        "Un conducteur ohmique de résistance R = 25 Ω est traversé par un courant d'intensité I = 0,4 A.",
        ["a) Calcule la tension U aux bornes du conducteur.",
         "b) Calcule la puissance dissipée P = U × I.",
         "c) Quelle énergie consomme-t-il en 2 heures ?"],
        ["a) U = R × I = 25 × 0,4 = 10 V.",
         "b) P = U × I = 10 × 0,4 = 4 W.",
         "c) E = P × t = 4 × 2 = 8 Wh."]),
      ex("Mécanique — vitesse moyenne",
        "Un car de transport effectue le trajet Cotonou–Parakou, soit 180 km, en 2 h 30 min.",
        ["a) Exprime la durée en heures décimales.",
         "b) Calcule la vitesse moyenne du car en km/h.",
         "c) Quelle distance parcourt-il en 45 min à la même vitesse ?"],
        ["a) 2 h 30 min = 2,5 h.",
         "b) v = d/t = 180/2,5 = 72 km/h.",
         "c) 45 min = 0,75 h, donc d = 72 × 0,75 = 54 km."]),
      ex("Chimie — masse volumique",
        "On pèse 780 g d'un liquide transparent et on mesure un volume de 1 L (soit 1 000 cm³).",
        ["a) Calcule la masse volumique du liquide en g/cm³.",
         "b) À quel liquide courant cela correspond-il ?",
         "c) Quelle est la masse de 0,25 L de ce liquide ?"],
        ["a) ρ = m/V = 780/1 000 = 0,78 g/cm³.",
         "b) À de l'alcool (éthanol), dont la masse volumique vaut environ 0,79 g/cm³.",
         "c) m = ρ × V = 0,78 × 250 = 195 g."]),
      ex("Technologie — circuit électrique",
        "Une lampe torche fonctionne avec deux piles plates montées en série et un interrupteur.",
        ["a) Quel est le rôle de l'interrupteur ?",
         "b) Que se passe-t-il pour la tension disponible lorsque des piles sont montées en série ?",
         "c) Pourquoi la lampe s'éteint-elle quand le filament grille ?"],
        ["a) Il ouvre ou ferme le circuit : il autorise ou coupe le passage du courant.",
         "b) Les tensions s'additionnent : deux piles de 1,5 V fournissent 3 V.",
         "c) Le filament fondu ouvre le circuit : le courant ne peut plus circuler."])
    ]
  },

  "BEPC|SVT": {
    duree: "1 h 30",
    coefficient: 2,
    exercices: [
      ex("La digestion",
        "Les aliments suivent un long trajet dans le tube digestif avant d'être utilisés par l'organisme.",
        ["a) Cite dans l'ordre les organes traversés par les aliments.",
         "b) Quel est le rôle des enzymes digestives ?",
         "c) Pourquoi dit-on que l'intestin grêle est le lieu principal de l'absorption ?"],
        ["a) Bouche œsophage estomac intestin grêle gros intestin, puis rectum et anus.",
         "b) Elles découpent les grosses molécules (amidon, protéines, lipides) en petites molécules assimilables.",
         "c) Sa paroi est tapissée de villosités qui augmentent la surface d'échange avec le sang."]),
      ex("Reproduction des plantes à fleurs",
        "Une fleur d'hibiscus produit des graines après la visite des abeilles.",
        ["a) Comment appelle-t-on le transport du pollen par les abeilles ?",
         "b) Que devient l'ovule après la fécondation ?",
         "c) Cite un moyen de dispersion des graines."],
        ["a) La pollinisation (entomogame, par les insectes).",
         "b) Il se transforme en graine.",
         "c) Le vent, l'eau, les animaux (transport par les oiseaux ou les mammifères)."]),
      ex("La respiration",
        "À l'effort, la fréquence respiratoire augmente nettement.",
        ["a) Cite les deux gaz échangés au niveau des alvéoles pulmonaires.",
         "b) Quel gaz le sang rejette-t-il au niveau des poumons ?",
         "c) Explique pourquoi la respiration s'accélère pendant un effort."],
        ["a) Le dioxygène (O2) absorbé et le dioxyde de carbone (CO2) rejeté.",
         "b) Le dioxyde de carbone.",
         "c) Les muscles consomment plus de dioxygène et produisent plus de CO2 : la respiration s'accélère pour assurer ces échanges."]),
      ex("Santé — le paludisme",
        "Le paludisme reste la première cause de consultation dans les centres de santé du Bénin.",
        ["a) Quel est l'agent responsable du paludisme ?",
         "b) Quel insecte transmet la maladie ?",
         "c) Cite deux moyens de prévention."],
        ["a) Un parasite du genre Plasmodium.",
         "b) La femelle de l'anophèle, un moustique.",
         "c) Dormir sous une moustiquaire imprégnée et éliminer les eaux stagnantes autour de la maison."])
    ]
  },

  "BEPC|Histoire-Géographie": {
    duree: "1 h 30",
    coefficient: 2,
    exercices: [
      ex("La colonisation en Afrique de l'Ouest",
        "À la fin du XIXe siècle, les puissances européennes se partagent le continent africain.",
        ["a) Cite deux causes de la colonisation.",
         "b) Quelle conférence organise le partage de l'Afrique en 1884-1885 ?",
         "c) Donne un exemple de résistance à la colonisation."],
        ["a) Causes économiques (débouchés, matières premières), politiques (prestige national) et idéologiques (mission civilisatrice).",
         "b) La conférence de Berlin.",
         "c) La résistance de Béhanzin au Dahomey, ou celle de Samory Touré."]),
      ex("Les indépendances africaines",
        "En 1960, dix-sept pays africains accèdent à l'indépendance.",
        ["a) Quelle est l'année de l'indépendance du Dahomey (Bénin) ?",
         "b) Cite deux défis des jeunes États indépendants.",
         "c) Qu'est-ce que le néocolonialisme ?"],
        ["a) Le 1er août 1960.",
         "b) Construire un État et une administration ; développer l'économie et l'école.",
         "c) Une dépendance économique et politique persistante vis-à-vis des anciennes puissances."]),
      ex("Le relief et le climat du Bénin",
        "Le Bénin s'étend du golfe de Guinée au fleuve Niger.",
        ["a) Cite les deux grandes zones de relief du pays.",
         "b) Quel climat règne dans le sud ? Et dans le nord ?",
         "c) Quel est le fleuve principal du Bénin ?"],
        ["a) La plaine côtière au sud et les plateaux de l'intérieur.",
         "b) Climat subéquatorial au sud (deux saisons des pluies), climat soudanien au nord (une seule).",
         "c) Le Niger, avec ses affluents l'Ouémé et la Volta noire."]),
      ex("Population et agriculture",
        "L'agriculture occupe une grande partie de la population active béninoise.",
        ["a) Cite deux cultures de rente.",
         "b) Cite deux cultures vivrières.",
         "c) Explique la forte croissance urbaine de Cotonou."],
        ["a) Le coton et l'ananas (aussi : le palmier à huile, la noix de cajou).",
         "b) Le maïs et le manioc (aussi : l'igname, le sorgho, le riz).",
         "c) L'exode rural, la concentration des emplois et des services, la croissance démographique."])
    ]
  },

  "BEPC|Anglais": {
    duree: "1 h 30",
    coefficient: 2,
    exercices: [
      ex("Reading comprehension",
        "Koffi lives in Porto-Novo. Every Saturday, he goes to the market with his mother. She sells tomatoes and peppers. Koffi helps her carry the baskets and counts the money. He says he learns more there than in any business class.",
        ["a) Where does Koffi live?",
         "b) What does his mother sell?",
         "c) Why does Koffi like going to the market?"],
        ["a) He lives in Porto-Novo.",
         "b) She sells tomatoes and peppers.",
         "c) Because he learns a lot about business there."]),
      ex("Grammar — tenses",
        "Complete the sentences with the correct form of the verb.",
        ["a) I … (live) in Cotonou since 2019.",
         "b) Yesterday, she … (study) for three hours.",
         "c) They … (not / finish) their homework yet."],
        ["a) have lived (present perfect, action started in the past and still true).",
         "b) studied (simple past, finished action).",
         "c) have not finished / haven't finished (present perfect with « yet »)."]),
      ex("Vocabulary",
        "Match each word with its meaning.",
        ["a) A fee   b) A subject   c) A timetable",
         "1. The list of hours for classes   2. The amount of money you pay   3. What you study at school"],
        ["a) A fee → 2. The amount of money you pay.",
         "b) A subject → 3. What you study at school.",
         "c) A timetable → 1. The list of hours for classes."]),
      ex("Writing",
        "Write a short paragraph (60 to 80 words) about your favourite school subject.",
        ["a) Say which subject you prefer and why.",
         "b) Give two reasons.",
         "c) Use at least one linking word (because, however, therefore)."],
        ["Exemple de réponse : « My favourite subject is mathematics because it teaches me to think clearly. However, it is not always easy: some exercises need a lot of practice. Therefore I work every evening and I ask my teacher when I do not understand. I want to become an engineer, so mathematics is essential for my future. »"])
    ]
  },

  "BEPC|Éducation civique et morale": {
    duree: "1 h",
    coefficient: 1,
    exercices: [
      ex("Droits et devoirs du citoyen",
        "Vivre en société suppose des droits reconnus à chacun et des devoirs envers les autres.",
        ["a) Cite deux droits fondamentaux de l'enfant.",
         "b) Cite deux devoirs du citoyen.",
         "c) Explique pourquoi un droit s'accompagne toujours d'un devoir."],
        ["a) Le droit à l'éducation et le droit à la santé (aussi : protection contre la violence).",
         "b) Respecter la loi et payer ses impôts (aussi : respecter les autres, protéger les biens publics).",
         "c) Le droit de l'un devient l'obligation de l'autre : mon droit à l'éducation suppose le devoir de respecter mes enseignants et mes camarades."]),
      ex("Démocratie et élections",
        "Dans une démocratie, les citoyens choisissent leurs dirigeants par le vote.",
        ["a) Qu'est-ce qu'une élection libre et transparente ?",
         "b) À quel âge vote-t-on au Bénin ?",
         "c) Cite deux qualités d'un bon citoyen électeur."],
        ["a) Une élection où chacun vote sans pression et où les résultats sont publiés honnêtement.",
         "b) À 18 ans.",
         "c) S'informer avant de voter et accepter le résultat des urnes."]),
      ex("Protection de l'environnement",
        "Les déchets plastiques envahissent les quartiers et bouchent les caniveaux.",
        ["a) Cite deux conséquences de cette pollution.",
         "b) Propose deux gestes simples pour réduire les déchets.",
         "c) Quel est le rôle de la commune dans la gestion des déchets ?"],
        ["a) Inondations dues aux caniveaux bouchés et maladies liées à l'eau stagnante.",
         "b) Trier ses déchets et utiliser un sac réutilisable (aussi : ne pas jeter dans la rue).",
         "c) Organiser la collecte, installer des points de dépôt et sensibiliser les habitants."]),
      ex("La vie scolaire",
        "Le règlement intérieur d'un collège fixe les règles de la vie commune.",
        ["a) Cite deux règles du règlement intérieur.",
         "b) Pourquoi ces règles sont-elles nécessaires ?",
         "c) Que risque un élève qui les transgresse ?"],
        ["a) Arriver à l'heure et respecter le personnel (aussi : ne pas utiliser le téléphone en classe).",
         "b) Pour garantir la sécurité et permettre le travail de tous.",
         "c) Une sanction prévue par le règlement : avertissement, retenue, exclusion temporaire, selon la gravité."])
    ]
  },

  // ══════════════════════════════════════════════════════════════════════
  // BACCALAURÉAT — Terminale
  // ══════════════════════════════════════════════════════════════════════

  "BAC|Français": {
    duree: "4 heures",
    coefficient: 2,
    exercices: [
      ex("Commentaire composé",
        "« La ville s'éveillait lentement. Les vendeuses installaient leurs étals, les taxis klaxonnaient déjà, et le soleil, timide, glissait entre les toits de tôle. Dans cette rumeur, chacun cherchait sa place. »",
        ["a) Dégage le thème du texte et le champ lexical dominant.",
         "b) Étudie deux procédés d'écriture et leur effet.",
         "c) Rédige une introduction et une conclusion de commentaire."],
        ["a) Thème : le réveil de la ville et l'activité humaine. Champ lexical du mouvement et du bruit (klaxonner, rumeur, s'éveiller).",
         "b) La personnification (« la ville s'éveillait », « soleil timide ») rend la ville vivante ; l'énumération des activités crée un effet de foisonnement.",
         "c) Introduction : présentation du texte, de son thème et annonce des axes. Conclusion : bilan des procédés et ouverture sur la ville comme personnage."]),
      ex("Dissertation",
        "Sujet : l'école forme-t-elle seulement des esprits ou aussi des citoyens ?",
        ["a) Formule une problématique claire.",
         "b) Annonce un plan en deux ou trois parties.",
         "c) Rédige une introduction complète."],
        ["a) Problématique : l'école se limite-t-elle à transmettre des savoirs, ou prépare-t-elle aussi à la vie collective ?",
         "b) Plan possible : I. L'école transmet des savoirs ; II. Elle forme aussi des citoyens ; III. Ces deux missions se complètent.",
         "c) Introduction : partir de l'expérience de l'élève, poser la question, annoncer le plan."]),
      ex("Résumé de texte",
        "« Apprendre à lire, c'est apprendre à douter. Le lecteur naïf croit tout ce qu'il lit ; le lecteur formé compare, vérifie, discute. C'est cette capacité de recul qui distingue l'instruction de la simple accumulation d'informations. »",
        ["a) Résume ce texte en 40 mots (± 10 %).",
         "b) Dégage l'idée directrice.",
         "c) Explique la phrase « l'instruction n'est pas la simple accumulation d'informations »."],
        ["a) Exemple : « Lire vraiment, c'est douter : le lecteur formé compare et vérifie au lieu de tout croire. Ce recul distingue l'instruction de la simple accumulation d'informations. »",
         "b) L'idée directrice : la lecture critique, et non la quantité de savoirs, constitue la véritable instruction.",
         "c) Être instruit ne consiste pas à retenir des faits, mais à savoir les mettre en question."]),
      ex("Langue et figures de style",
        "Soit la phrase : « Cette année, le temps a couru comme un cheval affolé. »",
        ["a) Identifie la figure de style employée.",
         "b) Quel est son effet sur le lecteur ?",
         "c) Transforme la phrase en supprimant la figure."],
        ["a) Une comparaison (outil « comme ») entre le temps et un cheval.",
         "b) Elle rend la fuite du temps concrète et inquiétante.",
         "c) « Cette année, le temps a passé très vite. »"])
    ]
  },

  "BAC|Philosophie": {
    duree: "4 heures",
    coefficient: 2,
    exercices: [
      ex("Dissertation",
        "Sujet : le travail n'est-il qu'une contrainte ?",
        ["a) Dégage les termes du sujet et leur ambiguïté.",
         "b) Propose une problématique.",
         "c) Annonce un plan en trois moments."],
        ["a) « Travail » : activité transformatrice, effort, emploi. « Contrainte » : obligation subie. Le sujet interroge la nature du travail.",
         "b) Le travail est-il seulement une nécessité imposée, ou peut-il être un moyen de réalisation de soi ?",
         "c) I. Le travail comme contrainte nécessaire (Marx, la survie) ; II. Le travail comme source de dignité et d'accomplissement (Hegel) ; III. Dépasser l'opposition : tout dépend des conditions du travail."]),
      ex("Explication de texte",
        "« La conscience n'est pas une lumière qui éclaire un objet déjà là ; elle est ce qui se retourne sur soi et se juge. »",
        ["a) Dégage la thèse de l'auteur.",
         "b) Explique le mot « se retourne ».",
         "c) Quelle conséquence pour la responsabilité morale ?"],
        ["a) La conscience n'est pas une simple connaissance des choses : elle est réflexivité et jugement sur soi.",
         "b) « Se retourner » désigne le mouvement par lequel le sujet se prend lui-même pour objet de pensée.",
         "c) Parce que le sujet peut se juger, il peut répondre de ses actes : la responsabilité suppose la conscience réflexive."]),
      ex("Dissertation",
        "Sujet : peut-on être libre sans lois ?",
        ["a) Définis la liberté et la loi.",
         "b) Montre la tension entre les deux notions.",
         "c) Conclus par une thèse argumentée."],
        ["a) Liberté : pouvoir d'agir selon sa volonté. Loi : règle commune qui limite et protège.",
         "b) Toute loi semble limiter la liberté ; pourtant, sans loi, la liberté des uns détruit celle des autres.",
         "c) La loi n'est pas l'ennemie de la liberté : une loi juste rend la liberté possible en la garantissant à tous (Rousseau, contrat social)."]),
      ex("Sujet de réflexion",
        "Sujet : la technique améliore-t-elle toujours la condition humaine ?",
        ["a) Cite deux apports de la technique.",
         "b) Cite deux risques liés à la technique.",
         "c) Quelle position défends-tu ?"],
        ["a) Médecine et espérance de vie ; communication et accès au savoir.",
         "b) Dépendance, chômage, atteintes à l'environnement, usage militaire.",
         "c) La technique est un moyen : son effet dépend de l'usage et du contrôle que la société exerce sur elle."])
    ]
  },

  "BAC|Économie": {
    duree: "3 heures",
    coefficient: 2,
    exercices: [
      ex("Le marché et les prix",
        "Sur le marché de Dantokpa, le prix du kilo de tomates baisse fortement en saison sèche.",
        ["a) Explique ce phénomène par la loi de l'offre et de la demande.",
         "b) Cite deux facteurs qui peuvent déplacer la demande.",
         "c) Que se passe-t-il si l'État fixe un prix plafond trop bas ?"],
        ["a) L'offre augmente fortement en saison sèche (arrivages), la demande reste stable : le prix d'équilibre baisse.",
         "b) Le revenu des ménages et le prix des produits substituts (ou les préférences).",
         "c) Pénurie : à ce prix, les producteurs vendent moins et une partie de la demande n'est pas satisfaite (marché parallèle)."]),
      ex("Monnaie et inflation",
        "Au cours de l'année, les prix des produits de première nécessité ont augmenté de 6 %.",
        ["a) Définis l'inflation.",
         "b) Calcule le prix d'un sac de riz de 12 000 F CFA après cette hausse.",
         "c) Cite deux conséquences de l'inflation pour les ménages."],
        ["a) L'inflation est la hausse générale et durable des prix.",
         "b) 12 000 × 1,06 = 12 720 F CFA.",
         "c) Perte de pouvoir d'achat et modification des habitudes de consommation."]),
      ex("Croissance et développement",
        "Un pays voit son PIB augmenter de 5 % par an, alors que l'indice de développement humain reste faible.",
        ["a) Distingue croissance et développement.",
         "b) Cite deux composantes de l'IDH.",
         "c) Explique comment un pays peut connaître la croissance sans le développement."],
        ["a) La croissance est l'augmentation de la production (PIB) ; le développement est l'amélioration durable des conditions de vie.",
         "b) Espérance de vie à la naissance et niveau d'instruction (années de scolarisation).",
         "c) Si les richesses créées profitent à une minorité, sans amélioration de la santé ni de l'école, la croissance ne se traduit pas en développement."]),
      ex("Commerce international",
        "La balance commerciale d'un pays est déficitaire lorsque ses importations dépassent ses exportations.",
        ["a) Définis la balance commerciale.",
         "b) Cite deux conséquences d'un déficit chronique.",
         "c) Donne un argument en faveur du protectionnisme."],
        ["a) La différence entre la valeur des exportations et celle des importations de biens.",
         "b) Endettement extérieur et dépendance vis-à-vis des financements étrangers (pression sur la monnaie).",
         "c) Protéger les industries naissantes et l'emploi local face à une concurrence qu'elles ne peuvent pas encore affronter."])
    ]
  },

  "BAC|Mathématiques": {
    duree: "4 heures",
    coefficient: 4,
    exercices: [
      ex("Suites numériques",
        "Soit la suite arithmétique (uₙ) définie par u₀ = 3 et de raison r = 4. Soit la suite géométrique (vₙ) définie par v₀ = 2 et de raison q = 1,5.",
        ["a) Calcule u₁₀.",
         "b) Calcule la somme S = u₀ + u₁ + … + u₁₀.",
         "c) Calcule v₃."],
        ["a) uₙ = 3 + 4n, donc u₁₀ = 3 + 40 = 43.",
         "b) S = 11 × (u₀ + u₁₀)/2 = 11 × (3 + 43)/2 = 11 × 23 = 253.",
         "c) vₙ = 2 × 1,5ⁿ, donc v₃ = 2 × 3,375 = 6,75."]),
      ex("Étude d'une fonction polynôme",
        "Soit f la fonction définie sur ℝ par f(x) = x² − 4x + 3.",
        ["a) Calcule f(0) et détermine les racines de f.",
         "b) Donne les coordonnées du sommet de la parabole.",
         "c) Résous l'inéquation f(x) < 0."],
        ["a) f(0) = 3. Δ = 16 − 12 = 4, racines x = 1 et x = 3.",
         "b) Le sommet est en x = −b/2a = 2, f(2) = 4 − 8 + 3 = −1, donc S(2 ; −1).",
         "c) f(x) < 0 pour x ∈ ]1 ; 3[."]),
      ex("Probabilités",
        "Une urne contient 3 boules rouges et 2 boules vertes, indiscernables au toucher. On tire deux boules successivement sans remise.",
        ["a) Quelle est la probabilité d'obtenir une boule rouge au premier tirage ?",
         "b) Quelle est la probabilité d'obtenir deux boules rouges ?",
         "c) Quelle est la probabilité d'obtenir deux boules de couleurs différentes ?"],
        ["a) P(R₁) = 3/5 = 0,6.",
         "b) P(R₁ ∩ R₂) = 3/5 × 2/4 = 6/20 = 0,3.",
         "c) P(différentes) = P(RV) + P(VR) = (3/5 × 2/4) + (2/5 × 3/4) = 6/20 + 6/20 = 0,6."]),
      ex("Dérivation et variations",
        "Soit f définie sur ℝ par f(x) = x³ − 3x + 1.",
        ["a) Calcule f′(x).",
         "b) Détermine les points où la dérivée s'annule.",
         "c) Dresse le tableau de variation de f."],
        ["a) f′(x) = 3x² − 3 = 3(x − 1)(x + 1).",
         "b) f′(x) = 0 pour x = −1 et x = 1.",
         "c) f croît sur ]−∞ ; −1[, décroît sur ]−1 ; 1[, croît sur ]1 ; +∞[. Maximum local f(−1) = 3, minimum local f(1) = −1."])
    ]
  },

  "BAC|Physique-Chimie": {
    duree: "3 heures",
    coefficient: 3,
    exercices: [
      ex("Ondes mécaniques",
        "Une onde sonore de fréquence f = 680 Hz se propage dans l'air avec une longueur d'onde λ = 0,50 m.",
        ["a) Rappelle la relation entre v, λ et f.",
         "b) Calcule la célérité v de l'onde.",
         "c) Que devient la longueur d'onde si la fréquence double ?"],
        ["a) v = λ × f.",
         "b) v = 0,50 × 680 = 340 m/s.",
         "c) À célérité constante, λ est inversement proportionnelle à f : λ devient 0,25 m."]),
      ex("Électricité — circuit série",
        "Une pile de force électromotrice E = 9 V et de résistance interne r = 1 Ω alimente un résistor R = 8 Ω.",
        ["a) Calcule l'intensité I du courant dans le circuit.",
         "b) Calcule la tension U aux bornes du résistor.",
         "c) Calcule la puissance dissipée par effet Joule dans le résistor."],
        ["a) I = E/(R + r) = 9/9 = 1 A.",
         "b) U = R × I = 8 × 1 = 8 V.",
         "c) P = R × I² = 8 × 1 = 8 W."]),
      ex("Chimie — solutions",
        "On dissout 0,05 mol de chlorure de sodium dans de l'eau pour obtenir 250 mL de solution.",
        ["a) Rappelle la relation entre concentration, quantité de matière et volume.",
         "b) Calcule la concentration molaire C de la solution.",
         "c) Quelle masse de sel a été dissoute ? (M(NaCl) = 58,5 g/mol)"],
        ["a) C = n/V, avec V en litres.",
         "b) V = 0,250 L, donc C = 0,05/0,250 = 0,2 mol/L.",
         "c) m = n × M = 0,05 × 58,5 = 2,925 g."]),
      ex("Énergie mécanique",
        "Un objet de masse m = 2 kg est lâché sans vitesse initiale d'une hauteur h = 5 m. On prend g = 10 m/s².",
        ["a) Calcule son énergie potentielle initiale.",
         "b) Calcule sa vitesse au sol en supposant les frottements négligeables.",
         "c) Que devient cette énergie après l'arrêt au sol ?"],
        ["a) Ep = m × g × h = 2 × 10 × 5 = 100 J.",
         "b) mgh = ½mv², donc v = √(2gh) = √100 = 10 m/s.",
         "c) Elle est dissipée sous forme de chaleur et de déformation lors du choc."])
    ]
  },

  "BAC|SVT": {
    duree: "3 heures",
    coefficient: 3,
    exercices: [
      ex("Génétique mendélienne",
        "On croise deux plants de pois hétérozygotes pour le caractère « couleur de la graine », le jaune (A) dominant sur le vert (a).",
        ["a) Écris les génotypes des parents.",
         "b) Construis l'échiquier de croisement.",
         "c) Donne les proportions phénotypiques attendues."],
        ["a) Les deux parents sont Aa.",
         "b) Échiquier : A a × A a donne AA, Aa, Aa, aa.",
         "c) 3/4 de graines jaunes et 1/4 de graines vertes, soit 75 % / 25 %."]),
      ex("Immunologie",
        "Un enfant est vacciné contre la rougeole puis, des années plus tard, il est en contact avec le virus sans tomber malade.",
        ["a) Explique le principe du vaccin.",
         "b) Quelle est la différence entre vaccination et sérothérapie ?",
         "c) Pourquoi la vaccination protège-t-elle la collectivité ?"],
        ["a) Le vaccin introduit un antigène atténué : l'organisme produit des anticorps et des cellules mémoire sans développer la maladie.",
         "b) Le vaccin provoque une immunité active et durable ; le sérum apporte des anticorps déjà formés (immunité passive, immédiate mais courte).",
         "c) Si assez de personnes sont immunisées, le virus ne circule plus : c'est l'immunité collective."]),
      ex("Reproduction humaine",
        "La régulation du cycle sexuel féminin repose sur des hormones hypophysaires et ovariennes.",
        ["a) Cite deux hormones ovariennes.",
         "b) Explique le mode d'action d'un contraceptif oral combiné.",
         "c) Que se passe-t-il lors de la fécondation ?"],
        ["a) Les œstrogènes et la progestérone.",
         "b) Il bloque l'ovulation en inhibant les hormones hypophysaires (FSH et LH) et modifie la glaire cervicale.",
         "c) La rencontre d'un spermatozoïde et de l'ovule forme une cellule-œuf (zygote) qui se divise pour donner l'embryon."]),
      ex("Écologie — cycle du carbone",
        "Le dioxyde de carbone atmosphérique participe au réchauffement climatique.",
        ["a) Cite deux sources naturelles de CO2.",
         "b) Cite deux activités humaines qui augmentent les rejets.",
         "c) Propose deux solutions pour réduire les émissions."],
        ["a) La respiration des êtres vivants et les éruptions volcaniques.",
         "b) La combustion des énergies fossiles et la déforestation.",
         "c) Développer les énergies renouvelables et reboiser (aussi : réduire le gaspillage, améliorer les transports)."])
    ]
  },

  "BAC|Comptabilité": {
    duree: "3 heures",
    coefficient: 3,
    exercices: [
      ex("Écritures au journal",
        "L'entreprise « Solutions Bénin » achète des marchandises pour 500 000 F CFA HT (TVA 18 %) et règle par virement bancaire.",
        ["a) Calcule le montant de la TVA.",
         "b) Calcule le montant TTC à payer.",
         "c) Passe l'écriture au journal (comptes débités et crédités)."],
        ["a) TVA = 500 000 × 0,18 = 90 000 F CFA.",
         "b) TTC = 590 000 F CFA.",
         "c) Débit 601 Achats de marchandises 500 000 ; débit 4451 TVA déductible 90 000 ; crédit 521 Banque 590 000."]),
      ex("Amortissement linéaire",
        "Une machine acquise pour 1 200 000 F CFA le 1er avril est amortissable sur 5 ans en linéaire.",
        ["a) Calcule le taux d'amortissement.",
         "b) Calcule l'annuité complète.",
         "c) Calcule la dotation de la première année (9 mois d'utilisation)."],
        ["a) Taux = 100/5 = 20 % par an.",
         "b) Annuité = 1 200 000 × 20 % = 240 000 F CFA.",
         "c) Première année = 240 000 × 9/12 = 180 000 F CFA."]),
      ex("Bilan",
        "On donne : matériel 2 000 000 ; stock 400 000 ; banque 600 000 ; capital 2 200 000 ; emprunt 700 000 ; fournisseurs 100 000.",
        ["a) Calcule le total de l'actif.",
         "b) Calcule le total du passif.",
         "c) Que vérifie-t-on ?"],
        ["a) Actif = 2 000 000 + 400 000 + 600 000 = 3 000 000 F CFA.",
         "b) Passif = 2 200 000 + 700 000 + 100 000 = 3 000 000 F CFA.",
         "c) L'égalité du bilan : total actif = total passif."]),
      ex("Compte de résultat",
        "Une entreprise réalise un chiffre d'affaires de 4 500 000 F CFA ; achats 1 800 000 ; charges de personnel 900 000 ; autres charges 300 000.",
        ["a) Calcule la marge (produits − achats).",
         "b) Calcule le résultat net.",
         "c) Que signifie un résultat négatif ?"],
        ["a) 4 500 000 − 1 800 000 = 2 700 000 F CFA.",
         "b) 2 700 000 − 900 000 − 300 000 = 1 500 000 F CFA de bénéfice.",
         "c) Un résultat négatif est une perte : les charges dépassent les produits, ce qui entame les capitaux propres."])
    ]
  },

  // ══════════════════════════════════════════════════════════════════════
  // LANGUES VIVANTES ET HISTOIRE-GÉOGRAPHIE (grille officielle complète)
  // ══════════════════════════════════════════════════════════════════════

  "BEPC|Espagnol": {
    duree: "1 h 30",
    coefficient: 3,
    exercices: [
      ex("Comprensión de la lectura",
        "Texto : « Mi nombre es Sika y tengo quince años. Vivo en Porto-Novo con mis padres y mis dos hermanos. Todos los días me levanto a las cinco y media y ayudo a mi madre a preparar el desayuno. Después voy al colegio en bicicleta. Me gustan el inglés y la historia, pero la física me parece difícil. Los sábados voy al mercado con mi tía, que vende telas. Por la noche hago mis deberes y leo una novela. Mi sueño es estudiar medicina y trabajar en un hospital de mi ciudad. »",
        ["a) ¿Cómo se llama la chica y dónde vive?",
         "b) ¿A qué hora se levanta y qué hace antes de ir al colegio?",
         "c) ¿Qué asignaturas le gustan y cuál le parece difícil?",
         "d) ¿Qué hace los sábados y por la noche?"],
        ["a) Se llama Sika y vive en Porto-Novo, con sus padres y sus dos hermanos.",
         "b) Se levanta a las cinco y media y ayuda a su madre a preparar el desayuno.",
         "c) Le gustan el inglés y la historia; la física le parece difícil.",
         "d) Los sábados va al mercado con su tía, que vende telas; por la noche hace sus deberes y lee una novela."]),
      ex("Gramática — ser, estar y presente",
        "Complète les phrases et conjugue les verbes entre parenthèses.",
        ["a) Hoy ... martes y ... en el colegio. (ser / estar)",
         "b) Mi padre ... profesor de matemáticas. (ser)",
         "c) Nosotros ... en Cotonú desde 2019. (vivir)",
         "d) Ellos ... quince años y ... al fútbol los domingos. (tener / jugar)",
         "e) Mets l'article défini correct : ... problema, ... ciudad, ... libros."],
        ["a) Hoy es martes y estoy en el colegio.",
         "b) Mi padre es profesor de matemáticas.",
         "c) Nosotros vivimos en Cotonú desde 2019.",
         "d) Ellos tienen quince años y juegan al fútbol los domingos.",
         "e) el problema, la ciudad, los libros."]),
      ex("Vocabulario y traducción",
        "Traduis dans les deux sens.",
        ["a) Traduis en espagnol : l'école, le marché, la famille, le professeur, demain.",
         "b) Traduis en français : la salud, el trabajo, la ciudad, siempre, nunca.",
         "c) Écris cinq jours de la semaine en espagnol."],
        ["a) la escuela, el mercado, la familia, el profesor, mañana.",
         "b) la santé, le travail, la ville, toujours, jamais.",
         "c) lunes, martes, miércoles, jueves, viernes (sábado, domingo)."]),
      ex("Expresión escrita",
        "Sujet : écris en espagnol un texte de 8 à 10 lignes pour raconter une journée ordinaire de ta vie d'élève.",
        ["a) Utilise le présent de l'indicatif.",
         "b) Cite au moins trois activités et une heure précise.",
         "c) Termine par ce que tu aimerais faire plus tard."],
        ["Critères de réussite : texte suivi de 8 à 10 lignes (4 pts) ; présent et accords corrects (4 pts) ; trois activités et une heure (3 pts) ; projet d'avenir exprimé (2 pts) ; orthographe et ponctuation (2 pts)."])
    ]
  },

  "BEPC|Allemand": {
    duree: "1 h 30",
    coefficient: 3,
    exercices: [
      ex("Leseverstehen",
        "Text : « Ich heiße Koffi und bin fünfzehn Jahre alt. Ich wohne in Abomey mit meiner Mutter und meiner Schwester. Mein Vater arbeitet in Cotonou. Ich gehe jeden Tag in die Schule; der Unterricht beginnt um sieben Uhr. Mein Lieblingsfach ist Erdkunde, aber Mathematik ist schwierig für mich. Am Samstag helfe ich meiner Mutter im Geschäft. Danach spiele ich Fußball mit meinen Freunden. Später möchte ich Lehrer werden. »",
        ["a) Wie heißt der Junge und wie alt ist er?",
         "b) Wo wohnt er und mit wem?",
         "c) Wann beginnt der Unterricht und was ist sein Lieblingsfach?",
         "d) Was macht er am Samstag und was möchte er später werden?"],
        ["a) Er heißt Koffi und ist fünfzehn Jahre alt.",
         "b) Er wohnt in Abomey mit seiner Mutter und seiner Schwester.",
         "c) Der Unterricht beginnt um sieben Uhr; sein Lieblingsfach ist Erdkunde.",
         "d) Am Samstag hilft er seiner Mutter im Geschäft und spielt danach Fußball; später möchte er Lehrer werden."]),
      ex("Grammatik — Akkusativ und Konjugation",
        "Complète les phrases.",
        ["a) Ich habe ... Bruder und ... Schwester. (ein, eine)",
         "b) Wir ... in die Schule. (gehen)",
         "c) Du ... gern Musik. (hören)",
         "d) Er ... heute keine Zeit. (haben)",
         "e) Mets à la forme négative : Ich spiele Fußball."],
        ["a) Ich habe einen Bruder und eine Schwester.",
         "b) Wir gehen in die Schule.",
         "c) Du hörst gern Musik.",
         "d) Er hat heute keine Zeit.",
         "e) Ich spiele nicht Fußball."]),
      ex("Wortschatz",
        "Traduis et complète.",
        ["a) Traduis en allemand : l'école, la maison, le livre, demain, la famille.",
         "b) Traduis en français : die Stadt, der Lehrer, die Arbeit, immer, heute.",
         "c) Cite cinq jours de la semaine en allemand."],
        ["a) die Schule, das Haus, das Buch, morgen, die Familie.",
         "b) la ville, le professeur, le travail, toujours, aujourd'hui.",
         "c) Montag, Dienstag, Mittwoch, Donnerstag, Freitag (Samstag, Sonntag)."]),
      ex("Schriftlicher Ausdruck",
        "Sujet : écris en allemand un texte de 8 à 10 lignes sur ta journée d'élève.",
        ["a) Utilise le présent.",
         "b) Indique deux activités et une heure.",
         "c) Dis ce que tu veux faire plus tard."],
        ["Critères : texte suivi de 8 à 10 lignes (4 pts) ; présent et ordre des mots corrects (4 pts) ; deux activités et une heure (3 pts) ; projet d'avenir (2 pts) ; orthographe (2 pts)."])
    ]
  },

  "BAC|Anglais": {
    duree: "3 heures",
    coefficient: 2,
    exercices: [
      ex("Reading comprehension",
        "Text: « Across West Africa, a growing number of students now revise for their exams on a mobile phone. Applications offer short lessons, past papers and instant corrections. For families who cannot afford private tutors, this is a real opportunity. Yet the digital gap remains wide: a stable connection, a smartphone and electricity are not available to everyone. Teachers also warn that copying an answer is not the same as understanding it. The challenge, therefore, is not only to distribute devices but to teach students how to learn with them. »",
        ["a) What are West African students using to revise?",
         "b) Why is this useful for some families?",
         "c) What are the two limits mentioned in the text?",
         "d) Explain in your own words: « copying an answer is not the same as understanding it »."],
        ["a) They are using mobile applications that offer short lessons, past papers and instant corrections.",
         "b) Because private tutors are expensive and many families cannot afford them.",
         "c) Unequal access to a stable connection, a smartphone and electricity; and the risk of copying without understanding.",
         "d) A student can repeat a correction without having learnt the method, so the knowledge does not last."]),
      ex("Grammar",
        "Rewrite or complete the sentences as instructed.",
        ["a) Put into the passive voice: « The teacher corrects the papers. »",
         "b) Report the sentence: She said, « I will revise tonight. »",
         "c) Complete with the right conditional: If I ... (have) more time, I ... (read) more books.",
         "d) Choose the correct tense: I ... (study) English for three years.",
         "e) Correct the mistake: « He don't understand the lesson. »"],
        ["a) The papers are corrected by the teacher.",
         "b) She said (that) she would revise that night.",
         "c) If I had more time, I would read more books.",
         "d) I have studied English for three years.",
         "e) He doesn't understand the lesson."]),
      ex("Vocabulary",
        "Word formation and meaning.",
        ["a) Give a synonym of « important » and an opposite of « difficult ».",
         "b) Form the noun from: to decide, to succeed, to inform.",
         "c) Explain the difference between « to lend » and « to borrow ».",
         "d) Use « although » in a complete sentence about school."],
        ["a) important = significant / major; difficult ≠ easy / simple.",
         "b) decision, success, information.",
         "c) To lend = give something temporarily to someone; to borrow = receive something temporarily from someone.",
         "d) Example: « Although the exam was hard, I finished every question. »"]),
      ex("Writing",
        "Sujet : « Digital tools are changing the way students learn. » Write an argumentative essay of about 200 words.",
        ["a) State a clear opinion in the introduction.",
         "b) Give two arguments with examples.",
         "c) Write a conclusion and check your tenses and linking words."],
        ["Criteria: clear opinion (3 pts); two developed arguments with examples (6 pts); structure and linking words (4 pts); grammar and vocabulary (5 pts); length and presentation (2 pts)."])
    ]
  },

  "BAC|Espagnol": {
    duree: "3 heures",
    coefficient: 2,
    exercices: [
      ex("Comprensión de texto",
        "Texto: « Cada año, miles de jóvenes abandonan el campo para buscar trabajo en las ciudades de África Occidental. Cotonú, Abiyán y Dakar crecen a un ritmo que las infraestructuras no pueden seguir: los barrios se extienden sin planificación y el transporte se vuelve difícil. Para algunos, la ciudad ofrece estudios y empleo; para otros, solo significa trabajos precarios y alquileres elevados. Los gobiernos intentan frenar este éxodo creando actividades en las zonas rurales, pero los resultados siguen siendo limitados. »",
        ["a) ¿Quiénes abandonan el campo y por qué?",
         "b) ¿Qué consecuencias tiene este crecimiento para las ciudades?",
         "c) ¿Qué ventajas y desventajas presenta la ciudad según el texto?",
         "d) Explica con tus palabras la última frase."],
        ["a) Miles de jóvenes abandonan el campo para buscar trabajo en las ciudades.",
         "b) Los barrios se extienden sin planificación y el transporte se vuelve difícil.",
         "c) Ventajas: estudios y empleo. Desventajas: trabajos precarios y alquileres elevados.",
         "d) Los gobiernos crean actividades en el campo para reducir la emigración, pero esas medidas todavía no bastan."]),
      ex("Gramática",
        "Complète ou transforme les phrases.",
        ["a) Conjugue au subjonctif présent : Espero que tú ... (venir) a la fiesta.",
         "b) Mets au conditionnel : Si tuviera dinero, ... (viajar) a España.",
         "c) Passe au style indirect : « Estoy cansado », dijo Mamá.",
         "d) Choisis ser ou estar : La clase ... muy grande y los alumnos ... atentos.",
         "e) Conjugue au passé simple : Anoche yo ... (llegar) tarde y ... (comer) poco."],
        ["a) Espero que tú vengas a la fiesta.",
         "b) Si tuviera dinero, viajaría a España.",
         "c) Mamá dijo que estaba cansada.",
         "d) La clase es muy grande y los alumnos están atentos.",
         "e) Anoche yo llegué tarde y comí poco."]),
      ex("Vocabulario",
        "Lexique et expressions.",
        ["a) Donne un synonyme de « trabajo » et un contraire de « fácil ».",
         "b) Explique l'expression « echar una mano ».",
         "c) Forme le nom à partir de : decidir, informar, producir.",
         "d) Traduis : « malgré les difficultés, il a réussi »."],
        ["a) trabajo = empleo; fácil ≠ difícil.",
         "b) « Echar una mano » signifie aider quelqu'un.",
         "c) decisión, información, producción.",
         "d) « A pesar de las dificultades, lo logró. »"]),
      ex("Expresión escrita",
        "Sujet : « ¿Es mejor vivir en el campo o en la ciudad? » Écris un texte argumenté d'environ 200 mots.",
        ["a) Annonce clairement ta thèse.",
         "b) Donne deux arguments illustrés d'exemples.",
         "c) Conclus en nuance et vérifie la concordance des temps."],
        ["Critères : thèse claire (3 pts) ; deux arguments développés (6 pts) ; organisation et connecteurs (4 pts) ; grammaire et lexique (5 pts) ; longueur et présentation (2 pts)."])
    ]
  },

  "BAC|Allemand": {
    duree: "3 heures",
    coefficient: 2,
    exercices: [
      ex("Leseverstehen",
        "Text: « In vielen afrikanischen Städten wächst der Müll schneller als die Zahl der Deponien. Plastikflaschen, Verpackungen und Elektrogeräte landen oft auf illegalen Halden. Einige Gemeinden haben begonnen, den Abfall zu trennen und das Recycling zu fördern. Junge Unternehmer sammeln Plastik und verwandeln es in Baustoffe oder Taschen. Diese Projekte schaffen Arbeitsplätze, aber sie brauchen Investitionen und eine klare Gesetzgebung. Ohne die Mithilfe der Bürger bleibt jedoch jede Lösung unvollständig. »",
        ["a) Warum wird das Müllproblem in den Städten größer?",
         "b) Was machen einige Gemeinden?",
         "c) Welche Vorteile bringen die Projekte junger Unternehmer?",
         "d) Erkläre den letzten Satz mit eigenen Worten."],
        ["a) Weil der Müll schneller wächst als die Zahl der Deponien.",
         "b) Sie trennen den Abfall und fördern das Recycling.",
         "c) Sie schaffen Arbeitsplätze und verwandeln Plastik in Baustoffe oder Taschen.",
         "d) Eine Lösung funktioniert nur, wenn die Bürger selbst mitmachen."]),
      ex("Grammatik",
        "Transforme ou complète les phrases.",
        ["a) Mets au passif : « Die Gemeinde sammelt den Müll. »",
         "b) Complète avec le pronom relatif : Das ist der Junge, ... in der Werkstatt arbeitet.",
         "c) Mets au Konjunktiv II : Wenn ich Zeit ..., ... ich mehr. (haben / lesen)",
         "d) Complète au parfait : Wir ... nach Cotonou ... (fahren).",
         "e) Corrige : « Ich habe ein Bruder. »"],
        ["a) Der Müll wird von der Gemeinde gesammelt.",
         "b) Das ist der Junge, der in der Werkstatt arbeitet.",
         "c) Wenn ich Zeit hätte, würde ich mehr lesen.",
         "d) Wir sind nach Cotonou gefahren.",
         "e) Ich habe einen Bruder."]),
      ex("Wortschatz",
        "Lexik und Wortbildung.",
        ["a) Donne un synonyme de « wichtig » et un contraire de « schwierig ».",
         "b) Forme le nom à partir de : entscheiden, informieren, produzieren.",
         "c) Explique la différence entre « lernen » et « studieren ».",
         "d) Traduis : « malgré les problèmes, le projet a réussi »."],
        ["a) wichtig = bedeutend; schwierig ≠ einfach / leicht.",
         "b) Entscheidung, Information, Produktion.",
         "c) « Lernen » = apprendre (à l'école, par la pratique) ; « studieren » = étudier à l'université, faire des recherches.",
         "d) « Trotz der Probleme ist das Projekt gelungen. »"]),
      ex("Schriftlicher Ausdruck",
        "Sujet : « Umweltschutz beginnt bei jedem Einzelnen. » Écris un texte argumenté d'environ 200 mots.",
        ["a) Présente ton opinion.",
         "b) Donne deux arguments avec des exemples concrets.",
         "c) Rédige une conclusion et vérifie la structure des phrases."],
        ["Critères : opinion claire (3 pts) ; deux arguments développés (6 pts) ; organisation et connecteurs (4 pts) ; grammaire et lexique (5 pts) ; longueur et présentation (2 pts)."])
    ]
  },

  "BAC|Histoire-Géographie": {
    duree: "3 heures",
    coefficient: 2,
    exercices: [
      ex("Dissertation — la décolonisation",
        "Sujet : « La décolonisation de l'Afrique noire : facteurs et modalités (1945-1975). »",
        ["a) Dégage les mots-clés du sujet et délimite la période.",
         "b) Propose une problématique.",
         "c) Annonce un plan en trois parties."],
        ["a) Décolonisation : accession à l'indépendance ; Afrique noire : Afrique subsaharienne ; période : de la fin de la Seconde Guerre mondiale aux indépendances des colonies portugaises (1975).",
         "b) Comment et pourquoi les colonies d'Afrique noire ont-elles accédé à l'indépendance entre 1945 et 1975 ?",
         "c) I. Les facteurs internes et internationaux ; II. Les modalités pacifiques et conflictuelles ; III. Les héritages et les défis des nouveaux États."]),
      ex("Commentaire de document — l'ONU",
        "Document : extrait du préambule de la Charte des Nations unies (San Francisco, 1945) : « Nous, peuples des Nations unies, résolus à préserver les générations futures du fléau de la guerre... à proclamer à nouveau notre foi dans les droits fondamentaux de l'homme, dans la dignité et la valeur de la personne humaine... »",
        ["a) Présente la nature, l'auteur et le contexte du document.",
         "b) Quelle est l'idée principale du texte ?",
         "c) Montre les limites de l'application de ces principes après 1945."],
        ["a) Préambule de la Charte des Nations unies, adoptée à San Francisco le 26 juin 1945, après la Seconde Guerre mondiale.",
         "b) Les États signataires s'engagent à préserver la paix et à défendre les droits fondamentaux de la personne humaine.",
         "c) La Guerre froide, les interventions militaires et le droit de veto au Conseil de sécurité ont souvent paralysé l'ONU."]),
      ex("Géographie — l'urbanisation en Afrique de l'Ouest",
        "En 1960, moins de 20 % de la population ouest-africaine vivait en ville ; aujourd'hui, cette proportion dépasse 45 % et les grandes métropoles (Lagos, Abidjan, Dakar, Cotonou) concentrent les activités.",
        ["a) Définis l'urbanisation.",
         "b) Cite deux causes de cette croissance urbaine.",
         "c) Cite deux problèmes et deux atouts des villes ouest-africaines."],
        ["a) L'urbanisation est l'augmentation de la part de la population vivant en ville et l'extension des espaces urbains.",
         "b) L'exode rural et la croissance naturelle de la population urbaine.",
         "c) Problèmes : logement, embouteillages, emploi informel, assainissement. Atouts : concentration des emplois, des universités, des services et des échanges."]),
      ex("Géographie — climat et agriculture au Bénin",
        "Le Bénin connaît un climat subéquatorial au sud et tropical soudanien au nord.",
        ["a) Cite deux caractéristiques du climat du sud et deux du climat du nord.",
         "b) Quel est l'impact de la pluviométrie sur les cultures ?",
         "c) Propose deux solutions pour limiter la dépendance de l'agriculture à la pluie."],
        ["a) Sud : deux saisons des pluies, forte humidité ; nord : une seule saison des pluies, amplitude thermique plus forte.",
         "b) Une bonne pluviométrie favorise le maïs, le manioc et le palmier ; une pluviométrie insuffisante réduit les rendements.",
         "c) Développer l'irrigation et choisir des semences adaptées à la sécheresse (aussi : retenues d'eau, prévisions météo)."])
    ]
  }
};

// ══════════════════════════════════════════════════════════════════════════
// Filières : quelles matières pour quelle classe / série
// ══════════════════════════════════════════════════════════════════════════

const FILIERES = [
  {
    examen: "BEPC", niveau: "brevet", classe: "3e", serie: null,
    matieres: ["Mathématiques", "Français", "Physique-Chimie-Technologie",
      "SVT", "Histoire-Géographie", "Anglais", "Espagnol", "Allemand",
      "Éducation civique et morale"]
  },
  { examen: "BAC", niveau: "bac", classe: "Tle", serie: "A", matieres: ["Français", "Philosophie", "Anglais", "Espagnol", "Allemand", "Histoire-Géographie", "Mathématiques", "SVT"] },
  { examen: "BAC", niveau: "bac", classe: "Tle", serie: "B", matieres: ["Économie", "Histoire-Géographie", "Mathématiques", "Français", "Philosophie", "Anglais", "Espagnol", "Allemand"] },
  { examen: "BAC", niveau: "bac", classe: "Tle", serie: "C", matieres: ["Mathématiques", "Physique-Chimie", "SVT", "Philosophie", "Français", "Histoire-Géographie", "Anglais"] },
  { examen: "BAC", niveau: "bac", classe: "Tle", serie: "D", matieres: ["SVT", "Mathématiques", "Physique-Chimie", "Philosophie", "Français", "Histoire-Géographie", "Anglais"] },
  { examen: "BAC", niveau: "bac", classe: "Tle", serie: "G", matieres: ["Comptabilité", "Économie", "Mathématiques", "Français", "Philosophie", "Histoire-Géographie", "Anglais"] }
];

const SLUGS = {
  "Mathématiques": "mathematiques",
  "Français": "francais",
  "Physique-Chimie": "pct",
  "Physique-Chimie-Technologie": "pct",
  "SVT": "svt",
  "Sciences de la Vie et de la Terre": "svt",
  "Histoire-Géographie": "histoire-geographie",
  "Anglais": "anglais",
  "Espagnol": "espagnol",
  "Allemand": "allemand",
  "Éducation civique et morale": "education-civique",
  "Philosophie": "philosophie",
  "Économie": "economie",
  "Comptabilité": "comptabilite-gestion",
  "Comptabilité-Gestion": "comptabilite-gestion"
};

const ENTETES = {
  BEPC: "BREVET D'ÉTUDES DU PREMIER CYCLE — SESSION DE RÉVISION",
  BAC: "BACCALAURÉAT — SESSION DE RÉVISION"
};

function libelleFiliere(filiere) {
  return filiere.examen === "BEPC" ? "BEPC 3e" : `BAC série ${filiere.serie}`;
}

function blocBareme() {
  return {
    type: "tableau",
    entetes: ["Exercice", "Barème", "Points"],
    lignes: [
      ["Exercice 1", "Questions a, b, c", String(POINTS[0])],
      ["Exercice 2", "Questions a, b, c", String(POINTS[1])],
      ["Exercice 3", "Questions a, b, c", String(POINTS[2])],
      ["Total", "", "20"]
    ]
  };
}

function blocsSujet(filiere, matiere, annee, banque, exercices) {
  const libelle = libelleFiliere(filiere);
  const blocs = [
    {
      type: "titre",
      texte: `${ENTETES[filiere.examen]}${filiere.serie ? ` — SÉRIE ${filiere.serie}` : ""}`
    },
    {
      type: "consigne",
      lignes: [
        `ÉPREUVE DE ${matiere.toUpperCase()}`,
        `Durée : ${banque.duree} — Coefficient : ${banque.coefficient}`,
        `Session de révision ${annee} (${libelle}). Les ${exercices.length} exercices sont obligatoires — total : 20 points.`
      ]
    }
  ];
  exercices.forEach((exercice, index) => {
    blocs.push({ type: "sousTitre", texte: `Exercice ${index + 1} (${POINTS[index]} points) — ${exercice.titre}` });
    blocs.push({ type: "texte", texte: exercice.enonce });
    blocs.push({ type: "liste", items: exercice.questions });
  });
  blocs.push({ type: "texte", texte: "Bon courage !" });
  return blocs;
}

function blocsCorrige(filiere, matiere, annee, banque, exercices) {
  const libelle = libelleFiliere(filiere);
  const blocs = [
    { type: "titre", texte: `CORRIGÉ — ${matiere.toUpperCase()} (${libelle.toUpperCase()}, SESSION ${annee})` },
    {
      type: "consigne",
      lignes: [
        `Barème sur 20 points — durée de l'épreuve : ${banque.duree}.`,
        "Une réponse exacte sans justification ne vaut que la moitié des points."
      ]
    }
  ];
  exercices.forEach((exercice, index) => {
    blocs.push({ type: "sousTitre", texte: `Exercice ${index + 1} (${POINTS[index]} points) — ${exercice.titre}` });
    blocs.push({ type: "texte", texte: `Rappel de l'énoncé : ${exercice.enonce}` });
    blocs.push({ type: "liste", items: exercice.reponses });
  });
  blocs.push({ type: "sousTitre", texte: "Barème récapitulatif" });
  blocs.push(blocBareme());
  blocs.push({
    type: "texte",
    texte: "Conseil : refais chaque exercice sans regarder le corrigé, puis compare ta rédaction aux réponses attendues."
  });
  return blocs;
}

function construireDocuments() {
  const documents = [];

  FILIERES.forEach((filiere) => {
    filiere.matieres.forEach((matiere) => {
      const banque = BANQUES[`${filiere.examen}|${matiere}`];
      if (!banque || !banque.exercices.length) {
        throw new Error(`Banque manquante : ${filiere.examen}|${matiere}`);
      }

      ANNEES.forEach((annee, indexAnnee) => {
        // Décalage lié à l'année : deux sessions n'ont pas les mêmes exercices.
        const exercices = [0, 1, 2].map((decalage) =>
          banque.exercices[(indexAnnee + decalage) % banque.exercices.length]);

        const base = [
          filiere.examen.toLowerCase(),
          filiere.classe.toLowerCase(),
          filiere.serie ? filiere.serie.toLowerCase() : null,
          SLUGS[matiere] || matiere.toLowerCase(),
          annee
        ].filter(Boolean).join("-");

        const libelle = libelleFiliere(filiere);

        documents.push({
          id: `${base}-sujet`,
          fichier: `${base}-sujet`,
          titre: `Épreuve types de ${matiere} — ${libelle} (session ${annee})`,
          description: `Sujet d'entraînement ${libelle}, session ${annee} : ${exercices.map((e) => e.titre.toLowerCase()).join(", ")}. Barème sur 20.`,
          examen: filiere.examen,
          niveau: filiere.niveau,
          classe: filiere.classe,
          serie: filiere.serie,
          annee,
          matiere,
          type: "sujet",
          sourceNom: "Revisy — épreuve type rédigée en interne",
          sourceUrl: SOURCE_URL,
          licence: LICENCE,
          blocs: blocsSujet(filiere, matiere, annee, banque, exercices)
        });

        documents.push({
          id: `${base}-corrige`,
          fichier: `${base}-corrige`,
          titre: `Corrigé — Épreuve types de ${matiere} (${libelle}, session ${annee})`,
          description: `Corrigé détaillé et barème de l'épreuve de ${matiere.toLowerCase()} (${libelle}, session ${annee}).`,
          examen: filiere.examen,
          niveau: filiere.niveau,
          classe: filiere.classe,
          serie: filiere.serie,
          annee,
          matiere,
          type: "corrige",
          sourceNom: "Revisy — corrigé d'épreuve type rédigé en interne",
          sourceUrl: SOURCE_URL,
          licence: LICENCE,
          blocs: blocsCorrige(filiere, matiere, annee, banque, exercices)
        });
      });
    });
  });

  return documents;
}

module.exports = { DOCUMENTS: construireDocuments(), ANNEES };
