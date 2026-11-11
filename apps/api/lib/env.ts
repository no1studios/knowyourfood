/**
 * Server env helpers. No secrets are logged.
 */

function read(name: string): string | undefined {
  const value = process.env[name];
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
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

export function getDatabaseUrl(): string | undefined {
  return read('DATABASE_URL');
}
