import { isAuthMock, isSmsConfigured } from '@/lib/env';
import {
  AuthHttpError,
  jsonError,
  mockStartOtp,
  normalizeIndiaPhone,
  type OtpStartBody,
} from '@/lib/mock-auth';
import { msg91SendOtp } from '@/lib/msg91';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/otp/start
 * Body: { phoneE164: "+91XXXXXXXXXX" }
 *
 * Mock (AUTH_MOCK=true, default): returns verificationId; SMS is not sent.
 * Live (AUTH_MOCK=false + MSG91 configured): sends OTP via MSG91 SendOTP v5.
 * Live without MSG91: 501 sms_not_configured.
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

    if (!isSmsConfigured()) {
      throw new AuthHttpError(
        501,
        'sms_not_configured',
        'SMS provider not configured. Set AUTH_MOCK=true or set MSG91_AUTH_KEY and MSG91_TEMPLATE_ID.',
      );
    }

    const result = await msg91SendOtp(phoneE164);
    return Response.json(result);
  } catch (err) {
    return jsonError(err);
  }
}
