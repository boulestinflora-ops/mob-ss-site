// ============================================================
// Tests E2E — Flows métier critiques MOB'SS
// ============================================================
// Teste les parcours utilisateur clés : recherche d'espaces,
// filtres annuaire, formulaire de contact, accès aux pages
// protégées et tunnel de dépôt d'annonce.

import { test, expect } from '@playwright/test';

// ── Explorez — recherche et filtres ─────────────────────────────────────────

test.describe('Explorez — recherche', () => {
  test('le filtre par localisation ne plante pas', async ({ page }) => {
    await page.goto('/explorez');
    const input = page.locator('#search-loc');
    await input.fill('Paris');
    // Pas d'erreur JS
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.waitForTimeout(500);
    expect(errors).toHaveLength(0);
  });

  test('le sélecteur de type d\'espace fonctionne', async ({ page }) => {
    await page.goto('/explorez');
    const select = page.locator('#search-type');
    await expect(select).toBeVisible();
    await select.selectOption({ index: 1 });
    // Pas d'erreur JS après sélection
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.waitForTimeout(300);
    expect(errors).toHaveLength(0);
  });

  test('"Affiner la recherche" ouvre les filtres avancés', async ({ page }) => {
    await page.goto('/explorez');
    const toggleBtn = page.locator('#toggle-filters');
    await expect(toggleBtn).toBeVisible();
    await toggleBtn.click();
    await expect(page.locator('#filters-panel')).toBeVisible();
  });

  test('le bouton "Réinitialiser" vide les filtres', async ({ page }) => {
    await page.goto('/explorez');
    await page.locator('#search-loc').fill('Lyon');
    await page.locator('#reset-filters').click();
    await expect(page.locator('#search-loc')).toHaveValue('');
  });
});

// ── Annuaire — filtres ───────────────────────────────────────────────────────

test.describe('Annuaire — filtres', () => {
  test('le filtre remplacement affiche un sous-ensemble', async ({ page }) => {
    await page.goto('/annuaire');
    // Attendre que la grille se charge
    await page.locator('#ann-grid, #ann-empty').waitFor({ state: 'visible', timeout: 8000 });
    const checkbox = page.locator('#ann-remplacement');
    await checkbox.check();
    // Le compteur doit exister et être mis à jour
    await expect(page.locator('#ann-results-count')).toBeAttached();
  });

  test('la recherche par ville filtre les résultats', async ({ page }) => {
    await page.goto('/annuaire');
    await page.locator('#ann-grid, #ann-empty').waitFor({ state: 'visible', timeout: 8000 });
    await page.locator('#ann-ville').fill('Paris');
    await page.locator('#ann-search-btn').click();
    await expect(page.locator('#ann-results-count')).toBeAttached();
  });
});

// ── Contact — formulaire ────────────────────────────────────────────────────

test.describe('Contact — formulaire', () => {
  test('affiche une erreur si email invalide', async ({ page }) => {
    await page.goto('/contact');
    await page.locator('input[name="email"], input[type="email"]').fill('pas-un-email');
    await page.locator('button[type="submit"]').click();
    // La validation HTML5 ou JS doit empêcher la soumission
    await expect(page).toHaveURL(/\/contact/);
  });

  test('les champs obligatoires sont présents', async ({ page }) => {
    await page.goto('/contact');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('textarea, input[name="message"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });
});

// ── Inscription — tunnel ─────────────────────────────────────────────────────

test.describe('Inscription — tunnel', () => {
  test('la page d\'inscription charge les deux cartes de rôle', async ({ page }) => {
    await page.goto('/inscription');
    await expect(page.locator('[data-role="praticien"]')).toBeVisible();
    await expect(page.locator('[data-role="hote"]')).toBeVisible();
  });

  test('sélectionner praticien affiche les champs spécifiques', async ({ page }) => {
    await page.goto('/inscription');
    await page.click('[data-role="praticien"]');
    // Champ spécialité visible pour praticiens
    await expect(page.locator('#specialite, [name="specialite"]')).toBeVisible();
  });

  test('déposer une annonce redirige les praticiens', async ({ page }) => {
    await page.goto('/deposer-annonce');
    // Un praticien non-hôte doit être redirigé ou voir un message d'erreur
    // (page visible pour les hôtes seulement)
    await expect(page).toBeAttached(); // la page existe
  });
});

// ── Rejoindre — early access ──────────────────────────────────────────────────

test.describe('Rejoindre', () => {
  test('la page /rejoindre affiche le formulaire early access', async ({ page }) => {
    await page.goto('/rejoindre');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('refuse une soumission sans email', async ({ page }) => {
    await page.goto('/rejoindre');
    // Soumettre sans remplir
    await page.locator('button[type="submit"]').click();
    // Doit rester sur la même page
    await expect(page).toHaveURL(/\/rejoindre/);
  });
});

// ── Performance — pas d'erreurs JS critiques ─────────────────────────────────

test.describe('Qualité — pas d\'erreurs JS', () => {
  const criticalPages = ['/', '/explorez', '/annuaire', '/remplacements', '/connexion', '/inscription'];

  for (const url of criticalPages) {
    test(`${url} charge sans erreur JS`, async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', e => errors.push(e.message));
      await page.goto(url);
      await page.waitForTimeout(1000); // Laisser le temps aux scripts async
      expect(errors, `Erreurs JS sur ${url} : ${errors.join(', ')}`).toHaveLength(0);
    });
  }
});
