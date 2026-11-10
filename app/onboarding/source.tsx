import { StubScreen } from '@/components/StubScreen';
import { t } from '@/lib/i18n';

/** Artboard 03 — Onboarding — recipe source → import */
export default function OnboardingSource() {
  return (
    <StubScreen
      artboard={t('onboarding.sourceTitle')}
      subtitle="Food band · source chips · floating import CTA"
      links={[
        { href: '/import', label: t('common.importRecipe') },
        { href: '/(tabs)?state=empty', label: 'Go to My recipes' },
        { href: '/onboarding/diet', label: t('common.back') },
      ]}
    />
  );
}
