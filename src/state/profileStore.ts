import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { getItem, removeItem, setItem } from "../lib/mmkv";
import { StreakData } from "../lib/firebase";

export type ActivityLevel = "sedentary" | "light" | "moderate" | "high";
export type WeightUnit = "lb" | "kg";
export type HeightUnit = "in" | "cm";

export interface Profile {
  name: string;
  email?: string;
  gender: "male" | "female";
  age: number;
  height: number;
  currentWeightKg: number;
  startingWeightKg?: number;
  activityLevel: ActivityLevel;
  startDate: string;
  weightUnit?: WeightUnit;
  heightUnit?: HeightUnit;
  motivation?: string[];
  concerns?: string[];
  streak?: StreakData;
}

type ProfileStore = {
  profile: Profile;
  setName: (name: string) => void;
  setEmail: (email?: string) => void;
  setGender: (g: "male" | "female") => void;
  setAgeFromBirthYear: (year: number) => void;
  setHeightCm: (cm: number) => void;
  setCurrentWeightKg: (kg: number) => void;
  setStartingWeightKg: (kg: number) => void;
  setActivity: (a: ActivityLevel) => void;
  setUnits: (w: WeightUnit, h: HeightUnit) => void;
  setMotivation: (vals: string[]) => void;
  setConcerns: (vals: string[]) => void;
  setStreak: (streak: StreakData) => void;
  reset: () => void;
};

const defaultProfile: Profile = {
  name: "You",
  gender: "male",
  age: 25,
  height: 175,
  currentWeightKg: 80,
  startingWeightKg: 80,
  activityLevel: "light",
  startDate: new Date().toISOString(),
  weightUnit: "lb",
  heightUnit: "in",
};

export const useProfileStore = create<ProfileStore>()(
  persist(
    (set, get) => ({
      profile: defaultProfile,
      setName: (name) => set((s) => ({ profile: { ...s.profile, name } })),
      setEmail: (email) => set((s) => ({ profile: { ...s.profile, email } })),
      setGender: (gender) => set((s) => ({ profile: { ...s.profile, gender } })),
      setAgeFromBirthYear: (year) =>
        set((s) => ({
          profile: { ...s.profile, age: Math.max(0, Math.min(120, new Date().getFullYear() - year)) },
        })),
      setHeightCm: (height) => set((s) => ({ profile: { ...s.profile, height } })),
      setCurrentWeightKg: (currentWeightKg) => set((s) => ({ profile: { ...s.profile, currentWeightKg } })),
      setStartingWeightKg: (kg) => set((s) => ({ profile: { ...s.profile, startingWeightKg: kg } })),
      setActivity: (activityLevel) => set((s) => ({ profile: { ...s.profile, activityLevel } })),
      setUnits: (weightUnit, heightUnit) => set((s) => ({ profile: { ...s.profile, weightUnit, heightUnit } })),
      setMotivation: (motivation) => set((s) => ({ profile: { ...s.profile, motivation } })),
      setConcerns: (concerns) => set((s) => ({ profile: { ...s.profile, concerns } })),
      setStreak: (streak) => set((s) => ({ profile: { ...s.profile, streak } })),
      reset: () => set({ profile: defaultProfile }),
    }),
    {
      name: "profileStore",
      storage: createJSONStorage(() => ({ getItem, setItem, removeItem })),
      version: 5,
      migrate: (persisted: any, _v) => {
        if (persisted?.state?.profile && persisted.state.profile.startingWeightKg == null) {
          persisted.state.profile.startingWeightKg = persisted.state.profile.currentWeightKg ?? 80;
        }
        return persisted;
      },
    }
  )
);
