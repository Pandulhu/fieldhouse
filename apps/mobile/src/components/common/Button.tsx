import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';

type ButtonVariant = 'primary' | 'secondary' | 'danger';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
}

const COLORS = {
  accent: '#2E75B6',
  surface: '#FFFFFF',
  danger: '#C62828',
  muted: '#888888',
} as const;

const variantStyles: Record<ButtonVariant, { container: ViewStyle; text: TextStyle }> = {
  primary: {
    container: {
      backgroundColor: COLORS.accent,
    },
    text: {
      color: COLORS.surface,
    },
  },
  secondary: {
    container: {
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      borderColor: COLORS.accent,
    },
    text: {
      color: COLORS.accent,
    },
  },
  danger: {
    container: {
      backgroundColor: COLORS.danger,
    },
    text: {
      color: COLORS.surface,
    },
  },
};

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
}) => {
  const variantStyle = variantStyles[variant];
  const indicatorColor = variant === 'secondary' ? COLORS.accent : COLORS.surface;

  return (
    <TouchableOpacity
      style={[
        styles.container,
        variantStyle.container,
        disabled && styles.disabled,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator size="small" color={indicatorColor} />
      ) : (
        <Text style={[styles.text, variantStyle.text]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.5,
  },
});

export default Button;
