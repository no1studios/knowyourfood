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

/** Lazily imported to avoid circular init with recipes.ts → ensureAuthSchema. */
async function ensureRecipesTable(sql: Sql): Promise<void> {
  const { ensureRecipesSchema } = await import('./recipes');
  await ensureRecipesSchema(sql);
}

export { isDatabaseConfigured };

/** Returns a tagged-template SQL client, or null when DATABASE_URL is unset. */
export function getSql(): Sql | null {
  if (cached !== undefined) return cached;
  const url = getDatabaseUrl();
  if (!url) {
    cached = null;
    return null;
  }
  if (!/^postgres(ql)?:\/\//i.test(url)) {
    // Still construct — neon will throw a clear error on query — but avoid silent junk.
    console.error(
      '[db] DATABASE_URL does not look like a postgres URL (expected postgresql://…)',
    );
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

/** Columns required by upsert SQL (users.ts). Table existence alone is not enough. */
async function authIdentityColumnsReady(sql: Sql): Promise<boolean> {
  const rows = (await sql`
    SELECT
      COUNT(*) FILTER (WHERE column_name = 'phone_e164') > 0 AS phone_ok,
      COUNT(*) FILTER (WHERE column_name = 'email') > 0 AS email_ok,
      COUNT(*) FILTER (WHERE column_name = 'created_at') > 0 AS created_ok
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'auth_identities'
  `) as { phone_ok: boolean; email_ok: boolean; created_ok: boolean }[];
  const row = rows[0];
  return Boolean(row?.phone_ok && row?.email_ok && row?.created_ok);
}

/**
 * Ensure auth tables + required columns exist. Safe to call on every request;
 * runs at most once per cold start after a successful ensure.
 *
 * Important: `CREATE TABLE IF NOT EXISTS` does not add missing columns. Neon DBs
 * created from an older paste (e.g. phone on users, no phone_e164) still need
 * ALTER … ADD COLUMN. We always apply idempotent column/index upgrades.
 */
export async function ensureAuthSchema(sql: Sql = getSql()!): Promise<void> {
  if (!sql) {
    throw new Error('DATABASE_URL is not configured');
  }
  if (!schemaReady) {
    schemaReady = (async () => {
      const existing = (await sql`
        SELECT
          to_regclass('public.users') IS NOT NULL AS users_ok,
          to_regclass('public.auth_identities') IS NOT NULL AS identities_ok
      `) as { users_ok: boolean; identities_ok: boolean }[];

      const tablesOk = Boolean(
        existing[0]?.users_ok && existing[0]?.identities_ok,
      );

      if (!tablesOk) {
        // gen_random_uuid() is in core PG13+; pgcrypto is best-effort on Neon.
        try {
          await sql`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`;
        } catch (err) {
          console.error(
            '[db] CREATE EXTENSION pgcrypto skipped',
            sanitizeDbError(err).message,
          );
        }

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
      }

      // Align drifted tables with schema.sql (no-op when columns already exist).
      await sql`
        ALTER TABLE auth_identities
          ADD COLUMN IF NOT EXISTS phone_e164 TEXT
      `;
      await sql`
        ALTER TABLE auth_identities
          ADD COLUMN IF NOT EXISTS email TEXT
      `;
      await sql`
        ALTER TABLE auth_identities
          ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now()
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
  /** recipes table present (auto-migrated on ensure). */
  recipesSchemaReady?: boolean;
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
    try {
      await ensureRecipesTable(sql);
    } catch (recipesErr) {
      console.error(
        '[db] ensure recipes schema skipped',
        sanitizeDbError(recipesErr).message,
      );
    }
    const tables = (await sql`
      SELECT
        to_regclass('public.users') IS NOT NULL AS users_ok,
        to_regclass('public.auth_identities') IS NOT NULL AS identities_ok,
        to_regclass('public.recipes') IS NOT NULL AS recipes_ok
    `) as {
      users_ok: boolean;
      identities_ok: boolean;
      recipes_ok: boolean;
    }[];
    const row = tables[0];
    const tablesOk = Boolean(row?.users_ok && row?.identities_ok);
    if (!tablesOk) {
      return {
        reachable: true,
        schemaReady: false,
        recipesSchemaReady: Boolean(row?.recipes_ok),
        error: {
          code: 'db_schema_missing',
          message: 'users / auth_identities tables missing after ensure',
        },
      };
    }
    const columnsOk = await authIdentityColumnsReady(sql);
    return {
      reachable: true,
      schemaReady: columnsOk,
      recipesSchemaReady: Boolean(row?.recipes_ok),
      error: columnsOk
        ? undefined
        : {
            code: 'db_schema_columns_missing',
            message:
              'auth_identities missing required columns (phone_e164 / email / created_at)',
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
 * Retry on transient connect/fetch failures (Neon compute cold start / undici blips).
 */
export async function withDbRetry<T>(fn: () => Promise<T>): Promise<T> {
  const delaysMs = [0, 400, 1200];
  let lastErr: unknown;
  for (let i = 0; i < delaysMs.length; i++) {
    if (delaysMs[i] > 0) {
      await new Promise((r) => setTimeout(r, delaysMs[i]));
    }
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const info = sanitizeDbError(err);
      if (info.code !== 'db_connect_failed' || i === delaysMs.length - 1) {
        throw err;
      }
      console.error(
        '[db] transient connect failure; retrying',
        info.message,
        info.causeCode ?? '',
      );
    }
  }
  throw lastErr;
}
