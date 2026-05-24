import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel/serverless';

// Configuration Astro pour MOB'SS
// Documentation : https://docs.astro.build/fr/guides/configuring-astro/
export default defineConfig({
  // Mode hybride : pages statiques par défaut, SSR possible page par page
  // (requis pour annonce/[id].astro qui lit depuis Supabase à chaque requête)
  output: 'hybrid',
  adapter: vercel(),

  // URL du site — utilisée pour les balises canoniques et OG
  site: 'https://mobss.fr',
});
