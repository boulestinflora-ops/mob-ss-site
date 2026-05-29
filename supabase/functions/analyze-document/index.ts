/**
 * Edge Function : analyze-document
 * ─────────────────────────────────────────────────────────────
 * Analyse un document professionnel (diplôme ou assurance RC Pro)
 * via Claude et met à jour la table documents avec le résultat.
 *
 * Variables d'environnement requises (Supabase → Settings → Secrets) :
 *   ANTHROPIC_API_KEY         — clé API Anthropic
 *   SUPABASE_URL              — URL du projet (auto-injectée par Supabase)
 *   SUPABASE_SERVICE_ROLE_KEY — clé service role (auto-injectée)
 *
 * Payload attendu :
 *   { document_id: string, file_path: string, doc_type: "diplome"|"assurance", user_id: string }
 *
 * Rate limit : 5 analyses / 60 s par utilisateur (chaque analyse coûte des tokens Anthropic).
 *
 * Déploiement :
 *   supabase functions deploy analyze-document
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ANTHROPIC_KEY   = Deno.env.get("ANTHROPIC_API_KEY") ?? "";
const SUPABASE_URL    = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY     = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

// Rate limiting : 5 analyses / 60 secondes par utilisateur
const RATE_LIMIT_MAX    = 5;
const RATE_LIMIT_WINDOW = 60;  // secondes

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

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Prompts d'analyse selon le type de document
const PROMPTS: Record<string, string> = {
  assurance: `Tu es expert en documents juridiques français. Analyse cette attestation d'assurance Responsabilité Civile Professionnelle (RC Pro).
Réponds UNIQUEMENT avec un objet JSON valide (pas de texte autour) :
{
  "est_assurance_rcpro": true|false,
  "assure_nom": "nom de l'assuré ou null",
  "assureur": "nom de la compagnie ou null",
  "date_debut": "YYYY-MM-DD ou null",
  "date_fin": "YYYY-MM-DD ou null",
  "expire": true|false,
  "conforme": true|false,
  "anomalies": ["liste", "de", "problèmes"]
}
Champs importants : est_assurance_rcpro, date_fin, conforme.`,

  diplome: `Tu es expert en diplômes professionnels français. Analyse ce document (diplôme, titre RNCP, certificat officiel, carte professionnelle).
Réponds UNIQUEMENT avec un objet JSON valide (pas de texte autour) :
{
  "est_diplome_professionnel": true|false,
  "titulaire_nom": "nom du titulaire ou null",
  "intitule": "intitulé du diplôme ou null",
  "etablissement": "établissement délivrant ou null",
  "annee_obtention": 2020,
  "conforme": true|false,
  "anomalies": ["liste", "de", "problèmes"]
}
Champs importants : est_diplome_professionnel, conforme.`,
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

  try {
    const body = await req.json() as {
      document_id: string;
      file_path: string;
      doc_type: "diplome" | "assurance";
      user_id: string;
    };

    const { document_id, file_path, doc_type, user_id } = body;

    if (!document_id || !file_path || !doc_type) {
      return json({ ok: false, error: "Paramètres manquants." }, 400);
    }

    // ── Rate limiting ────────────────────────────────────────────────────────
    if (user_id && await isRateLimited(supabase, user_id, "analyze-document")) {
      return json({ ok: false, error: "Trop d'analyses en cours. Réessayez dans une minute." }, 429);
    }

    // ── 1. URL signée (5 minutes) ──────────────────────────────
    const { data: urlData, error: urlErr } = await supabase.storage
      .from("documents")
      .createSignedUrl(file_path, 300);

    if (urlErr || !urlData?.signedUrl) {
      throw new Error(`Impossible d'accéder au fichier : ${urlErr?.message}`);
    }

    // ── 2. Télécharger le fichier ──────────────────────────────
    const fileResp = await fetch(urlData.signedUrl);
    if (!fileResp.ok) throw new Error("Téléchargement du fichier échoué.");

    const buffer  = await fileResp.arrayBuffer();
    const bytes   = new Uint8Array(buffer);
    const base64  = btoa(bytes.reduce((s, b) => s + String.fromCharCode(b), ""));
    const mime    = fileResp.headers.get("content-type") || "application/pdf";

    // ── 3. Analyse Claude ─────────────────────────────────────
    let analysis: Record<string, unknown> = { conforme: false, anomalies: ["Analyse non effectuée"] };

    if (ANTHROPIC_KEY) {
      const claudeResp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": ANTHROPIC_KEY,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 600,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "image",
                  source: { type: "base64", media_type: mime, data: base64 },
                },
                { type: "text", text: PROMPTS[doc_type] ?? PROMPTS.diplome },
              ],
            },
          ],
        }),
      });

      const claudeData = await claudeResp.json();
      const raw = claudeData.content?.[0]?.text ?? "{}";

      try {
        const match = raw.match(/\{[\s\S]*\}/);
        analysis = match ? JSON.parse(match[0]) : analysis;
      } catch {
        analysis = { conforme: false, anomalies: ["Réponse IA non parseable"] };
      }

      // Auto-extraire la date d'expiration pour l'assurance
      if (doc_type === "assurance" && analysis.date_fin) {
        await supabase
          .from("documents")
          .update({ expires_at: analysis.date_fin })
          .eq("id", document_id)
          .is("expires_at", null); // Ne pas écraser si déjà renseignée
      }
    } else {
      console.warn("ANTHROPIC_API_KEY non définie — analyse ignorée");
      analysis = { conforme: null, anomalies: [], note: "Clé API Anthropic non configurée" };
    }

    // ── 4. Mettre à jour la table documents ───────────────────
    await supabase.from("documents").update({
      ai_analyse:    analysis,
      ai_analyse_at: new Date().toISOString(),
    }).eq("id", document_id);

    return json({ ok: true, analyse: analysis });

  } catch (err) {
    console.error("analyze-document error:", err);
    return json({ ok: false, error: String(err) }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });
}
