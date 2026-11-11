import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useGuestSession } from '@/components/GuestSession';
import { useLocale } from '@/components/LocaleProvider';
import { useTheme } from '@/components/ThemeProvider';
import { Button, FoodPhoto, IconButton, TextField, Wordmark } from '@/components/ui';
import { AuthError, authClient, getAuthCapabilities, mergeHrefAfterAuth } from '@/features/auth';
import { copy } from '@/lib/i18n/copy';

/** Guest B4 — Apple Sign-In (iOS only) · text label, no brand logo */
export default function AuthAppleScreen() {
  const { locale } = useLocale();
  const { colors, type, space, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const { applyAuthSession } = useGuestSession();
  const c = copy(locale);
  const caps = getAuthCapabilities();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(true);
  const autoStarted = useRef(false);

  const runApple = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      if (Platform.OS !== 'ios') {
        throw new AuthError('apple_unavailable', c.auth.appleUnavailable);
      }
      const session = await authClient.signInWithOAuth({ provider: 'apple' });
      await applyAuthSession(session);
      router.replace(mergeHrefAfterAuth('keep-all'));
    } catch (err) {
      const message =
        err instanceof AuthError
          ? err.message
          : err instanceof Error
            ? err.message
            : c.auth.errorGeneric;
      setError(message);
      setBusy(false);
    }
  }, [applyAuthSession, c.auth.appleUnavailable, c.auth.errorGeneric]);

  useEffect(() => {
    if (autoStarted.current) return;
    autoStarted.current = true;
    if (!caps.apple) {
      setBusy(false);
      setError(c.auth.appleUnavailable);
      return;
    }
    void runApple();
  }, [caps.apple, c.auth.appleUnavailable, runApple]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ maxHeight: 220, overflow: 'hidden' }}>
        <FoodPhoto art="roti" tone="peach" ratio="360/200" />
        <View style={{ position: 'absolute', top: insets.top + 8, left: 12 }}>
          <IconButton
            icon="close"
            label={c.close}
            variant="surface"
            onPress={() => router.replace('/auth/phone')}
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
      >
        <Wordmark size="md" />
        <View style={{ gap: 6 }}>
          <Text style={[type['title-2'], { color: colors.ink }]}>{c.auth.title}</Text>
          <Text style={[type.body, { color: colors.inkMuted }]}>{c.auth.appleProgress}</Text>
        </View>

        <TextField
          label={c.auth.phone}
          icon="phone"
          value={c.auth.phoneValue}
          disabled
          helper={c.auth.phonePaused}
        />

        <View style={{ flex: 1, minHeight: 24 }} />

        <View style={{ gap: 8 }}>
          <Button variant="primary" size="lg" block disabled>
            {c.auth.send}
          </Button>
          <Button
            variant="secondary"
            size="lg"
            block
            disabled={busy}
            onPress={() => router.replace('/auth/google')}
          >
            {c.auth.google}
          </Button>
          <Button
            variant="secondary"
            size="lg"
            block
            loading={busy}
            disabled={busy && !error}
            onPress={() => void runApple()}
          >
            {c.auth.apple}
          </Button>
          {error ? (
            <Text style={[type.caption, { color: colors.danger, textAlign: 'center' }]}>
              {error}
            </Text>
          ) : null}
          <Button
            variant="ghost"
            block
            disabled={busy && !error}
            onPress={() => router.replace('/auth/phone')}
          >
            {c.back}
          </Button>
        </View>
      </ScrollView>
    </View>
  );
}
