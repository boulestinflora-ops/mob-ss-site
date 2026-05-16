# MOB'SS — Synthèse de session (à coller dans une nouvelle session)

> Document de passation. Copie-colle tout ceci au début d'une nouvelle conversation
> pour reprendre le travail exactement là où on s'est arrêté.

---

## 1. Contexte du projet

**MOB'SS** : plateforme qui connecte les professionnels du sport et de la santé
avec des espaces inoccupés mis à disposition **gracieusement** par des collectivités
et des entreprises.

- La plateforme **n'est PAS pour les citoyens/patients** : pour prendre rendez-vous,
  ils passent par Doctolib (un encart les redirige).
- Flora est **débutante complète** en développement web. Claude joue le rôle de
  développeur du projet (pas de cofondateur tech, pas de freelance).
- Le site n'est **pas public** pour le moment (développement local uniquement).

**Stack technique :**
- Frontend : **Astro** (générateur de site statique) — composants `.astro`, layouts, `src/pages/`, `src/components/`, `src/data/` (JSON), `src/lib/`, `src/styles/`
- Backend : **Supabase** (PostgreSQL + Auth) — `@supabase/supabase-js`, RLS, GRANT
- Tests : **Vitest** (unitaires) + **Playwright** (E2E)
- Police : DM Sans. Design : couleurs vives et plates, beaucoup de blanc (style proto Bubble)

**Chemins du projet :**
- Windows : `C:\Users\boule\OneDrive\Documents\MOB'SS\site\`
- Supabase : URL `https://vmnkumsbcmgsuolpkcyi.supabase.co`

---

## 2. Où on en est — état global

✅ **Phase 1 (backend = authentification)** : TERMINÉE et confirmée fonctionnelle
par Flora. Inscription / connexion / déconnexion / dashboard différencié par rôle
fonctionnent.

🔄 **En cours** : liste de modifications design/UX demandées avant la Phase 3.
Plusieurs sont faites, plusieurs restent à faire (voir section 6).

⏭️ **Ensuite** : Phase 3 = vraies annonces stockées dans Supabase.

---

## 3. Fichiers créés / modifiés et leur état

### Backend (créés, fonctionnels)
| Fichier | État |
|---|---|
| `src/lib/supabase.ts` | OK — client Supabase |
| `src/lib/auth.ts` | OK — `getCurrentUser`, `signOutAndRedirect`, ré-exports |
| `src/lib/validation.ts` | OK — fonctions pures : `getInitials`, `getDisplayName`, `validatePassword`, `validateEmail`, `isValidRole` |
| `src/lib/validation.test.ts` | OK — 16 tests unitaires qui passent |
| `tests/e2e/navigation.spec.ts` | OK |
| `tests/e2e/auth.spec.ts` | OK |
| `vitest.config.ts` / `playwright.config.ts` | OK |
| `.env` / `.env.example` | OK (clés Supabase) |

### Pages auth (connectées à Supabase, fonctionnelles)
- `connexion.astro` — soumission JS (pas de GET non sécurisé)
- `inscription.astro` — 3 rôles : praticien, collectivite, entreprise (pas de citoyen)
- `dashboard.astro` — deux vues (praticien / hôte), utilise `getSession()`, **sans** `onAuthStateChange`

### Modifications design (FAITES dans cette session)
| Fichier | Ce qui a été fait |
|---|---|
| `src/styles/style.css` | Couleurs plus vives (`--color-primary: #C8424F`, crème `#F4E8B8`, etc.) ; boutons carrés (`border-radius: 10px`) ; `.section` padding 100px ; ajout `.section--white` ; `.section--alt` en `--color-bg-soft` |
| `src/components/Header.astro` | "Comment ça marche" sans "?" ; logo + bouton "Déposer votre annonce" groupés à gauche ; nav centrée ; "Se connecter" / "S'inscrire" boutons carrés à droite ; script en `getSession()` |
| `src/data/audiences.json` | Suppression du "citoyen" — 3 entrées (Praticiens, Collectivités, Entreprises) avec le mot "gracieuse" |
| `src/data/metiers.json` | **CRÉÉ** — 4 catégories : Santé paramédicale, Bien-être & soins doux, Sport & activité physique, Médical & consultations |
| `src/pages/index.astro` | Hero raccourci ; search-card remontée (`margin-top:-60px`) ; bloc "Comment MOB'SS facilite" sur fond blanc ; 3 publics sans citoyen ; encart Doctolib ; suppression des références citoyen |
| `src/data/spaces.json` | Suppression du champ `price` ; ajout `region`, `host` (collectivite/entreprise), `lat`, `lng` pour les 8 espaces |

