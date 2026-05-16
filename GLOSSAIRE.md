# Glossaire MOB'SS — Les termes techniques expliqués simplement

> Ce document explique tous les mots techniques utilisés dans le projet MOB'SS,
> avec des analogies du quotidien pour que ce soit clair même sans formation informatique.

---

## A

### API (Application Programming Interface)
**Ce que c'est :** Un intermédiaire qui permet à deux logiciels de se parler.
**Analogie :** C'est comme un serveur de restaurant — tu passes ta commande (ta requête), il va en cuisine (le logiciel distant), et il revient avec ce que tu as demandé (la réponse). Tu n't pas besoin de savoir comment la cuisine fonctionne.
**Sur MOB'SS :** On utilise l'API de Supabase pour lire/écrire dans la base de données, et l'API de Google Fonts pour charger la police DM Sans.

### Astro (framework)
**Ce que c'est :** L'outil qui "assemble" le site. Il prend tous les fichiers `.astro`, `.ts`, `.css` et les transforme en un site web que les navigateurs comprennent.
**Analogie :** C'est comme un compilateur de recettes — tu lui donnes des ingrédients (tes fichiers) et des instructions (ta configuration), et il produit le gâteau final (le site).
**Sur MOB'SS :** Tous les fichiers `.astro` dans `src/pages/` deviennent des pages web accessibles en ligne.

### Authentification (Auth)
**Ce que c'est :** Le système qui vérifie que tu es bien qui tu prétends être.
**Analogie :** C'est le videur à l'entrée d'un club — il vérifie ta pièce d'identité avant de te laisser entrer.
**Sur MOB'SS :** Supabase Auth gère les connexions. Quand tu cliques "Se connecter" et que tu entres ton email, c'est l'authentification qui vérifie que tu as accès.

---

## B

### Balise / Tag HTML
**Ce que c'est :** Une instruction HTML entourée de chevrons `< >` qui dit au navigateur comment afficher du contenu.
**Analogie :** Comme les codes de mise en forme dans un traitement de texte — **gras**, *italique* — mais en code.
**Exemples :** `<h1>` = titre principal, `<p>` = paragraphe, `<img>` = image, `<a>` = lien.

### Balise canonique (`<link rel="canonical">`)
**Ce que c'est :** Une balise dans le `<head>` de chaque page qui dit à Google : "L'adresse officielle de cette page, c'est celle-là."
**Pourquoi c'est utile :** Parfois une même page est accessible par plusieurs URLs (avec ou sans `www`, avec ou sans `/` à la fin). La balise canonique évite que Google pense que ce sont deux pages différentes et dilue ton référencement.
**Analogie :** C'est comme écrire votre adresse postale principale sur une enveloppe retour — même si le courrier peut arriver par plusieurs chemins, il y a une adresse officielle.
**Sur MOB'SS :** Chaque page indique son URL canonique dans `BaseLayout.astro`.

### Balise meta description
**Ce que c'est :** Un texte court (160 caractères max) dans le `<head>` de la page qui décrit son contenu.
**Pourquoi c'est utile :** C'est le texte que Google affiche sous le titre dans les résultats de recherche. Ça n'améliore pas directement le classement, mais ça influence le taux de clic.
**Analogie :** C'est le résumé au dos d'un livre — il donne envie (ou pas) de l'ouvrir.
**Sur MOB'SS :** `<meta name="description" content="..." />` dans le `<head>`.

### Base de données (BDD)
**Ce que c'est :** Un système organisé pour stocker et retrouver des informations.
**Analogie :** Un classeur géant avec des tiroirs bien étiquetés. Chaque tiroir est une "table" (ex: la table `profiles`), chaque chemise est une "ligne" (un utilisateur), chaque colonne dans la chemise est un "champ" (ex: email, ville).
**Sur MOB'SS :** Supabase héberge la base de données avec les tables `profiles`, `demandes`, `contact_messages`.

