import { useLocalSearchParams } from 'expo-router';

import { StubScreen } from '@/components/StubScreen';
import { t } from '@/lib/i18n';

/** Artboard 13 — Shared recipe preview — opened from WhatsApp */
export default function SharedPreviewScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();

  return (
    <StubScreen
      artboard={t('shared.title')}
      subtitle={`slug=${slug} · Immersive hero · floating save CTA · works with no account`}
      links={[
        { href: '/account-prompt?variant=first-save', label: t('accountPrompt.firstSave') },
        { href: '/(tabs)', label: t('nav.recipes') },
      ]}
    />
  );
}
