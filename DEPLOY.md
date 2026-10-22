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

| Ordre | Fichier | Rôle |
|-------|---------|------|
| 1 | `schema.sql` | profils, paiements, RLS, fonctions de base |
| 2 | `schema_v2.sql` | niveaux, séries, matières, chapitres, règles de prix |
| 3 | `schema_curriculum.sql` | RPC `get_curriculum_topics` |
| 4 | `seed_curriculum.sql` | programme officiel initial |
| 5 | `schema_programme.sql` | table `curriculum_sequences` + RPC admin (onglet « Programme officiel ») |
| 6 | `schema_classe.sql` | classe/série de l'élève + table `quiz_banks` (banque d'exercices personnalisée) |

Le fichier 5 est celui qui active l'onglet **📚 Programme officiel** du back-office :
l'admin y saisit (ou fait rechercher par l'IA) les parties clés du programme,
et les cours sont ensuite générés automatiquement dans cet ordre exact.

Le fichier 6 enregistre la **classe et la série** de chaque élève inscrit, et la table
`quiz_banks` qui mémorise les banques d'exercices. Sans lui, la banque d'exercices
personnalisée de l'espace élève reste désactivée.

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

## Variables d'environnement obligatoires (Render)

Le projet est un **service web Node** (`npm start` → `server.js`), pas un site statique.

| Variable | Rôle |
|----------|------|
| `GEMINI_API_KEY` | Clé Google AI Studio — **obligatoire**, sinon le chatbot et la génération de cours renvoient une erreur |
| `GEMINI_MODEL` | Optionnel, défaut `gemini-3.6-flash` (3.7/3.8 sont souvent saturés par Google) |
| `GEMINI_FALLBACK_MODELS` | Optionnel, défaut `gemini-3.5-flash,gemini-flash-latest,gemini-3.7-flash,gemini-3.8-flash` (sans secours, une saturation de Google met tout le site hors service) |
| `SUPABASE_URL` / `SUPABASE_ANON_KEY` | Base de données — **nécessaires aussi côté serveur** : le sitemap (pages par chapitre) et la lecture du prix des cours se font par l'API REST. Sans eux, `GET /v1/ai/health` affiche `"supabase": { "lecture": "configuration absente" }` |
| `SUPABASE_SERVICE_KEY` | Clé `service_role` (Supabase → Settings → API) : **obligatoire pour le déblocage des cours payants** (le serveur écrit avec cette clé, jamais le navigateur) et pour mémoriser les banques d'exercices. Ne jamais la mettre dans `config.js`. |
| `APP_BASE_URL_FRONT` | URL publique du site (utilisée pour les URL canoniques, le sitemap et les balises de partage). Défaut `https://revisy.onrender.com` |
| `FEDAPAY_SECRET_KEY` | Clé secrète FedaPay — obligatoire pour vérifier un paiement avant d'activer un accès |
| `FEDAPAY_PUBLIC_KEY` | Clé publique (checkout FedaPay côté navigateur) |
| `FEDAPAY_CALLBACK_URL` | URL de retour après paiement (par défaut l'URL du site) |
| `FEDAPAY_CURRENCY` | `XOF` |
| `JWT_SECRET` | Signature des jetons de session |

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
