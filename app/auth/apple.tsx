import { StubScreen } from '@/components/StubScreen';
import { t } from '@/lib/i18n';

/** Guest B4 — Apple — iOS only */
export default function AuthAppleScreen() {
  return (
    <StubScreen
      artboard={t('auth.appleTitle')}
      subtitle="Text Continue with Apple · same weight as Google · distinct path from Google"
      links={[
        { href: '/merge?variant=keep-all', label: t('merge.title') },
        { href: '/auth/phone', label: t('common.back') },
      ]}
    />
  );
}
