import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useGuestSession } from '@/components/GuestSession';
import { useLocale } from '@/components/LocaleProvider';
import { useTheme } from '@/components/ThemeProvider';
import { Button, Chip, FoodPhoto, IconButton, TextField } from '@/components/ui';
import { FloatingCta } from '@/components/ui/FloatingCta';
import { copy } from '@/lib/i18n/copy';

/** Artboard 03 — Onboarding — recipe source → import */
export default function OnboardingSource() {
  const { locale } = useLocale();
  const { colors, type, space, radius } = useTheme();
  const { sources, toggleSource, completeOnboarding, importDemoRecipe } = useGuestSession();
  const insets = useSafeAreaInsets();
  const c = copy(locale);
  const [link, setLink] = useState('');

  const finishEmpty = async () => {
    await completeOnboarding();
    router.replace('/(tabs)');
  };

  const finishImported = async () => {
    if (link.trim()) {
      const { recipe, prompt } = await importDemoRecipe(link.trim());
      if (prompt) router.replace(`/account-prompt?variant=${prompt}`);
      else router.replace(`/recipe/${recipe.id}`);
      return;
    }
    await completeOnboarding();
    router.replace('/import');
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView bounces={false} contentContainerStyle={{ paddingBottom: 140 + insets.bottom }}>
        <View>
          <FoodPhoto art="roti" tone="peach" ratio="360/184" />
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
            <Button variant="secondary" size="sm" onPress={finishEmpty}>
              {c.source.later}
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
                    backgroundColor: colors.primary,
                  }}
                />
              ))}
            </View>
            <Text style={[type.caption, { color: colors.inkMuted }]}>{c.step3}</Text>
          </View>

          <View style={{ gap: 6 }}>
            <Text style={[type['title-2'], { color: colors.ink }]}>{c.source.title}</Text>
            <Text style={[type.body, { color: colors.inkMuted }]}>{c.source.body}</Text>
          </View>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {c.source.chips.map((ch) => {
              const selected = sources[ch.key];
              return (
                <Chip
                  key={ch.key}
                  icon={selected ? 'check' : ch.icon}
                  selected={selected}
                  onPress={() => toggleSource(ch.key)}
                >
                  {ch.label}
                </Chip>
              );
            })}
          </View>

          <TextField
            label={c.source.field}
            icon="link"
            placeholder={c.source.placeholder}
            helper={c.source.helper}
            value={link}
            onChangeText={setLink}
          />
        </View>
      </ScrollView>

      <FloatingCta>
        <Button variant="primary" size="lg" block icon="download" onPress={finishImported}>
          {c.source.cta}
        </Button>
      </FloatingCta>
    </View>
  );
}
