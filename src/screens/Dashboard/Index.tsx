import {
  useFocusEffect,
  useNavigation,
  useTheme,
} from "@react-navigation/native";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
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
import {
  VictoryArea,
  VictoryAxis,
  VictoryChart,
  VictoryLine,
  VictoryScatter,
  VictoryTooltip,
  VictoryVoronoiContainer,
} from "victory-native";
import Button from "../../components/ui/Button";
import { Toast } from "../../components/ui/Toast";
import { useStreakSync } from "../../hooks/useStreakSync";
import { computeDailyTarget, kgToLb } from "../../lib/calorieMath";
import { FirestoreService } from "../../lib/firebase";
import { getItem, setItem } from "../../lib/mmkv";
import { useAuthStore } from "../../state/authStore";
import { useGoalStore } from "../../state/goalStore";
import { useLogStore } from "../../state/logStore";
import { useProfileStore } from "../../state/profileStore";

dayjs.extend(customParseFormat);

const parseISO = (iso?: string) => dayjs(iso, "YYYY-MM-DD", true);
const round1 = (n: number) => Math.round(n * 10) / 10;
const toLb = (kg: number) => round1(kgToLb(kg));

const START_DAY_KEY = "start_day_iso";
const FIRST_SEEN_KEY = "first_dashboard_seen_iso";

const SCREEN_MARGIN = 20;
const CARD_PADDING = 16;
const WRAP_PADDING = 8;

const isExactlyOne = (n: number) => Math.abs(n - 1) < 1e-9;

export default function Dashboard() {
  const nav = useNavigation<any>();
  const { colors } = useTheme();
  const scrollRef = React.useRef<ScrollView | null>(null);

  const { width: winW } = useWindowDimensions();
  const chartWidth = Math.max(
    320,
    winW - SCREEN_MARGIN * 2 - CARD_PADDING * 2 - WRAP_PADDING * 2
  );

  useStreakSync();
  
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
          }
        } catch (error) {
          console.error("❌ Failed to refresh streak:", error);
        }
      };
      
      refreshStreak();
    }, [user, setStreak])
  );

  const { profile } = useProfileStore();
  const { goalWeightKg, targetDateISO, dailyTargetOverride, mode } = useGoalStore();
  const { logs, streak: calculateStreak } = useLogStore();

  const currentStreak = profile.streak?.current ?? calculateStreak();
  const longestStreak = profile.streak?.longest ?? 0;

  const [toastVisible, setToastVisible] = useState(false);

  const ACCENT = colors?.primary ?? "#5eada8";
  const TEXT = colors?.text ?? "#0f172a";
  const BG = colors?.background ?? "#f7f7f7";
  const CARD_BG = colors?.card ?? "#ffffff";
  const BORDER = colors?.border ?? "#eef2f7";
  const MUTED = colors?.text ? `${colors.text}99` : "#6b7280";

  const DISPLAY_UNIT: "kg" | "lb" =
    profile.weightUnit === "kg" ? "kg" : "lb";

  const toDisplay = useCallback(
    (kg: number) => (DISPLAY_UNIT === "kg" ? round1(kg) : toLb(kg)),
    [DISPLAY_UNIT]
  );

  useFocusEffect(
    React.useCallback(() => {
      const timeout = setTimeout(() => {
        scrollRef.current?.scrollTo({ y: 0, animated: false });
      }, 0);

      return () => clearTimeout(timeout);
    }, [])
  );

  useEffect(() => {
    const rawSeen = getItem(FIRST_SEEN_KEY);
    const ok =
      typeof rawSeen === "string" &&
      parseISO(rawSeen.slice(0, 10)).isValid();
    if (!ok) setItem(FIRST_SEEN_KEY, dayjs().format("YYYY-MM-DD"));
  }, []);

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

    return dayjs().format("YYYY-MM-DD");
  }, [chartStartISO, earliestLogISO]);

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

    if (pts.length === 1) {
      pts.push({
        x: dayjs().endOf("day").toDate(),
        y: pts[0].y,
      });
    }

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

  const domainX = useMemo<[Date, Date] | undefined>(() => {
    if (!baseSeries.length) return undefined;
    const start = baseSeries[0].x;
    const last = baseSeries[baseSeries.length - 1].x;

    if (+last - +start < 60 * 60 * 1000) {
      return [start, dayjs(start).add(1, "day").toDate()];
    }
    return [start, last];
  }, [baseSeries]);

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

  const startRefY =
    typeof profile.startingWeightKg === "number"
      ? toDisplay(profile.startingWeightKg)
      : undefined;

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

  const currentWeightKg =
    latestLogged.kg ??
    profile.startingWeightKg ??
    profile.currentWeightKg;

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

  const rawTarget =
    dailyTargetOverride ??
    (computedTarget != null ? computedTarget : undefined) ??
    (maintenance != null ? maintenance : 0);

  const MIN_TARGET = 1000;

  const isBelowMin =
    Number.isFinite(rawTarget) && rawTarget < MIN_TARGET;

  const safeRaw = Number.isFinite(rawTarget)
    ? (rawTarget as number)
    : MIN_TARGET;

  const displayTarget = Math.round(
    isBelowMin ? MIN_TARGET : safeRaw
  );
  const showMinWarning = isBelowMin;

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

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: BG }]}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
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

        <View style={styles.tilesWrap}>
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
                  voronoiBlacklist={[
                    "seriesArea",
                    "seriesLine",
                    "seriesRef",
                  ]}
                />
              }
            >
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

              <VictoryArea
                name="seriesArea"
                data={baseSeries}
                style={{
                  data: { fill: `${ACCENT}22`, strokeWidth: 0 },
                }}
              />

              <VictoryLine
                name="seriesLine"
                data={baseSeries}
                interpolation="monotoneX"
                style={{
                  data: { stroke: ACCENT, strokeWidth: 3 },
                }}
              />

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

        <View style={styles.ctaWrap}>
          <Button
            title="Add Log"
            onPress={() => nav.navigate("Log")}
            variant="primary"
            accentColor={ACCENT}
            style={styles.addBtn}
          />
        </View>
      </ScrollView>

      <Toast
        message=""
        type="success"
        visible={toastVisible}
        onDismiss={() => setToastVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  scroll: {
    paddingBottom: 28,
  },

  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
    alignItems: "center",
  },
  title: {
    fontSize: 34,
    fontWeight: "800",
  },
  full: {
    marginHorizontal: 20,
    marginBottom: 16,
  },

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
  streakRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  flame: {
    width: 50,
    height: 50,
    marginRight: 6,
    resizeMode: "contain",
  },
  streakValue: {
    fontSize: 24,
    fontWeight: "800",
  },
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
  tileLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  tileValue: {
    fontSize: 28,
    fontWeight: "800",
    marginTop: 4,
  },
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
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
});
