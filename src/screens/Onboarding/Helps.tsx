import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React from "react";
import { Button, Text, View } from "react-native";
import { RootStackParamList } from "../../navigation/RootNavigator";
import { useAppStore } from "../../state/appStore";

type Props = NativeStackScreenProps<RootStackParamList, "OnboardingHelps">;

export default function Helps({ navigation }: Props) {
  const complete = useAppStore((s) => s.completeOnboarding);
  return (
    <View className="flex-1 items-center justify-center px-6 bg-white">
      <Text className="text-xl font-semibold">How MyWeight Helps</Text>
      <Text className="mt-3 text-center text-gray-600">
        Clear daily targets, progress streaks, and a simple log that just works.
      </Text>
      <View className="mt-6 w-56">
        <Button
          title="Continue"
          onPress={() => {
            complete();                 // mark onboarding done
            navigation.replace("Paywall"); // go to paywall next
          }}
        />
      </View>
    </View>
  );
}
