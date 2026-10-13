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

Le fichier 5 est celui qui active l'onglet **📚 Programme officiel** du back-office :
l'admin y saisit (ou fait rechercher par l'IA) les parties clés du programme,
et les cours sont ensuite générés automatiquement dans cet ordre exact.

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
| `GEMINI_MODEL` | Optionnel, défaut `gemini-3.8-flash` (modèle unique, rapide et stable) |
| `GEMINI_FALLBACK_MODELS` | Optionnel, vide par défaut (aucun modèle de secours) |
| `SUPABASE_URL` / `SUPABASE_ANON_KEY` | Base de données |
| `FEDAPAY_SECRET_KEY` | Vérification des paiements Mobile Money |
| `JWT_SECRET` | Signature des jetons de session |

## Dépannage — le chatbot ne répond pas

Ouvre dans le navigateur :

```
https://ton-app.onrender.com/v1/ai/health
```

L'endpoint teste chaque modèle de la chaîne et répond sans rien révéler de la clé :

```json
{ "success": true, "modelesDisponibles": ["gemini-3.8-flash"] }
```

- `"API key not valid. Please pass a valid API key."` → la variable `GEMINI_API_KEY` du dashboard Render est périmée ou absente. Mets-la à jour (Environment → ton service → Save & Redeploy).
- `GEMINI_API_KEY absente` → variable jamais créée sur Render.
- `success: true` avec plusieurs modèles → l'IA fonctionne ; si le chatbot reste muet, vide le cache navigateur.

Le modèle principal et la chaîne de secours sont définis dans `server.js` (valeurs par défaut) et surchargeables par `.env` en local. Pour re-mesurer les modèles disponibles : `node tools/benchmark-models.js`.
