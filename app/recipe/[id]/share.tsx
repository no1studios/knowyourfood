import { router, useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';

import { useLocale } from '@/components/LocaleProvider';
import { useTheme } from '@/components/ThemeProvider';
import { FoodPhoto, ShareSheet } from '@/components/ui';
import { copy } from '@/lib/i18n/copy';

/** Artboard 06b — Recipe detail + ShareSheet open */
export default function RecipeShareScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { locale } = useLocale();
  const { colors, type, radius, space } = useTheme();
  const c = copy(locale);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <FoodPhoto art="bowl" tone="haldi" ratio="360/360" />
      <View
        style={{
          marginTop: -24,
          borderTopLeftRadius: radius.xl,
          borderTopRightRadius: radius.xl,
          backgroundColor: colors.bg,
          padding: space[5],
        }}
      >
        <Text style={[type['title-1'], { color: colors.ink }]}>{c.det.title}</Text>
      </View>

      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 6 }}>
        <ShareSheet
          inline
          title={c.share.title}
          recipe={{
            title: c.det.title,
            subtitle: c.share.subtitle,
            art: 'bowl',
            tone: 'haldi',
          }}
          targets={c.share.targets}
          options={c.share.options}
          onClose={() => router.back()}
          onSelectTarget={() => {
            // Stub: WhatsApp-first share — no third-party logos; navigate back for now
            router.replace(`/recipe/${id}`);
          }}
          onSelectOption={() => router.replace(`/(tabs)/checklist`)}
        />
      </View>
    </View>
  );
}
