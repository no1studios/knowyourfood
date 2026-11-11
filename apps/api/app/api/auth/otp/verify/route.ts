import { isAuthMock } from '@/lib/env';
import {
  AuthHttpError,
  jsonError,
  mockVerifyOtp,
  type OtpVerifyBody,
} from '@/lib/mock-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/otp/verify
 * Body: { verificationId, code, phoneE164? }
 *
 * Mock OTP (default): 123456 — override with AUTH_MOCK_OTP.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as OtpVerifyBody;
    if (!body.verificationId || !body.code) {
      throw new AuthHttpError(
        400,
        'invalid_request',
        'verificationId and code are required',
      );
    }

    if (isAuthMock() || body.verificationId.startsWith('mock_')) {
      const session = mockVerifyOtp({
        verificationId: body.verificationId,
        code: body.code,
        phoneE164: body.phoneE164,
      });
      return Response.json(session);
    }

    throw new AuthHttpError(
      501,
      'sms_not_configured',
      'SMS verify not configured. Set AUTH_MOCK=true or wire Twilio/Firebase.',
    );
  } catch (err) {
    return jsonError(err);
  }
}
