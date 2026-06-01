/**
 * Edge Function : check-expiry
 * ─────────────────────────────────────────────────────────────
 * Envoie des rappels email aux praticiens dont l'assurance RC Pro
 * expire dans 30 jours ou 7 jours.
 *
 * Variables d'environnement requises (Supabase → Settings → Secrets) :
 *   SUPABASE_URL              — auto-injectée
 *   SUPABASE_SERVICE_ROLE_KEY — auto-injectée
 *   RESEND_API_KEY            — clé Resend (https://resend.com — plan gratuit)
 *   APP_URL                   — ex: https://mobss.vercel.app
 *
 * Activation du cron (Supabase → SQL Editor) :
 *   Voir supabase/validation.sql section 6 (pg_cron)
 *
 * Déploiement :
 *   supabase functions deploy check-expiry
 */

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL  = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY   = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const RESEND_KEY    = Deno.env.get("RESEND_API_KEY") ?? "";
const APP_URL       = Deno.env.get("APP_URL") ?? "https://mobss.vercel.app";
const FROM_EMAIL    = "MOB'SS <noreply@mobss.vercel.app>";

const SEUILS = [7, 30]; // jours avant expiration → envoyer un rappel

interface ExpiringDoc {
  document_id: string;
  user_id: string;
  prenom: string;
  nom: string;
  email: string;
  type: "diplome" | "assurance";
  expires_at: string;
  jours_restants: number;
}

serve(async (_req) => {
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

  // Récupère les documents qui expirent exactement dans 7 ou 30 jours
  const { data, error } = await supabase
    .from("docs_expiring_soon")
    .select("*")
    .in("jours_restants", SEUILS);

  if (error) {
    console.error("Erreur lecture docs_expiring_soon:", error);
    return new Response(JSON.stringify({ ok: false, error: error.message }), { status: 500 });
  }

  const docs = (data ?? []) as ExpiringDoc[];
  const results: { email: string; jours: number; status: string }[] = [];

  for (const doc of docs) {
    const typeLabel = doc.type === "assurance"
      ? "Assurance Responsabilité Civile Professionnelle"
      : "Diplôme professionnel";

    const dateStr = new Date(doc.expires_at).toLocaleDateString("fr-FR", {
      day: "numeric", month: "long", year: "numeric",
    });

    const urgence = doc.jours_restants <= 7
      ? "🔴 Action urgente requise"
      : "⚠️ Rappel important";

    const html = `
<!DOCTYPE html>
<html lang="fr">
<body style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#1a1a1a;">
  <div style="background:#f7e5a2;padding:12px 20px;border-radius:8px;margin-bottom:24px;">
    <strong style="font-size:1.1rem;">MOB'SS</strong>
  </div>

  <p>Bonjour <strong>${doc.prenom}</strong>,</p>

  <div style="background:#fff8e1;border:2px solid #f59e0b;border-radius:8px;padding:16px 20px;margin:20px 0;">
    <p style="margin:0;font-weight:600;color:#92400e;">${urgence}</p>
    <p style="margin:8px 0 0;">Votre <strong>${typeLabel}</strong> expire le <strong>${dateStr}</strong>
    — soit dans <strong>${doc.jours_restants} jour${doc.jours_restants > 1 ? "s" : ""}</strong>.</p>
  </div>

  <p>Pour continuer à utiliser MOB'SS sans interruption :</p>
  <ol>
    <li>Renouvelez votre ${doc.type === "assurance" ? "contrat d'assurance" : "document"} auprès de votre organisme.</li>
    <li>Connectez-vous à votre tableau de bord et déposez le nouveau document.</li>
  </ol>

  <div style="text-align:center;margin:28px 0;">
    <a href="${APP_URL}/dashboard"
       style="background:#1a1a1a;color:#f7e5a2;padding:12px 28px;border-radius:999px;text-decoration:none;font-weight:600;font-size:0.95rem;">
      → Mettre à jour mes documents
    </a>
  </div>

  <p style="font-size:0.85rem;color:#666;">
    Cet email vous a été envoyé automatiquement car vous êtes praticien inscrit sur MOB'SS.
    <br/>Pour toute question : <a href="mailto:contact@mobss.fr">contact@mobss.fr</a>
  </p>
</body>
</html>`;

    let status = "ok";

    if (RESEND_KEY) {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: doc.email,
          subject: `${urgence} — votre ${typeLabel} expire dans ${doc.jours_restants} jours`,
          html,
        }),
      });
      if (!res.ok) {
        const err = await res.text();
        console.error(`Erreur Resend pour ${doc.email}:`, err);
        status = "erreur_envoi";
      }
    } else {
      console.log(`[check-expiry] RESEND_API_KEY absente — email non envoyé à ${doc.email}`);
      status = "resend_non_configure";
    }

    results.push({ email: doc.email, jours: doc.jours_restants, status });
  }

  return new Response(
    JSON.stringify({ ok: true, traites: results.length, details: results }),
    { headers: { "Content-Type": "application/json" } }
  );
});
