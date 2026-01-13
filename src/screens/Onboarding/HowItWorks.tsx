import BackButton from "@/src/components/ui/BackButton";
import { useTheme } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useOnboardingTracker } from "../../hooks/useOnboardingTracker";
import { RootStackParamList } from "../../navigation/RootNavigator";

type Props = NativeStackScreenProps<RootStackParamList, "OnboardingHowItWorks">;

const BULLETS = [
  "Set your goals — we handle the math",
  "Get a personalized calorie plan that adapts with you",
  "Track your daily progress in seconds",
  "See your results update instantly on your dashboard",
  "Stay motivated with simple visuals and milestones",
];

export default function HowItWorks({ navigation }: Props) {
  useOnboardingTracker("OnboardingHowItWorks");
  const { colors } = useTheme();

  const ACCENT = colors?.primary ?? "#16a34a";
  const TEXT = colors?.text ?? "#111827";
  const BG = colors?.background ?? "#FFFFFF";
  const SUBTLE = colors?.text ? `${colors.text}99` : "#6b7280";

  const onNext = () => navigation.navigate("Encouragement");
  const onLearnMore = () => navigation.navigate("OnboardingLearnMore");

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: BG }]}>
      <BackButton />
      <ScrollView
        contentContainerStyle={[styles.wrap]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: TEXT }]}>This is just the beginning</Text>

        <Text style={[styles.blurb, { color: SUBTLE }]}>
          MyWeight helps you turn your goals into visible
          progress. How it works:
        </Text>

        <View style={styles.inputBlock}>
          {BULLETS.map((line, idx) => (
            <View key={idx} style={styles.bulletRow}>
              <Text style={styles.bulletDot}>•</Text>
              <Text style={[styles.bulletText, { color: TEXT }]}>{line}</Text>
            </View>
          ))}
        </View>

        <Text style={[styles.title, { color: TEXT }]}>
          Turn one day into today.
        </Text>

        <Pressable
          onPress={onNext}
          style={({ pressed }) => [
            styles.cta,
            {
              backgroundColor: ACCENT,
              borderColor: ACCENT,
              opacity: pressed ? 0.9 : 1,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Next"
        >
          <Text style={styles.ctaText}>Get Started</Text>
        </Pressable>

        <Pressable onPress={onLearnMore} style={styles.secondary}>
          <Text style={[styles.secondaryText, { color: SUBTLE }]}>Learn more</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  wrap: {
    flexGrow: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
    paddingBottom: 24,
    paddingTop: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
  },
  blurb: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 360,
  },
  inputBlock: {
    width: 280,
    marginTop: 8,
    alignItems: "stretch",
    gap: 12,
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  bulletDot: {
    fontSize: 18,
    lineHeight: 22,
    marginTop: 1,
    width: 16,
    textAlign: "center",
  },
  bulletText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
  },
  tagline: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 4,
    maxWidth: 360,
  },
  cta: {
    marginTop: 16,
    width: 260,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 0,
  },
  ctaText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
    textTransform: "none",
  },
  secondary: {
    marginTop: 8,
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
