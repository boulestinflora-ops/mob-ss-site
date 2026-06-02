// ============================================================
// Tests de régression — bugs détectés lors de l'audit juin 2026
// ============================================================
// Ces tests couvrent les bugs spécifiques trouvés et corrigés
// pendant l'audit. Leur rôle : s'assurer qu'ils ne reviennent pas.

import { test, expect } from '@playwright/test';

// ── CSS & Variables ──────────────────────────────────────────────────────────

test.describe('CSS — variables et rendu', () => {
  test('--color-primary est définie (hero rouge visible)', async ({ page }) => {
    await page.goto('/');
    const colorPrimary = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim()
    );
    expect(colorPrimary, '--color-primary doit être définie (pas vide)').not.toBe('');
    expect(colorPrimary).toContain('#');
  });

  test('le hero a un fond coloré (pas blanc)', async ({ page }) => {
    await page.goto('/');
    const heroBg = await page.evaluate(() => {
      const hero = document.querySelector('.hero');
      return hero ? getComputedStyle(hero).backgroundColor : '';
    });
    expect(heroBg, 'Le hero ne doit pas avoir un fond blanc/transparent').not.toMatch(/rgba\(0.*0.*0.*0\)|transparent/);
    expect(heroBg).not.toBe('rgb(255, 255, 255)');
  });

  test('les fonts custom sont chargées (pas de fallback système)', async ({ page }) => {
    await page.goto('/');
    const fontFamily = await page.evaluate(() =>
      getComputedStyle(document.body).fontFamily
    );
    expect(fontFamily.toLowerCase()).toMatch(/dm sans|space grotesk/i);
  });
});

// ── SVG ──────────────────────────────────────────────────────────────────────

test.describe('SVG — attributs valides', () => {
  test('aucun SVG n\'a width="auto" (attribut invalide)', async ({ page }) => {
    await page.goto('/');
    const invalidSvgs = await page.locator('svg[width="auto"]').count();
    expect(invalidSvgs, 'Aucun SVG ne doit avoir width="auto"').toBe(0);
  });
});

// ── Supabase — requêtes ───────────────────────────────────────────────────────

test.describe('Supabase — requêtes correctes', () => {
  test('/explorez ne génère pas d\'erreur 404 Supabase', async ({ page }) => {
    const supabaseErrors: string[] = [];
    page.on('response', res => {
      if (res.url().includes('supabase') && res.status() === 404) {
        supabaseErrors.push(res.url());
      }
    });
    await page.goto('/explorez');
    await page.waitForTimeout(2000);
    expect(supabaseErrors, `404 Supabase sur /explorez : ${supabaseErrors.join(', ')}`).toHaveLength(0);
  });

  test('/annuaire ne génère pas d\'erreur 401/404 Supabase', async ({ page }) => {
    const supabaseErrors: string[] = [];
    page.on('response', res => {
      if (res.url().includes('supabase') && [401, 404].includes(res.status())) {
        supabaseErrors.push(`${res.status()} ${res.url()}`);
      }
    });
    await page.goto('/annuaire');
    await page.waitForTimeout(2000);
    expect(supabaseErrors, `Erreurs Supabase sur /annuaire : ${supabaseErrors.join(', ')}`).toHaveLength(0);
  });

  test('la homepage charge les stats sans erreur 404', async ({ page }) => {
    const errors404: string[] = [];
    page.on('response', res => {
      if (res.url().includes('supabase') && res.status() === 404) {
        errors404.push(res.url());
      }
    });
    await page.goto('/');
    await page.waitForTimeout(2000);
    expect(errors404).toHaveLength(0);
  });
});

// ── CSP — scripts et service worker ──────────────────────────────────────────

test.describe('CSP — aucun script bloqué', () => {
  test('aucun script essentiel n\'est bloqué par la CSP', async ({ page }) => {
    const cspBlocks: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error' && msg.text().includes('Content Security Policy')) {
        // On ignore PostHog (bloqueur de pub externe)
        if (!msg.text().includes('posthog')) {
          cspBlocks.push(msg.text().slice(0, 100));
        }
      }
    });
    await page.goto('/');
    await page.waitForTimeout(1000);
    expect(cspBlocks, `Scripts bloqués par CSP : ${cspBlocks.join(' | ')}`).toHaveLength(0);
  });

  test('le service worker s\'enregistre sans erreur CSP', async ({ page }) => {
    const swErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error' && msg.text().includes('worker')) {
        swErrors.push(msg.text().slice(0, 100));
      }
    });
    await page.goto('/');
    await page.waitForTimeout(1000);
    expect(swErrors, `SW bloqué : ${swErrors.join(' | ')}`).toHaveLength(0);
  });
});

// ── Nouvelles pages (audit) ───────────────────────────────────────────────────

test.describe('Nouvelles pages ajoutées lors de l\'audit', () => {
  test('/pourquoi-gratuit est accessible et affiche le modèle éco', async ({ page }) => {
    await page.goto('/pourquoi-gratuit');
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('body')).toContainText(/gratuit|modèle/i);
  });

  test('/hotes affiche le formulaire d\'intérêt institutionnel', async ({ page }) => {
    await page.goto('/hotes');
    await expect(page.locator('#manifester-interet')).toBeVisible();
    await expect(page.locator('input[name="organisation"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
  });

  test('le dropdown "À propos" contient "Modèle économique"', async ({ page }) => {
    await page.goto('/');
    await page.locator('button:has-text("À propos")').click();
    await expect(page.locator('text=Modèle économique')).toBeVisible();
  });

  test('la homepage affiche les labels institutionnels', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).toContainText(/CLS|ARS|ANCT/);
  });
});
