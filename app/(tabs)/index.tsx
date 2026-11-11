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

/** Artboards 04 / 04b — My recipes (+ quiet banner A6, signed-in C4) */
export default function MyRecipesScreen() {
  const { state } = useLocalSearchParams<{ state?: string }>();
  const { locale } = useLocale();
  const { colors, type, space, radius } = useTheme();
  const { hasRecipes, setHasRecipes, signedIn, setSignedIn, toast, showToast } = useGuestSession();
  const insets = useSafeAreaInsets();
  const c = copy(locale);
  const bottomPad = 12 + 72 + 24 + insets.bottom;

  useEffect(() => {
    if (state === 'populated' || state === 'signed-in') {
      setHasRecipes(true);
    }
    if (state === 'signed-in') {
      setSignedIn(true);
      showToast(c.merge.keep.toast);
    }
  }, [state, setHasRecipes, setSignedIn, showToast, c.merge.keep.toast]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => showToast(null), 3200);
    return () => clearTimeout(id);
  }, [toast, showToast]);

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
                onPress={() => {
                  setHasRecipes(true);
                  router.push('/import');
                }}
              >
                {c.empty.action}
              </Button>
            }
            secondary={
              <Button
                variant="ghost"
                block
                onPress={() => {
                  setHasRecipes(true);
                  router.push('/recipe/demo/edit');
                }}
              >
                {c.empty.secondary}
              </Button>
            }
          />
        </View>
      </View>
    );
  }

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
                  badge={8}
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
            {c.home.chips.map((ch) => (
              <Chip key={ch.label} size="sm" selected={!!ch.selected} count={ch.count}>
                {ch.label}
              </Chip>
            ))}
          </ScrollView>

          <View style={{ gap: space[2] }}>
            <Text style={[type.overline, { color: colors.inkMuted }]}>{c.home.heroEyebrow}</Text>
            <RecipeCard
              variant="hero"
              title={c.home.hero.title}
              description={c.home.hero.desc}
              tags={c.home.hero.tags}
              diet="veg"
              lang={locale}
              art="bowl"
              tone="haldi"
              time={c.home.hero.time}
              servings={c.home.hero.servings}
              saved
              onPress={() => router.push('/recipe/demo')}
            />
          </View>

          <Text style={[type.overline, { color: colors.inkMuted, marginTop: 4 }]}>
            {c.home.allLabel}
          </Text>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            {c.home.tiles.map((tile) => (
              <View key={tile.title} style={{ width: '48%', flexGrow: 1 }}>
                <RecipeCard
                  variant="tile"
                  title={tile.title}
                  diet={tile.diet}
                  lang={locale}
                  art={tile.art}
                  tone={tile.tone}
                  time={tile.time}
                  saved
                  onPress={() => router.push('/recipe/demo')}
                />
              </View>
            ))}
          </View>

          {!signedIn ? (
            <Pressable onLongPress={() => router.push('/account-prompt?variant=n-recipes')}>
              <AccountPrompt
                variant="banner"
                lang={locale}
                copy={c.home.banner}
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
