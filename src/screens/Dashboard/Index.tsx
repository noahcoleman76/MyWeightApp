// app/screens/Dashboard/Index.tsx

// ─────────────────────────── Imports ───────────────────────────
import {
  useFocusEffect,
  useNavigation,
  useTheme,
} from "@react-navigation/native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Button from "../../components/ui/Button";
import { Toast } from "../../components/ui/Toast";

import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

import {
  VictoryArea,
  VictoryAxis,
  VictoryChart,
  VictoryLine,
  VictoryScatter,
  VictoryTooltip,
  VictoryVoronoiContainer,
} from "victory-native";

// ── Internal libs & state stores
import { useAppStore } from "@/src/state/appStore";
import { useSubscriptionStore } from "@/src/state/subscriptionStore";
import { computeDailyTarget, kgToLb } from "../../lib/calorieMath";
import { getItem, setItem } from "../../lib/mmkv";
import { useGoalStore } from "../../state/goalStore";
import { useLogStore } from "../../state/logStore";
import { useProfileStore } from "../../state/profileStore";
import { useStreakSync } from "../../hooks/useStreakSync";
import { useAuthStore } from "../../state/authStore";
import { FirestoreService } from "../../lib/firebase";

// ─────────────────────────── Setup ───────────────────────────
dayjs.extend(customParseFormat);

// Strict YYYY-MM-DD parsing
const parseISO = (iso?: string) => dayjs(iso, "YYYY-MM-DD", true);

// Round to 1 decimal place
const round1 = (n: number) => Math.round(n * 10) / 10;

// Convert kg → lb (rounded to 1 decimal)
const toLb = (kg: number) => round1(kgToLb(kg));

// Persistent keys
const START_DAY_KEY = "start_day_iso"; // set during onboarding CurrentWeight
const FIRST_SEEN_KEY = "first_dashboard_seen_iso"; // legacy / fallback

// Layout constants (used with window width)
const SCREEN_MARGIN = 20; // styles.full marginHorizontal
const CARD_PADDING = 16; // styles.card padding
const WRAP_PADDING = 8; // styles.chartWrap paddingHorizontal

// Tiny float-safe equality check for singular/plural units
const isExactlyOne = (n: number) => Math.abs(n - 1) < 1e-9;

