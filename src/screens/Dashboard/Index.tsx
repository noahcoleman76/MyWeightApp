// app/screens/Dashboard/Index.tsx
import { useAppStore } from "@/src/state/appStore";
import { useSubscriptionStore } from "@/src/state/subscriptionStore";
import { useNavigation, useTheme } from "@react-navigation/native";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import React, { useEffect, useMemo } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  VictoryArea,
  VictoryAxis,
  VictoryChart,
  VictoryLine,
  VictoryScatter,
  VictoryTooltip,
  VictoryVoronoiContainer,
} from "victory-native";
import { computeDailyTarget, kgToLb } from "../../lib/calorieMath";
import { getItem, setItem } from "../../lib/mmkv";
import { useGoalStore } from "../../state/goalStore";
import { useLogStore } from "../../state/logStore";
import { useProfileStore } from "../../state/profileStore";

dayjs.extend(customParseFormat);

// ---------- helpers
const parseISO = (iso?: string) => dayjs(iso, "YYYY-MM-DD", true); // strict YYYY-MM-DD
const toLb = (kg: number) => Math.round(kgToLb(kg) * 10) / 10;

// persistent keys
const START_DAY_KEY = "start_day_iso";              // set during onboarding CurrentWeight
const FIRST_SEEN_KEY = "first_dashboard_seen_iso";  // legacy / fallback

