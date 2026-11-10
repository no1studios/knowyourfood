import { Pressable, Text, View } from 'react-native';

import { useTheme } from '@/components/ThemeProvider';

import { DietBadge } from './DietBadge';
import { FoodPhoto } from './FoodPhoto';
import { Icon } from './Icon';
import { Tag } from './Tag';
import type { Diet, FoodArt, Locale, PastelTone } from './types';

type Props = {
  variant?: 'tile' | 'hero' | 'row';
  title: string;
  description?: string;
  image?: string;
  art?: FoodArt;
  tone?: PastelTone;
  diet?: Diet;
  lang?: Locale;
  time?: string;
  servings?: string;
  saved?: boolean;
  tags?: { label: string; tone?: PastelTone | 'neutral' | 'primary' }[];
  onPress?: () => void;
  onToggleSave?: () => void;
};

export function RecipeCard({
  variant = 'tile',
  title,
  description,
  image,
  art = 'bowl',
  tone = 'haldi',
  diet,
  lang = 'en',
  time,
  servings,
  saved,
  tags,
  onPress,
  onToggleSave,
}: Props) {
  const { colors, type, radius, space, elevation, size } = useTheme();
  const hero = variant === 'hero';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          overflow: 'hidden',
          opacity: pressed ? 0.96 : 1,
        },
        elevation[2],
      ]}
    >
      <View style={{ padding: space[2], paddingBottom: 0 }}>
        <View style={{ position: 'relative' }}>
          <FoodPhoto
            src={image}
            art={art}
            tone={tone}
            alt={title}
            ratio={hero ? '4/3' : '1/1'}
            radius="md"
          />
          <View
            style={{
              position: 'absolute',
              top: space[2],
              left: space[2],
              right: space[2],
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
            }}
          >
            {diet ? <DietBadge diet={diet} lang={lang} onImage /> : <View />}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={saved ? 'Saved' : 'Save'}
              onPress={onToggleSave}
              style={[
                {
                  width: size['control-sm'],
                  height: size['control-sm'],
                  borderRadius: radius.full,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: saved ? colors.primary : colors.surface,
                },
                elevation[1],
              ]}
            >
              <Icon
                name="bookmark"
                size={18}
                color={saved ? colors.onPrimary : colors.ink}
                fill={saved ? colors.onPrimary : 'none'}
              />
            </Pressable>
          </View>
        </View>
      </View>

      <View style={{ paddingHorizontal: space[4], paddingTop: space[3], paddingBottom: space[4], gap: space[2] }}>
        {tags && tags.length > 0 ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space[1] }}>
            {tags.map((t) => (
              <Tag key={t.label} tone={t.tone}>
                {t.label}
              </Tag>
            ))}
          </View>
        ) : null}
        <Text
          numberOfLines={2}
          style={[
            hero ? type['title-2'] : type['title-3'],
            { color: colors.ink },
          ]}
        >
          {title}
        </Text>
        {hero && description ? (
          <Text style={[type.body, { color: colors.inkMuted }]}>{description}</Text>
        ) : null}
        {(time || servings) && (
          <View style={{ flexDirection: 'row', gap: space[4] }}>
            {time ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Icon name="clock" size={16} color={colors.inkMuted} />
                <Text style={[type.caption, { color: colors.inkMuted }]}>{time}</Text>
              </View>
            ) : null}
            {servings ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Icon name="users" size={16} color={colors.inkMuted} />
                <Text style={[type.caption, { color: colors.inkMuted }]}>{servings}</Text>
              </View>
            ) : null}
          </View>
        )}
      </View>
    </Pressable>
  );
}
