import { Modal, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/components/ThemeProvider';

import { FoodPhoto } from './FoodPhoto';
import { Icon } from './Icon';
import { IconButton } from './IconButton';
import type { FoodArt, IconName, PastelTone } from './types';

export type ShareTarget = {
  key: string;
  icon: IconName;
  label: string;
  tone?: PastelTone | 'neutral';
};

export type ShareOption = {
  icon: IconName;
  title: string;
  subtitle?: string;
};

type Props = {
  visible?: boolean;
  title: string;
  recipe: {
    title: string;
    subtitle?: string;
    art?: FoodArt;
    tone?: PastelTone;
  };
  targets: ShareTarget[];
  options?: ShareOption[];
  onClose?: () => void;
  onSelectTarget?: (key: string) => void;
  onSelectOption?: (title: string) => void;
  /** When true, render sheet content without Modal wrapper (route already presents). */
  inline?: boolean;
};

export function ShareSheet({
  visible = true,
  title,
  recipe,
  targets,
  options = [],
  onClose,
  onSelectTarget,
  onSelectOption,
  inline,
}: Props) {
  const { colors, type, radius, space, elevation } = useTheme();
  const insets = useSafeAreaInsets();

  const pastel = (tone?: PastelTone | 'neutral') => {
    switch (tone) {
      case 'mint':
        return { bg: colors.pastelMint, fg: colors.onPastelMint };
      case 'rose':
        return { bg: colors.pastelRose, fg: colors.onPastelRose };
      case 'sky':
        return { bg: colors.pastelSky, fg: colors.onPastelSky };
      case 'haldi':
        return { bg: colors.pastelHaldi, fg: colors.onPastelHaldi };
      case 'pista':
        return { bg: colors.pastelPista, fg: colors.onPastelPista };
      case 'peach':
        return { bg: colors.pastelPeach, fg: colors.onPastelPeach };
      default:
        return { bg: colors.surfaceSunken, fg: colors.ink };
    }
  };

  const sheet = (
    <View
      style={{
        flex: inline ? 1 : undefined,
        justifyContent: 'flex-end',
        backgroundColor: colors.scrim,
        paddingTop: inline ? space[10] : 0,
      }}
    >
      <Pressable style={{ flex: 1 }} onPress={onClose} accessibilityLabel="Dismiss" />
      <View
        style={[
          {
            backgroundColor: colors.surfaceRaised,
            borderTopLeftRadius: radius.xl,
            borderTopRightRadius: radius.xl,
            paddingHorizontal: space[5],
            paddingTop: space[2],
            paddingBottom: Math.max(insets.bottom, space[6]),
          },
          elevation[3],
        ]}
      >
        <View
          style={{
            width: 40,
            height: 4,
            borderRadius: radius.full,
            backgroundColor: colors.borderStrong,
            opacity: 0.5,
            alignSelf: 'center',
            marginBottom: space[3],
          }}
        />
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: space[4],
          }}
        >
          <Text style={[type['title-2'], { color: colors.ink, flex: 1 }]}>{title}</Text>
          <IconButton icon="close" label="Close" variant="surface" size="sm" onPress={onClose} />
        </View>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: space[3],
            padding: space[3],
            borderRadius: radius.lg,
            backgroundColor: colors.surfaceSunken,
          }}
        >
          <View style={{ width: 56, borderRadius: radius.md, overflow: 'hidden' }}>
            <FoodPhoto art={recipe.art || 'bowl'} tone={recipe.tone || 'haldi'} ratio="1/1" />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={[type.label, { color: colors.ink }]} numberOfLines={2}>
              {recipe.title}
            </Text>
            <Text style={[type.caption, { color: colors.inkMuted }]} numberOfLines={1}>
              {recipe.subtitle || 'knowyourfood.app/r/…'}
            </Text>
          </View>
        </View>

        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginTop: space[5],
            marginBottom: space[2],
            gap: space[1],
          }}
        >
          {targets.map((t) => {
            const p = pastel(t.tone);
            return (
              <Pressable
                key={t.key}
                onPress={() => onSelectTarget?.(t.key)}
                style={{ flex: 1, alignItems: 'center', gap: space[2] }}
              >
                <View
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: radius.lg,
                    backgroundColor: p.bg,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon name={t.icon} size={24} color={p.fg} />
                </View>
                <Text style={[type.caption, { color: colors.ink, textAlign: 'center', fontSize: 12 }]}>
                  {t.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {options.length > 0 ? (
          <View style={{ marginTop: space[3] }}>
            {options.map((o) => (
              <Pressable
                key={o.title}
                onPress={() => onSelectOption?.(o.title)}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: space[3],
                  paddingVertical: space[3],
                  opacity: pressed ? 0.88 : 1,
                })}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: radius.full,
                    backgroundColor: colors.surfaceSunken,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon name={o.icon} size={20} color={colors.ink} />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={[type.label, { color: colors.ink }]}>{o.title}</Text>
                  {o.subtitle ? (
                    <Text style={[type.caption, { color: colors.inkMuted }]}>{o.subtitle}</Text>
                  ) : null}
                </View>
                <Icon name="chevronRight" size={20} color={colors.inkMuted} />
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );

  if (inline) return sheet;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      {sheet}
    </Modal>
  );
}
