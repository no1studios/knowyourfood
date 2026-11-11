import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useLocale } from '@/components/LocaleProvider';
import { useTheme } from '@/components/ThemeProvider';
import { Button, FoodPhoto, IconButton } from '@/components/ui';
import { copy } from '@/lib/i18n/copy';

/** Artboard 09 / guest B2 — OTP 6 digit cells (stub — no SMS) */
export default function AuthOtpScreen() {
  const { locale } = useLocale();
  const { colors, type, space, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const c = copy(locale);
  const [digits, setDigits] = useState(['4', '8', '2', '9', '', '']);
  const [focusIndex, setFocusIndex] = useState(4);
  const inputs = useRef<Array<{ focus: () => void } | null>>([null, null, null, null, null, null]);

  const focusAt = (index: number) => {
    inputs.current[index]?.focus();
    setFocusIndex(index);
  };

  const setDigit = (index: number, value: string) => {
    const clean = value.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[index] = clean;
    setDigits(next);
    if (clean && index < 5) focusAt(index + 1);
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
          <Text style={[type.body, { color: colors.inkMuted }]}>{c.otp.body}</Text>
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
                    maxLength={1}
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
          <Text style={[type.caption, { color: colors.inkMuted }]}>{c.otp.helper}</Text>
        </View>

        <View style={{ flex: 1 }} />

        <View style={{ gap: 8 }}>
          <Button
            variant="primary"
            size="lg"
            block
            onPress={() => router.replace('/merge?variant=keep-all')}
          >
            {c.otp.cta}
          </Button>
          <Button variant="ghost" block onPress={() => router.replace('/auth/phone')}>
            {c.otp.change}
          </Button>
        </View>
      </View>
    </View>
  );
}
