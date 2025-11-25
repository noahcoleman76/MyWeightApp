import React from "react";
import { Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { AppTheme } from "../../styles/theme";

interface BackButtonProps {
  onPress?: () => void;
  style?: any;
  text?: string;
  showText?: boolean;
  iconSize?: number;
  color?: string;
}

export default function BackButton({
  onPress,
  style,
  text = "Back",
  showText = true,
  iconSize = 25,
  color = AppTheme.colors.text
}: BackButtonProps) {
  const navigation = useNavigation();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={[styles.container, style]}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Ionicons name="chevron-back" size={iconSize} color={color} />
      {showText && (
        <Text style={[styles.text, { color }]}>{text}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    paddingTop: 8,
  },
  text: {
    marginLeft: 10,
    fontSize: 18,
    fontWeight: "400",
  },
});