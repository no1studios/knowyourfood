# Know Your Food API (`apps/api`)

Minimal **Next.js (App Router) + TypeScript** API for Vercel. Auth routes match the Expo client in `features/auth/` and the tech-spec sketch (`POST /auth/otp/…`, `POST /auth/oauth/{provider}` under the `/api` prefix).

## Vercel Import (after merge)

1. Open [Vercel](https://vercel.com) → **Add New…** → **Project**.
2. Import **`no1studios/knowyourfood`** (GitHub).
3. Set **Root Directory** to **`apps/api`** (Edit → select `apps/api`).
4. Framework Preset: **Next.js** (auto-detected via `vercel.json` / `package.json`).
5. Environment Variables (Project Settings → Environment Variables), at minimum:
   - `AUTH_MOCK` = `true` (deploy works before SMS/OAuth)
   - `AUTH_MOCK_OTP` = `123456` (optional; this is the default)
   - `DATABASE_URL` = (optional until DB is wired)
   - Leave Twilio / Firebase / Google / Apple secrets empty while mocking
6. Deploy. Smoke-check: `https://<deployment>.vercel.app/api/health`

### Point the Expo app at the deployment

In the Expo app root `.env` / `.env.local` (or EAS secrets):

```bash
EXPO_PUBLIC_AUTH_API_URL=https://<deployment>.vercel.app/api
```

The client calls `{EXPO_PUBLIC_AUTH_API_URL}/auth/otp/start` → `/api/auth/otp/start` on this app.

## Local development

```bash
cd apps/api
cp .env.example .env.local   # AUTH_MOCK=true by default
npm install
npm run dev
```

- App: http://localhost:3000  
- Health: http://localhost:3000/api/health  

### Mock OTP

With `AUTH_MOCK=true` (default):

| Step | Request | Notes |
|------|---------|--------|
| Start | `POST /api/auth/otp/start` `{ "phoneE164": "+919876543210" }` | Returns `verificationId`, `mock: true`. **No SMS sent.** |
| Verify | `POST /api/auth/otp/verify` `{ "verificationId", "code": "123456", "phoneE164?" }` | Code must match `AUTH_MOCK_OTP` (default **123456**). |
| OAuth | `POST /api/auth/oauth/google` or `…/apple` | Returns a deterministic mock session; tokens are not validated. |

Example:

```bash
curl -s http://localhost:3000/api/health | jq .

curl -s -X POST http://localhost:3000/api/auth/otp/start \
  -H 'content-type: application/json' \
  -d '{"phoneE164":"+919876543210"}' | jq .

curl -s -X POST http://localhost:3000/api/auth/otp/verify \
  -H 'content-type: application/json' \
  -d '{"verificationId":"<from start>","code":"123456","phoneE164":"+919876543210"}' | jq .
```

## Routes

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/health` | Deploy check |
| `POST` | `/api/auth/otp/start` | Start phone OTP (+91) |
| `POST` | `/api/auth/otp/verify` | Verify OTP → session |
| `POST` | `/api/auth/oauth/[provider]` | `google` \| `apple` token exchange stub |

## Env vars

See [`.env.example`](./.env.example): `DATABASE_URL`, `AUTH_MOCK`, `AUTH_MOCK_OTP`, Twilio / Firebase placeholders, Google / Apple OAuth placeholders. **No real secrets are committed.**

When `AUTH_MOCK=false` and providers are unset, auth routes return **501** so misconfiguration is obvious.

## Out of scope (this scaffold)

Real SMS send, Postgres migrations, PostHog, shopping/recipes APIs, UI redesign.
