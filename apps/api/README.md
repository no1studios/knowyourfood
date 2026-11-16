# Know Your Food API (`apps/api`)

Minimal **Next.js (App Router) + TypeScript** API for Vercel. Auth routes match the Expo client in `features/auth/` and the tech-spec sketch (`POST /auth/otp/…`, `POST /auth/oauth/{provider}` under the `/api` prefix).

Postgres via **Neon** (`@neondatabase/serverless`) when `DATABASE_URL` is set. **AUTH_MOCK still works with no database.**

## Vercel Import (after merge)

1. Open [Vercel](https://vercel.com) → **Add New…** → **Project**.
2. Import **`no1studios/knowyourfood`** (GitHub).
3. Set **Root Directory** to **`apps/api`** (Edit → select `apps/api`).
4. Framework Preset: **Next.js** (auto-detected via `vercel.json` / `package.json`).
5. Environment Variables (Project Settings → Environment Variables), at minimum:
   - `AUTH_MOCK` = `true` (**safe default** — deploy works before SMS/OAuth)
   - `AUTH_MOCK_OTP` = `123456` (optional; this is the default)
   - `DATABASE_URL` = (optional until Neon is attached — see below)
   - Leave `MSG91_*` / Google / Apple secrets empty while mocking
6. Deploy. Smoke-check: `https://<deployment>.vercel.app/api/health` (expect `authMock: true`, `smsConfigured: false` until MSG91 keys are set)

### Point the Expo app at the deployment

In the Expo app root `.env` / `.env.local` (or EAS secrets):

```bash
EXPO_PUBLIC_AUTH_API_URL=https://<deployment>.vercel.app/api
```

The client calls `{EXPO_PUBLIC_AUTH_API_URL}/auth/otp/start` → `/api/auth/otp/start` on this app.

## Attach Neon (Postgres)

Do this once so OTP verify can persist `users` + `auth_identities`. You never need to paste the connection string into chat — only into Neon → Vercel.

1. Open [Neon](https://console.neon.tech) → **Create project** (region close to your Vercel deploy).
2. Copy the **pooled** connection string (`postgresql://…@…-pooler…/neondb?sslmode=require`).
3. In **Vercel** → your API project → **Settings** → **Environment Variables**:
   - Name: `DATABASE_URL`
   - Value: paste the Neon connection string
   - Environments: **Production** and **Preview**
   - Save
4. In the **Neon SQL Editor**, paste and run [`db/schema.sql`](./db/schema.sql) (creates `users` + `auth_identities`).
5. **Redeploy** the Vercel project (Deployments → … → Redeploy, or push a commit).
6. Check health: `GET /api/health` should show `"databaseConfigured": true`, `"databaseReachable": true`, `"databaseSchemaReady": true`.
7. Verify OTP with a phone number; response includes `"persisted": true` and a UUID `userId` when the upsert succeeds.

If verify returns `"persisted": false`, check `persistError` in the JSON (and `databaseError` on `/api/health`). Common causes: wrong/quoted `DATABASE_URL`, URL points at a different Neon branch than the SQL Editor, or missing redeploy after setting the env var.

If `persistError` is Postgres `42703` (`column i.phone_e164 does not exist`), the Neon DB was created from an older table shape. Run [`db/migrate-phone-e164.sql`](./db/migrate-phone-e164.sql) in the Neon SQL Editor (or re-run [`db/schema.sql`](./db/schema.sql), which includes the same `ALTER … IF NOT EXISTS`). After deploy, `ensureAuthSchema` also applies those column upgrades automatically.

`AUTH_MOCK=true` continues to accept OTP `123456` without SMS. The API still upserts to Neon whenever `DATABASE_URL` is set — mock mode only skips real SMS.

**Do not wrap the connection string in quotes** when pasting into Vercel. Prefer the **pooled** string (`…-pooler…`, `sslmode=require`).

## Real SMS (MSG91 — India)

Live phone OTP uses **MSG91 SendOTP + Verify OTP (v5)**. Keep `AUTH_MOCK=true` until keys are ready; flipping Production to live SMS is an env change + redeploy (no code change).

### Required Vercel env keys (names only)

| Key | Required | Notes |
|-----|----------|--------|
| `AUTH_MOCK` | yes | Keep `true` until MSG91 works; set `false` for real SMS |
| `MSG91_AUTH_KEY` | for live | Auth key from MSG91 dashboard |
| `MSG91_TEMPLATE_ID` | for live | OTP template id (DLT-mapped for India) |
| `MSG91_SENDER_ID` | optional | 6-char DLT header if not set on the template |
| `MSG91_OTP_LENGTH` | optional | Default `6` |
| `MSG91_OTP_EXPIRY_MINUTES` | optional | Default `5` |

Twilio / Firebase placeholders remain in `.env.example` but are **not wired** — MSG91 is the India path.

### Behavior

| `AUTH_MOCK` | MSG91 configured? | Result |
|-------------|-------------------|--------|
| `true` (default) | ignored | Mock OTP `123456`; no SMS |
| `false` | yes (`AUTH_KEY` + `TEMPLATE_ID`) | Real SMS via MSG91; verify via MSG91 Verify API → Neon upsert |
| `false` | no | **501** `sms_not_configured` |

### MSG91 console setup (operator)

1. Sign up / log in at [MSG91 Control](https://control.msg91.com).
2. Complete **India DLT** registration (PE ID, sender header, OTP content template) if sending to Indian mobiles.
3. Copy **Auth Key** (Dashboard → Authkey / API).
4. Create an **OTP template** (OTP → Templates) with `##OTP##` placeholder; map the DLT template id. Copy the MSG91 **template id**.
5. In **Vercel** → API project → Environment Variables, set `MSG91_AUTH_KEY`, `MSG91_TEMPLATE_ID` (and optional `MSG91_SENDER_ID`) for **Production**. Leave `AUTH_MOCK=true` until a handset smoke passes on Preview if you prefer.
6. Redeploy. Health should show `"smsConfigured": true` (still `"authMock": true` until you flip).
7. When ready for Production live SMS: set `AUTH_MOCK=false`, redeploy, then start/verify with a real +91 number (SMS delivers the code — not `123456`).

Docs: [MSG91 OTP](https://docs.msg91.com/otp) · API host `https://control.msg91.com/api/v5/otp`.

## Local development

```bash
cd apps/api
cp .env.example .env.local   # AUTH_MOCK=true by default
npm install
npm run dev
```

- App: http://localhost:3000  
- Health: http://localhost:3000/api/health  

Optional local DB: set `DATABASE_URL` in `.env.local` to a Neon (or other Postgres) URL, run `db/schema.sql`, then OTP verify will upsert.

### Mock OTP

With `AUTH_MOCK=true` (default):

| Step | Request | Notes |
|------|---------|--------|
| Start | `POST /api/auth/otp/start` `{ "phoneE164": "+919876543210" }` | Returns `verificationId`, `mock: true`. **No SMS sent.** |
| Verify | `POST /api/auth/otp/verify` `{ "verificationId", "code": "123456", "phoneE164?" }` | Code must match `AUTH_MOCK_OTP` (default **123456**). With `DATABASE_URL` + `phoneE164`, upserts user and returns DB `userId`. |
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
| `GET` | `/api/health` | Deploy check (`authMock`, `smsConfigured`, `databaseConfigured`, live DB ping) |
| `POST` | `/api/auth/otp/start` | Start phone OTP (+91) — mock or MSG91 SendOTP |
| `POST` | `/api/auth/otp/verify` | Verify OTP → session (+ DB upsert when configured) |
| `POST` | `/api/auth/oauth/[provider]` | `google` \| `apple` token exchange stub |

## Schema

[`db/schema.sql`](./db/schema.sql) — minimal tables from the data model:

- `users` — id, display_name, preferred_locale, diet_prefs, open_to_orders, …
- `auth_identities` — provider (`phone` \| `google` \| `apple`), provider_subject, phone_e164, email; unique `(provider, provider_subject)`

## Env vars

See [`.env.example`](./.env.example): `DATABASE_URL`, `AUTH_MOCK`, `AUTH_MOCK_OTP`, **MSG91** (`MSG91_AUTH_KEY`, `MSG91_TEMPLATE_ID`, optional sender/length/expiry), Google / Apple OAuth placeholders. **No real secrets are committed.**

When `AUTH_MOCK=false` and MSG91 is unset, OTP routes return **501** `sms_not_configured`. Mock mode tolerates a missing or broken `DATABASE_URL` (falls back to in-memory mock session).

## Out of scope (this scaffold)

Twilio/Firebase SMS, full recipe/shopping schema, PostHog, UI redesign.