### Bcrypt
**Ce que c'est :** Un algorithme de chiffrement qui transforme un mot de passe en une suite illisible de caractères.
**Pourquoi c'est utile :** Si quelqu'un vole la base de données, il ne voit que du charabia, jamais le vrai mot de passe.
**Analogie :** C'est comme passer un document dans un broyeur — on ne peut pas reconstituer l'original.
**Sur MOB'SS :** Supabase Auth utilise bcrypt automatiquement pour les mots de passe.

### Boolean (booléen)
**Ce que c'est :** Une valeur qui ne peut être que `true` (vrai) ou `false` (faux).
**Analogie :** Un interrupteur — allumé ou éteint, pas d'entre-deux.
**Sur MOB'SS :** `disponible_remplacement` est un boolean — le praticien est disponible (true) ou non (false).

### Bug
**Ce que c'est :** Une erreur dans le code qui fait que quelque chose ne fonctionne pas comme prévu.
**Analogie :** Une faute de frappe dans une recette qui fait rater le plat.
**Exemples corrigés dans MOB'SS :** Les liens de popup `/annonce?id=xxx` au lieu de `/annonce/xxx`, les filtres qui ne filtraient rien.

### Build
**Ce que c'est :** L'étape où Astro transforme tous tes fichiers de code source en fichiers HTML/CSS/JS optimisés prêts à être mis en ligne.
**Analogie :** Comme imprimer un livre — tu écris d'abord le manuscrit (tes fichiers `.astro`), puis tu lances l'impression (le build) pour obtenir le livre final.
**Sur MOB'SS :** La commande `npm run build` déclenche le build. Vercel le fait automatiquement à chaque déploiement.

---

## C

### Cache
**Ce que c'est :** Une copie temporaire d'une ressource (image, page, données) stockée quelque part pour la servir plus vite la prochaine fois.
**Analogie :** Tu notes le numéro de téléphone de ta pizzeria sur un Post-it plutôt que de chercher dans l'annuaire à chaque fois.
**Sur MOB'SS :** Les navigateurs mettent en cache les images et le CSS. Supabase met en cache les requêtes fréquentes.

### CLS (Cumulative Layout Shift)
**Ce que c'est :** Un indicateur de performance Google qui mesure combien les éléments de la page "bougent" pendant le chargement.
**Analogie :** Tu lis un article et soudain une publicité s'insère au-dessus du texte — tout décale et tu perds ta place. C'est un mauvais CLS.
**Sur MOB'SS :** Images sans dimensions `width`/`height` causent du CLS — noté dans l'audit.

### Codé en dur (hardcoded)
**Ce que c'est :** Une valeur écrite directement dans le code, en dur, au lieu d'être dynamique ou configurable.
**Pourquoi c'est un problème :** Si tu veux changer cette valeur, tu dois modifier le code à la main, souvent à plusieurs endroits.
**Analogie :** Écrire l'adresse de ta pizzeria préférée au stylo indélébile sur ton mur, au lieu de la garder dans tes contacts — si elle déménage, tu dois repasser de la peinture.
**Exemple MOB'SS :** `const siteUrl = 'https://www.mobss.fr'` était codé en dur. On l'a remplacé par `Astro.site` qui lit la valeur depuis la configuration.

### Composant (component)
**Ce que c'est :** Un morceau d'interface réutilisable, défini une fois et utilisable partout.
**Analogie :** Un tampon encreur — tu le crées une fois et tu l'appliques autant de fois que tu veux, toujours identique.
**Sur MOB'SS :** `Header.astro`, `Footer.astro`, `SpaceCard.astro` sont des composants. Modifier `Header.astro` change le menu sur toutes les pages d'un coup.