### Modification design EN COURS (pas terminée)
- `src/components/SpaceCard.astro` — **LU mais pas encore modifié.** Il contient
  encore `price` dans les props et affiche `<span class="price">{price} €<small> / heure</small></span>`.
  À remplacer par "Mise à disposition gracieuse".

---

## 4. Décisions prises

- **Migration HTML → Astro** : faite tôt dans le projet, pour avoir des composants
  réutilisables et un code propre avant le backend.
- **Design** : abandon du style "luxe/premium" (Instrument Serif, éditorial) jugé
  trop sophistiqué → DM Sans, couleurs plates et vives, beaucoup de blanc.
- **Pas de prix sur la plateforme** : les espaces sont en "mise à disposition
  gracieuse" par les collectivités et entreprises.
- **Citoyens hors périmètre** : redirigés vers Doctolib via un encart.
- **Auth** : utilisation de `getSession()` (lecture cookie synchrone) plutôt que
  `getUser()` (appel HTTP) ; suppression totale de `onAuthStateChange` qui causait
  une boucle infinie.
- **Tests** : séparation des fonctions pures dans `validation.ts` pour pouvoir les
  tester sans dépendre de `.env`.

---

## 5. Problèmes rencontrés et résolus

| Problème | Solution |
|---|---|
| `connexion.html` envoyait les identifiants en GET (faille) | Conversion en soumission JS équivalente POST |
| `npm` non reconnu | Installation de Node.js + `cd` dans le bon dossier |
| PowerShell bloquait npm (execution policy) | `Set-ExecutionPolicy RemoteSigned -Scope CurrentUser` |
| Vitest : "Variables Supabase manquantes" | Fonctions pures isolées dans `validation.ts`, testées à part ; `auth.test.ts` mis en `describe.skip` |
| 403 Forbidden sur la table `profiles` | SQL : `GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated; GRANT SELECT ON public.profiles TO anon; GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;` |
| Dashboard en chargement infini + boutons qui clignotent | Cause : `onAuthStateChange` déclenchait `window.location.reload()` sur l'événement INITIAL_SESSION = boucle. Solution : suppression de `onAuthStateChange`, passage à `getSession()` |
| Dashboard affichait la vue collectivité pour un compte praticien | Différenciation du rôle à l'inscription + dashboard conditionnel |
| Page qui "charge à l'infini" mais marche quand on stoppe | Comportement normal du HMR de Vite en dev (invisible en production) |

---

## 6. Tâches restantes (avant Phase 3)

1. **`SpaceCard.astro`** — supprimer la prop `price`, remplacer l'affichage du prix
   par un badge "Mise à disposition gracieuse". *(prochaine étape immédiate)*
2. **`explorez.astro`** — gros refactor :
   - Titre qui s'adresse aux pros : « Où souhaitez-vous exercer ? »
   - Menu "Affiner la recherche" rétractable, à gauche
   - Carte interactive à droite (style Doctolib)
   - Filtres complets : distance, région, département, type de praticien, type d'espace
   - Suppression des prix
   - Utiliser la nouvelle structure de `spaces.json`
3. **CSS** — styles pour la sidebar rétractable + le layout carte à droite de `explorez`.
4. **`annonce.astro`** — modèle de récurrence personnalisable ; suppression des prix
   → "mise à disposition gracieuse".
5. **`comment-ca-marche.astro`** — retirer la partie financière/tarifs ; ajouter
   des infos sur le modèle du projet (mise à disposition gracieuse / impact social).
6. **Puis Phase 3** — vraies annonces stockées dans Supabase (selon `BACKEND-PLAN.md`).

---

## 7. Prochaine étape immédiate

Modifier `src/components/SpaceCard.astro` : retirer `price` des props et remplacer
`<span class="price">{price} €<small> / heure</small></span>` par un élément
"Mise à disposition gracieuse".
