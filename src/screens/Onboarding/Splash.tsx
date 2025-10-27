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
import { useAuthStore } from "../../state/authStore";
import { useGoalStore } from "../../state/goalStore";
import { useLogStore } from "../../state/logStore";
import { useProfileStore } from "../../state/profileStore";

const SPLASH_MS = 4000; // 4 seconds splash screen

export default function Splash() {
  const nav = useNavigation<any>();
  const { isLoggedIn } = useAuthStore();
  const { profile } = useProfileStore();
  const { goalWeightKg } = useGoalStore();
  const { logs } = useLogStore();
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const { colors } = useTheme();

  const hasTouchedProfile =
    (profile.name && profile.name !== "You") ||
    (profile.motivation && profile.motivation.length > 0) ||
    (profile.concerns && profile.concerns.length > 0);

  const hasOnboardingData = Boolean(goalWeightKg || logs.length > 0 || hasTouchedProfile);

  useEffect(() => {
    const t = setTimeout(() => {
      if (isLoggedIn) {
        nav.reset({ index: 0, routes: [{ name: "Tabs", params: { screen: "Dashboard" } }] });
      } else if (hasOnboardingData) {
        nav.reset({ index: 0, routes: [{ name: "Paywall" }] });
      } else {
        nav.reset({ index: 0, routes: [{ name: "Marketing1" }] });
      }
    }, SPLASH_MS);
    return () => clearTimeout(t);
  }, [isLoggedIn, hasOnboardingData, nav]);

  const bg = { backgroundColor: colors.background };
  const textPrimary = { color: colors.text };
  const textSecondary = { color: isDark ? "#9CA3AF" : "#6B7280" }; // softer secondary
  const spinnerColor = colors.primary;

  const icon = require("../../../assets/images/icon.png");

  return (
    <SafeAreaView style={[styles.safeArea, bg]} edges={["top", "bottom"]}>
      {/* Centered content */}
      <View style={styles.centerBlock}>
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

const RADIUS = 32;
const LOGO_SIZE = 240;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingHorizontal: 24,
  },

  // Centered block (kept separate so footer can pin to bottom)
  centerBlock: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  // --- Logo + shadow ---
  logoShadow: {
    borderRadius: RADIUS + 6,
    // iOS shadow
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    // Android shadow
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
    backgroundColor: "#5eada8", // your accent
  },
  logo: {
    width: "100%",
    height: "100%",
  },

  // Typography (readable system faces)
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

  // Footer
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
