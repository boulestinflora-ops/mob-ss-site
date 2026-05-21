# Architecture MOB'SS

Plateforme de mise en relation entre professionnels du sport/santé (praticiens) et propriétaires d'espaces inoccupés (hôtes).

---

## Stack technique

| Couche | Technologie | Rôle |
|---|---|---|
| Frontend | Astro 4 (hybrid) | Pages statiques + SSR ponctuel |
| Hébergement | Vercel (cdg1 — Paris) | Deploy automatique sur push |
| BaaS | Supabase | Auth, DB PostgreSQL, Storage, Edge Functions |
| Styles | CSS vanilla (`src/styles/style.css`) | Pas de framework CSS |
| Polices | @fontsource (auto-hébergé) | DM Sans + Playfair Display |
| Analytics | PostHog EU | Comportement utilisateur, funnels |
| Tests E2E | Playwright | Flows critiques |
| CI | GitHub Actions | Build check sur chaque push |

---

## Structure du projet

```
mobss/
├── src/
│   ├── components/        # Composants Astro réutilisables
│   ├── layouts/           # BaseLayout.astro — squelette HTML commun
│   ├── pages/             # Une page = un fichier .astro
│   └── styles/            # style.css — CSS global unique
├── public/
│   ├── scripts/           # tour.js, script.js — JS non-bundlé
│   └── fonts/             # (réservé — polices via fontsource)
├── supabase/
│   ├── functions/         # Deno Edge Functions
│   └── *.sql              # Migrations et scripts SQL
├── tests/e2e/             # Specs Playwright
├── .github/workflows/     # CI GitHub Actions
├── vercel.json            # Config Vercel (headers, redirects, région)
├── astro.config.mjs       # Config Astro (output: hybrid, adapter: vercel)
└── ARCHITECTURE.md        # Ce fichier
```

---

## Pages

### Publiques (statiques)
| Route | Fichier | Description |
|---|---|---|
| `/` | `index.astro` | Homepage — hero, features, CTA inscription |
| `/explorez` | `explorez.astro` | Annonces d'espaces avec filtres client-side |
| `/annuaire` | `annuaire.astro` | Annuaire des praticiens avec filtres |
| `/remplacements` | `remplacements.astro` | Praticiens disponibles pour remplacement |
| `/comment-ca-marche` | `comment-ca-marche.astro` | Explications + FAQ |
| `/contact` | `contact.astro` | Formulaire de contact |
| `/rejoindre` | `rejoindre.astro` | Early access (3 champs) |
| `/mentions-legales` | `mentions-legales.astro` | Mentions légales RGPD |
| `/confidentialite` | `confidentialite.astro` | Politique de confidentialité |
| `/404` | `404.astro` | Page d'erreur personnalisée |

### Authentification
| Route | Fichier | Description |
|---|---|---|
| `/connexion` | `connexion.astro` | Login Supabase Auth |
| `/inscription` | `inscription.astro` | Signup — rôle praticien ou hôte |
| `/completer-profil` | `completer-profil.astro` | Complément profil post-inscription |

### Protégées (auth requise)
| Route | Fichier | Description |
|---|---|---|
| `/dashboard` | `dashboard.astro` | Dashboard praticien ET hôte (onglets) |
| `/deposer-annonce` | `deposer-annonce.astro` | Formulaire multi-étapes — hôtes uniquement |
| `/praticien` | `praticien/index.astro` | Profil public d'un praticien |

### SSR (rendu côté serveur)
| Route | Fichier | Description |
|---|---|---|
| `/annonce/[id]` | `annonce/[id].astro` | Détail d'une annonce — SSR Supabase |

### Admin
| Route | Fichier | Description |
|---|---|---|
| `/admin` | `admin.astro` | Tableau de bord admin — protégé par token secret |

---

## Composants

| Composant | Rôle |
|---|---|
| `BaseLayout.astro` | Squelette HTML, `<head>`, Header, Footer, CookieBanner |
| `Header.astro` | Navigation principale, état auth, dropdown profil |
| `Footer.astro` | Pied de page |
| `CookieBanner.astro` | Bandeau RGPD cookies |
| `Panel.astro` | Carte/section réutilisable — props: `title`, `style`, `id`, slots: `actions`, `head` |
| `SpaceCard.astro` | Carte d'espace sur la homepage |
| `FAQItem.astro` | Item accordéon FAQ |
| `FeatureCard.astro` | Carte feature homepage |
| `StatItem.astro` | Chiffre clé homepage |
| `Step.astro` | Étape "Comment ça marche" |
| `Icon.astro` | Icônes SVG inline |

