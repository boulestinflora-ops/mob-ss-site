-- ============================================================
--  MOB'SS — Validation automatique des documents
--  À exécuter dans Supabase > SQL Editor
--  Ajoute : numéro RPPS, analyse IA, vue expiry, cron job
-- ============================================================


-- ── 1. Colonnes supplémentaires sur profiles ────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS rpps_numero    text,          -- numéro RPPS (11 chiffres)
  ADD COLUMN IF NOT EXISTS rpps_verifie   boolean NOT NULL DEFAULT false;  -- confirmé via API ANS

COMMENT ON COLUMN public.profiles.rpps_numero  IS 'Numéro RPPS (11 chiffres) — professions de santé réglementées';
COMMENT ON COLUMN public.profiles.rpps_verifie IS 'True si le numéro RPPS a été vérifié via l''API ANS/FHIR';


-- ── 2. Colonnes analyse IA sur documents ───────────────────
ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS ai_analyse     jsonb,         -- résultat JSON de l'analyse Claude
  ADD COLUMN IF NOT EXISTS ai_analyse_at  timestamptz;   -- date de l'analyse

COMMENT ON COLUMN public.documents.ai_analyse    IS 'Résultat JSON de l''analyse automatique Claude (conforme, anomalies, dates…)';
COMMENT ON COLUMN public.documents.ai_analyse_at IS 'Date de la dernière analyse IA';


-- ── 3. Politique admin (service role) — lecture globale ────
-- Le service role ignore RLS par défaut.
-- Ajout d'une politique explicite si besoin d'un rôle "admin" personnalisé.
-- (optionnel — à activer si vous créez un rôle postgres dédié)

-- CREATE POLICY "documents_admin_read_all"
--   ON public.documents FOR SELECT
--   USING (auth.jwt() ->> 'role' = 'admin');


-- ── 4. Vue : documents dont l'expiration approche ──────────
CREATE OR REPLACE VIEW public.docs_expiring_soon AS
SELECT
  d.id                                          AS document_id,
  d.user_id,
  p.prenom,
  p.nom,
  u.email,
  d.type,
  d.expires_at,
  d.status,
  (d.expires_at - CURRENT_DATE)::int            AS jours_restants
FROM public.documents d
JOIN public.profiles p ON p.id = d.user_id
JOIN auth.users      u ON u.id = d.user_id
WHERE d.expires_at IS NOT NULL
  AND d.expires_at >= CURRENT_DATE
  AND d.expires_at <= CURRENT_DATE + INTERVAL '60 days'
  AND d.status <> 'refuse';


-- ── 5. Vue admin : tous les documents à valider ────────────
CREATE OR REPLACE VIEW public.documents_admin AS
SELECT
  d.id,
  d.user_id,
  p.prenom,
  p.nom,
  p.specialite,
  p.rpps_numero,
  p.rpps_verifie,
  u.email,
  d.type,
  d.file_name,
  d.file_path,
  d.mime_type,
  d.status,
  d.status_note,
  d.expires_at,
  d.ai_analyse,
  d.ai_analyse_at,
  d.uploaded_at
FROM public.documents d
JOIN public.profiles p ON p.id = d.user_id
JOIN auth.users      u ON u.id = d.user_id
ORDER BY d.uploaded_at DESC;


-- ── 6. Cron : rappels d'expiration (pg_cron) ───────────────
-- Nécessite l'extension pg_cron activée dans Supabase :
-- Dashboard → Database → Extensions → pg_cron → Enable
--
-- Ce cron appelle l'Edge Function "check-expiry" chaque matin à 8h.
-- Remplacez {PROJECT_REF} par votre référence de projet Supabase.
-- Remplacez {ANON_KEY}    par votre clé anon publique.

-- SELECT cron.schedule(
--   'check-expiry-daily',               -- nom du job
--   '0 8 * * *',                        -- tous les jours à 8h00
--   $$
--     SELECT net.http_post(
--       url := 'https://{PROJECT_REF}.supabase.co/functions/v1/check-expiry',
--       headers := '{"Authorization": "Bearer {ANON_KEY}"}'::jsonb
--     );
--   $$
-- );
