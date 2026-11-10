import { getLocales } from 'expo-localization';
import { I18n } from 'i18n-js';

import { en } from './i18n/en';
import { hi } from './i18n/hi';

export type AppLocale = 'en' | 'hi';

export const i18n = new I18n({ en, hi });
i18n.defaultLocale = 'en';
i18n.enableFallback = true;

function deviceLocale(): AppLocale {
  const tag = getLocales()[0]?.languageCode?.toLowerCase();
  return tag === 'hi' ? 'hi' : 'en';
}

i18n.locale = deviceLocale();

export function getLocale(): AppLocale {
  return i18n.locale === 'hi' ? 'hi' : 'en';
}

export function setLocale(locale: AppLocale) {
  i18n.locale = locale;
}

export function t(scope: string, options?: Record<string, unknown>): string {
  return i18n.t(scope, options);
}
