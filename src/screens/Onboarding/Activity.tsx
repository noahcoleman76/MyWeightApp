import ActivityInput from "@/src/components/ActivityInput";
import { useProfileStore } from "@/src/state/profileStore";
import { useNavigation } from "@react-navigation/native";
import React from "react";
import { useOnboardingTracker } from "../../hooks/useOnboardingTracker";

export default function ActivityPage() {
  useOnboardingTracker("Activity");
  const setMode = useProfileStore((s) => s.setActivity);
  const nav = useNavigation<any>();
  return (
    <ActivityInput
      title="How would you describe your activity level?"
      options={[
        { label: "Sedentary", text: "little to no exercise", value: "sedentary" },
        { label: "Lightly Active", text: "exercise 1-3 times/week", value: "light" },
        { label: "Moderately Active", text: "exercise 3-5 times/week", value: "moderate" },
        { label: "Very Active", text: "intense exercise 4-6 times/week", value: "high" },

      ]}
      onConfirm={(v) => {
        setMode(v as any);
        nav.navigate("TargetDate");
      }}
    />
  );
}
