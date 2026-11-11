import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { useTheme } from '@/components/ThemeProvider';

import { IconButton } from './IconButton';
import { Wordmark } from './Wordmark';

type Props = {
  variant?: 'brand' | 'large' | 'compact';
  title?: string;
  greeting?: string;
  eyebrow?: string;
  actions?: ReactNode;
  onBack?: false | (() => void);
  backLabel?: string;
};

export function AppHeader({
  variant = 'brand',
  title,
  greeting,
  eyebrow,
  actions,
  onBack,
  backLabel = 'Back',
}: Props) {
  const { colors, type, space } = useTheme();

  if (variant === 'compact') {
    return (
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: space[3],
          paddingVertical: space[2],
          minHeight: 64,
          gap: space[2],
        }}
      >
        {onBack !== false ? (
          <IconButton icon="chevronLeft" label={backLabel} variant="surface" onPress={onBack} />
        ) : (
          <View style={{ width: 48 }} />
        )}
        <Text style={[type['title-3'], { flex: 1, textAlign: 'center', color: colors.ink }]}>
          {title}
        </Text>
        {actions || <View style={{ width: 48 }} />}
      </View>
    );
  }

  return (
    <View style={{ paddingHorizontal: space[5], paddingTop: space[3], paddingBottom: space[4], gap: space[2] }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        {variant === 'brand' ? (
          <Wordmark size="md" />
        ) : (
          <Text style={[type.overline, { color: colors.inkMuted }]}>{eyebrow}</Text>
        )}
        {actions ? <View style={{ flexDirection: 'row', gap: space[2] }}>{actions}</View> : null}
      </View>
      {greeting ? <Text style={[type.body, { color: colors.inkMuted }]}>{greeting}</Text> : null}
      {title ? <Text style={[type['title-1'], { color: colors.ink }]}>{title}</Text> : null}
    </View>
  );
}
