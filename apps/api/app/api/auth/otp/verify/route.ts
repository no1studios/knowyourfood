import { isDatabaseConfigured, isAuthMock } from '@/lib/env';
import {
  AuthHttpError,
  jsonError,
  mockVerifyOtp,
  type OtpVerifyBody,
} from '@/lib/mock-auth';
import { upsertPhoneUser } from '@/lib/users';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/otp/verify
 * Body: { verificationId, code, phoneE164? }
 *
 * Mock OTP (default): 123456 — override with AUTH_MOCK_OTP.
 * When DATABASE_URL is set and phoneE164 is present, upserts users + auth_identities
 * and returns the DB user id. Without DB (or on DB error in mock mode), keeps mock session.
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

    const useMock =
      isAuthMock() || body.verificationId.startsWith('mock_');

    if (!useMock) {
      // Live SMS verify not wired yet — DB upsert is ready once a provider lands.
      throw new AuthHttpError(
        501,
        'sms_not_configured',
        'SMS verify not configured. Set AUTH_MOCK=true or wire Twilio/Firebase.',
      );
    }

    const session = mockVerifyOtp({
      verificationId: body.verificationId,
      code: body.code,
      phoneE164: body.phoneE164,
    });

    // Persist when Neon/Postgres is attached. AUTH_MOCK still works with no DB.
    if (isDatabaseConfigured() && session.phoneE164) {
      try {
        const user = await upsertPhoneUser(session.phoneE164);
        return Response.json({
          ...session,
          userId: user.id,
          phoneE164: user.phoneE164 ?? session.phoneE164,
          displayName: user.displayName ?? undefined,
          persisted: true,
        });
      } catch (dbErr) {
        // Never break mock/dev auth if the DB is misconfigured.
        if (isAuthMock()) {
          console.error(
            '[otp/verify] DB upsert failed; returning mock session',
            dbErr instanceof Error ? dbErr.message : 'unknown',
          );
          return Response.json({ ...session, persisted: false });
        }
        throw dbErr;
      }
    }

    return Response.json(session);
  } catch (err) {
    return jsonError(err);
  }
}
