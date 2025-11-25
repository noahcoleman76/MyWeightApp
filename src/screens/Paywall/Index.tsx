import { useNavigation, useTheme } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React from "react";
import {
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
import { useAppStore } from "../../state/appStore";
import { useGoalStore } from "../../state/goalStore";
import { useLogStore } from "../../state/logStore";
import { useProfileStore } from "../../state/profileStore";
import { useSubscriptionStore } from "../../state/subscriptionStore";

type Props = NativeStackScreenProps<RootStackParamList, "Paywall">;

export default function Paywall({ navigation }: Props) {
  const nav = useNavigation<any>();
  const { colors } = useTheme();

  const ACCENT = colors?.primary ?? "#16a34a";
  const TEXT = colors?.text ?? "#111827";
  const BG = colors?.background ?? "#FFFFFF";
  const MUTED = colors?.border ?? "#e5e7eb";
  const PLACEHOLDER = "#9ca3af";
  const LINK_BLUE = "#2563eb";

  const grant = useSubscriptionStore((s) => s.grantDevEntitlement);
  const revoke = useSubscriptionStore((s) => s.revokeEntitlement);
  const isEntitled = useSubscriptionStore((s) => s.isEntitled);

  const goIn = () => navigation.replace("Tabs");
  const setLoggedIn = useAppStore((s) => s.setLoggedIn);
  const setOnboardingDone = useAppStore((s) => s.setOnboardingDone);

  const resetProfile = useProfileStore((s) => s.reset);
  const resetGoal = useGoalStore((s) => s.reset);
  const resetLogs = useLogStore((s) => s.reset);
  const resetSub = useSubscriptionStore((s) => s.reset);

  const handleResetAll = () => {
    Alert.alert("Reset all data?", "This will erase onboarding, logs, and login state.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reset",
        style: "destructive",
        onPress: () => {
          resetProfile?.();
          resetGoal?.();
          resetLogs?.();
          resetSub?.();
          setLoggedIn?.(false);
          setOnboardingDone?.(false);
          nav.reset({ index: 0, routes: [{ name: "Splash" }] });
        },
      },
    ]);
  };

  const PrimaryCTA = ({
    onPress,
    disabled = false,
  }: {
    onPress: () => void;
    disabled?: boolean;
  }) => (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.primaryButton,
        {
          backgroundColor: disabled ? "#E5E7EB" : ACCENT,
          transform: [{ scale: pressed && !disabled ? 0.98 : 1 }],
          opacity: disabled ? 0.7 : 1,
        },
      ]}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
    >
      <Text style={styles.primaryButtonText}>
        Start Your Premium Journey
      </Text>
      <Text style={styles.primaryButtonSubtext}>
        $4.99/month
      </Text>
    </Pressable>
  );

  const LinkButton = ({
    title,
    onPress,
  }: {
    title: string;
    onPress: () => void;
  }) => (
    <Pressable onPress={onPress} accessibilityRole="button">
      <Text style={[styles.linkText, { color: LINK_BLUE }]}>{title}</Text>
    </Pressable>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: BG }]} edges={["top", "bottom"]}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Header section */}
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

        {/* Premium features with icons */}
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

        {/* Pricing card */}
        <View style={[styles.pricingCard, { backgroundColor: ACCENT }]}>
          <View style={styles.pricingMain}>
            <Text style={styles.currentPrice}>$4.99</Text>
            <Text style={styles.pricingPeriod}>/month</Text>
          </View>
          <Text style={styles.pricingNote}>Billed monthly</Text>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <PrimaryCTA onPress={() => { grant(); goIn(); }} />
          
          <Text style={[styles.terms, { color: PLACEHOLDER }]}>
            Auto-renews monthly. Cancel anytime in settings.
          </Text>

          {/* Secondary actions */}
          <View style={styles.secondaryActions}>
            <LinkButton title="Restore Purchases" onPress={() => { grant(); goIn(); }} />
            <Text style={[styles.separator, { color: MUTED }]}>•</Text>
            <LinkButton title="Skip Trial" onPress={goIn} />
          </View>
        </View>

        {/* Dev tools (collapsed by default) */}
        {__DEV__ && (
          <View style={[styles.devTools, { borderColor: MUTED }]}>
            <Text style={[styles.devTitle, { color: PLACEHOLDER }]}>Dev Tools</Text>
            <View style={styles.devActions}>
              {isEntitled && (
                <Pressable
                  onPress={revoke}
                  style={({ pressed }) => [
                    styles.devButton,
                    { backgroundColor: "#ef4444", opacity: pressed ? 0.8 : 1 },
                  ]}
                >
                  <Text style={styles.devButtonText}>Revoke</Text>
                </Pressable>
              )}
              <Pressable
                onPress={handleResetAll}
                style={({ pressed }) => [
                  styles.devButton,
                  { backgroundColor: "#ef4444", opacity: pressed ? 0.8 : 1 },
                ]}
              >
                <Text style={styles.devButtonText}>Reset All</Text>
              </Pressable>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scrollView: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  // Header section
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
  // Features section
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
  // Pricing card
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
  // Actions section
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
  // Dev tools
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
