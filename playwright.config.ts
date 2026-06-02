import { defineConfig, devices } from '@playwright/test';

// Configuration Playwright — tests de bout en bout (E2E)
// Lance un vrai navigateur, navigue sur le site, vérifie que tout marche.
//
// Modes :
//   npm run test:e2e              → contre localhost (dev server)
//   BASE_URL=https://... npx playwright test → contre Vercel ou staging

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:4321';
const isRemote = BASE_URL.startsWith('https://');

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [['html'], ['list']],

  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile',
      use: { ...devices['iPhone 14'] },
      testMatch: '**/navigation.spec.ts', // mobile : pages publiques uniquement
    },
  ],

  // Serveur local uniquement si on ne teste pas contre une URL distante
  webServer: isRemote ? undefined : {
    command: 'npm run dev',
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
