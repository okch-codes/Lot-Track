-- Ingredient cost fields
ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS cost_price_cents INTEGER;
ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS cost_vat_rate INTEGER;
ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS cost_unit VARCHAR(20);
ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS cost_package_size NUMERIC(10,3);

-- Recipe cost quantities (separate from recipe_ingredients used in lot tracking)
CREATE TABLE IF NOT EXISTS recipe_cost_items (
  id SERIAL PRIMARY KEY,
  recipe_id INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  ingredient_id INTEGER NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  quantity NUMERIC(10,3) NOT NULL,
  UNIQUE(recipe_id, ingredient_id)
);

-- Batch yield per recipe (how many units/kg one batch produces)
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS cost_yield NUMERIC(10,3);
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS cost_yield_unit VARCHAR(20);
