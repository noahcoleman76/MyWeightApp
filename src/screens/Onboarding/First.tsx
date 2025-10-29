import { useNavigation, useTheme } from "@react-navigation/native";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function First() {
  const nav = useNavigation<any>();
  const { colors } = useTheme();

  // Match DateInput palette tokens
  const ACCENT = colors?.primary ?? "#16a34a";
  const TEXT = colors?.text ?? "#111827";
  const BG = colors?.background ?? "#FFFFFF";
  const SUBTLE = "#6b7280";

  const proceed = () => nav.navigate("Name");

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: BG }]}>
      <View style={styles.wrap}>
        {/* Title */}
        <Text style={[styles.title, { color: TEXT }]}>
          Let’s get some information from you to start your personalized plan
        </Text>

        {/* Helper blurb */}
        <Text style={[styles.blurb, { color: SUBTLE }]}>
          We’ll guide your daily targets and help you stay consistent.
        </Text>

        {/* Primary CTA — mirrors DateInput.cta */}
        <Pressable
          onPress={proceed}
          style={({ pressed }) => [
            styles.cta,
            { backgroundColor: ACCENT, opacity: pressed ? 0.9 : 1 },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Get Started"
        >
          <Text style={styles.ctaText}>Get Started</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  wrap: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    maxWidth: 360,
  },
  blurb: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 360,
  },
  cta: {
    marginTop: 16,
    width: 260,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
  },
});
