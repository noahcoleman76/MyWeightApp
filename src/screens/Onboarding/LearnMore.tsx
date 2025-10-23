import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React from "react";
import { Button, Text, View } from "react-native";
import { RootStackParamList } from "../../navigation/RootNavigator";

type Props = NativeStackScreenProps<RootStackParamList, "OnboardingLearnMore">;

export default function LearnMore({ navigation }: Props) {
  return (
    <View className="flex-1 items-center justify-center px-6 bg-white">
      <Text className="text-xl font-semibold">Learn More</Text>
      <Text className="mt-3 text-center text-gray-600">
        Local-first storage, fast charts, and a distraction-free experience.
      </Text>
      <View className="mt-6 w-48">
        <Button title="Next" onPress={() => navigation.navigate("Motivation")} />
      </View>
    </View>
  );
}
