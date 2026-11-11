import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { useTheme } from '@/components/ThemeProvider';
import { fontFace } from '@/src/theme';

import { FoodPhoto } from './FoodPhoto';
import type { FoodArt, PastelTone } from './types';

type Props = {
  title: string;
  body?: string;
  brand?: boolean;
  eyebrow?: string;
  artName?: FoodArt;
  tone?: PastelTone;
  action?: ReactNode;
  secondary?: ReactNode;
};

export function EmptyState({
  title,
  body,
  brand,
  eyebrow,
  artName = 'thali',
  tone = 'haldi',
  action,
  secondary,
}: Props) {
  const { colors, type, space, radius } = useTheme();

  return (
    <View
      style={{
        alignItems: 'center',
        paddingHorizontal: space[6],
        paddingVertical: space[8],
        gap: space[2],
      }}
    >
      {brand ? (
        <View style={{ alignItems: 'center', gap: space[1], marginBottom: space[6] }}>
          <Text style={[type.label, { color: colors.inkMuted }]}>{eyebrow || 'Welcome to'}</Text>
          <Text
            style={{
              fontFamily: fontFace.sans[800],
              fontSize: 34,
              lineHeight: 40,
              letterSpacing: -0.68,
              color: colors.ink,
              textAlign: 'center',
            }}
          >
            Know Your <Text style={{ color: colors.primaryText }}>Food</Text>
          </Text>
        </View>
      ) : null}

      <View
        style={{
          width: 168,
          borderRadius: radius['2xl'],
          overflow: 'hidden',
          marginBottom: space[4],
        }}
      >
        <FoodPhoto art={artName} tone={tone} ratio="1/1" />
      </View>

      <Text style={[type['title-2'], { color: colors.ink, textAlign: 'center' }]}>{title}</Text>
      {body ? (
        <Text style={[type.body, { color: colors.inkMuted, textAlign: 'center', maxWidth: 280 }]}>
          {body}
        </Text>
      ) : null}

      {(action || secondary) && (
        <View style={{ width: '100%', maxWidth: 280, gap: space[2], marginTop: space[5] }}>
          {action}
          {secondary}
        </View>
      )}
    </View>
  );
}
