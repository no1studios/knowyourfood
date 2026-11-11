import { router } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useGuestSession } from '@/components/GuestSession';
import { useLocale } from '@/components/LocaleProvider';
import { useTheme } from '@/components/ThemeProvider';
import { AppHeader, Button, ListRow } from '@/components/ui';
import type { AuthSession } from '@/features/auth';
import { copy } from '@/lib/i18n/copy';

/** True when guest-store flag OR persisted auth session says signed in. */
function resolveSignedIn(signedIn: boolean, authSession: AuthSession | null) {
  if (signedIn) return true;
  return Boolean(authSession && !authSession.isGuest);
}

/**
 * Profile route: `app/(tabs)/profile.tsx` (tab name `profile`).
 * Guest: unmistakable ACCOUNT invite card (not a ListRow phone row).
 * Signed in: account row + Sign out.
 */
export default function ProfileScreen() {
  const { colors, type, space, radius, elevation } = useTheme();
  const { locale } = useLocale();
  const {
    signedIn,
    authSession,
    recipeCount,
    snap,
    setLocalePref,
    seedDemoData,
    resetGuestData,
    signOut,
    showToast,
  } = useGuestSession();
  const insets = useSafeAreaInsets();
  const c = copy(locale);
  const bottomPad = 12 + 72 + 24 + insets.bottom;

  const isSignedIn = resolveSignedIn(signedIn, authSession);
  const provider = authSession?.provider;

  const authLabel = isSignedIn
    ? ` · signed in (${provider && provider !== 'guest' ? provider : 'account'})`
    : ' · guest';

  const accountTitle =
    provider === 'phone'
      ? c.auth.accountPhone
      : provider === 'google'
        ? c.auth.accountGoogle
        : provider === 'apple'
          ? c.auth.accountApple
          : c.auth.accountGeneric;

  const accountSubtitle =
    authSession?.phoneE164 ||
    authSession?.email ||
    authSession?.displayName ||
    undefined;

  const onSignOut = async () => {
    await signOut();
    showToast(c.auth.signedOutToast);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: bottomPad }}>
        <AppHeader variant="large" title={c.nav.profile} />
        <View style={{ paddingHorizontal: space[5], gap: space[4] }}>
          <Text style={[type.body, { color: colors.inkMuted }]}>
            Guest store · {recipeCount} recipes · device {snap.deviceId.slice(0, 12)}…
            {authLabel}
          </Text>

          {/* ACCOUNT first — invite card for guests cannot be mistaken for a ListRow */}
          <View style={{ gap: space[3] }}>
            <Text style={[type.overline, { color: colors.inkMuted }]}>{c.auth.accountSection}</Text>

            {isSignedIn ? (
              <>
                <View
                  style={[
                    {
                      borderRadius: radius.lg,
                      overflow: 'hidden',
                      backgroundColor: colors.border,
                      gap: 1,
                    },
                    elevation[1],
                  ]}
                >
                  <ListRow
                    icon="user"
                    iconTone="mint"
                    title={accountTitle}
                    subtitle={accountSubtitle}
                  />
                </View>
                <Button variant="secondary" block onPress={() => void onSignOut()}>
                  {c.auth.signOut}
                </Button>
                <Text style={[type.caption, { color: colors.inkMuted }]}>{c.auth.signOutHint}</Text>
              </>
            ) : (
              <View
                style={[
                  {
                    borderRadius: radius.xl,
                    backgroundColor: colors.surfaceRaised,
                    padding: space[5],
                    gap: space[4],
                  },
                  elevation[2],
                ]}
              >
                <View style={{ gap: 6 }}>
                  <Text style={[type['title-2'], { color: colors.ink }]}>
                    {c.auth.guestInviteTitle}
                  </Text>
                  <Text style={[type.body, { color: colors.inkMuted }]}>
                    {c.auth.guestInviteBody}
                  </Text>
                </View>
                <View style={{ gap: 8 }}>
                  <Button
                    variant="primary"
                    size="lg"
                    block
                    icon="phone"
                    onPress={() => router.push('/auth/phone')}
                  >
                    {c.ap.phone}
                  </Button>
                  <Button
                    variant="secondary"
                    size="lg"
                    block
                    onPress={() => router.push('/auth/google')}
                  >
                    {c.ap.google}
                  </Button>
                </View>
              </View>
            )}
          </View>

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
              subtitle="Leave with unsynced recipes (debug)"
              chevron
              onPress={() => router.push('/account-prompt?variant=unsynced-exit')}
            />
            <ListRow
              title="C1 Merge keep-all"
              chevron
              onPress={() => router.push('/merge?variant=keep-all')}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
