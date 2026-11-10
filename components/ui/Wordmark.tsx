import { Text, View } from 'react-native';

import { useTheme } from '@/components/ThemeProvider';
import { fontFace } from '@/src/theme';

type Props = { size?: 'sm' | 'md' | 'lg' };

const SIZE = {
  sm: { fontSize: 15, lineHeight: 20, dot: 10 },
  md: { fontSize: 20, lineHeight: 24, dot: 14 },
  lg: { fontSize: 28, lineHeight: 32, dot: 20 },
} as const;

export function Wordmark({ size = 'md' }: Props) {
  const { colors, space } = useTheme();
  const s = SIZE[size];

  return (
    <View
      accessibilityRole="header"
      style={{ flexDirection: 'row', alignItems: 'center', gap: space[2] }}
    >
      <View
        style={{
          width: s.dot,
          height: s.dot,
          borderRadius: 999,
          backgroundColor: colors.primary,
        }}
      />
      <Text
        style={{
          fontFamily: fontFace.sans[800],
          fontSize: s.fontSize,
          lineHeight: s.lineHeight,
          letterSpacing: -0.4,
          color: colors.ink,
        }}
      >
        Know Your <Text style={{ color: colors.primaryText }}>Food</Text>
      </Text>
    </View>
  );
}
