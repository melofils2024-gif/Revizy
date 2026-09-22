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

## Etape 2 — Render (site)

1. https://dashboard.render.com → New → Static Site
2. Connecte le repo GitHub : `melofils2024-gif/Revizy`
3. Branch : `main`
4. Build Command : (vide)
5. Publish Directory : `.`
6. Create Static Site

Pour la génération dynamique des cours, déploie aussi le serveur Node (`npm start`) et ajoute ces variables d'environnement :

```env
GEMINI_API_KEY=...
OPENROUTER_API_KEY=...
OPENROUTER_MODEL=openrouter/free
OPENROUTER_SITE_URL=https://ton-url-publique
```

Gemini est utilisé en premier. OpenRouter prend automatiquement le relais si Gemini est indisponible. Les clés restent uniquement côté serveur.

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
