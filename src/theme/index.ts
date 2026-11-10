/**
 * Theme re-exports. Canonical values live in kyf-theme.ts
 * (copied from design-system-export/exports/kyf-theme.ts — do not hand-edit values).
 */
export {
  lightColors,
  darkColors,
  space,
  radius,
  size,
  fontFace,
  typeEn,
  typeHi,
  typeFor,
  elevation,
  opacity,
  theme,
} from './kyf-theme';
export type { ColorName, TypeStyle } from './kyf-theme';

import { darkColors, lightColors } from './kyf-theme';

export type ColorSchemeName = 'light' | 'dark';

export function colorsFor(scheme: ColorSchemeName) {
  return scheme === 'dark' ? darkColors : lightColors;
}
