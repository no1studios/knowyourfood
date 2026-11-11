import { Text, View } from 'react-native';

import { useLocale } from '@/components/LocaleProvider';
import { useTheme } from '@/components/ThemeProvider';
import { copy } from '@/lib/i18n/copy';

/** Search tab stub — present in locked BottomNav chrome. */
export default function SearchScreen() {
  const { colors, type, space } = useTheme();
  const { locale } = useLocale();
  const c = copy(locale);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, padding: space[5], justifyContent: 'center' }}>
      <Text style={[type['title-2'], { color: colors.ink }]}>{c.nav.search}</Text>
      <Text style={[type.body, { color: colors.inkMuted, marginTop: space[2] }]}>
        Search UI arrives in a later pass.
      </Text>
    </View>
  );
}
