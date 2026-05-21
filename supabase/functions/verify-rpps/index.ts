/**
 * Edge Function : verify-rpps
 * ─────────────────────────────────────────────────────────────
 * Vérifie un numéro RPPS via l'API FHIR de l'ANS (Agence du
 * Numérique en Santé) et retourne les informations du praticien.
 *
 * Variables d'environnement requises (Supabase → Settings → Secrets) :
 *   ESANTE_API_KEY  — clé obtenue sur https://portal.api.esante.gouv.fr
 *
 * Rate limit : 10 appels / 60 s par utilisateur authentifié.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ESANTE_API_KEY = Deno.env.get("ESANTE_API_KEY") ?? "";
const FHIR_BASE      = "https://gateway.api.esante.gouv.fr/fhir/v2";

// Rate limiting : 10 vérifications / 60 secondes par utilisateur
const RATE_LIMIT_MAX    = 10;
const RATE_LIMIT_WINDOW = 60;  // secondes

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });
}

async function isRateLimited(
  client: ReturnType<typeof createClient>,
  userId: string,
  fnName: string,
): Promise<boolean> {
  const key   = `${userId}:${fnName}`;
  const since = new Date(Date.now() - RATE_LIMIT_WINDOW * 1000).toISOString();

  const { count } = await client
    .from("rate_limits")
    .select("id", { count: "exact", head: true })
    .eq("key", key)
    .gte("called_at", since);

  if ((count ?? 0) >= RATE_LIMIT_MAX) return true;

  await client.from("rate_limits").insert({ key });
  client.from("rate_limits").delete().lt("called_at", since).then(() => {});

  return false;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  // ── Authentification ──────────────────────────────────────────────────────
  const token = (req.headers.get("Authorization") ?? "").replace("Bearer ", "").trim();
  if (!token) return json({ ok: false, error: "Non authentifié" }, 401);

  const serviceClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const anonClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
  );

  const { data: { user }, error: authErr } = await anonClient.auth.getUser(token);
  if (authErr || !user) return json({ ok: false, error: "Token invalide" }, 401);

  // ── Rate limiting ─────────────────────────────────────────────────────────
  if (await isRateLimited(serviceClient, user.id, "verify-rpps")) {
    return json({ ok: false, error: "Trop de vérifications. Réessayez dans une minute." }, 429);
  }

  try {
    const { rpps } = await req.json() as { rpps: string };

    if (!rpps || !/^\d{11}$/.test(rpps.trim())) {
      return json({ ok: false, error: "Num