import { StubScreen } from '@/components/StubScreen';
import { t } from '@/lib/i18n';

/** Guest B3 — Google — secondary, in progress */
export default function AuthGoogleScreen() {
  return (
    <StubScreen
      artboard={t('auth.googleTitle')}
      subtitle="Loading on secondary · phone paused · SSO stub only"
      links={[
        { href: '/merge?variant=keep-all', label: t('merge.title') },
        { href: '/auth/phone', label: t('common.back') },
      ]}
    />
  );
}
