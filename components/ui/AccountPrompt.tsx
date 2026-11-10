import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/components/ThemeProvider';

import { Button } from './Button';
import { Icon } from './Icon';
import { Wordmark } from './Wordmark';
import type { Locale } from './types';

type Copy = {
  title?: string;
  body?: string;
  primary?: string;
  secondary?: string;
  dismiss?: string;
};

type Props = {
  variant?: 'sheet' | 'banner';
  lang?: Locale;
  copy?: Copy;
  onPrimary?: () => void;
  onSecondary?: () => void;
  onDismiss?: () => void;
  /** Wrap sheet in bottom-sheet chrome (grab + raised surface). */
  sheetChrome?: boolean;
};

export function AccountPrompt({
  variant = 'sheet',
  copy = {},
  onPrimary,
  onSecondary,
  onDismiss,
  sheetChrome = false,
}: Props) {
  const { colors, type, radius, space, elevation } = useTheme();
  const insets = useSafeAreaInsets();

  if (variant === 'banner') {
    return (
      <View
        style={[
          {
            flexDirection: 'row',
            alignItems: 'center',
            gap: space[3],
            paddingVertical: space[3],
            paddingRight: space[3],
            paddingLeft: space[4],
            borderRadius: radius.lg,
            backgroundColor: colors.surface,
          },
          elevation[1],
        ]}
      >
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: radius.full,
            backgroundColor: colors.pastelHaldi,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="sparkle" size={20} color={colors.onPastelHaldi} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={[type.label, { color: colors.ink }]}>
            {copy.title || 'Back up your recipes'}
          </Text>
          <Text style={[type.caption, { color: colors.inkMuted }]}>
            {copy.body || '12 recipes saved only on this phone'}
          </Text>
        </View>
        <Button variant="tonal" size="sm" onPress={onPrimary}>
          {copy.primary || 'Sign in'}
        </Button>
      </View>
    );
  }

  const body = (
    <View style={{ gap: space[3], paddingTop: space[2] }}>
      <Wordmark size="sm" />
      <Text style={[type['title-1'], { color: colors.ink, marginTop: space[2] }]}>
        {copy.title || 'Keep your recipes safe'}
      </Text>
      <Text style={[type.body, { color: colors.inkMuted }]}>
        {copy.body ||
          'You have saved 12 recipes as a guest. Create a free account to back them up and use them on any phone.'}
      </Text>
      <View style={{ gap: space[2], marginTop: space[3] }}>
        <Button variant="primary" size="lg" block icon="phone" onPress={onPrimary}>
          {copy.primary || 'Continue with phone number'}
        </Button>
        <Button variant="secondary" size="lg" block onPress={onSecondary}>
          {copy.secondary || 'Continue with Google'}
        </Button>
        <Button variant="ghost" block onPress={onDismiss}>
          {copy.dismiss || 'Not now'}
        </Button>
      </View>
    </View>
  );

  if (!sheetChrome) {
    return <View style={{ gap: space[3], padding: space[5] }}>{body}</View>;
  }

  return (
    <View
      style={[
        {
          width: '100%',
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
      {body}
    </View>
  );
}
