import { useLocalSearchParams } from 'expo-router';

import { StubScreen } from '@/components/StubScreen';
import { t } from '@/lib/i18n';

/** Artboards 04 / 04b — My recipes */
export default function MyRecipesScreen() {
  const { state } = useLocalSearchParams<{ state?: string }>();
  const empty = state !== 'populated';

  return (
    <StubScreen
      withBottomNav
      artboard={empty ? t('recipes.emptyTitle') : t('recipes.homeTitle')}
      subtitle={
        empty
          ? 'EmptyState brand · Button primary (no Fab) · floating pill nav'
          : 'Hero RecipeCard · Fab primary · banner below grid · floating pill nav'
      }
      links={[
        { href: '/import', label: t('common.importRecipe') },
        { href: '/recipe/demo', label: t('recipe.detailTitle') },
        { href: '/(tabs)?state=populated', label: 'Show 04 · 12 saved' },
        { href: '/(tabs)?state=empty', label: 'Show 04b · empty' },
        { href: '/account-prompt?variant=n-recipes', label: t('accountPrompt.nRecipes') },
        { href: '/account-prompt?variant=banner-quiet', label: t('accountPrompt.bannerQuiet') },
        { href: '/auth/phone', label: t('common.signIn') },
        { href: '/shared/demo-slug', label: t('shared.title') },
      ]}
    />
  );
}
