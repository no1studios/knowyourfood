// Know Your Food — BrandMark (react-native-svg). Compact mark only; Wordmark stays the full logo.
import * as React from 'react';
import Svg, { Circle, Defs, G, Mask, Path, Rect } from 'react-native-svg';

import { lightColors } from '@/src/theme';

type Variant = 'mark' | 'tile' | 'badge' | 'adaptive';

const SCALE: Record<Variant, number> = {
  mark: 0.8,
  tile: 0.62,
  badge: 0.78,
  adaptive: 0.585,
};

type Props = {
  variant?: Variant;
  size?: number;
  color?: string;
  canvas?: string;
  label?: string;
};

export function BrandMark({
  variant = 'mark',
  size = 48,
  color,
  canvas,
  label = 'Know Your Food',
}: Props) {
  const small = size <= 20;
  const gap = small ? 9 : 6;
  const lr = small ? 19 : 21;
  const sc = ((small && variant === 'badge' ? 0.84 : SCALE[variant]) * 100) / 80;
  const t = 50 - 50 * sc;
  const bgFill = canvas ?? (variant === 'badge' ? lightColors.primary : lightColors.bg);
  const ink = color ?? (variant === 'badge' ? lightColors.bg : lightColors.primary);
  const id = React.useId().replace(/:/g, '');

  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      accessibilityRole="image"
      accessibilityLabel={label}
    >
      {variant !== 'mark' && (
        <Rect
          width={100}
          height={100}
          rx={variant === 'adaptive' ? 50 : variant === 'tile' ? 22.5 : small ? 20 : 22}
          fill={bgFill}
        />
      )}
      <G transform={`translate(${t} ${t}) scale(${sc})`}>
        <Defs>
          <Mask id={id} maskUnits="userSpaceOnUse" x={0} y={0} width={100} height={100}>
            <Rect width={100} height={100} fill="#fff" />
            <Circle cx={50} cy={36} r={lr + gap} fill="#000" />
          </Mask>
        </Defs>
        <Path
          d="M12 45H88A38 38 0 0 1 12 45Z"
          fill={ink}
          stroke={ink}
          strokeWidth={4}
          strokeLinejoin="round"
          mask={`url(#${id})`}
        />
        <Circle cx={50} cy={36} r={lr} fill={ink} />
      </G>
    </Svg>
  );
}
