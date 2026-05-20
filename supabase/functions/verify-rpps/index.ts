/**
 * Edge Function : verify-rpps
 * ─────────────────────────────────────────────────────────────
 * Vérifie un numéro RPPS via l'API FHIR de l'ANS (Agence du
 * Numérique en Santé) et retourne les informations du praticien.
 *
 * Variables d'environnement requises (Supabase → Settings → Secrets) :
 *   ESANTE_API_KEY  — clé obtenue sur https://portal.api.esante.gouv.fr
 *                    (créer un compte Gravitee → nouvelle app → souscrire à
 *                     "API Annuaire Santé en libre accès" → copier ESANTE-API-KEY)
 *
 * Déploiement :
 *   supabase functions deploy verify-rpps
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const ESANTE_API_KEY = Deno.env.get("ESANTE_API_KEY") ?? "";
// V2 de l'API Annuaire Santé ANS (Gravitee — portal.api.esante.gouv.fr)
const FHIR_BASE = "https://gateway.api.esante.gouv.fr/fhir/v2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Preflight CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS });
  }

  try {
    const { rpps } = await req.json() as { rpps: string };

    // Validation format : 11 chiffres
    if (!rpps || !/^\d{11}$/.test(rpps.trim())) {
      return json({ ok: false, error: "Numéro RPPS invalide (11 chiffres attendus)." }, 400);
    }

    if (!ESANTE_API_KEY) {
      // Mode dégradé : clé non configurée — on accepte sans vérifier
      console.warn("ESANTE_API_KEY non définie — vérification RPPS ignorée");
      return json({ ok: true, mode: "non_verifie", warning: "Clé API ANS non configurée." });
    }

    const url =
      `${FHIR_BASE}/Practitioner` +
      `?identifier=urn:oid:1.2.250.1.71.4.2.1|${rpps.trim()}` +
      `&_format=json&_count=1`;

    const resp = await fetch(url, {
      headers: {
        "ESANTE-API-KEY": ESANTE_API_KEY,
        Accept: "application/fhir+json",
      },
    });

    if (!resp.ok) {
      return json({ ok: false, error: "Service RPPS temporairement indisponible. Réessayez dans quelques minutes." }, 502);
    }

    const bundle = await resp.json();

    if (!bundle.entry || bundle.entry.length === 0) {
      return json({ ok: false, error: "Numéro RPPS non trouvé dans l'annuaire national de santé." }, 404);
    }

    const p = bundle.entry[0].resource;
    const nameObj = p.name?.[0] ?? {};
    const nom     = nameObj.family ?? "";
    const prenom  = (nameObj.given ?? [])[0] ?? "";

    // Qualification → spécialité
    const qualifs  = p.qualification ?? [];
    const specialite =
      qualifs[0]?.code?.coding?.[0]?.display ??
      qualifs[0]?.code?.text ??
      "";

    // Statut actif
    const actif = p.active !== false;

    return json({ ok: true, nom, prenom, specialite, actif });

  } catch (err) {
    console.error("verify-rpps error:", err);
    return json({ ok: false, error: "Erreur interne." }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });
}
