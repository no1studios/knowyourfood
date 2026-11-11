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
  const { recipes, notePromptShown, seedDemoData, signedIn } = useGuestSession();
  const c = copy(locale);

  useEffect(() => {
    if (signedIn) {
      router.replace('/(tabs)');
      return;
    }
    if (variant === 'banner-quiet') {
      void seedDemoData().then(() => router.replace('/(tabs)'));
      return;
    }
    void notePromptShown(variant);
    // Intentionally omit notePromptShown/seedDemoData identities — they change when
    // snap updates and would re-enter this effect (web hang / RESULT_CODE_HUNG).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variant, signedIn]);

  if (signedIn || variant === 'banner-quiet') {
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

  /** Leave the prompt overlay and open auth. Prefer dismissTo so modal layers unmount. */
  const goPhone = () => {
    try {
      router.dismissTo('/auth/phone');
    } catch {
      router.replace('/auth/phone');
    }
  };
  const goGoogle = () => {
    try {
      router.dismissTo('/auth/google');
    } catch {
      router.replace('/auth/google');
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'flex-end' }}>
      {/*
        Scrim must sit *under* the sheet. On RN web, position:absolute paints above
        in-flow siblings when z-index is unset, so taps never reach the CTAs.
      */}
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
          zIndex: 1,
          backgroundColor: colors.scrim,
        }}
      />

      {toastText ? (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: insets.top + 12,
            left: space[5],
            right: space[5],
            zIndex: 3,
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

      <View
        accessibilityViewIsModal
        style={{ zIndex: 2, width: '100%', elevation: 8 }}
        // Keep sheet presses from falling through to the scrim (web + native).
        onStartShouldSetResponder={() => true}
      >
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
          onPrimary={goPhone}
          onSecondary={goGoogle}
          onDismiss={dismiss}
        />
      </View>
    </View>
  );
}
