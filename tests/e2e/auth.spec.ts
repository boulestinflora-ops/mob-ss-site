// ============================================================
// Tests E2E — Parcours d'authentification
// ============================================================
// Vérifie inscription, connexion, déconnexion sur de vrais navigateurs.
//
// ATTENTION : ces tests créent de vrais comptes Supabase. À nettoyer
// régulièrement dans le tableau de bord Supabase, ou utiliser un projet
// Supabase dédié aux tests.

import { test, expect } from '@playwright/test';

// Génère un email unique pour éviter les conflits entre runs
function makeTestEmail(): string {
  const stamp = Date.now();
  return `test-${stamp}@mobss-test.fr`;
}

test.describe('Inscription', () => {
  test('refuse une inscription sans rôle sélectionné', async ({ page }) => {
    await page.goto('/inscription');

    await page.fill('#prenom', 'Test');
    await page.fill('#nom', 'User');
    await page.fill('#email', makeTestEmail());
    await page.fill('#tel', '0612345678');
    await page.fill('#mdp', 'motdepasse123');
    await page.fill('#mdp2', 'motdepasse123');
    // Coche la case CGU
    await page.locator('input[type="checkbox"]').first().check();

    await page.click('button[type="submit"]');

    // Doit afficher l'erreur "rôle non sélectionné"
    await expect(page.locator('#signup-message')).toContainText(/sélectionner votre profil/i);
  });

  test('refuse si les mots de passe ne correspondent pas', async ({ page }) => {
    await page.goto('/inscription');

    // Sélectionne le rôle praticien
    await page.click('label[data-role="praticien"]');

    await page.fill('#prenom', 'Test');
    await page.fill('#nom', 'User');
    await page.fill('#email', makeTestEmail());
    await page.fill('#tel', '0612345678');
    await page.fill('#mdp', 'motdepasse1');
    await page.fill('#mdp2', 'motdepasse2');
    await page.locator('input[type="checkbox"]').first().check();

    await page.click('button[type="submit"]');

    await expect(page.locator('#signup-message')).toContainText(/correspondent pas/i);
  });

  test('refuse un mot de passe trop court', async ({ page }) => {
    await page.goto('/inscription');

    await page.click('label[data-role="praticien"]');
    await page.fill('#prenom', 'Test');
    await page.fill('#nom', 'User');
    await page.fill('#email', makeTestEmail());
    await page.fill('#tel', '0612345678');
    await page.fill('#mdp', 'court');
    await page.fill('#mdp2', 'court');
    await page.locator('input[type="checkbox"]').first().check();

    await page.click('button[type="submit"]');

    await expect(page.locator('#signup-message')).toContainText(/8 caractères/i);
  });
});

test.describe('Connexion', () => {
  test('affiche une erreur si l\'email est inconnu', async ({ page }) => {
    await page.goto('/connexion');

    await page.fill('#email', 'inconnu-' + Date.now() + '@example.com');
    await page.fill('#mdp', 'motdepasse123');
    await page.click('button[type="submit"]');

    await expect(page.locator('#login-message')).toContainText(/incorrect/i);
  });

  test('affiche une erreur si email ou mot de passe vide', async ({ page }) => {
    await page.goto('/connexion');

    // Désactive la validation HTML5 native pour tester notre validation JS
    await page.evaluate(() => {
      document.querySelectorAll('input').forEach((el) => el.removeAttribute('required'));
    });

    await page.click('button[type="submit"]');

    await expect(page.locator('#login-message')).toContainText(/obligatoires/i);
  });
});

test.describe('Dashboard', () => {
  test('redirige vers la connexion si pas authentifié', async ({ page }) => {
    await page.goto('/dashboard');

    // L'écran "non connecté" doit s'afficher
    await expect(page.locator('#dash-anonymous')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('#dash-anonymous')).toContainText(/Connectez-vous/i);
  });
});
