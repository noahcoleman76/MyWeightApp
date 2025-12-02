// src/navigation/RootNavigator.tsx
import { NavigationContainer, NavigationContainerRef } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React, { useEffect, useRef, useState } from "react";
import { UserDataService } from "../lib/userDataService";
import { useAuthStore } from "../state/authStore";
import { useOnboardingStore } from "../state/onboardingStore";

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
import CreateAccount from "../screens/CreateAccount/Index";
import Login from "../screens/Login/Index";

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
  const { isLoggedIn, isInitializing, user } = useAuthStore();
  const { currentScreen, shouldResumeOnboarding, isUploadedToFirestore } = useOnboardingStore();
  const [isNavigationReady, setIsNavigationReady] = useState(false);
  const [hasCheckedFirestore, setHasCheckedFirestore] = useState(false);
  const [splashComplete, setSplashComplete] = useState(false);

  // Splash screen timeout
  useEffect(() => {
    console.log('⏱️ Starting splash timer (3000ms)');
    const timer = setTimeout(() => {
      console.log('✅ Splash timeout complete, setting splashComplete to true');
      setSplashComplete(true);
    }, 3000); // 3 seconds splash duration
    
    return () => {
      console.log('🧹 Cleaning up splash timer');
      clearTimeout(timer);
    };
  }, []);

  // Main navigation logic - only trigger after splash is complete
  useEffect(() => {
    console.log('🚦 Navigation useEffect triggered:', {
      isNavigationReady,
      isInitializing, 
      hasCheckedFirestore,
      splashComplete,
      isLoggedIn,
      isUploadedToFirestore
    });
    
    if (!isNavigationReady) {
      console.log('⏳ Navigation not ready yet...');
      return;
    }
    
    if (isInitializing) {
      console.log('⏳ Auth still initializing...');
      return;
    }
    
    if (!hasCheckedFirestore && isLoggedIn) {
      console.log('⏳ Still checking Firestore...');
      return;
    }
    
    if (!splashComplete) {
      console.log('⏳ Splash screen still showing...');
      return;
    }

    console.log('✅ All conditions met, calling handleNavigation');
    handleNavigation();
  }, [isLoggedIn, isInitializing, isNavigationReady, hasCheckedFirestore, splashComplete, currentScreen, shouldResumeOnboarding, isUploadedToFirestore]);

  // Check Firestore for user data when user logs in
  useEffect(() => {
    console.log('🔍 Firestore check useEffect:', { isLoggedIn, hasUser: !!user, hasCheckedFirestore });
    
    if (isLoggedIn && user && !hasCheckedFirestore) {
      console.log('🔍 User is logged in, checking Firestore...');
      checkUserDataInFirestore();
    } else if (!isLoggedIn) {
      console.log('🔓 User not logged in, setting hasCheckedFirestore to true');
      setHasCheckedFirestore(true); // Allow navigation when not logged in
    }
  }, [isLoggedIn, user, hasCheckedFirestore]);

  const checkUserDataInFirestore = async () => {
    if (!user) return;

    try {
      console.log('🔍 Checking Firestore for user data...');
      const hasData = await UserDataService.hasCompletedOnboarding(user.uid);
      
      if (hasData) {
        console.log('✅ User data found in Firestore, loading...');
        await UserDataService.loadUserDataFromFirestore(user.uid);
      } else {
        console.log('ℹ️ No user data found in Firestore');
      }
    } catch (error) {
      console.error('❌ Error checking/loading Firestore data:', error);
    } finally {
      setHasCheckedFirestore(true);
    }
  };

  const handleNavigation = () => {
    console.log('🚀 handleNavigation called!');
    
    if (!navigationRef.current) {
      console.log('❌ navigationRef.current is null!');
      return;
    }

    const navigationState = navigationRef.current.getState();
    const currentRoute = navigationState?.routes[navigationState?.index];
    
    console.log('🗂️ Navigation logic - Current state:', {
      isLoggedIn,
      currentRoute: currentRoute?.name,
      currentScreen,
      shouldResumeOnboarding,
      isUploadedToFirestore,
    });

    // If user is not logged in -> Navigate to Marketing1 (will flow to Login)
    if (!isLoggedIn) {
      console.log('🔄 User not logged in, navigating to Marketing1');
      navigationRef.current.reset({
        index: 0,
        routes: [{ name: 'Marketing1' }],
      });
      console.log('✅ Navigation reset to Marketing1 completed');
      return;
    }

    // If user is logged in and has completed onboarding (data in Firestore) -> Paywall
    if (isLoggedIn && isUploadedToFirestore) {
      console.log('🚀 User logged in with completed onboarding, navigating to Paywall');
      navigationRef.current.reset({
        index: 0,
        routes: [{ name: 'Paywall' }],
      });
      return;
    }

    // If user is logged in but no Firestore data -> Check local onboarding state
    if (isLoggedIn && !isUploadedToFirestore) {
      if (shouldResumeOnboarding && currentScreen) {
        console.log(`🔄 Resuming onboarding at ${currentScreen}`);
        navigationRef.current.reset({
          index: 0,
          routes: [{ name: currentScreen }],
        });
      } else {
        console.log('🆕 Starting fresh onboarding at Name screen');
        // Start onboarding
        useOnboardingStore.getState().startOnboarding();
        navigationRef.current.reset({
          index: 0,
          routes: [{ name: 'Name' }],
        });
      }
      return;
    }
  };

  return (
    <NavigationContainer 
      ref={navigationRef} 
      theme={AppTheme}
      onReady={() => setIsNavigationReady(true)}
    >
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
