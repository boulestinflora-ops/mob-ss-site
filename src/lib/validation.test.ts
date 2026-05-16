// ============================================================
// Tests unitaires — Fonctions pures de validation et formatage
// ============================================================
// Vérifie les helpers qui n'ont aucune dépendance externe (Supabase, DOM…)
// Pour lancer : `npm test`

import { describe, it, expect } from 'vitest';
import {
  getInitials,
  getDisplayName,
  validatePassword,
  validateEmail,
  isValidRole,
} from './validation';

describe('getInitials', () => {
  it('retourne les initiales en majuscules pour un prénom + nom complets', () => {
    expect(getInitials('Flora', 'Boulestin')).toBe('FB');
  });

  it('retourne juste l\'initiale du prénom si pas de nom', () => {
    expect(getInitials('Flora', '')).toBe('F');
    expect(getInitials('Flora', null)).toBe('F');
  });

  it('retourne "?" si tout est vide', () => {
    expect(getInitials('', '')).toBe('?');
    expect(getInitials(null, null)).toBe('?');
    expect(getInitials(undefined, undefined)).toBe('?');
  });

  it('ignore les espaces autour des prénoms', () => {
    expect(getInitials('  Flora  ', '  Boulestin  ')).toBe('FB');
  });

  it('met les minuscules en majuscules', () => {
    expect(getInitials('flora', 'boulestin')).toBe('FB');
  });
});

describe('getDisplayName', () => {
  it('retourne le prénom si présent', () => {
    expect(getDisplayName({ prenom: 'Flora', email: 'flora@example.com' })).toBe('Flora');
  });

  it('retourne la partie avant @ si pas de prénom', () => {
    expect(getDisplayName({ prenom: null, email: 'flora.boulestin@example.com' })).toBe('flora.boulestin');
  });

  it('retourne "Mon compte" si tout est vide', () => {
    expect(getDisplayName({ prenom: null, email: '' })).toBe('Mon compte');
  });

  it('ignore les prénoms uniquement composés d\'espaces', () => {
    expect(getDisplayName({ prenom: '   ', email: 'test@example.com' })).toBe('test');
  });
});

describe('validatePassword', () => {
  it('accepte un mot de passe de 8 caractères ou plus', () => {
    expect(validatePassword('motdepasse').ok).toBe(true);
    expect(validatePassword('12345678').ok).toBe(true);
  });

  it('refuse un mot de passe trop court', () => {
    const result = validatePassword('court');
    expect(result.ok).toBe(false);
    expect(result.error).toContain('8 caractères');
  });

  it('refuse un mot de passe vide', () => {
    expect(validatePassword('').ok).toBe(false);
  });
});

describe('validateEmail', () => {
  it('accepte un email valide', () => {
    expect(validateEmail('flora@mobss.fr').ok).toBe(true);
    expect(validateEmail('test+filter@example.co.uk').ok).toBe(true);
  });

  it('refuse un email sans @', () => {
    expect(validateEmail('floramobss.fr').ok).toBe(false);
  });

  it('refuse un email sans point', () => {
    expect(validateEmail('flora@mobss').ok).toBe(false);
  });

  it('refuse un email vide', () => {
    expect(validateEmail('').ok).toBe(false);
  });
});

describe('isValidRole', () => {
  it('accepte les 4 rôles valides', () => {
    expect(isValidRole('praticien')).toBe(true);
    expect(isValidRole('collectivite')).toBe(true);
    expect(isValidRole('entreprise')).toBe(true);
    expect(isValidRole('citoyen')).toBe(true);
  });

  it('refuse les rôles inventés', () => {
    expect(isValidRole('admin')).toBe(false);
    expect(isValidRole('PRATICIEN')).toBe(false);
    expect(isValidRole('')).toBe(false);
  });
});
