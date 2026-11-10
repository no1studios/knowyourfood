import {
  Mukta_400Regular,
  Mukta_500Medium,
  Mukta_600SemiBold,
  Mukta_700Bold,
  Mukta_800ExtraBold,
} from '@expo-google-fonts/mukta';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { Platform, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { ThemeProvider, useTheme } from '@/components/ThemeProvider';
import { lightColors } from '@/src/theme';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  anchor: '(tabs)',
};

// Native only — calling this on web with SSR/`return null` yields a permanent blank root.
if (Platform.OS !== 'web') {
  SplashScreen.preventAutoHideAsync().catch(() => {});
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
    Mukta_400Regular,
    Mukta_500Medium,
    Mukta_600SemiBold,
    Mukta_700Bold,
    Mukta_800ExtraBold,
  });

  useEffect(() => {
    if (error) {
      console.warn('Font load failed; continuing with system fonts', error);
    }
  }, [error]);

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [loaded, error]);

  // Never return null on web — that clears the root and looks like a blank black page
  // (especially under prefers-color-scheme: dark body styles).
  const fontsReady = loaded || error != null || Platform.OS === 'web';

  if (!fontsReady) {
    return <View style={{ flex: 1, backgroundColor: lightColors.bg }} />;
  }

  return (
    <ThemeProvider>
      <RootNavigator />
    </ThemeProvider>
  );
}

function RootNavigator() {
  const { colors, scheme } = useTheme();

  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="import/index" options={{ presentation: 'card' }} />
        <Stack.Screen name="recipe/[id]/index" />
        <Stack.Screen name="recipe/[id]/edit" />
        <Stack.Screen name="recipe/[id]/share" options={{ presentation: 'modal' }} />
        <Stack.Screen name="auth" />
        <Stack.Screen name="account-prompt/index" options={{ presentation: 'transparentModal' }} />
        <Stack.Screen name="merge/index" options={{ presentation: 'transparentModal' }} />
        <Stack.Screen name="shared/[slug]" />
      </Stack>
    </>
  );
}
