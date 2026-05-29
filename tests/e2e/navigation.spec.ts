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
    await page.goto('/');
    await expect(page.locator('#cookie-banner')).toBeVisible();
  });

  test('le bouton "Accepter" du bandeau cookies le ferme', async ({ page, context }) => {
    await context.clearCookies();
    await page.goto('/');
    await page.locator('#cookie-accept').click();
    await expect(page.locator('#cookie-banner')).toBeHidden();
  });
});

test.describe('Sécurité — pages protégées', () => {
  test('/admin sans token affiche une erreur ou redirige', async ({ page }) => {
    const response = await page.goto('/admin');
    // Doit soit retourner 403/404, soit afficher un écran de blocage
    const status = response?.status() ?? 0;
    const isBlocked = status === 403 || status === 404 || status === 401;
    const hasBlockMsg = await page.locator('body').innerText().then(t =>
      /token|accès refusé|non autorisé|forbidden/i.test(t)
    );
    expect(isBlocked || hasBlockMsg, 'Admin sans token doit être bloqué').toBeTruthy();
  });
});

test.describe('Accessibilité de base', () => {
  test('skip-link est présent en haut de page', async ({ page }) => {
    await page.goto('/');
    const skip = page.locator('.skip-link');
    await expect(skip).toHaveAttribute('href', '#main-content');
  });

  test('chaque page publique a un h1 unique', async ({ page }) => {
    const pages = ['/', '/explorez', '/comment-ca-marche', '/contact', '/connexion', '/inscription', '/annuaire', '/remplacements'];
    for (const url of pages) {
      await page.goto(url);
      const h1Count = await page.locator('h1').count();
      expect(h1Count, `${url} doit avoir exactement 1 h1`).toBe(1);
    }
  });

  test('toutes les images ont un attribut alt', async ({ page }) => {
    const publicPages = ['/', '/explorez', '/annuaire'];
    for (const url of publicPages) {
      await page.goto(url);
      const imgsWithoutAlt = await page.locator('img:not([alt])').count();
      expect(imgsWithoutAlt, `${url} : toutes les images doivent avoir alt`).toBe(0);
    }
  });
});
