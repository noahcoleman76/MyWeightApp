import { useEffect } from 'react';
import { OnboardingScreen, useOnboardingStore } from '../state/onboardingStore';

/**
 * Hook to automatically track and save the current onboarding screen
 * Use this in every onboarding screen component
 */
export function useOnboardingTracker(screenName: OnboardingScreen) {
  const { setCurrentScreen } = useOnboardingStore();
  
  useEffect(() => {
    console.log(`📍 Entered onboarding screen: ${screenName}`);
    setCurrentScreen(screenName);
  }, [screenName, setCurrentScreen]);
}