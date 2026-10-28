# Sécurité — Revizy

Ce document décrit ce qui protège Revizy, ce qui a été laissé
ouvert, et comment réagir en cas de compromission. Il s'adresse à
l'exploitant du site (2 administrateurs), pas aux élèves.

## Le modèle de menace, en une phrase

Un visiteur non authentifié, un élève inscrit, et un administrateur dont le
mot de passe a fuité ne doivent **jamais** pouvoir administrer le site, lire un
corrigé payant sans l'avoir payé, ni s'auto-débloquer un cours.

## Les barrières de l'espace administrateur

L'administration est un espace séparé, pas une page du site. Quatre barrières
indépendantes :

### 1. Le rôle est une donnée serveur, pas une donnée navigateur

- `public.handle_new_user` (base) : à l'inscription, le rôle est **toujours**
  `client`. Le rôle envoyé dans les métadonnées du navigateur est ignoré.
- `public.protect_profile_role` (base) : avant chaque écriture sur
  `public.profiles`, le rôle est comparé à l'ancien. Seuls le propriétaire de
  la base (SQL Editor), la clé `service_role` et un administrateur déjà
  promu peuvent le changer ; sinon l'écriture est annulée.
- Droits de colonne : `revoke update on public.profiles` puis
  `grant update (name, email, niveau, classe, serie, pays)`. La colonne
  `role` n'est plus inscriptible par un élève, même si le déclencheur était
  supprimé.

> **C'est la barrière la plus importante.** Si elle tombe, les trois autres ne
> servent plus à rien : il suffit de se nommer admin dans la base.

### 2. La double authentification est vérifiée côté serveur

Le serveur lit la revendication `aal` du jeton :

- `aal1` : mot de passe seul ;
- `aal2` : mot de passe + code à usage unique (TOTP) validé.

`exigerAdmin()` refuse tout l'espace admin en `aal1`, avec un code
`MFA_REQUIS`. Le contrôle est sur le serveur : modifier le JavaScript du
navigateur, ou envoyer de faux en-têtes, ne donne rien.

Activation du TOTP dans le projet Supabase :
**Authentication → Sign In / Providers → Multi-Factor Authentication → TOTP**.

Dérogation (dépannage uniquement) : `ADMIN_MFA_REQUIS=off` sur Render.

### 3. La page admin n'est pas un document public

- `index.html` ne contient **plus** le balisage du back-office (le fichier est
  passé de 83 Ko à 47 Ko).
- Le balisage vit dans `admin.html`, servi uniquement par `GET /admin-panel`,
  qui exige un jeton d'administrateur doublement authentifié.
- Le serveur répond **404** (et non 403) à un visiteur ou à un élève : on ne
  confirme même pas que la page existe.
- `admin.html` n'est pas dans `PUBLIC_FILES` : le fichier n'est pas
  téléchargeable directement.

### 4. Chaque action est tracée, les rafales sont bloquées

- `admin_journal` (table) : `epreuve_creee`, `epreuve_modifiee`,
  `campagne_publiee`, `campagne_masquee`, `document_televerse`, avec l'identifiant
  de l'auteur, la cible et les détails. Écriture par le serveur uniquement :
  aucune policy d'insertion n'est ouverte aux élèves.
- Limitation de débit : **40 requêtes/minute/IP** sur `/v1/admin*` et
  `/admin-panel` (en plus de la limite globale).

## Ce qui protège le paiement

| Attaque | Réponse |
|---|---|
| Un élève propose un prix | Le montant est **relu en base** au moment de la transaction (`resolveOfficialAmount`) : le navigateur ne peut ni proposer moins, ni faire facturer plus. |
| Un élève présente la transaction d'un autre | Les métadonnées FedaPay doivent porter son `user_id` et le bon `kind`/`chapter_id`/`epreuve_id`. **Sans aucune liaison, le paiement est refusé** (fail closed) : un simple identifiant de transaction partagé ne suffit pas à débloquer un contenu payant. |
| On rejoue un paiement | `payment_receipts` a une contrainte d'unicité sur `transaction_id` : un paiement ne sert qu'une fois. Le reçu est **réservé avant** tout déblocage. |
| Le client simule un Vrai/Faux | Le serveur contrôle statut, montant et devise **auprès de l'API FedaPay** : la seule source de vérité. |
| Une notification FedaPay est forgée | Le webhook est vérifié par HMAC (`FEDAPAY_WEBHOOK_SECRET`) avec comparaison en temps constant. Sans secret configuré, il est refusé (401). |
| L'élève est renvoyé ailleurs après paiement | L'URL de retour doit appartenir au site ; une URL extérieure est ignorée (`urlRetourPaiement`). |
| Un élève s'auto-débloque un cours | Les politiques d'insertion des élèves ont été retirées : seul le serveur écrit, après vérification du paiement. |
| Trop de tentatives | 3 créations de transaction / minute / IP, 10 vérifications / minute / IP, 10 webhooks / minute / IP. |

