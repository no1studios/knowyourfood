import { StubScreen } from '@/components/StubScreen';
import { t } from '@/lib/i18n';

/** Artboard 02 — Onboarding — diet */
export default function OnboardingDiet() {
  return (
    <StubScreen
      artboard={t('onboarding.dietTitle')}
      subtitle="Food band · tap tiles · progress 2/3"
      links={[
        { href: '/onboarding/source', label: t('common.continue') },
        { href: '/onboarding/language', label: t('common.back') },
      ]}
    />
  );
}
