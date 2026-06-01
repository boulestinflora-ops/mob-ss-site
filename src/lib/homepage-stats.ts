/**
 * homepage-stats.ts
 * Charge les stats live (espaces, praticiens, communes, demandes)
 * depuis Supabase et met à jour les éléments du DOM sur la homepage.
 *
 * Stratégie Stale-While-Revalidate :
 * - Affiche immédiatement les valeurs du cache localStorage (stale)
 * - Puis revalide en arrière-plan depuis Supabase
 * - Cache TTL : 5 minutes
 */

import { supabase } from './supabase';

const CACHE_KEY = 'mobss_homepage_stats_v1';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface StatsCache {
  ts: number;
  espaces: number | null;
  praticiens: number | null;
  communes: number | null;
  demandes: number | null;
}

function fmt(n: number | null): string {
  return (n ?? 0) > 0 ? (n ?? 0).toLocaleString('fr-FR') : '—';
}

function setEl(id: string, val: number | null): void {
  const el = document.getElementById(id);
  if (el) el.textContent = (val ?? 0) > 0 ? fmt(val) : '—';
}

function applyStats(s: StatsCache): void {
  setEl('stat-espaces',    s.espaces);
  setEl('stat-praticiens', s.praticiens);
  setEl('stat-communes',   s.communes);
  setEl('metric-demandes', s.demandes);
}

function readCache(): StatsCache | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed: StatsCache = JSON.parse(raw);
    return parsed;
  } catch { return null; }
}

function writeCache(s: StatsCache): void {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(s)); } catch { /* ignore */ }
}

async function fetchFromSupabase(): Promise<StatsCache> {
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
  return { ts: Date.now(), espaces: espaces ?? null, praticiens: praticiens ?? null, communes: communes ?? null, demandes: demandes ?? null };
}

export async function loadHomepageStats(): Promise<void> {
  const cached = readCache();

  // Affichage immédiat depuis le cache (stale)
  if (cached) applyStats(cached);

  // Revalider si cache absent ou expiré
  const isStale = !cached || (Date.now() - cached.ts) > CACHE_TTL;
  if (isStale) {
    try {
      const fresh = await fetchFromSupabase();
      writeCache(fresh);
      applyStats(fresh);
    } catch (e) {
      console.debug('Homepage stats non chargées :', e);
    }
  }
}
