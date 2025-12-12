import { useEffect, useRef } from 'react';
import { OnboardingScreen, useOnboardingStore } from '../state/onboardingStore';
import { useAuthStore } from '../state/authStore';

/**
 * Hook to automatically track and save the current onboarding screen
 * Use this in every onboarding screen component
 * 
 * Note: Only updates the store if the user is actually interacting with the screen,
 * not during rapid navigation transitions
 */
export function useOnboardingTracker(screenName: OnboardingScreen) {
  const { setCurrentScreen } = useOnboardingStore();
  const { isInitializing } = useAuthStore();
  const timeoutRef = useRef(0);
  
  useEffect(() => {
    // Don't track during auth initialization to prevent race conditions
    if (isInitializing) {
      console.log(`⏸️ Skipping tracker for ${screenName} (auth initializing)`);
      return;
    }

    // Add a small delay to ensure the user actually landed on this screen
    // This prevents updating the store during rapid navigation transitions
    timeoutRef.current = setTimeout(() => {
      console.log(`📍 Confirmed on screen: ${screenName}, updating store`);
      setCurrentScreen(screenName);
    }, 100);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [screenName, setCurrentScreen, isInitializing]);
}