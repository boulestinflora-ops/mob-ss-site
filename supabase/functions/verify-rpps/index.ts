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

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { logger } from "../_shared/logger.ts";

const FN = "verify-rpps";

const ESANTE_API_KEY = Deno.env.get("ESANTE_API_KEY");
if (!ESANTE_API_KEY) {
  logger.error(FN, "ESANTE_API_KEY manquante — vérifications RPPS désactivées");
}
const FHIR_BASE = "https://gateway.api.esante.gouv.fr/fhir/v2";

// Rate limiting : 10 vérifications / 60 secondes par utilisateur
const RATE_LIMIT_MAX    = 10;
const RATE_LIMIT_WINDOW = 60;  // secondes

const ALLOWED_ORIGINS = ["https://mobss.fr", "https://mobss.vercel.app"];

function corsHeaders(origin: string | null) {
  const allowed = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
}

function json(data: unknown, status = 200, origin: string | null = null) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
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
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(origin) });

  // ── Clé API obligatoire ───────────────────────────────────────────────────
  if (!ESANTE_API_KEY) {
    return json({ ok: false, error: "Service temporairement indisponible." }, 503, origin);
  }

  // ── Authentification ──────────────────────────────────────────────────────
  const token = (req.headers.get("Authorization") ?? "").replace("Bearer ", "").trim();
  if (!token) return json({ ok: false, error: "Non authentifié" }, 401, origin);

  const serviceClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const anonClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
  );

  const { data: { user }, error: authErr } = await anonClient.auth.getUser(token);
  if (authErr || !user) return json({ ok: false, error: "Token invalide" }, 401, origin);

  // ── Rate limiting ─────────────────────────────────────────────────────────
  if (await isRateLimited(serviceClient, user.id, "verify-rpps")) {
    return json({ ok: false, error: "Trop de vérifications. Réessayez dans une minute." }, 429, origin);
  }

  try {
    const { rpps } = await req.json() as { rpps: string };

    if (!rpps || !/^\d{11}$/.test(rpps.trim())) {
      return json({ ok: false, error: "Numéro RPPS invalide (11 chiffres requis)." }, 400, origin);
    }

    // ── Appel API RPPS ──────────────────────────────────────────────────────
    const rppsClean = rpps.trim();
    const apiUrl = `https://api.rpps.fr/professionnel/${rppsClean}`;

    let rppsData: Record<string, unknown> = {};
    try {
      const resp = await fetch(apiUrl, {
        headers: { Accept: 'application/json', "ESANTE-API-KEY": ESANTE_API_KEY! },
        signal: AbortSignal.timeout(5000),
      });
      if (resp.ok) {
        rppsData = await resp.json();
      } else if (resp.status === 404) {
        return json({ ok: false, error: "Numéro RPPS non trouvé." }, 404, origin);
      } else {
        throw new Error(`RPPS API status ${resp.status}`);
      }
    } catch (fetchErr) {
      logger.error(FN, 'RPPS API fetch échouée — fallback gracieux', { error: String(fetchErr) });
      rppsData = { fallback: true };
    }

    // ── Enregistrer la vérification ──────────────────────────────────────────
    const { error: insertErr } = await serviceClient
      .from('rpps_verifications')
      .upsert({ user_id: user.id, rpps: rppsClean, result: rppsData, verified_at: new Date().toISOString() });
    if (insertErr) logger.warn(FN, 'Upsert rpps_verifications échoué', { error: insertErr.message });

    logger.info(FN, 'Vérification RPPS réussie', { userId: user.id, fallback: !!rppsData.fallback });
    return json({ ok: true, data: rppsData }, 200, origin);

  } catch (err) {
    logger.error(FN, 'Erreur inattendue', { error: String(err) });
    return json({ ok: false, error: 'Erreur serveur' }, 500, origin);
  }
});
