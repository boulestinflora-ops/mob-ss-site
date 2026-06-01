-- =====================================================================
-- Migration baseline — MOB'SS
-- Ce fichier marque l'état initial du schéma (déjà appliqué via SQL Editor).
-- Les fichiers source restent dans supabase/*.sql pour référence.
-- Toutes les migrations futures doivent passer par supabase/migrations/.
-- =====================================================================

-- Activer pg_stat_statements pour le monitoring des requêtes lentes
-- (permet d'identifier les requêtes SQL lentes via Supabase Dashboard → Reports)
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Nettoyage automatique de rate_limits (entrées > 1 heure) toutes les 30 min
-- Nécessite l'extension pg_cron (activable dans Supabase → Database → Extensions)
-- SELECT cron.schedule(
--   'cleanup-rate-limits',
--   '*/30 * * * *',
--   $$DELETE FROM public.rate_limits WHERE called_at < now() - interval '1 hour'$$
-- );
