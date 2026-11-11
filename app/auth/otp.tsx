import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useGuestSession } from '@/components/GuestSession';
import { useLocale } from '@/components/LocaleProvider';
import { useTheme } from '@/components/ThemeProvider';
import { Button, FoodPhoto, IconButton } from '@/components/ui';
import {
  AuthError,
  authClient,
  formatPhoneDisplay,
  getAuthPublicConfig,
  mergeHrefAfterAuth,
} from '@/features/auth';
import { copy } from '@/lib/i18n/copy';

/** Artboard 09 / guest B2 — OTP 6 digit cells */
export default function AuthOtpScreen() {
  const {
    verificationId = '',
    phoneE164 = '',
    mock: mockParam = '0',
  } = useLocalSearchParams<{
    verificationId?: string;
    phoneE164?: string;
    mock?: string;
  }>();
  const { locale } = useLocale();
  const { colors, type, space, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const { applyAuthSession } = useGuestSession();
  const c = copy(locale);
  const isMock = mockParam === '1' || verificationId.startsWith('mock_');
  const mockOtp = getAuthPublicConfig().mockOtp;

  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [focusIndex, setFocusIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(24);
  const [activeVerificationId, setActiveVerificationId] = useState(verificationId);
  const inputs = useRef<Array<{ focus: () => void } | null>>([null, null, null, null, null, null]);

  useEffect(() => {
    setActiveVerificationId(verificationId);
  }, [verificationId]);

  useEffect(() => {
    const id = setInterval(() => setSeconds((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => inputs.current[0]?.focus(), 250);
    return () => clearTimeout(t);
  }, []);

  const focusAt = (index: number) => {
    inputs.current[index]?.focus();
    setFocusIndex(index);
  };

  const setDigit = (index: number, value: string) => {
    const clean = value.replace(/\D/g, '');
    if (clean.length > 1) {
      const chars = clean.slice(0, 6).split('');
      const next = ['', '', '', '', '', ''];
      chars.forEach((ch, i) => {
        next[i] = ch;
      });
      setDigits(next);
      focusAt(Math.min(chars.length, 5));
      setError(null);
      return;
    }
    const next = [...digits];
    next[index] = clean.slice(-1);
    setDigits(next);
    setError(null);
    if (clean && index < 5) focusAt(index + 1);
  };

  const phoneLabel = phoneE164 ? formatPhoneDisplay(phoneE164) : c.auth.phoneValue;

  const verify = async () => {
    const code = digits.join('');
    if (code.length !== 6) {
      setError(c.otp.incomplete);
      return;
    }
    if (!activeVerificationId) {
      setError(c.auth.errorGeneric);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const session = await authClient.verifyPhoneOtp({
        verificationId: activeVerificationId,
        code,
        phoneE164: phoneE164 || undefined,
      });
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
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    if (!phoneE164 || seconds > 0) return;
    setError(null);
    try {
      const started = await authClient.startPhoneOtp({ phoneE164 });
      setActiveVerificationId(started.verificationId);
      setSeconds(24);
      setDigits(['', '', '', '', '', '']);
      focusAt(0);
    } catch (err) {
      const message =
        err instanceof AuthError
          ? err.message
          : err instanceof Error
            ? err.message
            : c.auth.errorGeneric;
      setError(message);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View>
        <FoodPhoto art="roti" tone="peach" ratio="360/140" />
        <View style={{ position: 'absolute', top: insets.top + 8, left: 12 }}>
          <IconButton
            icon="chevronLeft"
            label={c.back}
            variant="surface"
            onPress={() => router.back()}
          />
        </View>
      </View>

      <View
        style={{
          flex: 1,
          marginTop: -24,
          borderTopLeftRadius: radius.xl,
          borderTopRightRadius: radius.xl,
          backgroundColor: colors.bg,
          paddingHorizontal: space[5],
          paddingTop: space[6],
          paddingBottom: Math.max(insets.bottom, space[5]),
          gap: space[6],
        }}
      >
        <View style={{ gap: 6 }}>
          <Text style={[type['title-2'], { color: colors.ink }]}>{c.otp.title}</Text>
          <Text style={[type.body, { color: colors.inkMuted }]}>
            {isMock ? c.otp.bodyMock(phoneLabel, mockOtp) : c.otp.bodyTo(phoneLabel)}
          </Text>
        </View>

        <View style={{ gap: 10 }}>
          <View
            accessibilityLabel={c.otp.label}
            style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}
          >
            {digits.map((d, i) => {
              const focused = focusIndex === i;
              return (
                <View
                  key={i}
                  style={{
                    width: 46,
                    height: 56,
                    borderRadius: radius.md,
                    backgroundColor: colors.surface,
                    borderWidth: focused ? 2 : 1.5,
                    borderColor: focused
                      ? colors.focus
                      : d
                        ? colors.borderStrong
                        : colors.border,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <TextInput
                    ref={(el) => {
                      inputs.current[i] = el as { focus: () => void } | null;
                    }}
                    value={d}
                    onChangeText={(v) => setDigit(i, v)}
                    onKeyPress={({ nativeEvent }) => {
                      if (nativeEvent.key === 'Backspace' && !digits[i] && i > 0) {
                        focusAt(i - 1);
                      }
                    }}
                    onFocus={() => setFocusIndex(i)}
                    keyboardType="number-pad"
                    textContentType="oneTimeCode"
                    autoComplete="sms-otp"
                    maxLength={i === 0 ? 6 : 1}
                    selectTextOnFocus
                    style={{
                      width: '100%',
                      height: '100%',
                      textAlign: 'center',
                      fontFamily: type['title-2'].fontFamily,
                      fontSize: 22,
                      color: colors.ink,
                      padding: 0,
                    }}
                  />
                </View>
              );
            })}
          </View>
          <Pressable onPress={() => void resend()} disabled={seconds > 0}>
            <Text style={[type.caption, { color: colors.inkMuted }]}>
              {seconds > 0
                ? c.otp.helperCountdown(`0:${seconds.toString().padStart(2, '0')}`)
                : c.otp.helperReady}
            </Text>
          </Pressable>
          {error ? <Text style={[type.caption, { color: colors.danger }]}>{error}</Text> : null}
        </View>

        <View style={{ flex: 1 }} />

        <View style={{ gap: 8 }}>
          <Button
            variant="primary"
            size="lg"
            block
            loading={busy}
            disabled={busy}
            onPress={() => void verify()}
          >
            {c.otp.cta}
          </Button>
          <Button variant="ghost" block disabled={busy} onPress={() => router.replace('/auth/phone')}>
            {c.otp.change}
          </Button>
        </View>
      </View>
    </View>
  );
}
