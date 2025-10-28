import { useNavigation } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React from "react";
import { Alert, Button, Text, View } from "react-native";
import { RootStackParamList } from "../../navigation/RootNavigator";
import { useAppStore } from "../../state/appStore";
import { useGoalStore } from "../../state/goalStore";
import { useLogStore } from "../../state/logStore";
import { useProfileStore } from "../../state/profileStore";
import { useSubscriptionStore } from "../../state/subscriptionStore";

type Props = NativeStackScreenProps<RootStackParamList, "Paywall">;

export default function Paywall({ navigation }: Props) {
  const nav = useNavigation<any>();

  const grant = useSubscriptionStore((s) => s.grantDevEntitlement);
  const revoke = useSubscriptionStore((s) => s.revokeEntitlement);
  const isEntitled = useSubscriptionStore((s) => s.isEntitled);

  const goIn = () => navigation.replace("Tabs");
  const setLoggedIn = useAppStore((s) => s.setLoggedIn);
  const setOnboardingDone = useAppStore((s) => s.setOnboardingDone);

  const resetProfile = useProfileStore((s) => s.reset);
  const resetGoal = useGoalStore((s) => s.reset);
  const resetLogs = useLogStore((s) => s.reset);
  const resetSub = useSubscriptionStore((s) => s.reset); // add if you don’t have it yet
  const handleResetAll = () => {
    Alert.alert("Reset all data?", "This will erase onboarding, logs, and login state.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reset",
        style: "destructive",
        onPress: () => {
          resetProfile?.();
          resetGoal?.();
          resetLogs?.();
          resetSub?.();
          setLoggedIn?.(false);
          setOnboardingDone?.(false);
          nav.reset({ index: 0, routes: [{ name: "Splash" }] });
        },
      },
    ]);
  };

  return (
    <View className="flex-1 items-center justify-center px-6 bg-white">
      <Text className="text-2xl font-semibold text-center">MyWeight Premium — $5/month</Text>

      <View className="mt-5">
        <Text>• Adaptive daily calorie targets</Text>
        <Text>• Goal vs. actual chart</Text>
        <Text>• Local-first speed</Text>
        <Text>• Priority updates</Text>
      </View>

      <Text className="mt-4 text-xs text-gray-500 text-center">
        Subscription auto-renews monthly. Cancel anytime in Apple ID settings.
      </Text>

      <View className="mt-6 w-64 gap-8">
        <View className="mb-3">
          <Button title="Subscribe (stub)" onPress={() => { grant(); goIn(); }} />
        </View>
        <View className="mb-3">
          <Button title="Restore Purchases (stub)" onPress={() => { grant(); goIn(); }} />
        </View>
        <View className="mb-3">
          <Button title="Skip for Review (dev)" onPress={goIn} />
        </View>
        {isEntitled && (
          <View className="mt-2">
            <Button title="Revoke (dev)" color="#a00" onPress={revoke} />
          </View>
        )}
      </View>
      <View className="mt-10 p-4 rounded-2xl border border-gray-200">
        <Text className="text-gray-500 text-sm">Testing utilities</Text>
        <Button title="Reset all data (testing)"  onPress={handleResetAll} />
      </View>
    </View>
  );
}
