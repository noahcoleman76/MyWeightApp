import { useNavigation, useTheme } from "@react-navigation/native";
import React, { useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useGoalStore } from "../../state/goalStore";
import { useProfileStore } from "../../state/profileStore";
import BackButton from "@/src/components/ui/BackButton";
import { useOnboardingTracker } from "../../hooks/useOnboardingTracker";

const BASE = [
  "not staying consistent",
  "overwhelming information",
  "fear of failure",
  "feeling discouraged",
  "didn't stick to diet before",
];

export default function Concerns() {
  useOnboardingTracker("Concerns"); // Track this screen
  const nav = useNavigation<any>();
  const { colors } = useTheme();
  const setConcerns = useProfileStore((s) => s.setConcerns);
  const mode = useGoalStore((s) => s.mode);
  const [sel, setSel] = useState<string[]>([]);

  // Match consistent palette tokens
  const ACCENT = colors?.primary ?? "#16a34a";
  const TEXT = colors?.text ?? "#111827";
  const BG = colors?.background ?? "#FFFFFF";
  const MUTED = colors?.border ?? "#e5e7eb";

  const toggle = (v: string) => setSel((arr) => (arr.includes(v) ? arr.filter((x) => x !== v) : arr.concat(v)));

  const isValid = sel.length > 0;

  const submit = () => {
    if (!isValid) return;
    setConcerns(sel);
    nav.navigate("Encouragement");
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: BG }]} edges={["top", "bottom"]}>
      <BackButton />
      <View style={styles.container}>
        <Text style={[styles.title, { color: TEXT }]}>
          Main concerns about {mode} weight?
        </Text>
        
        <View style={styles.optionsContainer}>
          {BASE.map((opt) => {
            const isSelected = sel.includes(opt);
            return (
              <Pressable
                key={opt}
                onPress={() => toggle(opt)}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                style={({ pressed }) => [
                  styles.option,
                  {
                    backgroundColor: isSelected ? ACCENT : "#F9FAFB",
                    borderColor: isSelected ? ACCENT : MUTED,
                    transform: [{ scale: pressed ? 0.98 : 1 }],
                    shadowOpacity: isSelected ? 0.25 : 0.12,
                  },
                ]}
              >
                <Text style={[
                  styles.optionText,
                  { color: isSelected ? "#FFFFFF" : TEXT }
                ]}>
                  {opt}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          disabled={!isValid}
          onPress={submit}
          style={({ pressed }) => [
            styles.cta,
            {
              backgroundColor: isValid ? ACCENT : "#E5E7EB",
              transform: [{ translateY: pressed && isValid ? 1 : 0 }],
              opacity: isValid ? 1 : 0.6,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Continue"
          accessibilityState={{ disabled: !isValid }}
        >
          <Text style={[styles.ctaText, { opacity: isValid ? 1 : 0.7 }]}>
            Continue
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { 
    flex: 1 
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 18,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  optionsContainer: {
    width: '100%',
    maxWidth: 360,
    gap: 12,
  },
  option: {
    width: '100%',
    alignSelf: 'center',
    borderRadius: 20,
    borderWidth: 2,
    paddingVertical: 16,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowRadius: 16,
      },
      android: { elevation: 6 },
    }),
  },
  optionText: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    textTransform: 'capitalize',
    letterSpacing: 0.2,
    lineHeight: 22,
  },
  cta: {
    marginTop: 8,
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
  },
});
