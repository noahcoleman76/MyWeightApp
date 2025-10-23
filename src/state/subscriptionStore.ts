import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { getItem, removeItem, setItem } from "../lib/mmkv";

type SubscriptionState = {
  isEntitled: boolean;
  productId?: string;
  lastPurchaseDate?: string;
  grantDevEntitlement: () => void;   // dev-only helper (Skip for Review)
  revokeEntitlement: () => void;
};

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set) => ({
      isEntitled: false,
      grantDevEntitlement: () =>
        set({ isEntitled: true, lastPurchaseDate: new Date().toISOString(), productId: "myweight_monthly_499" }),
      revokeEntitlement: () => set({ isEntitled: false, productId: undefined, lastPurchaseDate: undefined }),
    }),
    {
      name: "subscriptionStore",
      storage: createJSONStorage(() => ({ getItem, setItem, removeItem })),
      version: 1,
    }
  )
);
