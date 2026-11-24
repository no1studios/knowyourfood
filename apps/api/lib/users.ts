/**
 * Persist User + auth_identities after successful OTP / OAuth verify.
 * Only runs when DATABASE_URL is set; callers must keep mock behavior otherwise.
 */

import { ensureAuthSchema, getSql, withDbRetry } from './db';
import { AuthHttpError } from './mock-auth';

export type AuthProvider = 'phone' | 'google' | 'apple';

export type PersistedUser = {
  id: string;
  displayName: string | null;
  phoneE164?: string;
  email?: string;
  provider: AuthProvider;
};

type IdentityRow = {
  user_id: string;
  display_name: string | null;
  phone_e164: string | null;
  email: string | null;
  provider: AuthProvider;
};

/**
 * Upsert phone identity → user. provider_subject is the E.164 number.
 * Returns existing user when the identity already exists.
 */
export async function upsertPhoneUser(phoneE164: string): Promise<PersistedUser> {
  return upsertIdentity({
    provider: 'phone',
    providerSubject: phoneE164,
    phoneE164,
  });
}

/**
 * Upsert Google/Apple identity → user (ready for live OAuth; unused while AUTH_MOCK).
 */
export async function upsertOAuthUser(args: {
  provider: 'google' | 'apple';
  providerSubject: string;
  email?: string;
  displayName?: string;
}): Promise<PersistedUser> {
  return upsertIdentity({
    provider: args.provider,
    providerSubject: args.providerSubject,
    email: args.email,
    displayName: args.displayName,
  });
}

/**
 * Link a verified phone identity onto an existing user (e.g. Google session).
 * Does not create a new user. Idempotent when the phone is already on this user.
 * Conflicts when the phone identity belongs to a different user.
 */
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function linkPhoneIdentity(args: {
  userId: string;
  phoneE164: string;
}): Promise<PersistedUser> {
  const sql = getSql();
  if (!sql) {
    throw new AuthHttpError(
      503,
      'database_unavailable',
      'DATABASE_URL is not configured',
    );
  }

  if (!UUID_RE.test(args.userId)) {
    throw new AuthHttpError(
      400,
      'invalid_user',
      'linkUserId must be a persisted user id (UUID)',
    );
  }

  const phoneE164 = args.phoneE164;

  return withDbRetry(async () => {
    await ensureAuthSchema(sql);

    const users = (await sql`
      SELECT id, display_name
      FROM users
      WHERE id = ${args.userId}::uuid
      LIMIT 1
    `) as { id: string; display_name: string | null }[];

    const user = users[0];
    if (!user) {
      throw new AuthHttpError(404, 'user_not_found', 'Signed-in user was not found');
    }

    const existingPhone = (await sql`
      SELECT
        i.user_id,
        u.display_name,
        i.phone_e164,
        i.email,
        i.provider
      FROM auth_identities i
      JOIN users u ON u.id = i.user_id
      WHERE i.provider = 'phone'
        AND i.provider_subject = ${phoneE164}
      LIMIT 1
    `) as IdentityRow[];

    if (existingPhone.length > 0) {
      const row = existingPhone[0];
      if (row.user_id !== args.userId) {
        throw new AuthHttpError(
          409,
          'phone_in_use',
          'This phone number is already linked to another account',
        );
      }
      return {
        id: row.user_id,
        displayName: row.display_name,
        phoneE164: row.phone_e164 ?? phoneE164,
        email: row.email ?? undefined,
        provider: 'phone',
      };
    }

    await sql`
      INSERT INTO auth_identities (
        user_id,
        provider,
        provider_subject,
        phone_e164,
        email
      )
      VALUES (
        ${args.userId}::uuid,
        'phone',
        ${phoneE164},
        ${phoneE164},
        NULL
      )
    `;

    // Prefer email from an existing OAuth identity on the same user.
    const oauth = (await sql`
      SELECT email, provider
      FROM auth_identities
      WHERE user_id = ${args.userId}::uuid
        AND provider IN ('google', 'apple')
      ORDER BY created_at ASC
      LIMIT 1
    `) as { email: string | null; provider: AuthProvider }[];

    return {
      id: user.id,
      displayName: user.display_name,
      phoneE164,
      email: oauth[0]?.email ?? undefined,
      provider: 'phone',
    };
  });
}

async function upsertIdentity(args: {
  provider: AuthProvider;
  providerSubject: string;
  phoneE164?: string;
  email?: string;
  displayName?: string;
}): Promise<PersistedUser> {
  const sql = getSql();
  if (!sql) {
    throw new AuthHttpError(
      503,
      'database_unavailable',
      'DATABASE_URL is not configured',
    );
  }

  return withDbRetry(async () => {
    // Idempotent: creates tables if schema was never applied (or wrong branch).
    await ensureAuthSchema(sql);

    const existing = (await sql`
      SELECT
        i.user_id,
        u.display_name,
        i.phone_e164,
        i.email,
        i.provider
      FROM auth_identities i
      JOIN users u ON u.id = i.user_id
      WHERE i.provider = ${args.provider}
        AND i.provider_subject = ${args.providerSubject}
      LIMIT 1
    `) as IdentityRow[];

    if (existing.length > 0) {
      const row = existing[0];
      return {
        id: row.user_id,
        displayName: row.display_name,
        phoneE164: row.phone_e164 ?? undefined,
        email: row.email ?? undefined,
        provider: row.provider,
      };
    }

    const createdUsers = (await sql`
      INSERT INTO users (display_name)
      VALUES (${args.displayName ?? null})
      RETURNING id, display_name
    `) as { id: string; display_name: string | null }[];

    const user = createdUsers[0];
    if (!user) {
      throw new AuthHttpError(500, 'user_create_failed', 'Failed to create user');
    }

    await sql`
      INSERT INTO auth_identities (
        user_id,
        provider,
        provider_subject,
        phone_e164,
        email
      )
      VALUES (
        ${user.id},
        ${args.provider},
        ${args.providerSubject},
        ${args.phoneE164 ?? null},
        ${args.email ?? null}
      )
      ON CONFLICT (provider, provider_subject) DO NOTHING
    `;

    // Race: another request may have inserted the identity; re-read canonical row.
    const confirmed = (await sql`
      SELECT
        i.user_id,
        u.display_name,
        i.phone_e164,
        i.email,
        i.provider
      FROM auth_identities i
      JOIN users u ON u.id = i.user_id
      WHERE i.provider = ${args.provider}
        AND i.provider_subject = ${args.providerSubject}
      LIMIT 1
    `) as IdentityRow[];

    const row = confirmed[0];
    if (!row) {
      throw new AuthHttpError(
        500,
        'identity_create_failed',
        'Failed to create auth identity',
      );
    }

    // Orphan user if we lost the race (another txn owns the identity).
    if (row.user_id !== user.id) {
      await sql`DELETE FROM users WHERE id = ${user.id}`;
    }

    return {
      id: row.user_id,
      displayName: row.display_name,
      phoneE164: row.phone_e164 ?? undefined,
      email: row.email ?? undefined,
      provider: row.provider,
    };
  });
}