### Cookie
**Ce que c'est :** Un petit fichier texte qu'un site web stocke dans ton navigateur pour se souvenir de toi.
**Analogie :** La carte de fidélité d'un café — à chaque visite, le barista sait que tu prends un double espresso sans sucre.
**Types :** Cookie de session (disparaît quand tu fermes l'onglet), cookie persistant (reste pendant X jours).
**Sur MOB'SS :** Supabase utilise un cookie pour maintenir ta session de connexion. Aucun cookie publicitaire.

### CSS (Cascading Style Sheets)
**Ce que c'est :** Le langage qui gère l'apparence visuelle du site — couleurs, tailles, espacements, positions.
**Analogie :** Si HTML est la charpente d'une maison, CSS est la décoration intérieure — peinture, mobilier, éclairage.
**Sur MOB'SS :** Tout le style est dans `src/styles/style.css`.

### CSS Variables (variables CSS)
**Ce que c'est :** Des valeurs réutilisables définies une fois et utilisées partout dans le CSS.
**Analogie :** Un nuancier de peinture avec des noms — "bordeaux principal", "crème chaude". Si tu changes le bordeaux, il change partout d'un coup.
**Sur MOB'SS :** `--color-primary: #C8424F` est défini une fois dans `:root {}`. Changer cette ligne change la couleur bordeaux sur tout le site.

### CTA (Call to Action)
**Ce que c'est :** Un bouton ou lien qui incite l'utilisateur à faire une action précise.
**Analogie :** Le panneau "SOLDES — ENTREZ ICI" sur une vitrine de magasin.
**Exemples sur MOB'SS :** "Rejoindre MOB'SS →", "Envoyer une demande", "Je veux exercer".

---

## D

### Déploiement (deploy)
**Ce que c'est :** L'action de mettre le site en ligne pour que d'autres personnes puissent y accéder.
**Analogie :** Ouvrir les portes d'un magasin après avoir tout installé à l'intérieur.
**Sur MOB'SS :** Vercel s'occupe du déploiement automatiquement à chaque push sur GitHub.

### DNS (Domain Name System)
**Ce que c'est :** Le système qui fait correspondre un nom de domaine (`mobss.fr`) à une adresse IP numérique.
**Analogie :** L'annuaire téléphonique d'internet — tu cherches "MOB'SS", il te donne le numéro (l'adresse IP du serveur).

---

## E

### `.env` (fichier d'environnement)
**Ce que c'est :** Un fichier local qui contient des informations secrètes (mots de passe, clés API) qui ne doivent jamais être mises en ligne.
**Analogie :** Un carnet de notes caché dans un tiroir fermé à clé — les informations sensibles y sont, mais ne circulent pas.
**Sur MOB'SS :** Le fichier `.env` contient `PUBLIC_SUPABASE_URL` et `PUBLIC_SUPABASE_ANON_KEY`. Il est dans le `.gitignore` donc jamais envoyé sur GitHub.

### Variables d'environnement (environment variables)
**Ce que c'est :** Des informations de configuration passées à l'application sans être écrites dans le code.
**Pourquoi c'est utile :** Tu peux avoir des valeurs différentes en local (sur ton ordi) et en production (sur Vercel) sans changer le code.
**Sur MOB'SS :** `PUBLIC_SUPABASE_URL` est une variable d'environnement — sa valeur réelle est dans `.env` localement, et dans les Settings de Vercel en production.

---

## F

### Favicon
**Ce que c'est :** La petite icône qui s'affiche dans l'onglet du navigateur, à gauche du titre de la page.
**Analogie :** Le logo sur la couverture d'un livre.
**Sur MOB'SS :** `public/favicon.svg` — un "M" blanc sur fond bordeaux.

### Framework
**Ce que c'est :** Un ensemble d'outils et de règles qui facilitent la création d'un type d'application.
**Analogie :** Un kit de construction LEGO avec des pièces déjà conçues — tu n'as pas besoin de fabriquer chaque brique toi-même.
**Sur MOB'SS :** Astro est le framework. Il gère la structure du projet, les pages, les composants.

---

## G

### Git
**Ce que c'est :** Un logiciel de suivi des modifications dans le code. Il garde un historique de chaque changement.
**Analogie :** L'historique des versions dans Google Docs — tu peux voir qui a changé quoi, et revenir en arrière si besoin.
**Commandes clés :**
- `git add .` → sélectionne tous les fichiers modifiés
- `git commit -m "message"` → enregistre un point de sauvegarde avec un message
- `git push` → envoie les modifications sur GitHub

### GitHub
**Ce que c'est :** Un site web qui héberge le code versionné avec Git, en ligne.
**Analogie :** Un Google Drive pour le code — ton code est stocké en ligne, sauvegardé, et peut être partagé.
**Sur MOB'SS :** Le dépôt GitHub stocke tout le code source. Vercel y est connecté et redéploie automatiquement à chaque push.

---

## H

### HTML (HyperText Markup Language)
**Ce que c'est :** Le langage qui structure le contenu d'une page web.
**Analogie :** La charpente d'une maison — ça définit où se trouvent les murs, les portes, les fenêtres (titres, paragraphes, images, boutons).

### HTTPS / TLS
**Ce que c'est :** Le "S" de HTTPS signifie "Secure" — la connexion entre le navigateur et le serveur est chiffrée.
**Analogie :** Envoyer une lettre dans une enveloppe scellée plutôt qu'une carte postale lisible par tous les facteurs.
**Sur MOB'SS :** Vercel active HTTPS automatiquement. Le cadenas 🔒 dans la barre d'adresse du navigateur le confirme.

---

## I

### Index (indexation Google)
**Ce que c'est :** Le fait qu'une page soit référencée dans la base de données de Google et puisse apparaître dans les résultats de recherche.
**Analogie :** Être dans l'annuaire téléphonique — si tu n'y es pas, personne ne peut te trouver par recherche.
**Sur MOB'SS :** Pendant la bêta, la balise `noindex` empêche Google d'indexer le site.

---

## J

### JavaScript (JS) / TypeScript (TS)
**Ce que c'est :** Le langage de programmation qui rend les pages web interactives (boutons qui réagissent, données qui s'affichent, formulaires qui se valident).
**Analogie :** Si HTML est la charpente et CSS la décoration, JavaScript est l'électricité et la plomberie — ce qui fait que les choses fonctionnent vraiment.
**TypeScript** est JavaScript avec un système de types ajouté — il détecte certaines erreurs avant même d'exécuter le code.
**Sur MOB'SS :** Tout le code interactif (filtres de recherche, formulaires, connexion Supabase) est écrit en TypeScript.

### JSON (JavaScript Object Notation)
**Ce que c'est :** Un format de fichier pour stocker et transporter des données structurées, lisible par les humains et les machines.
**Analogie :** Un formulaire bien rempli — des champs avec des valeurs, organisés de façon claire.
**Sur MOB'SS :** `src/data/spaces.json` contient la liste des espaces avec leurs informations.

---

## L

### Layout
**Ce que c'est :** Un modèle de page réutilisable qui définit la structure commune (header, footer, etc.).
**Analogie :** Un formulaire pré-imprimé — le cadre est toujours le même, seul le contenu change.
**Sur MOB'SS :** `BaseLayout.astro` est le layout principal. Toutes les pages l'utilisent — changer ce fichier change la structure de tout le site.

### LCP (Largest Contentful Paint)
**Ce que c'est :** Un indicateur de performance Google qui mesure combien de temps met le plus grand élément visible de la page à s'afficher.
**Analogie :** Le temps qu'il faut pour que le plat principal arrive à table — pas les couverts, pas le pain, le plat.
**Objectif :** Moins de 2,5 secondes pour un bon score Google.

### Lazy loading
**Ce que c'est :** Charger les images seulement quand l'utilisateur est sur le point de les voir (en scrollant), plutôt que toutes en même temps au chargement.
**Analogie :** Un livre illustré qui n'imprime les images que quand tu tournes vers cette page — ça va beaucoup plus vite à l'impression.
**Sur MOB'SS :** `loading="lazy"` sur les balises `<img>` des annonces.

---

## M

### Magic Link (lien magique)
**Ce que c'est :** Un lien de connexion envoyé par email, à usage unique, qui connecte l'utilisateur sans qu'il ait besoin de mot de passe.
**Analogie :** Recevoir une clé temporaire par courrier pour entrer dans un bâtiment — pas besoin de créer un code à l'avance.
**Sur MOB'SS :** Sur `/rejoindre`, on envoie un magic link par email. Le praticien clique dessus et est automatiquement connecté sur `/completer-profil`.

### Meta tags / Balises meta
**Ce que c'est :** Des balises dans l'en-tête `<head>` de la page, invisibles pour les visiteurs mais lues par Google, Facebook, LinkedIn, etc.
**Analogie :** Les informations au dos d'un tableau dans un musée — le visiteur voit le tableau, mais le conservateur lit les infos au dos pour cataloguer l'œuvre.
**Types sur MOB'SS :** `<meta name="description">`, `<meta property="og:title">`, `<meta name="robots">`.

---

## N

### Node.js / npm
**Ce que c'est :** Node.js permet d'exécuter JavaScript en dehors du navigateur (sur ton ordinateur). npm est son gestionnaire de paquets — il télécharge les bibliothèques dont tu as besoin.
**Analogie :** npm est comme l'App Store des développeurs — tu installes des outils (Astro, Supabase…) avec une commande.
**Sur MOB'SS :** `npm install` installe toutes les dépendances, `npm run dev` lance le site en local.

### noindex
**Ce que c'est :** Une instruction donnée aux moteurs de recherche pour qu'ils ne référencent pas une page.
**Analogie :** Mettre "Entrée privée, ne pas répertorier" sur une porte — les gens qui ont l'adresse peuvent venir, mais elle n'est pas dans l'annuaire.
**Sur MOB'SS :** Activé pendant la bêta via `const BETA_MODE = true` dans `BaseLayout.astro`. À désactiver au lancement officiel.

---

## O

### Open Graph (og:)
**Ce que c'est :** Un ensemble de balises meta qui contrôlent comment ta page apparaît quand elle est partagée sur les réseaux sociaux (LinkedIn, Facebook, WhatsApp, iMessage…).
**Analogie :** La vignette d'aperçu d'un lien YouTube — titre, image, description. Sans Open Graph, le partage d'un lien affiche juste une URL froide sans contexte.
**Balises clés :**
- `og:title` → le titre affiché dans l'aperçu
- `og:description` → le résumé
- `og:image` → l'image miniature (idéalement 1200×630 px)
- `og:url` → l'URL officielle de la page
**Sur MOB'SS :** Ajoutées dans `BaseLayout.astro`. L'image `og-image.png` est à créer et déposer dans `public/`.

### OTP (One-Time Password)
**Ce que c'est :** Un code ou lien à usage unique, valable pendant une durée limitée.
**Sur MOB'SS :** Supabase appelle le magic link "signInWithOtp" — c'est techniquement un OTP sous forme de lien.

---

## P

### Package / Bibliothèque (library)
**Ce que c'est :** Du code écrit par quelqu'un d'autre que tu intègres dans ton projet pour éviter de tout coder soi-même.
**Analogie :** Les ingrédients tout préparés en cuisine (sauce déjà faite, légumes déjà coupés) — tu les assembles sans repartir de zéro.
**Sur MOB'SS :** `@supabase/supabase-js` est la bibliothèque Supabase, `leaflet` est la bibliothèque de carte interactive.

### Politique RLS (Row Level Security)
**Ce que c'est :** Un système de sécurité dans Supabase qui définit, pour chaque ligne de la base de données, qui a le droit de la lire ou la modifier.
**Analogie :** Dans un immeuble de bureaux, chaque employé ne peut ouvrir que sa propre boîte aux lettres — même s'il est dans le même bâtiment que toutes les autres.
**Sur MOB'SS :** Sans RLS, n'importe qui pourrait lire les données de n'importe qui. Avec RLS, chaque utilisateur ne voit que ses propres demandes.

---

## R

### Redirect URL (URL de redirection)
**Ce que c'est :** L'adresse vers laquelle l'utilisateur est renvoyé après une action (connexion, inscription).
**Analogie :** Après avoir validé ton billet à la gare, le tourniquet s'ouvre et tu passes de l'autre côté — la sortie du tourniquet est la "redirect URL".
**Sur MOB'SS :** Après avoir cliqué sur le magic link, l'utilisateur est redirigé vers `/completer-profil`. Cette URL doit être déclarée dans Supabase sous Authentication → URL Configuration.

### Référencement / SEO (Search Engine Optimization)
**Ce que c'est :** L'ensemble des pratiques qui permettent d'apparaître le plus haut possible dans les résultats de Google (et autres moteurs de recherche) sans payer de publicité.
**Analogie :** Optimiser la vitrine de ton magasin, mettre les bons mots sur l'enseigne, être dans le bon quartier — tout ce qui fait que les clients te trouvent naturellement.
**Leviers sur MOB'SS :** Titres de pages pertinents, meta descriptions, balises canoniques, Open Graph, temps de chargement, contenu utile.

### Repository (dépôt / repo)
**Ce que c'est :** Le dossier qui contient tout le code source du projet, versionné avec Git.
**Analogie :** Le dossier de projet dans une armoire — mais magique, car il garde l'historique de chaque modification.
**Sur MOB'SS :** Le repo est hébergé sur GitHub à l'adresse `github.com/ton-pseudo/mobss-site`.

### Responsive design
**Ce que c'est :** Une technique CSS qui fait s'adapter l'affichage à la taille de l'écran (téléphone, tablette, ordinateur).
**Analogie :** Un costume fait sur mesure qui s'ajuste selon la corpulence — pas besoin de tailles séparées.
**Sur MOB'SS :** Breakpoints à 1024px (tablette) et 768px/480px (téléphone) dans `style.css`.

### RLS → voir Politique RLS

---

## S

### Session
**Ce que c'est :** Une période de connexion active — Supabase te reconnaît depuis que tu t'es connecté jusqu'à ce que tu te déconnectes (ou que la session expire).
**Analogie :** Ton bracelet d'entrée à un festival — tant que tu l'as au poignet, tu peux rentrer et sortir librement.
**Sur MOB'SS :** `supabase.auth.getSession()` vérifie si tu as une session active pour afficher le bon état du header (connecté/déconnecté).

### Sitemap
**Ce que c'est :** Un fichier XML qui liste toutes les pages du site, pour aider Google à les découvrir et les indexer.
**Analogie :** Le sommaire d'un livre — Google le lit pour savoir quelles "pages" existent sans avoir à chercher partout.
**Sur MOB'SS :** Pas encore créé — à ajouter avec `@astrojs/sitemap` avant le lancement officiel.

### Slug
**Ce que c'est :** La partie d'une URL qui identifie une ressource, en caractères simples sans espaces ni accents.
**Analogie :** Le surnom d'un produit dans le catalogue — "studio-lumiere-lyon" est le slug de "Studio Lumière — Yoga & soins".
**Sur MOB'SS :** `studio-lumiere-lyon`, `cabinet-bordeaux` sont les slugs des espaces. Ils apparaissent dans l'URL : `/annonce/studio-lumiere-lyon`.

### SQL (Structured Query Language)
**Ce que c'est :** Le langage pour communiquer avec une base de données — créer des tables, insérer des données, faire des recherches.
**Analogie :** La langue que tu parles au bibliothécaire — "donne-moi tous les livres de cet auteur publiés après 2020" = une requête SQL.
**Sur MOB'SS :** `supabase/schema.sql` contient les instructions SQL pour créer toutes les tables et règles de sécurité.

### Supabase
**Ce que c'est :** Un service en ligne qui fournit une base de données, un système d'authentification et un stockage de fichiers, le tout accessible via une API.
**Analogie :** Un "tout-en-un" pour les données de ton site — comme Google Workspace mais pour les développeurs : base de données + gestion des utilisateurs + stockage de fichiers.
**Sur MOB'SS :** Supabase stocke les profils des praticiens, les demandes d'espaces, les messages de contact, et gère la connexion par magic link.

---

## T

### Table (base de données)
**Ce que c'est :** Un tableau organisé en lignes et colonnes, qui stocke un type de données précis.
**Analogie :** Une feuille Excel — chaque ligne est un enregistrement (un praticien, une demande…), chaque colonne est un champ (nom, email, ville…).
**Sur MOB'SS :** Tables `profiles`, `demandes`, `contact_messages`.

### Trigger (déclencheur)
**Ce que c'est :** Une instruction automatique dans la base de données qui s'exécute en réponse à un événement.
**Analogie :** Une alarme incendie — quand la fumée est détectée (événement), la sirène se déclenche automatiquement (action).
**Sur MOB'SS :** Le trigger `on_auth_user_created` : quand quelqu'un crée un compte, il crée automatiquement une ligne dans la table `profiles`.

### TypeScript → voir JavaScript

---

## U

### UUID (Universally Unique Identifier)
**Ce que c'est :** Un identifiant unique généré aléatoirement, sous la forme `550e8400-e29b-41d4-a716-446655440000`.
**Pourquoi pas juste 1, 2, 3 ?** Un numéro séquentiel révèle combien d'utilisateurs tu as, et est facile à deviner. Un UUID est impossible à deviner.
**Sur MOB'SS :** Chaque profil, chaque demande, chaque message a un UUID comme identifiant.

### Upsert
**Ce que c'est :** Une opération de base de données qui insère une ligne si elle n'existe pas, ou la met à jour si elle existe déjà.
**Analogie :** "Crée une fiche pour ce client s'il est nouveau, sinon mets à jour sa fiche existante."
**Sur MOB'SS :** `supabase.from('profiles').upsert({...})` dans `/completer-profil` — ça crée ou met à jour le profil selon que le praticien complète son profil pour la première fois ou le modifie.

### URL (Uniform Resource Locator)
**Ce que c'est :** L'adresse d'une ressource sur internet.
**Anatomie :** `https://mobss.vercel.app/annuaire?specialite=kine`
- `https://` → protocole sécurisé
- `mobss.vercel.app` → domaine
- `/annuaire` → chemin (page)
- `?specialite=kine` → paramètres de filtre

---

## V

### Vercel
**Ce que c'est :** Une plateforme en ligne qui héberge et déploie des sites web automatiquement depuis GitHub.
**Analogie :** Un hébergeur "intelligent" qui, à chaque fois que tu envoies une mise à jour du code sur GitHub, reconstruit et met en ligne le site automatiquement — sans que tu aies besoin de toucher à quoi que ce soit.
**Sur MOB'SS :** Vercel héberge le site et lui donne une URL comme `mobss.vercel.app`. Gratuit pour les projets personnels.

### Variables CSS → voir CSS Variables

---

## W

### WCAG (Web Content Accessibility Guidelines)
**Ce que c'est :** Les normes internationales d'accessibilité web — les règles qui garantissent que le site est utilisable par les personnes handicapées (malvoyants, daltoniens, personnes naviguant au clavier…).
**Niveaux :** A (minimum), AA (recommandé), AAA (excellence).
**Sur MOB'SS :** On vise le niveau AA — c'est pour ça qu'il y a un skip-link, des couleurs à contraste suffisant, des `aria-label` sur les boutons.

---

## Z

### z-index
**Ce que c'est :** Une propriété CSS qui contrôle quel élément passe "au-dessus" des autres quand ils se superposent.
**Analogie :** L'ordre des calques dans Photoshop — le calque avec le z-index le plus élevé est devant.
**Sur MOB'SS :** Le header a `z-index: 100` pour rester toujours visible au-dessus du reste. La search card a `z-index: 5` pour passer devant la section en-dessous.

---

## Récapitulatif des outils du projet

| Outil | Rôle | Analogie |
|-------|------|----------|
| **Astro** | Construit le site | La cuisine qui assemble les plats |
| **Supabase** | Base de données + Auth | Le classeur + le videur |
| **Vercel** | Met le site en ligne | L'imprimeur + le libraire |
| **GitHub** | Stocke et versionne le code | Google Drive pour le code |
| **Git** | Suit les modifications | L'historique des versions |
| **CSS** | Apparence visuelle | La décoration intérieure |
| **TypeScript** | Interactivité | L'électricité de la maison |
| **SQL** | Parle à la base de données | La langue du bibliothécaire |

---

*Glossaire rédigé en mai 2026 — mis à jour au fil du projet*
