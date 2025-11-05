import { useAppStore } from "@/src/state/appStore";
import { useSubscriptionStore } from "@/src/state/subscriptionStore";
import { useNavigation, useTheme } from "@react-navigation/native";
import dayjs from "dayjs";
import React, { useMemo } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  VictoryArea,
  VictoryAxis,
  VictoryChart,
  VictoryLine,
  VictoryScatter,
} from "victory-native";
import { computeDailyTarget, kgToLb } from "../../lib/calorieMath";
import { useGoalStore } from "../../state/goalStore";
import { useLogStore } from "../../state/logStore";
import { useProfileStore } from "../../state/profileStore";

const toLb = (kg: number) => Math.round(kgToLb(kg) * 10) / 10;

export default function Dashboard() {
  const nav = useNavigation<any>();
  const { colors } = useTheme();
  const { profile } = useProfileStore();
  const { goalWeightKg, targetDateISO, dailyTargetOverride, mode } = useGoalStore();
  const { logs, dailyTotals, streak } = useLogStore();

  const ACCENT = colors?.primary ?? "#5eada8";
  const TEXT = colors?.text ?? "#0f172a";
  const BG = colors?.background ?? "#f7f7f7";
  const CARD_BG = "#ffffff";
  const BORDER = "#eef2f7";

  // ---- latest weight + latest log date
  const latestLogged = useMemo(() => {
    const withWt = logs.filter((l) => typeof l.weightKg === "number");
    if (!withWt.length) return { kg: undefined as number | undefined, iso: undefined as string | undefined };
    withWt.sort((a, b) =>
      a.dateISO === b.dateISO ? (a.id < b.id ? 1 : -1) : a.dateISO < b.dateISO ? 1 : -1
    );
    return { kg: withWt[0]!.weightKg as number, iso: withWt[0]!.dateISO as string };
  }, [logs]);

  const currentWeightKg =
    (latestLogged.kg != null ? latestLogged.kg : undefined) ??
    (profile.startingWeightKg ?? profile.currentWeightKg);

  // ---- calories + maintenance (needed for estimate)
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
  const effectiveTarget = dailyTargetOverride ?? computedTarget;

  // ---- estimate days to goal (hide in maintain)
  const isMaintain = mode === "maintain";
  const estimate = useMemo(() => {
    if (isMaintain || !goalWeightKg) return undefined as { date: string; days: number } | undefined;

    const baseDateISO = latestLogged.iso ?? dayjs().format("YYYY-MM-DD");
    const kgToLose = currentWeightKg - goalWeightKg;
    const kgToGain = goalWeightKg - currentWeightKg;

    const deficitPerDay = maintenance - effectiveTarget;
    const surplusPerDay = effectiveTarget - maintenance;

    let daysNeeded: number | undefined;
    if (kgToLose > 0 && deficitPerDay > 0) {
      daysNeeded = (kgToLose * 7700) / deficitPerDay;
    } else if (kgToGain > 0 && surplusPerDay > 0) {
      daysNeeded = (kgToGain * 7700) / surplusPerDay;
    } else if (goalWeightKg === currentWeightKg) {
      daysNeeded = 0;
    } else {
      return undefined;
    }

    if (!isFinite(daysNeeded!)) return undefined;
    const rounded = Math.max(0, Math.ceil(daysNeeded!));
    const date = dayjs(baseDateISO).add(rounded, "day").format("MMM D, YYYY");
    return { date, days: rounded };
  }, [isMaintain, goalWeightKg, currentWeightKg, maintenance, effectiveTarget, latestLogged.iso]);

  // ---- weights used in tiles
  const startingWDisplay =
    profile.startingWeightKg != null
      ? (profile.weightUnit === "kg"
        ? `${Math.round(profile.startingWeightKg)} kg`
        : `${Math.round(kgToLb(profile.startingWeightKg))} lb`)
      : "—";

  const currentWDisplay =
    profile.weightUnit === "kg" ? `${Math.round(currentWeightKg)} kg` : `${toLb(currentWeightKg)} lb`;

  const lbsLeft =
    !isMaintain && goalWeightKg != null
      ? Math.max(0, Math.round(Math.abs(toLb(currentWeightKg - goalWeightKg))))
      : undefined;

  const hasStart = profile.startingWeightKg != null;
  const deltaFromStartLb = hasStart ? Math.round(toLb(currentWeightKg - (profile.startingWeightKg as number))) : undefined;
  const lostOrGainedLabel =
    deltaFromStartLb != null
      ? deltaFromStartLb < 0
        ? "Weight Lost"
        : deltaFromStartLb > 0
          ? "Weight Gained"
          : "Weight Change"
      : undefined;

  // ---- chart series (7 days, carry forward)
  const last7 = [...Array(7)].map((_, i) => dayjs().subtract(6 - i, "day"));
  const byDate = new Map<string, number>();
  logs.filter(l => typeof l.weightKg === "number").forEach(l => byDate.set(l.dateISO, l.weightKg!));
  let carry = currentWeightKg;
  const weightSeries = last7.map((d) => {
    const iso = d.format("YYYY-MM-DD");
    if (byDate.has(iso)) carry = byDate.get(iso)!;
    return { x: d.format("ddd"), y: toLb(carry) };
  });

  const ys = weightSeries.map(p => p.y);
  const hasData = ys.length > 0;
  const yMin = hasData ? Math.min(...ys) : 0;
  const yMax = hasData ? Math.max(...ys) : 1;
  const pad = Math.max(0.5, (yMax - yMin) * 0.2);
  const domainY: [number, number] = [Math.floor(yMin - pad), Math.ceil(yMax + pad)];
  const xTicks = [weightSeries[0]?.x, weightSeries[2]?.x, weightSeries[4]?.x, weightSeries[6]?.x].filter(Boolean);

  // Reset all data for testing, start at onboarding
  const resetProfile = useProfileStore((s) => s.reset);
  const resetGoal = useGoalStore((s) => s.reset);
  const resetLogs = useLogStore((s) => s.reset);
  const resetSub = useSubscriptionStore((s) => s.reset);
  const setLoggedIn = useAppStore((s) => s.setLoggedIn);
  const setOnboardingDone = useAppStore((s) => s.setOnboardingDone);
  const handleResetAll = () => {
    Alert.alert("Reset all data?", "This will erase onboarding, logs, and login state.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reset",
        style: "destructive",
        onPress: () => {
          resetProfile?.();
          resetGoal?.();
          resetLogs?.();
          resetSub?.();
          setLoggedIn?.(false);
          setOnboardingDone?.(false);
          nav.reset({ index: 0, routes: [{ name: "Splash" }] });
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: BG }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Title (centered) */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: TEXT, textAlign: "center" }]}>Dashboard</Text>
        </View>

        {/* Row 1: Streak (full width) */}
        <View style={[styles.card, styles.full, { backgroundColor: CARD_BG, borderColor: BORDER }]}>
          <View style={styles.streakRow}>
            <Text style={[styles.flame, { color: ACCENT }]}>🔥</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.streakValue, { color: TEXT }]}>{streak()} days</Text>
              <Text style={styles.streakLabel}>Login Streak</Text>
            </View>
          </View>
        </View>

        {/* Tiles grid (wraps into 2 per row) */}
        <View style={styles.tilesWrap}>
          {/* Target Calories */}
          <View style={[styles.card, styles.tileHalf, { backgroundColor: CARD_BG, borderColor: BORDER }]}>
            <Text style={[styles.tileLabel, { color: TEXT }]}>Target Calories</Text>
            <Text style={[styles.tileValue, { color: TEXT }]}>{Math.round(effectiveTarget)}</Text>
            <Text style={styles.tileSub}>Today</Text>
          </View>

          {/* Weight Left (if applicable) */}
          {/* {lbsLeft != null && (
            <View style={[styles.card, styles.tileHalf, { backgroundColor: CARD_BG, borderColor: BORDER }]}>
              <Text style={[styles.tileLabel, { color: TEXT }]}>Weight Left</Text>
              <Text style={[styles.tileValue, { color: TEXT }]}>{lbsLeft} lb</Text>
              <Text style={styles.tileSub}>{goalWeightKg ? `Goal: ${Math.round(kgToLb(goalWeightKg))} lb` : ""}</Text>
            </View>
          )} */}

          {/* Days to Go + estimated/planned date */}
          {!isMaintain && (
            <View style={[styles.card, styles.tileHalf, { backgroundColor: CARD_BG, borderColor: BORDER }]}>
              <Text style={[styles.tileLabel, { color: TEXT }]}>Days to Go</Text>
              <Text style={[styles.tileValue, { color: TEXT }]}>
                {estimate?.days ?? (targetDateISO ? Math.max(0, dayjs(targetDateISO).diff(dayjs(), "day")) : "—")}
              </Text>
              <Text style={styles.tileSub}>
                {estimate?.date ??
                  (targetDateISO ? dayjs(targetDateISO).format("MMM D, YYYY") : "No date set")}
              </Text>
            </View>
          )}

          {/* Starting Weight (always) */}
          <View style={[styles.card, styles.tileHalf, { backgroundColor: CARD_BG, borderColor: BORDER }]}>
            <Text style={[styles.tileLabel, { color: TEXT }]}>Starting Weight</Text>
            <Text style={[styles.tileValue, { color: TEXT }]}>{startingWDisplay}</Text>
          </View>

          {/* Lost/Gained (if start exists) */}
          {lostOrGainedLabel && (
            <View style={[styles.card, styles.tileHalf, { backgroundColor: CARD_BG, borderColor: BORDER }]}>
              <Text style={[styles.tileLabel, { color: TEXT }]}>{lostOrGainedLabel}</Text>
              <Text style={[styles.tileValue, { color: TEXT }]}>
                {deltaFromStartLb! > 0 ? `+${deltaFromStartLb}` : `${deltaFromStartLb}`} lb
              </Text>
              <Text style={styles.tileSub}>vs start</Text>
            </View>
          )}
        </View>

        {/* Current Weight + Chart (full width) */}
        <View style={[styles.card, styles.full, { backgroundColor: CARD_BG, borderColor: BORDER, overflow: "hidden" }]}>
          <Text style={[styles.sectionTitle, { color: TEXT }]}>Current Weight</Text>
          <Text style={[styles.currentValue, { color: TEXT }]}>{currentWDisplay}</Text>

          <View style={styles.chartWrap}>
            <VictoryChart
              padding={{ top: 10, bottom: 36, left: 56, right: 24 }}
              domain={{ y: domainY }}
              height={220}
              width={undefined as unknown as number}
            >
              <VictoryAxis
                tickValues={xTicks as any}
                style={{ tickLabels: { fontSize: 12, fill: "#6b7280" }, axis: { stroke: "transparent" }, ticks: { stroke: "transparent" } }}
              />
              <VictoryAxis
                dependentAxis
                style={{ tickLabels: { fontSize: 12, fill: "#6b7280" }, grid: { stroke: "#e5e7eb" }, axis: { stroke: "transparent" } }}
              />
              <VictoryArea data={weightSeries} style={{ data: { fill: ACCENT + "22", strokeWidth: 0 } }} />
              <VictoryLine data={weightSeries} interpolation="monotoneX" style={{ data: { stroke: ACCENT, strokeWidth: 3 } }} />
              <VictoryScatter data={weightSeries} size={4} style={{ data: { fill: ACCENT } }} />
            </VictoryChart>
          </View>
        </View>

        {/* Add Log CTA (centered pill) */}
        <View style={styles.ctaWrap}>
          <Pressable style={[styles.addBtn, { backgroundColor: ACCENT }]} onPress={() => nav.navigate("Log")}>
            <Text style={styles.addBtnText}>Add Log</Text>
          </Pressable>
          <Pressable
            onPress={handleResetAll}
            style={({ pressed }) => [
              {
                backgroundColor: "#ef4444",
                transform: [{ translateY: pressed ? 1 : 0 }],
              },
            ]}
          >
            <Text>Reset all data (testing)</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingBottom: 28 },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4, alignItems: "center" },
  title: { fontSize: 34, fontWeight: "800" },

  full: { marginHorizontal: 20, marginBottom: 16 },

  card: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },

  streakRow: { flexDirection: "row", alignItems: "center" },
  flame: { fontSize: 28, marginRight: 12 },
  streakValue: { fontSize: 24, fontWeight: "800" },
  streakLabel: { fontSize: 14, color: "#6b7280", marginTop: 4 },

  // Grid
  tilesWrap: {
    paddingHorizontal: 20,
    marginBottom: 8,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  tileHalf: {
    width: "48%",
    marginBottom: 12,
    minHeight: 104,
    justifyContent: "center",
  },
  tileLabel: { fontSize: 16, fontWeight: "600" },
  tileValue: { fontSize: 28, fontWeight: "800", marginTop: 4 },
  tileSub: { fontSize: 13, color: "#6b7280", marginTop: 2 },

  sectionTitle: { fontSize: 18, fontWeight: "700" },
  currentValue: { fontSize: 36, fontWeight: "800", marginTop: 6, marginBottom: 8 },

  chartWrap: {
    paddingHorizontal: 8,
    paddingBottom: 4,
    paddingTop: 2,
    borderRadius: 18,
    overflow: "hidden",
  },

  ctaWrap: { paddingHorizontal: 20, marginTop: 10, marginBottom: 24, alignItems: "center" },
  addBtn: {
    width: "86%",
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  addBtnText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});
