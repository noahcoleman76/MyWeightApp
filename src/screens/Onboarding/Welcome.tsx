import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React from "react";
import { Button, Text, View } from "react-native";
import { RootStackParamList } from "../../navigation/RootNavigator";

type Props = NativeStackScreenProps<RootStackParamList, "OnboardingWelcome">;

export default function Welcome({ navigation }: Props) {
  return (
    <View className="flex-1 items-center justify-center px-6 bg-white">
      <Text className="text-2xl font-semibold">Welcome to MyWeight</Text>
      <Text className="mt-3 text-center text-gray-600">
        A simple, goal-driven tracker with adaptive daily calorie targets.
      </Text>
      <View className="mt-6 w-48">
        <Button title="Get Started" onPress={() => navigation.navigate("OnboardingHowItWorks")} />
      </View>
    </View>
  );
}
