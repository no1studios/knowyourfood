import { Link } from 'expo-router';
import type { Href } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/components/ThemeProvider';
import { t } from '@/lib/i18n';

type LinkItem = { href: Href; label: string };

type Props = {
  /** Locked artboard name from MVP v2 / guest flows. */
  artboard: string;
  subtitle?: string;
  links?: LinkItem[];
  /** Reserve space for floating BottomNav. */
  withBottomNav?: boolean;
};

export function StubScreen({ artboard, subtitle, links = [], withBottomNav }: Props) {
  const { colors, type, space, radius } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{
        paddingTop: insets.top + space[6],
        paddingHorizontal: space[4],
        paddingBottom: withBottomNav ? sizeNavPad(insets.bottom) : insets.bottom + space[8],
        gap: space[3],
      }}
    >
      <Text style={[type.overline, { color: colors.primaryText }]}>{t('common.stub')}</Text>
      <Text style={[type['title-1'], { color: colors.ink }]}>{artboard}</Text>
      {subtitle ? (
        <Text style={[type.body, { color: colors.inkMuted }]}>{subtitle}</Text>
      ) : null}

      <View
        style={[
          styles.chip,
          {
            backgroundColor: colors.primarySoft,
            borderRadius: radius.full,
            paddingHorizontal: space[3],
            paddingVertical: space[2],
            alignSelf: 'flex-start',
          },
        ]}
      >
        <Text style={[type.caption, { color: colors.onPrimarySoft }]}>{t('brand')}</Text>
      </View>

      {links.length > 0 ? (
        <View style={{ marginTop: space[4], gap: space[2] }}>
          {links.map((item) => (
            <Link key={String(item.href)} href={item.href} style={{ paddingVertical: space[2] }}>
              <Text style={[type.label, { color: colors.primaryText }]}>{item.label}</Text>
            </Link>
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}

function sizeNavPad(bottomInset: number) {
  // Floating pill: bottom 12 + nav height 72 + safe inset buffer
  return bottomInset + 12 + 72 + 24;
}

const styles = StyleSheet.create({
  chip: {},
});
