// src/navigation/RootNavigator.tsx
import { NavigationContainer, NavigationContainerRef } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React, { useEffect, useRef, useState } from "react";
import { UserDataService } from "../lib/userDataService";
import { useAuthStore } from "../state/authStore";
import { useOnboardingStore } from "../state/onboardingStore";
import { useSubscriptionInit } from "../hooks/useSubscriptionInit";

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

// Legal
import PrivacyPolicy from "../screens/PrivacyPolicy/Index";
import TermsOfUse from "../screens/TermsOfUse/Index";

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
  PrivacyPolicy: undefined;
  TermsOfUse: undefined;
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
  
  // Initialize subscription service on app startup
  const { isInitialized: isSubInitialized } = useSubscriptionInit();
  
  // Simple state machine for navigation flow
  const [navState, setNavState] = useState<'splash' | 'checking' | 'ready'>('splash');
  
  // Track if we've already performed the Firestore check for this user session
  const hasCheckedUserRef = useRef<string | null>(null);
  
  // Track previous login state to detect login changes
  const prevIsLoggedInRef = useRef(isLoggedIn);
  
  // ============================================================================
  // STEP 1: Handle splash screen timeout (2 seconds)
  // ============================================================================
  useEffect(() => {
    console.log('⏱️ Starting splash timer (2000ms)');
    const timer = setTimeout(() => {
      console.log('✅ Splash complete, transitioning to checking state');
      setNavState('checking');
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  // ============================================================================
  // STEP 1.5: Reset to 'checking' when user logs in mid-session
  // ============================================================================
  useEffect(() => {
    // Detect when user transitions from logged out to logged in
    const wasLoggedOut = !prevIsLoggedInRef.current;
    const isNowLoggedIn = isLoggedIn;
    
    if (wasLoggedOut && isNowLoggedIn && navState === 'ready') {
      console.log('🔑 User logged in mid-session, resetting to checking state');
      setNavState('checking');
    }
    
    // Update the ref for next comparison
    prevIsLoggedInRef.current = isLoggedIn;
  }, [isLoggedIn, navState]);

  // ============================================================================
  // STEP 2: Check Firestore when user logs in (one-time per user session)
  // ============================================================================
  useEffect(() => {
    // Only run if we're past splash and auth is initialized and subscription is initialized
    if (navState !== 'checking' || isInitializing || !isSubInitialized) {
      return;
    }

    // If user is logged in and we haven't checked this user yet
    if (isLoggedIn && user && hasCheckedUserRef.current !== user.uid) {
      console.log('🔍 New logged-in user detected, checking Firestore...', { uid: user.uid });
      hasCheckedUserRef.current = user.uid;
      
      (async () => {
        try {
          const hasData = await UserDataService.hasCompletedOnboarding(user.uid);
          
          if (hasData) {
            console.log('✅ User data found in Firestore, loading...');
            await UserDataService.loadUserDataFromFirestore(user.uid);
            console.log('✅ User data loaded successfully');
          } else {
            console.log('ℹ️ No user data in Firestore, starting fresh onboarding');
          }
        } catch (error) {
          console.error('❌ Error checking Firestore:', error);
        } finally {
          // Always transition to ready state after check completes
          console.log('🏁 Firestore check complete, setting navState to ready');
          setNavState('ready');
        }
      })();
    } else if (!isLoggedIn) {
      // Not logged in - no need to check Firestore
      console.log('🔓 User not logged in, skipping Firestore check');
      hasCheckedUserRef.current = null;
      setNavState('ready');
    }
  }, [navState, isInitializing, isLoggedIn, user, isSubInitialized]);

  // ============================================================================
  // STEP 3: Navigate based on auth + onboarding state (declarative)
  // ============================================================================
  useEffect(() => {
    // Wait until navigation is ready and we've completed all checks
    if (!navigationRef.current || navState !== 'ready' || isInitializing) {
      return;
    }

    const currentRoute = navigationRef.current.getState()?.routes[navigationRef.current.getState()?.index]?.name;
    
    console.log('🧭 Determining navigation route:', {
      currentRoute,
      isLoggedIn,
      isUploadedToFirestore,
      shouldResumeOnboarding,
      currentScreen,
    });

    // Determine target route based on state
    let targetRoute: keyof RootStackParamList;

    if (!isLoggedIn) {
      // Not logged in -> Marketing flow
      targetRoute = 'Marketing1';
      console.log('📍 Target: Marketing1 (not logged in)');
    } else if (isUploadedToFirestore) {
      // Logged in + onboarding complete -> Paywall
      targetRoute = 'Paywall';
      console.log('📍 Target: Paywall (onboarding complete)');
    } else if (shouldResumeOnboarding && currentScreen) {
      // Logged in + incomplete onboarding -> Resume
      targetRoute = currentScreen;
      console.log(`📍 Target: ${currentScreen} (resuming onboarding)`);
    } else {
      // Logged in + no onboarding data -> Start fresh
      targetRoute = 'Name';
      useOnboardingStore.getState().startOnboarding();
      console.log('📍 Target: Name (starting fresh onboarding)');
    }

    // Only navigate if we're not already on the target screen
    if (currentRoute !== targetRoute) {
      console.log(`🚀 Navigating: ${currentRoute} -> ${targetRoute}`);
      navigationRef.current.reset({
        index: 0,
        routes: [{ name: targetRoute }],
      });
    } else {
      console.log(`✅ Already on target screen: ${targetRoute}`);
    }
  }, [navState, isInitializing, isLoggedIn, isUploadedToFirestore, shouldResumeOnboarding, currentScreen]);

  return (
    <NavigationContainer
      ref={navigationRef}
      theme={AppTheme}
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

        {/* Legal */}
        <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicy} />
        <Stack.Screen name="TermsOfUse" component={TermsOfUse} />

        {/* Paywall and App */}
        <Stack.Screen name="Paywall" component={Paywall} />
        <Stack.Screen name="Tabs" component={TabNavigator} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
