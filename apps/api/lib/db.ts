/**
 * Neon / Postgres client for Vercel serverless.
 * No-ops when DATABASE_URL is unset so AUTH_MOCK works without a DB.
 */

import { neon, type NeonQueryFunction } from '@neondatabase/serverless';

import { getDatabaseUrl, isDatabaseConfigured } from './env';

export type Sql = NeonQueryFunction<false, false>;

let cached: Sql | null | undefined;

export { isDatabaseConfigured };

/** Returns a tagged-template SQL client, or null when DATABASE_URL is unset. */
export function getSql(): Sql | null {
  if (cached !== undefined) return cached;
  const url = getDatabaseUrl();
  if (!url) {
    cached = null;
    return null;
  }
  cached = neon(url);
  return cached;
}

/** Reset cached client (tests / hot reload). */
export function resetDbClient(): void {
  cached = undefined;
}
