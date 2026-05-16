import { defineConfig } from 'vitest/config';

// Configuration Vitest — moteur de tests unitaires
// Pour lancer : `npm test` (mode watch) ou `npm run test:run` (une fois)

export default defineConfig({
  test: {
    // Environnement Node (pas besoin de DOM pour les helpers purs)
    environment: 'node',

    // Cherche tous les fichiers *.test.ts dans le projet
    include: ['src/**/*.test.ts'],

    // Affichage joli des résultats
    reporters: ['verbose'],

    // Stub pour les variables d'environnement Astro
    setupFiles: [],

    // Pas besoin de couverture pour démarrer
    coverage: {
      enabled: false,
      reporter: ['text', 'html'],
    },
  },
});
