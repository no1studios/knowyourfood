/**
 * Auth re-exports — implementation lives in `features/auth/`.
 */

export type {
  AuthCapability,
  AuthClient,
  AuthMode,
  AuthProvider,
  AuthSession,
  OAuthRequest,
  OtpStartRequest,
  OtpStartResult,
  OtpVerifyRequest,
} from '@/features/auth';
export {
  AuthError,
  authClient,
  getAuthCapabilities,
  getAuthPublicConfig,
  mergeHrefAfterAuth,
} from '@/features/auth';
