// src/lib/subscriptionService.ts
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

/**
 * Product ID Configuration
 * 
 * IMPORTANT: These product IDs must match exactly what you configure in:
 * - Apple App Store Connect (for iOS)
 * - Google Play Console (for Android)
 * 
 */
export const SUBSCRIPTION_PRODUCT_IDS = {
  MONTHLY: "monthly_subscription", // Must match Play Console product ID
};

/**
 * Subscription Service using react-native-iap
 * 
 * Handles all in-app purchase operations including:
 * - Connection to store
 * - Fetching products
 * - Making purchases
 * - Restoring purchases
 * - Finishing transactions
 * 
 * COMPLIANCE NOTES:
 * - No free trial logic (as per requirements)
 * - Users pay immediately upon purchase
 * - Cancellation is handled by Apple/Google system settings only
 * - App only provides link to system subscription management
 */
export class SubscriptionService {
  private static isInitialized = false;
  private static purchaseUpdateSubscription: any = null;
  private static purchaseErrorSubscription: any = null;

  /**
   * Initialize the subscription service
   * Call this once when app starts
   */
  static async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log("⚠️ SubscriptionService already initialized");
      return;
    }

    try {
      console.log("🔌 Connecting to store...");
      await initConnection();
      console.log("✅ Connected to store");

      // Set up purchase listeners
      this.setupPurchaseListeners();

      // Check for pending purchases (iOS)
      if (Platform.OS === "ios") {
        await clearTransactionIOS();
      }

      this.isInitialized = true;
      console.log("✅ SubscriptionService initialized");
    } catch (error) {
      console.error("❌ Failed to initialize SubscriptionService:", error);
      throw error;
    }
  }

  /**
   * Set up listeners for purchase updates and errors
   */
  private static setupPurchaseListeners(): void {
    // Listen for purchase updates (successful purchases)
    this.purchaseUpdateSubscription = purchaseUpdatedListener(
      async (purchase: Purchase) => {
        console.log("✅ Purchase update received:", {
          productId: purchase.productId,
          transactionId: purchase.transactionId,
        });

        await this.processPurchase(purchase);
      }
    );

    // Listen for purchase errors
    this.purchaseErrorSubscription = purchaseErrorListener(
      (error: PurchaseError) => {
        console.error("❌ Purchase error:", {
          code: error.code,
          message: error.message,
        });
      }
    );
  }

  /**
   * Process a successful purchase
   * Updates store and finishes transaction
   */
  private static async processPurchase(purchase: Purchase): Promise<void> {
    try {
      // Validate the purchase has required fields
      if (!purchase.productId || !purchase.transactionId) {
        console.error("❌ Invalid purchase object:", purchase);
        return;
      }

      // Only process purchases for our known product IDs
      if (purchase.productId !== SUBSCRIPTION_PRODUCT_IDS.MONTHLY) {
        console.log("ℹ️ Ignoring purchase for unknown product:", purchase.productId);
        return;
      }

      const store = useSubscriptionStore.getState();

      // Calculate expiration date (30 days from now for monthly subscription)
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 30);

      // Update subscription state
      store.setSubscription({
        isEntitled: true,
        productId: purchase.productId,
        purchaseDate: new Date(purchase.transactionDate).toISOString(),
        expirationDate: expirationDate.toISOString(),
        status: "active",
      });

      console.log("✅ Subscription activated:", purchase.productId);

      // Finish the transaction to acknowledge it
      await finishTransaction({ purchase, isConsumable: false });
      console.log("✅ Transaction finished");
    } catch (error) {
      console.error("❌ Error processing purchase:", error);
    }
  }

  /**
   * Fetch available subscription products from the store
   * @returns Array of available products with pricing info
   */
  static async getProducts(): Promise<Subscription[]> {
    try {
      console.log("🛍️ Fetching products...");
      const products = await fetchProducts({
        skus: [SUBSCRIPTION_PRODUCT_IDS.MONTHLY],
        type: 'subs', // Specify we're fetching subscriptions, not in-app purchases
      });

      if (!products) {
        console.log("⚠️ No products returned");
        return [];
      }

      console.log("✅ Products fetched:", products.length);
      return products as unknown as Subscription[];
    } catch (error) {
      console.error("❌ Error fetching products:", error);
      return [];
    }
  }

  /**
   * Purchase a subscription
   * @param productId - The product ID to purchase
   * @throws Error if purchase fails (except user cancellation)
   */
  static async purchaseSubscription(productId: string): Promise<void> {
    try {
      console.log("💳 Initiating purchase:", productId);

      // Use requestPurchase with proper type and platform-specific props
      await requestPurchase({
        type: 'subs',
        request: {
          ios: {
            sku: productId,
            andDangerouslyFinishTransactionAutomatically: false,
          },
          android: {
            skus: [productId], // Android requires array of SKUs
          },
        },
      });

      // The purchase listener will handle the result
      // Don't return success here - the actual purchase completion
      // is handled asynchronously by the purchase listener
      console.log("✅ Purchase initiated, waiting for store response...");
    } catch (error: any) {
      console.error("❌ Error during purchase:", error);
      
      // User cancelled is not an error we want to show
      if (error.code === "E_USER_CANCELLED") {
        console.log("ℹ️ User cancelled purchase");
        const cancelError = new Error("User cancelled");
        (cancelError as any).code = "E_USER_CANCELLED";
        throw cancelError;
      }
      
      throw error;
    }
  }

  /**
   * Restore previous purchases
   * 
   * IMPORTANT: This should NOT charge the user
   * It only restores existing active subscriptions
   * 
   * @returns Success status
   */
  static async restorePurchases(): Promise<{
    success: boolean;
    restored: boolean;
  }> {
    try {
      console.log("🔄 Restoring purchases...");

      const purchases = await getAvailablePurchases();

      console.log("📱 Found purchases:", purchases.length);

      if (purchases.length > 0) {
        // Find our subscription
        const activeSubscription = purchases.find(
          (purchase) => purchase.productId === SUBSCRIPTION_PRODUCT_IDS.MONTHLY
        );

        if (activeSubscription) {
          console.log("✅ Active subscription found, restoring...");
          await this.processPurchase(activeSubscription);
          return { success: true, restored: true };
        } else {
          console.log("ℹ️ No active subscriptions found");
          return { success: true, restored: false };
        }
      } else {
        console.log("ℹ️ No purchase history found");
        return { success: true, restored: false };
      }
    } catch (error) {
      console.error("❌ Error restoring purchases:", error);
      return { success: false, restored: false };
    }
  }

  /**
   * Open system subscription management page
   * 
   * iOS: Opens Apple ID subscriptions in Settings
   * Android: Opens Google Play subscriptions
   */
  static async openSubscriptionManagement(): Promise<void> {
    try {
      if (Platform.OS === "ios") {
        // iOS: Open App Store subscription management
        const url = "https://apps.apple.com/account/subscriptions";
        await Linking.openURL(url);
      } else if (Platform.OS === "android") {
        // Android: Open Play Store subscriptions
        const url = "https://play.google.com/store/account/subscriptions";
        await Linking.openURL(url);
      }
    } catch (error) {
      console.error("❌ Error opening subscription management:", error);
      throw error;
    }
  }

  /**
   * Check current subscription status
   * This queries the store directly for the most up-to-date status
   */
  static async checkSubscriptionStatus(): Promise<boolean> {
    try {
      console.log("🔍 Checking subscription status...");

      const purchases = await getAvailablePurchases();

      const activeSubscription = purchases.find(
        (purchase) => purchase.productId === SUBSCRIPTION_PRODUCT_IDS.MONTHLY
      );

      if (activeSubscription) {
        console.log("✅ Active subscription found");

        // Update store with current status
        await this.processPurchase(activeSubscription);
        return true;
      } else {
        console.log("ℹ️ No active subscription");

        // Clear subscription if expired
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

  /**
   * Disconnect from store
   * Call this when app is closing (optional)
   */
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
      console.log("✅ Disconnected from store");
    } catch (error) {
      console.error("❌ Error disconnecting from store:", error);
    }
  }
}
