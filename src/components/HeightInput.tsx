import { useTheme } from "@react-navigation/native";
import React, { useMemo, useState } from "react";
import {
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Props = {
  title: string;
  placeholder?: string;
  suffix?: string;
  onConfirm: (n: number) => void;
  cta?: string;
  accentColor?: string;      // optional override; defaults to theme primary
  minYear?: number;          // optional; defaults to 1900
  maxYear?: number;          // optional; defaults to current year
  showHelperText?: boolean;  // optional helper error text; default true
};

export default function NumericInput({
  title,
  placeholder,
  suffix,
  onConfirm,
  cta = "Continue",
  accentColor,
  minYear,
  maxYear,
  showHelperText = true,
}: Props) {
  const { colors } = useTheme();
  const ACCENT = accentColor ?? colors?.primary ?? "#16a34a";
  const TEXT = colors?.text ?? "#111827";
  const BG = colors?.background ?? "#FFFFFF";
  const MUTED = colors?.border ?? "#e5e7eb";
  const PLACEHOLDER = "#9ca3af";

  const CURRENT_YEAR = new Date().getFullYear();
  const MIN = minYear ?? 1900;
  const MAX = maxYear ?? CURRENT_YEAR;

  const [val, setVal] = useState("");
  const [focused, setFocused] = useState(false);

  // Digits only, hard-limit to 4 chars (YYYY)
  const handleChange = (t: string) => {
    const digitsOnly = t.replace(/\D/g, "").slice(0, 4);
    setVal(digitsOnly);
  };

  const parsed = useMemo(() => {
    const n = Number(val);
    return Number.isFinite(n) && val.trim() !== "" ? n : NaN;
  }, [val]);

  const isFourDigits = val.length === 4;
  const inRange = isFourDigits && !Number.isNaN(parsed) && parsed >= MIN && parsed <= MAX;
  const isValid = isFourDigits && inRange;

  const showRangeHint = showHelperText && isFourDigits && !inRange;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: BG }]} edges={["top", "bottom"]}>
      <View style={styles.container}>
        <Text style={[styles.title, { color: TEXT }]}>{title}</Text>

        <View
          style={[
            styles.inputCard,
            {
              borderColor: focused ? ACCENT : isValid ? ACCENT : MUTED,
              shadowOpacity: focused ? 0.2 : 0.1,
            },
          ]}
        >
          <TextInput
            value={val}
            onChangeText={handleChange}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            keyboardType={Platform.OS === "ios" ? "number-pad" : "numeric"} // native keypad
            autoCorrect={false}
            autoCapitalize="none"
            spellCheck={false}
            blurOnSubmit={false} // don't treat "Done" like submit
            selectionColor={ACCENT}
            textAlign="center"
            maxLength={4}
            placeholder={placeholder}
            placeholderTextColor={PLACEHOLDER}
            style={[styles.inputText, { color: TEXT }]}
            // Intentionally omit inputMode/returnKeyType/onSubmitEditing to avoid the accessory bar behavior
          />
        </View>

        {suffix ? (
          <Text style={[styles.suffix, { color: PLACEHOLDER }]}>{suffix}</Text>
        ) : null}

        {showRangeHint ? (
          <Text style={[styles.helper, { color: "#ef4444" }]}>
            Enter a year between {MIN} and {MAX}.
          </Text>
        ) : null}

        <Pressable
          disabled={!isValid}
          onPress={() => onConfirm(parsed)}
          style={({ pressed }) => [
            styles.cta,
            {
              backgroundColor: isValid ? ACCENT : "#E5E7EB",
              transform: [{ translateY: pressed && isValid ? 1 : 0 }],
              opacity: isValid ? 1 : 0.7,
            },
          ]}
          accessibilityRole="button"
          accessibilityState={{ disabled: !isValid }}
        >
          <Text style={styles.ctaText}>{cta}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const CARD_WIDTH = 280;

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 18,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: 0.2,
  },
  inputCard: {
    width: CARD_WIDTH,
    borderRadius: 20,
    borderWidth: 2,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "#F9FAFB",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowRadius: 16,
      },
      android: { elevation: 4 },
    }),
  },
  inputText: {
    fontSize: 40,
    fontWeight: "800",
    paddingVertical: 8,
  },
  suffix: {
    fontSize: 14,
    textAlign: "center",
    marginTop: -6,
  },
  helper: {
    fontSize: 13,
    textAlign: "center",
    marginTop: -2,
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
