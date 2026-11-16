import { sanitizeDbError } from '@/lib/db-errors';
import { isDatabaseConfigured, isAuthMock, isSmsConfigured } from '@/lib/env';
import {
  AuthHttpError,
  jsonError,
  mockVerifyOtp,
  type AuthSuccess,
  type OtpVerifyBody,
} from '@/lib/mock-auth';
import { msg91VerifyOtp } from '@/lib/msg91';
import { upsertPhoneUser } from '@/lib/users';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/otp/verify
 * Body: { verificationId, code, phoneE164? }
 *
 * Mock OTP (default): 123456 — override with AUTH_MOCK_OTP.
 * Live: MSG91 Verify OTP API, then Neon upsert when DATABASE_URL is set.
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

    let session: AuthSuccess;

    if (useMock) {
      session = mockVerifyOtp({
        verificationId: body.verificationId,
        code: body.code,
        phoneE164: body.phoneE164,
      });
    } else {
      if (!isSmsConfigured()) {
        throw new AuthHttpError(
          501,
          'sms_not_configured',
          'SMS verify not configured. Set AUTH_MOCK=true or set MSG91_AUTH_KEY and MSG91_TEMPLATE_ID.',
        );
      }
      if (!body.phoneE164) {
        throw new AuthHttpError(
          400,
          'invalid_phone',
          'phoneE164 is required for live SMS verify',
        );
      }
      session = await msg91VerifyOtp({
        verificationId: body.verificationId,
        code: body.code,
        phoneE164: body.phoneE164,
      });
    }

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
        const persistError = sanitizeDbError(dbErr);
        // AUTH_MOCK must still return a session (Expo smoke), but never hide the
        // upsert failure — persistError is the signal that Neon write failed.
        console.error(
          '[otp/verify] DB upsert failed',
          persistError.code,
          persistError.message,
          persistError.causeCode ?? '',
        );
        if (isAuthMock()) {
          return Response.json({
            ...session,
            persisted: false,
            persistError,
          });
        }
        throw dbErr;
      }
    }

    return Response.json({
      ...session,
      persisted: false,
      persistError: isDatabaseConfigured()
        ? { code: 'phone_required', message: 'phoneE164 required to persist' }
        : { code: 'db_not_configured', message: 'DATABASE_URL is not set' },
    });
  } catch (err) {
    return jsonError(err);
  }
}