export default function Dashboard() {
  const nav = useNavigation<any>();
  const { colors } = useTheme();

  const { profile } = useProfileStore();
  const { goalWeightKg, targetDateISO, dailyTargetOverride, mode } = useGoalStore();
  const { logs, streak } = useLogStore();

  const ACCENT = colors?.primary ?? "#5eada8";
  const TEXT = colors?.text ?? "#0f172a";
  const BG = colors?.background ?? "#f7f7f7";
  const CARD_BG = "#ffffff";
  const BORDER = "#eef2f7";

  // ---------- layout
  const { width: winW } = useWindowDimensions();
  const SCREEN_MARGIN = 20; // styles.full marginHorizontal
  const CARD_PADDING = 16;  // styles.card padding
  const WRAP_PADDING = 8;   // styles.chartWrap paddingHorizontal
  const chartWidth = Math.max(320, winW - (SCREEN_MARGIN * 2) - (CARD_PADDING * 2) - (WRAP_PADDING * 2));

  // ---------- units
  const DISPLAY_UNIT: "kg" | "lb" = profile.weightUnit === "kg" ? "kg" : "lb";
  const toDisplay = (kg: number) => (DISPLAY_UNIT === "kg" ? Math.round(kg * 10) / 10 : Math.round(kgToLb(kg) * 10) / 10);

  // ---------- start-day resolution (start_day_iso -> first_seen -> today)
  const chartStartISO: string = useMemo(() => {
    const rawStart = getItem(START_DAY_KEY);
    const normStart = parseISO(typeof rawStart === "string" ? rawStart.slice(0, 10) : undefined);
    if (normStart.isValid()) return normStart.format("YYYY-MM-DD");

    const rawSeen = getItem(FIRST_SEEN_KEY);
    const normSeen = parseISO(typeof rawSeen === "string" ? rawSeen.slice(0, 10) : undefined);
    if (normSeen.isValid()) return normSeen.format("YYYY-MM-DD");

    const today = dayjs().format("YYYY-MM-DD");
    setItem(FIRST_SEEN_KEY, today);
    return today;
  }, []);

  // also make sure FIRST_SEEN_KEY is set for future runs (don’t override start_day_iso if present)
  useEffect(() => {
    const rawSeen = getItem(FIRST_SEEN_KEY);
    const ok = typeof rawSeen === "string" && parseISO(rawSeen.slice(0, 10)).isValid();
    if (!ok) setItem(FIRST_SEEN_KEY, dayjs().format("YYYY-MM-DD"));
  }, []);

  // ---------- earliest valid log date
  const earliestLogISO: string | undefined = useMemo(() => {
    const withWt = logs.filter((l) => typeof l.weightKg === "number" && parseISO(l.dateISO).isValid());
    if (!withWt.length) return undefined;
    withWt.sort((a, b) => (a.dateISO === b.dateISO ? (a.id > b.id ? 1 : -1) : a.dateISO > b.dateISO ? 1 : -1));
    return withWt[0].dateISO;
  }, [logs]);

  // ---------- choose anchor start (earliest of chartStartISO vs earliestLogISO)
  const anchorStartISO: string = useMemo(() => {
    const a = parseISO(chartStartISO);
    const b = parseISO(earliestLogISO);
    const aValid = a.isValid();
    const bValid = b.isValid();
    if (aValid && bValid) return a.isBefore(b) ? a.format("YYYY-MM-DD") : b.format("YYYY-MM-DD");
    if (aValid) return a.format("YYYY-MM-DD");
    if (bValid) return b.format("YYYY-MM-DD");
    // should never happen because chartStartISO always falls back to today,
    // but keep a defensive return:
    return dayjs().format("YYYY-MM-DD");
  }, [chartStartISO, earliestLogISO]);

  // ---------- build series (guarantee at least two x-points)
  const baseSeries = useMemo(() => {
    const weightLogsAsc = logs
      .filter((l) => typeof l.weightKg === "number" && parseISO(l.dateISO).isValid())
      .sort((a, b) => (a.dateISO === b.dateISO ? (a.id > b.id ? 1 : -1) : a.dateISO > b.dateISO ? 1 : -1));

    const pts: { x: Date; y: number }[] = [];

    // anchor Y: startingWeightKg -> earliest log weight -> current profile weight
    const earliestWtKg = weightLogsAsc.length ? (weightLogsAsc[0].weightKg as number) : undefined;
    const anchorYKg =
      typeof profile.startingWeightKg === "number"
        ? profile.startingWeightKg
        : earliestWtKg ?? profile.currentWeightKg ?? undefined;

    const startD = parseISO(anchorStartISO);
    if (startD.isValid() && typeof anchorYKg === "number") {
      // local midnight avoids TZ underflow
      pts.push({ x: startD.startOf("day").toDate(), y: anchorYKg });
    }

    for (const l of weightLogsAsc) {
      const d = parseISO(l.dateISO);
      if (d.isValid()) pts.push({ x: d.toDate(), y: l.weightKg as number });
    }

    // if only anchor exists, add a 2nd point at end-of-day today to create a non-zero span
    if (pts.length === 1) {
      pts.push({ x: dayjs().endOf("day").toDate(), y: pts[0].y });
    }

    // dedupe per calendar day + guard invalid dates
    const byDay = new Map<string, { x: Date; y: number }>();
    for (const p of pts) {
      if (p.x instanceof Date && !Number.isNaN(p.x.getTime()) && Number.isFinite(p.y)) {
        byDay.set(dayjs(p.x).format("YYYY-MM-DD"), p);
      }
    }

    return Array.from(byDay.values())
      .sort((a, b) => +a.x - +b.x)
      .map((p) => ({ x: p.x, y: toDisplay(p.y) }));
  }, [logs, profile.startingWeightKg, profile.currentWeightKg, profile.weightUnit, anchorStartISO]);

  // ---------- x-domain (pin it so Victory never drifts)
  const domainX = useMemo<[Date, Date] | undefined>(() => {
    if (!baseSeries.length) return undefined;
    const start = baseSeries[0].x;
    const last = baseSeries[baseSeries.length - 1].x;
    // if same moment, pad to +1 day
    if (+last - +start < 60 * 60 * 1000) return [start, dayjs(start).add(1, "day").toDate()];
    return [start, last];
  }, [baseSeries]);

  // ---------- ticks
  const { xTicks, xTickFormat } = useMemo(() => {
    if (!domainX) return { xTicks: [], xTickFormat: (_: Date) => "" };
    const [s, e] = domainX.map((d) => dayjs(d)) as [dayjs.Dayjs, dayjs.Dayjs];
    const spanDays = e.diff(s, "day");
    const ticks: Date[] = [];

    if (spanDays <= 40) {
      let cur = s.startOf("week");
      while (cur.isBefore(e.add(1, "day"))) { ticks.push(cur.toDate()); cur = cur.add(7, "day"); }
      return { xTicks: ticks, xTickFormat: (d: Date) => dayjs(d).format("MMM D") };
    }
    let cur = s.startOf("month");
    while (cur.isBefore(e.add(1, "month"))) { ticks.push(cur.toDate()); cur = cur.add(1, "month"); }
    return { xTicks: ticks, xTickFormat: (d: Date) => dayjs(d).format("MMM 'YY") };
  }, [domainX]);

  // ---------- y-domain
  const domainY = useMemo<[number, number] | undefined>(() => {
    if (!baseSeries.length) return undefined;
    let min = Math.min(...baseSeries.map((p) => p.y));
    let max = Math.max(...baseSeries.map((p) => p.y));
    if (min === max) { min -= 1; max += 1; }
    const pad = Math.max(0.5, (max - min) * 0.1);
    return [Math.floor(min - pad), Math.ceil(max + pad)];
  }, [baseSeries]);

  // dashed start weight reference
  const startRefY =
    typeof profile.startingWeightKg === "number" ? toDisplay(profile.startingWeightKg) : undefined;

  // ---------- latest/current weight for tiles & target calc
  const latestLogged = useMemo(() => {
    const withWt = logs.filter((l) => typeof l.weightKg === "number");
    if (!withWt.length) return { kg: undefined as number | undefined, iso: undefined as string | undefined };
    withWt.sort((a, b) => (a.dateISO === b.dateISO ? (a.id < b.id ? 1 : -1) : a.dateISO < b.dateISO ? 1 : -1));
    return { kg: withWt[0]!.weightKg as number, iso: withWt[0]!.dateISO as string };
  }, [logs]);

  const currentWeightKg =
    (latestLogged.kg != null ? latestLogged.kg : undefined) ??
    (profile.startingWeightKg ?? profile.currentWeightKg);

  // ---------- calories & maintenance
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

  // ---------- estimate days to goal
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

  // ---------- tiles
  const isExactlyOne = (n: number) => Math.abs(n - 1) < 1e-9;

  const kgUnit = isExactlyOne(currentWeightKg) ? "kg" : "kgs";
  const lbUnit = isExactlyOne(currentWeightKg) ? "lb" : "lbs";
  const startingWDisplay =
    profile.startingWeightKg != null
      ? (DISPLAY_UNIT === "kg" ? `${Math.round(profile.startingWeightKg*10)/10} ${kgUnit}` : `${Math.round(kgToLb(profile.startingWeightKg)*10)/10} ${lbUnit}`)
      : "—";

  // tiny float-safe equality check

  const currentWDisplay =
    DISPLAY_UNIT === "kg"
      ? `${Math.round(currentWeightKg*10)/10} ${kgUnit}`
      : `${Math.round(toLb(currentWeightKg)*10)/10} ${lbUnit}`;


  const hasStart = profile.startingWeightKg != null;
  const deltaFromStartLb = hasStart ? (toLb(currentWeightKg - (profile.startingWeightKg as number))) : undefined;
  const lostOrGainedLabel =
    deltaFromStartLb != null
      ? deltaFromStartLb < 0
        ? "Weight Lost"
        : deltaFromStartLb > 0
          ? "Weight Gained"
          : "Weight Change"
      : undefined;

  // ---------- reset (testing only)
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

  // ---------- render
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: BG }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Title */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: TEXT, textAlign: "center" }]}>Dashboard</Text>
        </View>

        {/* Streak */}
        <View style={[styles.card, styles.full, { backgroundColor: CARD_BG, borderColor: BORDER }]}>
          <View style={styles.streakRow}>
            <Text style={[styles.flame, { color: ACCENT }]}>🔥</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.streakValue, { color: TEXT }]}>{streak()} {streak() === 1 ? "day" : "days"}</Text>
              <Text style={styles.streakLabel}>Log Streak</Text>
            </View>
          </View>
        </View>

        {/* Tiles */}
        <View style={styles.tilesWrap}>
          <View style={[styles.card, styles.tileHalf, { backgroundColor: CARD_BG, borderColor: BORDER }]}>
            <Text style={[styles.tileLabel, { color: TEXT }]}>Target Calories</Text>
            <Text style={[styles.tileValue, { color: TEXT }]}>{Math.round(dailyTargetOverride ?? computedTarget)}</Text>
            <Text style={styles.tileSub}>Today</Text>
          </View>

          {mode !== "maintain" && (
            <View style={[styles.card, styles.tileHalf, { backgroundColor: CARD_BG, borderColor: BORDER }]}>
              <Text style={[styles.tileLabel, { color: TEXT }]}>Days to Go</Text>
              <Text style={[styles.tileValue, { color: TEXT }]}>
                {estimate?.days ?? (targetDateISO ? Math.max(0, dayjs(targetDateISO).diff(dayjs(), "day")) : "—")}
              </Text>
              <Text style={styles.tileSub}>
                {estimate?.date ?? (targetDateISO ? dayjs(targetDateISO).format("MMM D, YYYY") : "No date set")}
              </Text>
            </View>
          )}

          <View style={[styles.card, styles.tileHalf, { backgroundColor: CARD_BG, borderColor: BORDER }]}>
            <Text style={[styles.tileLabel, { color: TEXT }]}>Starting Weight</Text>
            <Text style={[styles.tileValue, { color: TEXT }]}>{startingWDisplay}</Text>
          </View>

          {lostOrGainedLabel && (
            <View style={[styles.card, styles.tileHalf, { backgroundColor: CARD_BG, borderColor: BORDER }]}>
              <Text style={[styles.tileLabel, { color: TEXT }]}>{lostOrGainedLabel}</Text>
              <Text style={[styles.tileValue, { color: TEXT }]}>
                {deltaFromStartLb! > 0 ? `+${deltaFromStartLb}` : `${deltaFromStartLb}`} lbs
              </Text>
              <Text style={styles.tileSub}>vs start</Text>
            </View>
          )}
        </View>

        {/* Current Weight + Chart */}
        <View style={[styles.card, styles.full, { backgroundColor: CARD_BG, borderColor: BORDER }]}>
          <Text style={[styles.sectionTitle, { color: TEXT }]}>Current Weight</Text>
          <Text style={[styles.currentValue, { color: TEXT }]}>{currentWDisplay}</Text>

          <View style={styles.chartWrap}>
            <VictoryChart
              padding={{ top: 10, bottom: 36, left: 56, right: 24 }}
              domain={{ x: domainX, y: domainY }}
              height={240}
              width={chartWidth}
              containerComponent={
                <VictoryVoronoiContainer
                  voronoiDimension="x"
                  // ONLY allow tooltips from the scatter series:
                  voronoiBlacklist={["seriesArea", "seriesLine", "seriesRef"]}
                />
              }
            >
              <VictoryAxis
                tickValues={xTicks as any}
                tickFormat={xTickFormat as any}
                style={{
                  tickLabels: { fontSize: 12, fill: "#6b7280" },
                  axis: { stroke: "transparent" },
                  ticks: { stroke: "transparent" },
                }}
              />
              <VictoryAxis
                dependentAxis
                style={{
                  tickLabels: { fontSize: 12, fill: "#6b7280" },
                  grid: { stroke: "#e5e7eb" },
                  axis: { stroke: "transparent" },
                }}
              />

              <VictoryArea
                name="seriesArea"
                data={baseSeries}
                style={{ data: { fill: ACCENT + "22", strokeWidth: 0 } }}
              />

              <VictoryLine
                name="seriesLine"
                data={baseSeries}
                interpolation="monotoneX"
                style={{ data: { stroke: ACCENT, strokeWidth: 3 } }}
              />

              {/* Tooltips ONLY here */}
              <VictoryScatter
                name="seriesPts"
                data={baseSeries}
                size={3.5}
                style={{ data: { fill: ACCENT } }}
                labels={({ datum }: any) =>
                  `${dayjs(datum.x).format("MMM D, YYYY")}\n${datum.y} ${DISPLAY_UNIT}`
                }
                labelComponent={
                  <VictoryTooltip
                    cornerRadius={6}
                    flyoutPadding={{ top: 8, bottom: 8, left: 10, right: 10 }}
                    style={{ fontSize: 12 }}
                  />
                }
              />

              {typeof startRefY === "number" && (
                <VictoryLine
                  name="seriesRef"
                  y={() => startRefY}
                  style={{ data: { stroke: "#9ca3af", strokeDasharray: "6,6", strokeWidth: 2 } }}
                />
              )}
            </VictoryChart>
          </View>
        </View>

        {/* CTA */}
        <View style={styles.ctaWrap}>
          <Pressable style={[styles.addBtn, { backgroundColor: ACCENT }]} onPress={() => nav.navigate("Log")}>
            <Text style={styles.addBtnText}>Add Log</Text>
          </Pressable>
          <Pressable
            onPress={handleResetAll}
            style={({ pressed }) => [
              { backgroundColor: "#ef4444", transform: [{ translateY: pressed ? 1 : 0 }] },
            ]}
          >
            <Text>Reset all data (testing)</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------- styles
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
  addBtnText: { color: "#fff", fontSize: 18, fontWeight: "700", letterSpacing: 0.3 },
});
