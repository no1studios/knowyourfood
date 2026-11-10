import type { ReactNode } from 'react';
import { Image, View } from 'react-native';
import Svg, { Circle, Ellipse, Rect } from 'react-native-svg';

import { useTheme } from '@/components/ThemeProvider';

import type { FoodArt, PastelTone } from './types';

type Shape =
  | ['circle', { cx: number; cy: number; r: number; k: string }]
  | ['ellipse', { cx: number; cy: number; rx: number; ry: number; k: string }]
  | ['rect', { x: number; y: number; width: number; height: number; rx: number; k: string }];

const ART: Record<FoodArt, Shape[]> = {
  thali: [
    ['circle', { cx: 60, cy: 60, r: 44, k: 'plate' }],
    ['circle', { cx: 42, cy: 46, r: 12, k: 'a' }],
    ['circle', { cx: 74, cy: 42, r: 11, k: 'b' }],
    ['circle', { cx: 80, cy: 72, r: 12, k: 'c' }],
    ['ellipse', { cx: 48, cy: 76, rx: 16, ry: 10, k: 'd' }],
  ],
  bowl: [
    ['circle', { cx: 60, cy: 62, r: 40, k: 'plate' }],
    ['circle', { cx: 60, cy: 62, r: 28, k: 'c' }],
    ['circle', { cx: 52, cy: 56, r: 5, k: 'b' }],
    ['circle', { cx: 68, cy: 64, r: 4, k: 'b' }],
    ['circle', { cx: 58, cy: 72, r: 3.5, k: 'a' }],
  ],
  glass: [
    ['rect', { x: 42, y: 26, width: 36, height: 66, rx: 10, k: 'plate' }],
    ['rect', { x: 46, y: 46, width: 28, height: 42, rx: 7, k: 'b' }],
    ['circle', { cx: 78, cy: 30, r: 9, k: 'a' }],
  ],
  roti: [
    ['circle', { cx: 56, cy: 64, r: 38, k: 'd' }],
    ['circle', { cx: 64, cy: 56, r: 38, k: 'plate' }],
    ['circle', { cx: 54, cy: 50, r: 4, k: 'b' }],
    ['circle', { cx: 74, cy: 62, r: 3, k: 'b' }],
    ['circle', { cx: 62, cy: 70, r: 3.5, k: 'b' }],
  ],
};

type Props = {
  src?: string;
  alt?: string;
  art?: FoodArt;
  tone?: PastelTone;
  /** CSS-like ratio "360/392" or "4/3" or "1/1" */
  ratio?: string;
  radius?: 'md' | 'lg' | 'xl' | '2xl';
  children?: ReactNode;
  style?: object;
};

function parseRatio(ratio: string): number {
  const [a, b] = ratio.split('/').map(Number);
  if (!a || !b) return 4 / 3;
  return a / b;
}

export function FoodPhoto({
  src,
  alt,
  art = 'thali',
  tone = 'haldi',
  ratio = '4/3',
  radius,
  children,
  style,
}: Props) {
  const { colors, radius: r } = useTheme();
  const aspectRatio = parseRatio(ratio);
  const borderRadius =
    radius === 'md'
      ? r.md
      : radius === 'lg'
        ? r.lg
        : radius === 'xl'
          ? r.xl
          : radius === '2xl'
            ? r['2xl']
            : 0;

  const pastel: Record<PastelTone, string> = {
    mint: colors.pastelMint,
    haldi: colors.pastelHaldi,
    sky: colors.pastelSky,
    rose: colors.pastelRose,
    pista: colors.pastelPista,
    peach: colors.pastelPeach,
  };

  const artFill: Record<string, string> = {
    plate: colors.surface,
    a: colors.primary,
    b: colors.dietVeg,
    c: colors.dietEgg,
    d: colors.onPastelPeach,
  };

  return (
    <View
      accessibilityLabel={alt || 'Recipe photo placeholder'}
      style={[
        {
          width: '100%',
          aspectRatio,
          overflow: 'hidden',
          backgroundColor: src ? colors.surfaceSunken : pastel[tone],
          borderRadius,
        },
        style,
      ]}
    >
      {src ? (
        <Image source={{ uri: src }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
      ) : (
        <View style={{ position: 'absolute', top: '12%', left: '12%', right: '12%', bottom: '12%' }}>
          <Svg viewBox="0 0 120 120" width="100%" height="100%">
            {ART[art].map((shape, i) => {
              const [kind, attrs] = shape;
              const fill = artFill[attrs.k] ?? colors.surface;
              const opacity = attrs.k === 'd' ? 0.35 : 1;
              if (kind === 'circle') {
                const a = attrs as { cx: number; cy: number; r: number };
                return <Circle key={i} cx={a.cx} cy={a.cy} r={a.r} fill={fill} opacity={opacity} />;
              }
              if (kind === 'ellipse') {
                const a = attrs as { cx: number; cy: number; rx: number; ry: number };
                return (
                  <Ellipse key={i} cx={a.cx} cy={a.cy} rx={a.rx} ry={a.ry} fill={fill} opacity={opacity} />
                );
              }
              const a = attrs as { x: number; y: number; width: number; height: number; rx: number };
              return (
                <Rect
                  key={i}
                  x={a.x}
                  y={a.y}
                  width={a.width}
                  height={a.height}
                  rx={a.rx}
                  fill={fill}
                  opacity={opacity}
                />
              );
            })}
          </Svg>
        </View>
      )}
      {children}
    </View>
  );
}
