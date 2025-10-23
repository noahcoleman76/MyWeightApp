import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React from "react";
import { Button, Text, View } from "react-native";
import { RootStackParamList } from "../../navigation/RootNavigator";

type Props = NativeStackScreenProps<RootStackParamList, "OnboardingHowItWorks">;

export default function HowItWorks({ navigation }: Props) {
  return (
    <View className="flex-1 items-center justify-center px-6 bg-white">
      <Text className="text-xl font-semibold">How It Works</Text>
      <Text className="mt-3 text-center text-gray-600">
        Set your goal and date. Log calories and weight. We adapt your daily targets automatically.
      </Text>
      <View className="mt-6 w-48">
        <Button title="Next" onPress={() => navigation.navigate("OnboardingLearnMore")} />
      </View>
    </View>
  );
}
