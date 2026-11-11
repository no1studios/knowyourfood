// Know Your Food — React Native theme, generated from tokens.json. Do not edit by hand.
// Fonts (Expo): npx expo install @expo-google-fonts/plus-jakarta-sans @expo-google-fonts/mukta expo-font

export const lightColors = {
  bg: '#f7f6f2',
  surface: '#ffffff',
  surfaceSunken: '#efeee8',
  surfaceRaised: '#ffffff',
  scrim: 'rgba(18,20,17,0.48)',
  border: '#e4e3dc',
  borderStrong: '#82877e',
  ink: '#1b1d1a',
  inkMuted: '#5c615a',
  inkSubtle: '#6c7169',
  inkDisabled: '#b4b8af',
  inkInverse: '#ffffff',
  primary: '#d93a14',
  primaryPressed: '#b92f0e',
  onPrimary: '#ffffff',
  primarySoft: '#fde7df',
  onPrimarySoft: '#9e2a0c',
  primaryText: '#c2330f',
  focus: '#1d4e89',
  pastelMint: '#dcf1e2',
  onPastelMint: '#1f5e36',
  pastelHaldi: '#fcebc4',
  onPastelHaldi: '#7a4a00',
  pastelSky: '#dcebfa',
  onPastelSky: '#1d4e89',
  pastelRose: '#fbe0dd',
  onPastelRose: '#8a2b2b',
  pastelPista: '#ebf2cc',
  onPastelPista: '#4d5a12',
  pastelPeach: '#fde2d1',
  onPastelPeach: '#8a3b12',
  dietVeg: '#1a8a3a',
  dietNonveg: '#8b2e16',
  dietEgg: '#b86e00',
  success: '#1e7d45',
  successSoft: '#dcf1e2',
  warning: '#a35f00',
  warningSoft: '#fcebc4',
  danger: '#b42318',
  dangerSoft: '#fbe0dd',
} as const;

export const darkColors = {
  bg: '#121411',
  surface: '#1c1f1b',
  surfaceSunken: '#171a16',
  surfaceRaised: '#252924',
  scrim: 'rgba(0,0,0,0.6)',
  border: '#2e322c',
  borderStrong: '#6b7066',
  ink: '#f2f2ee',
  inkMuted: '#a8ada4',
  inkSubtle: '#8d9289',
  inkDisabled: '#4a4f47',
  inkInverse: '#121411',
  primary: '#ff6a45',
  primaryPressed: '#ff8564',
  onPrimary: '#1b0a05',
  primarySoft: '#3a1d14',
  onPrimarySoft: '#ffb39e',
  primaryText: '#ff7a57',
  focus: '#8cc0ff',
  pastelMint: '#1d3326',
  onPastelMint: '#a6e3ba',
  pastelHaldi: '#3a2c10',
  onPastelHaldi: '#f5cf7a',
  pastelSky: '#17283b',
  onPastelSky: '#a9cdf5',
  pastelRose: '#3a1c1c',
  onPastelRose: '#f3b2ab',
  pastelPista: '#2a3014',
  onPastelPista: '#d2e08a',
  pastelPeach: '#3b2216',
  onPastelPeach: '#f7bd99',
  dietVeg: '#4cc27a',
  dietNonveg: '#ff8a6b',
  dietEgg: '#e6a23c',
  success: '#4cc27a',
  successSoft: '#1d3326',
  warning: '#e6a23c',
  warningSoft: '#3a2c10',
  danger: '#ff7b6b',
  dangerSoft: '#3a1c1c',
} as const;

export type ColorName = keyof typeof lightColors;

export const space = {'0': 0, '0.5': 2, '1': 4, '2': 8, '3': 12, '4': 16, '5': 20, '6': 24, '8': 32, '10': 40, '12': 48, '16': 64} as const;
// Note: '2xl' must be quoted for TypeScript (numeric-leading identifier).
export const radius = {xs: 8, sm: 12, md: 16, lg: 20, xl: 24, '2xl': 32, full: 999} as const;
export const size = {'control-sm': 36, 'control-md': 48, 'control-lg': 56, 'nav-height': 72, 'icon-sm': 16, 'icon-md': 20, 'icon-lg': 24, 'thumb-row': 56, 'diet-mark': 14} as const;

// Map web weights to loaded font faces (RN needs one fontFamily per weight).
export const fontFace = {
  sans: { 400: 'PlusJakartaSans_400Regular', 500: 'PlusJakartaSans_500Medium', 600: 'PlusJakartaSans_600SemiBold', 700: 'PlusJakartaSans_700Bold', 800: 'PlusJakartaSans_800ExtraBold' },
  hi: { 400: 'Mukta_400Regular', 500: 'Mukta_500Medium', 600: 'Mukta_600SemiBold', 700: 'Mukta_700Bold', 800: 'Mukta_800ExtraBold' },
} as const;

type TextStyle = { fontFamily: string; fontSize: number; lineHeight: number; letterSpacing?: number; textTransform?: 'uppercase' };
export const typeEn = {
  'display': { fontFamily: fontFace.sans[800], fontSize: 34, lineHeight: 40, letterSpacing: -0.68 },
  'title-1': { fontFamily: fontFace.sans[700], fontSize: 26, lineHeight: 32, letterSpacing: -0.26 },
  'title-2': { fontFamily: fontFace.sans[700], fontSize: 21, lineHeight: 28, letterSpacing: -0.1 },
  'title-3': { fontFamily: fontFace.sans[700], fontSize: 17, lineHeight: 24, letterSpacing: 0 },
  'body-lg': { fontFamily: fontFace.sans[400], fontSize: 17, lineHeight: 26, letterSpacing: 0 },
  'body': { fontFamily: fontFace.sans[400], fontSize: 15, lineHeight: 22, letterSpacing: 0 },
  'label': { fontFamily: fontFace.sans[600], fontSize: 15, lineHeight: 20, letterSpacing: 0 },
  'caption': { fontFamily: fontFace.sans[500], fontSize: 13, lineHeight: 18, letterSpacing: 0 },
  'overline': { fontFamily: fontFace.sans[700], fontSize: 11, lineHeight: 14, letterSpacing: 0.88, textTransform: 'uppercase' },
} satisfies Record<string, TextStyle>;
// Hindi: same keys as typeEn (no overline). Pick with typeFor(locale).
export const typeHi = {
  'display': { fontFamily: fontFace.hi[700], fontSize: 32, lineHeight: 46, letterSpacing: 0 },
  'title-1': { fontFamily: fontFace.hi[700], fontSize: 25, lineHeight: 36, letterSpacing: 0 },
  'title-2': { fontFamily: fontFace.hi[700], fontSize: 20, lineHeight: 30, letterSpacing: 0 },
  'title-3': { fontFamily: fontFace.hi[700], fontSize: 17, lineHeight: 26, letterSpacing: 0 },
  'body-lg': { fontFamily: fontFace.hi[400], fontSize: 17, lineHeight: 28, letterSpacing: 0 },
  'body': { fontFamily: fontFace.hi[400], fontSize: 15, lineHeight: 24, letterSpacing: 0 },
  'label': { fontFamily: fontFace.hi[600], fontSize: 15, lineHeight: 22, letterSpacing: 0 },
  'caption': { fontFamily: fontFace.hi[500], fontSize: 13, lineHeight: 20, letterSpacing: 0 },
  overline: { fontFamily: fontFace.hi[700], fontSize: 13, lineHeight: 20, letterSpacing: 0 },
} satisfies Record<string, TextStyle>;
export type TypeStyle = keyof typeof typeEn;
export const typeFor = (locale: 'en' | 'hi') => (locale === 'hi' ? typeHi : typeEn);

// Single-layer shadows. iOS uses shadow*, Android uses elevation.
export const elevation = {
  0: { elevation: 0, shadowOpacity: 0 },
  1: { elevation: 1, shadowColor: '#1b1d1a', shadowOpacity: 0.08, shadowRadius: 3, shadowOffset: { width: 0, height: 1 } },
  2: { elevation: 4, shadowColor: '#1b1d1a', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 8 } },
  3: { elevation: 8, shadowColor: '#1b1d1a', shadowOpacity: 0.14, shadowRadius: 20, shadowOffset: { width: 0, height: 16 } },
} as const;

export const opacity = { disabled: 0.4, pressed: 0.88 } as const;
export const theme = { light: { colors: lightColors }, dark: { colors: darkColors }, space, radius, size, typeEn, typeHi, elevation, opacity } as const;
