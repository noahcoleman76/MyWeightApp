import { useTheme } from "@react-navigation/native";
import React, { useMemo, useRef, useState } from "react";
import {
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import BackButton from "./ui/BackButton";

type Props = {
  title: string;
  suffix?: string;
  onConfirm: (totalInches: number) => void;
  cta?: string;
  accentColor?: string;
  showHelperText?: boolean;
  minFeet?: number;
  maxFeet?: number;
};

export default function HeightInput({
  title,
  suffix,
  onConfirm,
  cta = "Continue",
  accentColor,
  showHelperText = true,
  minFeet = 1,
  maxFeet = 8,
}: Props) {
  const { colors } = useTheme();
  const ACCENT = accentColor ?? colors?.primary ?? "#16a34a";
  const TEXT = colors?.text ?? "#111827";
  const BG = colors?.background ?? "#FFFFFF";
  const MUTED = colors?.border ?? "#e5e7eb";
  const PLACEHOLDER = "#9ca3af";

  const [feetStr, setFeetStr] = useState("");
  const [inchesStr, setInchesStr] = useState("");
  const [feetFocused, setFeetFocused] = useState(false);
  const [inchesFocused, setInchesFocused] = useState(false);

  const inchesRef = useRef<TextInput>(null);

  const handleFeetChange = (t: string) => {
    const d = t.replace(/\D/g, "").slice(0, 2);
    setFeetStr(d);
  };
  const handleInchesChange = (t: string) => {
    const d = t.replace(/\D/g, "").slice(0, 2);
    setInchesStr(d);
  };

  const feet = useMemo(() => {
    const n = Number(feetStr);
    return feetStr.trim() !== "" && Number.isFinite(n) ? n : NaN;
  }, [feetStr]);

  const inches = useMemo(() => {
    const n = Number(inchesStr);
    return inchesStr.trim() !== "" && Number.isFinite(n) ? n : NaN;
  }, [inchesStr]);

  const feetValid = !Number.isNaN(feet) && feet >= minFeet && feet <= maxFeet;
  const inchesValid = !Number.isNaN(inches) && inches >= 0 && inches < 12;

  const bothProvided = feetStr !== "" && inchesStr !== "";
  const isValid = bothProvided && feetValid && inchesValid;

  const totalInches = isValid ? feet * 12 + inches : NaN;

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <SafeAreaView style={[styles.safeArea, { backgroundColor: BG }]} edges={["top", "bottom"]}>
        <BackButton />
        <View style={styles.container}>
          <Text style={[styles.title, { color: TEXT }]}>{title}</Text>

          <View style={styles.row}>
            <View
              style={[
                styles.inputCard,
                {
                  backgroundColor: colors?.card ?? "#F9FAFB",
                  borderColor: feetFocused
                    ? ACCENT
                    : !bothProvided || feetValid || feetStr === ""
                    ? MUTED
                    : "#ef4444",
                  shadowOpacity: feetFocused ? 0.2 : 0.1,
                },
              ]}
            >
              <TextInput
                value={feetStr}
                onChangeText={handleFeetChange}
                onFocus={() => setFeetFocused(true)}
                onBlur={() => setFeetFocused(false)}
                keyboardType={Platform.OS === "ios" ? "number-pad" : "numeric"}
                autoCorrect={false}
                autoCapitalize="none"
                spellCheck={false}
                selectionColor={ACCENT}
                textAlign="center"
                maxLength={2}
                placeholder="ft"
                placeholderTextColor={PLACEHOLDER}
                style={[styles.inputText, { color: TEXT }]}
                returnKeyType="next"
                onSubmitEditing={() => inchesRef.current?.focus()}
              />
            </View>

            <Text style={[styles.mult, { color: PLACEHOLDER }]}>ft</Text>

            <View
              style={[
                styles.inputCard,
                {
                  backgroundColor: colors?.card ?? "#F9FAFB",
                  borderColor: inchesFocused
                    ? ACCENT
                    : !bothProvided || inchesValid || inchesStr === ""
                    ? MUTED
                    : "#ef4444",
                  shadowOpacity: inchesFocused ? 0.2 : 0.1,
                },
              ]}
            >
              <TextInput
                ref={inchesRef}
                value={inchesStr}
                onChangeText={handleInchesChange}
                onFocus={() => setInchesFocused(true)}
                onBlur={() => setInchesFocused(false)}
                keyboardType={Platform.OS === "ios" ? "number-pad" : "numeric"}
                autoCorrect={false}
                autoCapitalize="none"
                spellCheck={false}
                selectionColor={ACCENT}
                textAlign="center"
                maxLength={2}
                placeholder="in"
                placeholderTextColor={PLACEHOLDER}
                style={[styles.inputText, { color: TEXT }]}
                returnKeyType="done"
              />
            </View>

            <Text style={[styles.mult, { color: PLACEHOLDER }]}>in</Text>
          </View>

          {suffix ? (
            <Text style={[styles.suffix, { color: PLACEHOLDER }]}>{suffix}</Text>
          ) : null}

          {showHelperText && bothProvided && (!feetValid || !inchesValid) ? (
            <Text style={[styles.helper, { color: "#ef4444" }]}>
              {!feetValid && !inchesValid
                ? `Enter feet between ${minFeet}–${maxFeet} and inches between 0–11.`
                : !feetValid
                ? `Enter feet between ${minFeet}–${maxFeet}.`
                : `Enter inches between 0–11.`}
            </Text>
          ) : null}

          <Pressable
            disabled={!isValid}
            onPress={() => {
              Keyboard.dismiss();
              onConfirm(totalInches);
            }}
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
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

const CARD_WIDTH = 120;

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
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
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
    fontSize: 36,
    fontWeight: "800",
    paddingVertical: 8,
  },
  mult: {
    fontSize: 16,
    marginHorizontal: 4,
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
    minWidth: 240,
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
