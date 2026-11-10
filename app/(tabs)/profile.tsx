import { router } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useGuestSession } from '@/components/GuestSession';
import { useLocale } from '@/components/LocaleProvider';
import { useTheme } from '@/components/ThemeProvider';
import { AppHeader, Button, ListRow } from '@/components/ui';
import { copy } from '@/lib/i18n/copy';

/** Artboard 12 stub + demo entry points for guest prompt / merge variants. */
export default function ProfileScreen() {
  const { colors, type, space, radius, elevation } = useTheme();
  const { locale, setLocale } = useLocale();
  const { signedIn, setSignedIn, setHasRecipes } = useGuestSession();
  const insets = useSafeAreaInsets();
  const c = copy(locale);
  const bottomPad = 12 + 72 + 24 + insets.bottom;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: bottomPad }}>
        <AppHeader variant="large" title={c.nav.profile} />
        <View style={{ paddingHorizontal: space[5], gap: space[4] }}>
          <Text style={[type.body, { color: colors.inkMuted }]}>
            Demo links for guest AccountPrompt / merge variants.
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
              onPress={() => setLocale(locale === 'hi' ? 'en' : 'hi')}
            />
            <ListRow
              icon="phone"
              iconTone="haldi"
              title={c.ap.phone}
              chevron
              onPress={() => router.push('/auth/phone')}
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
              title="A1 First save"
              chevron
              onPress={() => router.push('/account-prompt?variant=first-save')}
            />
            <ListRow
              title="A2 First import"
              chevron
              onPress={() => router.push('/account-prompt?variant=first-import')}
            />
            <ListRow
              title="A3 First share"
              chevron
              onPress={() => router.push('/account-prompt?variant=first-share')}
            />
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
          </View>

          <Text style={[type.overline, { color: colors.inkMuted }]}>MERGE</Text>
          <View
            style={[
              { borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.border, gap: 1 },
              elevation[1],
            ]}
          >
            <ListRow
              title="C1 Keep all"
              chevron
              onPress={() => router.push('/merge?variant=keep-all')}
            />
            <ListRow
              title="C2 Collision keep both"
              chevron
              onPress={() => router.push('/merge?variant=collision')}
            />
            <ListRow
              title="C3 Guest-only skip"
              chevron
              onPress={() => router.push('/merge?variant=skip')}
            />
            <ListRow
              title="C4 Signed-in confirm"
              chevron
              onPress={() => {
                setHasRecipes(true);
                setSignedIn(true);
                router.push('/merge?variant=signed-in');
              }}
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
