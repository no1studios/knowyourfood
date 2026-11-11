import type { ReactNode } from 'react';
import { Modal as RNModal, Pressable, Text, View } from 'react-native';

import { useTheme } from '@/components/ThemeProvider';

import { Icon } from './Icon';
import type { IconName, PastelTone } from './types';

type Props = {
  visible?: boolean;
  title: string;
  body?: string;
  icon?: IconName;
  tone?: PastelTone;
  actions?: ReactNode;
  children?: ReactNode;
  onScrimPress?: () => void;
  /** Route already presents transparent modal — render content only. */
  inline?: boolean;
};

export function Modal({
  visible = true,
  title,
  body,
  icon = 'sparkle',
  tone = 'sky',
  actions,
  children,
  onScrimPress,
  inline,
}: Props) {
  const { colors, type, radius, space, elevation } = useTheme();

  const toneBg = {
    mint: colors.pastelMint,
    haldi: colors.pastelHaldi,
    sky: colors.pastelSky,
    rose: colors.pastelRose,
    pista: colors.pastelPista,
    peach: colors.pastelPeach,
  }[tone];

  const toneFg = {
    mint: colors.onPastelMint,
    haldi: colors.onPastelHaldi,
    sky: colors.onPastelSky,
    rose: colors.onPastelRose,
    pista: colors.onPastelPista,
    peach: colors.onPastelPeach,
  }[tone];

  const card = (
    <View
      style={[
        {
          width: '100%',
          maxWidth: 320,
          backgroundColor: colors.surfaceRaised,
          borderRadius: radius.xl,
          padding: space[6],
          gap: space[2],
          alignItems: 'flex-start',
        },
        elevation[3],
      ]}
    >
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: radius.full,
          backgroundColor: toneBg,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: space[2],
        }}
      >
        <Icon name={icon} size={24} color={toneFg} />
      </View>
      <Text style={[type['title-2'], { color: colors.ink }]}>{title}</Text>
      {body ? <Text style={[type.body, { color: colors.inkMuted }]}>{body}</Text> : null}
      {children}
      {actions ? (
        <View style={{ width: '100%', gap: space[2], marginTop: space[4] }}>{actions}</View>
      ) : null}
    </View>
  );

  const frame = (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.scrim,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: space[5],
        paddingVertical: space[6],
      }}
    >
      {/* Absolute scrim under the card — without z-index, RN web paints it above in-flow CTAs. */}
      <Pressable
        accessibilityRole="button"
        onPress={onScrimPress}
        style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, zIndex: 1 }}
      />
      <View
        accessibilityViewIsModal
        style={{ width: '100%', maxWidth: 320, zIndex: 2, elevation: 8 }}
        onStartShouldSetResponder={() => true}
      >
        {card}
      </View>
    </View>
  );

  if (inline) return frame;

  return (
    <RNModal visible={visible} transparent animationType="fade" onRequestClose={onScrimPress}>
      {frame}
    </RNModal>
  );
}
