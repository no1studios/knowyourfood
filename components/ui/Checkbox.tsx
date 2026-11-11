import { Pressable } from 'react-native';

import { useTheme } from '@/components/ThemeProvider';

import { Icon } from './Icon';

type Props = {
  checked?: boolean;
  label?: string;
  onChange?: () => void;
};

export function Checkbox({ checked, label, onChange }: Props) {
  const { colors, radius } = useTheme();

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked: !!checked }}
      onPress={onChange}
      style={{
        width: 24,
        height: 24,
        borderRadius: radius.xs,
        borderWidth: 2,
        borderColor: checked ? colors.success : colors.borderStrong,
        backgroundColor: checked ? colors.success : 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {checked ? <Icon name="check" size={16} strokeWidth={2.5} color={colors.surface} /> : null}
    </Pressable>
  );
}
