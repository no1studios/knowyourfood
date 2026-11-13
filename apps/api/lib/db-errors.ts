/**
 * Sanitize DB errors for API responses / logs (never include connection strings).
 */

export type DbErrorInfo = {
  /** Stable machine-readable code when available (Postgres SQLSTATE or driver). */
  code: string;
  /** Safe short message — no secrets. */
  message: string;
};

export function sanitizeDbError(err: unknown): DbErrorInfo {
  if (!err || typeof err !== 'object') {
    return { code: 'unknown', message: 'Unknown database error' };
  }

  const anyErr = err as {
    name?: string;
    message?: string;
    code?: string;
    sourceError?: { message?: string; cause?: unknown };
  };

  const pgCode =
    typeof anyErr.code === 'string' && anyErr.code.length > 0
      ? anyErr.code
      : undefined;

  const rawMessage =
    typeof anyErr.message === 'string' ? anyErr.message : 'Database error';

  // Strip anything that looks like a connection string or password fragment.
  const message = rawMessage
    .replace(/postgres(?:ql)?:\/\/\S+/gi, 'postgresql://[redacted]')
    .replace(/password[=:]\S+/gi, 'password=[redacted]')
    .slice(0, 240);

  let code = pgCode ?? 'db_error';
  const lower = message.toLowerCase();
  if (lower.includes('fetch failed') || lower.includes('connect')) {
    code = pgCode ?? 'db_connect_failed';
  } else if (
    lower.includes('does not exist') &&
    (lower.includes('relation') || lower.includes('table'))
  ) {
    code = pgCode ?? 'db_schema_missing';
  } else if (lower.includes('password authentication failed')) {
    code = pgCode ?? 'db_auth_failed';
  } else if (lower.includes('ssl')) {
    code = pgCode ?? 'db_ssl_failed';
  }

  return { code, message };
}
