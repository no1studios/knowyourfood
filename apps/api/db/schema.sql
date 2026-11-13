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
