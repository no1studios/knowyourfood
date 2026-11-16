/**
 * MSG91 SendOTP + Verify OTP (v5) — India-first live SMS.
 * Docs: https://docs.msg91.com/otp
 * API: POST/GET https://control.msg91.com/api/v5/otp[|/verify]
 *
 * We let MSG91 generate + store the OTP; verify uses their Verify API.
 * No OTP plaintext is stored in our DB.
 */

import { createHash, randomBytes } from 'crypto';

import { getMsg91Config, type Msg91Config } from './env';
import { AuthHttpError, normalizeIndiaPhone } from './mock-auth';

const MSG91_OTP_BASE = 'https://control.msg91.com/api/v5/otp';

type Msg91Response = {
  type?: string;
  message?: string | Record<string, unknown>;
  request_id?: string;
};

export type LiveOtpStartResult = {
  verificationId: string;
  mock: false;
  phoneE164: string;
  provider: 'msg91';
};

export type LiveOtpVerifyResult = {
  userId: string;
  phoneE164: string;
  provider: 'phone';
  idToken: string;
  mock: false;
};

/** MSG91 mobile param: digits with country code, no "+" (e.g. 919876543210). */
export function toMsg91Mobile(phoneE164: string): string {
  return normalizeIndiaPhone(phoneE164).replace(/\D/g, '');
}

function phoneHash(phoneE164: string): string {
  return createHash('sha256').update(phoneE164).digest('hex').slice(0, 12);
}

/** Opaque id binds the session to a phone without embedding the OTP. */
export function createMsg91VerificationId(phoneE164: string): string {
  const hash = phoneHash(phoneE164);
  const nonce = randomBytes(4).toString('hex');
  return `msg91_${hash}_${nonce}`;
}

export function assertVerificationMatchesPhone(
  verificationId: string,
  phoneE164: string,
): void {
  if (!verificationId.startsWith('msg91_')) {
    throw new AuthHttpError(
      400,
      'invalid_verification',
      'Missing or invalid verificationId for live SMS',
    );
  }
  const parts = verificationId.split('_');
  const hash = parts[1];
  if (!hash || hash !== phoneHash(phoneE164)) {
    throw new AuthHttpError(
      400,
      'invalid_verification',
      'verificationId does not match phoneE164',
    );
  }
}

function messageText(message: Msg91Response['message']): string {
  if (typeof message === 'string') return message;
  if (message && typeof message === 'object') {
    try {
      return JSON.stringify(message);
    } catch {
      return 'MSG91 error';
    }
  }
  return 'MSG91 error';
}

function isSuccess(body: Msg91Response): boolean {
  return (body.type ?? '').toLowerCase() === 'success';
}

async function msg91Fetch(
  url: string,
  config: Msg91Config,
  init?: RequestInit,
): Promise<Msg91Response> {
  const res = await fetch(url, {
    ...init,
    headers: {
      authkey: config.authKey,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  const text = await res.text().catch(() => '');
  let body: Msg91Response = {};
  try {
    body = text ? (JSON.parse(text) as Msg91Response) : {};
  } catch {
    body = { type: 'error', message: text || `HTTP ${res.status}` };
  }

  if (!res.ok || !isSuccess(body)) {
    const detail = messageText(body.message);
    // Never echo auth key; surface provider message for operators.
    console.error('[msg91]', res.status, detail.slice(0, 200));
    throw new AuthHttpError(
      res.status >= 400 && res.status < 500 ? 400 : 502,
      'sms_provider_error',
      detail || 'MSG91 request failed',
    );
  }

  return body;
}

/**
 * Send OTP via MSG91 SendOTP v5. MSG91 generates the code.
 * Requires MSG91_AUTH_KEY + MSG91_TEMPLATE_ID.
 */
export async function msg91SendOtp(phoneE164: string): Promise<LiveOtpStartResult> {
  const config = getMsg91Config();
  if (!config) {
    throw new AuthHttpError(
      501,
      'sms_not_configured',
      'SMS provider not configured. Set AUTH_MOCK=true or set MSG91_AUTH_KEY and MSG91_TEMPLATE_ID.',
    );
  }

  const normalized = normalizeIndiaPhone(phoneE164);
  const mobile = toMsg91Mobile(normalized);

  const params = new URLSearchParams({
    template_id: config.templateId,
    mobile,
    otp_length: String(config.otpLength),
    otp_expiry: String(config.otpExpiryMinutes),
  });
  if (config.senderId) {
    params.set('sender', config.senderId);
  }

  await msg91Fetch(`${MSG91_OTP_BASE}?${params.toString()}`, config, {
    method: 'POST',
    body: JSON.stringify({}),
  });

  return {
    verificationId: createMsg91VerificationId(normalized),
    mock: false,
    phoneE164: normalized,
    provider: 'msg91',
  };
}

/**
 * Verify OTP via MSG91 Verify API, then build a live phone session.
 * Caller is responsible for Neon upsert.
 */
export async function msg91VerifyOtp(args: {
  verificationId: string;
  code: string;
  phoneE164: string;
}): Promise<LiveOtpVerifyResult> {
  const config = getMsg91Config();
  if (!config) {
    throw new AuthHttpError(
      501,
      'sms_not_configured',
      'SMS verify not configured. Set AUTH_MOCK=true or set MSG91_AUTH_KEY and MSG91_TEMPLATE_ID.',
    );
  }

  const code = args.code.replace(/\D/g, '');
  if (code.length < 4 || code.length > 9) {
    throw new AuthHttpError(400, 'invalid_code', 'Enter the OTP from your SMS');
  }

  const normalized = normalizeIndiaPhone(args.phoneE164);
  assertVerificationMatchesPhone(args.verificationId, normalized);

  const mobile = toMsg91Mobile(normalized);
  const params = new URLSearchParams({
    otp: code,
    mobile,
  });

  try {
    await msg91Fetch(`${MSG91_OTP_BASE}/verify?${params.toString()}`, config, {
      method: 'GET',
    });
  } catch (err) {
    if (err instanceof AuthHttpError && err.code === 'sms_provider_error') {
      throw new AuthHttpError(401, 'invalid_code', 'Invalid or expired OTP');
    }
    throw err;
  }

  const idToken = `msg91_session_${createHash('sha256')
    .update(`${normalized}:${args.verificationId}:${code}`)
    .digest('hex')
    .slice(0, 24)}`;

  return {
    userId: `phone_${normalized.replace(/\D/g, '').slice(0, 16)}`,
    phoneE164: normalized,
    provider: 'phone',
    idToken,
    mock: false,
  };
}
