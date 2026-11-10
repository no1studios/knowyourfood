import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import { useLocale } from '@/components/LocaleProvider';
import { StubScreen } from '@/components/StubScreen';
import { useTheme } from '@/components/ThemeProvider';
import { t, type AppLocale } from '@/lib/i18n';

/** Artboard 01 — Onboarding — language */
export default function OnboardingLanguage() {
  const { setLocale, locale } = useLocale();
  const { colors, type, space, radius } = useTheme();

  const pick = (next: AppLocale) => {
    setLocale(next);
    router.push('/onboarding/diet');
  };

  return (
    <View style={{ flex: 1 }}>
      <StubScreen
        artboard={t('onboarding.languageTitle')}
        subtitle="Full-bleed food · large wordmark · language tiles (EN | HI)"
        links={[
          { href: '/onboarding/diet', label: t('common.continue') },
          { href: '/(tabs)?state=empty', label: 'Skip to My recipes (empty)' },
        ]}
      />
      <View
        style={{
          position: 'absolute',
          left: space[4],
          right: space[4],
          bottom: space[10],
          flexDirection: 'row',
          gap: space[3],
        }}
      >
        {(['en', 'hi'] as const).map((code) => (
          <Pressable
            key={code}
            onPress={() => pick(code)}
            style={{
              flex: 1,
              backgroundColor: locale === code ? colors.primarySoft : colors.surface,
              borderRadius: radius.md,
              borderWidth: 1,
              borderColor: locale === code ? colors.primary : colors.border,
              paddingVertical: space[4],
              alignItems: 'center',
            }}
          >
            <Text style={[type.label, { color: colors.ink }]}>
              {code === 'en' ? 'English' : 'हिंदी'}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
