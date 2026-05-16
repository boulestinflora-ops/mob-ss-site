// ============================================================
// Fonctions pures de validation et de formatage
// ============================================================
// Aucune dépendance externe : facilement testable.
// Utilisé partout dans le site (formulaires, headers, dashboards).

/**
 * Calcule les initiales à afficher (ex. "FB" pour Flora Boulestin).
 */
export function getInitials(prenom?: string | null, nom?: string | null): string {
  const p = (prenom || '').trim()[0] || '';
  const n = (nom || '').trim()[0] || '';
  const initiales = (p + n).toUpperCase();
  return initiales || '?';
}

/**
 * Renvoie le nom à afficher (prénom ou fallback).
 */
export function getDisplayName(user: { prenom: string | null; email: string }): string {
  if (user.prenom && user.prenom.trim()) return user.prenom.trim();
  return user.email.split('@')[0] || 'Mon compte';
}

/**
 * Vérifie qu'un mot de passe respecte la politique minimum.
 */
export function validatePassword(password: string): { ok: boolean; error?: string } {
  if (password.length < 8) {
    return { ok: false, error: 'Le mot de passe doit faire au moins 8 caractères.' };
  }
  return { ok: true };
}

/**
 * Vérifie le format basique d'un email.
 */
export function validateEmail(email: string): { ok: boolean; error?: string } {
  if (!email || !email.includes('@') || !email.includes('.')) {
    return { ok: false, error: 'Email invalide.' };
  }
  return { ok: true };
}

/**
 * Vérifie qu'un rôle utilisateur est valide.
 */
export function isValidRole(role: string): boolean {
  return ['praticien', 'collectivite', 'entreprise', 'citoyen'].includes(role);
}
