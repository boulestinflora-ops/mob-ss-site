/**
 * homepage-stats.ts
 * Charge les stats live (espaces, praticiens, communes, demandes)
 * depuis Supabase et met à jour les éléments du DOM sur la homepage.
 *
 * Importé via <script> bundlé dans index.astro — pas de CDN dynamique,
 * pas d'unsafe-inline requis.
 */

import { supabase } from './supabase';

function fmt(n: number | null): string {
  return (n ?? 0) > 0 ? (n ?? 0).toLocaleString('fr-FR') : '—';
}

function setEl(id: string, val: number | null, fallback = '—'): void {
  const el = document.getElementById(id);
  if (el) el.textContent = (val ?? 0) > 0 ? fmt(val) : fallback;
}

export async function loadHomepageStats(): Promise<void> {
  try {
    const [
      { count: espaces },
      { count: praticiens },
      { count: communes },
      { count: demandes },
    ] = await Promise.all([
      supabase.from('annonces').select('*', { count: 'exact', head: true }).eq('status', 'publie'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'praticien'),
      supabase.from('profiles').select('ville', { count: 'exact', head: true }).eq('role', 'collectivite'),
      supabase.from('demandes').select('*', { count: 'exact', head: true }),
    ]);

    setEl('stat-espaces',    espaces);
    setEl('stat-praticiens', praticiens);
    setEl('stat-communes',   communes);
    setEl('metric-demandes', demandes);
  } catch (e) {
    // Silencieux — les "—" par défaut restent affichés
    console.debug('Homepage stats non chargées :', e);
  }
}
