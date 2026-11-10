import { useLocalSearchParams } from 'expo-router';

import { StubScreen } from '@/components/StubScreen';
import { t } from '@/lib/i18n';

const VARIANT_COPY: Record<string, { artboardKey: string; note: string }> = {
  'keep-all': {
    artboardKey: 'merge.keepAll',
    note: 'C1 / v2 11 · Modal + comparison tiles · primary keep-all',
  },
  collision: {
    artboardKey: 'merge.collision',
    note: 'C2 · Same title both sides · keep-both · (2) before confirm',
  },
  skip: {
    artboardKey: 'merge.skip',
    note: 'C3 · New/empty account · short claim, no compare grid',
  },
  'signed-in': {
    artboardKey: 'merge.signedIn',
    note: 'C4 · Synced tag + toast · banner gone · Fab only primary',
  },
};

/** Merge / claim after OTP (guest C1–C4). */
export default function MergeScreen() {
  const { variant = 'keep-all' } = useLocalSearchParams<{ variant?: string }>();
  const copy = VARIANT_COPY[variant] ?? VARIANT_COPY['keep-all'];

  return (
    <StubScreen
      artboard={t(copy.artboardKey)}
      subtitle={copy.note}
      links={[
        { href: '/merge?variant=signed-in', label: t('merge.signedIn') },
        { href: '/(tabs)?state=populated', label: t('nav.recipes') },
        { href: '/auth/otp', label: t('common.back') },
      ]}
    />
  );
}
