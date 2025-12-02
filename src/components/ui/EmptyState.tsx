import { MaterialCommunityIcons } from "@expo/vector-icons";
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
  return (
    <View style={styles.container}>
      <MaterialCommunityIcons name={icon} size={42} color="#94a3b8" />
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
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
    color: '#111827',
  },
  subtitle: {
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 280,
    lineHeight: 20,
  },
});
