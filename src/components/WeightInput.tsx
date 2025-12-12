import { useTheme } from "@react-navigation/native";
import React, { useMemo, useState } from "react";
import {
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import BackButton from "./ui/BackButton";

type Props = {
  title: string;
  placeholder?: string;
  suffix?: string;
  onConfirm: (n: number) => void;
  cta?: string;
  accentColor?: string;
  minWeight?: number;
  maxWeight?: number;
  showHelperText?: boolean;
  customValidation?: (value: number) => string | null; // Returns error message or null if valid
};

export default function CurrentWeight({
  title,
  placeholder,
  suffix,
  onConfirm,
  cta = "Continue",
  accentColor,
  minWeight,
  maxWeight,
  showHelperText = true,
  customValidation,
}: Props) {
  const { colors } = useTheme();
  const ACCENT = accentColor ?? colors?.primary ?? "#16a34a";
  const TEXT = colors?.text ?? "#111827";
  const BG = colors?.background ?? "#FFFFFF";
  const MUTED = colors?.border ?? "#e5e7eb";
  const PLACEHOLDER = "#9ca3af";

  const MIN = minWeight ?? 50;
  const MAX = maxWeight ?? 999;

  const [val, setVal] = useState("");
  const [focused, setFocused] = useState(false);
  const [hasBlurred, setHasBlurred] = useState(false);
  const [customError, setCustomError] = useState<string | null>(null);

  /**
   * Allow:
   * - up to 3 digits before the decimal
   * - optional '.' or ',' with up to 1 digit after
   * Examples: "150", "150.2"
   * While typing, allow a trailing '.' (e.g., "150.") so the user can add the decimal digit.
   */
  const handleChange = (t: string) => {
    // normalize comma to dot and strip invalid chars (digits or '.')
    let s = t.replace(",", ".").replace(/[^0-9.]/g, "");

    // keep only the first dot
    const dotIdx = s.indexOf(".");
    if (dotIdx !== -1) {
      s = s.slice(0, dotIdx + 1) + s.slice(dotIdx + 1).replace(/\./g, "");
    }

    // split parts
    let [int = "", dec = undefined] = s.split(".");

    // limit integer part to 3 digits
    int = int.slice(0, 3);

    // limit decimals to 1 digit if present
    if (typeof dec === "string") dec = dec.replace(/\D/g, "").slice(0, 1);

    // rebuild string; preserve a trailing '.' while typing
    let out = int;
    if (dotIdx !== -1) {
      out += ".";
      if (dec !== undefined) out += dec;
    }

    setVal(out);
  };

  const parsed = useMemo(() => {
    // Treat "" or just "." as NaN
    if (val.trim() === "" || val === ".") return NaN;
    // Allow "150." => parse as 150
    const n = Number(val.endsWith(".") ? val.slice(0, -1) : val);
    return Number.isFinite(n) ? n : NaN;
  }, [val]);

  const hasValue = val.trim().length > 0 && val !== ".";
  const inRange = hasValue && !Number.isNaN(parsed) && parsed >= MIN && parsed <= MAX;
  
  // Check custom validation when value changes
  React.useEffect(() => {
    if (hasValue && inRange && customValidation) {
      const error = customValidation(parsed);
      setCustomError(error);
    } else {
      setCustomError(null);
    }
  }, [parsed, hasValue, inRange, customValidation]);
  
  const isValid = inRange && !customError;

  const showRangeHint = showHelperText && hasBlurred && hasValue && !inRange;
  const showCustomError = showHelperText && hasBlurred && hasValue && inRange && customError;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: BG }]} edges={["top", "bottom"]}>
      <BackButton />
      {/* Tap anywhere outside to dismiss keyboard */}
      <Pressable style={styles.dismissArea} onPress={() => Keyboard.dismiss()}>
        <View style={styles.container}>
          <Text style={[styles.title, { color: TEXT }]}>{title}</Text>

          <View
            style={[
              styles.inputCard,
              {
                backgroundColor: colors?.card ?? "#F9FAFB",
                borderColor: focused
                  ? ACCENT
                  : inRange
                  ? ACCENT
                  : hasValue && !inRange
                  ? "#ef4444"
                  : MUTED,
                shadowOpacity: focused ? 0.2 : 0.1,
              },
            ]}
          >
            <TextInput
              value={val}
              onChangeText={handleChange}
              onFocus={() => {
                setFocused(true);
                setHasBlurred(false);
              }}
              onBlur={() => {
                setFocused(false);
                setHasBlurred(true);
                Keyboard.dismiss();
              }}
              // iOS decimal keypad; Android falls back to numeric ('.' still allowed by handler)
              keyboardType={Platform.OS === "ios" ? "decimal-pad" : "numeric"}
              inputMode="decimal"
              autoCorrect={false}
              autoCapitalize="none"
              spellCheck={false}
              selectionColor={ACCENT}
              textAlign="center"
              // 999.9 is 5 chars; allow one decimal while typing
              maxLength={5}
              placeholder={placeholder ?? `${MIN}-${MAX}`}
              placeholderTextColor={PLACEHOLDER}
              style={[styles.inputText, { color: TEXT }]}
              returnKeyType="done"
              onSubmitEditing={() => Keyboard.dismiss()}
              blurOnSubmit
            />
          </View>

          {suffix ? (
            <Text style={[styles.suffix, { color: PLACEHOLDER }]}>{suffix}</Text>
          ) : null}

          {showRangeHint ? (
            <Text style={[styles.helper, { color: "#ef4444" }]}>
              Enter {MIN}–{MAX} (one decimal allowed).
            </Text>
          ) : null}

          {showCustomError ? (
            <Text style={[styles.helper, { color: "#ef4444" }]}>
              {customError}
            </Text>
          ) : null}

          <Pressable
            disabled={!isValid}
            onPress={() => onConfirm(parsed)}
            style={({ pressed }) => [
              styles.cta,
              {
                backgroundColor: isValid ? ACCENT : MUTED,
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
      </Pressable>
    </SafeAreaView>
  );
}

const CARD_WIDTH = 280;

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  dismissArea: { flex: 1 },
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
