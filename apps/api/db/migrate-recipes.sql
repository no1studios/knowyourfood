-- Know Your Food — recipes table (idempotent).
-- Safe to re-run after auth schema exists. Also applied automatically by
-- ensureRecipesSchema on recipe API cold start.

CREATE TABLE IF NOT EXISTS recipes (
  id TEXT PRIMARY KEY,
  owner_user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  device_id TEXT,
  title TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  visibility TEXT NOT NULL DEFAULT 'private'
    CHECK (visibility IN ('private', 'link_shared')),
  import_source TEXT,
  import_ref TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS recipes_owner_updated_idx
  ON recipes (owner_user_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS recipes_owner_active_idx
  ON recipes (owner_user_id)
  WHERE deleted_at IS NULL;