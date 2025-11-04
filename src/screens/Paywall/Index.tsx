import { useNavigation, useTheme } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React from "react";
import {
  Alert,
  Platform,
  Pressable,
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
        styles.cta,
        {
          backgroundColor: disabled ? "#E5E7EB" : ACCENT,
          transform: [{ translateY: pressed && !disabled ? 1 : 0 }],
          opacity: disabled ? 0.7 : 1,
        },
      ]}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
    >
      <View style={styles.ctaContent}>
        <Text style={[styles.ctaTitle, { textAlign: "center" }]}>Subscribe</Text>
        <Text style={[styles.ctaPrice, { textAlign: "center" }]}>$4.99</Text>
      </View>
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
      <View style={styles.container}>
        <Text style={[styles.title, { color: TEXT }]}>My Weight Premium</Text>

        {/* Features card */}
        <View
          style={[
            styles.card,
            { borderColor: MUTED, backgroundColor: "#F9FAFB" },
          ]}
        >
          <Text style={[styles.feature, { color: TEXT }]}>• Personalized daily calorie goals</Text>
          <Text style={[styles.feature, { color: TEXT }]}>• Progress Tracking</Text>
          <Text style={[styles.feature, { color: TEXT }]}>• Daily calorie log</Text>
          <Text style={[styles.feature, { color: TEXT }]}>• Smart adjustments</Text>
          <Text style={[styles.feature, { color: TEXT }]}>• Visual Motivation</Text>
        </View>

        <Text style={[styles.helper, { color: PLACEHOLDER }]}>
          Subscription auto-renews monthly. Cancel anytime in Apple ID settings.
        </Text>

        {/* Actions */}
        <View style={styles.actions}>
          <PrimaryCTA onPress={() => { grant(); goIn(); }} />

          {/* Links */}
          <LinkButton title="Restore Purchases" onPress={() => { grant(); goIn(); }} />
          <LinkButton title="Skip for Review (dev)" onPress={goIn} />

          {isEntitled ? (
            <Pressable
              onPress={revoke}
              style={({ pressed }) => [
                styles.cta,
                {
                  backgroundColor: "#ef4444",
                  transform: [{ translateY: pressed ? 1 : 0 }],
                },
              ]}
            >
              <Text style={styles.ctaText}>Revoke (dev)</Text>
            </Pressable>
          ) : null}
        </View>

        {/* Testing utilities card */}
        <View
          style={[
            styles.toolsCard,
            { borderColor: MUTED, backgroundColor: "#F9FAFB" },
          ]}
        >
          <Text style={{ color: PLACEHOLDER, fontSize: 14, marginBottom: 8 }}>
            Testing utilities
          </Text>
          <Pressable
            onPress={handleResetAll}
            style={({ pressed }) => [
              styles.cta,
              {
                backgroundColor: "#ef4444",
                transform: [{ translateY: pressed ? 1 : 0 }],
              },
            ]}
          >
            <Text style={styles.ctaText}>Reset all data (testing)</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const CARD_WIDTH = 280;

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 18,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: 0.2,
  },
  card: {
    width: CARD_WIDTH,
    borderRadius: 20,
    borderWidth: 2,
    paddingVertical: 14,
    paddingHorizontal: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowRadius: 16,
        shadowOpacity: 0.1,
      },
      android: { elevation: 4 },
    }),
    gap: 6,
  },
  feature: {
    fontSize: 16,
    fontWeight: "500",
  },
  helper: {
    fontSize: 13,
    textAlign: "center",
    marginTop: -2,
  },
  actions: {
    width: 260,
    gap: 12,
    marginTop: 4,
    alignItems: "center",
  },
  // Primary button
  cta: {
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 28,
    minWidth: 220,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.3,
    textAlign: "center",
  },
  // Stacked contents inside primary CTA
  ctaContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  ctaTitle: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  ctaPrice: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
    opacity: 0.95,
  },
  // Link buttons
  linkText: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  toolsCard: {
    marginTop: 10,
    borderRadius: 20,
    borderWidth: 2,
    padding: 16,
    width: CARD_WIDTH,
    alignItems: "stretch",
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowRadius: 16,
        shadowOpacity: 0.08,
      },
      android: { elevation: 3 },
    }),
  },
});
