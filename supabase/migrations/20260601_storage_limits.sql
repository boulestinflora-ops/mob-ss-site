-- ============================================================
-- Migration : limites de taille Supabase Storage
-- Date : 2026-06-01
-- Audit section 8.4 : "Pas de limitation de taille visible → risque stockage abusif"
-- ============================================================

-- Bucket 'documents' : documents professionnels (diplômes, RC Pro)
UPDATE storage.buckets
SET
  file_size_limit    = 10485760,
  allowed_mime_types = ARRAY['application/pdf','image/jpeg','image/png','image/webp']
WHERE id = 'documents';

-- Bucket 'avatars' : photos de profil
UPDATE storage.buckets
SET
  file_size_limit    = 5242880,
  allowed_mime_types = ARRAY['image/jpeg','image/png','image/webp']
WHERE id = 'avatars';

-- Bucket 'annonces' : photos d'espaces
UPDATE storage.buckets
SET
  file_size_limit    = 8388608,
  allowed_mime_types = ARRAY['image/jpeg','image/png','image/webp']
WHERE id = 'annonces';
