import { useNavigation } from "@react-navigation/native";
import React from "react";
import NumericInput from "../../components/NumericInput";
import { useProfileStore } from "../../state/profileStore";

export default function BirthYear() {
  const setAgeFromBirthYear = useProfileStore((s) => s.setAgeFromBirthYear);
  const nav = useNavigation<any>();
  return (
    <NumericInput
      title="What year were you born?"
      placeholder="e.g. 1995"
      onConfirm={(year) => {
        setAgeFromBirthYear(Math.round(year));
        nav.navigate("GoalMode");
      }}
    />
  );
}
