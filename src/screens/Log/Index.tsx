import React from "react";
import { Text, View } from "react-native";

export default function Log() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-xl font-semibold">Log</Text>
      <Text className="mt-2 text-gray-600">Add calories & weight here…</Text>
    </View>
  );
}
