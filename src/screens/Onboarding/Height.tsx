import { useNavigation } from "@react-navigation/native";
import React from "react";
import HeightInput from "../../components/HeightInput";
import { useOnboardingTracker } from "../../hooks/useOnboardingTracker";
import { inToCm } from "../../lib/units";
import { useProfileStore } from "../../state/profileStore";

export default function Height() {
  useOnboardingTracker("Height");
  const setHeightCm = useProfileStore((s) => s.setHeightCm);
  const nav = useNavigation<any>();

  return (
    <HeightInput
      title="What is your height?"
      suffix="You can change units later"
      onConfirm={(totalInches: number) => {
        setHeightCm(inToCm(totalInches));
        nav.navigate("CurrentWeight");
      }}
    />
  );
}
