import { useEffect, useState } from "react";
import { SubscriptionService } from "../lib/subscriptionService";

export function useSubscriptionInit() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    const initializeSubscriptions = async () => {
      try {
        await SubscriptionService.initialize();

        await SubscriptionService.checkSubscriptionStatus();

        if (mounted) {
          setIsInitialized(true);
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
