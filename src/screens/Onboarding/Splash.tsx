import { useNavigation, useTheme } from "@react-navigation/native";
import React, { useEffect } from "react";
import {
  ActivityIndicator,
  Image,
  Platform,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { isOnboardingComplete } from "../../lib/onboarding";
import { useAppStore } from "../../state/appStore";
import { useGoalStore } from "../../state/goalStore";
import { useLogStore } from "../../state/logStore";
import { useProfileStore } from "../../state/profileStore";
import { useSubscriptionStore } from "../../state/subscriptionStore";

const SPLASH_MS = 3000;
const RADIUS = 32;
const LOGO_SIZE = 240;

export default function Splash() {
  const nav = useNavigation<any>();
  const { colors } = useTheme();
  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  // Stores
  const isLoggedIn   = useAppStore((s) => s.isLoggedIn);
  const isEntitled   = useSubscriptionStore((s) => s.isEntitled);
  const profile      = useProfileStore((s) => s.profile);
  const mode         = useGoalStore((s) => s.mode);
  const goalWeightKg = useGoalStore((s) => s.goalWeightKg);
  const logsCount    = useLogStore((s) => s.logs.length);

  const complete = isOnboardingComplete({ profile, mode, goalWeightKg });

  useEffect(() => {
    const t = setTimeout(() => {
      // RULES:
      // - If logged in and entitled -> Tabs
      // - If logged in and NOT entitled -> Paywall only if onboarding complete; else Marketing1
      // - If NOT logged in -> Paywall only if onboarding complete; else Marketing1
      if (isLoggedIn && isEntitled) {
        nav.reset({ index: 0, routes: [{ name: "Tabs", params: { screen: "Dashboard" } }] });
      } else if (complete) {
        nav.reset({ index: 0, routes: [{ name: "Paywall" }] });
      } else {
        nav.reset({ index: 0, routes: [{ name: "Marketing1" }] });
      }
    }, SPLASH_MS);
    return () => clearTimeout(t);
  }, [isLoggedIn, isEntitled, complete, nav, logsCount]);

  // Theming
  const bg = { backgroundColor: colors.background };
  const textPrimary = { color: colors.text };
  const textSecondary = { color: isDark ? "#9CA3AF" : "#6B7280" };
  const spinnerColor = colors.primary;

  const icon = require("../../../assets/images/icon.png");

  return (
    <SafeAreaView style={[styles.safeArea, bg]} edges={["top", "bottom"]}>
      {/* Centered block */}
      <View style={styles.centerBlock}>
        {/* Shadow wrapper */}
        <View style={[styles.logoShadow, isDark && styles.logoShadowDark]}>
          <View style={styles.logoClip}>
            <Image
              source={icon}
              style={styles.logo}
              resizeMode="cover"
              accessibilityLabel="My Weight app icon"
            />
          </View>
        </View>

        <Text style={[styles.title, textPrimary]}>My Weight</Text>

        <Text style={[styles.tagline, textSecondary]}>
          Your path to a healthier life
        </Text>

        <ActivityIndicator style={styles.spinner} color={spinnerColor} />
      </View>

      {/* Footer pinned to bottom */}
      <View style={styles.footer}>
        <Text style={[styles.footerText, textSecondary]}>
          My Weight — Easy Tracking Now
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingHorizontal: 24,
  },
  centerBlock: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  // --- Logo + shadow ---
  logoShadow: {
    borderRadius: RADIUS + 6,
    // iOS shadow:
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    // Android shadow:
    elevation: 10,
    backgroundColor: "transparent",
    marginBottom: 20,
  },
  logoShadowDark: {
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    ...Platform.select({
      android: { backgroundColor: "rgba(0,0,0,0.15)", elevation: 12 },
    }),
  },
  logoClip: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    borderRadius: RADIUS,
    overflow: "hidden",
    backgroundColor: "#5eada8", // accent
  },
  logo: {
    width: "100%",
    height: "100%",
  },

  // --- Typography (readable system faces) ---
  title: {
    fontFamily: Platform.select({
      ios: "System",
      android: "sans-serif-medium",
      default: undefined,
    }),
    fontSize: 48,
    fontWeight: Platform.OS === "android" ? "700" : "800",
    letterSpacing: 0.2,
    lineHeight: 56,
    marginTop: 2,
    textAlign: "center",
  },
  tagline: {
    fontFamily: Platform.select({
      ios: "System",
      android: "sans-serif",
      default: undefined,
    }),
    marginTop: 12,
    maxWidth: 360,
    textAlign: "center",
    fontSize: 24,
    lineHeight: 28,
    fontWeight: "400",
  },
  spinner: { marginTop: 22 },

  // --- Footer ---
  footer: {
    alignItems: "center",
    paddingVertical: 12,
  },
  footerText: {
    fontFamily: Platform.select({
      ios: "System",
      android: "sans-serif",
      default: undefined,
    }),
    fontSize: 14,
    letterSpacing: 0.3,
  },
});
