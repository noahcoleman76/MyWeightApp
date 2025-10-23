import { useNavigation } from "@react-navigation/native";
import React from "react";
import NumericInput from "../../components/NumericInput";
import { lbToKg } from "../../lib/units";
import { useGoalStore } from "../../state/goalStore";

export default function GoalWeight() {
  const setGoalWeightKg = useGoalStore((s) => s.setGoalWeightKg);
  const nav = useNavigation<any>();

  return (
    <NumericInput
      title="Goal weight"
      placeholder="Pounds (e.g. 170)"
      onConfirm={(lb) => {
        setGoalWeightKg(lbToKg(lb));
        nav.navigate("TargetDate");
      }}
    />
  );
}
