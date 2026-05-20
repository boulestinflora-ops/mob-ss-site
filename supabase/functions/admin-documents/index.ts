// Edge Function : admin-documents
// Lit et met à jour les documents de TOUS les utilisateurs (bypass RLS via service_role).
// Seuls les emails de la liste ADMIN_EMAILS sont autorisés.
//
// GET  → liste tous les documents + profil associé
// POST → met à jour le statut d'un document
//        body : { docId: string, status: 'verifie'|'refuse'|'fourni', note?: string }

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ADMIN_EMAILS = ['boulestinflora@gmail.com'];

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}

serve(async (req) => {
  // Préflight CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: cors });
  }

  try {
    // ── Vérification JWT ────────────────────────────────────────────────────────
    const authHeader = req.headers.get('Authorization') ?? '';
    const token = authHeader.replace('Bearer ', '').trim();
    if (!token) return json({ error: 'Non authentifié' }, 401);

    // On vérifie l'identité avec le client anon (clé publique)
    const anonClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
    );
    const { data: { user }, error: authErr } = await anonClient.auth.getUser(token);

    if (authErr || !user || !ADMIN_EMAILS.includes(user.email ?? '')) {
      return json({ error: 'Accès refusé' }, 403);
    }

    // ── Client admin — bypass RLS ────────────────────────────────────────────────
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SERVICE_ROLE_KEY')!,
    );

    // ── GET : liste tous les documents ──────────────────────────────────────────
    if (req.method === 'GET') {
      const { data, error } = await admin
        .from('documents')
        .select(`
          id, type, file_name, file_path, mime_type,
          status, status_note, expires_at,
          ai_analyse, ai_analyse_at, uploaded_at,
          user_id,
          profiles:user_id ( prenom, nom, specialite, rpps_numero, rpps_verifie )
        `)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      return json({ data });
    }

    // ── POST : met à jour le statut d'un document ───────────────────────────────
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
