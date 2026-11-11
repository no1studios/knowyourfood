import { StubScreen } from '@/components/StubScreen';
import { t } from '@/lib/i18n';

/** Artboard 12 — Profile / settings */
export default function ProfileScreen() {
  return (
    <StubScreen
      withBottomNav
      artboard={t('profile.title')}
      subtitle="Profile card + grouped ListRows · open-to-orders stub · floating pill nav"
      links={[
        { href: '/auth/phone', label: t('common.signIn') },
        { href: '/merge?variant=keep-all', label: t('merge.title') },
      ]}
    />
  );
}
