import { useNavigation } from "@react-navigation/native";
import React from "react";
import SingleChoice from "../../components/SingleChoice";
import { useGoalStore } from "../../state/goalStore";

export default function GoalMode() {
  const setMode = useGoalStore((s) => s.setMode);
  const nav = useNavigation<any>();
  return (
    <SingleChoice
      title="What is your goal?"
      options={[
        { label: "Lose Weight", value: "lose" },
        { label: "Gain Weight", value: "gain" },
        { label: "Maintain Weight", value: "maintain" },
      ]}
      onConfirm={(v) => {
        setMode(v as any);
        nav.navigate("ChooseGender");
      }}
    />
  );
}
