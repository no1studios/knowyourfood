import type { ReactNode } from 'react';
import { Pressable, Text } from 'react-native';

import { useTheme } from '@/components/ThemeProvider';

import { Icon } from './Icon';
import type { IconName } from './types';

type Props = {
  selected?: boolean;
  icon?: IconName;
  count?: number;
  size?: 'sm' | 'md';
  disabled?: boolean;
  onPress?: () => void;
  children: ReactNode;
};

export function Chip({ selected, icon, count, size = 'md', disabled, onPress, children }: Props) {
  const { colors, type, radius, space, size: sz, opacity } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: size === 'sm' ? 32 : sz['control-sm'],
        paddingHorizontal: size === 'sm' ? space[3] : space[4],
        borderRadius: radius.full,
        backgroundColor: selected ? colors.ink : colors.surface,
        borderWidth: selected ? 0 : 1,
        borderColor: colors.border,
        flexDirection: 'row',
        alignItems: 'center',
        gap: space[1],
        opacity: disabled ? opacity.disabled : pressed ? opacity.pressed : 1,
      })}
    >
      {selected && !icon ? (
        <Icon name="check" size={16} color={colors.inkInverse} />
      ) : icon ? (
        <Icon name={icon} size={16} color={selected ? colors.inkInverse : colors.ink} />
      ) : null}
      <Text
        style={[
          type.label,
          {
            fontSize: size === 'sm' ? 13 : 14,
            color: selected ? colors.inkInverse : colors.ink,
          },
        ]}
      >
        {children}
      </Text>
      {count != null ? (
        <Text
          style={[
            type.caption,
            { color: selected ? colors.inkInverse : colors.inkMuted, opacity: 0.72 },
          ]}
        >
          {count}
        </Text>
      ) : null}
    </Pressable>
  );
}
