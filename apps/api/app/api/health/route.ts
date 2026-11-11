import { getDatabaseUrl, isAuthMock } from '@/lib/env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Deploy smoke check — no auth required. */
export async function GET() {
  return Response.json({
    ok: true,
    service: 'knowyourfood-api',
    authMock: isAuthMock(),
    databaseConfigured: Boolean(getDatabaseUrl()),
    timestamp: new Date().toISOString(),
  });
}
