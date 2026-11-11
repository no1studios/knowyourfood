import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

import { useTheme } from '@/components/ThemeProvider';

import { Checkbox } from './Checkbox';
import { Icon } from './Icon';
import type { IconName, PastelTone } from './types';

type Props = {
  title: string;
  subtitle?: string;
  trailing?: string;
  checkable?: boolean;
  checked?: boolean;
  chevron?: boolean;
  icon?: IconName;
  iconTone?: PastelTone;
  onPress?: () => void;
  leading?: ReactNode;
};

export function ListRow({
  title,
  subtitle,
  trailing,
  checkable,
  checked,
  chevron,
  icon,
  iconTone,
  onPress,
  leading,
}: Props) {
  const { colors, type, radius, space } = useTheme();

  const toneBg = iconTone
    ? {
        mint: colors.pastelMint,
        haldi: colors.pastelHaldi,
        sky: colors.pastelSky,
        rose: colors.pastelRose,
        pista: colors.pastelPista,
        peach: colors.pastelPeach,
      }[iconTone]
    : colors.surfaceSunken;

  const toneFg = iconTone
    ? {
        mint: colors.onPastelMint,
        haldi: colors.onPastelHaldi,
        sky: colors.onPastelSky,
        rose: colors.onPastelRose,
        pista: colors.onPastelPista,
        peach: colors.onPastelPeach,
      }[iconTone]
    : colors.ink;

  return (
    <Pressable
      accessibilityRole={checkable ? 'checkbox' : onPress ? 'button' : undefined}
      accessibilityState={checkable ? { checked: !!checked } : undefined}
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: space[3],
        paddingVertical: space[3],
        paddingHorizontal: space[4],
        minHeight: 64,
        backgroundColor: pressed && onPress ? colors.surfaceSunken : colors.surface,
      })}
    >
      {checkable ? <Checkbox checked={checked} label={title} onChange={onPress} /> : null}
      {leading}
      {icon ? (
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: radius.full,
            backgroundColor: toneBg,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name={icon} size={20} color={toneFg} />
        </View>
      ) : null}
      <View style={{ flex: 1, gap: 2, minWidth: 0 }}>
        <Text
          style={[
            type.label,
            {
              color: checked ? colors.inkMuted : colors.ink,
              textDecorationLine: checked ? 'line-through' : 'none',
            },
          ]}
          numberOfLines={2}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text style={[type.caption, { color: colors.inkMuted }]} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {trailing ? (
        <Text style={[type.body, { color: colors.inkMuted, flexShrink: 0 }]}>{trailing}</Text>
      ) : null}
      {chevron ? <Icon name="chevronRight" size={18} color={colors.inkMuted} /> : null}
    </Pressable>
  );
}
