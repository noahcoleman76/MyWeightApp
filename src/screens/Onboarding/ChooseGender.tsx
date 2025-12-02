import { useNavigation, useTheme } from "@react-navigation/native";
import React from "react";
import SingleChoice from "../../components/SingleChoice";
import { useProfileStore } from "../../state/profileStore";
import { useOnboardingTracker } from "../../hooks/useOnboardingTracker";

export default function ChooseGender() {
  useOnboardingTracker("ChooseGender"); // Track this screen
  const setGender = useProfileStore((s) => s.setGender);
  const nav = useNavigation<any>();
  const { colors } = useTheme();
  const ACCENT = colors?.primary ?? "#16a34a";

  return (
    <SingleChoice
      title="Choose your gender"
      options={[
        { label: "Male", value: "male" },
        { label: "Female", value: "female" },
      ]}
      accentColor={ACCENT}
      onConfirm={(v) => {
        setGender(v as "male" | "female");
        nav.navigate("BirthYear");
      }}
    />
  );
}
