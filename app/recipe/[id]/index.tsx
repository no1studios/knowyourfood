import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useGuestSession } from '@/components/GuestSession';
import { useLocale } from '@/components/LocaleProvider';
import { useTheme } from '@/components/ThemeProvider';
import {
  Button,
  Chip,
  DietBadge,
  FoodPhoto,
  Icon,
  IconButton,
  Tag,
} from '@/components/ui';
import { FloatingCta } from '@/components/ui/FloatingCta';
import { copy } from '@/lib/i18n/copy';
import { buildDemoRecipes } from '@/lib/guest-store';

/** Artboard 06 — Recipe detail (reads guest store; falls back to demo dal). */
export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { locale } = useLocale();
  const { colors, type, space, radius, elevation } = useTheme();
  const { getRecipe, addIngredientsToList, showToast } = useGuestSession();
  const insets = useSafeAreaInsets();
  const c = copy(locale);
  const hi = locale === 'hi';
  const [tab, setTab] = useState<'ing' | 'steps'>('ing');
  const [saved, setSaved] = useState(true);

  const recipe = useMemo(() => {
    const found = id ? getRecipe(id) : undefined;
    if (found) return found;
    if (id === 'demo') return buildDemoRecipes()[0];
    return buildDemoRecipes()[0];
  }, [id, getRecipe]);

  const title = hi && recipe.titleHi ? recipe.titleHi : recipe.title;
  const source = hi && recipe.sourceHi ? recipe.sourceHi : recipe.source || c.det.source;
  const ingredients = recipe.ingredients.map((ing) => ({
    title: hi && ing.titleHi ? ing.titleHi : ing.title,
    qty: ing.qty,
  }));
  const steps =
    hi && recipe.stepsHi && recipe.stepsHi.length
      ? recipe.stepsHi
      : recipe.steps.length
        ? recipe.steps
        : c.det.steps;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View
        pointerEvents="box-none"
        style={{
          position: 'absolute',
          top: insets.top + 8,
          left: 12,
          right: 12,
          zIndex: 5,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <IconButton icon="chevronLeft" label={c.back} variant="surface" onPress={() => router.back()} />
        <View style={{ flex: 1 }} />
        <IconButton
          icon="share"
          label={c.det.share}
          variant="surface"
          onPress={() => router.push(`/recipe/${recipe.id}/share`)}
        />
        <IconButton
          icon="edit"
          label={c.det.edit}
          variant="surface"
          onPress={() => router.push(`/recipe/${recipe.id}/edit`)}
        />
      </View>

      <ScrollView bounces={false} contentContainerStyle={{ paddingBottom: 140 + insets.bottom }}>
        <View>
          <FoodPhoto art={recipe.art} tone={recipe.tone} ratio="360/360" alt={title} />
          <View style={{ position: 'absolute', right: 16, bottom: 40 }}>
            <IconButton
              icon="bookmark"
              label={c.det.saved}
              variant="surface"
              pressed={saved}
              onPress={() => setSaved((v) => !v)}
            />
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
          <View style={{ gap: space[2] }}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
              <DietBadge diet={recipe.diet} lang={locale} />
              {recipe.tags.map((tg) => (
                <Tag key={tg.label} tone={tg.tone}>
                  {hi && tg.labelHi ? tg.labelHi : tg.label}
                </Tag>
              ))}
            </View>
            <Text style={[type['title-1'], { color: colors.ink }]}>{title}</Text>
            <Text style={[type.caption, { color: colors.inkMuted }]}>{source}</Text>
          </View>

          <View style={{ flexDirection: 'row', gap: 8 }}>
            {[
              {
                icon: 'clock' as const,
                v: hi && recipe.timeHi ? recipe.timeHi : recipe.time || c.det.stats[0].v,
                k: c.det.stats[0].k,
              },
              {
                icon: 'users' as const,
                v: hi && recipe.servingsHi ? recipe.servingsHi : recipe.servings || c.det.stats[1].v,
                k: c.det.stats[1].k,
              },
              {
                icon: 'flame' as const,
                v: hi && recipe.spiceHi ? recipe.spiceHi : recipe.spice || c.det.stats[2].v,
                k: c.det.stats[2].k,
              },
            ].map((s) => (
              <View
                key={s.k}
                style={[
                  {
                    flex: 1,
                    paddingVertical: 10,
                    paddingHorizontal: 12,
                    borderRadius: radius.md,
                    backgroundColor: colors.surface,
                    gap: 2,
                  },
                  elevation[1],
                ]}
              >
                <Icon name={s.icon} size={18} color={colors.inkMuted} />
                <Text style={[type.label, { color: colors.ink, fontWeight: '700' }]}>{s.v}</Text>
                <Text style={[type.caption, { color: colors.inkMuted }]}>{s.k}</Text>
              </View>
            ))}
          </View>

          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Chip selected={tab === 'ing'} count={ingredients.length} onPress={() => setTab('ing')}>
              {c.det.tabIng}
            </Chip>
            <Chip selected={tab === 'steps'} count={steps.length} onPress={() => setTab('steps')}>
              {c.det.tabSteps}
            </Chip>
          </View>

          {tab === 'ing' ? (
            <View>
              {ingredients.map((r) => (
                <View
                  key={r.title}
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    gap: 12,
                    paddingVertical: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                  }}
                >
                  <Text style={[type.body, { color: colors.ink, fontWeight: '600', flex: 1 }]}>
                    {r.title}
                  </Text>
                  <Text style={[type.body, { color: colors.inkMuted }]}>{r.qty}</Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={{ gap: space[4] }}>
              {steps.map((text, i) => (
                <View key={`${i}-${text.slice(0, 12)}`} style={{ flexDirection: 'row', gap: 12 }}>
                  <View
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: radius.full,
                      backgroundColor: colors.primarySoft,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={[type.caption, { color: colors.onPrimarySoft, fontWeight: '700' }]}>
                      {i + 1}
                    </Text>
                  </View>
                  <Text style={[type['body-lg'], { color: colors.ink, flex: 1 }]}>{text}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <FloatingCta>
        <Button
          variant="primary"
          size="lg"
          block
          icon="cart"
          onPress={async () => {
            await addIngredientsToList(recipe.id);
            showToast(hi ? 'शॉपिंग सूची में जोड़ा गया' : 'Added to shopping list');
            router.push('/(tabs)/checklist');
          }}
        >
          {c.det.cta}
        </Button>
      </FloatingCta>
    </View>
  );
}
