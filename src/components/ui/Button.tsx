import React from "react";
import { ActivityIndicator, Text, Pressable, ViewStyle, StyleSheet } from "react-native";
import { useTheme } from "@react-navigation/native";
import * as Haptics from "expo-haptics";

type Props = {
  title: string;
  onPress?: () => void;
  variant?: "primary" | "secondary" | "ghost";
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  accentColor?: string;
};

export default function Button({ title, onPress, variant = "primary", loading, disabled, style, accentColor }: Props) {
  const { colors } = useTheme();
  
  // Use theme colors with fallbacks, supporting accentColor override
  const ACCENT = accentColor ?? colors?.primary ?? "#5eada8";
  const TEXT = colors?.text ?? "#111827";
  const CARD_BG = colors?.card ?? "#FFFFFF";
  const BORDER = colors?.border ?? "#e5e7eb";

  const handlePress = () => {
    if (!disabled && !loading && onPress) {
      // Add haptic feedback like other interactive elements
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    }
  };
  // Dynamic styles based on theme colors
  const getButtonStyle = (): ViewStyle[] => {
    const baseStyles: ViewStyle[] = [styles.base];
    
    // Add variant-specific styles
    switch (variant) {
      case 'primary':
        baseStyles.push({ backgroundColor: ACCENT } as ViewStyle);
        break;
      case 'secondary':
        baseStyles.push({ 
          backgroundColor: CARD_BG, 
          borderWidth: 1, 
          borderColor: BORDER 
        } as ViewStyle);
        break;
      case 'ghost':
        baseStyles.push({ 
          backgroundColor: 'transparent', 
          borderWidth: 1, 
          borderColor: ACCENT 
        } as ViewStyle);
        break;
    }
    
    // Add disabled state
    if (disabled || loading) {
      baseStyles.push(styles.disabled);
    }
    
    // Add custom style if provided
    if (style) {
      baseStyles.push(style);
    }
    
    return baseStyles;
  };

  const getTextColor = () => {
    switch (variant) {
      case 'primary':
        return '#ffffff';
      case 'secondary':
        return TEXT;
      case 'ghost':
        return ACCENT;
      default:
        return TEXT;
    }
  };

  const getActivityIndicatorColor = () => {
    return variant === 'primary' ? '#ffffff' : ACCENT;
  };

  return (
    <Pressable
      disabled={disabled || loading}
      onPress={handlePress}
      style={({ pressed }) => [
        ...getButtonStyle(),
        {
          transform: [{ scale: pressed && !disabled && !loading ? 0.98 : 1 }],
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={getActivityIndicatorColor()} />
      ) : (
        <Text style={[styles.text, { color: getTextColor() }]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.6,
  },
  text: {
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 16,
  },
});