> **Trou corrigé (août 2026)** : une transaction FedaPay dépourvue de
> métadonnées **et** d'e-mail était acceptée par n'importe quel compte
> connecté, qui obtenait le déblocage. Test de régression :
> `tools/test-securite.js` → « un paiement sans lien avec le compte est refusé »
> (ancien code : 200, nouveau code : 403).

## Ce qui protège le contenu payant

| Attaque | Réponse |
|---|---|
| Un élève écrit `unlocked_chapters` lui-même | La policy d'insertion élève a été retirée : seul le serveur (clé `service_role`) écrit, après vérification FedaPay. |
| Un élève invente une transaction | Idem pour `transactions` : plus aucune écriture par les élèves. |
| Le client envoie un cours truqué à l'IA | Le serveur relit le chapitre **en base** (RPC `get_curriculum_chapters`) et n'utilise jamais le texte du navigateur. |
| Un élève télécharge un corrigé payant | `GET /v1/epreuves/:id/telecharger` vérifie les droits (achat / abonnement / admin) ; sinon 402. |
| Le client propose un prix | Le montant est relu **en base** au moment de la transaction. |
| La solution d'un corrigé fuite dans le catalogue | Elle vit dans `epreuve_corrections`, n'est jamais renvoyée par le catalogue public, et n'est exposée qu'après paiement. |
| Un exécutable est déposé dans le bucket | Extensions exécutables refusées, taille limitée, nom de fichier assaini. |
| Un contenu payant est lu via une autre table | `get_chapter_content` n'est plus exposée ; `get_admin_stats` ne renvoie plus rien aux non-admins. |

## En-têtes HTTP

Présents sur toutes les réponses : `Content-Security-Policy`,
`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`,
`Referrer-Policy`, `Permissions-Policy`, `Strict-Transport-Security` (en HTTPS).
Les réponses d'administration ajoutent `Cache-Control: no-store`.

## Ce qui n'est pas fait (et pourquoi)

- **Pas de CAPTCHA sur la connexion.** Supabase gère déjà la limitation de
  tentatives ; un CAPTCHA auto-déployé n'ajouterait qu'un point de rupture.
- **Pas de chiffrement des documents chez nous.** Les fichiers payants vivent
  dans un bucket privé ; les sujets gratuits sont publics par nature. Chiffrer
  un PDF public n'aurait aucun sens.
- **Pas de double validation (quatre yeux) sur les publications.** Avec deux
  administrateurs, une validation croisée bloquerait la production quand l'un
  des deux est absent. La trace dans `admin_journal` et le code TOTP par
  personne suffisent pour l'instant ; si le volume de publications augmente,
  c'est la première brique à ajouter.
- **Le code JavaScript de l'administration reste dans `app.js`.** Il est inerte
  sans rôle serveur, mais il est public. Le déplacer dans un fichier séparé
  téléchargeable seulement par un admin est l'étape suivante si on veut
  limiter la fuite d'information.

## Vérifier l'état

```bash
node tools/test-securite.js        # 64 contrôles (statiques + HTTP réels)
node tools/test-epreuves-http.js    # parcours épreuve complet
node tools/audit-site.js            # secrets en clair, anomalies
```

Diagnostic en production : `https://revisy.onrender.com/v1/ai/health`
→ `paiements.cleServiceSupabase`, `paiements.debloquageSecurise`.

## En cas de compromission

1. **Compte admin compromis**
   - Supabase → Authentication → Users → révoquer les sessions.
   - `update public.profiles set role = 'client' where email = '...';`
   - Désactiver le facteur MFA du compte.
   - Relire `admin_journal` (qui, quoi, quand) et l'export du bucket.
2. **Clé `service_role` compromise**
   - La tourner immédiatement dans Supabase (API Keys), puis la mettre à jour
     sur Render. C'est la clé la plus sensible du projet : elle contourne
     toutes les RLS.
3. **Compte FedaPay compromis** → faire tourner la clé secrète FedaPay, puis
   `FEDAPAY_WEBHOOK_SECRET`.
4. **En cas de fuite massive** → désactiver la publication (`published =
   false` sur les documents en base) le temps de vérifier, et rebuild les URL de
   signature du bucket privé.

## Règles d'or pour les administrateurs

- Mots de passe **différents** entre les deux comptes admin, jamais réutilisés
  ailleurs.
- Un code TOTP par personne, sur son téléphone (pas sur un PC partagé).
- Pas d'accès au back-office depuis un ordinateur partagé ou un cybercafé.
- Le mot de passe admin n'est jamais envoyé par e-mail ni écrit dans un
  document.
