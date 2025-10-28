import { useNavigation } from "@react-navigation/native";
import React from "react";
import { Button, Text, View } from "react-native";

export default function Encouragement() {
  const nav = useNavigation<any>();

  const proceed = () => {
    nav.replace("Paywall");
  };

  return (
    <View className="flex-1 items-center justify-center px-6 bg-white">
      <Text className="text-2xl font-semibold text-center">You have great potential to crush your goal.</Text>
      <Text className="mt-3 text-center text-gray-600">
        We’ll guide your daily targets and help you stay consistent.
      </Text>
      <View className="mt-6 w-56">
        <Button title="Continue" onPress={proceed} />
      </View>
    </View>
  );
}
