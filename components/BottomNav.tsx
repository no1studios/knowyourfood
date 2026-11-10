import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/components/ThemeProvider';
import { t } from '@/lib/i18n';

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

/**
 * Floating pill BottomNav from MVP v2 frames (not docked DS CSS alone).
 * Inset: left/right/bottom 12, radius-full, shadow-3; active primary-soft pill.
 */
export function BottomNav({ state, descriptors, navigation, navigateToTab }: BottomNavProps) {
  const { colors, type, radius, space, elevation, size } = useTheme();
  const insets = useSafeAreaInsets();

  const labels: Record<string, string> = {
    index: t('nav.recipes'),
    checklist: t('nav.checklist'),
    profile: t('nav.profile'),
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
          },
        ]}
      >
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const { options } = descriptors[route.key];
          const label = labels[route.name] ?? options.title ?? route.name;

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
                  paddingHorizontal: space[3],
                  paddingVertical: space[2],
                },
              ]}
            >
              <Text
                style={[
                  type.caption,
                  {
                    color: focused ? colors.onPrimarySoft : colors.inkMuted,
                    fontFamily: type.label.fontFamily,
                  },
                ]}
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
