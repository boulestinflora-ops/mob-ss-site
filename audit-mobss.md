# Audit complet MOB'SS — Mai 2026

> Analyse UX/design, navigation, contenu, SEO, performance, accessibilité + bugs identifiés dans le code.

---

## 1. Design & UX

### Ce qui fonctionne bien
Le design est cohérent et professionnel. La palette bordeaux (#C8424F) / crème (#F4E8B8) / blanc crée une identité visuelle distinctive et humaine, bien différenciée des plateformes médicales froides. La typographie DM Sans est un excellent choix : moderne, lisible, chaleureuse. Les `clamp()` typographiques assurent une belle adaptation aux différentes tailles d'écran. Les boutons avec `box-shadow: 0 4px 0` créent un effet de profondeur subtil et efficace. Le système de design est bien structuré via des variables CSS (`--color-*`, `--radius-*`, `--shadow-*`).

### Points à améliorer

**Favicon manquant.** Le `<head>` ne contient aucune balise `<link rel="icon">`. Les onglets du navigateur affichent une icône générique, ce qui nuit à la crédibilité professionnelle.

**Search card : décalage d'espacement.** Sur `index.astro`, la search card est positionnée avec `style="margin-top:-60px"` en inline, alors que la classe CSS `.search-card` définit `margin: -72px auto 0`. Les deux s'appliquent et s'annulent partiellement — résultat visuellement imprévisible selon les navigateurs.

**Bandeau Doctolib sur la page d'accueil.** Le bandeau "Vous êtes patient·e ?" avec le lien Doctolib est une bonne idée, mais il manque de style CSS dédié (il n'est pas dans le fichier style.css, ce qui signifie qu'il hérite des styles génériques sans mise en forme propre).

**Barre de progression sur `/completer-profil`.** Elle est codée en dur ("Étape 1/3") mais la page ne contient qu'une seule étape. Les étapes 2 et 3 n'existent pas encore — cela peut créer une fausse attente chez l'utilisateur.

---

## 2. Navigation

### Ce qui fonctionne bien
La navigation principale est claire et limitée à l'essentiel (4 liens). Le header est sticky avec un effet glassmorphism discret. Le skip-link "Aller au contenu principal" est présent et correctement implémenté. La gestion mobile avec menu hamburger et états connecté/déconnecté est bien pensée. Le footer 4 colonnes organise bien les liens secondaires.

### Points à améliorer

**Liens footer vers des pages inexistantes.** Le footer pointe vers `/mentions-legales` et `/confidentialite`. Ces pages ne semblent pas exister dans le projet (elles ne sont pas dans le dossier `src/pages/`). Cliquer dessus retourne une page 404, ce qui est problématique légalement (mentions légales obligatoires en France) et pour la confiance.

**Pas de lien "Rejoindre" dans le menu principal.** La page `/rejoindre` est la page d'acquisition principale pour les praticiens, mais elle n'apparaît nulle part dans le menu header. Un CTA "Rejoindre MOB'SS" devrait être visible.

**Pas de breadcrumb sur les pages internes.** Sur `/annonce/[id]`, l'utilisateur ne sait pas facilement revenir à la liste des espaces sans utiliser le bouton "retour" du navigateur. Un fil d'Ariane simple ("Accueil › Espaces › Studio Lumière") améliorerait l'orientation.

**La FAQ du footer (`/comment-ca-marche#faq`)** pointe vers une ancre qui n'est peut-être pas balisée comme telle dans `comment-ca-marche.astro` — à vérifier.

---

## 3. Contenu

### Ce qui fonctionne bien
Le message est clair et différenciant : espaces gratuits, sans engagement, pour les professionnels du sport et de la santé. Le ton est humain et bienveillant, sans jargon. Les 3 propositions de valeur (espaces / remplacements / annuaire) sont bien hiérarchisées. Le bandeau dev est une preuve de transparence appréciable. La page `/rejoindre` avec compteur de praticiens inscrits est un bon levier de preuve sociale.

### Points à améliorer

**Fausse statistique sur la page Explorez.** La meta description indique "Plus de 1 200 espaces référencés en France" alors qu'il n'y a que 8 espaces de démonstration. Pire : le titre `<strong id="results-count">` sur la page affiche "8 espaces" en temps réel, ce qui contredit directement la description et perd la confiance de l'utilisateur.

**Stats sur la page d'accueil à vérifier.** La section "Pourquoi MOB'SS ?" affiche des chiffres issus de `stats.json` — s'assurer qu'ils sont sourcés et réels.

**Pas de page "Annuaire".** La valeur de l'annuaire des praticiens est mentionnée partout comme argument de vente, mais la page n'existe pas encore. Si un praticien arrive via `/rejoindre` et cherche l'annuaire, il ne le trouve nulle part.

**Pas de page "Remplacements".** Idem — ce service clé est évoqué mais sans destination concrète sur le site.

**Texte de la page `/connexion` et `/inscription` à auditer.** Ces pages n'ont pas été vérifiées dans cette session — les textes d'accompagnement et les messages d'erreur sont à passer en revue.

---

## 4. SEO

### Problèmes critiques

**Pas de balises Open Graph.** Le `<head>` dans `BaseLayout.astro` ne contient aucune balise `<meta property="og:*">`. Quand un lien MOB'SS est partagé sur LinkedIn, WhatsApp ou Twitter, aucun aperçu ne s'affiche — perte d'impact majeure pour la notoriété.

Correction à ajouter dans `BaseLayout.astro` :
```html
<meta property="og:title" content={title} />
<meta property="og:description" content={description} />
<meta property="og:type" content="website" />
<meta property="og:url" content={Astro.url} />
<meta property="og:image" content="/og-image.jpg" />
<meta name="twitter:card" content="summary_large_image" />
```

**Pas d'URL canonique.** Sans balise `<link rel="canonical">`, les moteurs de recherche peuvent indexer des doublons (avec et sans `www`, avec et sans `/`, etc.).

**Pas de favicon.** Google Search Console utilise le favicon comme indicateur de marque dans les résultats de recherche.

**Meta description fausse sur Explorez.** "Plus de 1 200 espaces référencés" est un mensonge — à corriger immédiatement en : "Trouvez un espace gratuit pour exercer votre activité de sport ou de santé près de chez vous."

**Pas de sitemap.xml.** Astro peut générer un sitemap automatiquement avec `@astrojs/sitemap` — sans lui, Google ne découvre les pages que par les liens entrants.

**Pas de données structurées (schema.org).** Pour les fiches espaces, ajouter `LocalBusiness` ou `Place` en JSON-LD aiderait à apparaître dans les résultats enrichis Google.

**Pas de robots.txt.** Sans ce fichier, les robots d'indexation n'ont aucune directive — et les pages de dashboard ou d'authentification pourraient être indexées.

### Headings à vérifier
La hiérarchie H1/H2/H3 semble correcte sur les pages vues, avec un seul H1 par page. À vérifier sur `comment-ca-marche.astro` et `inscription.astro`.

---

## 5. Performance perçue

### Ce qui fonctionne bien
Le CSS est bien structuré avec des transitions `0.15s–0.2s` subtiles. L'utilisation de `will-change` est absente (bonne chose — évite la surconsommation mémoire). Les images Unsplash utilisent `loading="lazy"` sur la page annonce.

### Points à améliorer

**Google Fonts chargées de manière bloquante.** Le `<link href="https://fonts.googleapis.com/...">` dans `<head>` peut bloquer le rendu initial. Amélioration recommandée :
```html
<link rel="preload" as="style" href="https://fonts.googleapis.com/..." onload="this.rel='stylesheet'" />
<noscript><link rel="stylesheet" href="..." /></noscript>
```

**Images Unsplash sans dimensions.** Les `<img>` dans `SpaceCard.astro` et sur la page annonce n'ont pas d'attributs `width` et `height`. Le navigateur ne peut pas réserver l'espace avant le chargement, causant des sauts de layout (CLS élevé dans Core Web Vitals).

**Pas d'optimisation d'image.** Les URLs Unsplash utilisent `?w=800&q=80` pour les cartes, ce qui est bien, mais sur la page annonce les variantes de la galerie utilisent des paramètres différents sans format WebP explicite. Astro propose `@astrojs/image` pour l'optimisation automatique.

**Le script `/scripts/script.js` est chargé en `is:inline` sur toutes les pages**, y compris celles qui n'en ont pas besoin (pages purement statiques comme `comment-ca-marche`).

---

## 6. Accessibilité

### Ce qui fonctionne bien
Le skip-link est présent et fonctionnel. Les `focus-visible` sont soignés avec un outline bordeaux de 3px. La langue de la page est correctement déclarée (`<html lang="fr">`). Le formulaire de contact utilise des `<label>` associés aux inputs. Le menu hamburger a un `aria-label` et `aria-expanded`. Le bandeau dev a un `role="banner"` et `aria-label`.

### Points à améliorer

**Contraste insuffisant pour les textes secondaires.** La couleur `--color-text-soft: #6F5F63` sur fond blanc (#FFFFFF) donne un ratio de contraste d'environ 3.9:1. Le standard WCAG AA exige 4.5:1 pour les textes de taille normale. Cette couleur est utilisée massivement pour les descriptions et labels dans les formulaires — les personnes malvoyantes peuvent avoir du mal à lire.

Correction : assombrir légèrement vers `#5A4D51` (ratio ≈ 5.2:1).

**Images sans attribut `alt` dans SpaceCard.** À vérifier — si l'image de l'espace n'a qu'un `alt={title}`, c'est suffisant, mais si `alt` est vide ou absent sur une image non-décorative, c'est une violation WCAG.

**Les filtres "Équipements" et "Disponibilité" sur Explorez ne sont pas liés à une region `aria-live`.** Quand les filtres changent le nombre de résultats, les lecteurs d'écran ne sont pas notifiés du nouveau nombre de résultats. Un `aria-live="polite"` sur `#results-count` résoudrait cela.

**Les checkboxes de filtres n'ont pas de `<fieldset>`/`<legend>`.** Pour les groupes de cases à cocher (Équipements, Type d'espace), l'accessibilité serait améliorée par un `<fieldset>` avec `<legend>` au lieu d'un simple `<span class="filter-group__label">`.

---

## 7. Points forts

- **Identité visuelle forte et cohérente** : le système de design bordeaux/crème est distinctif et professionnel, rare dans le secteur médico-social.
- **Architecture technique solide** : Astro + Supabase est un choix excellent pour ce type de site — rapide, peu coûteux, scalable.
- **Parcours d'inscription sans friction** : le magic link en 30 secondes sur `/rejoindre` est l'une des meilleures UX d'onboarding possible pour une audience non-tech.
- **Gestion de session côté client propre** : `getSession()` plutôt que `getUser()` dans le header évite des appels HTTP inutiles à chaque chargement de page.
- **Responsive bien pensé** : `clamp()`, breakpoints à 1024/768/480px, menu hamburger avec états auth.
- **Transparence courageuse** : le bandeau "site en cours de création" inspire confiance plutôt que de la méfiance.
- **Pas de prix nulle part** : la cohérence du modèle "mise à disposition gracieuse" est respectée dans tout le code.
- **SQL réutilisable et sécurisé** : le schema.sql utilise `IF NOT EXISTS`, `OR REPLACE`, RLS policies — peut être exécuté plusieurs fois sans risque.
- **Accessibilité de base bien posée** : skip-link, focus-visible, lang="fr", aria-labels — rares sur des projets de ce stade.

---

## 8. Points à améliorer — bugs et priorités

### 🔴 Bugs critiques (à corriger immédiatement)

**BUG 1 — Liens de popup de carte cassés (`explorez.astro` ligne ~204)**
Les popups des marqueurs Leaflet génèrent des liens `/annonce?id=${space.id}` alors que les pages d'annonce utilisent des routes statiques `/annonce/${space.id}`. Résultat : cliquer sur une popup depuis la carte envoie vers une page 404.

Correction dans `explorez.astro` :
```js
// AVANT (cassé)
<a href="/annonce?id=${space.id}">Voir l'espace →</a>

// APRÈS (correct)
<a href="/annonce/${space.id}">Voir l'espace →</a>
```

**BUG 2 — Recherche depuis la page d'accueil non fonctionnelle**
Le formulaire de recherche de `index.astro` soumet `?metier=...&loc=...` vers `/explorez`, mais `explorez.astro` ne lit pas ces paramètres URL dans son JavaScript — il ne pré-remplit ni ne filtre avec les valeurs envoyées. L'utilisateur tape "kiné Lyon", arrive sur Explorez, et voit tous les espaces sans filtre appliqué.

Correction : ajouter en tête du script de `explorez.astro` :
```js
const params = new URLSearchParams(window.location.search);
const locParam = params.get('loc') || params.get('metier') || '';
if (locParam) {
  const locInput = document.getElementById('filter-loc');
  if (locInput) { locInput.value = locParam; applyFilters(); }
}
```

**BUG 3 — Filtres "Disponibilité" et "Équipements" jamais appliqués**
Les groupes de filtres "Disponibilité" (radio `filter-dispo`) et "Équipements" (checkboxes `.filter-equip`) sont affichés dans l'interface mais la fonction `getActiveFilters()` ne les lit pas. Ils donnent l'illusion d'être fonctionnels sans rien faire.

Option A : les supprimer de l'interface jusqu'à implémentation.
Option B : ajouter leur logique dans `getActiveFilters()` et `applyFilters()`.

**BUG 4 — Meta description fausse sur Explorez**
```
"Plus de 1 200 espaces référencés en France pour exercer votre activité..."
```
Il y a 8 espaces. À corriger immédiatement avant tout déploiement public.

### 🟡 Problèmes importants (à corriger avant lancement)

**P1 — Pas de favicon** : ajouter un fichier `public/favicon.svg` (ou `.ico`) et la balise `<link rel="icon">` dans `BaseLayout.astro`.

**P2 — Pas de balises Open Graph** : essentiel pour le partage sur les réseaux sociaux et LinkedIn, canal clé pour toucher les professionnels de santé.

**P3 — Pages légales manquantes** : créer `/mentions-legales` et `/confidentialite` — obligatoires légalement en France (RGPD, loi pour la confiance dans l'économie numérique). Sans elles, le site ne peut pas opérer légalement.

**P4 — Contraste texte-soft insuffisant** : `#6F5F63` sur blanc = 3.9:1 (norme AA = 4.5:1 minimum). Assombrir à `#5A4D51`.

**P5 — Page `/annuaire` manquante** : valeur de vente centrale mais sans destination.

### 🟢 Améliorations recommandées (phase post-lancement)

- Ajouter `@astrojs/sitemap` pour la génération automatique du sitemap
- Créer un `public/robots.txt` avec les directives de crawl
- Ajouter `width` et `height` aux images pour réduire le CLS (Core Web Vitals)
- Ajouter `aria-live="polite"` sur `#results-count` dans Explorez
- Remplacer les `<span class="filter-group__label">` par des `<fieldset>/<legend>` pour l'accessibilité des filtres
- Passer les Google Fonts en `preload` pour améliorer le LCP
- Ajouter un lien vers `/rejoindre` dans le header (CTA visible pour les praticiens)
- Ajouter des breadcrumbs sur les pages annonce
- Mettre à jour la barre de progression sur `/completer-profil` (affiche 1/3 mais il n'y a qu'une étape)
- Créer une page `/annuaire` et une page `/remplacements` cohérentes avec les promesses du site

---

*Audit réalisé le 15 mai 2026 — 9 fichiers source analysés*
