// Name.tsx
import BackButton from "@/src/components/ui/BackButton";
import Button from "@/src/components/ui/Button";
import { useNavigation, useTheme } from "@react-navigation/native";
import React, { useMemo, useRef, useState } from "react";
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
import { useOnboardingTracker } from "../../hooks/useOnboardingTracker";
import { useProfileStore } from "../../state/profileStore";

export default function Name() {
  useOnboardingTracker("Name"); // Track this screen
  
  const nav = useNavigation<any>();
  const { colors } = useTheme();
  const { profile, setName } = useProfileStore();
  const [val, setVal] = useState(profile.name === "You" ? "" : profile.name || "");
  const [focused, setFocused] = useState(false);
  const [hasBlurred, setHasBlurred] = useState(false);

  const ACCENT = colors?.primary ?? "#16a34a";
  const TEXT = colors?.text ?? "#111827";
  const BG = colors?.background ?? "#FFFFFF";
  const MUTED = colors?.border ?? "#e5e7eb";
  const PLACEHOLDER = "#9ca3af";

  const inputRef = useRef<TextInput>(null);

  const trimmed = useMemo(() => val.trim(), [val]);
  const hasValue = trimmed.length > 0;
  const isValid = trimmed.length >= 2;

  // Only show hint after first blur, if there IS a value, and it's invalid
  const showNameHint = hasBlurred && hasValue && !isValid;

  const submit = () => {
    if (!isValid) return;
    setName(trimmed);
    Keyboard.dismiss();
    nav.navigate("GoalMode");
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: BG }]} edges={["top", "bottom"]}>
      <BackButton />
      {/* Tap anywhere outside to dismiss keyboard */}
      <Pressable style={styles.dismissArea} onPress={() => Keyboard.dismiss()}>
        <View style={styles.container}>
          <Text style={[styles.title, { color: TEXT }]}>What should we call you?</Text>

          <View
            style={[
              styles.inputCard,
              {
                borderColor: focused
                  ? ACCENT
                  : isValid && hasValue
                  ? ACCENT
                  : showNameHint
                  ? "#ef4444"
                  : MUTED,
                shadowOpacity: focused ? 0.2 : 0.1,
              },
            ]}
          >
            <TextInput
              ref={inputRef}
              value={val}
              onChangeText={setVal}
              onFocus={() => {
                setFocused(true);
                setHasBlurred(false);
              }}
              onBlur={() => {
                setFocused(false);
                setHasBlurred(true);
                Keyboard.dismiss();
              }}
              autoCapitalize="words"
              autoCorrect
              spellCheck={false}
              selectionColor={ACCENT}
              textAlign="center"
              placeholder="e.g John"
              placeholderTextColor={PLACEHOLDER}
              style={[styles.inputText, { color: TEXT }]}
              returnKeyType="done"
              onSubmitEditing={submit}
              blurOnSubmit
            />
          </View>

          {showNameHint ? (
            <Text style={[styles.helper, { color: "#ef4444" }]}>
              Please enter at least 2 characters.
            </Text>
          ) : null}

          {/* Secondary helper text under the field */}
          <Text style={[styles.suffix, { color: PLACEHOLDER }]}>
            You can change this later in Account.
          </Text>

          <Button
            title="Continue"
            onPress={submit}
            disabled={!isValid}
            accentColor={ACCENT}
            style={styles.cta}
          />

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
    minWidth: 220,
  },
});
