/** Auth feature types — mirrors data-model Identity + Session client shape. */

export type AuthProvider = 'phone' | 'google' | 'apple' | 'guest';

export type AuthSession = {
  userId: string | null;
  provider: AuthProvider;
  isGuest: boolean;
  phoneE164?: string;
  email?: string;
  displayName?: string;
  /** Opaque provider subject / id token hash for local identity. */
  providerSubject?: string;
  /** Access or ID token when a live provider issued one (never logged). */
  idToken?: string;
  /** ISO timestamp when the local session was written. */
  issuedAt: string;
};

export type OtpStartRequest = { phoneE164: string };
export type OtpStartResult = {
  verificationId: string;
  /** True when SMS was not sent and local mock verify should be used. */
  mock: boolean;
  phoneE164: string;
};

export type OtpVerifyRequest = {
  verificationId: string;
  code: string;
  phoneE164?: string;
};

export type OAuthRequest = { provider: 'google' | 'apple' };

export type AuthMode = 'live' | 'mock';

export type AuthCapability = {
  phone: boolean;
  google: boolean;
  apple: boolean;
  mode: AuthMode;
};

export interface AuthClient {
  getCapabilities(): AuthCapability;
  getSession(): Promise<AuthSession | null>;
  startPhoneOtp(req: OtpStartRequest): Promise<OtpStartResult>;
  verifyPhoneOtp(req: OtpVerifyRequest): Promise<AuthSession>;
  signInWithOAuth(req: OAuthRequest): Promise<AuthSession>;
  continueAsGuest(): Promise<AuthSession>;
  signOut(): Promise<void>;
}

export class AuthError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
  }
}
