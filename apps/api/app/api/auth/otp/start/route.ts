import { isAuthMock } from '@/lib/env';
import {
  AuthHttpError,
  jsonError,
  mockStartOtp,
  normalizeIndiaPhone,
  type OtpStartBody,
} from '@/lib/mock-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/otp/start
 * Body: { phoneE164: "+91XXXXXXXXXX" }
 *
 * Mock (AUTH_MOCK=true, default): returns verificationId; SMS is not sent.
 * Live SMS providers are out of scope for this scaffold.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as OtpStartBody;
    if (!body.phoneE164) {
      throw new AuthHttpError(400, 'invalid_phone', 'phoneE164 is required');
    }
    const phoneE164 = normalizeIndiaPhone(body.phoneE164);

    if (isAuthMock()) {
      return Response.json(mockStartOtp(phoneE164));
    }

    // Live path not wired yet — stay deployable with an explicit error.
    throw new AuthHttpError(
      501,
      'sms_not_configured',
      'SMS provider not configured. Set AUTH_MOCK=true or wire Twilio/Firebase.',
    );
  } catch (err) {
    return jsonError(err);
  }
}
