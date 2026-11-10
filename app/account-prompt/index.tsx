import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useGuestSession } from '@/components/GuestSession';
import { useLocale } from '@/components/LocaleProvider';
import { useTheme } from '@/components/ThemeProvider';
import { AccountPrompt } from '@/components/ui';
import { copy } from '@/lib/i18n/copy';
import type { AccountPromptKind } from '@/lib/guest-store';

type Variant = AccountPromptKind | 'banner-quiet';

/** Guest A1–A6 — AccountPrompt sheet variants (+ quiet banner redirect). */
export default function AccountPromptScreen() {
  const { variant: raw = 'n-recipes' } = useLocalSearchParams<{ variant?: string }>();
  const variant = (raw as Variant) || 'n-recipes';
  const { locale } = useLocale();
  const { colors, type, radius, space } = useTheme();
  const insets = useSafeAreaInsets();
  const { recipes, notePromptShown, seedDemoData } = useGuestSession();
  const c = copy(locale);

  useEffect(() => {
    if (variant === 'banner-quiet') {
      void seedDemoData().then(() => router.replace('/(tabs)'));
      return;
    }
    void notePromptShown(variant);
  }, [variant, notePromptShown, seedDemoData]);

  if (variant === 'banner-quiet') {
    return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  }

  const variantCopy =
    variant === 'first-save'
      ? c.ap.save
      : variant === 'first-import'
        ? c.ap.import
        : variant === 'first-share'
          ? c.ap.share
          : variant === 'unsynced-exit'
            ? c.ap.exit
            : c.ap.n;

  const toastText =
    variant === 'first-save'
      ? c.ap.save.toast
      : variant === 'first-import'
        ? c.ap.import.toast
        : variant === 'first-share'
          ? c.ap.share.toast
          : null;

  const dismiss = () => {
    if (variant === 'first-import' && recipes[0]) {
      router.replace(`/recipe/${recipes[recipes.length - 1].id}`);
      return;
    }
    router.replace('/(tabs)');
  };

  return (
    <View style={{ flex: 1, justifyContent: 'flex-end' }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={c.close}
        onPress={dismiss}
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          backgroundColor: colors.scrim,
        }}
      />

      {toastText ? (
        <View
          style={{
            position: 'absolute',
            top: insets.top + 12,
            left: space[5],
            right: space[5],
            zIndex: 6,
            paddingVertical: space[3],
            paddingHorizontal: space[4],
            borderRadius: radius.lg,
            backgroundColor: colors.ink,
          }}
        >
          <Text style={[type.label, { color: colors.inkInverse, textAlign: 'center' }]}>
            {toastText}
          </Text>
        </View>
      ) : null}

      <AccountPrompt
        variant="sheet"
        sheetChrome
        lang={locale}
        copy={{
          title: variantCopy.title,
          body: variantCopy.body,
          primary: c.ap.phone,
          secondary: c.ap.google,
          dismiss: c.ap.notNow,
        }}
        onPrimary={() => router.push('/auth/phone')}
        onSecondary={() => router.push('/auth/google')}
        onDismiss={dismiss}
      />
    </View>
  );
}
