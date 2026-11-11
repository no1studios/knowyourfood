import { ActivityIndicator, Pressable, Text } from 'react-native';
import type { ReactNode } from 'react';

import { useTheme } from '@/components/ThemeProvider';
import { useLocale } from '@/components/LocaleProvider';

import { Icon } from './Icon';
import type { IconName } from './types';

type Variant = 'primary' | 'secondary' | 'tonal' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

type Props = {
  variant?: Variant;
  size?: Size;
  icon?: IconName;
  iconRight?: IconName;
  block?: boolean;
  loading?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  children: ReactNode;
};

export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  block,
  loading,
  disabled,
  onPress,
  children,
}: Props) {
  const { colors, type, radius, space, size: sz, opacity } = useTheme();
  const { locale } = useLocale();
  const labelStyle = locale === 'hi' ? type.label : type.label;

  const heights = { sm: sz['control-sm'], md: sz['control-md'], lg: sz['control-lg'] } as const;
  const radii = { sm: radius.full, md: radius.md, lg: radius.md } as const;

  const palette: Record<Variant, { bg: string; fg: string; border?: string; pressed: string }> = {
    primary: { bg: colors.primary, fg: colors.onPrimary, pressed: colors.primaryPressed },
    secondary: {
      bg: colors.surface,
      fg: colors.ink,
      border: colors.borderStrong,
      pressed: colors.surfaceSunken,
    },
    tonal: { bg: colors.primarySoft, fg: colors.onPrimarySoft, pressed: colors.primarySoft },
    ghost: { bg: 'transparent', fg: colors.primaryText, pressed: colors.primarySoft },
    danger: { bg: colors.danger, fg: colors.inkInverse, pressed: colors.danger },
  };
  const p = palette[variant];

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: heights[size],
        paddingHorizontal: size === 'sm' ? space[4] : size === 'lg' ? space[6] : space[5],
        borderRadius: radii[size],
        backgroundColor: pressed ? p.pressed : p.bg,
        borderWidth: p.border ? 1.5 : 0,
        borderColor: p.border,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: space[2],
        alignSelf: block ? 'stretch' : 'auto',
        width: block ? '100%' : undefined,
        opacity: disabled ? opacity.disabled : 1,
        transform: [{ scale: pressed && !disabled ? 0.98 : 1 }],
      })}
    >
      {loading ? (
        <ActivityIndicator color={p.fg} />
      ) : icon ? (
        <Icon name={icon} size={20} color={p.fg} />
      ) : null}
      <Text
        style={[
          labelStyle,
          {
            color: p.fg,
            fontSize: size === 'lg' ? 16 : size === 'sm' ? 14 : 15,
            paddingVertical: space[2],
          },
        ]}
      >
        {children}
      </Text>
      {iconRight && !loading ? <Icon name={iconRight} size={20} color={p.fg} /> : null}
    </Pressable>
  );
}
