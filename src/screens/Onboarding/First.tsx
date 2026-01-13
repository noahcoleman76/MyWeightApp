import BackButton from "@/src/components/ui/BackButton";
import Button from "@/src/components/ui/Button";
import { useNavigation, useTheme } from "@react-navigation/native";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function First() {
  const nav = useNavigation<any>();
  const { colors } = useTheme();
  const ACCENT = colors?.primary ?? "#16a34a";
  const TEXT = colors?.text ?? "#111827";
  const BG = colors?.background ?? "#FFFFFF";
  const SUBTLE = colors?.text ? `${colors.text}99` : "#6b7280";

  const proceed = () => nav.navigate("Login");

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: BG }]}>
      <BackButton />
      <View style={styles.wrap}>
        <Text style={[styles.title, { color: TEXT }]}>
          Let’s get some information from you to start your personalized plan
        </Text>

        <Text style={[styles.blurb, { color: SUBTLE }]}>
          We&apos;ll guide your daily targets and help you stay consistent.
        </Text>

        <Button
          title="Get Started"
          onPress={proceed}
          variant="primary"
          accentColor={ACCENT}
          style={styles.cta}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1
  },
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
