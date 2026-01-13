import { NavigationContainer, NavigationContainerRef } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React, { useEffect, useRef, useState } from "react";
import { UserDataService } from "../lib/userDataService";
import { useAuthStore } from "../state/authStore";
import { useOnboardingStore } from "../state/onboardingStore";
import { useSubscriptionInit } from "../hooks/useSubscriptionInit";

import Marketing1 from "../screens/Onboarding/Marketing1";
import Marketing2 from "../screens/Onboarding/Marketing2";
import Marketing3 from "../screens/Onboarding/Marketing3";
import Splash from "../screens/Onboarding/Splash";

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

import OnboardingHowItWorks from "../screens/Onboarding/HowItWorks";
import OnboardingLearnMore from "../screens/Onboarding/LearnMore";

import Concerns from "../screens/Onboarding/Concerns";
import Encouragement from "../screens/Onboarding/Encouragement";
import Motivation from "../screens/Onboarding/Motivation";

import CreateAccount from "../screens/CreateAccount/Index";
import Login from "../screens/Login/Index";

import PrivacyPolicy from "../screens/PrivacyPolicy/Index";
import TermsOfUse from "../screens/TermsOfUse/Index";

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

  const { isInitialized: isSubInitialized } = useSubscriptionInit();

  const [navState, setNavState] = useState<'splash' | 'checking' | 'ready'>('splash');

  const hasCheckedUserRef = useRef<string | null>(null);

  const prevIsLoggedInRef = useRef(isLoggedIn);

  useEffect(() => {
    const timer = setTimeout(() => {
      setNavState('checking');
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const wasLoggedOut = !prevIsLoggedInRef.current;
    const isNowLoggedIn = isLoggedIn;

    if (wasLoggedOut && isNowLoggedIn && navState === 'ready') {
      setNavState('checking');
    }

    prevIsLoggedInRef.current = isLoggedIn;
  }, [isLoggedIn, navState]);

  useEffect(() => {
    if (navState !== 'checking' || isInitializing || !isSubInitialized) {
      return;
    }

    if (isLoggedIn && user && hasCheckedUserRef.current !== user.uid) {
      hasCheckedUserRef.current = user.uid;

      (async () => {
        try {
          const hasData = await UserDataService.hasCompletedOnboarding(user.uid);

          if (hasData) {
            await UserDataService.loadUserDataFromFirestore(user.uid);
          }
        } catch (error) {
          console.error('❌ Error checking Firestore:', error);
        } finally {
          setNavState('ready');
        }
      })();
    } else if (!isLoggedIn) {
      hasCheckedUserRef.current = null;
      setNavState('ready');
    }
  }, [navState, isInitializing, isLoggedIn, user, isSubInitialized]);

  useEffect(() => {
    if (!navigationRef.current || navState !== 'ready' || isInitializing) {
      return;
    }

    const currentRoute = navigationRef.current.getState()?.routes[navigationRef.current.getState()?.index]?.name;

    let targetRoute: keyof RootStackParamList;

    if (!isLoggedIn) {
      targetRoute = 'Marketing1';
    } else if (isUploadedToFirestore) {
      targetRoute = 'Paywall';
    } else if (shouldResumeOnboarding && currentScreen) {
      targetRoute = currentScreen;
    } else {
      targetRoute = 'Name';
      useOnboardingStore.getState().startOnboarding();
    }

    if (currentRoute !== targetRoute) {
      navigationRef.current.reset({
        index: 0,
        routes: [{ name: targetRoute }],
      });
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
          headerShown: false,
          contentStyle: { backgroundColor: AppTheme.colors.card },
          animation: "slide_from_right",
          gestureEnabled: true,
        }}
      >
        <Stack.Screen name="Splash" component={Splash} options={{ headerShown: false }} />

        <Stack.Screen name="Marketing1" component={Marketing1} />
        <Stack.Screen name="Marketing2" component={Marketing2} />
        <Stack.Screen name="Marketing3" component={Marketing3} />
        <Stack.Screen name="First" component={First} />

        <Stack.Screen name="Name" component={Name} />
        <Stack.Screen name="GoalMode" component={GoalMode} />
        <Stack.Screen name="ChooseGender" component={ChooseGender} />
        <Stack.Screen name="BirthYear" component={BirthYear} />
        <Stack.Screen name="Height" component={Height} />
        <Stack.Screen name="CurrentWeight" component={CurrentWeight} />
        <Stack.Screen name="GoalWeight" component={GoalWeight} />
        <Stack.Screen name="TargetDate" component={TargetDate} />
        <Stack.Screen name="Activity" component={ActivityPage} />

        <Stack.Screen name="OnboardingHowItWorks" component={OnboardingHowItWorks} />
        <Stack.Screen name="OnboardingLearnMore" component={OnboardingLearnMore} />

        <Stack.Screen name="Motivation" component={Motivation} />
        <Stack.Screen name="Concerns" component={Concerns} />
        <Stack.Screen name="Encouragement" component={Encouragement} />

        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="CreateAccount" component={CreateAccount} />

        <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicy} />
        <Stack.Screen name="TermsOfUse" component={TermsOfUse} />

        <Stack.Screen name="Paywall" component={Paywall} />
        <Stack.Screen name="Tabs" component={TabNavigator} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
