// src/hooks/useSubscriptionInit.ts
import { useEffect, useState } from "react";
import { SubscriptionService } from "../lib/subscriptionService";

/**
 * Hook to initialize subscription service on app startup
 * 
 * Usage: Call this once in App.tsx or RootNavigator
 */
export function useSubscriptionInit() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    const initializeSubscriptions = async () => {
      try {
        console.log("🚀 Initializing subscription service...");
        await SubscriptionService.initialize();
        
        // Check current subscription status
        await SubscriptionService.checkSubscriptionStatus();
        
        if (mounted) {
          setIsInitialized(true);
          console.log("✅ Subscription service ready");
        }
      } catch (err) {
        console.error("❌ Failed to initialize subscriptions:", err);
        if (mounted) {
          setError(err as Error);
        }
      }
    };

    initializeSubscriptions();

    return () => {
      mounted = false;
    };
  }, []);

  return { isInitialized, error };
}
