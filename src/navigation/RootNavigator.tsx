// src/navigation/RootNavigator.tsx
import { NavigationContainer, NavigationContainerRef } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React, { useEffect, useRef } from "react";
import { useAuthStore } from "../state/authStore";

// Onboarding / marketing
import Marketing1 from "../screens/Onboarding/Marketing1";
import Marketing2 from "../screens/Onboarding/Marketing2";
import Marketing3 from "../screens/Onboarding/Marketing3";
import Splash from "../screens/Onboarding/Splash";

// Data capture
import ActivityPage from "../screens/Onboarding/Activity";
import BirthYear from "../screens/Onboarding/BirthYear";
import ChooseGender from "../screens/Onboarding/ChooseGender";
import CurrentWeight from "../screens/Onboarding/CurrentWeight";
import First from "../screens/Onboarding/First";
import GoalMode from "../screens/Onboarding/GoalMode";
import GoalWeight from "../screens/Onboarding/GoalWeight";
import Height from "../screens/Onboarding/Height";
import Name from "../screens/Onboarding/Name";
import TargetDate from "../screens/Onboarding/TargetDate";

// Info / framing
import OnboardingHowItWorks from "../screens/Onboarding/HowItWorks";
import OnboardingLearnMore from "../screens/Onboarding/LearnMore";

// Motivation
import Concerns from "../screens/Onboarding/Concerns";
import Encouragement from "../screens/Onboarding/Encouragement";
import Motivation from "../screens/Onboarding/Motivation";

// Auth
import Login from "../screens/Login/Index";
import CreateAccount from "../screens/CreateAccount/Index";

// Paywall + main app
import Paywall from "../screens/Paywall/Index";
import TabNavigator from "./TabNavigator";

import { AppTheme } from "../styles/theme";

export type RootStackParamList = {
  Splash: undefined;
  Marketing1: undefined;
  Marketing2: undefined;
  Marketing3: undefined;
  Name: undefined;
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
  Login: undefined;
  CreateAccount: undefined;
  Paywall: undefined;
  Tabs: undefined;
  First: undefined;
  Activity: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const navigationRef = useRef<NavigationContainerRef<RootStackParamList>>(null);
  const { isLoggedIn, isInitializing } = useAuthStore();

  useEffect(() => {
    console.log('🗂️ RootNavigator auth state changed:', { isLoggedIn, isInitializing });
    
    if (isInitializing) {
      console.log('⏳ RootNavigator waiting for auth initialization...');
      return;
    }
    
    // Get current route safely
    const navigationState = navigationRef.current?.getState();
    const currentRoute = navigationState?.routes[navigationState?.index];
    console.log('📍 RootNavigator current route:', currentRoute?.name);
    
    // When user logs out, reset navigation to Login screen
    if (!isLoggedIn && navigationRef.current) {
      console.log('🔄 RootNavigator forcing navigation to Login (user logged out)');
      navigationRef.current.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    }
    // When user logs in from Login/CreateAccount screen, navigate to Marketing1
    else if (isLoggedIn && navigationRef.current &&
      (currentRoute?.name === 'Login' || currentRoute?.name === 'CreateAccount')) {
      console.log('🚀 RootNavigator detected login from auth screen, navigating to Marketing1');
      navigationRef.current.reset({
        index: 0,
        routes: [{ name: 'Marketing1' }],
      });
    }
  }, [isLoggedIn, isInitializing]);

  return (
    <NavigationContainer ref={navigationRef} theme={AppTheme}>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false, // Remove all headers
          contentStyle: { backgroundColor: AppTheme.colors.card },
          animation: "slide_from_right",
          gestureEnabled: true,
        }}
      >
        {/* Splash shows every cold start for ~4s, then routes based on user state */}
        <Stack.Screen name="Splash" component={Splash} options={{ headerShown: false }} />

        {/* Marketing / Welcome slides */}
        <Stack.Screen name="Marketing1" component={Marketing1} />
        <Stack.Screen name="Marketing2" component={Marketing2} />
        <Stack.Screen name="Marketing3" component={Marketing3} />
        <Stack.Screen name="First" component={First} />

        {/* Data capture */}
        <Stack.Screen name="Name" component={Name} />
        <Stack.Screen name="GoalMode" component={GoalMode} />
        <Stack.Screen name="ChooseGender" component={ChooseGender} />
        <Stack.Screen name="BirthYear" component={BirthYear} />
        <Stack.Screen name="Height" component={Height} />
        <Stack.Screen name="CurrentWeight" component={CurrentWeight} />
        <Stack.Screen name="GoalWeight" component={GoalWeight} />
        <Stack.Screen name="TargetDate" component={TargetDate} />
        <Stack.Screen name="Activity" component={ActivityPage} />

        {/* Info / framing */}
        <Stack.Screen name="OnboardingHowItWorks" component={OnboardingHowItWorks} />
        <Stack.Screen name="OnboardingLearnMore" component={OnboardingLearnMore} />

        {/* Motivation */}
        <Stack.Screen name="Motivation" component={Motivation} />
        <Stack.Screen name="Concerns" component={Concerns} />
        <Stack.Screen name="Encouragement" component={Encouragement} />

        {/* Auth */}
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="CreateAccount" component={CreateAccount} />

        {/* Paywall and App */}
        <Stack.Screen name="Paywall" component={Paywall} />
        <Stack.Screen name="Tabs" component={TabNavigator} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
