import { useNavigation } from "@react-navigation/native";
import React from "react";
import DateInput from "../../components/DateInput";
import { useOnboardingTracker } from "../../hooks/useOnboardingTracker";
import { useGoalStore } from "../../state/goalStore";

export default function TargetDate() {
  useOnboardingTracker("TargetDate");
  
  const setTargetDateISO = useGoalStore((s) => s.setTargetDateISO);
  const nav = useNavigation<any>();

  return (
    <DateInput
      title="Desired end date?"
      optional
      onConfirm={(iso) => {
        setTargetDateISO(iso);
        nav.navigate("OnboardingHowItWorks");
      }}
    />
  );
}
