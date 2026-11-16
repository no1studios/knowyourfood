-- Know Your Food — align Neon auth_identities with apps/api/db/schema.sql
-- Run in Neon SQL Editor when OTP verify returns:
--   persistError: { code: "42703", message: "column i.phone_e164 does not exist" }
-- Safe to re-run (IF NOT EXISTS). Does not drop legacy users.phone if present.

ALTER TABLE auth_identities ADD COLUMN IF NOT EXISTS phone_e164 TEXT;
ALTER TABLE auth_identities ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE auth_identities ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS auth_identities_user_id_idx
  ON auth_identities (user_id);

CREATE INDEX IF NOT EXISTS auth_identities_phone_e164_idx
  ON auth_identities (phone_e164)
  WHERE phone_e164 IS NOT NULL;
