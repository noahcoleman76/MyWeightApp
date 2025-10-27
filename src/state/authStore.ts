import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { getItem, removeItem, setItem } from "../lib/mmkv";

type AuthState = {
  isLoggedIn: boolean;
  setLoggedIn: (v: boolean) => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isLoggedIn: false,
      setLoggedIn: (v) => set({ isLoggedIn: v }),
    }),
    {
      name: "authStore",
      storage: createJSONStorage(() => ({ getItem, setItem, removeItem })),
      version: 1,
    }
  )
);
