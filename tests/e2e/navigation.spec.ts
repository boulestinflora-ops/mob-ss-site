// ============================================================
// Tests E2E — Navigation et chargement des pages publiques
// ============================================================
// Vérifie que toutes les pages publiques se chargent sans erreur,
// et que la navigation entre elles fonctionne.

import { test, expect } from '@playwright/test';

test.describe('Pages publiques', () => {
  test('la page d\'accueil se charge et affiche le héros', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/MOB'SS/);
    await expect(page.locator('h1')).toContainText('Rendre le sport et la santé');
  });

  test('la page Explorez liste les espaces', async ({ page }) => {
    await page.goto('/explorez');
    await expect(page.locator('h1')).toContainText('Des espaces près de chez vous');
    // Au moins 1 carte d'espace doit être présente
    const cards = page.locator('.space-card');
    await expect(cards.first()).toBeVisible();
  });

  test('la page Comment ça marche affiche la FAQ', async ({ page }) => {
    await page.goto('/comment-ca-marche');
    await expect(page.locator('h1')).toContainText('Comment ça marche');
    // La section FAQ doit exister
    await expect(page.locator('#faq')).toBeVisible();
  });

  test('la page Contact affiche le formulaire', async ({ page }) => {
    await page.goto('/contact');
    await expect(page.locator('form')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('la navigation depuis l\'accueil mène à Explorez', async ({ page }) => {
    await page.goto('/');
    await page.click('nav >> text=Explorez');
    await expect(page).toHaveURL(/\/explorez/);
  });

  test('le bandeau cookies apparaît à la première visite', async ({ page, context }) => {
    await context.clearCookies();
    await page.goto('/');
    await expect(page.locator('#cookie-banner')).toBeVisible();
  });
});

test.describe('Accessibilité de base', () => {
  test('skip-link est présent en haut de page', async ({ page }) => {
    await page.goto('/');
    const skip = page.locator('.skip-link');
    await expect(skip).toHaveAttribute('href', '#main-content');
  });

  test('chaque page a un h1 unique', async ({ page }) => {
    const pages = ['/', '/explorez', '/comment-ca-marche', '/contact', '/connexion', '/inscription'];
    for (const url of pages) {
      await page.goto(url);
      const h1Count = await page.locator('h1').count();
      expect(h1Count, `${url} doit avoir exactement 1 h1`).toBe(1);
    }
  });
});
