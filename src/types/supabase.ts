/**
 * supabase.ts — Types TypeScript pour le schéma Supabase MOB'SS
 *
 * Source de vérité : les requêtes réelles du codebase (pas schema.sql qui est
 * une version initiale — certaines colonnes ont été ajoutées depuis).
 *
 * Pour régénérer depuis le CLI Supabase (recommandé en production) :
 *   npx supabase gen types typescript --project-id <your-project-id> \
 *     > src/types/supabase.ts
 *
 * Sections :
 *   1. Littéraux de type (rôles, statuts)
 *   2. Types DB bruts (lignes telles que renvoyées par Supabase)
 *   3. Types applicatifs (données mappées / projetées pour l'UI)
 */

// ─────────────────────────────────────────────────────────────────────────────
// 1. LITTÉRAUX DE TYPE
// ─────────────────────────────────────────────────────────────────────────────

export type UserRole       = 'praticien' | 'collectivite' | 'entreprise';
export type DemandeStatut  = 'en_attente' | 'acceptee' | 'refusee';
export type AnnonceStatus  = 'en_attente' | 'publie' | 'actif' | 'inactif' | 'refuse';
export type DocumentType   = 'diplome' | 'assurance';
export type DocumentStatus = 'fourni' | 'verifie' | 'refuse';

// ─────────────────────────────────────────────────────────────────────────────
// 2. TYPES DB BRUTS
// ─────────────────────────────────────────────────────────────────────────────

/** Ligne de la table `profiles` */
export interface DbProfile {
  id:                      string;       // uuid — references auth.users
  role:                    UserRole;
  prenom:                  string | null;
  nom:                     string | null;
  telephone:               string | null;
  specialite:              string | null;
  ville:                   string | null;
  bio:                     string | null;
  disponible_remplacement: boolean;
  visible_annuaire:        boolean;
  photo_url:               string | null;
  // Colonnes étendues (ajoutées après schema.sql initial)
  email:                   string | null;  // copie dénormalisée depuis auth.users
  rpps_verifie:            boolean | null;
  email_public:            boolean | null;
  tel_public:              boolean | null;
  doctolib_url:            string | null;
  created_at:              string;
  updated_at:              string;
}

/**
 * Ligne de la table `annonces`
 * Note : le schéma réel utilise `type_espace` / `jours_disponibles` / `status`
 * (pas `type` / `jours` / `statut` comme dans schema.sql initial).
 */
export interface DbAnnonce {
  id:               string;
  user_id:          string | null;     // propriétaire hôte
  titre:            string;
  type_espace:      string;            // ex: 'Salle communale', 'Cabinet paramédical'
  adresse:          string;
  cp:               string;
  ville:            string;
  region:           string | null;
  departement:      string | null;     // code département, ex: "14"
  description:      string | null;
  superficie:       number | null;     // m²
  capacite:         number | null;     // nombre de personnes
  equipements:      string[];
  jours_disponibles:string[];
  heure_debut:      string | null;     // ex: "08:00"
  heure_fin:        string | null;     // ex: "19:00"
  tarif_type:       string;            // 'gratuit' | 'payant'
  tarif:            string | null;     // ex: "15 €/h"
  notes_dispo:      string | null;
  status:           AnnonceStatus;     // 'publie' dans les requêtes
  lat:              number | null;
  lng:              number | null;
  photos:           string[];
  created_at:       string;
}

/** Annonce avec profil hôte jointé via `profiles:user_id ( role )` */
export interface DbAnnonceWithProfile extends DbAnnonce {
  profiles: Pick<DbProfile, 'role'> | null;
}

/** Ligne de la table `demandes` */
export interface DbDemande {
  id:         string;
  space_id:   string;
  user_id:    string | null;
  date:       string;                  // format ISO : 'YYYY-MM-DD'
  heure_debut:string | null;
  heure_fin:  string | null;
  recurrence: string | null;
  statut:     DemandeStatut;
  message:    string | null;
  created_at: string;
}

/** Ligne de la table `documents` */
export interface DbDocument {
  id:          string;
  user_id:     string;
  type:        DocumentType;
  file_path:   string;
  file_name:   string;
  file_size:   number | null;
  mime_type:   string | null;
  status:      DocumentStatus;
  status_note: string | null;
  expires_at:  string | null;          // format ISO date
  uploaded_at: string;
  updated_at:  string;
}

/** Ligne de la table `contact_messages` */
export interface DbContactMessage {
  id:           string;
  motif:        string | null;
  prenom:       string;
  nom:          string;
  email:        string;
  organisation: string | null;
  message:      string;
  traite:       boolean;
  created_at:   string;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. TYPES APPLICATIFS (données projetées / mappées pour l'UI)
// ─────────────────────────────────────────────────────────────────────────────

/** Profil projeté pour la page /annuaire */
export type AnnuaireProfile = Pick<DbProfile,
  | 'id' | 'prenom' | 'nom' | 'specialite' | 'ville'
  | 'bio' | 'disponible_remplacement' | 'rpps_verifie'
>;

/** Profil projeté pour la page /remplacements */
export type RemplacementProfile = Pick<DbProfile,
  | 'id' | 'prenom' | 'nom' | 'specialite' | 'ville'
  | 'bio' | 'telephone' | 'email' | 'rpps_verifie'
>;

/**
 * Espace normalisé côté client — output de mapSpace() dans src/lib/explorez.ts.
 * Utilisé dans buildSpaceCard(), applyFilters(), etc.
 */
export interface MappedSpace {
  id:         string;
  title:      string;
  city:       string;
  department: string;
  region:     string;
  type:       string;
  host:       string;
  tags:       string[];
  jours:      string[];
  superficie: number;
  capacite:   number;
  tarif_type: string;
  lat:        number;
  lng:        number;
  photos:     string[];
  /** Calculé dynamiquement lors du filtre par distance, en km */
  _dist?:     number | null;
}
