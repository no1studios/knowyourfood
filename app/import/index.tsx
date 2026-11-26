import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useGuestSession } from '@/components/GuestSession';
import { useLocale } from '@/components/LocaleProvider';
import { useTheme } from '@/components/ThemeProvider';
import { AppHeader, Button, Icon, RecipeCard, Tag, TextField } from '@/components/ui';
import { FloatingCta } from '@/components/ui/FloatingCta';
import type { GuestRecipe } from '@/lib/guest-store';
import { copy } from '@/lib/i18n/copy';

type WayKey = 'screenshot' | 'text' | 'manual';

const WAY_SOURCES: WayKey[] = ['screenshot', 'text', 'manual'];

/** Artboard 05 — Import — link found */
export default function ImportScreen() {
  const { locale } = useLocale();
  const { colors, type, space, radius, elevation } = useTheme();
  const { importDemoRecipe, createManualRecipe, showToast } = useGuestSession();
  const insets = useSafeAreaInsets();
  const c = copy(locale);
  const [link, setLink] = useState(c.imp.linkValue);
  const [saving, setSaving] = useState(false);
  const [creatingWay, setCreatingWay] = useState<WayKey | null>(null);

  const toneBg = {
    mint: colors.pastelMint,
    sky: colors.pastelSky,
    haldi: colors.pastelHaldi,
  } as const;
  const toneFg = {
    mint: colors.onPastelMint,
    sky: colors.onPastelSky,
    haldi: colors.onPastelHaldi,
  } as const;

  const openCreated = async (
    source: GuestRecipe['importSource'],
    way: WayKey,
  ) => {
    if (creatingWay || saving) return;
    setCreatingWay(way);
    try {
      const { recipe, prompt } = await createManualRecipe(source);
      if (prompt) {
        router.replace(`/account-prompt?variant=${prompt}`);
      } else {
        router.replace(`/recipe/${recipe.id}/edit`);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Could not create recipe';
      showToast(message);
    } finally {
      setCreatingWay(null);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <AppHeader
        variant="compact"
        title={c.imp.title}
        backLabel={c.back}
        onBack={() => router.back()}
      />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: space[5],
          paddingTop: space[2],
          paddingBottom: 140 + insets.bottom,
          gap: space[6],
        }}
      >
        <TextField
          label={c.imp.field}
          icon="link"
          value={link}
          onChangeText={setLink}
          helper={c.imp.helper}
        />

        <View style={{ gap: 10 }}>
          <View style={{ flexDirection: 'row' }}>
            <Tag tone="mint" icon="check">
              {c.imp.found}
            </Tag>
          </View>
          <RecipeCard
            variant="row"
            title={c.imp.cardTitle}
            diet="veg"
            lang={locale}
            art="bowl"
            tone="haldi"
            source="Instagram"
            time={c.imp.cardTime}
            servings={c.imp.cardServ}
            onPress={() => router.push('/recipe/demo')}
          />
          <Text style={[type.caption, { color: colors.inkMuted }]}>{c.imp.counts}</Text>
        </View>

        <View style={{ gap: space[3] }}>
          <Text style={[type.overline, { color: colors.inkMuted }]}>{c.imp.other}</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {c.imp.ways.map((w, i) => {
              const way = WAY_SOURCES[i] ?? 'manual';
              const busy = creatingWay === way;
              return (
                <Pressable
                  key={w.title}
                  accessibilityRole="button"
                  disabled={Boolean(creatingWay) || saving}
                  onPress={() => void openCreated(way, way)}
                  style={({ pressed }) => [
                    {
                      flex: 1,
                      paddingVertical: 14,
                      paddingHorizontal: 12,
                      borderRadius: radius.lg,
                      backgroundColor: colors.surface,
                      gap: 10,
                      opacity: pressed || busy ? 0.85 : 1,
                    },
                    elevation[1],
                  ]}
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: radius.md,
                      backgroundColor: toneBg[w.tone],
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon name={w.icon} size={20} color={toneFg[w.tone]} />
                  </View>
                  <Text style={[type.label, { color: colors.ink }]}>{w.title}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>

      <FloatingCta>
        <Button
          variant="primary"
          size="lg"
          block
          icon="bookmark"
          loading={saving}
          disabled={Boolean(creatingWay)}
          onPress={async () => {
            setSaving(true);
            try {
              const { recipe, prompt } = await importDemoRecipe(link);
              if (prompt) {
                router.replace(`/account-prompt?variant=${prompt}`);
              } else {
                router.replace(`/recipe/${recipe.id}`);
              }
            } finally {
              setSaving(false);
            }
          }}
        >
          {c.imp.cta}
        </Button>
      </FloatingCta>
    </View>
  );
}
