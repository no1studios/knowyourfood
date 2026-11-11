# Know Your Food

India-first personal recipe app — Expo React Native (TypeScript) + Expo Router.

Expo React Native app with locked DS theme tokens and a first UI slice matching MVP screens v2:

- Onboarding language → diet → source (01–03)
- My Recipes empty (04b) and guest home with hero (04)
- Import (05), Recipe detail (06), Share sheet (06b), Auth phone + OTP (09 + guest continue-as-guest)
- Guest AccountPrompt A1–A6, Merge C1–C4, Shopping checklist (08)
- Guest local store (AsyncStorage): recipes, diet/sources, checklist, locale, prompt events, signed-in claim
- Auth client: Phone OTP (+91), Google SSO, Apple Sign-In (iOS) with config-gated mock when keys are missing
- DS primitives: Button, Wordmark, FoodPhoto, RecipeCard, EmptyState, ShareSheet, ListRow, Modal, floating BottomNav, etc.

Guest data persists on-device via AsyncStorage (`kyf.guest.v1`). Auth session persists via SecureStore / AsyncStorage (`kyf.auth.session.v1`). Auth API lives in **`apps/api`** (Next.js on Vercel). PostHog remains out of scope for this slice.

## Run

```bash
npm install
npx expo start
```

Then press `w` in the Expo terminal to open web (or open the URL Expo prints for web). Prefer that over a bare Metro tab if the page looks empty — web is configured as a single-page app (`web.output: "single"`).

Other scripts:

```bash
npm run android
npm run ios    # macOS + Xcode
npm run web
```

## Design lock (do not redesign from scratch)

Canonical product docs live in the Project store (not this git repo):

| Doc | Path |
|-----|------|
| Design lock handoff | `docs/design-lock.md` |
| Design system | `docs/design-system.md` + `docs/design-system-export/` |
| MVP screens v2 | `docs/mvp-screens.md` + `docs/mvp-screens-export/KYF MVP Screens v2.dc.html` |
| Guest flows | `docs/guest-flows.md` + `docs/guest-flows-export/` |
| Tech spec | `docs/tech-spec.md` |
| PRD | `docs/prd.md` |

**Tokens in app:** `src/theme/kyf-theme.ts` is copied from `design-system-export/exports/kyf-theme.ts`. Regenerate from `tokens.json` when tokens change — **do not hand-edit values**.

Key locked visuals:

- Primary Mirchi `#d93a14`
- Canvas bg `#f7f6f2`
- Fonts: Plus Jakarta Sans + Mukta (loaded via `@expo-google-fonts/*`)
- Floating pill `BottomNav` from MVP v2 frames (inset 12, `radius-full`, `shadow-3`) — not the docked DS CSS alone

## Project layout

```
app/                 # Expo Router routes (onboarding, tabs, recipe, import, auth, …)
apps/api/            # Next.js App Router API — Vercel Root Directory = apps/api
components/          # BottomNav, StubScreen, ThemeProvider
features/            # recipes, import, auth, shopping, share barrels
lib/                 # i18n, api/db/auth/analytics stubs
src/theme/           # Locked DS theme (kyf-theme.ts)
```

## Vercel API (`apps/api`)

Import the repo in Vercel with **Root Directory `apps/api`** (Framework: Next.js). See [`apps/api/README.md`](./apps/api/README.md) for env vars, mock OTP (`123456`), Neon `DATABASE_URL`, and health check.

Local API:

```bash
cd apps/api && npm install && npm run dev
# http://localhost:3000/api/health
```

Point Expo at a deployment (include `/api`):

```bash
EXPO_PUBLIC_AUTH_API_URL=https://<deployment>.vercel.app/api
```

## Navigation map (stubs)

| Route | Artboard |
|-------|----------|
| `/onboarding/language` | 01 Onboarding — language |
| `/onboarding/diet` | 02 Onboarding — diet |
| `/onboarding/source` | 03 Onboarding — recipe source → import |
| `/(tabs)` | 04 / 04b My recipes |
| `/(tabs)/checklist` | 08 Shopping checklist |
| `/(tabs)/profile` | 12 Profile / settings |
| `/import` | 05 Import — link found |
| `/recipe/[id]` | 06 Recipe detail |
| `/recipe/[id]/share` | 06b ShareSheet |
| `/recipe/[id]/edit` | 07 Recipe editor |
| `/auth/phone` · `/otp` · `/google` · `/apple` | 09 + guest B1–B4 |
| `/account-prompt?variant=` | Guest A1–A6 |
| `/merge?variant=` | 11 + guest C1–C4 |
| `/shared/[slug]` | 13 Shared recipe preview |

## i18n

English + Hindi via `i18n-js` (`lib/i18n.ts`). Chrome keys live in `lib/i18n/en.ts` and `lib/i18n/hi.ts`. Hindi placeholders are fine where locked copy is missing.

## Auth env (optional)

Without these, the app runs in **mock auth** (OTP `123456`, simulated Google/Apple). See `features/auth/README.md`.

| Variable | Purpose |
|----------|---------|
| `EXPO_PUBLIC_AUTH_API_URL` | API base ending in `/api` (e.g. `https://….vercel.app/api`) — client appends `/auth/otp/…` |
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | Google OAuth web / Expo client ID |
| `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` | iOS Google client ID |
| `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` | Android Google client ID |
| `EXPO_PUBLIC_AUTH_MOCK` | Force mock (`true`) |
| `EXPO_PUBLIC_AUTH_MOCK_OTP` | Mock SMS code (default `123456`) |

Copy `.env.example` → `.env.local` for local keys. Do not commit secrets.

## Explicit non-goals (this slice)

- Real SMS / live OAuth token verify / Postgres migrations (API is mock-ready stubs)
- PostHog
- Shopping integrations / Phase 1.5 social
