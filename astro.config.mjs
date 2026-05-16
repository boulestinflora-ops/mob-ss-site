import { defineConfig } from 'astro/config';

// Configuration Astro pour MOB'SS
// Documentation : https://docs.astro.build/fr/guides/configuring-astro/
export default defineConfig({
  // URL du site — utilisée pour les balises canonical et Open Graph
  // Remplacez par votre URL Vercel après déploiement, puis par votre domaine final
  site: 'https://project-ysntr.vercel.app',

  // Le dossier où sont les pages publiques (favicon, images, etc.)
  publicDir: 'public',
});
