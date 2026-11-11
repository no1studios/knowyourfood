/**
 * Auth interfaces only — no Phone OTP, Google, or Apple implementation yet.
 */

export type AuthProvider = 'phone' | 'google' | 'apple' | 'guest';

export type AuthSession = {
  userId: string | null;
  provider: AuthProvider;
  isGuest: boolean;
  phoneE164?: string;
};

export type OtpStartRequest = { phoneE164: string };
export type OtpStartResult = { verificationId: string };
export type OtpVerifyRequest = { verificationId: string; code: string };
export type OAuthRequest = { provider: 'google' | 'apple' };

export interface AuthClient {
  getSession(): Promise<AuthSession | null>;
  startPhoneOtp(_req: OtpStartRequest): Promise<OtpStartResult>;
  verifyPhoneOtp(_req: OtpVerifyRequest): Promise<AuthSession>;
  signInWithOAuth(_req: OAuthRequest): Promise<AuthSession>;
  continueAsGuest(): Promise<AuthSession>;
  signOut(): Promise<void>;
}

/** Stub — throws until real providers are wired. */
export const authClient: AuthClient = {
  async getSession() {
    return { userId: null, provider: 'guest', isGuest: true };
  },
  async startPhoneOtp() {
    throw new Error('Phone OTP not implemented (scaffold stub)');
  },
  async verifyPhoneOtp() {
    throw new Error('Phone OTP verify not implemented (scaffold stub)');
  },
  async signInWithOAuth() {
    throw new Error('OAuth not implemented (scaffold stub)');
  },
  async continueAsGuest() {
    return { userId: null, provider: 'guest', isGuest: true };
  },
  async signOut() {
    return;
  },
};
