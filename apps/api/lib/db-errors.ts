/**
 * Sanitize DB errors for API responses / logs (never include connection strings).
 */

export type DbErrorInfo = {
  /** Stable machine-readable code when available (Postgres SQLSTATE or driver). */
  code: string;
  /** Safe short message — no secrets. */
  message: string;
  /** Low-level network / undici cause code when present (e.g. ENOTFOUND). */
  causeCode?: string;
};

function causeCodeOf(err: unknown): string | undefined {
  if (!err || typeof err !== 'object') return undefined;
  const anyErr = err as {
    code?: unknown;
    cause?: unknown;
    sourceError?: { code?: unknown; cause?: unknown };
  };
  const direct =
    typeof anyErr.code === 'string' || typeof anyErr.code === 'number'
      ? String(anyErr.code)
      : undefined;
  if (direct && !/^[0-9A-Z]{5}$/.test(direct)) {
    // Prefer socket/undici codes over PG SQLSTATE here.
    if (/^[A-Z_]+$/i.test(direct)) return direct;
  }
  const source = anyErr.sourceError;
  if (source) {
    const fromSource = causeCodeOf(source);
    if (fromSource) return fromSource;
  }
  if (anyErr.cause) return causeCodeOf(anyErr.cause);
  return typeof direct === 'string' ? direct : undefined;
}

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
    typeof anyErr.code === 'string' && /^[0-9A-Z]{5}$/.test(anyErr.code)
      ? anyErr.code
      : undefined;

  const rawMessage =
    typeof anyErr.message === 'string' ? anyErr.message : 'Database error';

  // Strip anything that looks like a connection string or password fragment.
  const message = rawMessage
    .replace(/postgres(?:ql)?:\/\/\S+/gi, 'postgresql://[redacted]')
    .replace(/password[=:]\S+/gi, 'password=[redacted]')
    .slice(0, 240);

  const causeCode = causeCodeOf(err);

  let code = pgCode ?? 'db_error';
  const lower = message.toLowerCase();
  if (lower.includes('fetch failed') || lower.includes('connecting to database')) {
    code = 'db_connect_failed';
  } else if (
    lower.includes('does not exist') &&
    (lower.includes('relation') || lower.includes('table'))
  ) {
    code = pgCode ?? 'db_schema_missing';
  } else if (lower.includes('password authentication failed')) {
    code = pgCode ?? 'db_auth_failed';
  } else if (lower.includes('ssl')) {
    code = pgCode ?? 'db_ssl_failed';
  } else if (lower.includes('endpoint id')) {
    code = 'db_endpoint_id';
  }

  return causeCode ? { code, message, causeCode } : { code, message };
}
