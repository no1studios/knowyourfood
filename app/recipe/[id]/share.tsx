import { useLocalSearchParams } from 'expo-router';

import { StubScreen } from '@/components/StubScreen';
import { t } from '@/lib/i18n';

/** Artboard 06b — Recipe detail + ShareSheet open */
export default function RecipeShareScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <StubScreen
      artboard={t('recipe.shareTitle')}
      subtitle={`id=${id} · WhatsApp first · pastel target tiles`}
      links={[
        { href: `/recipe/${id}`, label: t('common.back') },
        { href: '/account-prompt?variant=first-share', label: t('accountPrompt.firstShare') },
      ]}
    />
  );
}