---

## Base de données Supabase

### Tables principales

```
profiles          — Données utilisateur (lié à auth.users)
  id, user_id, role (praticien|hote), prenom, nom, specialite,
  ville, bio, rpps_numero, rpps_verifie, visible_annuaire,
  disponible_remplacement, photo_url

annonces          — Espaces proposés par les hôtes
  id, user_id, titre, type_espace, ville, region, departement,
  superficie, capacite, tarif_type, equipements[], jours_disponibles[],
  lat, lng, photos[], statut (actif|en_attente|archive)

demandes          — Demandes de réservation envoyées par les praticiens
  id, annonce_id, praticien_id, message, statut (en_attente|accepte|refuse)

documents         — Documents professionnels (diplôme, RC Pro)
  id, user_id, type (diplome|assurance), file_path, status,
  ai_analyse (jsonb), expires_at

rate_limits       — Sliding window pour les Edge Functions
  id, key (<userId>:<functionName>), called_at
```

### Row Level Security
Toutes les tables ont RLS activé. Les Edge Functions sensibles utilisent le `service_role` pour bypasser RLS. `rate_limits` n'est accessible qu'en `service_role`.

---

## Edge Functions Supabase (Deno)

| Fonction | Déclencheur | Rôle |
|---|---|---|
| `analyze-document` | Appel POST depuis dashboard | Analyse OCR + IA via Claude Haiku |
| `verify-rpps` | Appel POST depuis completer-profil | Vérification RPPS via API ANS/FHIR |
| `admin-documents` | Appel GET/POST depuis /admin | Liste + mise à jour statut documents (bypass RLS) |
| `check-expiry` | Cron Supabase | Vérifie les RC Pro expirées |

Toutes les fonctions ont : auth JWT, rate limiting (table `rate_limits`), CORS headers.

---

## Authentification

Supabase Auth (email + password). Flux :
1. Inscription → `supabase.auth.signUp()` → email de confirmation
2. Confirmation → redirect vers `/completer-profil`
3. Connexion → `supabase.auth.signInWithPassword()` → redirect `/dashboard`
4. Session persistée via `localStorage` (SDK Supabase)
5. Pages protégées : `onAuthStateChange` + redirect vers `/connexion` si non authentifié

---

## Variables d'environnement

### Frontend (`.env` + Vercel Env Vars)
```
PUBLIC_SUPABASE_URL          — URL du projet Supabase
PUBLIC_SUPABASE_ANON_KEY     — Clé publique Supabase
PUBLIC_BETA_MODE             — "true" active noindex + bandeau beta
PUBLIC_POSTHOG_KEY           — Clé API PostHog (optionnel)
```

### Supabase Secrets (Edge Functions)
```
ANTHROPIC_API_KEY            — Clé Claude (analyze-document)
ESANTE_API_KEY               — Clé API ANS (verify-rpps)
ADMIN_EMAILS                 — Emails admins séparés par virgule
SUPABASE_URL                 — Auto-injectée par Supabase
SUPABASE_SERVICE_ROLE_KEY    — Auto-injectée par Supabase
SUPABASE_ANON_KEY            — Auto-injectée par Supabase
```

---

## Lancer le projet en local

```bash
# Installer les dépendances
npm install

# Créer le fichier d'environnement
cp .env.example .env
# Remplir PUBLIC_SUPABASE_URL et PUBLIC_SUPABASE_ANON_KEY

# Démarrer le serveur de dev
npm run dev         # http://localhost:4321

# Lancer les tests e2e
npm run test:e2e    # Playwright (démarre le serveur automatiquement)

# Build de production
npm run build
```

---

## Déploiement

Push sur `main` → GitHub Actions vérifie le build → Vercel déploie automatiquement.

Pour les Edge Functions :
```bash
supabase link --project-ref <project-ref>
supabase functions deploy <nom-de-la-fonction>
```

---

## Décisions d'architecture notables

- **`output: 'hybrid'`** — toutes les pages sont statiques sauf `/annonce/[id]` (SSR) pour les données fraîches sans rebuild.
- **Pas de framework CSS** — CSS vanilla avec variables custom (`--color-*`, `--radius-*`). Maintenable mais verbeux.
- **Pas de state manager** — état géré par variables JS module-level dans chaque page. Acceptable à cette échelle.
- **BaaS-first** — Supabase gère auth + DB + storage + fonctions serveur. Simplifie l'infra mais crée une dépendance forte.
- **Rate limiting applicatif** — table `rate_limits` en PostgreSQL (sliding window). Simple, sans Redis, adapté à l'échelle actuelle.
