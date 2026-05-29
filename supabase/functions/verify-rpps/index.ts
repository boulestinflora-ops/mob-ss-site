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
      return json({ ok: false, error: "Numéro RPPS invalide (11 chiffres attendus)." }, 400);
    }

    if (!ESANTE_API_KEY) {
      console.warn("ESANTE_API_KEY non définie — vérification RPPS ignorée");
      return json({ ok: true, mode: "non_verifie", warning: "Clé API ANS non configurée." });
    }

    const url =
      `${FHIR_BASE}/Practitioner` +
      `?identifier=urn:oid:1.2.250.1.71.4.2.1|${rpps.trim()}` +
      `&_format=json&_count=1`;

    const resp = await fetch(url, {
      headers: { "ESANTE-API-KEY": ESANTE_API_KEY, Accept: "application/fhir+json" },
    });

    if (!resp.ok) {
      return json({ ok: false, error: "Service RPPS temporairement indisponible. Réessayez dans quelques minutes." }, 502);
    }

    const bundle = await resp.json();
    if (!bundle.entry || bundle.entry.length === 0) {
      return json({ ok: false, error: "Numéro RPPS non trouvé dans l'annuaire national de santé." }, 404);
    }

    const p        = bundle.entry[0].resource;
    const nameObj  = p.name?.[0] ?? {};
    const nom      = nameObj.family ?? "";
    const prenom   = (nameObj.given ?? [])[0] ?? "";
    const qualifs  = p.qualification ?? [];
    const specialite =
      qualifs[0]?.code?.coding?.[0]?.display ??
      qualifs[0]?.code?.text ?? "";
    const actif = p.active !== false;

    return json({ ok: true, nom, prenom, specialite, actif });

  } catch (err) {
    console.error("verify-rpps error:", err);
    return json({ ok: false, error: "Erreur interne." }, 500);
  }
});
