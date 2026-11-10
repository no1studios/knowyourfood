import { router } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useGuestSession } from '@/components/GuestSession';
import { useLocale } from '@/components/LocaleProvider';
import { useTheme } from '@/components/ThemeProvider';
import { AppHeader, Button, ListRow } from '@/components/ui';
import { copy } from '@/lib/i18n/copy';

/** Profile + local storage demo controls. */
export default function ProfileScreen() {
  const { colors, type, space, radius, elevation } = useTheme();
  const { locale } = useLocale();
  const {
    signedIn,
    recipeCount,
    snap,
    setLocalePref,
    seedDemoData,
    resetGuestData,
    showToast,
  } = useGuestSession();
  const insets = useSafeAreaInsets();
  const c = copy(locale);
  const bottomPad = 12 + 72 + 24 + insets.bottom;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: bottomPad }}>
        <AppHeader variant="large" title={c.nav.profile} />
        <View style={{ paddingHorizontal: space[5], gap: space[4] }}>
          <Text style={[type.body, { color: colors.inkMuted }]}>
            Guest store · {recipeCount} recipes · device {snap.deviceId.slice(0, 12)}…
            {signedIn ? ' · signed in (local stub)' : ' · guest'}
          </Text>

          <View
            style={[
              { borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.border, gap: 1 },
              elevation[1],
            ]}
          >
            <ListRow
              icon="globe"
              iconTone="sky"
              title="App language"
              trailing={locale === 'hi' ? 'हिंदी' : 'EN'}
              chevron
              onPress={() => setLocalePref(locale === 'hi' ? 'en' : 'hi')}
            />
            <ListRow
              icon="phone"
              iconTone="haldi"
              title={c.ap.phone}
              chevron
              onPress={() => router.push('/auth/phone')}
            />
          </View>

          <Text style={[type.overline, { color: colors.inkMuted }]}>LOCAL DATA</Text>
          <View
            style={[
              { borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.border, gap: 1 },
              elevation[1],
            ]}
          >
            <ListRow
              title="Seed demo recipes + checklist"
              subtitle="Optional sample data for walkthroughs"
              chevron
              onPress={async () => {
                await seedDemoData();
                showToast(locale === 'hi' ? 'डेमो डेटा लोड हो गया' : 'Demo data loaded');
                router.replace('/(tabs)');
              }}
            />
            <ListRow
              title="Reset guest store"
              subtitle="Clears recipes, checklist, prompts, session"
              chevron
              onPress={async () => {
                await resetGuestData();
                router.replace('/onboarding/language');
              }}
            />
          </View>

          <Text style={[type.overline, { color: colors.inkMuted }]}>ACCOUNT PROMPT</Text>
          <View
            style={[
              { borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.border, gap: 1 },
              elevation[1],
            ]}
          >
            <ListRow
              title="A4 N recipes"
              chevron
              onPress={() => router.push('/account-prompt?variant=n-recipes')}
            />
            <ListRow
              title="A5 Unsynced exit"
              chevron
              onPress={() => router.push('/account-prompt?variant=unsynced-exit')}
            />
            <ListRow
              title="C1 Merge keep-all"
              chevron
              onPress={() => router.push('/merge?variant=keep-all')}
            />
          </View>

          {!signedIn ? (
            <Button
              variant="secondary"
              block
              onPress={() => router.push('/account-prompt?variant=unsynced-exit')}
            >
              Leave with unsynced recipes
            </Button>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}