// ─────────────────────────── Component ───────────────────────────
export default function Dashboard() {
  // ── Navigation / theme / layout
  const nav = useNavigation<any>();
  const { colors } = useTheme();
  const scrollRef = React.useRef<ScrollView | null>(null);

  const { width: winW } = useWindowDimensions();
  const chartWidth = Math.max(
    320,
    winW - SCREEN_MARGIN * 2 - CARD_PADDING * 2 - WRAP_PADDING * 2
  );

  // ── Sync streak data from backend
  useStreakSync();
  
  // ── Refresh streak when Dashboard comes into focus
  const user = useAuthStore((s) => s.user);
  const setStreak = useProfileStore((s) => s.setStreak);
  
  useFocusEffect(
    useCallback(() => {
      const refreshStreak = async () => {
        if (!user) return;
        
        try {
          const userData = await FirestoreService.getUserData(user.uid);
          if (userData?.streak) {
            setStreak(userData.streak);
            console.log('🔥 Streak refreshed on Dashboard focus:', userData.streak);
          }
        } catch (error) {
          console.error('❌ Failed to refresh streak:', error);
        }
      };
      
      refreshStreak();
    }, [user, setStreak])
  );

  // ── Store hooks
  const { profile } = useProfileStore();
  const { goalWeightKg, targetDateISO, dailyTargetOverride, mode } = useGoalStore();
  const { logs, streak: calculateStreak } = useLogStore(); // Keep frontend calc as fallback

  // Use backend streak from profile, fallback to calculated if not available
  const currentStreak = profile.streak?.current ?? calculateStreak();
  const longestStreak = profile.streak?.longest ?? 0;

  const resetProfile = useProfileStore((s) => s.reset);
  const resetGoal = useGoalStore((s) => s.reset);
  const resetLogs = useLogStore((s) => s.reset);
  const resetSub = useSubscriptionStore((s) => s.reset);
  const setLoggedIn = useAppStore((s) => s.setLoggedIn);
  const setOnboardingDone = useAppStore((s) => s.setOnboardingDone);

  // Toast state
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");

  // ── Theme colors
  const ACCENT = colors?.primary ?? "#5eada8";
  const TEXT = colors?.text ?? "#0f172a";
  const BG = colors?.background ?? "#f7f7f7";
  const CARD_BG = colors?.card ?? "#ffffff";
  const BORDER = colors?.border ?? "#eef2f7";
  const MUTED = colors?.text ? `${colors.text}99` : "#6b7280";

  // ── Units
  const DISPLAY_UNIT: "kg" | "lb" =
    profile.weightUnit === "kg" ? "kg" : "lb";

  const toDisplay = useCallback(
    (kg: number) => (DISPLAY_UNIT === "kg" ? round1(kg) : toLb(kg)),
    [DISPLAY_UNIT]
  );

  // ─────────────────────────── Effects ───────────────────────────

  // Always scroll dashboard to top when focused
  useFocusEffect(
    React.useCallback(() => {
      const timeout = setTimeout(() => {
        scrollRef.current?.scrollTo({ y: 0, animated: false });
      }, 0);

      return () => clearTimeout(timeout);
    }, [])
  );

  // Ensure FIRST_SEEN_KEY exists for legacy users (without overriding start_day)
  useEffect(() => {
    const rawSeen = getItem(FIRST_SEEN_KEY);
    const ok =
      typeof rawSeen === "string" &&
      parseISO(rawSeen.slice(0, 10)).isValid();
    if (!ok) setItem(FIRST_SEEN_KEY, dayjs().format("YYYY-MM-DD"));
  }, []);

  // ─────────────────────────── Chart: start anchor ───────────────────────────

  /**
   * Resolve dashboard "start day" (for chart anchor):
   * 1) Use onboarding start_day_iso if valid
   * 2) Else use first_dashboard_seen_iso if valid
   * 3) Else fall back to "today" and persist as FIRST_SEEN_KEY
   */
  const chartStartISO: string = useMemo(() => {
    const rawStart = getItem(START_DAY_KEY);
    const normStart = parseISO(
      typeof rawStart === "string" ? rawStart.slice(0, 10) : undefined
    );
    if (normStart.isValid()) return normStart.format("YYYY-MM-DD");

    const rawSeen = getItem(FIRST_SEEN_KEY);
    const normSeen = parseISO(
      typeof rawSeen === "string" ? rawSeen.slice(0, 10) : undefined
    );
    if (normSeen.isValid()) return normSeen.format("YYYY-MM-DD");

    const today = dayjs().format("YYYY-MM-DD");
    setItem(FIRST_SEEN_KEY, today);
    return today;
  }, []);

  /**
   * Earliest log that has a valid weight & date.
   * Used so the chart never starts *after* your first real data point.
   */
  const earliestLogISO: string | undefined = useMemo(() => {
    const withWt = logs.filter(
      (l) => typeof l.weightKg === "number" && parseISO(l.dateISO).isValid()
    );
    if (!withWt.length) return undefined;

    withWt.sort((a, b) =>
      a.dateISO === b.dateISO
        ? a.id > b.id
          ? 1
          : -1
        : a.dateISO > b.dateISO
          ? 1
          : -1
    );
    return withWt[0].dateISO;
  }, [logs]);

  /**
   * Final anchor start date: the *earlier* of:
   * - dashboard start date
   * - earliest log date
   */
  const anchorStartISO: string = useMemo(() => {
    const a = parseISO(chartStartISO);
    const b = parseISO(earliestLogISO);
    const aValid = a.isValid();
    const bValid = b.isValid();

    if (aValid && bValid) {
      return (a.isBefore(b) ? a : b).format("YYYY-MM-DD");
    }
    if (aValid) return a.format("YYYY-MM-DD");
    if (bValid) return b.format("YYYY-MM-DD");

    // Defensive: should never happen since chartStartISO falls back to today.
    return dayjs().format("YYYY-MM-DD");
  }, [chartStartISO, earliestLogISO]);

  // ─────────────────────────── Chart: series & domains ───────────────────────────

  /**
   * Build the weight series for the chart:
   * - Add an anchor point at anchorStartISO using:
   *   startingWeightKg → earliest log weight → current profile weight
   * - Append all weight logs in ascending date order
   * - Ensure at least 2 x-points (so Victory can render a span)
   * - Deduplicate by calendar day
   * - Convert to display units (kg/lb) with rounding
   */
  const baseSeries = useMemo(() => {
    const weightLogsAsc = logs
      .filter(
        (l) =>
          typeof l.weightKg === "number" &&
          parseISO(l.dateISO).isValid()
      )
      .sort((a, b) =>
        a.dateISO === b.dateISO
          ? a.id > b.id
            ? 1
            : -1
          : a.dateISO > b.dateISO
            ? 1
            : -1
      );

    const pts: { x: Date; y: number }[] = [];

    const earliestWtKg = weightLogsAsc.length
      ? (weightLogsAsc[0].weightKg as number)
      : undefined;

    const anchorYKg =
      typeof profile.startingWeightKg === "number"
        ? profile.startingWeightKg
        : earliestWtKg ?? profile.currentWeightKg ?? undefined;

    const startD = parseISO(anchorStartISO);
    if (startD.isValid() && typeof anchorYKg === "number") {
      pts.push({ x: startD.startOf("day").toDate(), y: anchorYKg });
    }

    for (const l of weightLogsAsc) {
      const d = parseISO(l.dateISO);
      if (d.isValid()) {
        pts.push({ x: d.toDate(), y: l.weightKg as number });
      }
    }

    // If we only have the anchor point, add one more point today
    if (pts.length === 1) {
      pts.push({
        x: dayjs().endOf("day").toDate(),
        y: pts[0].y,
      });
    }

    // Deduplicate by calendar day & filter out invalid points
    const byDay = new Map<string, { x: Date; y: number }>();
    for (const p of pts) {
      if (
        p.x instanceof Date &&
        !Number.isNaN(p.x.getTime()) &&
        Number.isFinite(p.y)
      ) {
        byDay.set(dayjs(p.x).format("YYYY-MM-DD"), p);
      }
    }

    return Array.from(byDay.values())
      .sort((a, b) => +a.x - +b.x)
      .map((p) => ({ x: p.x, y: toDisplay(p.y) }));
  }, [
    logs,
    profile.startingWeightKg,
    profile.currentWeightKg,
    anchorStartISO,
    toDisplay,
  ]);

  // Pin X domain so Victory doesn't auto-rescale across rerenders
  const domainX = useMemo<[Date, Date] | undefined>(() => {
    if (!baseSeries.length) return undefined;
    const start = baseSeries[0].x;
    const last = baseSeries[baseSeries.length - 1].x;

    // If same moment, pad to +1 day
    if (+last - +start < 60 * 60 * 1000) {
      return [start, dayjs(start).add(1, "day").toDate()];
    }
    return [start, last];
  }, [baseSeries]);

  // Generate x-axis ticks: weekly for short spans, monthly for long spans
  const { xTicks, xTickFormat } = useMemo(() => {
    if (!domainX)
      return { xTicks: [], xTickFormat: (_: Date) => "" };

    const [s, e] = domainX.map((d) => dayjs(d)) as [
      dayjs.Dayjs,
      dayjs.Dayjs
    ];
    const spanDays = e.diff(s, "day");
    const ticks: Date[] = [];

    if (spanDays <= 40) {
      let cur = s.startOf("week");
      while (cur.isBefore(e.add(1, "day"))) {
        ticks.push(cur.toDate());
        cur = cur.add(7, "day");
      }
      return {
        xTicks: ticks,
        xTickFormat: (d: Date) => dayjs(d).format("MMM D"),
      };
    }

    let cur = s.startOf("month");
    while (cur.isBefore(e.add(1, "month"))) {
      ticks.push(cur.toDate());
      cur = cur.add(1, "month");
    }
    return {
      xTicks: ticks,
      xTickFormat: (d: Date) => dayjs(d).format("MMM 'YY"),
    };
  }, [domainX]);

  // Y domain: pad by 10% (min 0.5) so lines aren't hugging edges
  const domainY = useMemo<[number, number] | undefined>(() => {
    if (!baseSeries.length) return undefined;

    let min = Math.min(...baseSeries.map((p) => p.y));
    let max = Math.max(...baseSeries.map((p) => p.y));

    if (min === max) {
      min -= 1;
      max += 1;
    }

    const pad = Math.max(0.5, (max - min) * 0.1);
    return [Math.floor(min - pad), Math.ceil(max + pad)];
  }, [baseSeries]);

  // Reference line for starting weight (dashed)
  const startRefY =
    typeof profile.startingWeightKg === "number"
      ? toDisplay(profile.startingWeightKg)
      : undefined;

  // ─────────────────────────── Weight & calories ───────────────────────────

  /**
   * Latest logged weight (if any).
   * Used as "current" for tiles & goal date estimation.
   */
  const latestLogged = useMemo(() => {
    const withWt = logs.filter(
      (l) => typeof l.weightKg === "number"
    );
    if (!withWt.length) {
      return {
        kg: undefined as number | undefined,
        iso: undefined as string | undefined,
      };
    }

    // Most recent by date, then by id
    withWt.sort((a, b) =>
      a.dateISO === b.dateISO
        ? a.id < b.id
          ? 1
          : -1
        : a.dateISO < b.dateISO
          ? 1
          : -1
    );

    return {
      kg: withWt[0].weightKg as number,
      iso: withWt[0].dateISO as string,
    };
  }, [logs]);

  // Fallback order: latest log → startingWeightKg → profile.currentWeightKg
  const currentWeightKg =
    latestLogged.kg ??
    profile.startingWeightKg ??
    profile.currentWeightKg;

  // Compute maintenance & target using calorieMath
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

  // Base calorie target: override → computed → maintenance → 0
  const rawTarget =
    dailyTargetOverride ??
    (computedTarget != null ? computedTarget : undefined) ??
    (maintenance != null ? maintenance : 0);

  const MIN_TARGET = 1000;

  // Any finite value below MIN_TARGET gets clamped (and warning shown)
  const isBelowMin =
    Number.isFinite(rawTarget) && rawTarget < MIN_TARGET;

  const safeRaw = Number.isFinite(rawTarget)
    ? (rawTarget as number)
    : MIN_TARGET;

  const displayTarget = Math.round(
    isBelowMin ? MIN_TARGET : safeRaw
  );
  const showMinWarning = isBelowMin;

  /**
   * Estimate days to reach goal based on current weight vs goalWeightKg
   * using 7700 kcal per kg and current deficit/surplus.
   */
  const isMaintain = mode === "maintain";
  const estimate = useMemo(() => {
    if (isMaintain || !goalWeightKg) {
      return undefined as
        | { date: string; days: number }
        | undefined;
    }

    const baseDateISO =
      latestLogged.iso ?? dayjs().format("YYYY-MM-DD");

    const kgToLose = currentWeightKg - goalWeightKg;
    const kgToGain = goalWeightKg - currentWeightKg;

    const deficitPerDay = maintenance - rawTarget;
    const surplusPerDay = rawTarget - maintenance;

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

    if (!isFinite(daysNeeded)) return undefined;

    const rounded = Math.max(0, Math.ceil(daysNeeded));
    const date = dayjs(baseDateISO)
      .add(rounded, "day")
      .format("MMM D, YYYY");

    return { date, days: rounded };
  }, [
    isMaintain,
    goalWeightKg,
    currentWeightKg,
    maintenance,
    rawTarget,
    latestLogged.iso,
  ]);

  // ─────────────────────────── Tiles: strings & units ───────────────────────────

  // Singular/plural based on *current* weight
  const kgUnit = isExactlyOne(currentWeightKg) ? "kg" : "kgs";
  const lbUnit = isExactlyOne(currentWeightKg) ? "lb" : "lbs";

  const startingWDisplay =
    profile.startingWeightKg != null
      ? DISPLAY_UNIT === "kg"
        ? `${round1(profile.startingWeightKg)} ${kgUnit}`
        : `${toLb(profile.startingWeightKg)} ${lbUnit}`
      : "—";

  const currentWDisplay =
    DISPLAY_UNIT === "kg"
      ? `${round1(currentWeightKg)} ${kgUnit}`
      : `${toLb(currentWeightKg)} ${lbUnit}`;

  const hasStart = profile.startingWeightKg != null;
  const deltaFromStart = hasStart
    ? toDisplay(currentWeightKg - (profile.startingWeightKg as number))
    : undefined;

  const lostOrGainedLabel =
    deltaFromStart != null
      ? deltaFromStart < 0
        ? "Weight Lost"
        : deltaFromStart > 0
          ? "Weight Gained"
          : "Weight Change"
      : undefined;

  // Use backend streak (already computed above)
  // No need to recalculate on every render

  // ─────────────────────────── Handlers ───────────────────────────
  const handleResetAll = () => {
    // Note: This is a testing function and should be removed in production
    resetProfile?.();
    resetGoal?.();
    resetLogs?.();
    resetSub?.();
    setLoggedIn?.(false);
    setOnboardingDone?.(false);
    setToastMessage("All data has been reset");
    setToastType("success");
    setToastVisible(true);

    setTimeout(() => {
      nav.reset({
        index: 0,
        routes: [{ name: "Splash" }],
      });
    }, 1000);
  };

  // ─────────────────────────── Render ───────────────────────────
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: BG }]}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <View style={styles.header}>
          <Text
            style={[
              styles.title,
              { color: TEXT, textAlign: "center" },
            ]}
          >
            Dashboard
          </Text>
        </View>

        {/* Streak */}
        <View
          style={[
            styles.card,
            styles.full,
            { backgroundColor: CARD_BG, borderColor: BORDER },
          ]}
        >
          <View style={styles.streakRow}>
            <Image
              source={require("../../../assets/images/flame.png")}
              style={styles.flame}
            />
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  styles.streakValue,
                  { color: TEXT },
                ]}
              >
                {currentStreak} {currentStreak === 1 ? "day" : "days"}
              </Text>
              <Text style={styles.streakLabel}>Log Streak</Text>
              {longestStreak > 0 && longestStreak > currentStreak && (
                <Text style={[styles.streakSubLabel, { color: MUTED }]}>
                  Best: {longestStreak} days
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Tiles */}
        <View style={styles.tilesWrap}>
          {/* Target Calories */}
          <View
            style={[
              styles.card,
              styles.tileHalf,
              { backgroundColor: CARD_BG, borderColor: BORDER },
            ]}
          >
            <Text
              style={[styles.tileLabel, { color: TEXT }]}
            >
              Target Calories
            </Text>
            <Text
              style={[styles.tileValue, { color: TEXT }]}
            >
              {displayTarget}
            </Text>
            <Text style={styles.tileSub}>Today</Text>
            {showMinWarning && (
              <Text style={styles.tileWarning}>
                This is the minimum required for sustainable
                weight loss.
              </Text>
            )}
          </View>

          {/* Days to go (only when not maintain mode) */}
          {mode !== "maintain" && (
            <View
              style={[
                styles.card,
                styles.tileHalf,
                {
                  backgroundColor: CARD_BG,
                  borderColor: BORDER,
                },
              ]}
            >
              <Text
                style={[styles.tileLabel, { color: TEXT }]}
              >
                Days to Go
              </Text>
              <Text
                style={[styles.tileValue, { color: TEXT }]}
              >
                {estimate?.days ??
                  (targetDateISO
                    ? Math.max(
                      0,
                      dayjs(targetDateISO).diff(
                        dayjs(),
                        "day"
                      )
                    )
                    : "—")}
              </Text>
              <Text style={styles.tileSub}>
                {estimate?.date ??
                  (targetDateISO
                    ? dayjs(targetDateISO).format(
                      "MMM D, YYYY"
                    )
                    : "No date set")}
              </Text>
            </View>
          )}

          {/* Starting Weight */}
          <View
            style={[
              styles.card,
              styles.tileHalf,
              { backgroundColor: CARD_BG, borderColor: BORDER },
            ]}
          >
            <Text
              style={[styles.tileLabel, { color: TEXT }]}
            >
              Starting Weight
            </Text>
            <Text
              style={[styles.tileValue, { color: TEXT }]}
            >
              {startingWDisplay}
            </Text>
          </View>

          {/* Delta vs start */}
          {lostOrGainedLabel && (
            <View
              style={[
                styles.card,
                styles.tileHalf,
                {
                  backgroundColor: CARD_BG,
                  borderColor: BORDER,
                },
              ]}
            >
              <Text
                style={[styles.tileLabel, { color: TEXT }]}
              >
                {lostOrGainedLabel}
              </Text>
              <Text
                style={[styles.tileValue, { color: TEXT }]}
              >
                {deltaFromStart! > 0
                  ? `+${deltaFromStart}`
                  : `${deltaFromStart}`}{" "}
                {DISPLAY_UNIT === "kg" ? kgUnit : lbUnit}
              </Text>
              <Text style={styles.tileSub}>vs start</Text>
            </View>
          )}
        </View>

        {/* Current Weight + Chart */}
        <View
          style={[
            styles.card,
            styles.full,
            { backgroundColor: CARD_BG, borderColor: BORDER },
          ]}
        >
          <Text
            style={[styles.sectionTitle, { color: TEXT }]}
          >
            Current Weight
          </Text>
          <Text
            style={[styles.currentValue, { color: TEXT }]}
          >
            {currentWDisplay}
          </Text>

          <View style={styles.chartWrap}>
            <VictoryChart
              padding={{
                top: 10,
                bottom: 36,
                left: 56,
                right: 24,
              }}
              domain={{ x: domainX, y: domainY }}
              height={240}
              width={chartWidth}
              containerComponent={
                <VictoryVoronoiContainer
                  voronoiDimension="x"
                  // Only allow tooltips from scatter series
                  voronoiBlacklist={[
                    "seriesArea",
                    "seriesLine",
                    "seriesRef",
                  ]}
                />
              }
            >
              {/* X Axis */}
              <VictoryAxis
                tickValues={xTicks as any}
                tickFormat={xTickFormat as any}
                style={{
                  tickLabels: {
                    fontSize: 12,
                    fill: MUTED,
                  },
                  axis: { stroke: "transparent" },
                  ticks: { stroke: "transparent" },
                }}
              />

              {/* Y Axis */}
              <VictoryAxis
                dependentAxis
                style={{
                  tickLabels: {
                    fontSize: 12,
                    fill: MUTED,
                  },
                  grid: { stroke: BORDER },
                  axis: { stroke: "transparent" },
                }}
              />

              {/* Area fill */}
              <VictoryArea
                name="seriesArea"
                data={baseSeries}
                style={{
                  data: { fill: `${ACCENT}22`, strokeWidth: 0 },
                }}
              />

              {/* Line */}
              <VictoryLine
                name="seriesLine"
                data={baseSeries}
                interpolation="monotoneX"
                style={{
                  data: { stroke: ACCENT, strokeWidth: 3 },
                }}
              />

              {/* Tooltip points */}
              <VictoryScatter
                name="seriesPts"
                data={baseSeries}
                size={3.5}
                style={{ data: { fill: ACCENT } }}
                labels={({ datum }: any) =>
                  `${dayjs(datum.x).format(
                    "MMM D, YYYY"
                  )}\n${datum.y} ${DISPLAY_UNIT}`
                }
                labelComponent={
                  <VictoryTooltip
                    cornerRadius={6}
                    flyoutPadding={{
                      top: 8,
                      bottom: 8,
                      left: 10,
                      right: 10,
                    }}
                    style={{ fontSize: 12 }}
                  />
                }
              />

              {/* Starting weight reference line */}
              {typeof startRefY === "number" && (
                <VictoryLine
                  name="seriesRef"
                  y={() => startRefY}
                  style={{
                    data: {
                      stroke: "#9ca3af",
                      strokeDasharray: "6,6",
                      strokeWidth: 2,
                    },
                  }}
                />
              )}
            </VictoryChart>
          </View>
        </View>

        {/* CTA buttons */}
        <View style={styles.ctaWrap}>
          <Button
            title="Add Log"
            onPress={() => nav.navigate("Log")}
            variant="primary"
            accentColor={ACCENT}
            style={styles.addBtn}
          />

          {/* Uncomment for testing only */}
          {/* <Pressable
            onPress={handleResetAll}
            style={({ pressed }) => [
              {
                backgroundColor: "#ef4444",
                paddingVertical: 8,
                paddingHorizontal: 16,
                borderRadius: 8,
                marginTop: 8,
                transform: [{ translateY: pressed ? 1 : 0 }],
              },
            ]}
          >
            <Text style={{ color: "#fff", fontWeight: "600" }}>Reset all data (testing)</Text>
          </Pressable> */}
        </View>
      </ScrollView>

      {/* Toast Notification */}
      <Toast
        message={toastMessage}
        type={toastType}
        visible={toastVisible}
        onDismiss={() => setToastVisible(false)}
      />
    </SafeAreaView>
  );
}

// ─────────────────────────── Styles ───────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingBottom: 28 },

  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
    alignItems: "center",
  },
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

  // Streak
  streakRow: { flexDirection: "row", alignItems: "center" },
  flame: {
    width: 50,
    height: 50,
    marginRight: 6,
    resizeMode: "contain",
  },
  streakValue: { fontSize: 24, fontWeight: "800" },
  streakLabel: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 4,
  },
  streakSubLabel: {
    fontSize: 12,
    color: "#9ca3af",
    marginTop: 2,
  },

  // Tiles
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
  tileSub: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 2,
  },
  tileWarning: {
    fontSize: 11,
    color: "#ef4444",
    marginTop: 4,
  },

  // Current section / chart
  sectionTitle: { fontSize: 18, fontWeight: "700" },
  currentValue: {
    fontSize: 36,
    fontWeight: "800",
    marginTop: 6,
    marginBottom: 8,
  },
  chartWrap: {
    paddingHorizontal: 8,
    paddingBottom: 4,
    paddingTop: 2,
    borderRadius: 18,
    overflow: "hidden",
  },

  // CTA
  ctaWrap: {
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 24,
    alignItems: "center",
  },
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
    marginBottom: 10,
  },
  addBtnText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});
