// Edge Function : admin-documents
// Lit et met à jour les documents de TOUS les utilisateurs (bypass RLS via service_role).
// Seuls les emails listés dans la variable d'env ADMIN_EMAILS sont autorisés.
//
// Variable à configurer dans Supabase → Settings → Secrets :
//   ADMIN_EMAILS=user1@example.com,user2@example.com
//
// GET  → liste tous les documents + profil associé  (paginé : ?offset=0&limit=50)
// POST → met à jour le statut d'un document
//        body : { docId: string, status: 'verifie'|'refuse'|'fourni', note?: string }

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ── Config ────────────────────────────────────────────────────────────────────

// Liste des emails admins depuis la variable d'env (plus de hardcoding)
const ADMIN_EMAILS: string[] = (Deno.env.get('ADMIN_EMAILS') ?? '')
  .split(',')
  .map(e => e.trim())
  .filter(Boolean);

const VALID_STATUSES = ['verifie', 'refuse', 'fourni'] as const;
type DocumentStatus = typeof VALID_STATUSES[number];

// Rate limiting : max 120 appels / 60 secondes par admin
const RATE_LIMIT_MAX     = 120;
const RATE_LIMIT_WINDOW  = 60;  // secondes

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}

/** Vérifie le rate limit via la table rate_limits.
 *  Retourne true si l'appel est BLOQUÉ. */
async function isRateLimited(
  client: ReturnType<typeof createClient>,
  userId: string,
  fnName: string,
): Promise<boolean> {
  const key   = `${userId}:${fnName}`;
  const since = new Date(Date.now() - RATE_LIMIT_WINDOW * 1000).toISOString();

  const { count } = await client
    .from('rate_limits')
    .select('id', { count: 'exact', head: true })
    .eq('key', key)
    .gte('called_at', since);

  if ((count ?? 0) >= RATE_LIMIT_MAX) return true;

  // Enregistrer l'appel
  await client.from('rate_limits').insert({ key });

  // Nettoyage non-bloquant
  client.from('rate_limits').delete().lt('called_at', since).then(() => {});

  return false;
}

// ── Handler ───────────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: cors });
  }

  try {
    // ── 1. Vérification JWT ─────────────────────────────────────────────────
    const token = (req.headers.get('Authorization') ?? '').replace('Bearer ', '').trim();
    if (!token) return json({ error: 'Non authentifié' }, 401);

    const anonClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
    );
    const { data: { user }, error: authErr } = await anonClient.auth.getUser(token);

    if (authErr || !user) return json({ error: 'Token invalide' }, 401);

    // ── 2. Vérification admin ───────────────────────────