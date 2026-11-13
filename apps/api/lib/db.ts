/**
 * Neon / Postgres client for Vercel serverless.
 * No-ops when DATABASE_URL is unset so AUTH_MOCK works without a DB.
 */

import { neon, type NeonQueryFunction } from '@neondatabase/serverless';

import { sanitizeDbError, type DbErrorInfo } from './db-errors';
import { getDatabaseUrl, isDatabaseConfigured } from './env';

export type Sql = NeonQueryFunction<false, false>;

let cached: Sql | null | undefined;
let schemaReady: Promise<void> | null = null;

export { isDatabaseConfigured };

/** Returns a tagged-template SQL client, or null when DATABASE_URL is unset. */
export function getSql(): Sql | null {
  if (cached !== undefined) return cached;
  const url = getDatabaseUrl();
  if (!url) {
    cached = null;
    return null;
  }
  // HTTP one-shot queries — correct for Vercel Node serverless.
  cached = neon(url);
  return cached;
}

/** Reset cached client (tests / hot reload). */
export function resetDbClient(): void {
  cached = undefined;
  schemaReady = null;
}

/**
 * Ensure auth tables exist (IF NOT EXISTS). Safe to call on every request;
 * runs at most once per cold start. Fixes "schema applied to wrong branch"
 * and first-deploy cases where SQL Editor was skipped.
 */
export async function ensureAuthSchema(sql: Sql = getSql()!): Promise<void> {
  if (!sql) {
    throw new Error('DATABASE_URL is not configured');
  }
  if (!schemaReady) {
    schemaReady = (async () => {
      // Neon HTTP: one statement per request.
      await sql`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`;
      await sql`
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          display_name TEXT,
          preferred_locale TEXT NOT NULL DEFAULT 'en'
            CHECK (preferred_locale IN ('en', 'hi')),
          diet_prefs TEXT[] NOT NULL DEFAULT '{}',
          open_to_orders BOOLEAN NOT NULL DEFAULT false,
          onboarding_recipe_sources TEXT[]
        )
      `;
      await sql`
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
        )
      `;
      await sql`
        CREATE INDEX IF NOT EXISTS auth_identities_user_id_idx
          ON auth_identities (user_id)
      `;
      await sql`
        CREATE INDEX IF NOT EXISTS auth_identities_phone_e164_idx
          ON auth_identities (phone_e164)
          WHERE phone_e164 IS NOT NULL
      `;
    })().catch((err) => {
      // Allow retry on next request after a transient failure.
      schemaReady = null;
      throw err;
    });
  }
  await schemaReady;
}

export type DatabasePing = {
  reachable: boolean;
  schemaReady: boolean;
  error?: DbErrorInfo;
};

/** Live connectivity + schema check for /api/health (no secrets). */
export async function pingDatabase(): Promise<DatabasePing> {
  const sql = getSql();
  if (!sql) {
    return {
      reachable: false,
      schemaReady: false,
      error: { code: 'db_not_configured', message: 'DATABASE_URL is not set' },
    };
  }

  try {
    await sql`SELECT 1 AS ok`;
  } catch (err) {
    return {
      reachable: false,
      schemaReady: false,
      error: sanitizeDbError(err),
    };
  }

  try {
    await ensureAuthSchema(sql);
    const tables = (await sql`
      SELECT
        to_regclass('public.users') IS NOT NULL AS users_ok,
        to_regclass('public.auth_identities') IS NOT NULL AS identities_ok
    `) as { users_ok: boolean; identities_ok: boolean }[];
    const row = tables[0];
    const ok = Boolean(row?.users_ok && row?.identities_ok);
    return {
      reachable: true,
      schemaReady: ok,
      error: ok
        ? undefined
        : {
            code: 'db_schema_missing',
            message: 'users / auth_identities tables missing after ensure',
          },
    };
  } catch (err) {
    return {
      reachable: true,
      schemaReady: false,
      error: sanitizeDbError(err),
    };
  }
}

/**
 * Run a query with one retry on transient connect/fetch failures.
 */
export async function withDbRetry<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    const info = sanitizeDbError(err);
    if (info.code !== 'db_connect_failed') throw err;
    // Brief pause then retry once (cold Neon / flaky fetch).
    await new Promise((r) => setTimeout(r, 150));
    return await fn();
  }
}
