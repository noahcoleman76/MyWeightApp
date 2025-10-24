import { useNavigation } from "@react-navigation/native";
import dayjs from "dayjs";
import React, { useMemo } from "react";
import { Text, View } from "react-native";
import { VictoryAxis, VictoryBar, VictoryChart, VictoryLine } from "victory-native";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import SectionHeader from "../../components/ui/SectionHeader";
import { computeDailyTarget, kgToLb } from "../../lib/calorieMath";
import { useGoalStore } from "../../state/goalStore";
import { useLogStore } from "../../state/logStore";
import { useProfileStore } from "../../state/profileStore";

export default function Dashboard() {
  const nav = useNavigation<any>();
  const { profile } = useProfileStore();
  const { mode, goalWeightKg, targetDateISO, dailyTargetOverride } = useGoalStore();
  const { logs, dailyTotals, streak } = useLogStore();

  // Most recent logged weight (if any), otherwise starting, otherwise profile.current
  const latestLogged = useMemo(() => {
    const withWt = logs.filter((l) => typeof l.weightKg === "number");
    if (!withWt.length) return undefined as number | undefined;
    withWt.sort((a, b) => (a.dateISO === b.dateISO ? (a.id < b.id ? 1 : -1) : a.dateISO < b.dateISO ? 1 : -1));
    return withWt[0]!.weightKg as number;
  }, [logs]);

  const latestLogDateISO = useMemo(() => {
    if (!logs.length) return undefined as string | undefined;
    const sorted = [...logs].sort((a, b) => (a.dateISO === b.dateISO ? (a.id < b.id ? 1 : -1) : a.dateISO < b.dateISO ? 1 : -1));
    return sorted[0].dateISO;
  }, [logs]);

  const currentWeightKg =
    latestLogged ??
    (profile.startingWeightKg != null ? profile.startingWeightKg : profile.currentWeight);

  // Maintenance + computed target (based on current profile/goal)
  const { maintenance, target: computedTarget } = useMemo(
    () =>
      computeDailyTarget({
        sex: profile.gender,
        age: profile.age,
        heightCm: profile.height,
        currentWeightKg,
        activity: profile.activityLevel,
        mode,
        goalWeightKg,
        targetDateISO,
      }),
    [profile, mode, goalWeightKg, targetDateISO, currentWeightKg]
  );

  // Manual override takes precedence if set
  const effectiveTarget = dailyTargetOverride ?? computedTarget;

  // 14-day bars (visual history only; no averages/suggestions)
  const days = [...Array(14)].map((_, i) => dayjs().subtract(13 - i, "day"));
  const chartData = days.map((d) => {
    const iso = d.format("YYYY-MM-DD");
    return { x: d.format("MM/DD"), y: dailyTotals(iso).calories || 0 };
  });

  const todayISO = dayjs().format("YYYY-MM-DD");
  const today = dailyTotals(todayISO);

  // Display helpers
  const currentWDisplay =
    profile.weightUnit === "kg"
      ? `${Math.round(currentWeightKg)} kg`
      : `${Math.round(kgToLb(currentWeightKg))} lb`;

  const goalWDisplay =
    goalWeightKg == null
      ? undefined
      : profile.weightUnit === "kg"
        ? `${Math.round(goalWeightKg)} kg`
        : `${Math.round(kgToLb(goalWeightKg))} lb`;

  // ----- Estimated completion (based on simple energy math) -----
  // If goal < current: need loss; deficit/day = maintenance - effectiveTarget (must be >0)
  // If goal > current: need gain;  surplus/day = effectiveTarget - maintenance (must be >0)
  // Days = (kg_to_change * 7700 kcal/kg) / (daily_kcal_change)
  const estimate = useMemo(() => {
    if (!goalWeightKg) return undefined as { date: string; days: number } | undefined;

    const baseDateISO = latestLogDateISO ?? todayISO;
    const kgToLose = currentWeightKg - goalWeightKg;   // positive if goal is lower (lose)
    const kgToGain = goalWeightKg - currentWeightKg;   // positive if goal is higher (gain)

    const deficitPerDay = maintenance - effectiveTarget;       // >0 means eating below maintenance
    const surplusPerDay = effectiveTarget - maintenance;       // >0 means eating above maintenance

    let daysNeeded: number | undefined;

    if (kgToLose > 0 && deficitPerDay > 0) {
      daysNeeded = (kgToLose * 7700) / deficitPerDay;
    } else if (kgToGain > 0 && surplusPerDay > 0) {
      daysNeeded = (kgToGain * 7700) / surplusPerDay;
    } else if (goalWeightKg === currentWeightKg) {
      daysNeeded = 0;
    } else {
      // Direction mismatch (e.g., trying to lose while on surplus) or zero delta → no estimate
      return undefined;
    }

    if (!isFinite(daysNeeded!)) return undefined;
    const rounded = Math.max(0, Math.ceil(daysNeeded!));
    const date = dayjs(baseDateISO).add(rounded, "day").format("YYYY-MM-DD");
    return { date, days: rounded };
  }, [goalWeightKg, currentWeightKg, maintenance, effectiveTarget, latestLogDateISO, todayISO]);

  return (
    <View className="flex-1 bg-white p-4">
      <SectionHeader title="Dashboard" subtitle={`Hello, ${profile.name}`} />
      <Text className="mt-1 text-gray-600">Hello, {profile.name}</Text>

      <Card>
        <View className="mt-4 p-4 rounded-xl border">
          <Text>Mode: <Text className="font-semibold">{mode}</Text></Text>
          <Text className="mt-1">Maintenance: <Text className="font-semibold">{maintenance} kcal</Text></Text>
          <Text className="mt-1">
            Daily Target: <Text className="font-semibold">{effectiveTarget} kcal</Text>
            {dailyTargetOverride != null ? <Text className="text-gray-500"> (manual)</Text> : null}
          </Text>
          <Text className="mt-1">
            Current: <Text className="font-semibold">{currentWDisplay}</Text>
            {latestLogged != null ? <Text className="text-gray-500"> (from log)</Text> : null}
          </Text>
          {profile.startingWeightKg != null ? (
            <Text className="mt-1">
              Starting: <Text className="font-semibold">
                {profile.weightUnit === "kg"
                  ? `${Math.round(profile.startingWeightKg)} kg`
                  : `${Math.round(kgToLb(profile.startingWeightKg))} lb`}
              </Text>
            </Text>
          ) : null}
          {goalWDisplay ? <Text className="mt-1">Goal: <Text className="font-semibold">{goalWDisplay}</Text></Text> : null}
          {targetDateISO ? <Text className="mt-1">Target Date: <Text className="font-semibold">{targetDateISO}</Text></Text> : null}
          <Text className="mt-1">Streak: <Text className="font-semibold">{streak()} days</Text></Text>

          {/* Estimated completion based on maintenance vs target and weight gap */}
          {estimate ? (
            <Text className="mt-1">
              Estimated completion: <Text className="font-semibold">{estimate.date}</Text>{" "}
              <Text className="text-gray-600">(≈ {estimate.days} days)</Text>
            </Text>
          ) : null}
        </View>
      </Card>

      <Card>
        <View className="mt-6">
          <VictoryChart domainPadding={{ x: 12, y: 10 }}>
            <VictoryAxis tickCount={4} style={{ tickLabels: { fontSize: 10 } }} />
            <VictoryAxis dependentAxis style={{ tickLabels: { fontSize: 10 } }} />
            <VictoryBar data={chartData} x="x" y="y" />
            <VictoryLine y={() => effectiveTarget} />
          </VictoryChart>
        </View>
      </Card>

      <View className="mt-6">
        <Button title="Add Log" onPress={() => nav.navigate("Log")} />
      </View>

      <Card>
        <View className="mt-3 p-3 rounded-lg bg-gray-100">
          <Text className="text-sm">
            Today: {today.calories || 0} kcal
            {typeof today.weightKg === "number"
              ? profile.weightUnit === "kg"
                ? ` • ${Math.round(today.weightKg)} kg`
                : ` • ${Math.round(kgToLb(today.weightKg))} lb`
              : ""}
          </Text>
        </View>
      </Card>
    </View>
  );
}
