// ============================================================
// Helpers d'authentification — utilisés partout dans le site
// ============================================================
// Wrap les appels Supabase. Importe les fonctions pures depuis validation.ts
// (qui elles sont testables sans dépendance Supabase).

import { supabase } from './supabase';

// On ré-exporte les fonctions pures pour ne pas casser les imports existants
export {
  getInitials,
  getDisplayName,
  validatePassword,
  validateEmail,
  isValidRole,
} from './validation';

export type Role = 'praticien' | 'collectivite' | 'entreprise' | 'citoyen';

export interface UserProfile {
  id: string;
  email: string;
  role: Role;
  prenom: string | null;
  nom: string | null;
  telephone: string | null;
}

/**
 * Récupère l'utilisateur connecté ET son profil enrichi.
 * Retourne null si personne n'est connecté.
 */
export async function getCurrentUser(): Promise<UserProfile | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role, prenom, nom, telephone')
    .eq('id', user.id)
    .single();

  if (error || !profile) {
    console.warn('Profil introuvable pour', user.id, error);
    return null;
  }

  return {
    id: user.id,
    email: user.email || '',
    role: profile.role as Role,
    prenom: profile.prenom,
    nom: profile.nom,
    telephone: profile.telephone,
  };
}

/**
 * Déconnexion + redirection.
 */
export async function signOutAndRedirect(redirectTo: string = '/'): Promise<void> {
  await supabase.auth.signOut();
  window.location.href = redirectTo;
}
