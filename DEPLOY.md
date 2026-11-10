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

> **Plus simple :** le fichier `MIGRATION_TOUT.sql` contient les 15 migrations
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
| 15 | `schema_epreuves.sql` | banque d'épreuves : sujets gratuits, corrigés payants, déblocages (`unlocked_epreuves`), bucket privé `epreuves` |

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
node tools/test-quota.js        # budget IA, cache durable, repli sans IA (44 tests)
node tools/test-epreuves.js      # règles d'accès aux épreuves (54 tests)
node tools/test-epreuves-http.js # serveur réel en HTTP : 402 sans fuite d'URL (71 tests)
node tools/audit-site.js        # contrôle statique du front (0 anomalie attendue)
node tools/verifier-migration.js # état réel de la base (lecture seule)
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
| `SUPABASE_SERVICE_KEY` | Clé `service_role` (Supabase → Settings → API) : **obligatoire pour le déblocage des cours payants** (le serveur écrit avec cette clé, jamais le navigateur), pour mémoriser les banques d'exercices, et pour signer les liens des épreuves stockées dans le bucket `epreuves`. Ne jamais la mettre dans `config.js`. |
| `EPREUVES_DIR` | Optionnel, défaut `epreuves/` : dossier du serveur où sont déposés les PDF d'épreuves servis en local. |
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

### Durcissement du paiement (ce qui bloque une fraude)

| Contrôle | Où | Ce qu'il bloque |
|---|---|---|
| **Montant relu en base** | `resolveOfficialAmount` | Le montant payé est comparé au prix **officiel** de la base, pas au montant proposé par le navigateur |
| **Liaison obligatoire à l'élève** | `applyVerifiedPayment` | Une transaction sans métadonnées (ni `user_id`, ni e-mail) est **refusée** : elle ne peut pas débloquer un contenu pour un compte arbitraire |
| **Transaction liée au bon achat** | idem | Le `kind`, le chapitre et l'épreuve de la transaction doivent correspondre à l'achat demandé |
| **Anti-rejeu** | `payment_receipts` | Un identifiant de transaction ne peut servir qu'une fois (contrainte d'unicité en base) |
| **Reçu réservé avant déblocage** | `claimReceipt` | Deux requêtes simultanées ne peuvent pas utiliser le même paiement |
| **URL de retour contrôlée** | `urlRetourPaiement` | Après paiement, l'élève revient **sur le site** : une URL de retour extérieure est ignorée |
| **Signature du webhook** | HMAC + comparaison constante | Une notification FedaPay forgée est rejetée (401) |

**À activer sur Render** : `FEDAPAY_WEBHOOK_SECRET` (le même secret que celui
défini dans le tableau de bord FedaPay). Sans lui, le webhook est refusé et
l'élève qui ferme l'onglet après avoir payé n'est pas débité automatiquement.

## Sécurité de l'espace administrateur

L'administration n'est pas « une page du site » : c'est un espace séparé, protégé
par **cinq barrières indépendantes**. Une seule qui tombe ne suffit pas à ouvrir
le back-office.

| Barrière | Où | Ce qu'elle bloque |
|---|---|---|
| **1. Rôle non falsifiable** | base (`profiles.role`) | Un élève ne peut pas se nommer admin |
| **2. Liste stricte d'administrateurs** | serveur (`ADMIN_EMAILS`) | Même avec le rôle en base, seule l'adresse vérifiée par Supabase Auth passe |
| **3. Double authentification (TOTP)** | serveur (`exigerAdmin`) | Un mot de passe volé ne suffit plus |
| **4. Page admin non publique** | serveur (`/admin-panel`) | Le balisage du back-office n'est pas servi aux visiteurs |
| **5. Journal + limitation de débit** | serveur | Chaque action est tracée, les rafales sont bloquées |

### 1. Le rôle ne peut pas être modifié par un élève

C'est la barrière la plus importante : sans elle, les trois autres ne servent
à rien (un élève seDeclare admin dans la base et passe partout).

- `handle_new_user` (base) crée **toujours** un compte « client » : le rôle
  envoyé par le navigateur à l'inscription est ignoré.
- `protect_profile_role` (base) remet le rôle d'origine si un élève tente de
  l'écrire ; un administrateur ou la clé `service_role` restent/master.
- Les droits de mise à jour sur `profiles` sont limités aux colonnes
  `name`, `email`, `niveau`, `classe`, `serie`, `pays` : la colonne `role`
  n'est plus modifiable par un élève, même sans le déclencheur.

**Promouvoir un administrateur** (une seule fois, dans le SQL Editor) :

