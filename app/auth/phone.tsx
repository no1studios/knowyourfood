import { Platform } from 'react-native';

import { StubScreen } from '@/components/StubScreen';
import { t } from '@/lib/i18n';

/** Artboard 09 / B1 — Auth — phone (+ continue as guest) */
export default function AuthPhoneScreen() {
  return (
    <StubScreen
      artboard={t('auth.phoneTitle')}
      subtitle="Food wash · phone OTP primary · Google secondary · Continue as guest"
      links={[
        { href: '/auth/otp', label: t('auth.otpTitle') },
        { href: '/auth/google', label: t('auth.continueWithGoogle') },
        ...(Platform.OS === 'ios'
          ? [{ href: '/auth/apple' as const, label: t('auth.continueWithApple') }]
          : []),
        { href: '/(tabs)?state=empty', label: t('auth.continueAsGuest') },
        { href: '/(tabs)', label: t('common.back') },
      ]}
    />
  );
}
