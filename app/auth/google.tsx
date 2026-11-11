import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Google from 'expo-auth-session/providers/google';

import { useGuestSession } from '@/components/GuestSession';
import { useLocale } from '@/components/LocaleProvider';
import { useTheme } from '@/components/ThemeProvider';
import { Button, FoodPhoto, IconButton, TextField, Wordmark } from '@/components/ui';
import {
  AuthError,
  authClient,
  getAuthCapabilities,
  getGoogleAuthRequestConfig,
  isGoogleLive,
  mergeHrefAfterAuth,
  registerGooglePrompt,
} from '@/features/auth';
import { copy } from '@/lib/i18n/copy';

/** Guest B3 — Google secondary in progress (phone paused) */
export default function AuthGoogleScreen() {
  const { locale } = useLocale();
  const { colors, type, space, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const { applyAuthSession } = useGuestSession();
  const c = copy(locale);
  const caps = getAuthCapabilities();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(true);
  const autoStarted = useRef(false);

  const googleConfig = getGoogleAuthRequestConfig();
  const live = isGoogleLive();
  const [request, , promptAsync] = Google.useAuthRequest(
    live
      ? {
          clientId: googleConfig.clientId,
          iosClientId: googleConfig.iosClientId,
          androidClientId: googleConfig.androidClientId,
          webClientId: googleConfig.webClientId,
        }
      : {
          clientId: 'mock.apps.googleusercontent.com',
        },
  );

  useEffect(() => {
    if (live && promptAsync) {
      registerGooglePrompt(async () => promptAsync() as ReturnType<typeof promptAsync>);
    } else {
      registerGooglePrompt(undefined);
    }
    return () => registerGooglePrompt(undefined);
  }, [live, promptAsync]);

  const runGoogle = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const session = await authClient.signInWithOAuth({ provider: 'google' });
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
  }, [applyAuthSession, c.auth.errorGeneric]);

  useEffect(() => {
    if (autoStarted.current) return;
    if (live && !request) return;
    autoStarted.current = true;
    void runGoogle();
  }, [live, request, runGoogle]);

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
          <Text style={[type.body, { color: colors.inkMuted }]}>{c.auth.googleProgress}</Text>
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
            loading={busy}
            disabled={busy}
            onPress={() => void runGoogle()}
          >
            {c.auth.google}
          </Button>
          {Platform.OS === 'ios' && caps.apple ? (
            <Button
              variant="secondary"
              size="lg"
              block
              disabled={busy}
              onPress={() => router.replace('/auth/apple')}
            >
              {c.auth.apple}
            </Button>
          ) : null}
          {error ? (
            <Text style={[type.caption, { color: colors.danger, textAlign: 'center' }]}>
              {error}
            </Text>
          ) : null}
          {error ? (
            <Button variant="ghost" block onPress={() => void runGoogle()}>
              {c.auth.retry}
            </Button>
          ) : null}
          <Button
            variant="ghost"
            block
            disabled={busy}
            onPress={() => router.replace('/auth/phone')}
          >
            {c.back}
          </Button>
        </View>
      </ScrollView>
    </View>
  );
}
