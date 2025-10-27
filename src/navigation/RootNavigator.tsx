// src/navigation/RootNavigator.tsx
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";

// Onboarding / marketing
import Marketing1 from "../screens/Onboarding/Marketing1";
import Marketing2 from "../screens/Onboarding/Marketing2";
import Marketing3 from "../screens/Onboarding/Marketing3";
import Splash from "../screens/Onboarding/Splash";

// Data capture
import BirthYear from "../screens/Onboarding/BirthYear";
import ChooseGender from "../screens/Onboarding/ChooseGender";
import CurrentWeight from "../screens/Onboarding/CurrentWeight";
import GoalMode from "../screens/Onboarding/GoalMode";
import GoalWeight from "../screens/Onboarding/GoalWeight";
import Height from "../screens/Onboarding/Height";
import TargetDate from "../screens/Onboarding/TargetDate";

// Info / framing
import OnboardingHowItWorks from "../screens/Onboarding/HowItWorks";
import OnboardingLearnMore from "../screens/Onboarding/LearnMore";

// Motivation
import Concerns from "../screens/Onboarding/Concerns";
import Encouragement from "../screens/Onboarding/Encouragement";
import Motivation from "../screens/Onboarding/Motivation";

// Paywall + main app
import Paywall from "../screens/Paywall/Index";
import TabNavigator from "./TabNavigator";

import { AppTheme } from "../styles/theme";

export type RootStackParamList = {
  Splash: undefined;
  Marketing1: undefined;  // “Welcome”
  Marketing2: undefined;
  Marketing3: undefined;
  ChooseGender: undefined;
  BirthYear: undefined;
  GoalMode: undefined;
  Height: undefined;
  CurrentWeight: undefined;
  GoalWeight: undefined;
  TargetDate: undefined;
  OnboardingHowItWorks: undefined;
  OnboardingLearnMore: undefined;
  Motivation: undefined;
  Concerns: undefined;
  Encouragement: undefined;
  Paywall: undefined;
  Tabs: undefined;        // bottom tabs (Dashboard, Goals, Log, Account)
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <NavigationContainer theme={AppTheme}>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerTitleAlign: "center",
          headerShadowVisible: false,
          headerStyle: { backgroundColor: AppTheme.colors.card },
          headerTitleStyle: { fontWeight: "600", fontSize: 18 },
          contentStyle: { backgroundColor: AppTheme.colors.background },
          animation: "fade_from_bottom",
          gestureEnabled: true,
        }}
      >
        {/* Splash shows every cold start for ~3s, then routes based on user state */}
        <Stack.Screen name="Splash" component={Splash} options={{ headerShown: false }} />

        {/* Marketing / Welcome slides */}
        <Stack.Screen name="Marketing1" component={Marketing1} options={{ title: "Welcome" }} />
        <Stack.Screen name="Marketing2" component={Marketing2} options={{ title: "Welcome" }} />
        <Stack.Screen name="Marketing3" component={Marketing3} options={{ title: "Welcome" }} />

        {/* Data capture */}
        <Stack.Screen name="ChooseGender" component={ChooseGender} options={{ title: "Your Details" }} />
        <Stack.Screen name="BirthYear" component={BirthYear} options={{ title: "Your Details" }} />
        <Stack.Screen name="GoalMode" component={GoalMode} options={{ title: "Your Goal" }} />
        <Stack.Screen name="Height" component={Height} options={{ title: "Your Details" }} />
        <Stack.Screen name="CurrentWeight" component={CurrentWeight} options={{ title: "Your Details" }} />
        <Stack.Screen name="GoalWeight" component={GoalWeight} options={{ title: "Your Goal" }} />
        <Stack.Screen name="TargetDate" component={TargetDate} options={{ title: "Timeline" }} />

        {/* Info / framing */}
        <Stack.Screen name="OnboardingHowItWorks" component={OnboardingHowItWorks} options={{ title: "How It Works" }} />
        <Stack.Screen name="OnboardingLearnMore" component={OnboardingLearnMore} options={{ title: "Learn More" }} />

        {/* Motivation */}
        <Stack.Screen name="Motivation" component={Motivation} options={{ title: "Your Why" }} />
        <Stack.Screen name="Concerns" component={Concerns} options={{ title: "Your Concerns" }} />
        <Stack.Screen name="Encouragement" component={Encouragement} options={{ headerShown: false }} />

        {/* Paywall and App */}
        <Stack.Screen name="Paywall" component={Paywall} options={{ title: "MyWeight Premium" }} />
        <Stack.Screen name="Tabs" component={TabNavigator} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
