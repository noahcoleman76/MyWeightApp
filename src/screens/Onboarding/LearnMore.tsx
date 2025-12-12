import { useTheme } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { RootStackParamList } from "../../navigation/RootNavigator";
import BackButton from "@/src/components/ui/BackButton";

type Props = NativeStackScreenProps<RootStackParamList, "OnboardingLearnMore">;

export default function LearnMore({ navigation }: Props) {
  const { colors } = useTheme();

  // Match HowItWorks palette tokens
  const ACCENT = colors?.primary ?? "#16a34a";
  const TEXT = colors?.text ?? "#111827";
  const BG = colors?.background ?? "#FFFFFF";
  const SUBTLE = colors?.text ? `${colors.text}99` : "#6b7280";

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <BackButton />
      <View style={styles.container}>
        <Text style={[styles.title, { color: TEXT }]}>Learn More</Text>
        <Text style={[styles.description, { color: SUBTLE }]}>
          Local-first storage, fast charts, and a distraction-free experience.
        </Text>
        <Pressable
          onPress={() => navigation.navigate("Motivation")}
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
          <Text style={styles.ctaText}>Next</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  description: {
    marginTop: 12,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 360,
  },
  cta: {
    marginTop: 24,
    width: 260,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0,
  },
  ctaText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
    textTransform: 'none',
  },
});
