CREATE TABLE IF NOT EXISTS planning_columns (
  id SERIAL PRIMARY KEY,
  planning_event_id INTEGER NOT NULL REFERENCES planning_events(id) ON DELETE CASCADE,
  recipe_id INTEGER NOT NULL REFERENCES recipes(id) ON DELETE RESTRICT,
  size VARCHAR(50) NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  UNIQUE(planning_event_id, recipe_id, size)
);
