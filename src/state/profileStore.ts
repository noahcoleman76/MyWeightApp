import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { getItem, removeItem, setItem } from "../lib/mmkv";

export type ActivityLevel = "sedentary" | "light" | "moderate" | "high";

export interface Profile {
  name: string;
  gender: "male" | "female";
  age: number;
  height: number; // cm
  currentWeight: number; // kg (we'll support lb later)
  activityLevel: ActivityLevel;
  startDate: string; // ISO
}

type ProfileStore = {
  profile: Profile;
  setName: (name: string) => void;
  reset: () => void;
};

const defaultProfile: Profile = {
  name: "You",
  gender: "male",
  age: 25,
  height: 180,
  currentWeight: 90,
  activityLevel: "light",
  startDate: new Date().toISOString(),
};

export const useProfileStore = create<ProfileStore>()(
  persist(
    (set) => ({
      profile: defaultProfile,
      setName: (name) => set((s) => ({ profile: { ...s.profile, name } })),
      reset: () => set({ profile: defaultProfile }),
    }),
    {
      name: "profileStore",
      storage: createJSONStorage(() => ({
        getItem,
        setItem,
        removeItem,
      })),
      version: 1,
    }
  )
);
