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
import { useAuthStore } from "../../state/authStore";
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
  const { isLoggedIn, isInitializing } = useAuthStore();
  const isEntitled   = useSubscriptionStore((s) => s.isEntitled);
  const profile      = useProfileStore((s) => s.profile);
  const mode         = useGoalStore((s) => s.mode);
  const goalWeightKg = useGoalStore((s) => s.goalWeightKg);
  const logsCount    = useLogStore((s) => s.logs.length);

  const complete = isOnboardingComplete({ profile, mode, goalWeightKg });

  useEffect(() => {
    console.log('🔄 Splash useEffect triggered:', {
      isLoggedIn,
      isInitializing,
      isEntitled,
      complete,
      logsCount
    });
    
    // Don't navigate until auth initialization is complete
    if (isInitializing) {
      console.log('⏳ Still initializing, waiting...');
      return;
    }

    // Function to handle navigation logic
    const handleNavigation = () => {
      console.log('🚀 Navigation decision time:', {
        isLoggedIn,
        isEntitled,
        complete
      });
      
      // RULES:
      // - If logged in and entitled -> Tabs
      // - If logged in and NOT entitled -> Paywall only if onboarding complete; else Marketing1 screen (start onboarding)
      // - If NOT logged in -> Login screen
      if (isLoggedIn && isEntitled) {
        console.log('✅ Navigating to Tabs (logged in + entitled)');
        nav.reset({ index: 0, routes: [{ name: "Tabs", params: { screen: "Dashboard" } }] });
      } else if (isLoggedIn && complete) {
        console.log('💰 Navigating to Paywall (logged in + onboarding complete)');
        nav.reset({ index: 0, routes: [{ name: "Paywall" }] });
      } else if (isLoggedIn && !complete) {
        // User is logged in but hasn't completed onboarding, start with Marketing1 screen
        console.log('📱 Navigating to Marketing1 (logged in but onboarding incomplete)');
        nav.reset({ index: 0, routes: [{ name: "Marketing1" }] });
      } else {
        // User is not logged in, go to login
        console.log('🔐 Navigating to Login (not logged in)');
        nav.reset({ index: 0, routes: [{ name: "Login" }] });
      }
    };
    
    // Initial app load - wait for splash screen
    const navigationState = nav.getState();
    const currentRoute = navigationState?.routes[navigationState?.index];
    console.log('📍 Current route:', currentRoute?.name);
    
    if (!currentRoute || currentRoute.name === 'Splash') {
      // On initial load, wait for splash screen
      console.log('⏱️ Initial load, waiting for splash timeout...');
      const t = setTimeout(handleNavigation, SPLASH_MS);
      return () => clearTimeout(t);
    } else {
      // Auth state changed while on other screens, navigate immediately
      console.log('⚡ Auth state changed, navigating immediately...');
      handleNavigation();
    }
  }, [isLoggedIn, isInitializing, isEntitled, complete, nav, logsCount]);

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
