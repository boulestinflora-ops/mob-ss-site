// ============================================================
// Client Supabase — Le pont entre le site MOB'SS et la base de données
// ============================================================

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Variables Supabase manquantes. Vérifie le fichier .env à la racine du projet.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  // IMPORTANT : on désactive la connexion realtime (websocket persistante)
  // dont on n'a pas besoin pour l'instant et qui faisait paraître la page
  // « en chargement » indéfiniment dans le navigateur.
  realtime: {
    params: {
      eventsPerSecond: 1,
    },
  },
  global: {
    // Limite le timeout par défaut pour éviter les requêtes qui traînent
    fetch: (url, options) => fetch(url, { ...options }),
  },
});
