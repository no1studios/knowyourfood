# Know Your Food

India-first personal recipe app — Expo React Native (TypeScript) + Expo Router.

This repository currently contains the **scaffold only**: theme tokens, navigation skeleton, stub screens matching locked artboard names, EN|HI i18n chrome, and stub interfaces for auth / API / analytics. No Phone OTP, Google/Apple SSO, Vercel API, or PostHog yet.

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
components/          # BottomNav, StubScreen, ThemeProvider
features/            # recipes, import, auth, shopping, share barrels
lib/                 # i18n, api/db/auth/analytics stubs
src/theme/           # Locked DS theme (kyf-theme.ts)
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

## Explicit non-goals (scaffold)

- Real Phone OTP / SMS
- Google or Apple Sign-In
- Vercel API / Postgres / Blob
- PostHog
- Full DS component port (Button, RecipeCard, …) — use stubs until a UI implementation pass
