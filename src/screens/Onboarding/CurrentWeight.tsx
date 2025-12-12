// app/screens/Onboarding/CurrentWeight.tsx
import { useNavigation } from "@react-navigation/native";
import dayjs from "dayjs";
import React from "react";
import CurrentWeightInput from "../../components/WeightInput";
import { useOnboardingTracker } from "../../hooks/useOnboardingTracker";
import { getItem, setItem } from "../../lib/mmkv";
import { lbToKg } from "../../lib/units";
import { useGoalStore } from "../../state/goalStore";
import { useProfileStore } from "../../state/profileStore";

const START_DAY_KEY = "start_day_iso"; // YYYY-MM-DD

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
        
        // 1) Save both starting and current weight
        setStartingWeightKg(weightKg);
        setCurrentWeightKg(weightKg);

        // 2) Persist start day ONCE (first time they set starting weight)
        const existing = getItem(START_DAY_KEY);
        const todayISO = dayjs().format("YYYY-MM-DD");
        const isValidISO = typeof existing === "string" && /^\d{4}-\d{2}-\d{2}$/.test(existing);
        if (!isValidISO) setItem(START_DAY_KEY, todayISO);

        // 3) Continue onboarding
        if (mode === "maintain") nav.navigate("OnboardingHowItWorks");
        else nav.navigate("GoalWeight");
      }}
    />
  );
}
