import type { ReactNode } from 'react';
import { Text, TextInput, View, type TextInputProps } from 'react-native';

import { useTheme } from '@/components/ThemeProvider';

import { Icon } from './Icon';
import type { IconName } from './types';

type Props = {
  variant?: 'outline' | 'search';
  label?: string;
  value?: string;
  placeholder?: string;
  helper?: string;
  error?: string;
  icon?: IconName;
  trailing?: ReactNode;
  multiline?: boolean;
  disabled?: boolean;
  onChangeText?: (text: string) => void;
  keyboardType?: TextInputProps['keyboardType'];
  autoComplete?: TextInputProps['autoComplete'];
  textContentType?: TextInputProps['textContentType'];
};

export function TextField({
  variant = 'outline',
  label,
  value,
  placeholder,
  helper,
  error,
  icon,
  trailing,
  multiline,
  disabled,
  onChangeText,
  keyboardType,
  autoComplete,
  textContentType,
}: Props) {
  const { colors, type, radius, space, size, opacity } = useTheme();
  const search = variant === 'search';

  return (
    <View style={{ gap: space[2], opacity: disabled ? opacity.disabled : 1 }}>
      {label ? <Text style={[type.label, { color: colors.ink, fontSize: 14 }]}>{label}</Text> : null}
      <View
        style={{
          flexDirection: 'row',
          alignItems: multiline ? 'flex-start' : 'center',
          gap: space[3],
          minHeight: size['control-md'],
          paddingHorizontal: space[4],
          borderRadius: search ? radius.full : radius.md,
          backgroundColor: search ? colors.surfaceSunken : colors.surface,
          borderWidth: search ? 0 : 1.5,
          borderColor: error ? colors.danger : colors.border,
        }}
      >
        {icon ? <Icon name={icon} size={20} color={colors.inkMuted} /> : null}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.inkSubtle}
          editable={!disabled}
          multiline={multiline}
          keyboardType={keyboardType}
          autoComplete={autoComplete}
          textContentType={textContentType}
          style={[
            type.body,
            {
              flex: 1,
              color: colors.ink,
              fontSize: 16,
              lineHeight: 24,
              paddingVertical: space[3],
              minHeight: multiline ? 88 : undefined,
            },
          ]}
        />
        {trailing}
      </View>
      {error || helper ? (
        <Text style={[type.caption, { color: error ? colors.danger : colors.inkMuted }]}>
          {error || helper}
        </Text>
      ) : null}
    </View>
  );
}
