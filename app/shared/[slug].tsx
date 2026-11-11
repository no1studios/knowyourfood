import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useGuestSession } from '@/components/GuestSession';
import { useLocale } from '@/components/LocaleProvider';
import { useTheme } from '@/components/ThemeProvider';
import { Button, FoodPhoto, IconButton } from '@/components/ui';
import { FloatingCta } from '@/components/ui/FloatingCta';
import { copy } from '@/lib/i18n/copy';

/** Artboard 13 — Shared recipe preview; save writes guest store + first-save prompt. */
export default function SharedPreviewScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { locale } = useLocale();
  const { colors, type, radius, space } = useTheme();
  const insets = useSafeAreaInsets();
  const { saveSharedRecipe } = useGuestSession();
  const c = copy(locale);
  const [saving, setSaving] = useState(false);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View>
        <FoodPhoto art="bowl" tone="peach" ratio="360/360" />
        <View style={{ position: 'absolute', top: insets.top + 8, left: 12 }}>
          <IconButton
            icon="close"
            label={c.close}
            variant="surface"
            onPress={() => router.replace('/(tabs)')}
          />
        </View>
      </View>

      <View
        style={{
          marginTop: -28,
          flex: 1,
          borderTopLeftRadius: radius.xl,
          borderTopRightRadius: radius.xl,
          backgroundColor: colors.bg,
          paddingHorizontal: space[5],
          paddingTop: space[5],
          gap: space[2],
        }}
      >
        <Text style={[type.caption, { color: colors.inkMuted }]}>
          {c.shared.source}
          {slug ? ` · ${slug}` : ''}
        </Text>
        <Text style={[type['title-1'], { color: colors.ink }]}>{c.shared.title}</Text>
      </View>

      <FloatingCta>
        <Button
          variant="primary"
          size="lg"
          block
          icon="bookmark"
          loading={saving}
          onPress={async () => {
            setSaving(true);
            try {
              const { recipe, prompt } = await saveSharedRecipe();
              if (prompt) router.replace(`/account-prompt?variant=${prompt}`);
              else router.replace(`/recipe/${recipe.id}`);
            } finally {
              setSaving(false);
            }
          }}
        >
          {c.shared.cta}
        </Button>
      </FloatingCta>
    </View>
  );
}
