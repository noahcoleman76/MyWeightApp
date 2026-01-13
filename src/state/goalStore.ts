import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { getItem, removeItem, setItem } from "../lib/mmkv";

export type GoalMode = "lose" | "gain" | "maintain";

type GoalState = {
  mode: GoalMode;
  goalWeightKg?: number;
  targetDateISO?: string;

  dailyTargetOverride?: number;

  setMode: (m: GoalMode) => void;
  setGoalWeightKg: (kg?: number) => void;
  setTargetDateISO: (iso?: string) => void;

  setDailyTargetOverride: (kcal?: number) => void;
  clearOverrides: () => void;

  reset: () => void;
};

export const useGoalStore = create<GoalState>()(
  persist(
    (set) => ({
      mode: "lose",
      setMode: (m) => set({ mode: m }),
      setGoalWeightKg: (kg) => set({ goalWeightKg: kg }),
      setTargetDateISO: (iso) => set({ targetDateISO: iso }),

      setDailyTargetOverride: (kcal) => set({ dailyTargetOverride: kcal }),
      clearOverrides: () => set({ dailyTargetOverride: undefined }),

      reset: () => set({ mode: "lose", goalWeightKg: undefined, targetDateISO: undefined, dailyTargetOverride: undefined }),
    }),
    {
      name: "goalStore",
      storage: createJSONStorage(() => ({ getItem, setItem, removeItem })),
      version: 2,
    }
  )
);
