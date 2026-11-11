import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, ScrollView, Text, View } from 'react-native';
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

/** Artboard 09 / guest B1 — Auth phone + continue as guest (+ Apple on iOS) */
export default function AuthPhoneScreen() {
  const { locale } = useLocale();
  const { colors, type, space, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const { showToast, completeOnboarding, signedIn } = useGuestSession();
  const c = copy(locale);
  const caps = getAuthCapabilities();
  const [phone, setPhone] = useState(c.auth.phoneValue);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (signedIn) router.replace('/(tabs)');
  }, [signedIn]);

  const sendCode = async () => {
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

  const continueGuest = async () => {
    await authClient.continueAsGuest();
    await completeOnboarding();
    showToast(c.home.guestToast);
    router.replace('/(tabs)');
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Cap hero height — on wide RN web, ratio 360/200 can consume the whole viewport. */}
      <View style={{ maxHeight: 220, overflow: 'hidden' }}>
        <FoodPhoto art="roti" tone="peach" ratio="360/200" />
        <View style={{ position: 'absolute', top: insets.top + 8, left: 12 }}>
          <IconButton icon="close" label={c.close} variant="surface" onPress={() => router.back()} />
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
          <Text style={[type['title-2'], { color: colors.ink }]}>{c.auth.title}</Text>
          <Text style={[type.body, { color: colors.inkMuted }]}>{c.auth.body}</Text>
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

        <View style={{ gap: 8 }}>
          <Button
            variant="primary"
            size="lg"
            block
            loading={busy}
            disabled={busy}
            onPress={() => void sendCode()}
          >
            {c.auth.send}
          </Button>
          <Button
            variant="secondary"
            size="lg"
            block
            disabled={busy}
            onPress={() => router.push('/auth/google')}
          >
            {c.auth.google}
          </Button>
          {Platform.OS === 'ios' && caps.apple ? (
            <Button
              variant="secondary"
              size="lg"
              block
              disabled={busy}
              onPress={() => router.push('/auth/apple')}
            >
              {c.auth.apple}
            </Button>
          ) : null}
          <Button variant="ghost" block disabled={busy} onPress={() => void continueGuest()}>
            {c.auth.guest}
          </Button>
          <Text
            style={[
              type.caption,
              { color: colors.inkMuted, textAlign: 'center', marginTop: 6 },
            ]}
          >
            {c.auth.terms}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
