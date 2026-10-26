# Deploy Revizy — Render + Supabase

## Etape 1 — Supabase (base + auth)

1. Ouvre ton projet sur https://supabase.com/dashboard
2. SQL Editor → New query → colle tout le contenu de `schema.sql` → Run
3. Authentication → Providers → Email : active Email
   - Pour tester rapidement : désactive "Confirm email"
4. Project Settings → API :
   - copie **Project URL**
   - copie **anon public** key
5. Colle-les dans `config.js`

### Migrations à exécuter dans cet ordre

> **Plus simple :** le fichier `MIGRATION_TOUT.sql` contient les 14 migrations
> ci-dessous, concaténées dans l'ordre. Un seul copier-coller dans le SQL
> Editor de Supabase suffit (il est idempotent : `if not exists` partout,
> on peut le relancer sans risque). Il se régénère avec
> `node tools/build-migration.js`.
>
> **Pourquoi c'est important :** sans le fichier 8 (`schema_profiles_classe.sql`),
> les colonnes `classe` / `serie` n'existent pas dans `profiles` : le choix de
> classe de l'élève ne peut alors pas être enregistré en base (le site le
> conserve sur l'appareil, mais l'admin ne voit pas la classe et l'élève la
> doit resélectionner à chaque nouvel appareil).

| Ordre | Fichier | Rôle |
|-------|---------|------|
| 1 | `schema.sql` | profils, paiements, RLS, fonctions de base |
| 2 | `schema_v2.sql` | niveaux, séries, matières, chapitres, règles de prix |
| 3 | `schema_curriculum.sql` | RPC `get_curriculum_topics` |
| 4 | `seed_curriculum.sql` | programme officiel initial |
| 5 | `schema_get_chapters.sql` | RPC `get_curriculum_chapters` (contenu riche des cours) |
| 6 | `schema_programme.sql` | table `curriculum_sequences` + RPC admin (onglet « Programme officiel ») |
| 7 | `schema_programme_parts.sql` | colonne `parts` (SA + chapitres) et RPC enrichie |
| 8 | `schema_classe.sql` | classe/série de l'élève + table `quiz_banks` (banque d'exercices personnalisée) |
| 9 | `schema_paiements.sql` | verrouille l'écriture des déblocages (serveur + admins uniquement) |
| 10 | `schema_pays.sql` | cloisonne le contenu par pays (dimension multi-pays) |
| 11 | `schema_exercices.sql` | colonne `exercices` (jsonb) : les 50 QCM/Vrai-Faux par chapitre sont conservés en base |
| 12 | `schema_subscriptions.sql` | table `subscriptions` : les abonnements sont en base (l'admin les voit, l'élève les retrouve sur tous ses appareils) |
| 13 | `schema_cours_pays_classe.sql` | cours par pays/classe/série : table `chapter_mappings` + RPC `get_chapters_for_student` (mêmes colonnes que `get_curriculum_chapters`, contenu payant protégé) |
| 14 | `schema_securite.sql` | **à exécuter en dernier** : contenu payant illisible sans droits, rôle admin non auto-attribuable, abonnements et déblocages écrits par le serveur uniquement |

Le fichier 14 est **indispensable** : sans lui, un visiteur anonyme peut lire le
contenu des chapitres payants et le cloisonnement par pays ne s'applique pas.

Le fichier 6 est celui qui active l'onglet **📚 Programme officiel** du back-office :
l'admin y saisit (ou fait rechercher par l'IA) les parties clés du programme,
et les cours sont ensuite générés automatiquement dans cet ordre exact.

Le fichier 8 enregistre la **classe et la série** de chaque élève inscrit, et la table
`quiz_banks` qui mémorise les banques d'exercices. Sans lui, la banque d'exercices
personnalisée de l'espace élève reste désactivée.

Le fichier 9 est **bloquant pour les paiements** : sans lui, la politique RLS
autorise encore un élève à s'auto-débloquer un cours.

Le fichier 10 est nécessaire dès qu'on veut un second pays : il ajoute la colonne
`pays` aux matières, aux chapitres, au programme officiel et aux banques d'exercices,
et fait filtrer les RPC par pays. Sans lui, tout le contenu reste mélangé entre pays.

