import { useNavigation } from "@react-navigation/native";
import React from "react";
import NumericInput from "../../components/NumericInput";
import { lbToKg } from "../../lib/units";
import { useGoalStore } from "../../state/goalStore";
import { useProfileStore } from "../../state/profileStore";

export default function CurrentWeight() {
  const setCurrentWeightKg = useProfileStore((s) => s.setCurrentWeightKg);
  const nav = useNavigation<any>();
  const mode = useGoalStore((s) => s.mode);

  return (
    <NumericInput
      title="Current weight"
      placeholder="Pounds (e.g. 200)"
      onConfirm={(lb) => {
        setCurrentWeightKg(lbToKg(lb));
        if (mode === "maintain") nav.navigate("OnboardingHowItWorks");
        else nav.navigate("GoalWeight");
      }}
    />
  );
}
