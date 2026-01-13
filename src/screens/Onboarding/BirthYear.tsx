import BackButton from "@/src/components/ui/BackButton";
import { useNavigation, useTheme } from "@react-navigation/native";
import React from "react";
import {
  Keyboard,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import NumericInput from "../../components/NumericInput";
import { useOnboardingTracker } from "../../hooks/useOnboardingTracker";
import { birthYearToAge } from "../../lib/units";
import { useProfileStore } from "../../state/profileStore";

export default function BirthYear() {
  useOnboardingTracker("BirthYear");
  const nav = useNavigation<any>();
  const { colors } = useTheme();
  const ACCENT = colors?.primary ?? "#16a34a";
  const setAgeFromBirthYear = useProfileStore((s) => s.setAgeFromBirthYear);

  const handleConfirm = (n: number) => {
    const y = Math.floor(n);
    const current = new Date().getFullYear();
    if (y >= 1900 && y <= current) {
      const calculatedAge = birthYearToAge(y);
      console.log('🎂 BirthYear: Setting age', { birthYear: y, calculatedAge, currentYear: current });
      setAgeFromBirthYear(y);
      nav.navigate("Height");
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={{ flex: 1 }}>
        <BackButton />
        <NumericInput
          title="What year were you born?"
          placeholder="1996"
          suffix="Year"
          onConfirm={handleConfirm}
          accentColor={ACCENT}
          cta="Continue"
        />
      </View>
    </TouchableWithoutFeedback>
  );
}
