# Architecture MOB'SS

Plateforme de mise en relation entre professionnels du sport/santé (praticiens) et propriétaires d'espaces inoccupés (hôtes).

> **Dernière mise à jour :** mai 2026

---

## Stack technique

| Couche | Technologie | Rôle |
|---|---|---|
| Frontend | Astro 4 (hybrid) | Pages statiques + SSR ponctuel |
| Hébergement | Vercel (cdg1 — Paris) | Deploy automatique sur push `main` |
| BaaS | Supabase | Auth, DB PostgreSQL, Storage, Realtime, Edge Functions |
| Styles | CSS vanilla (`src/styles/style.css`) | Pas de framework CSS — variables custom |
| Polices | @fontsource/outfit + @fontsource/dm-sans (auto-hébergé) | Zéro dépendance Google Fonts |
| Analytics | PostHog EU | Comportement utilisateur, funnels |
| Tests unitaires | Vitest | `src/lib/*.test.ts` |
| Tests E2E | Playwright | Flows critiques (`tests/e2e/`) |
| CI | GitHub Actions | Build check sur chaque push |

---

## Structure du projet

```
mobss/
├── src/
│   ├── components/        # Composants Astro réutilisables
│   ├── data/              # JSON statiques — stats, FAQ, étapes, audiences, espaces
│   ├── layouts/           # BaseLayout.astro — squelette HTML + JSON-LD global
│   ├── lib/               # Utilitaires TypeScript partagés
│   ├── pages/             # Une page = un fichier .astro (routage file-based)
│   └── styles/            # style.css — CSS global unique (~1800 lignes)
├── public/
│   ├── scripts/           # tour.js, script.js — JS non-bundlé
│   └── sitemap.xml        # Sitemap statique
├── supabase/
│   ├── functions/         # Deno Edge Functions
│   └── *.sql              # Migrations et scripts SQL
├── tests/e2e/             # Specs Playwright
├── .github/workflows/     # CI GitHub Actions
├── .env.example           # Modèle variables d'environnement
├── vercel.json            # Config Vercel (headers sécurité, redirects, région)
├── astro.config.mjs       # Config Astro (output: hybrid, adapter: vercel)
├── ARCHITECTURE.md        # Ce fichier
├── DEPLOIEMENT.md         # Guide déploiement pas-à-pas
└── GLOSSAIRE.md           # Termes techniques MOB'SS
```

---

## Pages

### Marketing (statiques, SEO)
| Route | Fichier | Description |
|---|---|---|
| `/` | `index.astro` | Homepage — hero B2B, features, CTA inscription |
| `/le-probleme` | `le-probleme.astro` | Étude de marché — chiffres déserts médicaux |
| `/notre-solution` | `notre-solution.astro` | Présentation de la plateforme |
| `/notre-impact` | `notre-impact.astro` | Impact par acteur |
| `/comment-ca-marche` | `comment-ca-marche.astro` | Explications + FAQ (JSON-LD FAQPage) |
| `/contact` | `contact.astro` | Formulaire de contact |
| `/rejoindre` | `rejoindre.astro` | Early access — 3 champs |
| `/mentions-legales` | `mentions-legales.astro` | Mentions légales RGPD |
| `/confidentialite` | `confidentialite.astro` | Politique de confidentialité |
| `/404` | `404.astro` | Page d'erreur personnalisée |

### Annuaire / découverte
| Route | Fichier | Description |
|---|---|---|
| `/explorez` | `explorez.astro` | Annonces d'espaces — filtres client-side + carte Leaflet |
| `/annuaire` | `annuaire.astro` | Annuaire praticiens — filtre live spécialité + ville |
| `/remplacements` | `remplacements.astro` | Praticiens disponibles — pagination PAGE_SIZE=12 |

### Authentification
| Route | Fichier | Description |
|---|---|---|
| `/connexion` | `connexion.astro` | Login Supabase Auth |
| `/inscription` | `inscription.astro` | Signup stepper 2 étapes — rôle → coordonnées |
| `/completer-profil` | `completer-profil.astro` | Complément profil post-inscription |
| `/reset-password` | `reset-password.astro` | Réinitialisation mot de passe |

### Protégées (auth requise)
| Route | Fichier | Description |
|---|---|---|
| `/dashboard` | `dashboard.astro` | Dashboard praticien + hôte — ⚠️ 2750 lignes (voir dette technique) |
| `/dashboard/praticien` | `dashboard/praticien.astro` | Vue praticien isolée (split partiel) |
| `/dashboard/hote` | `dashboard/hote.astro` | Vue hôte isolée (split partiel) |
| `/deposer-annonce` | `deposer-annonce.astro` | Formulaire multi-étapes hôtes — compression images Canvas/WebP |
| `/praticien` | `praticien/index.astro` | Profil public d'un praticien |

### SSR
| Route | Fichier | Description |
|---|---|---|
| `/annonce/[id]` | `annonce/[id].astro` | Détail annonce — rendu côté serveur Supabase |

### Admin
| Route | Fichier | Description |
|---|---|---|
| `/admin` | `admin.astro` | Tableau de bord admin — protégé par token secret |

---

## Composants (`src/components/`)

| Composant | Props principales | Rôle |
|---|---|---|
| `BaseLayout.astro` | `title`, `description`, `currentPage` | Squelette HTML, `<head>`, JSON-LD global |
| `Header.astro` | — | Navigation, état auth, dropdown "Comment ça marche" |
| `Footer.astro` | — | Pied de page |
| `CookieBanner.astro` | — | Bandeau RGPD |
| `PageHero.astro` | `eyebrow`, `title`, `lead`, `paddingBottom` | Hero dégradé rouge — partagé entre pages marketing |
| `CTASection.astro` | `title`, `subtitle`, `primaryLabel/Href`, `secondaryLabel/Href`, `showContact` | Section CTA finale partagée |
| `Panel.astro` | `title`, `style`, `id` + slots `actions`, `head` | Carte/section dashboard réutilisable |
| `SpaceCard.astro` | — | Carte d'espace homepage |
| `AudienceCard.astro` | — | Carte audience homepage |
| `FAQItem.astro` | — | Item accordéon FAQ |
| `FeatureCard.astro` | — | Carte feature homepage |
| `StatItem.astro` | — | Chiffre clé homepage |
| `Step.astro` | — | Étape "Comment ça marche" |
| `Icon.astro` | — | Icônes SVG inline |

---

## Données statiques (`src/data/`)

| Fichier | Contenu |
|---|---|
| `stats.json` | Source de vérité pour tous les chiffres clés (76%, 44%…) avec sources citées |
| `faq.json` | Questions/réponses page comment-ça-marche |
| `steps.json` | Étapes du parcours utilisateur |
| `audiences.json` | Descriptions des 3 profils cibles |
| `spaces.json` | Espaces statiques de démo |

---

## Utilitaires (`src/lib/`)

| Fichier | Rôle |
|---|---|
| `supabase.ts` | Client Supabase singleton |
| `auth.ts` | Helpers auth — `requireAuth()`, `getSession()`, guards de redirect |
| `forms.ts` | `validateEmail()`, `validatePassword()`, `showMessage()` |
| `validation.ts` | Règles de validation réutilisables |
| `types.ts` | Types TypeScript centralisés — `Profile`, `Annonce`, `Demande`, `Document` |
| `auth.test.ts` | Tests unitaires auth (Vitest) |
| `validation.test.ts` | Tests unitaires validation (Vitest) |

---

## Base de données Supabase

```sql
profiles     -- Utilisateurs (lié à auth.users via trigger)
             -- role: praticien | collectivite | entreprise

annonces     -- Espaces proposés par les hôtes
             -- statut: actif | en_attente | archive

demandes     -- Demandes de réservation praticien → hôte
             -- statut: en_attente | acceptee | refusee

documents    -- Diplômes et RC Pro des praticiens
             -- status: pending | approved | rejected

rate_limits  -- Sliding window anti-abus pour Edge Functions
```

RLS activé sur toutes les tables. Edge Functions sensibles utilisent `service_role`.

---

## Notifications temps réel (Supabase Realtime)

Le dashboard s'abonne aux changements Postgres en temps réel :

- **Praticien** — écoute `UPDATE` sur `demandes` (filtre `user_id=eq.{id}`) → toast vert/orange quand une demande est acceptée ou refusée
- **Hôte** — écoute `INSERT` sur `demandes` → toast bleu + badge cloche quand une nouvelle demande arrive

Toasts affichés en bas à droite (CSS `position:fixed`), auto-dismissés après 6 s, fermables manuellement.

---

## Edge Functions Supabase (Deno)

| Fonction | Déclencheur | Rôle |
|---|---|---|
| `analyze-document` | POST depuis dashboard | Analyse OCR + IA via Claude Haiku |
| `verify-rpps` | POST depuis completer-profil | Vérification numéro RPPS via API ANS/FHIR |
| `admin-documents` | GET/POST depuis /admin | Gestion documents — bypass RLS via service_role |
| `check-expiry` | Cron Supabase | Détecte les RC Pro expirées |

Toutes les fonctions : vérification JWT, rate limiting, headers CORS.

---

## Authentification — flux complet

```
Inscription (/inscription)
  Étape 1 — sélection du rôle (praticien / collectivité / entreprise)
  Étape 2 — coordonnées + mot de passe (validation inline par champ)
  → supabase.auth.signUp() → email de confirmation
  → Après confirmation :
      praticien  → /completer-profil?welcome=1
      hôte       → /dashboard?welcome=1

Connexion (/connexion)
  → supabase.auth.signInWithPassword()
  → redirect /dashboard

Pages protégées
  → onAuthStateChange : redirect /connexion si non authentifié

Reset mot de passe
  → /connexion → "Mot de passe oublié" → email Supabase
  → /reset-password → saisie nouveau mot de passe
```

---

## SEO — Structured Data (JSON-LD)

| Page | Schémas injectés |
|---|---|
| Toutes (BaseLayout) | `Organization` + `WebSite` + `SearchAction` |
| `/comment-ca-marche` | `FAQPage` |
| `/le-probleme` | `BreadcrumbList` + `Article` |
| `/notre-solution` | `BreadcrumbList` + `Service` |
| `/notre-impact` | `BreadcrumbList` + `WebPage` |
| `/annuaire` | `BreadcrumbList` + `ItemList` |

---

## Variables d'environnement

### Frontend (`.env` local + Vercel Dashboard en production)
```bash
PUBLIC_SUPABASE_URL        # URL du projet Supabase
PUBLIC_SUPABASE_ANON_KEY   # Clé publique (safe côté client)
PUBLIC_BETA_MODE           # "true" → noindex + bandeau beta
PUBLIC_ADMIN_EMAIL         # Email admin pour protéger /admin
PUBLIC_POSTHOG_KEY         # Clé PostHog (optionnel)
```

### Supabase Secrets (Edge Functions uniquement)
```bash
ANTHROPIC_API_KEY          # Clé Claude (analyze-document)
ESANTE_API_KEY             # Clé API ANS (verify-rpps)
ADMIN_EMAILS               # Emails admins séparés par virgule
SUPABASE_URL               # Auto-injectée
SUPABASE_SERVICE_ROLE_KEY  # Auto-injectée
SUPABASE_ANON_KEY          # Auto-injectée
```

---

## Lancer le projet en local

```bash
git clone https://github.com/boulestinflora-ops/mob-ss-site.git
cd mob-ss-site
npm install

cp .env.example .env
# Remplir PUBLIC_SUPABASE_URL et PUBLIC_SUPABASE_ANON_KEY

npm run dev        # → http://localhost:4321
npm run test       # Tests unitaires Vitest
npm run test:e2e   # Tests E2E Playwright
npm run build      # Build de production
```

---

## Déploiement

Push sur `main` → GitHub Actions vérifie le build → Vercel déploie automatiquement (région `cdg1`, Paris).

```bash
# Edge Functions Supabase
supabase link --project-ref <project-ref>
supabase functions deploy <nom-de-la-fonction>
```

Voir `DEPLOIEMENT.md` pour le guide complet.

---

## Décisions d'architecture notables

| Décision | Raison |
|---|---|
| `output: 'hybrid'` | Pages statiques par défaut, SSR uniquement pour `/annonce/[id]` |
| Pas de framework CSS | CSS vanilla avec variables custom — maintenable mais `style.css` approche 1800 lignes |
| Pas de state manager | État en variables JS module-level par page — acceptable à cette échelle |
| BaaS-first (Supabase) | Auth + DB + Storage + Realtime + Edge Functions en un service. Simplifie l'infra, crée une dépendance forte |
| Rate limiting PostgreSQL | Table `rate_limits` sliding window — sans Redis, adapté à l'échelle actuelle |
| Polices auto-hébergées | `@fontsource` élimine les requêtes Google Fonts, améliore CWV |
| Compression Canvas/WebP | Images compressées côté client avant upload (~80% de réduction de taille) |

---

## Dette technique connue

| Fichier | Problème | Priorité suggérée |
|---|---|---|
| `dashboard.astro` | 2750 lignes — logique praticien + hôte dans un seul fichier | Moyenne |
| `style.css` | ~1800 lignes — CSS monolithique sans découpage par composant | Basse |
| `explorez.astro` | 1150 lignes — JS inline difficile à tester unitairement | Basse |
| Types Supabase | `any` utilisé pour les résultats de requêtes (pas de types générés) | Basse |
