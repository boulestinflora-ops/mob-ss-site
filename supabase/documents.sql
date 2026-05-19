-- ============================================================
--  MOB'SS — Documents professionnels des praticiens
--  À exécuter dans Supabase > SQL Editor
--  Ordre : 1) Table  2) RLS  3) Storage bucket  4) Storage policies
-- ============================================================


-- ──────────────────────────────────────────────────────────
--  1. TABLE documents
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.documents (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Type de document
  type         text        NOT NULL CHECK (type IN ('diplome', 'assurance')),

  -- Chemin dans Supabase Storage : "{user_id}/{type}/{filename}"
  file_path    text        NOT NULL,
  file_name    text        NOT NULL,     -- nom original du fichier (affiché à l'utilisateur)
  file_size    bigint,                   -- taille en octets (optionnel, pour info)
  mime_type    text,                     -- ex : "application/pdf", "image/jpeg"

  -- Statut de vérification (évolution future : admin vérifie manuellement)
  status       text        NOT NULL DEFAULT 'fourni'
                           CHECK (status IN ('fourni', 'verifie', 'refuse')),
  status_note  text,                     -- commentaire admin en cas de refus

  -- Date d'expiration (importante pour l'assurance RC Pro, renouvelable chaque année)
  expires_at   date,

  uploaded_at  timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- Index pour requêtes par utilisateur
CREATE INDEX IF NOT EXISTS documents_user_id_idx ON public.documents (user_id);
CREATE INDEX IF NOT EXISTS documents_user_type_idx ON public.documents (user_id, type);

-- Mise à jour automatique de updated_at
CREATE OR REPLACE FUNCTION update_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_documents_updated_at ON public.documents;
CREATE TRIGGER trg_documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION update_documents_updated_at();


-- ──────────────────────────────────────────────────────────
--  2. RLS (Row Level Security)
--  Chaque praticien ne voit et ne modifie QUE ses propres documents.
-- ──────────────────────────────────────────────────────────
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Lecture : un utilisateur ne voit que ses propres lignes
CREATE POLICY "documents_select_own"
  ON public.documents FOR SELECT
  USING (auth.uid() = user_id);

-- Insertion : un utilisateur ne peut insérer que pour lui-même
CREATE POLICY "documents_insert_own"
  ON public.documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Mise à jour : un utilisateur peut mettre à jour ses propres lignes
-- (mais pas le champ status qui est réservé à l'admin — à verrouiller plus tard)
CREATE POLICY "documents_update_own"
  ON public.documents FOR UPDATE
  USING (auth.uid() = user_id);

-- Suppression : un utilisateur peut supprimer ses propres documents
CREATE POLICY "documents_delete_own"
  ON public.documents FOR DELETE
  USING (auth.uid() = user_id);


-- ──────────────────────────────────────────────────────────
--  3. STORAGE BUCKET
--  À exécuter dans Supabase > SQL Editor
--  (ou créer le bucket manuellement dans Storage > New bucket)
-- ──────────────────────────────────────────────────────────

-- Bucket privé "documents" (public = false → les fichiers ne sont PAS accessibles sans token)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false,           -- PRIVÉ : accès uniquement via URL signée
  10485760,        -- 10 Mo max par fichier
  ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp'
  ]
)
ON CONFLICT (id) DO NOTHING;


-- ──────────────────────────────────────────────────────────
--  4. STORAGE RLS POLICIES
--  Structure des chemins : documents/{user_id}/{type}/{filename}
--  ex : documents/abc123/diplome/diplome-kine.pdf
-- ──────────────────────────────────────────────────────────

-- Upload : un utilisateur ne peut uploader que dans son propre dossier
CREATE POLICY "storage_documents_insert_own"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'documents'
    AND auth.uid()::text = (string_to_array(name, '/'))[1]
  );

-- Lecture : un utilisateur ne peut lire que ses propres fichiers
CREATE POLICY "storage_documents_select_own"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'documents'
    AND auth.uid()::text = (string_to_array(name, '/'))[1]
  );

-- Suppression : un utilisateur peut supprimer ses propres fichiers
CREATE POLICY "storage_documents_delete_own"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'documents'
    AND auth.uid()::text = (string_to_array(name, '/'))[1]
  );


-- ──────────────────────────────────────────────────────────
--  5. VUE UTILITAIRE (optionnel mais pratique)
--  Résumé des documents par utilisateur — utile pour le dashboard
--  et pour les hôtes (vérifier si un praticien a ses docs en ordre)
-- ──────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW public.documents_summary AS
SELECT
  p.id                                                      AS user_id,
  p.prenom,
  p.nom,

  -- Diplôme
  MAX(CASE WHEN d.type = 'diplome'   THEN d.status  END)   AS diplome_status,
  MAX(CASE WHEN d.type = 'diplome'   THEN d.uploaded_at END) AS diplome_uploaded_at,

  -- Assurance RC Pro
  MAX(CASE WHEN d.type = 'assurance' THEN d.status  END)   AS assurance_status,
  MAX(CASE WHEN d.type = 'assurance' THEN d.expires_at END) AS assurance_expires_at,
  MAX(CASE WHEN d.type = 'assurance' THEN d.uploaded_at END) AS assurance_uploaded_at,

  -- Synthèse : "complet" si les deux documents sont fournis
  CASE
    WHEN COUNT(CASE WHEN d.type = 'diplome'   AND d.status IN ('fourni','verifie') THEN 1 END) > 0
     AND COUNT(CASE WHEN d.type = 'assurance' AND d.status IN ('fourni','verifie') THEN 1 END) > 0
    THEN true ELSE false
  END                                                       AS documents_complets

FROM public.profiles p
LEFT JOIN public.documents d ON d.user_id = p.id
WHERE p.role NOT IN ('collectivite', 'entreprise')  -- praticiens uniquement
GROUP BY p.id, p.prenom, p.nom;
