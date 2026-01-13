import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { getItem, removeItem, setItem } from "../lib/mmkv";

export type OnboardingScreen = 
  | "Name"
  | "ChooseGender"
  | "BirthYear"
  | "GoalMode"
  | "Height"
  | "CurrentWeight"
  | "GoalWeight"
  | "TargetDate"
  | "Activity"
  | "OnboardingHowItWorks"
  | "OnboardingLearnMore"
  | "Motivation"
  | "Concerns"
  | "Encouragement";

type OnboardingState = {
  currentScreen: OnboardingScreen | null;
  
  isUploadedToFirestore: boolean;
  
  shouldResumeOnboarding: boolean;
  
  setCurrentScreen: (screen: OnboardingScreen | null) => void;
  setUploadedToFirestore: (uploaded: boolean) => void;
  setShouldResumeOnboarding: (should: boolean) => void;
  
  startOnboarding: () => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
};

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      currentScreen: null,
      isUploadedToFirestore: false,
      shouldResumeOnboarding: false,
      
      setCurrentScreen: (screen) => set({ 
        currentScreen: screen,
        shouldResumeOnboarding: screen !== null 
      }),
      
      setUploadedToFirestore: (uploaded) => set({ 
        isUploadedToFirestore: uploaded 
      }),
      
      setShouldResumeOnboarding: (should) => set({ 
        shouldResumeOnboarding: should 
      }),
      
      startOnboarding: () => set({ 
        currentScreen: "Name",
        shouldResumeOnboarding: true,
        isUploadedToFirestore: false
      }),
      
      completeOnboarding: () => set({ 
        currentScreen: null,
        shouldResumeOnboarding: false,
        isUploadedToFirestore: true
      }),
      
      resetOnboarding: () => set({ 
        currentScreen: null,
        shouldResumeOnboarding: false,
        isUploadedToFirestore: false
      }),
    }),
    {
      name: "onboardingStore",
      storage: createJSONStorage(() => ({ getItem, setItem, removeItem })),
      version: 1,
    }
  )
);