```sql
update public.profiles set role = 'admin' where email = 'adresse@exemple.com';
```

### 2. La liste stricte d'administrateurs (ADMIN_EMAILS)

Le rôle `admin` en base **ne suffit plus** : le serveur compare aussi l'adresse
du compte à une liste stricte (2 maximum), et cette comparaison porte sur
l'adresse **vérifiée par Supabase Auth** (`GET /auth/v1/user`), jamais sur la
colonne `profiles.email` — cette colonne est modifiable par l'élève lui-même et
ne vaudrait donc aucune preuve d'identité.

```
ADMIN_EMAILS=melofils2024@gmail.com,m.second-admin@exemple.com
```

- Liste vide (`ADMIN_EMAILS=`) = **aucun** administrateur autorisé (fail-closed) :
  le back-office reste fermé à tout le monde.
- Variable absente = la liste par défaut du dépôt s'applique (le propriétaire
  n'est jamais verrouillé dehors).
- Les **deux administrateurs officiels** (`melofils2024@gmail.com`,
  `dareitmahougnon@gmail.com`) sont autorisés **même si** `ADMIN_EMAILS` est
  absent ou périmé sur Render : un administrateur légitime n'est jamais
  verrouillé dehors, quelle que soit la configuration du serveur.
- Après connexion, `GET /v1/auth/me` renvoie l'adresse retenue : vérifie qu'elle
  correspond bien à la liste (c'est elle qui est comparée, pas une autre).

### 3. La double authentification (mot de passe + code TOTP)

Le serveur refuse tout l'espace admin à une session qui n'est pas de niveau
`aal2` (mot de passe + second facteur validé). Le contrôle est **côté serveur** :
modifier le navigateur ne change rien.

**À activer une fois pour que ce soit possible :**

1. Supabase → **Authentication → Sign In / Providers → Multi-Factor Authentication**
   → activer **TOTP**.
2. Au premier accès admin, le site propose l'activation : scan du QR code avec
   une application d'authentification (Google Authenticator, Authy, 1Password),
   puis saisie du code à 6 chiffres. La session passe en `aal2`.
3. Chaque connexion admin suivante demande le code.

Variable d'environnement (Render) :

```
ADMIN_MFA_REQUIS=on      # valeur par défaut : fail-closed
ADMIN_MFA_REQUIS=off     # dérogation de dépannage uniquement
```

Comportement exact :

| Situation | Accès admin |
|---|---|
| `on` + session `aal2` | autorisé |
| `on` + session `aal1` **et** un TOTP enregistré | **refusé** (403 `MFA_REQUIS`) |
| `on` + session `aal1` **et aucun** TOTP enregistré | autorisé, mais **bandeau d'alerte** dans le back-office + événement journalisé |
| `off` | autorisé dès le mot de passe (dérogation) |

Le cas « aucun TOTP enregistré » ne peut pas être bloqué : ce serait impossible
d'entrer pour la première fois. Il est donc **visible** (bandeau) et **tracé**
(`admin_journal`, action `admin_acces_sans_mfa`).

### 4. La page admin n'est pas livrée aux visiteurs

Le balisage du back-office n'est **pas** dans `index.html` : il est dans
`admin.html`, et le serveur ne le sert qu'à un administrateur authentifié
(`GET /admin-panel`). Un visiteur reçoit un 404, et `admin.html` n'est pas
dans la liste des fichiers publics du serveur.

### 5. Journal et limitation de débit

- Chaque action d'administration est écrite dans `admin_journal`
  (qui, quoi, quand) : création, modification, publication d'une campagne,
  téléversement d'un document.
- L'espace admin est limité à **40 requêtes par minute** par IP.

### Tester la sécurité

```bash
node tools/test-securite.js        # 79 contrôles : statiques + HTTP réels
node tools/test-migration-sql.js   # 15 contrôles sur les scripts SQL
```

Le contrôle vérifie notamment qu'un visiteur anonyme, un élève, un admin hors
liste `ADMIN_EMAILS` et un admin sans second facteur sont tous refusés — sur la
page comme sur les API.

### En cas de compromission d'un compte admin

**Procédure complète, dans cet ordre** (script prêt à coller) :

1. **SQL Editor Supabase** → colle et exécute `LIBERATION_ET_SECURITE_ADMIN.sql`.
   Le script, dans l'ordre :
   - expulse **toutes** les sessions, jetons de rafraîchissement et facteurs MFA
     (les pirates sont déconnectés partout) ;
   - remplace la fonction d'inscription vulnérable (`handle_new_user`) : le rôle
     n'est plus lu dans les métadonnées du navigateur ;
   - installe `protect_profile_role` (l'élève ne peut plus écrire le rôle) et
     retire le droit de mettre à jour la table entière ;
   - rétrograde en « client » tous les administrateurs qui ne sont pas le
     propriétaire, **y compris** les comptes dont l'e-mail de profil est vide ;
   - rétablit le rôle « admin » du propriétaire (comparaison sur `auth.users`) ;
   - installe le verrou « 2 administrateurs maximum » ;
   - affiche le contrôle final (qui est admin maintenant ?).
2. **Change le mot de passe** de ton compte (Supabase → Authentication → Users).
   Un mot de passe compromis ne peut pas être « révoqué » autrement.
3. **Active le TOTP** (Supabase → Authentication → Sign In / Providers → MFA).
4. **Render** : vérifie `ADMIN_EMAILS`, `ADMIN_MFA_REQUIS=on`,
   `SUPABASE_SERVICE_KEY`, `FEDAPAY_WEBHOOK_SECRET`, puis **redéploie** (une
   variable ajoutée ne prend effet qu'au redémarrage du service).
5. **Consulte `admin_journal`** : qui a fait quoi, et depuis quand.
6. Si un compte pirate est identifié (contrôle final du script), supprime-le
   (bloc commenté « 7 » du script) après avoir vérifié que ce n'est pas un élève.

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

### Conformité et provenance du contenu

Toute donnée publiée est étiquetée par son `source` et ne prétend jamais à une
authenticité non étayée :

| `source` | Sens | Statut |
|----------|------|--------|
| `manuel` / `ia` (curriculum_sequences) | saisie manuelle ou générée | en révision par admin |
| `revizy_generic` | modèle Revizy aligné sur le Bénin (cloné pour d'autres pays) | **secours**, jamais officiel national |
| `national_officiel` | programme validé par l'autorité éducative du pays | **valide uniquement** après sources publiques associées |

Le déploiement ne doit jamais publier un `national_officiel` tel que le
présente cette doc. Avant toute publication, exécutez :

```bash
node tools/audit-provenance.js   # exit 0 requis
node tools/audit-statique-securite.js
```

`MIGRATION_17_seed_pays.sql` et `MIGRATION_18_programmes_offeres.sql` ne clonent
que du contenu `revizy_generic` pour Togo, Côte d'Ivoire, Sénégal et 62 autres
pays Afrique/Europe/Amérique proposés par Revizy. Ils sont publiés sous cette
étiquette précise, jamais comme programmes nationaux officiels.

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

## Banque d'épreuves (sujets gratuits + corrigés payants)

Onglet **🗂️ Épreuves d'examen** côté élève, onglet **🗂️ Épreuves** côté admin.
Le modèle est le même que pour les cours : **le sujet attire le trafic, le
corrigé est la valeur monétisée**.

### Le principe de sécurité

> Le fichier n'est **jamais** exposé en direct.

1. le front demande le catalogue (`GET /v1/epreuves`) → il reçoit des
   métadonnées publiques (titre, matière, année, prix, **source + licence**),
   mais **pas** de chemin de fichier ;
2. l'élève clique « Télécharger » → le serveur vérifie ses droits ;
3. le serveur répond soit `402` (paiement requis), soit le fichier lui-même,
   soit une URL signée valable 5 minutes, soit la source externe.

Un corrigé non payé ne renvoie **aucune URL** — pas même un nom de fichier.

### Ce qui donne accès à un corrigé payant

| Situation | Accès |
|-----------|-------|
| Sujet (`is_free = true`) | toujours, même sans compte |
| Corrigé acheté (ligne dans `unlocked_epreuves`) | oui |
| Abonnement mensuel actif sur le niveau | oui |
| Administrateur | oui |
| Aucune des situations ci-dessus | **402 PAIEMENT_REQUIS** |

Le déblocage est écrit **uniquement côté serveur**, après validation du
paiement FedaPay (même chemin que les chapitres : `payment_receipts` +
`unlocked_epreuves`). L'élève ne peut jamais s'accorder le droit lui-même :
aucune policy d'insertion n'existe sur `unlocked_epreuves` pour `authenticated`.

### Les formats acceptés

Le sujet n'est pas forcément un PDF. La colonne `format` décrit le document :

| Format | Type MIME | À l'écran |
|--------|-----------|-----------|
| `pdf` | `application/pdf` | s'affiche dans l'onglet |
| `docx`, `doc`, `odt` | Word / OpenDocument | se télécharge |
| `xlsx`, `xls` | Excel | se télécharge |
| `zip`, `rar` | archive | se télécharge |
| `png`, `jpg`, `gif`, `webp` | image | s'affiche |
| `txt`, `csv` | texte | s'affiche / se télécharge |

Le format est **déduit de l'extension** quand il n'est pas renseigné ; les
extensions exécutables (`.exe`, `.scr`…) ne sont jamais servies. Le serveur
choisit `inline` (affichage) ou `attachment` (téléchargement) selon le type.

### Ciblage par classe et série

Chaque épreuve peut viser une **classe** (`3e` pour le brevet, `Tle` pour le
BAC) et une **série** (`A`, `B`, `C`, `D`, `G`). Le catalogue se filtre dessus
(`?classe=Tle&serie=C`), ce qui évite de proposer à un élève de Terminale
série A une épreuve de Terminale série C. Une épreuve sans classe ni série
reste visible par tous.

### La rigueur du corrigé — ce qui justifie le prix

C'est le cœur de la proposition : l'élève paie pour une correction fiable.
Le module l'impose par la mécanique, pas par une promesse :

1. la **solution rédigée** vit dans une table séparée (`epreuve_corrections`),
   jamais dans le catalogue public ;
2. elle n'est exposée à l'élève **qu'après paiement** (le serveur la joint
   lui-même) ;
3. **un corrigé payant ne peut pas être publié** tant que la fiche est
   incomplète : solution rédigée (80 caractères minimum), barème, prix et
   **validation humaine** ;
4. avant d'acheter, l'élève voit l'**aperçu** (barème, difficulté, mention
   « validé par l'équipe ») — jamais la solution ;
5. après l'achat, il lit la solution dans le site et peut la télécharger ;
6. s'il trouve une erreur, il la **signale** : l'admin la voit dans le
   back-office et corrige.

Ces règles sont appliquées **côté serveur** (`verifierPublication`) : le
back-office et l'importeur par manifeste les partagent. Un client qui
contourne le navigateur ne peut pas publier un corrigé non validé.

### L'activité des élèves (vue admin)

L'onglet « 🗂️ Épreuves » affiche, pour chaque épreuve : nombre d'achats,
de téléchargements, de consultations et de signalements. En dessous, le
journal nominatif (élève, pays, classe, épreuve, action, date) et la liste
des signalements d'erreur.

Le journal des **téléchargements et consultations** est écrit par le serveur
avec la clé service : sans `SUPABASE_SERVICE_KEY` sur Render, les achats
restent visibles (table `unlocked_epreuves`) mais les téléchargements ne sont
pas journalisés — l'admin voit alors un bandeau qui le signale.

### Les trois façons de stocker un fichier

La colonne `fichier_url` est une référence, interprétée par le serveur :

| Valeur | Comportement |
|--------|--------------|
| `https://…` | lien externe (source officielle) : redirection **après** contrôle des droits |
| `supabase:nom.pdf` | objet du bucket privé `epreuves` : URL signée par le serveur (5 min) |
| `nom.pdf` | fichier local du dossier `epreuves/` (dossier du dépôt ou variable `EPREUVES_DIR`) |

Le bucket `epreuves` est **privé** (`public = false`) : un lien direct ne donne
rien. La signature exige `SUPABASE_SERVICE_KEY` ; sans elle, le serveur
répond 503 au lieu de renvoyer un lien non contrôlable.

### D'où viennent les documents ?

Trois origines possibles — et une seule règle : **on ne publie que ce dont on
connaît la source ET le droit de reprise**.

**1. Les documents écrits par ton équipe** (sujet, corrigé, barème rédigés à la main)

- Tu es le titulaire des droits : aucune licence tierce à déclarer.
- C'est **la meilleure source pour les corrigés** : c'est toi qui peux garantir
  que la correction est juste, et c'est précisément ce que l'élève paie.
- Onglet admin « Épreuves » : titre, solution rédigée, barème, difficulté, et
  la case « j'ai relu et validé ».

**2. Les sujets d'examen officiels**

- Offices d'examens nationaux, ministères de l'Éducation, archives nationales :
  les sujets d'examen sont des documents publics, mis en ligne par l'office.
- Mais le statut n'est pas automatique : pour chaque document, note la source
  exacte et le droit de reprise (« domaine public », « usage libre par l'office
  d'examens », « autorisation obtenue le … »).
- Les **corrigés officiels**, eux, sont souvent réservés à leur éditeur. Dans
  ce cas, écris ton propre corrigé (option 1) : c'est de toute façon la
  solution la plus rentable et la seule qui garantisse la justesse.

**3. Les documents librement réutilisables**

- Wikimedia Commons (la licence est explicite sur la page du fichier : CC
  BY-SA, CC BY, PD), dépôts institutionnels ouverts, archives ouvertes.
- Reprends **la licence et l'auteur** dans `source_nom` / `source_url` /
  `licence`.
- ⚠️ Wikipédia n'est pas une réserve de sujets d'examen : ses pages sont
  sous licence CC BY-SA (à citer) mais ce ne sont pas des documents d'examen.

> **Règle absolue : pas de récupération automatique.** Un manifeste sourcé et
> licencié précède toujours la mise en ligne. L'importeur *refuse* un
> document sans `source_nom` ou sans `licence`, et le back-office aussi.

### Sources concrètes : ce qu'on peut reprendre, ce qu'on ne peut pas

Toutes les banques ci-dessous ne se valent pas juridiquement. Le critère n'est
pas « le site est gratuit » mais **« qui est le titulaire des droits et quelle
est l'autorisation de reprise »**.

| Source | Verdict | Ce qu'on fait |
|--------|---------|----------------|
| **Office d'examens / ministère** (ONEB, ministère de l'Éducation, archives nationales) | ✅ utilisable | Sujet d'examen = document public. On note la source exacte et le droit de reprise. **L'URL de la source** dans `source_url` suffit — pas besoin de recopier le PDF. |
| **Établissements et miscellaneous d'enseignants** (CEG, lycées, profils d'enseignants) | ⚠️ à vérifier | Demande une autorisation écrite (un message suffit) : le professeur est l'auteur. Sans autorisation → on **lie** au lieu de recopier. |
| **Sites à petit budget de sujets** (type Studirex, EducBénin) | ⚠️ lien uniquement | Ces fichiers sont des numérisations faites par des tiers, sans licence de redistribution : les recopier en masse, c'est de la reproduction d'œuvre protégée. On **met l'URL externe** dans `fichier_url` (le serveur redirige après contrôle des droits) ou on n'en met rien. |
| **Agrégateurs commerciaux** (Fomesoutra, SujetDeBac, Minafrique, SunuEdu, SenMaths) | ❌ ne pas recopier | Contenus commerciaux, droits réservés, conditions d'utilisation interdisant la copie. Mass-downloader = infraction + blocage. On s'en tient à **s'inspirer de la structure** pour construire sa propre banque. |
| **OpenStax, Wikimedia Commons** | ✅ réutilisable | Licence explicite (CC BY / CC BY-SA / PD) : on reprend en **citant l'auteur et la licence** dans `source_nom` / `source_url` / `licence`. Ce sont des manuels et exercices, pas des sujets d'examen. |

En pratique, la combinaison qui rapporte le plus : **sujet officiel** (gratuit,
via son URL) + **corrigé rédigé par toi** (payant, avec barème et validation) —
c'est exactement le modèle que le back-office et l'importeur appliquent déjà.

> Le point le plus rentable reste le corrigé : c'est le seul contenu que tu
> peux vendre sans dépendre de la licence d'un tiers.

### Les 4 banques d'annales retenues (liens, jamais de copie)

Ces quatre sites ont été retenus comme **référentiels externes** : l'élève
y accède par un lien, Revizy n'héberge et ne recopie aucun de leurs PDF.
Les liens sont affichés à l'élève dans l'onglet « Épreuves d'examen »
(bas de l'onglet), via `SOURCES_EPREUVES` dans `contexts.js`.

| Source | URL vérifiée | Contenu | Verdict | Ce qu'on fait |
|--------|--------------|---------|---------|---------------|
| **Studirex Bénin** | https://www.studirex.com/ | Sujets BAC / BEPC / CEP, classés par matière, année, établissement. Aperçu gratuit, PDF payant (100 FCFA via FedaPay). | ⚠️ lien uniquement | Catalogue le plus utile pour les élèves : on le met en avant. Aucune reprise de ses PDF. |
| **EducBénin** | https://www.educbenin.com/epreuves.php | Banque partagée par les établissements du Bénin : devoirs des CEG, compositions, corrigés types. | ⚠️ lien uniquement | Lien masqué pour l'instant : le domaine ne résout plus (DNS NXDOMAIN sur 8.8.8.8 et 1.1.1.1 le 04/11/2026). À réactiver si le site revient. |
| **Fomesoutra** | https://www.fomesoutra.com/ | Annales et épreuves de Terminale : bac blancs, sessions d'Afrique de l'Ouest, dossiers par épreuve et par année. | ❌ ne pas recopier | On s'inspire de la structure (dossier = année × type d'épreuve × établissement) pour notre propre banque. |
| **Sujet de Bac** | https://www.sujetdebac.fr/ | Archives du baccalauréat général et technologique, classées par matière, série et année. | ❌ ne pas recopier | Référence de structure uniquement (bac français, hors périmètre BJ/TG/CI/SN). |

> ⚠️ `educbenin.com` ne résout plus au moment de la rédaction. Le lien est
> conservé dans les données avec `statut: 'injoignable'` et **n'est pas
> affiché** ; le test `tools/test-sources-epreuves.js` vérifie qu'un lien
> injoignable ne peut pas réapparaître par accident dans l'interface.

Deux usages concrets, distincts :

1. **Côté élève** — le bloc « Où trouver les sujets d'examen » (onglet
   Épreuves) renvoie vers ces catalogues. C'est ce qui remplace le
   « téléchargement massif » : l'élève va à la source, on ne sert que nos
   propres fiches et nos propres corrigés.
2. **Côté back-office** — pour publier *une* épreuve dont on a le droit,
   l'onglet Épreuves accepte une URL externe dans « Fichier (référence) »
   (`https://…`). Le serveur vérifie les droits puis redirige ; le
   `source_nom`, le `source_url` et la `licence` restent obligatoires.

Ne **jamais** utiliser `tools/import-epreuves.js` sur ces sites : cet outil
télécharge les fichiers pour les héberger chez nous, ce qui est précisément
ce que ces verdicts interdisent.

### Chemin 5 — la génération automatique (l'IA remplit la campagne)

Quand la grille de couverture montre des cases vides, le back-office peut
**les faire remplir automatiquement** : le modèle rédige le sujet (et le
corrigé) à partir du programme officiel, la base stocke le contenu, le
serveur rend le PDF au moment du téléchargement.

| Élément | Valeur |
|---------|--------|
| Module | `server_epreuves_ia.js` (prompt, normalisation, écriture) |
| Endpoint | `POST /v1/admin/epreuves/generer` (admin uniquement) |
| Table | `epreuve_contenus` (les blocs du document, en JSONB) |
| Rendu | PDF produit à la volée au téléchargement : aucun fichier à héberger |
| Back-office | bouton « ✎ sujet » sur chaque case vide + « ✎ Générer les cases vides » |
| Test | `node tools/test-epreuves-ia.js` (31 contrôles) |

Règles qui ne bougent pas :

- le **programme vient de la base** (`curriculum_sequences`), le référentiel
  local ne sert qu'à compléter — le site suit donc la base à la lettre ;
- un **corrigé payant reste « non validé »** tant qu'un humain ne l'a pas
  relu : la relecture est la condition de la publication (cf.
  `verifierPublication`) ;
- **une épreuve = un appel au modèle**, donc le quota gratuit (20 par jour)
  borne le nombre de générations : le back-office affiche la progression et
  s'arrête quand le quota est atteint.

### Chemin 6 — l'indexation automatique des documents officiels

| Outil | Rôle |
|-------|------|
| `node tools/chercher-sujets-officiels.js --ecrire` | lit les pages **officielles** (ministère), extrait titre/date/lien et écrit `epreuves/sujets-officiels.json` |
| `node tools/publier-sujets-officiels.js --appliquer` | publie chaque document du manifeste comme **lien externe** (clé service requise) |

L'indexeur ne télécharge **jamais** un PDF : il ne garde que des
métadonnées et l'adresse de la source. Seuls les domaines de la liste
blanche (`enseignementsecondaire.gouv.bj`, `gouv.bj`) sont lus, et le
contrôle est refait après redirection.

> Constat mesuré le 04/11/2026 : le ministère publie communiqués, guides
> d'orientation et statistiques, mais **pas les sujets d'examen eux-mêmes**
> (ils sont diffusés par l'office des examens et les établissements). C'est
> pourquoi les épreuves types générées (chemin 4 et 5) sont la source
> téléchargeable qui tient dans la durée.

### Les trois chemins pour mettre un document en ligne

| Chemin | Quand | Ce qu'il faut |
|--------|-------|---------------|
| **1. Le back-office** | quelques épreuves | l'onglet « Épreuves » : formulaire complet |
| **2. Dépôt de fichier** | le document est chez toi | « Déposer le document » dans le formulaire : le fichier part dans le stockage privé, la référence est remplie automatiquement |
| **3. Import par manifeste** | un lot | `epreuves/sources.json` + `node tools/import-epreuves.js` |
| **4. Épreuves types** | un sujet **écrit par nous** | `tools/epreuves-types/` + `node tools/generer-epreuves-types.js` |

Le chemin 2 dépose le fichier dans le bucket privé `epreuves` (il faut
`SUPABASE_SERVICE_KEY` sur Render). Sans elle, le fichier atterrit dans le
dossier local du serveur : l'essai fonctionne, mais le disque de Render est
éphémère, le document sera perdu au prochain redémarrage.

### Chemin 4 — les épreuves types (téléchargeables sans base de données)

Les **sujets officiels** passent par la base (chemins 1 à 3). Les **épreuves
types**, elles, sont des sujets que **nous écrivons** : document original,
donc libre de rediffusion, et distribuable directement.

Elles sont servies **sans dépendre de Supabase** : le dépôt contient les
fichiers, donc l'élève peut télécharger un sujet même si la migration n'est
pas encore appliquée.

| Élément | Valeur |
|---------|--------|
| Contenu source | `tools/epreuves-types/contenu-*.js` (un fichier par matière) |
| Générateur | `node tools/generer-epreuves-types.js` |
| Sortie | `epreuves/types/*.pdf`, `epreuves/types/*.docx`, `epreuves/types/catalogue.json` |
| Catalogue (API) | `GET /v1/epreuves-types` |
| Téléchargement | `GET /v1/epreuves-types/<fichier>` (PDF en affichage, Word en pièce jointe) |
| Sécurisation | liste blanche : seuls les fichiers déclarés dans `catalogue.json` sont servis ; nom strict, extension autorisée, `..` refusé |
| Test | `node tools/test-epreuves-types.js` (19 contrôles, dont le refus de la traversée de chemin) |

Les générateurs PDF et Word sont écrits **en Node pur** (`tools/lib/pdf-mini.js`,
`tools/lib/docx-mini.js`) : aucune dépendance, aucune installation Python ou
Chromium requise. Pour ajouter une épreuve type :

1. écrire le contenu dans `tools/epreuves-types/contenu-<matière>.js` (blocs :
   `titre`, `sousTitre`, `texte`, `consigne`, `liste`, `tableau`) ;
2. l'ajouter à `tools/epreuves-types/index.js` ;
3. lancer `node tools/generer-epreuves-types.js` ;
4. commiter les fichiers générés : **le catalogue est dans le dépôt**, le
   serveur n'a pas besoin de le construire.

> Un sujet d'examen officiel reste un document public : on peut le
> **lier** (`source_url`) ou le déposer après vérification de la licence.
> Un corrigé payant, lui, exige une solution rédigée, un barème et la
> validation humaine (voir le back-office).

### Ajouter des épreuves

**Depuis le back-office (le plus simple)** — onglet « 🗂️ Épreuves » :
un formulaire (pays, niveau, classe, série, année, matière, type, **format**,
titre, prix, **source**, **lien de source**, **licence**) et, pour un corrigé
payant, la fiche correction (barème, difficulté, solution rédigée, case
« j'ai relu et validé »). Le champ « Fichier » accepte une URL ou
`supabase:nom.pdf` ; le bouton **« Déposer le document »** envoie le fichier
que tu as sur ton ordinateur et remplit la référence tout seul. Pour un PDF
local déposé à la main, il faut le placer dans le dossier `epreuves/` du
serveur.

**Par lot, depuis un manifeste** (recommandé pour une importation) :

```bash
node tools/import-epreuves.js epreuves/sources.json --dry-run  # contrôle sans écrire
node tools/import-epreuves.js epreuves/sources.json             # écriture en base
node tools/import-epreuves.js epreuves/sources.json --upload   # + dépôt dans le bucket
```

Le format est celui de `epreuves/sources-exemple.json` :

```json
{
  "documents": [
    {
      "pays": "BJ", "niveau": "bac", "classe": "Tle", "serie": "C",
      "annee": 2024,
      "matiere": "Mathématiques", "type": "sujet",
      "titre": "Épreuve de Mathématiques — BAC 2024",
      "fichier_url": "bj-bac-2024-math-sujet.pdf",
      "format": "pdf",
      "source_nom": "ONEB",
      "source_url": "https://oneb.bj",
      "licence": "domaine public",
      "is_free": true, "price": 0
    }
  ]
}
```

Pour un **corrigé payant**, le manifeste porte en plus la correction :

```json
{
  "type": "corrige", "is_free": false, "price": 200,
  "solution": "1) … 2) … Barème total : 20 points.",
  "bareme": 20, "difficulte": "moyen", "validee": true
}
```

**Un document sans `source_nom` ni `licence` est refusé** : c'est volontaire.
Seul est repris ce dont on connaît l'origine **et** le droit de reprise
(domaine public, usage libre par l'office d'examen, CC BY-SA…). Pas de
récupération automatique de Wikipédia : un manifeste sourcé et licencié
précède toujours la mise en ligne.

**Un corrigé payant sans correction complète et validée est refusé**, par
l'importeur comme par le back-office (mêmes règles, même code).

### Voir ce qui manque : la couverture de campagne

Onglet **🗂️ Épreuves** → encadré **« Couverture de la campagne »** (en haut).

Tu choisis un **pays**, un **niveau** et une **année**, et le back-office
affiche une grille :

- en ligne : **matière × (classe, série)** — la grille vient du **programme
  officiel**, pas du catalogue : elle reste complète même quand rien n'est
  encore publié ;
- chaque case indique `—` (rien), `½` (sujet ou corrigé seulement) ou `✓`
  (sujet **et** corrigé) ;
- le résumé donne le nombre de cases complètes, partielles, vides et le taux
  de couverture ;
- **« Publier la campagne »** publie en un clic tout ce qui est publiable. Le
  serveur refuse ce qui est incomplet (source ou licence absente, corrigé non
  validé) et **liste les refus** avec la raison : rien n'est publié en silence.

C'est l'outil qui sert à « actualiser les épreuves pour toutes les classes » :
on voit la grille, on comble les cases, on publie.

### Voir qui a le rôle « admin » (audit)

Onglet **👥 Gestion Élèves** → encadré **« Comptes administrateurs »**.

C'est l'écran à regarder après une intrusion, et à garder en habits :

| Colonne | Ce qu'elle dit |
|---------|-----------------|
| Adresse vérifiée | L'adresse **Supabase Auth** du compte (pas `profiles.email`, falsifiable par l'élève) |
| Autorisé ? | Vert = compte autorisé à ouvrir le back-office · Rouge = rôle `admin` résiduel, **accès refusé par le serveur** |

**« Rétrograder »** retire le rôle `admin` d'un compte non autorisé (écriture
serveur, action journalisée dans `admin_journal`). Les deux administrateurs
officiels sont protégés : leur rétrogradation est refusée.

Cet audit a besoin de `SUPABASE_SERVICE_KEY` pour lire la liste complète des
comptes ; sans elle, l'écran affiche un avertissement au lieu d'un faux « tout
va bien ».

> Un rôle `admin` résiduel n'est pas un accès : tant que l'adresse du compte
> n'est pas dans la liste autorisée, le serveur refuse l'accès à chaque
> requête. Le rétrograder, puis supprimer le compte, nettoie la base.

### Le prix

Le prix affiché fait foi : il est relu **en base** au moment de créer la
transaction (`resolveExpectedAmount`), jamais accepté depuis le navigateur.
L'élève ne peut proposer ni moins que le prix en base, ni plus (le serveur
retient le maximum des deux, et le montant est revérifié dans le webhook
FedaPay avant le déblocage).

### Ce qu'il faut faire côté Supabase / Render

1. appliquer la migration `schema_epreuves.sql` (incluse dans
   `MIGRATION_TOUT.sql`, position 15) : elle crée `epreuves`,
   `unlocked_epreuves`, `epreuve_corrections`, `epreuves_activites`,
   `epreuves_signalements` et le bucket privé `epreuves` ;
2. vérifier avec `node tools/verifier-migration.js` ;
3. **avant** de vendre un corrigé, s'assurer que `SUPABASE_SERVICE_KEY` est
   bien posée sur Render : sans elle, l'élève paie et le déblocage ne peut
   pas être écrit ;
4. pour suivre l'activité des élèves (téléchargements, consultations),
   `SUPABASE_SERVICE_KEY` est également nécessaire : c'est le serveur qui
   écrit le journal.

### Tests

```bash
node tools/test-epreuves.js       # 54 tests — accès, formats, traçabilité, règles de publication
node tools/test-epreuves-http.js   # 71 tests — le vrai serveur en HTTP (faux Supabase)
```

Le second est le plus important : il démarre `server.js`, interroge les
routes, et vérifie qu'un corrigé non payé renvoie `402` **sans aucune URL**,
que la solution rédigée n'apparaît ni dans le catalogue ni dans l'aperçu,
qu'un corrigé débloqué est bien servi, qu'un Word est proposé en
téléchargement, qu'une remontée de dossier (`../../`) est neutralisée,
qu'un lien externe n'est révélé qu'après contrôle des droits, qu'un corrigé
payant sans correction validée ne peut pas être publié, et que l'admin voit
l'activité des élèves.

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
