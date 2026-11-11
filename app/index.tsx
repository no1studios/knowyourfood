import { Redirect } from 'expo-router';
import { View } from 'react-native';

import { useGuestSession } from '@/components/GuestSession';
import { useTheme } from '@/components/ThemeProvider';

/** Entry: onboarding once, then My recipes (empty or populated from local guest store). */
export default function Index() {
  const { ready, snap } = useGuestSession();
  const { colors } = useTheme();

  if (!ready) {
    return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  }

  if (!snap.onboardingComplete) {
    return <Redirect href="/onboarding/language" />;
  }

  return <Redirect href="/(tabs)" />;
}
