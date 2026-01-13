import { Linking, Platform } from "react-native";
import {
  Purchase,
  PurchaseError,
  Subscription,
  clearTransactionIOS,
  endConnection,
  fetchProducts,
  finishTransaction,
  getAvailablePurchases,
  initConnection,
  purchaseErrorListener,
  purchaseUpdatedListener,
  requestPurchase,
} from "react-native-iap";
import { useSubscriptionStore } from "../state/subscriptionStore";

export const SUBSCRIPTION_PRODUCT_IDS = {
  MONTHLY: "monthly_subscription",
};

export class SubscriptionService {
  private static isInitialized = false;
  private static purchaseUpdateSubscription: any = null;
  private static purchaseErrorSubscription: any = null;

  static async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      await initConnection();

      this.setupPurchaseListeners();

      if (Platform.OS === "ios") {
        await clearTransactionIOS();
      }

      this.isInitialized = true;
    } catch (error) {
      console.error("❌ Failed to initialize SubscriptionService:", error);
      throw error;
    }
  }

  private static setupPurchaseListeners(): void {
    this.purchaseUpdateSubscription = purchaseUpdatedListener(
      async (purchase: Purchase) => {
        await this.processPurchase(purchase);
      }
    );

    this.purchaseErrorSubscription = purchaseErrorListener(
      (error: PurchaseError) => {
        console.error("❌ Purchase error:", {
          code: error.code,
          message: error.message,
        });
      }
    );
  }

  private static async processPurchase(purchase: Purchase): Promise<void> {
    try {
      if (!purchase.productId || !purchase.transactionId) {
        console.error("❌ Invalid purchase object:", purchase);
        return;
      }

      if (purchase.productId !== SUBSCRIPTION_PRODUCT_IDS.MONTHLY) {
        return;
      }

      const store = useSubscriptionStore.getState();

      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 30);

      store.setSubscription({
        isEntitled: true,
        productId: purchase.productId,
        purchaseDate: new Date(purchase.transactionDate).toISOString(),
        expirationDate: expirationDate.toISOString(),
        status: "active",
      });

      await finishTransaction({ purchase, isConsumable: false });
    } catch (error) {
      console.error("❌ Error processing purchase:", error);
    }
  }

  static async getProducts(): Promise<Subscription[]> {
    try {
      const products = await fetchProducts({
        skus: [SUBSCRIPTION_PRODUCT_IDS.MONTHLY],
        type: 'subs',
      });

      if (!products) {
        return [];
      }
      return products as unknown as Subscription[];
    } catch (error) {
      console.error("❌ Error fetching products:", error);
      return [];
    }
  }

  static async purchaseSubscription(productId: string): Promise<void> {
    try {
      await requestPurchase({
        type: 'subs',
        request: {
          ios: {
            sku: productId,
            andDangerouslyFinishTransactionAutomatically: false,
          },
          android: {
            skus: [productId],
          },
        },
      });

    } catch (error: any) {
      console.error("❌ Error during purchase:", error);

      if (error.code === "E_USER_CANCELLED") {
        const cancelError = new Error("User cancelled");
        (cancelError as any).code = "E_USER_CANCELLED";
        throw cancelError;
      }

      throw error;
    }
  }

  static async restorePurchases(): Promise<{
    success: boolean;
    restored: boolean;
  }> {
    try {
      const purchases = await getAvailablePurchases();

      if (purchases.length > 0) {
        const activeSubscription = purchases.find(
          (purchase) => purchase.productId === SUBSCRIPTION_PRODUCT_IDS.MONTHLY
        );

        if (activeSubscription) {
          await this.processPurchase(activeSubscription);
          return { success: true, restored: true };
        } else {
          return { success: true, restored: false };
        }
      } else {
        return { success: true, restored: false };
      }
    } catch (error) {
      console.error("❌ Error restoring purchases:", error);
      return { success: false, restored: false };
    }
  }

  static async openSubscriptionManagement(): Promise<void> {
    try {
      if (Platform.OS === "ios") {
        const url = "https://apps.apple.com/account/subscriptions";
        await Linking.openURL(url);
      } else if (Platform.OS === "android") {
        const url = "https://play.google.com/store/account/subscriptions";
        await Linking.openURL(url);
      }
    } catch (error) {
      console.error("❌ Error opening subscription management:", error);
      throw error;
    }
  }

  static async checkSubscriptionStatus(): Promise<boolean> {
    try {
      const purchases = await getAvailablePurchases();

      const activeSubscription = purchases.find(
        (purchase) => purchase.productId === SUBSCRIPTION_PRODUCT_IDS.MONTHLY
      );

      if (activeSubscription) {
        await this.processPurchase(activeSubscription);
        return true;
      } else {
        const store = useSubscriptionStore.getState();
        if (store.isEntitled) {
          store.clearSubscription();
        }

        return false;
      }
    } catch (error) {
      console.error("❌ Error checking subscription status:", error);
      return false;
    }
  }

  static async disconnect(): Promise<void> {
    try {
      if (this.purchaseUpdateSubscription) {
        this.purchaseUpdateSubscription.remove();
        this.purchaseUpdateSubscription = null;
      }

      if (this.purchaseErrorSubscription) {
        this.purchaseErrorSubscription.remove();
        this.purchaseErrorSubscription = null;
      }

      await endConnection();
      this.isInitialized = false;
    } catch (error) {
      console.error("❌ Error disconnecting from store:", error);
    }
  }
}
