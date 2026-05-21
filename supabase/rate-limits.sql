-- ═══════════════════════════════════════════════════════════════════════
-- Rate limiting pour les Edge Functions
-- Exécuter dans Supabase → SQL Editor
-- ═══════════════════════════════════════════════════════════════════════

-- Table : un enregistrement = un appel d'une Edge Function par un utilisateur
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id         bigserial    PRIMARY KEY,
  key        text         NOT NULL,  -- "<userId>:<functionName>"
  called_at  timestamptz  DEFAULT now()
);

-- Index pour les lookups par fenêtre glissante
CREATE INDEX IF NOT EXISTS rate_limits_key_called_at_idx
  ON public.rate_limits (key, called_at);

-- RLS : uniquement accessible via service_role (les Edge Functions)
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
-- Aucune policy publique → inaccessible depuis le client anon

-- Nettoyage automatique des entrées > 1 heure via pg_cron (optionnel)
-- SELECT cron.schedule('cleanup-rate-limits', '*/30 * * * *',
--   'DELETE FROM public.rate_limits WHERE called_at < now() - interval ''1 hour'';');

COMMENT ON TABLE public.rate_limits IS
  'Fenêtres glissantes pour le rate limiting des Edge Functions (service_role only)';
