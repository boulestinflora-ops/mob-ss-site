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

  test('la page Explorez se charge et affiche la grille', async ({ page }) => {
    await page.goto('/explorez');
    await expect(page.locator('h1')).toBeVisible();
    // La grille doit être dans le DOM
    await expect(page.locator('#listing-grid')).toBeAttached();
  });

  test('la page Annuaire se charge', async ({ page }) => {
    await page.goto('/annuaire');
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('#ann-loading, #ann-grid')).toBeAttached();
  });

  test('la page Remplacements se charge', async ({ page }) => {
    await page.goto('/remplacements');
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('#rpl-loading, #rpl-grid')).toBeAttached();
  });

  test('la page Comment ça marche affiche le contenu', async ({ page }) => {
    await page.goto('/comment-ca-marche');
    await expect(page.locator('h1')).toBeVisible();
  });

  test('la page Contact affiche le formulaire', async ({ page }) => {
    await page.goto('/contact');
    await expect(page.locator('form')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('la page Mentions légales se charge', async ({ page }) => {
    await page.goto('/mentions-legales');
    await expect(page).toHaveTitle(/mentions/i);
  });

  test('la page 404 s\'affiche pour une URL inexistante', async ({ page }) => {
    const response = await page.goto('/cette-page-nexiste-pas');
    expect(response?.status()).toBe(404);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('la navigation depuis l\'accueil mène à Explorez', async ({ page }) => {
    await page.goto('/');
    await page.click('nav >> text=Explorez');
    await expect(page).toHaveURL(/\/explorez/);
  });

  test('le bandeau cookies apparaît à la première visite', async ({ page, context }) => {
    await context.clearCookies();
    await page.goto('