import { router } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useGuestSession } from '@/components/GuestSession';
import { useLocale } from '@/components/LocaleProvider';
import { useTheme } from '@/components/ThemeProvider';
import { Button, Checkbox, DietBadge, FoodPhoto, IconButton } from '@/components/ui';
import { FloatingCta } from '@/components/ui/FloatingCta';
import { copy } from '@/lib/i18n/copy';

/** Artboard 02 — Onboarding — diet */
export default function OnboardingDiet() {
  const { locale } = useLocale();
  const { colors, type, space, radius, elevation } = useTheme();
  const { diets, toggleDiet } = useGuestSession();
  const insets = useSafeAreaInsets();
  const c = copy(locale);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView bounces={false} contentContainerStyle={{ paddingBottom: 140 + insets.bottom }}>
        <View>
          <FoodPhoto art="bowl" tone="mint" ratio="360/184" />
          <View
            style={{
              position: 'absolute',
              top: insets.top + 8,
              left: 12,
              right: 12,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <IconButton
              icon="chevronLeft"
              label={c.back}
              variant="surface"
              onPress={() => router.back()}
            />
            <Button variant="secondary" size="sm" onPress={() => router.push('/onboarding/source')}>
              {c.skip}
            </Button>
          </View>
        </View>

        <View
          style={{
            marginTop: -24,
            borderTopLeftRadius: radius.xl,
            borderTopRightRadius: radius.xl,
            backgroundColor: colors.bg,
            paddingHorizontal: space[5],
            paddingTop: space[5],
            gap: space[4],
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space[3] }}>
            <View style={{ flex: 1, flexDirection: 'row', gap: 6 }}>
              {[0, 1, 2].map((i) => (
                <View
                  key={i}
                  style={{
                    flex: 1,
                    height: 4,
                    borderRadius: 999,
                    backgroundColor: i < 2 ? colors.primary : colors.border,
                  }}
                />
              ))}
            </View>
            <Text style={[type.caption, { color: colors.inkMuted }]}>{c.step2}</Text>
          </View>

          <Text style={[type['title-2'], { color: colors.ink }]}>{c.diet.title}</Text>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {c.diet.tiles.map((tile) => {
              const on = diets[tile.key];
              return (
                <Pressable
                  key={tile.key}
                  onPress={() => toggleDiet(tile.key)}
                  style={[
                    {
                      width: '48%',
                      flexGrow: 1,
                      paddingVertical: 12,
                      paddingHorizontal: 14,
                      borderRadius: radius.lg,
                      backgroundColor: on ? colors.primarySoft : colors.surface,
                      gap: 4,
                    },
                    on ? { borderWidth: 2, borderColor: colors.primary } : elevation[1],
                  ]}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <DietBadge diet={tile.key} compact lang={locale} />
                    <Text style={[type.label, { flex: 1, color: colors.ink, fontWeight: '700' }]}>
                      {tile.name}
                    </Text>
                    <Checkbox checked={on} label={tile.name} onChange={() => toggleDiet(tile.key)} />
                  </View>
                  <Text style={[type.caption, { color: colors.inkMuted }]}>{tile.sub}</Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={[type.caption, { color: colors.inkMuted }]}>{c.diet.body}</Text>
        </View>
      </ScrollView>

      <FloatingCta>
        <Button variant="primary" size="lg" block onPress={() => router.push('/onboarding/source')}>
          {c.continue}
        </Button>
      </FloatingCta>
    </View>
  );
}