Le fichier 11 s'exécute **après** le fichier 10 : il ajoute la colonne `exercices`
(jsonb) sur `chapters`. Les 50 exercices QCM / Vrai-Faux générés par l'IA pour un
chapitre y sont conservés : ils sont partagés par tous les élèves du pays, donc
une seule génération par chapitre au lieu d'une par élève. Sans ce fichier, chaque
ouverture de chapitre redemande une génération à l'IA (quota gratuit).

Le fichier 12 enregistre les **abonnements** en base. Tant qu'il n'est pas
exécuté, l'abonnement n'existe que dans le navigateur : l'administrateur ne voit
aucun abonné, et l'élève perd son accès illimité s'il change d'appareil.

## Etape 2 — Render (site)

1. https://dashboard.render.com → New → Static Site
2. Connecte le repo GitHub : `melofils2024-gif/Revizy`
3. Branch : `main`
4. Build Command : (vide)
5. Publish Directory : `.`
6. Create Static Site

## Etape 3 — URLs Auth

Dans Supabase → Authentication → URL Configuration :
- Site URL = ton URL Render (ex: https://revizy.onrender.com)
- Redirect URLs = même URL

## Fichiers importants

| Fichier | Role |
|---------|------|
| `config.js` | URL + clé anon Supabase (publique) |
| `schema.sql` | Tables + RLS à exécuter une fois |
| `render.yaml` | Config optionnelle Render |
| `.env` | Secrets locaux — ne jamais committer |

## Test local

Ouvre `index.html` via un petit serveur (pas file://) après avoir rempli `config.js`, puis crée un compte Élève.

### Tests automatisés (sans réseau ni clé API)

```bash
node tools/test-langues.js      # pays → langue, contexte léger, traductions
node tools/test-pays.js         # catalogue pays + conversion des devises
node tools/test-json-escapes.js # nettoyage des JSON générés par l'IA (LaTeX)
node tools/test-serveur.js      # chaîne prompt → normalisation (28 tests)
node tools/test-quota.js        # budget IA, cache durable, repli sans IA (40 tests)
node tools/benchmark-models.js  # compares les modèles Gemini (consomme du quota)
```

## Variables d'environnement obligatoires (Render)

Le projet est un **service web Node** (`npm start` → `server.js`), pas un site statique.

| Variable | Rôle |
|----------|------|
| `GEMINI_API_KEY` | Clé Google AI Studio — **obligatoire**, sinon le chatbot et la génération de cours renvoient une erreur |
| `GEMINI_MODEL` | Optionnel, défaut `gemini-3.5-flash-lite` (voir « Quota IA » ci-dessous) |
| `GEMINI_FALLBACK_MODELS` | Optionnel, défaut `gemini-flash-lite-latest,gemini-3.1-flash-lite,gemini-3.6-flash,gemini-3.7-flash,gemini-3.8-flash,gemini-3.5-flash,gemini-flash-latest` (sans secours, une saturation de Google met tout le site hors service) |
| `SUPABASE_URL` / `SUPABASE_ANON_KEY` | Base de données — **nécessaires aussi côté serveur** : le sitemap (pages par chapitre) et la lecture du prix des cours se font par l'API REST. Sans eux, `GET /v1/ai/health` affiche `"supabase": { "lecture": "configuration absente" }` |
| `SUPABASE_SERVICE_KEY` | Clé `service_role` (Supabase → Settings → API) : **obligatoire pour le déblocage des cours payants** (le serveur écrit avec cette clé, jamais le navigateur) et pour mémoriser les banques d'exercices. Ne jamais la mettre dans `config.js`. |
| `APP_BASE_URL_FRONT` | URL publique du site (utilisée pour les URL canoniques, le sitemap et les balises de partage). Défaut `https://revisy.onrender.com` |
| `FEDAPAY_SECRET_KEY` | Clé secrète FedaPay — obligatoire pour vérifier un paiement avant d'activer un accès |
| `FEDAPAY_PUBLIC_KEY` | Clé publique (checkout FedaPay côté navigateur) |
| `FEDAPAY_CALLBACK_URL` | URL de retour après paiement (par défaut l'URL du site) |
| `FEDAPAY_CURRENCY` | `XOF` |
| `FEDAPAY_WEBHOOK_SECRET` | Secret de signature du webhook FedaPay (FedaPay → Paramètres du projet). **Optionnel** : sans lui, le flux principal (retour de paiement puis vérification serveur) fonctionne, mais FedaPay ne peut pas notifier le serveur si l'élève ferme l'onglet. Le diagnostic affiche `"secretWebhook": true/false`. |
| `JWT_SECRET` | Signature des jetons de session |
| `AI_BUDGET_QUOTIDIEN` | Optionnel, défaut `200` : appels IA maximum par fenêtre glissante de 24 h (toutes clés et tous modèles confondus) |
| `AI_BUDGET_PAR_MODELE` | Optionnel, défaut `15` : appels IA maximum par modèle **flash standard** et par fenêtre de 24 h (quota Google : 20/j) |
| `AI_BUDGET_PAR_MODELE_LITE` | Optionnel, défaut `150` : idem pour les modèles **flash-lite** (quota Google : ~1 500/j) |
| `AI_BUDGET_SANTE` / `AI_BUDGET_SANTE_PAR_MODELE` | Optionnel, défauts `12` / `3` : budget réservé au diagnostic `/v1/ai/health`, pour qu'il ne mange pas le quota de service |
| `AI_CACHE_TTL_JOURS` | Optionnel, défaut `30` : durée de vie du cache IA sur disque (`cache/`) |
| `AI_CACHE_DIR` | Optionnel, défaut `cache/` : dossier du cache IA sur disque |
| `AI_CACHE_MEMOIRE_MINUTES` | Optionnel, défaut `720` (12 h) : durée de vie du cache IA en mémoire |

## Sécurité des paiements

Le déblocage d'un cours payant n'est **jamais** écrit par le navigateur :

1. Le client demande au serveur de créer une transaction FedaPay (`POST /v1/payments/create-transaction`).
   Le **montant est calculé par le serveur** — le navigateur ne peut pas l'imposer.
2. L'élève valide le paiement sur son téléphone (MTN MoMo / Moov Money).
3. Le client demande la vérification (`POST /v1/payments/verify`). Le serveur contrôle
   le **statut** et le **montant** auprès de l'API FedaPay, refuse une transaction déjà
   utilisée, puis écrit le déblocage avec la clé `service_role`.
4. Le navigateur ne fait que refléter l'état renvoyé par le serveur.

Un élève ne peut donc plus s'auto-débloquer un cours en écrivant lui-même dans
`unlocked_chapters`. C'est pour cela que `schema_paiements.sql` retire les politiques
d'insertion aux élèves : seuls le serveur et les admins écrivent.

**À faire après ce changement** : exécuter `schema_paiements.sql` sur Supabase et
vérifier que `SUPABASE_SERVICE_KEY` (clé `service_role`) est bien présente dans les
variables d'environnement de Render.

Le diagnostic `https://ton-app.onrender.com/v1/ai/health` expose l'état :
`"paiements": { "cleServiceSupabase": true, "cleFedaPay": true, "debloquageSecurise": true }`.

## Architecture multi-pays (contextes)

Revizy est né pour le Bénin mais vise l'Afrique de l'Ouest puis l'international.
Toutes les données propres à un pays sont centralisées dans **`contexts.js`** :
curriculum par matière et série, matières du catalogue, tarifs, devise,
passerelle de paiement, libellés d'examen et textes des prompts IA / du SEO.

Le module fonctionne côté serveur (`require`) **et** côté navigateur
(`window.REVIZY_CONTEXTS`) : le front charge `contexts.js` avant `app.js`.

### Qui voit quoi

Le pays affiché est celui **choisi par le visiteur**, pas déduit de sa position
géographique :

- le sélecteur de pays dans la barre de navigation (ou `?pays=SN` dans l'URL)
  détermine le contexte : catalogue de matières, séries, tarifs, prompts IA,
  pages SEO ;
- le choix est mémorisé (localStorage) et conservé d'une visite à l'autre ;
- un sous-domaine (`senegal.revisy.onrender.com`) ou un préfixe d'URL
  (`/senegal/cours/...`) force un pays précis — c'est la méthode à utiliser pour
  le référencement international (une URL par pays, `hreflang` dans le sitemap) ;
- **le contenu affiché est celui du pays choisi** : le serveur interroge la base
  avec le filtre `pays`, le programme officiel saisi par l'admin est cloisonné
  par pays, et les banques d'exercices sont partagées par pays.

La détection automatique par IP n'est **pas** implémentée : elle se trompe
souvent (VPN, travels, diaspora) et risque de servir le mauvais programme.
Mieux vaut un choix explicite + des URL dédiées par pays.

### Cours d'un pays sans programme publié

Seuls le Bénin, le Togo, la Côte d'Ivoire et le Sénégal ont un programme
embarqué (`CURRICULUM_BENIN`). Pour les 62 autres pays :

1. le front demande le cours **du pays** au serveur (`POST /v1/ai/generate-course`
   avec `pays`) **avant** toute lecture en base ;
2. le serveur répond par le cours déjà enregistré pour ce pays (base, puis cache
   mémoire de 12 h, puis cache disque de 30 jours), sinon il le génère : le
   prompt impose la **langue du pays** (interface, cours, exercices, tuteur) et
   le **programme officiel du pays** ;
3. le cours est partagé : tous les élèves du pays le récupèrent sans consommer
   de quota.

Tant que `SUPABASE_SERVICE_KEY` n'est pas configurée, le cache serveur (mémoire
12 h + disque 30 jours) est le filet : à défaut, chaque visite d'un pays sans
programme peut relancer une génération IA. Si le quota IA est atteint, le
serveur renvoie un **cours local** construit à partir du programme connu du
pays (`source: "local"`) — l'élève n'est jamais bloqué par une erreur.

### Ajouter un pays

1. Ajouter une entrée dans `CONTEXTS` (`contexts.js`) :

```js
SN: {
  code: 'SN', slug: 'senegal', nom: 'Sénégal', nomLong: 'République du Sénégal',
  langue: 'fr', actif: true,
  devise: 'FCFA', codeDevise: 'XOF', providers: ['mtn', 'moov', 'orange'],
  organisme: 'Direction de l\'Enseignement',
  libelleExamen: { bac: 'BAC', brevet: 'BFEM' },
  classes: { bac: 'Terminale', brevet: '3ème' },
  series: ['A', 'B', 'C', 'D', 'E', 'G'],
  prix: { chapitre: { brevet: 100, bac: 150 }, abonnement: { brevet: 2000, bac: 3000 } },
  textes: { systemeEducatif: 'système éducatif sénégalais', /* … */ },
  curriculum: { bac: { /* … */ }, brevet: [ /* … */ ] },
  matieres:  { bac: { A: [ { name: 'Mathématiques', icon: '📐' } ] }, brevet: [ /* … */ ] }
}
```

2. Renseigner le contenu réel du pays (programme officiel, cours) via l'onglet
   « Programme officiel » de l'admin, ou dans les tables `subjects` / `chapters`.

C'est tout : le site se met à jour. Le sélecteur de pays de la barre de
navigation, les pages SEO, le sitemap, les prompts IA et les tarifs suivent
automatiquement.

### Catalogue de pays et devises

`PAYS_DISPONIBLES` (`contexts.js`) liste **66 pays** proposés à l'inscription et
dans la barre de navigation : **les 53 pays africains d'abord**, puis le reste du
monde. Chaque pays porte sa devise (`devise` + `codeDevise`) et sa langue
d'enseignement.

Les taux de conversion vivent dans `TAUX_DE_CHANGE` (nombre d'unités de la devise
pour 1 FCFA). Ils sont **indicatifs** : le FCFA est pegué à l'euro, mais les
autres devises varient. Il faut les mettre à jour régulièrement.

```js
{ code: 'GH', nom: 'Ghana', devise: 'GHS', codeDevise: 'GHS', zone: 'afrique', programme: false, actif: true },
```

Conséquence importante : **le débit bancaire reste en FCFA** (FedaPay est un
prestataire béninois, XOF). Le prix affiché est converti dans la devise du pays
choisi, et les écrans de paiement rappellent l'équivalent en FCFA
(`100 FCFA (≈ 250 ₦)`). Ne jamais envoyer un montant converti à FedaPay.

### Langue du pays

La langue découle du pays choisi (jamais de l'IP) et pilote **deux** choses :

1. **L'interface** : `LANGUES` (`contexts.js`) contient les libellés par langue.
   Sept langues sont prêtes : `fr`, `en`, `ar`, `pt`, `es`, `it`, `ru`, `zh`.
   Les éléments statiques de `index.html` portent l'attribut `data-i18n`
   (ou `data-i18n-placeholder`) ; `appliquerTraductions()` les met à jour quand
   le pays change, et bascule aussi `dir="rtl"` pour l'arabe.
2. **Le contenu IA** : `instructionLangue(ctx)` est ajoutée à tous les prompts
   (cours, banques d'exercices, exercices de chapitre, tuteur). Les cours, les
   QCM et les réponses du chatbot sont donc rédigés dans la langue du pays de
   l'apprenant — et adaptés à son examen (BECE au Ghana, BEPC au Bénin…).

Les options « Vrai / Faux » sont localisées elles aussi (`optionsVraiFaux`
côté serveur, `libellesVraiFaux()` côté front) ; l'ordre reste toujours
[vrai, faux], donc l'index de la bonne réponse ne bouge pas.

Pour ajouter une langue : une entrée dans `LANGUES` avec `nom`, `dir`,
`instructionIA` et les libellés `ui` (une clé manquante retombe sur l'anglais,
puis sur le français). La table `LANGUE_PAR_PAYS` associe chaque pays à sa langue.

### Programme officiel par pays

Le contenu affiché est celui du pays choisi :

- le serveur interroge la base avec le filtre `pays` (RPC `get_curriculum_*`) ;
- le programme saisi dans l'onglet « Programme officiel » de l'admin est
  enregistré avec le pays actif ;
- un pays **sans** programme publié affiche le programme disponible le plus
  proche, avec un bandeau explicite (« Programme officiel Ghana bientôt
  disponible ») — jamais une page vide, jamais de silence.

Pour publier le programme d'un pays : choisir ce pays dans le sélecteur « Pays du
programme » de l'onglet admin, puis saisir le programme.

**L'admin n'a pas besoin de connaître le programme de tous les pays.** Dans son
onglet « Programme officiel » :

| Bouton | Effet |
|--------|-------|
| 🔎 Rechercher le programme | Programme local (Bénin) — instantané |
| ✨ Améliorer avec l'IA | Structure proposée par l'IA, à corriger puis publier |
| 🤖 Générer + publier (IA) | L'IA construit le programme du pays **et l'enregistre seule** |
| 🌍 Tout le pays (IA) | Idem pour toutes les matières du niveau choisi (1 génération par matière) |

Le cours lui-même est enregistré en base après génération (`subjects` +
`chapters`, avec `pays`) : tous les élèves d'un pays voient le même cours,
conforme à son programme, et il n'est jamais régénéré. Cette écriture exige la
clé `service_role` (voir « Variables d'environnement »).

### Résolution du contexte

Par ordre de priorité (`contextFromRequest` côté serveur) :

1. paramètre explicite : corps `{"pays":"SN"}`, query `?pays=SN`, en-tête `X-Revizy-Pays` ;
2. sous-domaine : `senegal.revisy.onrender.com` ;
3. préfixe d'URL : `/senegal/cours/...` ;
4. contexte par défaut (Bénin).

### URLs et redirections

| URL | Effet |
|-----|-------|
| `/{pays}/` | page d'accueil du pays (index des matières par niveau et série) |
| `/{pays}/cours/{slug}.html` | page landing ou page chapitre (URL canonique) |
| `/cours/{slug}.html` | **301** vers `/{pays}/cours/{slug}.html` (alias historique) |
| `/sitemap.xml` | toutes les pages de tous les pays + variantes `hreflang` |
| `/robots.txt` | indexation autorisée, `/admin` et `/v1/` interdits |

Les URL canoniques, `og:url` et le JSON-LD sont **absolus** (domaine de
production) ; les liens de navigation restent **relatifs** pour rester sur le
domaine courant.

## Quota IA — le vrai limite du site

Le quota gratuit de Google AI Studio est **par projet**, et il est beaucoup plus
serré qu'on ne le croit. Mesuré sur le projet Revizy (API `models.list` +
messages d'erreur 429) :

| Famille de modèles | Quota gratuit par jour | Constaté |
|--------------------|------------------------|----------|
| `gemini-3.5` / `3.6` / `3.7` / `3.8` Flash, `gemini-flash-latest` | **20 requêtes par modèle** | quota épuisé après quelques dizaines d'appels, réinitialisation à minuit heure du Pacifique |
| `gemini-3.5-flash-lite`, `gemini-3.1-flash-lite`, `gemini-flash-lite-latest` | **~1 500 requêtes** | 12 appels consécutifs réussis alors que tous les autres modèles étaient en 429 |

D'où le choix par défaut de `gemini-3.5-flash-lite` comme modèle principal :
environ 75 fois plus de requests gratuites, **2,8 s** pour une réponse de chat et
**12,5 s** pour une banque de 30 questions, avec une qualité vérifiée en
français (philosophie, littérature) et en mathématiques.

À savoir :

- `gemini-2.5-flash` et `gemini-2.5-flash-lite` renvoient **404** : ils n'existent
  plus. Tout modèle non listé par `GET /v1beta/models` est à éviter.
- Chaque appel consomme une requête. Le diagnostic `/v1/ai/health` en consomme au
  maximum **3** (il s'arrête au premier modèle qui répond) et dispose d'un budget
  diagnostic séparé (`AI_BUDGET_SANTE`) : au-delà, il rapporte l'état local sans
  appeler Google. Il est mis en cache 5 minutes, à contourner avec `?force=1`.
- `GEMINI_API_KEY_2` permet d'ajouter une seconde clé : le quota étant **par
  projet**, une seconde clé du même projet n'ajoute rien. Il faut un second
  projet Google Cloud pour doubler le quota gratuit.
- Passer sur le palier payant enlève le plafond quotidien. Tarifs mesurés
  (par million de tokens, USD) : `gemini-3.8-flash` et `3.6-flash` à 0,75 $ en
  entrée / 3,75 $ en sortie ; `gemini-3.5-flash-lite` à 0,30 $ / 2,50 $ ;
  l'API Batch coûte moitié prix (pour générer les cours et les banques
  d'exercices hors pointe).
- Levier le plus rentable : **cacher**. Une banque d'exercices est partagée par
  tous les élèves d'une classe (`schema_classe.sql`), donc une génération
  suffit pour tout le monde. C'est ce qui rend le quota gratuit tenable.

### Le site est-il utilisable quand le quota est atteint ? Oui.

Le quota gratuit **ne peut pas être augmenté** : le serveur applique donc ses
propres plafonds (`ai_quota.js`) et garantit que le site reste utilisable.

| Mechanisme | Effet |
|------------|-------|
| Budget par famille de modèles | Les modèles **flash-lite** ont un quota Google d'environ **1 500 req/JOUR** ; les modèles **flash standard**, environ **20**. Le serveur plafonne donc séparément : 15 req/jour par modèle standard (`AI_BUDGET_PAR_MODELE`) et 150 par modèle lite (`AI_BUDGET_PAR_MODELE_LITE`), toujours sous le quota réel. |
| Budget global | 200 appels IA maximum par fenêtre glissante de 24 h (`AI_BUDGET_QUOTIDIEN`), toutes clés et tous modèles confondus. Au-delà, **aucun appel HTTP** n'est envoyé à Google. |
| Cache durable sur disque | Cours et banques d'exercices déjà générés sont conservés 30 jours (`cache/`, non versionné). Ils survivent au redémarrage de l'instance, là où le cache mémoire est perdu. |
| Cache mémoire long | 12 h au lieu de 30 min (`AI_CACHE_MEMOIRE_MINUTES`) : un cours n'est pas régénéré à chaque demi-heure. |
| Repli local | Sans IA, le serveur renvoie un cours construit à partir du programme officiel du pays (`source: "local"`), ou les 50 exercices locaux. **Jamais une erreur 502.** |
| Refroidissement côté navigateur | Le front mémorise le délai indiqué par le serveur (`localStorage`) et ne retente pas avant : bandeau « mode hors-ligne » au lieu de marteler l'API. |

L'élève voit toujours un cours et des exercices ; seul le contenu « frais »
(généré par l'IA) attend la prochaine fenêtre de quota. Le diagnostic expose
l'état réel :

```json
"quota": {
  "limiteParJourParModele": 20,
  "utilise": 7, "budgetTotal": 200, "restant": 193,
  "budgetParModele": 15, "budgetParModeleLite": 150, "fenetreHeures": 24
}
```

### Peut-on augmenter le quota ? Non — mais on peut l'utiliser mieux.

Le quota gratuit Google **ne peut pas être relevé** : 20 req/JOUR sur les
modèles flash standard, ~1 500/JOUR sur les flash-lite, remise à zéro chaque
jour. Les trois seules façons de faire plus :

1. **Activer la facturation** sur le projet Google Cloud (le quota quotidien
   disparaît, mais chaque appel est facturé : ~0,30 $ / 1 M tokens en entrée
   sur `gemini-3.5-flash-lite`, 0,75 $ sur `gemini-3.5-flash`).
2. **Un second projet Google Cloud** : le quota est par projet, donc une
   seconde clé d'un autre projet double la capacité (c'est la seule chose que
   `GEMINI_API_KEY_2` apporte — deux clés du même projet ne comptent qu'une).
3. **Cacher et partager** (déjà en place) : un cours par pays et une banque
   d'exercices par chapitre/classe sont générés une fois pour tous. C'est ce
   qui rend le quota gratuit tenable pour le volume réel du site.

## Dépannage — le chatbot ne répond pas

Ouvre dans le navigateur :

```
https://ton-app.onrender.com/v1/ai/health
```

L'endpoint teste chaque modèle de la chaîne et répond sans rien révéler de la clé :

```json
{ "success": true, "modelesDisponibles": ["gemini-3.6-flash"] }
```

- `"API key not valid. Please pass a valid API key."` → la variable `GEMINI_API_KEY` du dashboard Render est périmée ou absente. Mets-la à jour (Environment → ton service → Save & Redeploy).
- `GEMINI_API_KEY absente` → variable jamais créée sur Render.
- `success: true` avec plusieurs modèles → l'IA fonctionne ; si le chatbot reste muet, vide le cache navigateur.

Le modèle principal et la chaîne de secours sont définis dans `server.js` (valeurs par défaut) et surchargeables par `.env` en local. Pour re-mesurer les modèles disponibles : `node tools/benchmark-models.js`.

## Référencement (SEO)

L'application est une SPA : sans travail côté serveur, les moteurs de recherche ne
voient qu'une seule URL. Le serveur rend donc de vraies pages HTML indexables
(module `server_seo.js`) :

| URL | Contenu |
|-----|---------|
| `/cours/<matiere>-<niveau>[-serie-X].html` | Page landing par matière × niveau × série : titre, description, H1, programme officiel, FAQ, liens internes |
| `/cours/<slug-chapitre>.html` | Page par chapitre publié : contenu réel du cours, JSON-LD `LearningResource` + `Article` |
| `/sitemap.xml` | Accueil + toutes les pages landing + les chapitres publiés |
| `/robots.txt` | Autorise l'indexation, interdit `/admin` et `/v1/`, déclare le sitemap |

Les pages landing renvoient vers l'application avec un lien profond :
`/?matiere=Mathématiques&niveau=bac&serie=C` (`app.js` → `applyDeepLink()`),
et `&quiz=1` ouvre directement l'onglet QCM pour un élève connecté.

Points importants :

- Les URL canoniques (`<link rel="canonical">`, `og:url`) sont **absolues** et pointent
  vers `APP_BASE_URL_FRONT`. Les liens de navigation, eux, restent **relatifs** pour
  rester sur le domaine courant.
- Un fichier statique absent renvoie un **vrai 404**. Le repli sur `index.html`
  ne concerne que les routes sans extension (routage de la SPA) : sinon
  `/robots.txt` renverrait le HTML de l'application en faux 200.
- `GET /v1/ai/health` expose `"supabase": { "urlConfiguree", "clePublique", "cleService", "lecture" }`.
  Si `"lecture": "configuration absente"`, le sitemap ne contient que les pages
  landing : ajoute `SUPABASE_URL` et `SUPABASE_ANON_KEY` sur Render.
- Après chaque modification du programme officiel, vide le cache du sitemap
  (10 minutes) ou redéploie sur Render.

Pour vérifier après déploiement :

```
https://revisy.onrender.com/robots.txt
https://revisy.onrender.com/sitemap.xml
https://revisy.onrender.com/cours/mathematiques-terminale-serie-c.html
```
