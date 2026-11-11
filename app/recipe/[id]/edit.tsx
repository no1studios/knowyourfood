import { useLocalSearchParams } from 'expo-router';

import { StubScreen } from '@/components/StubScreen';
import { t } from '@/lib/i18n';

/** Artboard 07 — Recipe editor */
export default function RecipeEditorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <StubScreen
      artboard={t('recipe.editorTitle')}
      subtitle={`id=${id} · Large photo · Save tonal in header`}
      links={[
        { href: `/recipe/${id}`, label: t('common.back') },
        { href: '/(tabs)', label: t('common.save') },
      ]}
    />
  );
}
