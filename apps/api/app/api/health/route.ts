import { pingDatabase } from '@/lib/db';
import {
  isAuthMock,
  isDatabaseConfigured,
  isGoogleConfigured,
  isSmsConfigured,
} from '@/lib/env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Deploy smoke check — no auth required. Includes live DB ping when configured. */
export async function GET() {
  const databaseConfigured = isDatabaseConfigured();
  const base = {
    ok: true,
    service: 'knowyourfood-api',
    authMock: isAuthMock(),
    smsConfigured: isSmsConfigured(),
    googleConfigured: isGoogleConfigured(),
    databaseConfigured,
    timestamp: new Date().toISOString(),
  };

  if (!databaseConfigured) {
    return Response.json({
      ...base,
      databaseReachable: false,
      databaseSchemaReady: false,
      recipesSchemaReady: false,
      shoppingSchemaReady: false,
    });
  }

  const ping = await pingDatabase();
  return Response.json({
    ...base,
    databaseReachable: ping.reachable,
    databaseSchemaReady: ping.schemaReady,
    recipesSchemaReady: ping.recipesSchemaReady ?? false,
    shoppingSchemaReady: ping.shoppingSchemaReady ?? false,
    ...(ping.error ? { databaseError: ping.error } : {}),
  });
}
