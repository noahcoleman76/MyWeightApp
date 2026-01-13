import { SubscriptionService } from "@/src/lib/subscriptionService";
import { useTheme } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { RootStackParamList } from "../../navigation/RootNavigator";
import { useSubscriptionStore } from "../../state/subscriptionStore";

type Props = NativeStackScreenProps<RootStackParamList, "Paywall">;

export default function Paywall({ navigation }: Props) {
  const { colors } = useTheme();

  const ACCENT = colors?.primary ?? "#16a34a";
  const TEXT = colors?.text ?? "#111827";
  const BG = colors?.background ?? "#FFFFFF";
  const PLACEHOLDER = "#9ca3af";
  const LINK_BLUE = "#2563eb";

  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const goIn = () => navigation.replace("Tabs");

  const handlePurchase = async () => {
    if (isPurchasing) return;
    setIsPurchasing(true);
    try {
      await SubscriptionService.purchaseSubscription("monthly_subscription");
      
      setTimeout(() => {
        const currentEntitlement = useSubscriptionStore.getState().isEntitled;
        if (currentEntitlement) {
          Alert.alert(
            "Welcome to Premium! 🎉",
            "Your subscription is now active. Enjoy full access to all premium features!",
            [{ text: "Get Started", onPress: () => goIn() }]
          );
        }
        setIsPurchasing(false);
      }, 1000);
    } catch (error: any) {
      console.error("❌ Purchase failed:", error);
      setIsPurchasing(false);
      
      if (error?.code === "E_USER_CANCELLED") {
        return;
      }
      
      const errorMessage = error?.message || "An unexpected error occurred";
      Alert.alert(
        "Purchase Failed",
        `There was an issue processing your purchase: ${errorMessage}\nPlease try again or contact support.`
      );
    }
  };

  const handleRestore = async () => {
    if (isRestoring) return;
    setIsRestoring(true);
    try {
      const { success, restored } = await SubscriptionService.restorePurchases();
      if (success && restored) {
        Alert.alert(
          "Subscription Restored! ✅",
          "Your premium access has been restored successfully.",
          [{ text: "Continue", onPress: () => goIn() }]
        );
      } else if (success && !restored) {
        Alert.alert(
          "No Active Subscription",
          "We couldn't find any active subscriptions for this account."
        );
      } else {
        Alert.alert(
          "Restore Failed",
          "There was an issue restoring your purchases. Please try again."
        );
      }
    } catch (error: any) {
      console.error("❌ Restore failed:", error);
      Alert.alert(
        "Restore Failed",
        "There was an issue restoring your purchases. Please try again."
      );
    } finally {
      setIsRestoring(false);
    }
  };

  const PrimaryCTA = ({
    onPress,
    disabled = false,
    loading = false,
  }: {
    onPress: () => void;
    disabled?: boolean;
    loading?: boolean;
  }) => (
    <Pressable
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.primaryButton,
        {
          backgroundColor: disabled || loading ? "#E5E7EB" : ACCENT,
          transform: [{ scale: pressed && !disabled && !loading ? 0.98 : 1 }],
          opacity: disabled || loading ? 0.7 : 1,
        },
      ]}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
    >
      {loading ? (
        <>
          <ActivityIndicator color="#FFFFFF" size="small" />
          <Text style={[styles.primaryButtonText, { marginTop: 8 }]}>
            Processing...
          </Text>
        </>
      ) : (
        <>
          <Text style={styles.primaryButtonText}>
            Start Your Premium Journey
          </Text>
          <Text style={styles.primaryButtonSubtext}>
            $4.99/month
          </Text>
        </>
      )}
    </Pressable>
  );

  const LinkButton = ({
    title,
    onPress,
    loading = false,
    disabled = false,
  }: {
    title: string;
    onPress: () => void;
    loading?: boolean;
    disabled?: boolean;
  }) => (
    <Pressable 
      onPress={onPress} 
      disabled={disabled || loading}
      accessibilityRole="button"
      style={{ opacity: disabled || loading ? 0.5 : 1 }}
    >
      {loading ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <ActivityIndicator size="small" color={LINK_BLUE} />
          <Text style={[styles.linkText, { color: LINK_BLUE }]}>
            {title}...
          </Text>
        </View>
      ) : (
        <Text style={[styles.linkText, { color: LINK_BLUE }]}>{title}</Text>
      )}
    </Pressable>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: BG }]} edges={["top", "bottom"]}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.badge, { backgroundColor: ACCENT, color: "#FFFFFF" }]}>
            PREMIUM
          </Text>
          <Text style={[styles.title, { color: TEXT }]}>
            Unlock Your Full Potential
          </Text>
          <Text style={[styles.subtitle, { color: PLACEHOLDER }]}>
            Join thousands achieving their weight goals
          </Text>
        </View>

        <View style={styles.featuresContainer}>
          {[
            { icon: "🎯", title: "Personalized Goals", desc: "AI-powered calorie targets that adapt to your progress" },
            { icon: "📊", title: "Advanced Analytics", desc: "Detailed charts and insights into your journey" },
            { icon: "⚡", title: "Smart Adjustments", desc: "Automatic plan updates based on your results" },
            { icon: "🏆", title: "Achievement System", desc: "Milestones and rewards to keep you motivated" },
          ].map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: `${ACCENT}15` }]}>
                <Text style={styles.iconText}>{feature.icon}</Text>
              </View>
              <View style={styles.featureContent}>
                <Text style={[styles.featureTitle, { color: TEXT }]}>{feature.title}</Text>
                <Text style={[styles.featureDesc, { color: PLACEHOLDER }]}>{feature.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={[styles.pricingCard, { backgroundColor: ACCENT }]}>
          <View style={styles.pricingMain}>
            <Text style={styles.currentPrice}>$4.99</Text>
            <Text style={styles.pricingPeriod}>/month</Text>
          </View>
          <Text style={styles.pricingNote}>Billed monthly</Text>
        </View>

        <View style={styles.actions}>
          <PrimaryCTA 
            onPress={handlePurchase} 
            loading={isPurchasing}
            disabled={isPurchasing || isRestoring}
          />
          
          <Text style={[styles.terms, { color: PLACEHOLDER }]}>
            Auto-renews monthly. Cancel anytime in your account settings.
          </Text>

          <View style={styles.restoreSection}>
            <Text style={[styles.restoreInfo, { color: PLACEHOLDER }]}>
              Already subscribed or paid before? Restore your purchase.
            </Text>
            <LinkButton 
              title="Restore Purchase" 
              onPress={handleRestore}
              loading={isRestoring}
              disabled={isPurchasing || isRestoring}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
    marginTop: 20,
  },
  badge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.2,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 8,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 22,
  },
  featuresContainer: {
    marginBottom: 32,
    gap: 16,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 4,
    gap: 16,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  iconText: {
    fontSize: 20,
  },
  featureContent: {
    flex: 1,
    paddingTop: 2,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: 14,
    lineHeight: 20,
  },
  pricingCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 12 },
        shadowRadius: 24,
        shadowOpacity: 0.15,
      },
      android: { elevation: 8 },
    }),
  },
  pricingMain: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 4,
  },
  currentPrice: {
    color: "#FFFFFF",
    fontSize: 36,
    fontWeight: "900",
    letterSpacing: -1,
  },
  pricingPeriod: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 2,
  },
  pricingNote: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    fontWeight: "500",
  },
  actions: {
    alignItems: "center",
    gap: 16,
  },
  primaryButton: {
    backgroundColor: "#000",
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 32,
    width: "100%",
    maxWidth: 320,
    alignItems: "center",
    minHeight: 68,
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowRadius: 16,
        shadowOpacity: 0.2,
      },
      android: { elevation: 6 },
    }),
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 2,
  },
  primaryButtonSubtext: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    fontWeight: "500",
  },
  terms: {
    fontSize: 12,
    textAlign: "center",
    lineHeight: 16,
    maxWidth: 280,
  },
  restoreSection: {
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  restoreInfo: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
    maxWidth: 300,
  },
  secondaryActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 8,
  },
  separator: {
    fontSize: 14,
    fontWeight: "600",
  },
  linkText: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  devTools: {
    marginTop: 32,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: "dashed",
  },
  devTitle: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 12,
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  devActions: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
  },
  devButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  devButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
});
