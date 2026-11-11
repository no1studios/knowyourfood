import { Text, View } from 'react-native';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';

import { useTheme } from '@/components/ThemeProvider';

import type { Diet, Locale } from './types';

type Props = {
  diet: Diet;
  lang?: Locale;
  label?: string;
  compact?: boolean;
  onImage?: boolean;
  size?: number;
};

const COPY: Record<Diet, { en: string; hi: string; mark: 'dot' | 'jain' | 'tri' | 'leaf'; tone: 'veg' | 'egg' | 'nonveg' }> = {
  veg: { en: 'Veg', hi: 'शाकाहारी', mark: 'dot', tone: 'veg' },
  jain: { en: 'Jain', hi: 'जैन', mark: 'jain', tone: 'veg' },
  egg: { en: 'Contains egg', hi: 'अंडा', mark: 'dot', tone: 'egg' },
  nonveg: { en: 'Non-veg', hi: 'मांसाहारी', mark: 'tri', tone: 'nonveg' },
  vegan: { en: 'Vegan', hi: 'वीगन', mark: 'leaf', tone: 'veg' },
};

function DietMark({ diet, size = 14, color }: { diet: Diet; size?: number; color: string }) {
  const d = COPY[diet];
  return (
    <Svg width={size} height={size} viewBox="0 0 14 14">
      <Rect x={0.75} y={0.75} width={12.5} height={12.5} rx={2.5} fill="none" stroke={color} strokeWidth={1.5} />
      {d.mark === 'tri' ? (
        <Path d="M7 3.6 10.4 9.8H3.6z" fill={color} />
      ) : d.mark === 'jain' ? (
        <G>
          <Circle cx={7} cy={7} r={2.6} fill={color} />
          <Path d="M4 11h6" stroke={color} strokeWidth={1.4} strokeLinecap="round" />
        </G>
      ) : d.mark === 'leaf' ? (
        <Path d="M4 10.2c0-3.6 2.4-6 6.2-6.4 0 3.9-2.4 6.4-6.2 6.4z" fill={color} />
      ) : (
        <Circle cx={7} cy={7} r={3} fill={color} />
      )}
    </Svg>
  );
}

export function DietBadge({ diet, lang = 'en', label, compact, onImage, size }: Props) {
  const { colors, type, radius, space, elevation } = useTheme();
  const meta = COPY[diet];
  const markColor =
    meta.tone === 'egg' ? colors.dietEgg : meta.tone === 'nonveg' ? colors.dietNonveg : colors.dietVeg;
  const text = label ?? meta[lang];

  if (compact) {
    return (
      <View accessibilityLabel={text}>
        <DietMark diet={diet} size={size ?? 18} color={markColor} />
      </View>
    );
  }

  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: space[2],
          paddingHorizontal: space[2],
          paddingVertical: space[1],
          borderRadius: radius.full,
          backgroundColor: onImage ? colors.surface : 'transparent',
        },
        onImage ? elevation[1] : null,
      ]}
    >
      <DietMark diet={diet} size={size ?? 14} color={markColor} />
      <Text style={[type.caption, { color: colors.ink }]}>{text}</Text>
    </View>
  );
}
