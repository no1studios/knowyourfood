import type { ReactNode } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/components/ThemeProvider';

/** Bottom floating primary CTA with gradient-feel pad from MVP onboarding frames. */
export function FloatingCta({ children }: { children: ReactNode }) {
  const { colors, space, elevation, radius } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        paddingHorizontal: space[4],
        paddingTop: space[8],
        paddingBottom: Math.max(insets.bottom, space[4]),
        backgroundColor: colors.bg,
      }}
    >
      <View style={[{ borderRadius: radius.md }, elevation[3]]}>{children}</View>
    </View>
  );
}
