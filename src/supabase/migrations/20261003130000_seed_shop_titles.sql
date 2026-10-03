-- Migration: Pre-seed shop exclusive titles in titles table so regular users can equip them without RLS issues
INSERT INTO titles (name, description, requirement_type, requirement_value, is_special)
VALUES
  ('Navigateur des Équateurs', 'Titre de prestige affiché sous votre pseudo sur l''ensemble de l''application.', 'shop', 0, true),
  ('Cartographe Suprême', 'Titre d''expert pour ceux qui connaissent chaque frontière au millimètre.', 'shop', 0, true),
  ('Maître des 7 Océans', 'Le titre ultime réservé aux conquérants des terres et des mers.', 'shop', 0, true)
ON CONFLICT (name) DO UPDATE
SET
  description = EXCLUDED.description,
  requirement_type = EXCLUDED.requirement_type,
  requirement_value = EXCLUDED.requirement_value,
  is_special = EXCLUDED.is_special;
