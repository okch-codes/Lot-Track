DO $$
BEGIN
  -- If old tables exist, drop the empty new ones (created by updated 001) and rename
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lotto_ingredients') THEN
    DROP TABLE IF EXISTS lot_ingredients;
    ALTER TABLE lotto_ingredients RENAME TO lot_ingredients;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lotti') THEN
    DROP TABLE IF EXISTS lots;
    ALTER TABLE lotti RENAME TO lots;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lots' AND column_name = 'lotto_number') THEN
    ALTER TABLE lots RENAME COLUMN lotto_number TO lot_number;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lot_ingredients' AND column_name = 'lotto_id') THEN
    ALTER TABLE lot_ingredients RENAME COLUMN lotto_id TO lot_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lot_ingredients' AND column_name = 'lotto_number') THEN
    ALTER TABLE lot_ingredients RENAME COLUMN lotto_number TO lot_number;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ingredients' AND column_name = 'last_lotto_number') THEN
    ALTER TABLE ingredients RENAME COLUMN last_lotto_number TO last_lot_number;
  END IF;
END $$;
