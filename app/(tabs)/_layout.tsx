import { Tabs } from 'expo-router';

import { BottomNav } from '@/components/BottomNav';
import { useLocale } from '@/components/LocaleProvider';
import { useTheme } from '@/components/ThemeProvider';
import { copy } from '@/lib/i18n/copy';

/**
 * Tab Screen declaration order must match expo-router's file sort
 * (index first, then alphabetical): checklist, index, profile, search →
 * index, checklist, profile, search.
 * Mismatched order triggers SDK 58 `ROUTE_NAMES_CHANGED` LogBox toasts
 * that look like broken create/import navigation on Expo web.
 */
export default function TabLayout() {
  const { colors } = useTheme();
  const { locale } = useLocale();
  const c = copy(locale);

  return (
    <Tabs
      tabBar={(props) => <BottomNav {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen name="index" options={{ title: c.nav.recipes }} />
      <Tabs.Screen name="checklist" options={{ title: c.nav.list }} />
      <Tabs.Screen name="profile" options={{ title: c.nav.profile }} />
      {/* Keep search routable; hide from pill (header search icon covers it). */}
      <Tabs.Screen
        name="search"
        options={{ title: c.nav.search, href: null }}
      />
    </Tabs>
  );
}
