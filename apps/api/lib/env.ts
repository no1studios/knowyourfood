/**
 * Server env helpers. No secrets are logged.
 */

function read(name: string): string | undefined {
  const value = process.env[name];
  if (typeof value !== 'string') return undefined;
  let trimmed = value.trim();
  // Common paste mistake: wrapping quotes in Vercel / .env
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    trimmed = trimmed.slice(1, -1).trim();
  }
  return trimmed.length > 0 ? trimmed : undefined;
}

function flagTrue(name: string, defaultTrue = false): boolean {
  const raw = read(name);
  if (raw === undefined) return defaultTrue;
  const v = raw.toLowerCase();
  return v === '1' || v === 'true' || v === 'yes';
}

/** Mock/dev auth is on by default so Vercel deploy works before SMS/OAuth is wired. */
export function isAuthMock(): boolean {
  return flagTrue('AUTH_MOCK', true);
}

/** Deterministic OTP accepted in mock mode. Documented for Expo + local QA. */
export function getMockOtp(): string {
  return read('AUTH_MOCK_OTP') ?? '123456';
}

/**
 * Postgres URL for Neon (or compatible).
 * Prefers DATABASE_URL; falls back to Neon/Vercel integration aliases.
 */
export function getDatabaseUrl(): string | undefined {
  return (
    read('DATABASE_URL') ??
    read('POSTGRES_URL') ??
    read('POSTGRES_PRISMA_URL') ??
    read('DATABASE_URL_UNPOOLED') ??
    read('POSTGRES_URL_NON_POOLING')
  );
}

/** True when a database URL env var is set. Does not open a connection. */
export function isDatabaseConfigured(): boolean {
  return Boolean(getDatabaseUrl());
}
