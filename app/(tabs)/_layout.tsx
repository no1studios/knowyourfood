import { Tabs } from 'expo-router';

import { BottomNav } from '@/components/BottomNav';
import { useLocale } from '@/components/LocaleProvider';
import { useTheme } from '@/components/ThemeProvider';
import { copy } from '@/lib/i18n/copy';

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
      <Tabs.Screen name="search" options={{ title: c.nav.search }} />
      <Tabs.Screen name="checklist" options={{ title: c.nav.list }} />
      <Tabs.Screen name="profile" options={{ title: c.nav.profile }} />
    </Tabs>
  );
}
