import { useNavigation } from "@react-navigation/native";
import React, { useEffect } from "react";
import { Text, View } from "react-native";
import { useAppStore } from "../../state/appStore";
import { useSubscriptionStore } from "../../state/subscriptionStore";

export default function Splash() {
  const nav = useNavigation<any>();
  const { isLoggedIn, onboardingDone } = useAppStore();
  const isEntitled = useSubscriptionStore((s) => s.isEntitled);

  useEffect(() => {
    const t = setTimeout(() => {
      if (isLoggedIn) nav.reset({ index: 0, routes: [{ name: "Tabs" }] });
      else if (!onboardingDone) nav.replace("Marketing1");
      else nav.replace(isEntitled ? "Tabs" : "Paywall");
    }, 900);
    return () => clearTimeout(t);
  }, [isLoggedIn, onboardingDone, isEntitled]);

  return (
    <View className="flex-1 items-center justify-center bg-white">
      {/* Replace with your logo asset: */}
      {/* <Image source={require('../../../assets/logo.png')} style={{ width: 120, height: 120 }} /> */}
      <Text className="text-3xl font-bold">MyWeight</Text>
      <Text className="mt-2 text-gray-600">Weight loss made easy</Text>
    </View>
  );
}
