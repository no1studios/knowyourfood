# Auth feature

Client auth for Know Your Food: **Phone OTP (+91)**, **Google SSO**, **Apple Sign-In (iOS)**, plus **Continue as guest**.

Without live credentials the UI still runs via a **config-gated mock** (no crash). Real providers activate when env is set.

## Env vars (`EXPO_PUBLIC_*` only — no secrets in git)

| Variable | Purpose |
|----------|---------|
| `EXPO_PUBLIC_AUTH_API_URL` | Base URL for Verify API (`POST /auth/otp/start`, `/auth/otp/verify`, `/auth/oauth/google`, `/auth/oauth/apple`) |
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | Google OAuth web / Expo client ID |
| `EXPO_PUBLIC_GOOGLE_CLIENT_ID` | Alias for web client ID |
| `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` | iOS Google client ID |
| `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` | Android Google client ID |
| `EXPO_PUBLIC_AUTH_MOCK` | `true` to force mock even when keys exist |
| `EXPO_PUBLIC_AUTH_MOCK_OTP` | Mock SMS code (default `123456`) |

Put values in `.env` / `.env.local` (gitignored) or your Expo EAS secrets. Do not commit private keys.

## Behaviour

| Provider | Live when | Mock when |
|----------|-----------|-----------|
| Phone OTP | `EXPO_PUBLIC_AUTH_API_URL` set | Missing API URL or `AUTH_MOCK=true` — accept mock OTP |
| Google | Google client ID set | Missing ID — simulated success after short delay |
| Apple | iOS + Apple Sign-In available | Non-iOS hidden; unavailable / cancel→error; `__DEV__` capability miss → mock |

Session persists in SecureStore (native) or AsyncStorage (web) under `kyf.auth.session.v1`. After success the app opens the existing guest→account **merge** stub.

## Test without keys

1. `npx expo start` → open web or device
2. AccountPrompt → **Continue with phone** → enter `+91…` → **Send code**
3. Enter OTP `123456` → merge modal → confirm → signed-in (banner suppressed)
4. Or **Continue with Google** (mock) / on iOS **Continue with Apple**
5. **Continue as guest** / **Not now** leave guest store unsigned
