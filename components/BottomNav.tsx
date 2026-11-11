import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useLocale } from '@/components/LocaleProvider';
import { useTheme } from '@/components/ThemeProvider';
import { Icon } from '@/components/ui';
import type { IconName } from '@/components/ui';
import { copy } from '@/lib/i18n/copy';

type TabRoute = { key: string; name: string; params?: object };

type BottomNavProps = {
  state: { index: number; routes: TabRoute[] };
  descriptors: Record<string, { options: { title?: string } }>;
  navigateToTab?: (routeKey: string) => void;
  navigation?: {
    emit: (event: {
      type: string;
      target: string;
      canPreventDefault: boolean;
    }) => { defaultPrevented: boolean };
    navigate: (name: string, params?: object) => void;
  };
};

const ICONS: Record<string, IconName> = {
  index: 'book',
  search: 'search',
  checklist: 'cart',
  profile: 'user',
};

/**
 * Floating pill BottomNav from MVP v2 frames (not docked DS CSS alone).
 * Inset: left/right/bottom 12, radius-full, shadow-3; active primary-soft pill.
 */
export function BottomNav({ state, descriptors, navigation, navigateToTab }: BottomNavProps) {
  const { colors, type, radius, space, elevation, size } = useTheme();
  const insets = useSafeAreaInsets();
  const { locale } = useLocale();
  const c = copy(locale);

  const labels: Record<string, string> = {
    index: c.nav.recipes,
    search: c.nav.search,
    checklist: c.nav.list,
    profile: c.nav.profile,
  };

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.wrap,
        {
          paddingBottom: Math.max(insets.bottom, 12),
          paddingHorizontal: 12,
        },
      ]}
    >
      <View
        style={[
          styles.pill,
          elevation[3],
          {
            backgroundColor: colors.surface,
            borderRadius: radius.full,
            minHeight: size['nav-height'] - 8,
            paddingHorizontal: space[2],
            paddingVertical: space[1],
          },
        ]}
      >
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const { options } = descriptors[route.key];
          const label = labels[route.name] ?? options.title ?? route.name;
          const icon = ICONS[route.name] ?? 'more';

          const onPress = () => {
            if (navigateToTab) {
              navigateToTab(route.key);
              return;
            }
            if (!navigation) return;
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={focused ? { selected: true } : {}}
              onPress={onPress}
              style={({ pressed }) => [
                styles.item,
                {
                  backgroundColor: focused ? colors.primarySoft : 'transparent',
                  borderRadius: radius.full,
                  opacity: pressed ? 0.88 : 1,
                  paddingHorizontal: space[2],
                  paddingVertical: space[2],
                  gap: 2,
                },
              ]}
            >
              <Icon name={icon} size={22} color={focused ? colors.ink : colors.inkMuted} />
              <Text
                style={[
                  type.caption,
                  {
                    color: focused ? colors.ink : colors.inkMuted,
                    fontFamily: type.label.fontFamily,
                  },
                ]}
                numberOfLines={1}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
