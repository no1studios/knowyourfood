import { pingDatabase } from '@/lib/db';
import { isAuthMock, isDatabaseConfigured } from '@/lib/env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Deploy smoke check — no auth required. Includes live DB ping when configured. */
export async function GET() {
  const databaseConfigured = isDatabaseConfigured();
  const base = {
    ok: true,
    service: 'knowyourfood-api',
    authMock: isAuthMock(),
    databaseConfigured,
    timestamp: new Date().toISOString(),
  };

  if (!databaseConfigured) {
    return Response.json({
      ...base,
      databaseReachable: false,
      databaseSchemaReady: false,
    });
  }

  const ping = await pingDatabase();
  return Response.json({
    ...base,
    databaseReachable: ping.reachable,
    databaseSchemaReady: ping.schemaReady,
    ...(ping.error ? { databaseError: ping.error } : {}),
  });
}
