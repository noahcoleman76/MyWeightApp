import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { getItem, removeItem, setItem } from "../lib/mmkv";

type AppState = {
  isLoggedIn: boolean;
  onboardingDone: boolean;
  setLoggedIn: (v: boolean) => void;
  setOnboardingDone: (v: boolean) => void;
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      isLoggedIn: false,
      onboardingDone: false,
      setLoggedIn: (v) => set({ isLoggedIn: v }),
      setOnboardingDone: (v) => set({ onboardingDone: v }),
    }),
    { name: "appStore", storage: createJSONStorage(() => ({ getItem, setItem, removeItem })) }
  )
);
