import { Tabs } from 'expo-router';

import { BottomNav } from '@/components/BottomNav';
import { useTheme } from '@/components/ThemeProvider';
import { t } from '@/lib/i18n';

export default function TabLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      tabBar={(props) => <BottomNav {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen name="index" options={{ title: t('nav.recipes') }} />
      <Tabs.Screen name="checklist" options={{ title: t('nav.checklist') }} />
      <Tabs.Screen name="profile" options={{ title: t('nav.profile') }} />
    </Tabs>
  );
}
