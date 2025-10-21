import React from "react";
import { Button, Text, View } from "react-native";
import { useProfileStore } from "../../state/profileStore";

export default function Dashboard() {
  const { profile, setName } = useProfileStore();

  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-xl font-semibold">Dashboard</Text>
      <Text className="mt-2">Welcome, {profile.name} 👋</Text>
      <Button title="Set name to Noah" onPress={() => setName("Noah")} />
      <Text className="mt-2 text-gray-600 text-sm">
        (This tests Zustand + MMKV persistence)
      </Text>
    </View>
  );
}
