import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useGuestSession } from '@/components/GuestSession';
import { useLocale } from '@/components/LocaleProvider';
import { useTheme } from '@/components/ThemeProvider';
import { Button, FoodPhoto, IconButton, TextField, Wordmark } from '@/components/ui';
import { copy } from '@/lib/i18n/copy';

/** Artboard 09 / guest B1 — Auth phone + continue as guest */
export default function AuthPhoneScreen() {
  const { locale } = useLocale();
  const { colors, type, space, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const { showToast, completeOnboarding } = useGuestSession();
  const c = copy(locale);
  const [phone, setPhone] = useState(c.auth.phoneValue);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View>
        <FoodPhoto art="roti" tone="peach" ratio="360/200" />
        <View style={{ position: 'absolute', top: insets.top + 8, left: 12 }}>
          <IconButton icon="close" label={c.close} variant="surface" onPress={() => router.back()} />
        </View>
      </View>

      <ScrollView
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
          <Text style={[type.body, { color: colors.inkMuted }]}>{c.auth.body}</Text>
        </View>

        <TextField
          label={c.auth.phone}
          icon="phone"
          value={phone}
          onChangeText={setPhone}
          helper={c.auth.helper}
        />

        <View style={{ flex: 1, minHeight: 24 }} />

        <View style={{ gap: 8 }}>
          <Button variant="primary" size="lg" block onPress={() => router.push('/auth/otp')}>
            {c.auth.send}
          </Button>
          <Button variant="secondary" size="lg" block onPress={() => router.push('/auth/google')}>
            {c.auth.google}
          </Button>
          <Button
            variant="ghost"
            block
            onPress={async () => {
              await completeOnboarding();
              showToast(c.home.guestToast);
              router.replace('/(tabs)');
            }}
          >
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
