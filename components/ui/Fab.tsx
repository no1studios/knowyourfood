import { Pressable, Text } from 'react-native';

import { useTheme } from '@/components/ThemeProvider';

import { Icon } from './Icon';
import type { IconName } from './types';

type Props = {
  icon?: IconName;
  label?: string;
  ariaLabel?: string;
  onPress?: () => void;
};

export function Fab({ icon = 'plus', label, ariaLabel, onPress }: Props) {
  const { colors, type, radius, space, elevation, size, opacity } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label ? undefined : ariaLabel || 'Add'}
      onPress={onPress}
      style={({ pressed }) => [
        {
          minWidth: size['control-lg'],
          height: size['control-lg'],
          borderRadius: radius.full,
          backgroundColor: pressed ? colors.primaryPressed : colors.primary,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: space[2],
          paddingHorizontal: label ? space[6] : 0,
          paddingLeft: label ? space[5] : 0,
          opacity: pressed ? opacity.pressed : 1,
        },
        elevation[3],
      ]}
    >
      <Icon name={icon} size={24} strokeWidth={2.25} color={colors.onPrimary} />
      {label ? (
        <Text style={[type.label, { color: colors.onPrimary, fontWeight: '700' }]}>{label}</Text>
      ) : null}
    </Pressable>
  );
}
