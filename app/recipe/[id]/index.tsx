import { useLocalSearchParams } from 'expo-router';

import { StubScreen } from '@/components/StubScreen';
import { t } from '@/lib/i18n';

/** Artboard 06 — Recipe detail */
export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <StubScreen
      artboard={t('recipe.detailTitle')}
      subtitle={`id=${id} · Edge-to-edge hero · overlay chrome · floating CTA · tabs`}
      links={[
        { href: `/recipe/${id}/share`, label: t('recipe.shareTitle') },
        { href: `/recipe/${id}/edit`, label: t('recipe.editorTitle') },
        { href: '/account-prompt?variant=first-share', label: t('accountPrompt.firstShare') },
        { href: '/(tabs)', label: t('nav.recipes') },
      ]}
    />
  );
}
