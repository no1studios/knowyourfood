import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useGuestSession } from '@/components/GuestSession';
import { useLocale } from '@/components/LocaleProvider';
import { useTheme } from '@/components/ThemeProvider';
import { Button, FoodPhoto, IconButton, TextField, Wordmark } from '@/components/ui';
import {
  AuthError,
  authClient,
  getAuthCapabilities,
  normalizeIndiaPhone,
} from '@/features/auth';
import { copy } from '@/lib/i18n/copy';

/**
 * Profile → Add phone for Google/Apple signed-in users.
 * Same phone field + Send code as Auth 09, then OTP with mode=link.
 */
export default function AddPhoneScreen() {
  const { locale } = useLocale();
  const { colors, type, space, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const { authSession, signedIn } = useGuestSession();
  const c = copy(locale);
  const caps = getAuthCapabilities();
  const [phone, setPhone] = useState(c.auth.phoneValue);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canLink =
    Boolean(signedIn && authSession && !authSession.isGuest && authSession.userId) &&
    !authSession?.phoneE164;

  useEffect(() => {
    if (!signedIn || !authSession || authSession.isGuest) {
      router.replace('/auth/phone');
      return;
    }
    if (authSession.phoneE164) {
      router.replace('/(tabs)/profile');
    }
  }, [signedIn, authSession]);

  const sendCode = async () => {
    if (!canLink) return;
    setError(null);
    setBusy(true);
    try {
      const e164 = normalizeIndiaPhone(phone);
      const started = await authClient.startPhoneOtp({ phoneE164: e164 });
      router.push({
        pathname: '/auth/otp',
        params: {
          verificationId: started.verificationId,
          phoneE164: started.phoneE164,
          mock: started.mock ? '1' : '0',
          mode: 'link',
        },
      });
    } catch (err) {
      const message =
        err instanceof AuthError
          ? err.message
          : err instanceof Error
            ? err.message
            : c.auth.errorGeneric;
      setError(message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ maxHeight: 220, overflow: 'hidden' }}>
        <FoodPhoto art="roti" tone="peach" ratio="360/200" />
        <View style={{ position: 'absolute', top: insets.top + 8, left: 12 }}>
          <IconButton
            icon="chevronLeft"
            label={c.back}
            variant="surface"
            onPress={() => router.back()}
          />
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          marginTop: -24,
          borderTopLeftRadius: radius.xl,
          borderTopRightRadius: radius.xl,
          backgroundColor: colors.bg,
          paddingHorizontal: space[5],
          paddingTop: space[6],
          paddingBottom: Math.max(insets.bottom, space[5]),
          gap: space[5],
          flexGrow: 1,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <Wordmark size="md" />
        <View style={{ gap: 6 }}>
          <Text style={[type['title-2'], { color: colors.ink }]}>{c.auth.addPhoneTitle}</Text>
          <Text style={[type.body, { color: colors.inkMuted }]}>{c.auth.addPhoneBody}</Text>
        </View>

        <TextField
          label={c.auth.phone}
          icon="phone"
          value={phone}
          onChangeText={(v) => {
            setPhone(v);
            setError(null);
          }}
          helper={caps.mode === 'mock' ? c.auth.helperMock : c.auth.helper}
          error={error ?? undefined}
          keyboardType="phone-pad"
          autoComplete="tel"
          textContentType="telephoneNumber"
        />

        {caps.mode === 'mock' ? (
          <Text style={[type.caption, { color: colors.inkMuted }]}>{c.auth.mockBanner}</Text>
        ) : null}

        <View style={{ flex: 1, minHeight: 24 }} />

        <Button
          variant="primary"
          size="lg"
          block
          loading={busy}
          disabled={busy || !canLink}
          onPress={() => void sendCode()}
        >
          {c.auth.addPhoneSend}
        </Button>
      </ScrollView>
    </View>
  );
}
