import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { getItem, removeItem, setItem } from "../lib/mmkv";

type AppStore = {
  isLoggedIn: boolean;
  onboardingDone: boolean;
  setLoggedIn: (v: boolean) => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
};

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      isLoggedIn: false,
      onboardingDone: false,
      setLoggedIn: (v) => set({ isLoggedIn: v }),
      completeOnboarding: () => set({ onboardingDone: true }),
      resetOnboarding: () => set({ onboardingDone: false }),
    }),
    {
      name: "appStore",
      storage: createJSONStorage(() => ({ getItem, setItem, removeItem })),
      version: 2,
    }
  )
);
