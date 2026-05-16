import { defineConfig, devices } from '@playwright/test';

// Configuration Playwright — tests de bout en bout (E2E)
// Lance un vrai navigateur, navigue sur le site, vérifie que tout marche.
// Pour lancer : `npm run test:e2e`

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false, // Évite les conflits sur la base partagée
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'html',

  use: {
    baseURL: 'http://localhost:4321',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Démarre automatiquement le serveur Astro avant les tests
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
