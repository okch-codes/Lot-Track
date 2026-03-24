-- Planning events (groups of orders, e.g. "Natale 2026")
CREATE TABLE IF NOT EXISTS planning_events (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Orders within a planning event
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  planning_event_id INTEGER NOT NULL REFERENCES planning_events(id) ON DELETE CASCADE,
  client_name VARCHAR(255) NOT NULL,
  extra TEXT,
  delivery_date DATE,
  delivery_address TEXT,
  price_cents INTEGER,
  is_ready BOOLEAN NOT NULL DEFAULT FALSE,
  is_delivered BOOLEAN NOT NULL DEFAULT FALSE,
  is_paid BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Order line items (recipe + size + quantity)
CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  recipe_id INTEGER NOT NULL REFERENCES recipes(id) ON DELETE RESTRICT,
  size VARCHAR(50) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  UNIQUE(order_id, recipe_id, size)
);
