-- Shopping lists + items (signed-in checklist cloud sync).
-- Safe to re-run. Also applied automatically via ensureShoppingSchema
-- on shopping API cold start / health ping.

CREATE TABLE IF NOT EXISTS shopping_lists (
  id TEXT PRIMARY KEY,
  owner_user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  device_id TEXT,
  title TEXT NOT NULL DEFAULT 'Shopping',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS shopping_lists_owner_updated_idx
  ON shopping_lists (owner_user_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS shopping_items (
  id TEXT PRIMARY KEY,
  list_id TEXT NOT NULL REFERENCES shopping_lists (id) ON DELETE CASCADE,
  owner_user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  device_id TEXT,
  name TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS shopping_items_owner_updated_idx
  ON shopping_items (owner_user_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS shopping_items_list_active_idx
  ON shopping_items (list_id)
  WHERE deleted_at IS NULL;
