// replace the above with:
import { useNavigation } from "@react-navigation/native";
import React from "react";
import SingleChoice from "../../components/SingleChoice";
import { useProfileStore } from "../../state/profileStore";

export default function ChooseGender() {
  const setGender = useProfileStore((s) => s.setGender);
  const nav = useNavigation<any>();
  return (
    <SingleChoice
      title="Choose your gender"
      options={[
        { label: "Male", value: "male" },
        { label: "Female", value: "female" },
      ]}
      onConfirm={(v) => {
        setGender(v as "male" | "female");
        nav.navigate("BirthYear");
      }}
    />
  );
}
