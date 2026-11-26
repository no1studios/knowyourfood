-- Know Your Food — minimal auth schema (Neon / Postgres)
-- Aligns with docs/data-model.md User + Identity.
-- Apply in Neon SQL Editor (or any psql) after creating the project.
-- Safe to re-run (IF NOT EXISTS).

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  display_name TEXT,
  preferred_locale TEXT NOT NULL DEFAULT 'en'
    CHECK (preferred_locale IN ('en', 'hi')),
  diet_prefs TEXT[] NOT NULL DEFAULT '{}',
  open_to_orders BOOLEAN NOT NULL DEFAULT false,
  onboarding_recipe_sources TEXT[]
);

CREATE TABLE IF NOT EXISTS auth_identities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  provider TEXT NOT NULL
    CHECK (provider IN ('phone', 'google', 'apple')),
  provider_subject TEXT NOT NULL,
  phone_e164 TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (provider, provider_subject)
);

CREATE INDEX IF NOT EXISTS auth_identities_user_id_idx
  ON auth_identities (user_id);

CREATE INDEX IF NOT EXISTS auth_identities_phone_e164_idx
  ON auth_identities (phone_e164)
  WHERE phone_e164 IS NOT NULL;

-- Idempotent upgrades for DBs created from older pastes (e.g. users.phone TEXT,
-- auth_identities without phone_e164). Safe when columns already exist.
ALTER TABLE auth_identities ADD COLUMN IF NOT EXISTS phone_e164 TEXT;
ALTER TABLE auth_identities ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE auth_identities ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Recipes (signed-in cloud sync). Client ids (TEXT); payload = full GuestRecipe JSON.
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

-- Shopping lists + items (signed-in checklist cloud sync).
-- Client item ids (TEXT); payload = full GuestShoppingItem JSON minus syncStatus.
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
