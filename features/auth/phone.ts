/**
 * Phone OTP (+91) — live Verify API client or config-gated mock.
 * Live: POST {api}/auth/otp/start | /auth/otp/verify
 */

import { getAuthPublicConfig, isPhoneLive } from './config';
import { AuthError, type AuthSession, type OtpStartResult } from './types';

/** Normalize Indian mobile input to E.164 (+91XXXXXXXXXX). */
export function normalizeIndiaPhone(input: string): string {
  const digits = input.replace(/\D/g, '');
  let national = digits;
  if (national.startsWith('91') && national.length >= 12) {
    national = national.slice(-10);
  } else if (national.length > 10) {
    national = national.slice(-10);
  }
  if (national.length !== 10) {
    throw new AuthError('invalid_phone', 'Enter a valid 10-digit Indian mobile number');
  }
  return `+91${national}`;
}

export function formatPhoneDisplay(e164: string): string {
  const digits = e164.replace(/\D/g, '');
  const national = digits.startsWith('91') ? digits.slice(2) : digits;
  if (national.length !== 10) return e164;
  return `+91 ${national.slice(0, 5)} ${national.slice(5)}`;
}

function mockVerificationId(phoneE164: string): string {
  return `mock_${phoneE164.replace(/\D/g, '')}_${Date.now().toString(36)}`;
}

export async function startPhoneOtp(phoneInput: string): Promise<OtpStartResult> {
  const phoneE164 = normalizeIndiaPhone(phoneInput);
  const config = getAuthPublicConfig();

  if (!isPhoneLive(config) || !config.apiBaseUrl) {
    return {
      verificationId: mockVerificationId(phoneE164),
      mock: true,
      phoneE164,
    };
  }

  const res = await fetch(`${config.apiBaseUrl.replace(/\/$/, '')}/auth/otp/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ phoneE164 }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new AuthError('otp_start_failed', text || `OTP start failed (${res.status})`);
  }

  const data = (await res.json()) as { verificationId?: string };
  if (!data.verificationId) {
    throw new AuthError('otp_start_failed', 'OTP start response missing verificationId');
  }

  return { verificationId: data.verificationId, mock: false, phoneE164 };
}

export async function verifyPhoneOtp(args: {
  verificationId: string;
  code: string;
  phoneE164?: string;
}): Promise<AuthSession> {
  const code = args.code.replace(/\D/g, '');
  if (code.length !== 6) {
    throw new AuthError('invalid_code', 'Enter the 6-digit code');
  }

  const config = getAuthPublicConfig();
  const mock = args.verificationId.startsWith('mock_') || !isPhoneLive(config);

  if (mock) {
    if (code !== config.mockOtp) {
      throw new AuthError(
        'invalid_code',
        `Invalid code. In mock mode use ${config.mockOtp}`,
      );
    }
    const phoneE164 =
      args.phoneE164 ||
      (args.verificationId.startsWith('mock_')
        ? `+${args.verificationId.split('_')[1] ?? '91'}`
        : undefined);
    const now = new Date().toISOString();
    return {
      userId: `phone_${(phoneE164 || 'unknown').replace(/\D/g, '')}`,
      provider: 'phone',
      isGuest: false,
      phoneE164,
      providerSubject: phoneE164,
      issuedAt: now,
    };
  }

  const res = await fetch(`${config.apiBaseUrl!.replace(/\/$/, '')}/auth/otp/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      verificationId: args.verificationId,
      code,
      phoneE164: args.phoneE164,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new AuthError('otp_verify_failed', text || `OTP verify failed (${res.status})`);
  }

  const data = (await res.json()) as {
    userId?: string;
    phoneE164?: string;
    idToken?: string;
  };

  const phoneE164 = data.phoneE164 || args.phoneE164;
  return {
    userId: data.userId ?? `phone_${(phoneE164 || 'user').replace(/\D/g, '')}`,
    provider: 'phone',
    isGuest: false,
    phoneE164,
    providerSubject: phoneE164,
    idToken: data.idToken,
    issuedAt: new Date().toISOString(),
  };
}
