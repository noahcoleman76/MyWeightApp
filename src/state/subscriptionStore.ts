import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { getItem, removeItem, setItem } from "../lib/mmkv";

export type SubscriptionStatus = "active" | "expired" | "none";

type SubscriptionState = {
  // Core subscription state
  isEntitled: boolean;
  productId?: string;
  lastPurchaseDate?: string;
  expirationDate?: string;
  status: SubscriptionStatus;
  
  // Actions
  setSubscription: (data: {
    isEntitled: boolean;
    productId: string;
    purchaseDate: string;
    expirationDate?: string;
    status?: SubscriptionStatus;
  }) => void;
  clearSubscription: () => void;
  reset: () => void;
  
  // Dev-only helpers (for testing, will be removed in production)
  grantDevEntitlement: () => void;
  revokeEntitlement: () => void;
};

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set) => ({
      isEntitled: false,
      status: "none",
      
      setSubscription: (data) =>
        set({
          isEntitled: data.isEntitled,
          productId: data.productId,
          lastPurchaseDate: data.purchaseDate,
          expirationDate: data.expirationDate,
          status: data.status || "active",
        }),
      
      clearSubscription: () =>
        set({
          isEntitled: false,
          productId: undefined,
          lastPurchaseDate: undefined,
          expirationDate: undefined,
          status: "expired",
        }),
      
      reset: () =>
        set({
          isEntitled: false,
          productId: undefined,
          lastPurchaseDate: undefined,
          expirationDate: undefined,
          status: "none",
        }),
      
      // Dev-only helpers
      grantDevEntitlement: () =>
        set({
          isEntitled: true,
          lastPurchaseDate: new Date().toISOString(),
          productId: "monthly_subscription",
          status: "active",
        }),
      
      revokeEntitlement: () =>
        set({
          isEntitled: false,
          productId: undefined,
          lastPurchaseDate: undefined,
          expirationDate: undefined,
          status: "none",
        }),
    }),
    {
      name: "subscriptionStore",
      storage: createJSONStorage(() => ({ getItem, setItem, removeItem })),
      version: 2,
    }
  )
);
