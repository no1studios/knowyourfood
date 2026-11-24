# Brand

Compact brand mark files (a Mirchi laddoo in a katori). The typeset `Wordmark` is still the full logo; these are for constrained squares only. Usage rules are on the BrandMark card.

| File | Use | Ink / canvas |
| --- | --- | --- |
| `kyf-mark.svg`, `kyf-mark-1024.png` | Master glyph, transparent | `primary` #d93a14 |
| `kyf-mark-ink.svg`, `kyf-mark-ink-1024.png` | Single-colour on light | `ink` #1b1d1a |
| `kyf-mark-white.svg`, `kyf-mark-white-1024.png` | Single-colour on dark or photos | #ffffff |
| `app-icon-1024.svg/.png` | Expo `icon`, iOS icon (opaque, full-bleed; the OS masks corners) | mark `primary` on `bg` #f7f6f2 |
| `apple-touch-icon-180.png`, `icon-192.png`, `icon-512.png` | iOS web clip, PWA manifest | as app icon |
| `favicon.svg`, `favicon-32/48/64.png` | Browser tab (badge: `bg` mark on `primary` tile) | `bg` on `primary` |
| `favicon-16.svg/.png` | 16px tab, small cut (wider knock-out) | `bg` on `primary` |
| `splash-mark.svg`, `splash-mark-1024.png` | Expo splash `image`, `resizeMode: contain`, `imageWidth` 160, `backgroundColor` #f7f6f2 | `primary`, transparent |
| `splash-mark-dark.svg/-1024.png` | Dark splash on #121411 | dark `primary` #ff6a45 |
| `adaptive-background.svg/-1024.png` | Android adaptive background | solid `bg` |
| `adaptive-foreground.svg/-1024.png` | Android adaptive foreground, inside the 66dp safe circle of 108dp | `primary`, transparent |
| `adaptive-monochrome.svg/-1024.png` | Android 13+ themed icon | black alpha (system tints it) |
| `notification-icon.svg`, `notification-icon-96.png` | Android notification small icon, small cut | white alpha; accent `color` #d93a14 |

`favicon.ico` (16/32/48) ships in the export zip only. `exports/expo-app-config.json` has the matching `app.json` keys.
