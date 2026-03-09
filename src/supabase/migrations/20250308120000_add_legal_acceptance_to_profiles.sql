-- Acceptation des conditions d'utilisation et de la politique de confidentialité
-- NULL = compte créé avant cette migration (acceptation implicite / anciens comptes)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS terms_accepted_at timestamptz DEFAULT NULL,
ADD COLUMN IF NOT EXISTS privacy_accepted_at timestamptz DEFAULT NULL;

COMMENT ON COLUMN profiles.terms_accepted_at IS 'Date d''acceptation des conditions d''utilisation (NULL = compte existant, considéré accepté)';
COMMENT ON COLUMN profiles.privacy_accepted_at IS 'Date d''acceptation de la politique de confidentialité (NULL = compte existant, considéré accepté)';
