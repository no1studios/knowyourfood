import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { useLocale } from '@/components/LocaleProvider';
import { useTheme } from '@/components/ThemeProvider';
import { Button } from '@/components/ui';
import { copy } from '@/lib/i18n/copy';
import { t } from '@/lib/i18n';

/** Artboard 12 stub — Profile / settings (later pass). */
export default function ProfileScreen() {
  const { colors, type, space } = useTheme();
  const { locale } = useLocale();
  const c = copy(locale);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, padding: space[5], justifyContent: 'center', gap: space[4] }}>
      <Text style={[type['title-2'], { color: colors.ink }]}>{c.nav.profile}</Text>
      <Text style={[type.body, { color: colors.inkMuted }]}>
        Profile ListRows arrive in a later pass.
      </Text>
      <Button variant="tonal" onPress={() => router.push('/auth/phone')}>
        {t('common.signIn')}
      </Button>
    </View>
  );
}
