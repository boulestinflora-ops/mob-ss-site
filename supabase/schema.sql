-- =====================================================================
-- MOB'SS — Configuration Supabase
-- =====================================================================
-- Comment l'utiliser :
--   1. Ouvrez votre projet sur https://supabase.com
--   2. Dans le menu à gauche → "SQL Editor"
--   3. Cliquez "New query"
--   4. Copiez-collez ce fichier entier
--   5. Cliquez "Run" (▶)
--
-- Ce script est sûr à exécuter plusieurs fois (IF NOT EXISTS, OR REPLACE).
-- =====================================================================


-- ═══════════════════════════════════════════════════════════════════════
-- 1. TABLE PROFILES
-- ═══════════════════════════════════════════════════════════════════════
-- Stocke les informations publiques des utilisateurs.
-- Liée à auth.users (gérée par Supabase) via l'id.
-- CREATE TABLE IF NOT EXISTS : ne fait rien si la table existe déjà.

CREATE TABLE IF NOT EXISTS public.profiles (
  id                       uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role                     text        NOT NULL DEFAULT 'praticien',   -- praticien | collectivite | entreprise
  prenom                   text,
  nom                      text,
  telephone                text,
  specialite               text,
  ville                    text,
  bio                      text,
  disponible_remplacement  boolean     NOT NULL DEFAULT false,
  visible_annuaire         boolean     NOT NULL DEFAULT true,
  photo_url                text,
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now()
);

-- Si la table existait déjà (sans toutes ces colonnes), on les ajoute.
-- "ADD COLUMN IF NOT EXISTS" ne fait rien si la colonne existe déjà — sans risque.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS prenom                   text,
  ADD COLUMN IF NOT EXISTS nom                      text,
  ADD COLUMN IF NOT EXISTS telephone                text,
  ADD COLUMN IF NOT EXISTS specialite               text,
  ADD COLUMN IF NOT EXISTS ville                    text,
  ADD COLUMN IF NOT EXISTS bio                      text,
  ADD COLUMN IF NOT EXISTS disponible_remplacement  boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS visible_annuaire         boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS photo_url                text,
  ADD COLUMN IF NOT EXISTS created_at               timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at               timestamptz DEFAULT now();

-- Documentation des colonnes (visible dans l'interface Supabase)
COMMENT ON TABLE  public.profiles                        IS 'Profils publics des utilisateurs MOB''SS';
COMMENT ON COLUMN public.profiles.role                   IS 'praticien | collectivite | entreprise';
COMMENT ON COLUMN public.profiles.specialite             IS 'Spécialité du praticien (Kinésithérapeute, Coach sportif, etc.)';
COMMENT ON COLUMN public.profiles.ville                  IS 'Ville principale d''exercice';
COMMENT ON COLUMN public.profiles.bio                    IS 'Présentation courte affichée dans l''annuaire';
COMMENT ON COLUMN public.profiles.disponible_remplacement IS 'Vrai si le praticien accepte des missions de remplacement';
COMMENT ON COLUMN public.profiles.visible_annuaire       IS 'Vrai si le profil est visible dans l''annuaire public';
COMMENT ON COLUMN public.profiles.photo_url              IS 'URL de la photo de profil (Supabase Storage)';


-- ═══════════════════════════════════════════════════════════════════════
-- 2. TRIGGER — Création automatique du profil à l'inscription
-- ═══════════════════════════════════════════════════════════════════════
-- Quand quelqu'un s'inscrit (magic link /rejoindre ou formulaire classique),
-- ce trigger crée automatiquement sa ligne dans profiles avec les
-- métadonnées passées lors du signUp / signInWithOtp.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, role, specialite, ville)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'role', 'praticien'),
    NEW.raw_user_meta_data->>'specialite',   -- passé depuis /rejoindre
    NEW.raw_user_meta_data->>'ville'         -- passé depuis /rejoindre
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recrée le trigger proprement
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ═══════════════════════════════════════════════════════════════════════
-- 3. TABLE DEMANDES
-- ═══════════════════════════════════════════════════════════════════════
-- Stocke les demandes d'utilisation d'un espace
-- (bouton "Envoyer une demande" sur la page /annonce/[id])

CREATE TABLE IF NOT EXISTS public.demandes (
  id           uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  space_id     text        NOT NULL,               -- id de l'espace (ex: "studio-lumiere-lyon")
  user_id      uuid        REFERENCES auth.users(id) ON DELETE CASCADE,
  date         date        NOT NULL,
  heure_debut  text,                               -- ex: "09:00"
  heure_fin    text,                               -- ex: "12:00"
  recurrence   text        DEFAULT 'Une seule fois',
  statut       text        DEFAULT 'en_attente',   -- en_attente | acceptee | refusee
  message      text,                               -- message optionnel du praticien
  created_at   timestamptz DEFAULT now()
);

COMMENT ON TABLE  public.demandes        IS 'Demandes d''utilisation d''un espace par un praticien';
COMMENT ON COLUMN public.demandes.statut   IS 'en_attente | acceptee | refusee';
COMMENT ON COLUMN public.demandes.space_id IS 'Identifiant de l''espace dans spaces.json';


-- ═══════════════════════════════════════════════════════════════════════
-- 4. TABLE CONTACT_MESSAGES
-- ═══════════════════════════════════════════════════════════════════════
-- Stocke les messages envoyés via le formulaire de contact

CREATE TABLE IF NOT EXISTS public.contact_messages (
  id           uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  motif        text,                               -- "Praticien sport ou santé", etc.
  prenom       text        NOT NULL,
  nom          text        NOT NULL,
  email        text        NOT NULL,
  organisation text,
  message      text        NOT NULL,
  traite       boolean     DEFAULT false,          -- Lu/traité par l'équipe MOB'SS
  created_at   timestamptz DEFAULT now()
);

COMMENT ON TABLE  public.contact_messages        IS 'Messages reçus via le formulaire de contact';
COMMENT ON COLUMN public.contact_messages.traite IS 'Marquer comme traité depuis le backoffice';


-- ═══════════════════════════════════════════════════════════════════════
-- 5. TABLE ANNONCES (espaces déposés par les hôtes)
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.annonces (
  id            uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  host_id       uuid        REFERENCES auth.users(id) ON DELETE CASCADE,
  titre         text        NOT NULL,
  type          text        NOT NULL,                -- salle-communale | cabinet | studio | salle-sport | entreprise | exterieur
  adresse       text        NOT NULL,
  cp            text        NOT NULL,
  ville         text        NOT NULL,
  description   text,
  superficie    integer,                             -- en m²
  capacite      integer,
  equipements   text[]      DEFAULT '{}',            -- liste des équipements cochés
  jours         text[]      DEFAULT '{}',            -- jours de disponibilité
  heure_debut   text,                                -- ex: "08:00"
  heure_fin     text,                                -- ex: "19:00"
  tarif_type    text        DEFAULT 'gratuit',       -- gratuit | payant
  tarif         text,                                -- ex: "15 €/h"
  notes_dispo   text,                                -- notes libres sur les disponibilités
  statut        text        DEFAULT 'en_attente',    -- en_attente | actif | inactif | refuse
  created_at    timestamptz DEFAULT now()
);

COMMENT ON TABLE  public.annonces         IS 'Espaces mis à disposition par les hôtes (collectivités, entreprises)';
COMMENT ON COLUMN public.annonces.statut  IS 'en_attente (modération) | actif | inactif | refuse';
COMMENT ON COLUMN public.annonces.host_id IS 'Référence vers auth.users (hôte propriétaire)';


-- ═══════════════════════════════════════════════════════════════════════
-- 6. POLITIQUES RLS (Row Level Security)
-- ═══════════════════════════════════════════════════════════════════════
-- RLS protège vos données : chaque règle définit qui peut lire/écrire quoi.
-- Sans RLS, n'importe qui pourrait lire ou modifier toutes les données.


-- ── Profiles ──────────────────────────────────────────────────────────

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Tout le monde peut lire les profils (annuaire public + compteur /rejoindre)
DROP POLICY IF EXISTS "Lecture publique des profils" ON public.profiles;
CREATE POLICY "Lecture publique des profils"
  ON public.profiles
  FOR SELECT
  USING (true);

-- Chaque utilisateur peut modifier uniquement son propre profil
DROP POLICY IF EXISTS "Modification de son propre profil" ON public.profiles;
CREATE POLICY "Modification de son propre profil"
  ON public.profiles
  FOR ALL
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);


-- ── Demandes ──────────────────────────────────────────────────────────

ALTER TABLE public.demandes ENABLE ROW LEVEL SECURITY;

-- Un praticien connecté peut créer une demande
DROP POLICY IF EXISTS "Créer ses demandes" ON public.demandes;
CREATE POLICY "Créer ses demandes"
  ON public.demandes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Un praticien peut voir ses propres demandes
DROP POLICY IF EXISTS "Voir ses propres demandes" ON public.demandes;
CREATE POLICY "Voir ses propres demandes"
  ON public.demandes
  FOR SELECT
  USING (auth.uid() = user_id);


-- ── Annonces ──────────────────────────────────────────────────────────

ALTER TABLE public.annonces ENABLE ROW LEVEL SECURITY;

-- Les annonces actives sont visibles par tout le monde
DROP POLICY IF EXISTS "Lecture publique annonces actives" ON public.annonces;
CREATE POLICY "Lecture publique annonces actives"
  ON public.annonces
  FOR SELECT
  USING (statut = 'actif' OR auth.uid() = host_id);

-- Un hôte connecté peut créer une annonce
DROP POLICY IF EXISTS "Hôte peut créer une annonce" ON public.annonces;
CREATE POLICY "Hôte peut créer une annonce"
  ON public.annonces
  FOR INSERT
  WITH CHECK (auth.uid() = host_id);

-- Un hôte peut modifier ses propres annonces
DROP POLICY IF EXISTS "Hôte peut modifier ses annonces" ON public.annonces;
CREATE POLICY "Hôte peut modifier ses annonces"
  ON public.annonces
  FOR UPDATE
  USING (auth.uid() = host_id)
  WITH CHECK (auth.uid() = host_id);

-- Un hôte peut supprimer ses propres annonces
DROP POLICY IF EXISTS "Hôte peut supprimer ses annonces" ON public.annonces;
CREATE POLICY "Hôte peut supprimer ses annonces"
  ON public.annonces
  FOR DELETE
  USING (auth.uid() = host_id);


-- ── Contact messages ───────────────────────────────────────────────────

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- N'importe qui peut envoyer un message (pas besoin d'être connecté)
DROP POLICY IF EXISTS "Insertion publique contact" ON public.contact_messages;
CREATE POLICY "Insertion publique contact"
  ON public.contact_messages
  FOR INSERT
  WITH CHECK (true);


-- ═══════════════════════════════════════════════════════════════════════
-- 6. CONFIGURATION AUTH — URL de redirection
-- ═══════════════════════════════════════════════════════════════════════
-- ⚠️ À FAIRE MANUELLEMENT dans l'interface Supabase (pas en SQL) :
--
-- Authentication → URL Configuration :
--   Site URL            → https://mobss.vercel.app
--   Redirect URLs       → ajouter : https://mobss.vercel.app/completer-profil
--                         ajouter : http://localhost:4321/completer-profil  (pour les tests locaux)
--
-- Authentication → Email Templates :
--   "Magic Link" → vérifier que le lien pointe vers {{ .SiteURL }}/completer-profil
-- ═══════════════════════════════════════════════════════════════════════


-- ═══════════════════════════════════════════════════════════════════════
-- 7. VÉRIFICATION RAPIDE
-- ═══════════════════════════════════════════════════════════════════════
-- Exécutez ces requêtes séparément pour confirmer que tout est créé :

-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_name = 'profiles' ORDER BY ordinal_position;

-- SELECT * FROM public.demandes LIMIT 5;
-- SELECT * FROM public.contact_messages LIMIT 5;
