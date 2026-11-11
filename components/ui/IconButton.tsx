import { Pressable, Text, View } from 'react-native';

import { useTheme } from '@/components/ThemeProvider';

import { Icon } from './Icon';
import type { IconName } from './types';

type Props = {
  icon: IconName;
  label: string;
  variant?: 'plain' | 'surface' | 'tonal' | 'filled';
  size?: 'sm' | 'md';
  pressed?: boolean;
  badge?: number | string;
  onPress?: () => void;
  disabled?: boolean;
};

export function IconButton({
  icon,
  label,
  variant = 'plain',
  size = 'md',
  pressed,
  badge,
  onPress,
  disabled,
}: Props) {
  const { colors, elevation, radius, size: sz, opacity, type } = useTheme();
  const dim = size === 'sm' ? sz['control-sm'] : sz['control-md'];

  const bg =
    variant === 'surface'
      ? colors.surface
      : variant === 'tonal'
        ? colors.primarySoft
        : variant === 'filled'
          ? colors.primary
          : 'transparent';
  const fg =
    variant === 'filled'
      ? colors.onPrimary
      : variant === 'tonal'
        ? colors.onPrimarySoft
        : pressed
          ? colors.primaryText
          : colors.ink;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: !!pressed }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed: isPressed }) => [
        {
          width: dim,
          height: dim,
          borderRadius: radius.full,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: bg,
          opacity: disabled ? opacity.disabled : isPressed ? opacity.pressed : 1,
        },
        variant === 'surface' ? elevation[1] : null,
      ]}
    >
      <Icon name={icon} size={size === 'sm' ? 18 : 22} color={fg} />
      {badge != null ? (
        <View
          style={{
            position: 'absolute',
            top: 4,
            right: 4,
            minWidth: 18,
            height: 18,
            paddingHorizontal: 5,
            borderRadius: radius.full,
            backgroundColor: colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={[type.overline, { color: colors.onPrimary, fontSize: 11, lineHeight: 14 }]}>
            {badge}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}
