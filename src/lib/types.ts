// ============================================================
//  MOB'SS — Types TypeScript centralisés
//  Importer ici plutôt que d'éparpiller les magic strings
// ============================================================

// ── Rôles utilisateurs ─────────────────────────────────────
export type UserRole = 'praticien' | 'collectivite' | 'entreprise';

// ── Statuts documents professionnels ───────────────────────
export type DocumentStatus = 'fourni' | 'verifie' | 'refuse' | 'manquant';

// ── Statuts demandes de réservation ────────────────────────
export type DemandeStatus = 'en_attente' | 'acceptee' | 'refusee' | 'annulee';

// ── Types d'espace ──────────────────────────────────────────
export type SpaceType =
  | 'Salle communale'
  | 'Gymnase'
  | 'Salle de sport'
  | 'Cabinet médical'
  | 'Salle de réunion'
  | 'Studio'
  | 'Local entreprise'
  | 'Autre';

// ── Profil Supabase (table profiles) ───────────────────────
export interface Profile {
  id: string;
  prenom: string | null;
  nom: string | null;
  email: string | null;
  tel: string | null;
  role: UserRole;
  specialite: string | null;
  organisation: string | null;
  ville: string | null;
  bio: string | null;
  photo_url: string | null;
  email_public: boolean;
  tel_public: boolean;
  created_at: string;
  updated_at: string;
}

// ── Annonce / Espace (table spaces) ────────────────────────
export interface Space {
  id: string;
  title: string;
  description: string | null;
  type: SpaceType | null;
  address: string | null;
  city: string;
  department: string | null;
  region: string | null;
  lat: number | null;
  lng: number | null;
  surface: number | null;
  capacity: number | null;
  price_per_day: number | null;
  price_per_half_day: number | null;
  equipements: string[] | null;
  activites: string[] | null;
  photos: string[] | null;
  host_id: string;
  host: UserRole;
  published: boolean;
  created_at: string;
}

// ── Document professionnel (table documents) ────────────────
export interface Document {
  id: string;
  user_id: string;
  type: 'diplome' | 'assurance';
  file_url: string;
  file_name: string | null;
  status: DocumentStatus;
  status_note: string | null;
  expire_at: string | null;
  created_at: string;
}

// ── Demande de réservation (table demandes) ─────────────────
export interface Demande {
  id: string;
  space_id: string;
  praticien_id: string;
  host_id: string;
  status: DemandeStatus;
  message: string | null;
  date_souhaitee: string | null;
  created_at: string;
}

// ── Helper : label lisible pour un statut document ─────────
export function documentStatusLabel(status: DocumentStatus): string {
  const labels: Record<DocumentStatus, string> = {
    fourni:   'En vérification',
    verifie:  'Vérifié',
    refuse:   'Refusé',
    manquant: 'Manquant',
  };
  return labels[status] ?? status;
}

// ── Helper : label lisible pour un statut demande ──────────
export function demandeStatusLabel(status: DemandeStatus): string {
  const labels: Record<DemandeStatus, string> = {
    en_attente: 'En attente',
    acceptee:   'Acceptée',
    refusee:    'Refusée',
    annulee:    'Annulée',
  };
  return labels[status] ?? status;
}
