-- ============================================================
--  MOB'SS — Supabase Storage : politiques de sécurité (RLS)
--  Bucket : "documents"  (documents professionnels des praticiens)
-- ============================================================
--
--  COMMENT APPLIQUER :
--  1. Ouvrir le Dashboard Supabase → SQL Editor
--  2. Coller et exécuter ce script
--  3. Vérifier dans Storage → Policies que les règles apparaissent
--
--  VALIDATION SERVEUR :
--  • Taille max (10 Mo) : configurée au niveau du bucket (voir plus bas)
--  • Types MIME autorisés : PDF, JPEG, PNG — contrôlés par la policy INSERT
--  • Dossier d'upload : chaque praticien ne peut écrire que dans son propre dossier
-- ============================================================

-- ── 1. Créer le bucket avec limite de taille ────────────────────────────────
-- (si le bucket existe déjà, supprimer ces lignes — la taille se change dans
--  le Dashboard : Storage → Buckets → documents → Edit → Max file size)

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false,                          -- bucket PRIVÉ — pas d'accès public direct
  10485760,                       -- 10 Mo en octets
  ARRAY['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit    = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;


-- ── 2. Supprimer les anciennes policies si elles existent ──────────────────
DROP POLICY IF EXISTS "praticiens_upload_own_docs"   ON storage.objects;
DROP POLICY IF EXISTS "praticiens_read_own_docs"     ON storage.objects;
DROP POLICY IF EXISTS "praticiens_delete_own_docs"   ON storage.objects;
DROP POLICY IF EXISTS "praticiens_update_own_docs"   ON storage.objects;
DROP POLICY IF EXISTS "service_role_full_access"     ON storage.objects;


-- ── 3. Policy INSERT : upload uniquement vers son propre dossier ──────────
-- Format attendu du chemin : {user_id}/{diplome|assurance}/{nom_fichier}
-- Ex : "abc-123-def/diplome/kine-diplome.pdf"
CREATE POLICY "praticiens_upload_own_docs"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND storage.extension(name) IN ('pdf', 'jpg', 'jpeg', 'png')
);


-- ── 4. Policy SELECT : lecture uniquement de ses propres fichiers ──────────
CREATE POLICY "praticiens_read_own_docs"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);


-- ── 5. Policy DELETE : suppression uniquement de ses propres fichiers ──────
CREATE POLICY "praticiens_delete_own_docs"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);


-- ── 6. Policy UPDATE : remplacement uniquement de ses propres fichiers ─────
CREATE POLICY "praticiens_update_own_docs"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND storage.extension(name) IN ('pdf', 'jpg', 'jpeg', 'png')
);


-- ── 7. Accès service_role (Edge Functions admin) — bypass RLS implicite ───
-- Le service_role bypasse automatiquement les policies RLS en Supabase.
-- Aucune policy supplémentaire nécessaire pour les Edge Functions.
-- Si besoin d'un rôle custom admin, ajouter ici.


-- ── RÉCAPITULATIF SÉCURITÉ ──────────────────────────────────────────────────
-- ✅ Taille max 10 Mo appliquée côté serveur (bucket file_size_limit)
-- ✅ MIME types validés côté serveur (allowed_mime_types + extension check)
-- ✅ Isolation par utilisateur (folder = auth.uid())
-- ✅ Bucket privé (pas d'URL publique directe)
-- ✅ Les Edge Functions (service_role) conservent l'accès complet pour la vérification admin
-- ⚠️  Penser à activer RLS sur la table storage.objects si ce n'est pas déjà le cas :
--    ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
