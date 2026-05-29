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

    // ── 2. Vérification admin ───────────────────────────────────────────────
    if (!ADMIN_EMAILS.includes(user.email ?? '')) {
      return json({ error: 'Accès refusé' }, 403);
    }

    // ── 3. Client admin (bypass RLS) ────────────────────────────────────────
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SERVICE_ROLE_KEY')!,
    );

    // ── 4. Rate limiting ────────────────────────────────────────────────────
    if (await isRateLimited(admin, user.id, 'admin-documents')) {
      return json({ error: 'Trop de requêtes. Réessayez dans une minute.' }, 429);
    }

    // ── 5. GET : liste paginée des documents ────────────────────────────────
    if (req.method === 'GET') {
      const url    = new URL(req.url);
      const offset = Math.max(0, parseInt(url.searchParams.get('offset') ?? '0', 10));
      const limit  = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') ?? '50', 10)));

      const { data, error, count } = await admin
        .from('documents')
        .select(`
          id, type, file_name, file_path, mime_type,
          status, status_note, expires_at,
          ai_analyse, ai_analyse_at, uploaded_at,
          user_id,
          profiles:user_id ( prenom, nom, specialite, rpps_numero, rpps_verifie )
        `, { count: 'exact' })
        .order('uploaded_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return json({ data, total: count, offset, limit });
    }

    // ── 6. POST : mise à jour du statut ─────────────────────────────────────
    if (req.method === 'POST') {
      const body = await req.json();
      const { docId, status, note } = body as {
        docId: string;
        status: string;
        note?: string;
      };

      if (!docId || !status) {
        return json({ error: 'docId et status sont requis' }, 400);
      }

      // Validation stricte de la valeur status
      if (!VALID_STATUSES.includes(status as DocumentStatus)) {
        return json({
          error: `Status invalide. Valeurs autorisées : ${VALID_STATUSES.join(', ')}`,
        }, 400);
      }

      const { error } = await admin
        .from('documents')
        .update({
          status,
          status_note: note || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', docId);

      if (error) throw error;
      return json({ ok: true });
    }

    return json({ error: 'Méthode non autorisée' }, 405);

  } catch (e: any) {
    console.error('admin-documents error:', e);
    return json({ error: e?.message ?? 'Erreur interne' }, 500);
  }
});
