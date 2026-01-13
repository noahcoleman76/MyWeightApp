import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { getItem, removeItem, setItem } from "../lib/mmkv";

export type SubscriptionStatus = "active" | "expired" | "none";

type SubscriptionState = {
  isEntitled: boolean;
  productId?: string;
  lastPurchaseDate?: string;
  expirationDate?: string;
  status: SubscriptionStatus;

  setSubscription: (data: {
    isEntitled: boolean;
    productId: string;
    purchaseDate: string;
    expirationDate?: string;
    status?: SubscriptionStatus;
  }) => void;
  clearSubscription: () => void;
  reset: () => void;

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
    }),
    {
      name: "subscriptionStore",
      storage: createJSONStorage(() => ({ getItem, setItem, removeItem })),
      version: 2,
    }
  )
);
