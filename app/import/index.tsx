import { StubScreen } from '@/components/StubScreen';
import { t } from '@/lib/i18n';

/** Artboard 05 — Import — link found */
export default function ImportScreen() {
  return (
    <StubScreen
      artboard={t('import.title')}
      subtitle="Other ways as tiles · floating CTA"
      links={[
        { href: '/account-prompt?variant=first-import', label: t('accountPrompt.firstImport') },
        { href: '/recipe/demo', label: t('recipe.detailTitle') },
        { href: '/(tabs)', label: t('nav.recipes') },
      ]}
    />
  );
}
