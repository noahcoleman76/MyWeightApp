import { useNavigation } from "@react-navigation/native";
import React from "react";
import NumericInput from "../../components/NumericInput";
import { inToCm } from "../../lib/units";
import { useProfileStore } from "../../state/profileStore";

export default function Height() {
  const setHeightCm = useProfileStore((s) => s.setHeightCm);
  const nav = useNavigation<any>();
  return (
    <NumericInput
      title="What is your height?"
      placeholder="Inches (e.g. 70)"
      suffix="You can change units later"
      onConfirm={(inches: number) => {
        setHeightCm(inToCm(inches));
        nav.navigate("CurrentWeight");
      }}
    />
  );
}
