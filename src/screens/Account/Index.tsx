import React from "react";
import { Text, View } from "react-native";

export default function Account() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-xl font-semibold">Account</Text>
      <Text className="mt-2 text-gray-600">Profile & Settings…</Text>
    </View>
  );
}
