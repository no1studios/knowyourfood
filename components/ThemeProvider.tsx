import { createContext, useContext, useMemo, type ReactNode } from 'react';

import { LocaleProvider, useLocale } from '@/components/LocaleProvider';
import { useColorScheme } from '@/components/useColorScheme';
import {
  colorsFor,
  elevation,
  opacity,
  radius,
  size,
  space,
  typeFor,
  type ColorSchemeName,
} from '@/src/theme';

type ThemeValue = {
  scheme: ColorSchemeName;
  colors: ReturnType<typeof colorsFor>;
  space: typeof space;
  radius: typeof radius;
  size: typeof size;
  elevation: typeof elevation;
  opacity: typeof opacity;
  type: ReturnType<typeof typeFor>;
};

const ThemeContext = createContext<ThemeValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <LocaleProvider>
      <ThemeProviderInner>{children}</ThemeProviderInner>
    </LocaleProvider>
  );
}

function ThemeProviderInner({ children }: { children: ReactNode }) {
  const scheme = useColorScheme();
  const { locale } = useLocale();

  const value = useMemo<ThemeValue>(
    () => ({
      scheme,
      colors: colorsFor(scheme),
      space,
      radius,
      size,
      elevation,
      opacity,
      type: typeFor(locale),
    }),
    [scheme, locale],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
