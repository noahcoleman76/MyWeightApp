import React from "react";
import { Text, View } from "react-native";

export default function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View className="mb-2">
      <Text className="text-h1 font-semibold">{title}</Text>
      {subtitle ? <Text className="text-gray-500 mt-1">{subtitle}</Text> : null}
    </View>
  );
}
