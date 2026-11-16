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

/**
 * MSG91 SendOTP (India-first). Required for live SMS when AUTH_MOCK=false.
 * Template ID comes from MSG91 dashboard (OTP → Templates); sender is usually
 * baked into the template — MSG91_SENDER_ID is optional override.
 */
export type Msg91Config = {
  authKey: string;
  templateId: string;
  senderId?: string;
  otpLength: number;
  otpExpiryMinutes: number;
};

export function getMsg91Config(): Msg91Config | undefined {
  const authKey = read('MSG91_AUTH_KEY');
  const templateId = read('MSG91_TEMPLATE_ID');
  if (!authKey || !templateId) return undefined;

  const lengthRaw = read('MSG91_OTP_LENGTH');
  const expiryRaw = read('MSG91_OTP_EXPIRY_MINUTES');
  const otpLength = lengthRaw ? Number.parseInt(lengthRaw, 10) : 6;
  const otpExpiryMinutes = expiryRaw ? Number.parseInt(expiryRaw, 10) : 5;

  return {
    authKey,
    templateId,
    senderId: read('MSG91_SENDER_ID'),
    otpLength:
      Number.isFinite(otpLength) && otpLength >= 4 && otpLength <= 9
        ? otpLength
        : 6,
    otpExpiryMinutes:
      Number.isFinite(otpExpiryMinutes) && otpExpiryMinutes >= 1
        ? otpExpiryMinutes
        : 5,
  };
}

/** True when MSG91 auth key + template id are set (no network call). */
export function isMsg91Configured(): boolean {
  return Boolean(getMsg91Config());
}

/** Live SMS is ready when MSG91 is configured. Twilio/Firebase placeholders are not wired. */
export function isSmsConfigured(): boolean {
  return isMsg91Configured();
}
