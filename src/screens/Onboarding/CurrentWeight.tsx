import { useNavigation } from "@react-navigation/native";
import dayjs from "dayjs";
import React from "react";
import CurrentWeightInput from "../../components/WeightInput";
import { useOnboardingTracker } from "../../hooks/useOnboardingTracker";
import { getItem, setItem } from "../../lib/mmkv";
import { lbToKg } from "../../lib/units";
import { useGoalStore } from "../../state/goalStore";
import { useProfileStore } from "../../state/profileStore";

const START_DAY_KEY = "start_day_iso";

export default function CurrentWeight() {
  useOnboardingTracker("CurrentWeight");
  const setStartingWeightKg = useProfileStore((s) => s.setStartingWeightKg);
  const setCurrentWeightKg = useProfileStore((s) => s.setCurrentWeightKg);
  const nav = useNavigation<any>();
  const mode = useGoalStore((s) => s.mode);

  return (
    <CurrentWeightInput
      title="Current weight"
      placeholder="Pounds"
      onConfirm={(lb) => {
        const weightKg = lbToKg(lb);
        console.log('⚖️ CurrentWeight: Converting and storing', { 
          inputLbs: lb, 
          convertedKg: weightKg,
          formula: `${lb} * 0.45359237 = ${weightKg}`
        });
        
        setStartingWeightKg(weightKg);
        setCurrentWeightKg(weightKg);

        const existing = getItem(START_DAY_KEY);
        const todayISO = dayjs().format("YYYY-MM-DD");
        const isValidISO = typeof existing === "string" && /^\d{4}-\d{2}-\d{2}$/.test(existing);
        if (!isValidISO) setItem(START_DAY_KEY, todayISO);

        if (mode === "maintain") nav.navigate("OnboardingHowItWorks");
        else nav.navigate("GoalWeight");
      }}
    />
  );
}
