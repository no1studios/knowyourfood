import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/components/ThemeProvider';
import { t } from '@/lib/i18n';

export default function NotFoundScreen() {
  const { colors, type, space } = useTheme();

  return (
    <>
      <Stack.Screen options={{ title: 'Not found', headerShown: true }} />
      <View style={[styles.container, { backgroundColor: colors.bg, padding: space[5] }]}>
        <Text style={[type['title-2'], { color: colors.ink }]}>{t('notFound.title')}</Text>
        <Link href="/(tabs)" style={{ marginTop: space[4] }}>
          <Text style={[type.label, { color: colors.primaryText }]}>{t('notFound.home')}</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
