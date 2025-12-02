import CurrentWeight from "@/src/components/WeightInput";
import { useNavigation } from "@react-navigation/native";
import React from "react";
import { useOnboardingTracker } from "../../hooks/useOnboardingTracker";
import { lbToKg } from "../../lib/units";
import { useGoalStore } from "../../state/goalStore";

export default function GoalWeight() {
  useOnboardingTracker("GoalWeight");
  const setGoalWeightKg = useGoalStore((s) => s.setGoalWeightKg);
  const nav = useNavigation<any>();

  return (
    <CurrentWeight
      title="Goal weight"
      placeholder="Pounds"
      onConfirm={(lb) => {
        setGoalWeightKg(lbToKg(lb));
        nav.navigate("Activity");
      }}
    />
  );
}
