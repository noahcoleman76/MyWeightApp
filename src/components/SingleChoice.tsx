import { useTheme } from "@react-navigation/native";
import React, { useState } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import BackButton from "./ui/BackButton";

type Option = { label: string; value: string };

type Props = {
  title: string;
  options: Option[];
  onConfirm: (value: string) => void;
  accentColor?: string;
  confirmLabel?: string;
};

export default function SingleChoice({
  title,
  options,
  onConfirm,
  accentColor,
  confirmLabel = "Continue",
}: Props) {
  const { colors } = useTheme();
  const ACCENT = accentColor ?? colors?.primary ?? "#16a34a";
  const TEXT = colors?.text ?? "#111827";
  const BG = colors?.background ?? "#FFFFFF";
  const MUTED = colors?.border ?? "#e5e7eb";

  const [selected, setSelected] = useState<string | null>(null);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: BG }]}>
      <BackButton />
      <View style={styles.container}>
        <Text style={[styles.title, { color: TEXT }]}>{title}</Text>

        <View style={styles.row}>
          {options.map((opt) => {
            const isSelected = selected === opt.value;
            return (
              <Pressable
                key={opt.value}
                onPress={() => setSelected(opt.value)}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                style={({ pressed }) => [
                  styles.card,
                  {
                    backgroundColor: isSelected ? ACCENT : (colors?.card ?? "#F9FAFB"),
                    borderColor: isSelected ? ACCENT : MUTED,
                    transform: [{ scale: pressed ? 0.98 : 1 }],
                    shadowOpacity: isSelected ? 0.25 : 0.12,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.cardLabel,
                    { color: isSelected ? "#FFFFFF" : TEXT },
                  ]}
                >
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          disabled={!selected}
          onPress={() => selected && onConfirm(selected)}
          style={({ pressed }) => [
            styles.cta,
            {
              backgroundColor: selected ? ACCENT : MUTED,
              transform: [{ translateY: pressed ? 1 : 0 }],
              opacity: selected ? 1 : 0.6,
            },
          ]}
        >
          <Text style={styles.ctaText}>{confirmLabel}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const CARD_SIDE = 148;

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 28,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: 0.2,
  },
  row: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    flexWrap: "wrap",
  },
  card: {
    width: CARD_SIDE * 1.1,
    height: CARD_SIDE * 1.1,
    borderRadius: 20,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowRadius: 16,
      },
      android: { elevation: 6 },
    }),
  },
  cardLabel: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
  },
  cta: {
    marginTop: 8,
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
  },
});
