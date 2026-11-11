import { StubScreen } from '@/components/StubScreen';
import { t } from '@/lib/i18n';

/** Artboard 08 — Shopping checklist */
export default function ChecklistScreen() {
  return (
    <StubScreen
      withBottomNav
      artboard={t('checklist.title')}
      subtitle="Dense ListRow groups by aisle · floating pill nav · Fab"
      links={[{ href: '/(tabs)', label: t('nav.recipes') }]}
    />
  );
}
