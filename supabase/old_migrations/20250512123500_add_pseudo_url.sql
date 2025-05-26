-- Ajouter la colonne pseudo_url
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pseudo_url TEXT;

-- Ajouter un index unique pour assurer l'unicité des pseudo_url
CREATE UNIQUE INDEX IF NOT EXISTS profiles_pseudo_url_idx ON profiles(pseudo_url);

-- Fonction pour générer un pseudo_url à partir du stage_name
CREATE OR REPLACE FUNCTION generate_pseudo_url(stage_name TEXT) 
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Convertir le stage_name en slug
  base_slug := LOWER(stage_name);
  -- Remplacer les espaces par des tirets
  base_slug := REPLACE(base_slug, ' ', '-');
  -- Supprimer les caractères spéciaux
  base_slug := REGEXP_REPLACE(base_slug, '[^a-z0-9\-]', '', 'g');
  -- Supprimer les tirets multiples
  base_slug := REGEXP_REPLACE(base_slug, '\-+', '-', 'g');
  -- Supprimer les tirets au début et à la fin
  base_slug := TRIM(BOTH '-' FROM base_slug);
  
  -- Si le slug est vide après nettoyage, utiliser 'user'
  IF base_slug = '' THEN
    base_slug := 'user';
  END IF;
  
  -- Essayer le slug de base d'abord
  final_slug := base_slug;
  
  -- Si le slug existe déjà, ajouter un numéro jusqu'à trouver un slug unique
  WHILE EXISTS (SELECT 1 FROM profiles WHERE pseudo_url = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour générer automatiquement le pseudo_url
CREATE OR REPLACE FUNCTION generate_pseudo_url_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- Si le pseudo_url n'est pas défini et que le stage_name existe
  IF NEW.pseudo_url IS NULL AND NEW.stage_name IS NOT NULL THEN
    NEW.pseudo_url := generate_pseudo_url(NEW.stage_name);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_pseudo_url
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION generate_pseudo_url_trigger();

-- Générer les pseudo_url pour les profils existants
UPDATE profiles 
SET pseudo_url = generate_pseudo_url(stage_name)
WHERE pseudo_url IS NULL AND stage_name IS NOT NULL;
