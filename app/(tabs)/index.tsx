import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useGuestSession } from '@/components/GuestSession';
import { useLocale } from '@/components/LocaleProvider';
import { useTheme } from '@/components/ThemeProvider';
import {
  AccountPrompt,
  AppHeader,
  Button,
  Chip,
  EmptyState,
  Fab,
  IconButton,
  RecipeCard,
  Tag,
} from '@/components/ui';
import { copy } from '@/lib/i18n/copy';
import type { GuestRecipe } from '@/lib/guest-store';

function localizedRecipe(recipe: GuestRecipe, hi: boolean) {
  return {
    title: hi && recipe.titleHi ? recipe.titleHi : recipe.title,
    description: hi && recipe.descriptionHi ? recipe.descriptionHi : recipe.description,
    time: hi && recipe.timeHi ? recipe.timeHi : recipe.time,
    servings: hi && recipe.servingsHi ? recipe.servingsHi : recipe.servings,
    tags: recipe.tags.map((t) => ({
      label: hi && t.labelHi ? t.labelHi : t.label,
      tone: t.tone,
    })),
  };
}

/** Artboards 04 / 04b — My recipes backed by guest local store */
export default function MyRecipesScreen() {
  const { state } = useLocalSearchParams<{ state?: string }>();
  const { locale } = useLocale();
  const { colors, type, space, radius } = useTheme();
  const {
    ready,
    recipes,
    hasRecipes,
    signedIn,
    toast,
    showToast,
    seedDemoData,
    claimMerge,
    shoppingItems,
  } = useGuestSession();
  const insets = useSafeAreaInsets();
  const c = copy(locale);
  const hi = locale === 'hi';
  const bottomPad = 12 + 72 + 24 + insets.bottom;
  const unchecked = shoppingItems.filter((i) => !i.checked).length;

  useEffect(() => {
    if (!ready) return;
    if (state === 'populated') {
      void seedDemoData();
    }
    if (state === 'signed-in') {
      void (async () => {
        await seedDemoData();
        await claimMerge('keep-all');
        showToast(c.merge.keep.toast);
      })();
    }
  }, [state, ready, seedDemoData, claimMerge, showToast, c.merge.keep.toast]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => showToast(null), 3200);
    return () => clearTimeout(id);
  }, [toast, showToast]);

  if (!ready) {
    return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  }

  if (!hasRecipes) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <View style={{ flex: 1, justifyContent: 'center', paddingBottom: 84 }}>
          <EmptyState
            brand
            eyebrow={c.empty.eyebrow}
            artName="thali"
            tone="haldi"
            title={c.empty.title}
            body={c.empty.body}
            action={
              <Button
                variant="primary"
                size="lg"
                block
                icon="download"
                onPress={() => router.push('/import')}
              >
                {c.empty.action}
              </Button>
            }
            secondary={
              <Button variant="ghost" block onPress={() => router.push('/recipe/demo/edit')}>
                {c.empty.secondary}
              </Button>
            }
          />
        </View>
      </View>
    );
  }

  const hero = recipes[0];
  const tiles = recipes.slice(1);
  const heroL = localizedRecipe(hero, hi);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: bottomPad }}>
        <AppHeader
          variant="brand"
          title={c.home.title}
          actions={
            <>
              <IconButton icon="search" label={c.home.search} variant="surface" />
              {signedIn ? (
                <IconButton
                  icon="user"
                  label={c.nav.profile}
                  variant="tonal"
                  onPress={() => router.push('/(tabs)/profile')}
                />
              ) : (
                <IconButton
                  icon="cart"
                  label={c.home.list}
                  variant="surface"
                  badge={unchecked || undefined}
                  onPress={() => router.push('/(tabs)/checklist')}
                />
              )}
            </>
          }
        />

        <View style={{ paddingHorizontal: space[5], gap: space[4] }}>
          {signedIn ? (
            <View style={{ alignSelf: 'flex-start' }}>
              <Tag tone="mint" icon="check">
                {c.home.synced}
              </Tag>
            </View>
          ) : null}

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            <Chip size="sm" selected count={recipes.length}>
              {hi ? 'सभी' : 'All'}
            </Chip>
          </ScrollView>

          <View style={{ gap: space[2] }}>
            <Text style={[type.overline, { color: colors.inkMuted }]}>{c.home.heroEyebrow}</Text>
            <RecipeCard
              variant="hero"
              title={heroL.title}
              description={heroL.description}
              tags={heroL.tags}
              diet={hero.diet}
              lang={locale}
              art={hero.art}
              tone={hero.tone}
              time={heroL.time}
              servings={heroL.servings}
              saved
              onPress={() => router.push(`/recipe/${hero.id}`)}
            />
          </View>

          {tiles.length > 0 ? (
            <>
              <Text style={[type.overline, { color: colors.inkMuted, marginTop: 4 }]}>
                {c.home.allLabel}
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                {tiles.map((tile) => {
                  const L = localizedRecipe(tile, hi);
                  return (
                    <View key={tile.id} style={{ width: '48%', flexGrow: 1 }}>
                      <RecipeCard
                        variant="tile"
                        title={L.title}
                        diet={tile.diet}
                        lang={locale}
                        art={tile.art}
                        tone={tile.tone}
                        time={L.time}
                        saved
                        onPress={() => router.push(`/recipe/${tile.id}`)}
                      />
                    </View>
                  );
                })}
              </View>
            </>
          ) : null}

          {!signedIn ? (
            <Pressable onLongPress={() => router.push('/account-prompt?variant=n-recipes')}>
              <AccountPrompt
                variant="banner"
                lang={locale}
                copy={{
                  title: hi
                    ? `अपनी ${recipes.length} रेसिपी का बैकअप लें`
                    : recipes.length === 1
                      ? 'Back up your 1 recipe'
                      : `Back up your ${recipes.length} recipes`,
                  body: c.home.banner.body,
                  primary: c.home.banner.primary,
                }}
                onPrimary={() => router.push('/auth/phone')}
              />
            </Pressable>
          ) : null}
        </View>
      </ScrollView>

      {toast ? (
        <View
          style={{
            position: 'absolute',
            left: space[5],
            right: space[5],
            top: insets.top + 8,
            zIndex: 6,
            paddingVertical: space[3],
            paddingHorizontal: space[4],
            borderRadius: radius.lg,
            backgroundColor: colors.ink,
          }}
        >
          <Text style={[type.label, { color: colors.inkInverse, textAlign: 'center' }]}>{toast}</Text>
        </View>
      ) : null}

      <View style={{ position: 'absolute', right: 16, bottom: bottomPad - 24, zIndex: 4 }}>
        <Fab icon="download" label={c.home.fab} onPress={() => router.push('/import')} />
      </View>
    </View>
  );
}
