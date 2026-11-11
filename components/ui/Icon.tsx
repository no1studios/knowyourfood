import Svg, { Path } from 'react-native-svg';

import type { IconName } from './types';

const PATHS: Record<IconName, string> = {
  home: 'M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5.5h-5V20H5a1 1 0 0 1-1-1z',
  book: 'M5 4.5h10.5A3.5 3.5 0 0 1 19 8v11.5H8.5A3.5 3.5 0 0 1 5 16zM5 16a3.5 3.5 0 0 1 3.5-3.5H19',
  list: 'M9 6.5h11M9 12h11M9 17.5h11M4 6.5h.01M4 12h.01M4 17.5h.01',
  cart: 'M3.5 4.5h2l2.2 10.2a1.5 1.5 0 0 0 1.5 1.2h7.9a1.5 1.5 0 0 0 1.5-1.1L20.5 8H6.6M10 20h.01M17 20h.01',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4.5 20a7.5 7.5 0 0 1 15 0',
  plus: 'M12 5v14M5 12h14',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-3.9-3.9',
  share: 'M12 15V4M7.5 8.5 12 4l4.5 4.5M5 13v5.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V13',
  heart: 'M12 19.5s-7.5-4.4-7.5-10A4.3 4.3 0 0 1 12 7a4.3 4.3 0 0 1 7.5 2.5c0 5.6-7.5 10-7.5 10z',
  bookmark: 'M6.5 4.5h11v15.5L12 16.2 6.5 20z',
  link: 'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1',
  chat: 'M5.2 18.8 6 15.6A7.5 7.5 0 1 1 8.6 18zM9 10.5c.3 1.8 2 3.6 4.5 4l1-1.2 1.6.8',
  camera: 'M4 8.5A1.5 1.5 0 0 1 5.5 7h2.2L9 5h6l1.3 2h2.2A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5zM12 16a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  image: 'M4.5 5h15v14h-15zM4.5 15.5l4-4 4.5 4.5 2.5-2.5 4 4M15.5 9.5h.01',
  more: 'M6 12h.01M12 12h.01M18 12h.01',
  close: 'M6 6l12 12M18 6 6 18',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  clock: 'M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM12 8v4.5l3 1.8',
  users: 'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM3 19.5a6 6 0 0 1 12 0M15.5 4.3a3.5 3.5 0 0 1 0 6.4M17.5 14a6 6 0 0 1 3.5 5.5',
  flame: 'M12 20.5a6 6 0 0 0 6-6c0-4-3.5-6-4-10-2.5 1.5-4 4-4 6.5-1-.5-1.5-1.5-1.5-2.5C7 10 6 12 6 14.5a6 6 0 0 0 6 6z',
  chevronRight: 'M9.5 6l6 6-6 6',
  chevronLeft: 'M14.5 6l-6 6 6 6',
  download: 'M12 4v11M7.5 10.5 12 15l4.5-4.5M5 19.5h14',
  edit: 'M14.5 5.5l4 4M4.5 19.5l1-4.5L15.8 4.7a1.4 1.4 0 0 1 2 0l1.5 1.5a1.4 1.4 0 0 1 0 2L9 18.5z',
  globe: 'M12 20.5a8.5 8.5 0 1 0 0-17 8.5 8.5 0 0 0 0 17zM3.5 12h17M12 3.5c2.3 2.4 3.3 5.2 3.3 8.5s-1 6.1-3.3 8.5c-2.3-2.4-3.3-5.2-3.3-8.5s1-6.1 3.3-8.5z',
  leaf: 'M5 19c0-8 5-13 14-14 0 9-5 14-13 14zM5 19l7-7',
  phone: 'M7.5 3.5h9v17h-9zM11 17.5h2',
  sparkle: 'M12 4l1.8 4.6L18.5 10l-4.7 1.8L12 16.5l-1.8-4.7L5.5 10l4.7-1.4zM18.5 16l.8 1.9 1.7.6-1.7.7-.8 1.8-.7-1.8-1.8-.7 1.8-.6z',
  trash: 'M5 7h14M10 7V5h4v2M6.5 7l1 12.5h9l1-12.5',
};

type Props = {
  name: IconName;
  size?: number;
  strokeWidth?: number;
  color?: string;
  fill?: string;
};

export function Icon({ name, size = 20, strokeWidth = 1.75, color = '#1b1d1a', fill = 'none' }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d={PATHS[name] ?? PATHS.more}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={fill}
      />
    </Svg>
  );
}
