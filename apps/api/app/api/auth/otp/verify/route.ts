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
import { linkPhoneIdentity, upsertPhoneUser } from '@/lib/users';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/otp/verify
 * Body: { verificationId, code, phoneE164?, linkUserId? }
 *
 * Mock OTP (default): 123456 — override with AUTH_MOCK_OTP.
 * Live: MSG91 Verify OTP API, then Neon upsert when DATABASE_URL is set.
 * When DATABASE_URL is set and phoneE164 is present, upserts users + auth_identities
 * and returns the DB user id. Without DB (or on DB error in mock mode), keeps mock session.
 *
 * When `linkUserId` is set (Profile “Add phone”), OTP still verifies, then the phone
 * identity is linked to that existing user — never creates a duplicate account.
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

    const linkUserId =
      typeof body.linkUserId === 'string' && body.linkUserId.trim()
        ? body.linkUserId.trim()
        : undefined;

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

    // Link path: attach phone to the signed-in user (Google/Apple), do not upsert a new user.
    if (linkUserId && session.phoneE164) {
      if (isDatabaseConfigured()) {
        try {
          const user = await linkPhoneIdentity({
            userId: linkUserId,
            phoneE164: session.phoneE164,
          });
          return Response.json({
            ...session,
            userId: user.id,
            phoneE164: user.phoneE164 ?? session.phoneE164,
            email: user.email ?? session.email,
            displayName: user.displayName ?? session.displayName,
            linked: true,
            persisted: true,
          });
        } catch (dbErr) {
          // Hard conflicts (phone owned by another account) always surface.
          if (dbErr instanceof AuthHttpError && dbErr.code === 'phone_in_use') {
            throw dbErr;
          }
          // Mock / non-persisted Google sessions may have non-UUID userIds —
          // still return a linked session so Profile can refresh locally.
          if (
            isAuthMock() &&
            dbErr instanceof AuthHttpError &&
            (dbErr.code === 'user_not_found' || dbErr.code === 'invalid_user')
          ) {
            return Response.json({
              ...session,
              userId: linkUserId,
              linked: true,
              persisted: false,
              persistError: { code: dbErr.code, message: dbErr.message },
            });
          }
          if (dbErr instanceof AuthHttpError) {
            throw dbErr;
          }
          const persistError = sanitizeDbError(dbErr);
          console.error(
            '[otp/verify] phone link failed',
            persistError.code,
            persistError.message,
            persistError.causeCode ?? '',
          );
          if (isAuthMock()) {
            return Response.json({
              ...session,
              userId: linkUserId,
              linked: true,
              persisted: false,
              persistError,
            });
          }
          throw dbErr;
        }
      }

      return Response.json({
        ...session,
        userId: linkUserId,
        linked: true,
        persisted: false,
        persistError: {
          code: 'db_not_configured',
          message: 'DATABASE_URL is not set',
        },
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
