import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useGuestSession } from '@/components/GuestSession';
import { useLocale } from '@/components/LocaleProvider';
import { useTheme } from '@/components/ThemeProvider';
import { AppHeader, Button, Icon, RecipeCard, Tag, TextField } from '@/components/ui';
import { FloatingCta } from '@/components/ui/FloatingCta';
import { copy } from '@/lib/i18n/copy';

/** Artboard 05 — Import — link found */
export default function ImportScreen() {
  const { locale } = useLocale();
  const { colors, type, space, radius, elevation } = useTheme();
  const { importDemoRecipe } = useGuestSession();
  const insets = useSafeAreaInsets();
  const c = copy(locale);
  const [link, setLink] = useState(c.imp.linkValue);
  const [saving, setSaving] = useState(false);

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
            {c.imp.ways.map((w) => (
              <Pressable
                key={w.title}
                style={[
                  {
                    flex: 1,
                    paddingVertical: 14,
                    paddingHorizontal: 12,
                    borderRadius: radius.lg,
                    backgroundColor: colors.surface,
                    gap: 10,
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
            ))}
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
