import { router, useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';

import { useGuestSession } from '@/components/GuestSession';
import { useLocale } from '@/components/LocaleProvider';
import { useTheme } from '@/components/ThemeProvider';
import { FoodPhoto, ShareSheet } from '@/components/ui';
import { copy } from '@/lib/i18n/copy';
import { buildDemoRecipes } from '@/lib/guest-store';

/** Artboard 06b — Share sheet; first share triggers AccountPrompt. */
export default function RecipeShareScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { locale } = useLocale();
  const { colors, type, radius, space } = useTheme();
  const { getRecipe, recordShare, addIngredientsToList } = useGuestSession();
  const c = copy(locale);
  const hi = locale === 'hi';
  const recipe = (id && getRecipe(id)) || buildDemoRecipes()[0];
  const title = hi && recipe.titleHi ? recipe.titleHi : recipe.title;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <FoodPhoto art={recipe.art} tone={recipe.tone} ratio="360/360" />
      <View
        style={{
          marginTop: -24,
          borderTopLeftRadius: radius.xl,
          borderTopRightRadius: radius.xl,
          backgroundColor: colors.bg,
          padding: space[5],
        }}
      >
        <Text style={[type['title-1'], { color: colors.ink }]}>{title}</Text>
      </View>

      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 6 }}>
        <ShareSheet
          inline
          title={c.share.title}
          recipe={{
            title,
            subtitle: `knowyourfood.app/r/${recipe.id.replace(/^recipe_/, '')}`,
            art: recipe.art,
            tone: recipe.tone,
          }}
          targets={c.share.targets}
          options={c.share.options}
          onClose={() => router.back()}
          onSelectTarget={async () => {
            const prompt = await recordShare(recipe.id);
            if (prompt) router.replace(`/account-prompt?variant=${prompt}`);
            else router.replace(`/recipe/${recipe.id}`);
          }}
          onSelectOption={async () => {
            await addIngredientsToList(recipe.id);
            router.replace('/(tabs)/checklist');
          }}
        />
      </View>
    </View>
  );
}
