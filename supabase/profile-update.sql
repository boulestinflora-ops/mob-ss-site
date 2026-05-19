-- ============================================================
--  MOB'SS — Mise à jour table profiles + bucket avatars
--  Nouvelles colonnes : doctolib_url, tel_public, email_public
--  Storage bucket : avatars (public)
--  À exécuter dans Supabase > SQL Editor
-- ============================================================

-- ── 1. Nouvelles colonnes profiles ─────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS doctolib_url  text,
  ADD COLUMN IF NOT EXISTS tel_public    boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS email_public  boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.profiles.doctolib_url IS 'URL du profil Doctolib du praticien';
COMMENT ON COLUMN public.profiles.tel_public   IS 'Vrai si le téléphone est affiché sur la fiche publique';
COMMENT ON COLUMN public.profiles.email_public IS 'Vrai si l''email est affiché sur la fiche publique';


-- ── 2. Bucket avatars (public) ──────────────────────────────
-- Les avatars sont publics : pas besoin d'URL signée pour les afficher
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,          -- PUBLIC : URL directe accessible sans token
  5242880,       -- 5 Mo max
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;


-- ── 3. Storage RLS — avatars ────────────────────────────────
-- Structure du chemin : avatars/{user_id}/avatar.jpg
-- (string_to_array(name, '/'))[1] = user_id

-- Upload / remplacement : un utilisateur ne peut uploader que dans son dossier
CREATE POLICY "avatars_insert_own"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = (string_to_array(name, '/'))[1]
  );

-- Lecture publique : tout le monde peut voir les avatars (bucket public)
CREATE POLICY "avatars_select_public"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- Suppression / remplacement : un utilisateur peut supprimer son propre avatar
CREATE POLICY "avatars_delete_own"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (string_to_array(name, '/'))[1]
  );

-- Mise à jour (upsert) : un utilisateur peut modifier son propre avatar
CREATE POLICY "avatars_update_own"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (string_to_array(name, '/'))[1]
  );
