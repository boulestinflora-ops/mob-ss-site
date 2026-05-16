# Guide de déploiement MOB'SS — Bêta

Ce guide te permet de mettre le site en ligne pour tes beta testeurs, étape par étape.
Aucune connaissance technique requise — suis simplement l'ordre ci-dessous.

---

## Étape 1 — Préparer Supabase (base de données)

> À faire une seule fois.

1. Va sur [supabase.com](https://supabase.com) et connecte-toi à ton projet MOB'SS
2. Dans le menu de gauche, clique sur **SQL Editor**
3. Clique sur **New query** (bouton en haut à droite)
4. Ouvre le fichier `supabase/schema.sql` (dans le dossier du site)
5. Copie tout le contenu, colle-le dans l'éditeur SQL
6. Clique sur **Run** (▶)
7. Tu devrais voir "Success" — les tables sont créées ✅

---

## Étape 2 — Récupérer tes clés Supabase

Tu as besoin de deux informations depuis Supabase :

1. Dans ton projet Supabase, clique sur **Settings** (⚙️) dans le menu de gauche
2. Clique sur **API**
3. Note les deux valeurs :
   - **Project URL** → ressemble à `https://abcdefgh.supabase.co`
   - **anon / public key** → une longue chaîne de caractères commençant par `eyJ...`

Garde-les sous la main pour l'étape 4.

---

## Étape 3 — Mettre le code sur GitHub

> GitHub est un service gratuit qui stocke ton code. Vercel en a besoin pour déployer.

1. Va sur [github.com](https://github.com) et crée un compte gratuit si tu n'en as pas
2. Clique sur le **+** en haut à droite → **New repository**
3. Donne-lui un nom : `mobss-site`
4. Laisse tout par défaut, clique **Create repository**
5. GitHub t'affiche des instructions — copie les commandes pour "push an existing repository"

Pour envoyer les fichiers :
- Ouvre un **terminal** (Invite de commandes sur Windows, ou Terminal sur Mac)
- Navigue dans le dossier du site : `cd "C:\Users\boule\OneDrive\Documents\MOB'SS\site"`
- Exécute ces commandes une par une :

```bash
git init
git add .
git commit -m "Lancement bêta MOB'SS"
git branch -M main
git remote add origin https://github.com/TON-PSEUDO/mobss-site.git
git push -u origin main
```

> ⚠️ Remplace `TON-PSEUDO` par ton nom d'utilisateur GitHub.

---

## Étape 4 — Déployer sur Vercel

1. Va sur [vercel.com](https://vercel.com) et crée un compte gratuit (avec ton compte GitHub)
2. Clique sur **Add New… → Project**
3. Clique sur **Import** à côté de `mobss-site`
4. Vercel détecte automatiquement qu'il s'agit d'un projet Astro ✅
5. **Avant de cliquer "Deploy"**, clique sur **Environment Variables** et ajoute :

| Nom | Valeur |
|-----|--------|
| `PUBLIC_SUPABASE_URL` | `https://abcdefgh.supabase.co` (ta valeur de l'étape 2) |
| `PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` (ta clé anon de l'étape 2) |

6. Clique sur **Deploy** — Vercel construit et déploie le site (2-3 minutes)
7. Tu obtiens une URL du type : `mobss-site-xxx.vercel.app` 🎉

---

## Étape 5 — Personnaliser l'URL (facultatif)

Vercel génère une URL un peu longue. Pour avoir `mobss.vercel.app` :

1. Dans Vercel, va dans **Settings → Domains**
2. Dans le champ, tape `mobss` → Vercel vérifie la disponibilité
3. Si disponible, clique **Add** → ton site est accessible sur `mobss.vercel.app`

> Si `mobss` est pris, essaie `mobss-app`, `mobss-beta`, etc.

---

## Étape 6 — Mettre à jour l'URL dans le code

Une fois que tu as ton URL Vercel définitive :

1. Ouvre le fichier `astro.config.mjs`
2. Modifie la ligne `site:` avec ta vraie URL :
   ```js
   site: 'https://mobss.vercel.app',  // ou ton URL personnalisée
   ```
3. Renvoie sur GitHub : `git add . && git commit -m "URL Vercel" && git push`
4. Vercel redéploie automatiquement ✅

---

## Partager avec les beta testeurs

Une fois déployé, tu peux partager directement l'URL Vercel.

**Le site est accessible mais pas indexé par Google** pendant la bêta — la balise `noindex`
est active dans le code. Tes testeurs peuvent visiter le site, personne ne le trouve par hasard
sur un moteur de recherche.

---

## Au lancement officiel

Quand tu es prête à ouvrir au grand public :

**1.** Ouvre `src/layouts/BaseLayout.astro` et change :
```js
const BETA_MODE = true;   // → passer à false
```

**2.** Si tu as un nom de domaine (ex: `mobss.fr`) :
- Dans Vercel → Settings → Domains → ajouter ton domaine
- Chez ton registrar (OVH, Gandi…) : pointer le DNS vers Vercel (Vercel te donne les instructions exactes)
- Mettre à jour `astro.config.mjs` : `site: 'https://www.mobss.fr'`

**3.** Soumettre le sitemap à Google Search Console pour commencer le référencement.

---

## En cas de problème

- **Le site affiche une erreur blanche** → vérifier que les variables d'environnement sont bien
  ajoutées dans Vercel (Settings → Environment Variables)
- **Les emails ne partent pas** → vérifier dans Supabase → Authentication → Settings que
  l'URL de redirection `https://mobss.vercel.app/completer-profil` est bien dans la liste des
  "Redirect URLs" autorisées
- **Les données ne s'affichent pas** → vérifier que le SQL a bien été exécuté (étape 1)

---

*Guide rédigé le 15 mai 2026*
