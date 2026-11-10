import { router } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useGuestSession } from '@/components/GuestSession';
import { useLocale } from '@/components/LocaleProvider';
import { useTheme } from '@/components/ThemeProvider';
import { Button, FoodPhoto, Icon, Wordmark } from '@/components/ui';
import { FloatingCta } from '@/components/ui/FloatingCta';
import { copy } from '@/lib/i18n/copy';
import type { AppLocale } from '@/lib/i18n';

/** Artboard 01 — Onboarding — language */
export default function OnboardingLanguage() {
  const { locale } = useLocale();
  const { setLocalePref } = useGuestSession();
  const { colors, type, space, radius, elevation } = useTheme();
  const insets = useSafeAreaInsets();
  const c = copy(locale);

  const select = (next: AppLocale) => setLocalePref(next);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        bounces={false}
        contentContainerStyle={{ paddingBottom: 140 + insets.bottom }}
      >
        <FoodPhoto art="thali" tone="haldi" ratio="360/392" alt={c.lang.alt} />
        <View
          style={{
            marginTop: -28,
            borderTopLeftRadius: radius.xl,
            borderTopRightRadius: radius.xl,
            backgroundColor: colors.bg,
            paddingHorizontal: space[5],
            paddingTop: 28,
            gap: space[5],
          }}
        >
          <View style={{ gap: space[2] }}>
            <Wordmark size="lg" />
            <Text style={[type['title-2'], { color: colors.ink, marginTop: space[2] }]}>
              {c.lang.title}
            </Text>
            <Text
              style={[
                locale === 'en' ? { fontFamily: type.body.fontFamily, fontSize: 15, lineHeight: 24 } : type.body,
                { color: colors.inkMuted },
              ]}
            >
              {c.lang.alt}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', gap: space[3] }}>
            {(
              [
                {
                  code: 'en' as const,
                  glyph: 'Aa',
                  name: c.lang.enName,
                  sub: c.lang.enSub,
                },
                {
                  code: 'hi' as const,
                  glyph: 'अ',
                  name: c.lang.hiName,
                  sub: c.lang.hiSub,
                },
              ] as const
            ).map((tile) => {
              const on = locale === tile.code;
              return (
                <Pressable
                  key={tile.code}
                  onPress={() => select(tile.code)}
                  style={[
                    {
                      flex: 1,
                      padding: space[4],
                      borderRadius: radius.lg,
                      backgroundColor: on ? colors.primarySoft : colors.surface,
                      gap: space[1],
                    },
                    on
                      ? { borderWidth: 2, borderColor: colors.primary }
                      : elevation[1],
                  ]}
                >
                  {on ? (
                    <View
                      style={{
                        position: 'absolute',
                        top: 12,
                        right: 12,
                        width: 24,
                        height: 24,
                        borderRadius: 999,
                        backgroundColor: colors.primary,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Icon name="check" size={16} color={colors.onPrimary} />
                    </View>
                  ) : null}
                  <Text
                    style={{
                      fontFamily: type.display.fontFamily,
                      fontSize: 30,
                      lineHeight: 36,
                      color: colors.ink,
                    }}
                  >
                    {tile.glyph}
                  </Text>
                  <Text style={[type.label, { color: colors.ink, fontWeight: '700' }]}>{tile.name}</Text>
                  <Text style={[type.caption, { color: colors.inkMuted }]}>{tile.sub}</Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={[type.caption, { color: colors.inkMuted }]}>{c.lang.note}</Text>
        </View>
      </ScrollView>

      <FloatingCta>
        <Button variant="primary" size="lg" block onPress={() => router.push('/onboarding/diet')}>
          {c.continue}
        </Button>
      </FloatingCta>
    </View>
  );
}
