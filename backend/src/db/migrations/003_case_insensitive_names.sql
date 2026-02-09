-- Merge duplicate ingredients that differ only by case.
-- Keep the one with the lowest id, re-point references to it.
UPDATE recipe_ingredients ri
SET ingredient_id = keep.id
FROM ingredients dup
JOIN ingredients keep ON LOWER(keep.name) = LOWER(dup.name) AND keep.id < dup.id
WHERE ri.ingredient_id = dup.id AND dup.id != keep.id;

UPDATE lot_ingredients li
SET ingredient_id = keep.id
FROM ingredients dup
JOIN ingredients keep ON LOWER(keep.name) = LOWER(dup.name) AND keep.id < dup.id
WHERE li.ingredient_id = dup.id AND dup.id != keep.id;

-- Remove duplicate recipe_ingredients rows that now conflict
DELETE FROM recipe_ingredients a
USING recipe_ingredients b
WHERE a.id > b.id
  AND a.recipe_id = b.recipe_id
  AND a.ingredient_id = b.ingredient_id;

DELETE FROM ingredients
WHERE id NOT IN (
  SELECT MIN(id) FROM ingredients GROUP BY LOWER(name)
);

-- Lowercase all existing names
UPDATE ingredients SET name = LOWER(name);
UPDATE recipes SET name = LOWER(name);

-- Replace the case-sensitive unique constraint with a case-insensitive one
ALTER TABLE ingredients DROP CONSTRAINT IF EXISTS ingredients_name_key;
CREATE UNIQUE INDEX IF NOT EXISTS ingredients_name_lower_idx ON ingredients (LOWER(name));

-- Add case-insensitive unique constraint on recipe names
CREATE UNIQUE INDEX IF NOT EXISTS recipes_name_lower_idx ON recipes (LOWER(name));
