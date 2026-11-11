import { StubScreen } from '@/components/StubScreen';
import { t } from '@/lib/i18n';

/** Artboard 09 / B2 — Auth — OTP (6 digit cells) */
export default function AuthOtpScreen() {
  return (
    <StubScreen
      artboard={t('auth.otpTitle')}
      subtitle="6 digit boxes · stub only — no SMS"
      links={[
        { href: '/merge?variant=keep-all', label: t('merge.keepAll') },
        { href: '/merge?variant=collision', label: t('merge.collision') },
        { href: '/merge?variant=skip', label: t('merge.skip') },
        { href: '/auth/phone', label: t('common.back') },
      ]}
    />
  );
}
