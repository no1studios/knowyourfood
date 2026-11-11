/**
 * Deterministic mock auth for AUTH_MOCK=true (default).
 * Matches Expo client contract in features/auth/phone.ts (+ google/apple).
 */

import { createHash, randomBytes } from 'crypto';

import { getMockOtp, isAuthMock } from './env';

const INDIA_E164 = /^\+91[6-9]\d{9}$/;

export type OtpStartBody = {
  phoneE164?: string;
};

export type OtpVerifyBody = {
  verificationId?: string;
  code?: string;
  phoneE164?: string;
};

export type OAuthBody = {
  idToken?: string;
  identityToken?: string;
  user?: string;
  email?: string;
  displayName?: string;
};

export type AuthSuccess = {
  userId: string;
  phoneE164?: string;
  email?: string;
  displayName?: string;
  idToken?: string;
  provider: 'phone' | 'google' | 'apple';
  mock: boolean;
};

export function normalizeIndiaPhone(input: string): string {
  const digits = input.replace(/\D/g, '');
  let national = digits;
  if (national.startsWith('91') && national.length >= 12) {
    national = national.slice(-10);
  } else if (national.length > 10) {
    national = national.slice(-10);
  }
  if (national.length !== 10) {
    throw new AuthHttpError(400, 'invalid_phone', 'Enter a valid 10-digit Indian mobile number');
  }
  const e164 = `+91${national}`;
  if (!INDIA_E164.test(e164)) {
    throw new AuthHttpError(400, 'invalid_phone', 'Enter a valid Indian mobile number (+91)');
  }
  return e164;
}

/** Opaque verification id — encodes phone hash; no OTP in the id. */
export function createMockVerificationId(phoneE164: string): string {
  const phoneHash = createHash('sha256').update(phoneE164).digest('hex').slice(0, 12);
  const nonce = randomBytes(4).toString('hex');
  return `mock_${phoneHash}_${nonce}`;
}

export function mockStartOtp(phoneE164: string) {
  return {
    verificationId: createMockVerificationId(phoneE164),
    mock: true as const,
    phoneE164,
    /** Hint for local/dev only — never log the code in production analytics. */
    hint: `Mock mode: use OTP ${getMockOtp()}`,
  };
}

export function mockVerifyOtp(args: {
  verificationId: string;
  code: string;
  phoneE164?: string;
}): AuthSuccess {
  const code = args.code.replace(/\D/g, '');
  if (code.length !== 6) {
    throw new AuthHttpError(400, 'invalid_code', 'Enter the 6-digit code');
  }
  const expected = getMockOtp();
  if (code !== expected) {
    throw new AuthHttpError(
      401,
      'invalid_code',
      `Invalid code. In mock mode use ${expected}`,
    );
  }
  if (!args.verificationId || args.verificationId.length < 8) {
    throw new AuthHttpError(400, 'invalid_verification', 'Missing or invalid verificationId');
  }

  const phoneE164 = args.phoneE164
    ? normalizeIndiaPhone(args.phoneE164)
    : undefined;
  const subject = phoneE164 ?? args.verificationId;
  const userId = `phone_${(phoneE164 ?? args.verificationId).replace(/\D/g, '').slice(0, 16) || 'user'}`;

  return {
    userId,
    phoneE164,
    provider: 'phone',
    idToken: `mock_session_${createHash('sha256').update(subject + code).digest('hex').slice(0, 24)}`,
    mock: true,
  };
}

export function mockOAuth(
  provider: 'google' | 'apple',
  body: OAuthBody,
): AuthSuccess {
  const token = body.idToken || body.identityToken || 'mock-token';
  const subject =
    body.user ||
    body.email ||
    createHash('sha256').update(`${provider}:${token}`).digest('hex').slice(0, 16);

  if (provider === 'google') {
    return {
      userId: `google_${subject}`,
      email: body.email ?? 'mock.user@gmail.com',
      displayName: body.displayName ?? 'Mock Google User',
      provider: 'google',
      idToken: token,
      mock: true,
    };
  }

  return {
    userId: `apple_${subject}`,
    email: body.email ?? 'mock.user@privaterelay.appleid.com',
    displayName: body.displayName ?? 'Mock Apple User',
    provider: 'apple',
    idToken: token,
    mock: true,
  };
}

export class AuthHttpError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'AuthHttpError';
    this.status = status;
    this.code = code;
  }
}

export function jsonError(err: unknown): Response {
  if (err instanceof AuthHttpError) {
    return Response.json(
      { error: err.code, message: err.message, mock: isAuthMock() },
      { status: err.status },
    );
  }
  const message = err instanceof Error ? err.message : 'Internal error';
  return Response.json({ error: 'internal_error', message }, { status: 500 });
}
