import BackButton from "@/src/components/ui/BackButton";
import { useTheme } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useOnboardingTracker } from "../../hooks/useOnboardingTracker";
import { UserDataService } from "../../lib/userDataService";
import { RootStackParamList } from "../../navigation/RootNavigator";
import { useAuthStore } from "../../state/authStore";

type Props = NativeStackScreenProps<RootStackParamList, "Encouragement">;

export default function Encouragement({ navigation }: Props) {
  useOnboardingTracker("Encouragement");

  const { colors } = useTheme();
  const { user } = useAuthStore();
  const [isUploading, setIsUploading] = useState(false);

  const ACCENT = colors?.primary ?? "#16a34a";
  const TEXT = colors?.text ?? "#111827";
  const BG = colors?.background ?? "#FFFFFF";
  const MUTED = colors?.border ?? "#e5e7eb";
  const SUBTLE = colors?.text ? `${colors.text}99` : "#6b7280";

  const onNext = async () => {
    if (!user || isUploading) return;

    try {
      setIsUploading(true);
      await UserDataService.uploadUserDataToFirestore(user.uid);

      navigation.navigate("Paywall");
    } catch (error) {
      console.error('❌ Failed to upload user data:', error);
      navigation.navigate("Paywall");
    } finally {
      setIsUploading(false);
    }
  };

  const onLearnMore = () => navigation.navigate("OnboardingLearnMore");

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: BG }]}>
      <BackButton />
      <ScrollView
        contentContainerStyle={[styles.wrap]}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <Text style={[styles.title, { color: TEXT }]}>You have great potential to crush your goal.</Text>

        <Text style={[styles.blurb, { color: SUBTLE }]}>
          We’ll guide your daily targets and help you stay consistent.
        </Text>

        <Pressable
          onPress={onNext}
          disabled={isUploading}
          style={({ pressed }) => [
            styles.cta,
            {
              backgroundColor: isUploading ? MUTED : ACCENT,
              borderColor: isUploading ? MUTED : ACCENT,
              opacity: pressed && !isUploading ? 0.9 : 1,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Next"
        >
          <Text style={styles.ctaText}>
            {isUploading ? "Saving..." : "Let's do this"}
          </Text>
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