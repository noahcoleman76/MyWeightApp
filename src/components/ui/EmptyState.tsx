import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Text, View } from "react-native";
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
    <View className="items-center justify-center py-16">
      <MaterialCommunityIcons name={icon} size={42} color="#94a3b8" />
      <Text className="text-h2 font-semibold mt-3 text-center">{title}</Text>
      {subtitle ? <Text className="text-gray-500 text-center mt-1 max-w-[280px]">{subtitle}</Text> : null}
      {cta ? <Button title={cta} onPress={onPress} variant="primary" style={{ marginTop: 16, minWidth: 180 }} /> : null}
    </View>
  );
}
