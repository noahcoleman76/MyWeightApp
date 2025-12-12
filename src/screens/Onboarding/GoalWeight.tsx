import CurrentWeight from "@/src/components/WeightInput";
import { useNavigation } from "@react-navigation/native";
import React, { useCallback } from "react";
import { useOnboardingTracker } from "../../hooks/useOnboardingTracker";
import { lbToKg } from "../../lib/units";
import { useGoalStore } from "../../state/goalStore";
import { useProfileStore } from "../../state/profileStore";

export default function GoalWeight() {
  useOnboardingTracker("GoalWeight");
  const setGoalWeightKg = useGoalStore((s) => s.setGoalWeightKg);
  const mode = useGoalStore((s) => s.mode);
  const startingWeightKg = useProfileStore((s) => s.profile.startingWeightKg);
  const nav = useNavigation<any>();

  // Convert starting weight from kg to lbs for comparison
  const startingWeightLb = startingWeightKg ? startingWeightKg / 0.45359237 : null;

  const validateGoalWeight = useCallback((goalWeightLb: number): string | null => {
    if (!startingWeightLb) return null; // Can't validate without starting weight

    const roundedStart = Math.round(startingWeightLb * 10) / 10;

    if (mode === "lose" && goalWeightLb >= startingWeightLb) {
      return `Goal weight must be less than starting weight (${roundedStart} lbs) for weight loss.`;
    }

    if (mode === "gain" && goalWeightLb <= startingWeightLb) {
      return `Goal weight must be more than starting weight (${roundedStart} lbs) for weight gain.`;
    }

    return null;
  }, [mode, startingWeightLb]);

  return (
    <CurrentWeight
      title="Goal weight"
      placeholder="Pounds"
      customValidation={validateGoalWeight}
      onConfirm={(lb) => {
        setGoalWeightKg(lbToKg(lb));
        nav.navigate("Activity");
      }}
    />
  );
}
