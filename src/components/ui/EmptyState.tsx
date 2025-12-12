import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "@react-navigation/native";
import React from "react";
import { Text, View, StyleSheet } from "react-native";
import Button from "./Button";

export default function EmptyState({
  icon = "clipboard-text-outline",
  title,
  subtitle,
  cta,
  onPress,
}: {
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  subtitle?: string;
  cta?: string;
  onPress?: () => void;
}) {
  const { colors } = useTheme();
  const TEXT = colors?.text ?? "#111827";
  const MUTED = colors?.text ? `${colors.text}99` : "#6b7280";
  const ICON_COLOR = colors?.text ? `${colors.text}66` : "#94a3b8";

  return (
    <View style={styles.container}>
      <MaterialCommunityIcons name={icon} size={42} color={ICON_COLOR} />
      <Text style={[styles.title, { color: TEXT }]}>{title}</Text>
      {subtitle ? <Text style={[styles.subtitle, { color: MUTED }]}>{subtitle}</Text> : null}
      {cta ? <Button title={cta} onPress={onPress} variant="primary" style={{ marginTop: 16, minWidth: 180 }} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 12,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 280,
    lineHeight: 20,
  },
});
