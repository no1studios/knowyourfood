import { Text, View } from 'react-native';

import { useLocale } from '@/components/LocaleProvider';
import { useTheme } from '@/components/ThemeProvider';
import { copy } from '@/lib/i18n/copy';

/** Artboard 08 stub — Shopping checklist (later pass). */
export default function ChecklistScreen() {
  const { colors, type, space } = useTheme();
  const { locale } = useLocale();
  const c = copy(locale);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, padding: space[5], justifyContent: 'center' }}>
      <Text style={[type['title-2'], { color: colors.ink }]}>{c.nav.list}</Text>
      <Text style={[type.body, { color: colors.inkMuted, marginTop: space[2] }]}>
        Checklist aisle UI arrives in a later pass.
      </Text>
    </View>
  );
}
