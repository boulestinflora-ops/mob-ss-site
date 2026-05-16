# MOB'SS — Guide débutante

Ce dossier contient le projet MOB'SS migré vers **Astro**. Le site reste **100% privé sur votre ordinateur** tant que vous ne décidez pas de le publier.

Ce guide est écrit pour vous, qui débutez. Suivez les étapes dans l'ordre, ça marchera.

---

## ☑️ Étape 0 — Avant de commencer (15 min, une seule fois)

Vous avez besoin de deux logiciels gratuits :

### 1. Node.js (le moteur qui fait tourner Astro)
- Allez sur https://nodejs.org
- Cliquez sur la version **LTS** (recommandée pour la plupart des utilisateurs)
- Installez en cliquant "Suivant" partout (les choix par défaut sont bons)
- Pour vérifier que c'est installé, ouvrez un terminal :
  - **Sur Windows** : appuyez sur la touche Windows, tapez "PowerShell", ouvrez-le
  - **Sur Mac** : appuyez sur ⌘ + Espace, tapez "Terminal", ouvrez-le
- Tapez : `node --version`
- Si vous voyez quelque chose comme `v20.10.0`, c'est bon. Sinon, redémarrez votre ordinateur après l'installation.

### 2. Visual Studio Code (pour modifier les fichiers)
- Allez sur https://code.visualstudio.com
- Téléchargez et installez (clics suivants par défaut, c'est OK).

---

## 🚀 Étape 1 — Lancer le site sur votre ordinateur (5 min)

### a) Ouvrir le projet
1. Lancez **Visual Studio Code**
2. Menu : **Fichier → Ouvrir un dossier**
3. Sélectionnez le dossier `mobss-astro` (celui qui contient ce README)
4. Cliquez "Ouvrir"

### b) Ouvrir le terminal intégré
- Menu : **Affichage → Terminal** (ou raccourci `Ctrl+ù` sur Windows / `Ctrl+ø` sur Mac)
- Un terminal apparaît en bas de l'écran

### c) Installer les dépendances (une seule fois, ~2 minutes)
Tapez cette commande dans le terminal et appuyez sur Entrée :
```
npm install
```
Vous verrez beaucoup de texte défiler — c'est normal. Astro et ses dépendances se téléchargent. À la fin, vous devriez voir un message du genre `added 200 packages`.

### d) Lancer le site
Tapez :
```
npm run dev
```
Vous verrez un message coloré qui ressemble à :
```
  🚀  astro  v4.16.0 ready in 350 ms

  ┃ Local    http://localhost:4321/
  ┃ Network  use --host to expose
```

### e) Ouvrir le site
- Ouvrez votre navigateur (Chrome, Firefox, Edge…)
- Allez à l'adresse : **http://localhost:4321**
- Vous voyez votre site ! 🎉

⚠️ **Cette adresse n'est visible que par vous, sur votre ordinateur.** Personne d'autre n'y a accès.

### f) Arrêter le site
Quand vous avez fini, retournez dans le terminal et appuyez sur `Ctrl+C`.

---

## ✏️ Étape 2 — Modifier le site

Une règle d'or : **dès que vous sauvegardez un fichier, le navigateur se recharge automatiquement**. Vous voyez vos changements en temps réel.

### Cas pratiques

#### A) Changer un texte d'accueil
- Ouvrez `src/pages/index.astro`
- Modifiez par exemple le titre `Rendre le sport et la santé...`
- Sauvegardez (`Ctrl+S` ou `⌘+S`)
- Regardez le navigateur : le titre a changé automatiquement.

#### B) Ajouter un nouvel espace dans la liste
- Ouvrez `src/data/audiences.json`
- Vous y voyez 4 entrées
- Ajoutez-en une 5e en copiant le format existant :
  ```json
  {
    "tag": "Associations",
    "variant": "is-citizen",
    "title": "Mobilisez vos adhérents",
    "description": "Trouvez des espaces pour vos activités sportives associatives.",
    "ctaLabel": "En savoir plus →",
    "ctaHref": "/inscription?role=association"
  }
  ```
  ⚠️ N'oubliez pas la **virgule** après l'entrée précédente.
- Sauvegardez. La carte apparaît automatiquement sur la page d'accueil.

#### C) Changer un lien du menu
- Ouvrez `src/components/Header.astro`
- Modifiez la liste `navLinks` au début du fichier
- Sauvegardez. **Tous les liens sont mis à jour partout** d'un coup.

#### D) Changer la couleur principale du site
- Ouvrez `src/styles/style.css`
- Cherchez la ligne `--color-primary: #B0414B;` (vers le haut)
- Remplacez la valeur (exemple `#1B4D8C` pour du bleu)
- Sauvegardez. Tout le site change de couleur instantanément.

---

## 📁 Comprendre la structure des dossiers

```
mobss-astro/
├── src/
│   ├── pages/              ← Une page = un fichier .astro
│   │   └── index.astro     ← La page d'accueil
│   ├── components/         ← Les briques réutilisables
│   │   ├── Header.astro    ← Le menu en haut (modifié = changé partout)
│   │   ├── Footer.astro    ← Le pied de page
│   │   ├── CookieBanner.astro
│   │   ├── AudienceCard.astro
│   │   ├── Step.astro
│   │   ├── FeatureCard.astro
│   │   └── Icon.astro      ← Toutes les icônes du site
│   ├── layouts/            ← Le squelette commun à toutes les pages
│   │   └── BaseLayout.astro
│   ├── data/               ← LES DONNÉES (modifiable sans toucher au code)
│   │   ├── audiences.json
│   │   ├── steps.json
│   │   └── features.json
│   └── styles/
│       └── style.css       ← La feuille de style globale
├── public/                 ← Fichiers statiques
│   └── scripts/
│       └── script.js       ← Le JavaScript du site
├── package.json            ← La liste des outils utilisés
├── astro.config.mjs        ← La configuration Astro
└── README.md               ← Ce fichier
```

**Règle simple** :
- Pour changer **du contenu** → modifiez les fichiers `.json` dans `src/data/`
- Pour changer **un look** → modifiez `src/styles/style.css`
- Pour changer **une page entière** → modifiez le fichier `.astro` dans `src/pages/`
- Pour changer **un élément visible sur plusieurs pages** (menu, footer) → modifiez le composant dans `src/components/`

---

## 🆘 Questions fréquentes

### "J'ai modifié un fichier mais le navigateur ne change pas"
- Vérifiez que la commande `npm run dev` tourne toujours dans le terminal
- Sauvegardez bien le fichier (`Ctrl+S` / `⌘+S`)
- Rafraîchissez la page dans le navigateur (`F5`)

### "J'ai une erreur rouge dans le navigateur"
- Lisez le message d'erreur, il est généralement clair (oubli de virgule dans un JSON, balise mal fermée, etc.)
- Annulez votre dernière modif (`Ctrl+Z` / `⌘+Z`) et sauvegardez
- Si vous êtes bloquée, copiez-collez l'erreur à votre développeur (ou à moi)

### "Comment je sauvegarde mon travail ?"
Pour l'instant, **tout est sur votre ordinateur uniquement**. Pour sauvegarder ailleurs (et travailler à plusieurs plus tard), vous installerez **Git** et utiliserez **GitHub** (gratuit). Mais ce n'est pas urgent.

### "Comment je publie le site en ligne plus tard ?"
Quand vous serez prête, ce sera très simple :
1. `npm run build` génère un dossier `dist/`
2. Vous glissez ce dossier sur https://app.netlify.com/drop
3. Le site est en ligne en 30 secondes, gratuit

Mais **rien ne presse** — vous pouvez travailler dessus localement aussi longtemps que vous voulez.

---

## 📝 Les commandes utiles à retenir

| Commande | Ce qu'elle fait |
|----------|-----------------|
| `npm install` | Installe les outils (à faire une seule fois au début) |
| `npm run dev` | Lance le site en mode développement |
| `npm run build` | Génère la version optimisée pour publication |
| `Ctrl+C` (dans le terminal) | Arrête le site |

---

## 🎯 Statut actuel de la migration

✅ **Page d'accueil migrée** (`src/pages/index.astro`)
🔧 Pages restantes à migrer : explorez, comment-ça-marche, contact, inscription, connexion, dashboard, annonce, déposer-annonce, mentions-légales, confidentialité.

Pour migrer les autres pages, il faut les transformer comme l'accueil :
- Importer le `BaseLayout`
- Coller le contenu de la page
- Remplacer header/footer/cookie banner par le layout

Si vous voulez que je continue la migration des autres pages, dites-le moi.

---

## ❤️ Bon courage !

Vous n'avez pas à tout comprendre tout de suite. Au début, **modifiez juste les fichiers JSON** — vous changerez 80% du contenu sans rien casser.

Pour les questions plus complexes (composants, layouts), prenez votre temps.
