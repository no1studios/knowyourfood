import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { useTheme } from '@/components/ThemeProvider';

import { Icon } from './Icon';
import type { IconName, PastelTone } from './types';

type Props = {
  tone?: PastelTone | 'neutral' | 'primary';
  icon?: IconName;
  children: ReactNode;
};

export function Tag({ tone = 'mint', icon, children }: Props) {
  const { colors, type, radius, space } = useTheme();

  const map: Record<string, { bg: string; fg: string }> = {
    mint: { bg: colors.pastelMint, fg: colors.onPastelMint },
    haldi: { bg: colors.pastelHaldi, fg: colors.onPastelHaldi },
    sky: { bg: colors.pastelSky, fg: colors.onPastelSky },
    rose: { bg: colors.pastelRose, fg: colors.onPastelRose },
    pista: { bg: colors.pastelPista, fg: colors.onPastelPista },
    peach: { bg: colors.pastelPeach, fg: colors.onPastelPeach },
    neutral: { bg: colors.surfaceSunken, fg: colors.ink },
    primary: { bg: colors.primarySoft, fg: colors.onPrimarySoft },
  };
  const p = map[tone] ?? map.mint;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: space[1],
        paddingHorizontal: space[3],
        paddingVertical: space[1],
        borderRadius: radius.full,
        backgroundColor: p.bg,
        alignSelf: 'flex-start',
      }}
    >
      {icon ? <Icon name={icon} size={14} color={p.fg} /> : null}
      <Text style={[type.caption, { color: p.fg }]}>{children}</Text>
    </View>
  );
}
