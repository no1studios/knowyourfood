import { useLocalSearchParams } from 'expo-router';

import { StubScreen } from '@/components/StubScreen';
import { t } from '@/lib/i18n';

const VARIANT_COPY: Record<string, { artboardKey: string; note: string }> = {
  'first-save': {
    artboardKey: 'accountPrompt.firstSave',
    note: 'A1 · Sheet over shared preview after Save',
  },
  'first-import': {
    artboardKey: 'accountPrompt.firstImport',
    note: 'A2 · Sheet over detail after import Save',
  },
  'first-share': {
    artboardKey: 'accountPrompt.firstShare',
    note: 'A3 · Sheet after share target; action already succeeded',
  },
  'n-recipes': {
    artboardKey: 'accountPrompt.nRecipes',
    note: 'A4 / v2 10 · Sheet over My recipes · Not now',
  },
  'unsynced-exit': {
    artboardKey: 'accountPrompt.unsyncedExit',
    note: 'A5 · Dismissible sheet before leave with unsynced guest data',
  },
  'banner-quiet': {
    artboardKey: 'accountPrompt.bannerQuiet',
    note: 'A6 · Banner mid-grid · tonal Sign in',
  },
};

/** AccountPrompt surfaces (guest A1–A6). */
export default function AccountPromptScreen() {
  const { variant = 'n-recipes' } = useLocalSearchParams<{ variant?: string }>();
  const copy = VARIANT_COPY[variant] ?? VARIANT_COPY['n-recipes'];

  return (
    <StubScreen
      artboard={t(copy.artboardKey)}
      subtitle={copy.note}
      links={[
        { href: '/auth/phone', label: t('common.signIn') },
        { href: '/(tabs)', label: t('common.notNow') },
      ]}
    />
  );
}
