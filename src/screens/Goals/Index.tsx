import React, { useEffect, useMemo, useState } from "react";
import {
  Keyboard,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import Card from "../../components/ui/Card";
import SectionHeader from "../../components/ui/SectionHeader";
import { computeDailyTarget, kgToLb, lbToKg } from "../../lib/calorieMath";
import { useGoalStore } from "../../state/goalStore";
import { useProfileStore } from "../../state/profileStore";

export default function Goals() {
  const { profile, setActivity, setUnits, setStartingWeightKg } = useProfileStore();
  const { mode, goalWeightKg, targetDateISO, setMode, setGoalWeightKg, setTargetDateISO } = useGoalStore();

  const [goalW, setGoalW] = useState(
    goalWeightKg ? String(Math.round((profile.weightUnit === "kg" ? goalWeightKg : kgToLb(goalWeightKg)))) : ""
  );
  const [startW, setStartW] = useState(
    profile.startingWeightKg != null
      ? String(Math.round(profile.weightUnit === "kg" ? profile.startingWeightKg : kgToLb(profile.startingWeightKg)))
      : ""
  );
  const [hUnits, setHUnits] = useState(profile.heightUnit ?? "in");
  const [wUnits, setWUnits] = useState(profile.weightUnit ?? "lb");

  // Keep text fields in sync if user toggles units
  useEffect(() => {
    if (goalWeightKg != null) {
      setGoalW(String(Math.round(wUnits === "kg" ? goalWeightKg : kgToLb(goalWeightKg))));
    }
    if (profile.startingWeightKg != null) {
      setStartW(String(Math.round(wUnits === "kg" ? profile.startingWeightKg : kgToLb(profile.startingWeightKg))));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wUnits]);

  const { maintenance, target } = useMemo(
    () =>
      computeDailyTarget({
        sex: profile.gender,
        age: profile.age,
        heightCm: profile.height,
        currentWeightKg: profile.currentWeight,
        activity: profile.activityLevel,
        mode,
        goalWeightKg,
        targetDateISO,
      }),
    [profile, mode, goalWeightKg, targetDateISO]
  );

  return (
    <Pressable
      className="flex-1 bg-white dark:bg-[#0b0f14]"
      onPress={Keyboard.dismiss}
      // Ensure the pressable doesn't announce as a button for screen readers
      accessible={false}
    >
      <ScrollView
        className="flex-1 p-4"
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentInsetAdjustmentBehavior="automatic"
      >
        <SectionHeader title="Your Goal" />
        <Card>
          {/* Mode */}
          <Text className="mt-4 text-sm text-gray-600">Mode</Text>
          <View className="mt-2 flex-row gap-8">
            {(["lose", "maintain", "gain"] as const).map((m) => (
              <Text
                key={m}
                onPress={() => setMode(m)}
                className={`px-3 py-2 rounded-lg border ${mode === m ? "bg-black text-white" : "bg-white"}`}
              >
                {m}
              </Text>
            ))}
          </View>

          {/* Activity */}
          <Text className="mt-6 text-sm text-gray-600">Activity Level</Text>
          <View className="mt-2 flex-row flex-wrap gap-3">
            {(["sedentary", "light", "moderate", "high"] as const).map((a) => (
              <Text
                key={a}
                onPress={() => setActivity(a)}
                className={`px-3 py-2 rounded-lg border ${profile.activityLevel === a ? "bg-black text-white" : "bg-white"}`}
              >
                {a}
              </Text>
            ))}
          </View>

          {/* Units */}
          <Text className="mt-6 text-sm text-gray-600">Units</Text>
          <View className="mt-2 flex-row gap-6">
            <Text
              onPress={() => { setUnits("lb", hUnits as any); setWUnits("lb"); }}
              className={`px-3 py-2 rounded-lg border ${wUnits === "lb" ? "bg-black text-white" : "bg-white"}`}
            >
              Weight: lb
            </Text>
            <Text
              onPress={() => { setUnits("kg", hUnits as any); setWUnits("kg"); }}
              className={`px-3 py-2 rounded-lg border ${wUnits === "kg" ? "bg-black text-white" : "bg-white"}`}
            >
              Weight: kg
            </Text>
            <Text
              onPress={() => { setUnits(wUnits as any, "in"); setHUnits("in"); }}
              className={`px-3 py-2 rounded-lg border ${hUnits === "in" ? "bg-black text-white" : "bg-white"}`}
            >
              Height: in
            </Text>
            <Text
              onPress={() => { setUnits(wUnits as any, "cm"); setHUnits("cm"); }}
              className={`px-3 py-2 rounded-lg border ${hUnits === "cm" ? "bg-black text-white" : "bg-white"}`}
            >
              Height: cm
            </Text>
          </View>
        </Card>

        <Card>
          {/* Starting Weight */}
          <Text className="mt-6 text-sm text-gray-600">Starting Weight ({wUnits})</Text>
          <TextInput
            value={startW}
            onChangeText={(t) => {
              setStartW(t);
              const n = Number(t);
              if (!Number.isNaN(n)) setStartingWeightKg(wUnits === "lb" ? lbToKg(n) : n);
            }}
            placeholder={wUnits === "lb" ? "e.g. 200" : "e.g. 91"}
            keyboardType="numeric"
            className="mt-2 px-3 py-2 border rounded-lg"
            blurOnSubmit
            returnKeyType="done"
            onSubmitEditing={Keyboard.dismiss}
          />

          {/* Goal weight + date (when not maintain) */}
          {mode !== "maintain" && (
            <>
              <Text className="mt-6 text-sm text-gray-600">Goal Weight ({wUnits})</Text>
              <TextInput
                value={goalW}
                onChangeText={(t) => {
                  setGoalW(t);
                  const n = Number(t);
                  if (!Number.isNaN(n)) setGoalWeightKg(wUnits === "lb" ? lbToKg(n) : n);
                }}
                placeholder={wUnits === "lb" ? "e.g. 170" : "e.g. 77"}
                keyboardType="numeric"
                className="mt-2 px-3 py-2 border rounded-lg"
                blurOnSubmit
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
              />

              <Text className="mt-4 text-sm text-gray-600">Desired End Date (optional)</Text>
              <TextInput
                value={targetDateISO ?? ""}
                onChangeText={(s) => setTargetDateISO(s.trim() === "" ? undefined : s)}
                placeholder="YYYY-MM-DD"
                className="mt-2 px-3 py-2 border rounded-lg"
                blurOnSubmit
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
              />
            </>
          )}
        </Card>

        <Card>
          {/* Summary */}
          <View className="mt-6 p-4 rounded-xl border">
            <Text>
              Maintenance: <Text className="font-semibold">{maintenance} kcal</Text>
            </Text>
            <Text className="mt-1">
              Daily Target: <Text className="font-semibold">{target} kcal</Text>
            </Text>
          </View>
        </Card>
      </ScrollView>
    </Pressable>
  );
}
