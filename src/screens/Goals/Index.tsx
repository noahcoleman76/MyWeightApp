import dayjs from "dayjs";
import React, { useEffect, useMemo, useState } from "react";
import { Keyboard, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { computeDailyTarget, kgToLb, lbToKg } from "../../lib/calorieMath";
import { useGoalStore } from "../../state/goalStore";
import { useProfileStore } from "../../state/profileStore";

export default function Goals() {
  const { profile, setActivity, setUnits, setStartingWeightKg } = useProfileStore();
  const { mode, goalWeightKg, targetDateISO, setMode, setGoalWeightKg, setTargetDateISO } = useGoalStore();

  const [hUnits, setHUnits] = useState(profile.heightUnit ?? "in");
  const [wUnits, setWUnits] = useState(profile.weightUnit ?? "lb");

  // helpers for unit display
  const toDisplay = (kg?: number | null) => {
    if (kg == null) return "—";
    return wUnits === "kg" ? `${Math.round(kg)} kg` : `${Math.round(kgToLb(kg))} lb`;
  };
  const nToDisplay = (kg?: number | null) => {
    if (kg == null) return undefined;
    return wUnits === "kg" ? Math.round(kg) : Math.round(kgToLb(kg));
  };
  const unitSuffix = wUnits === "kg" ? "kg" : "lb";

  const [goalW, setGoalW] = useState(
    goalWeightKg ? String(nToDisplay(goalWeightKg)) : ""
  );
  const [startW, setStartW] = useState(
    profile.startingWeightKg != null ? String(nToDisplay(profile.startingWeightKg)) : ""
  );

  // Sync text fields when weight units toggle
  useEffect(() => {
    if (goalWeightKg != null) setGoalW(String(nToDisplay(goalWeightKg)));
    if (profile.startingWeightKg != null) setStartW(String(nToDisplay(profile.startingWeightKg)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wUnits]);

  const { maintenance, target } = useMemo(
    () =>
      computeDailyTarget({
        sex: profile.gender,
        age: profile.age,
        heightCm: profile.height,
        currentWeightKg: profile.currentWeightKg,
        activity: profile.activityLevel,
        mode,
        goalWeightKg,
        targetDateISO,
      }),
    [profile, mode, goalWeightKg, targetDateISO]
  );

  // Derived metrics for tiles
  const isMaintain = mode === "maintain";
  const currentKg =
    profile.currentWeightKg ?? profile.startingWeightKg ?? 0;

  const weightLeftDisplay =
    !isMaintain && goalWeightKg != null
      ? `${Math.max(0, Math.round(Math.abs((wUnits === "kg" ? currentKg - goalWeightKg : kgToLb(currentKg - goalWeightKg)) as number)))} ${unitSuffix}`
      : undefined;

  const hasStart = profile.startingWeightKg != null;
  const deltaFromStart =
    hasStart && currentKg
      ? (wUnits === "kg"
          ? Math.round(currentKg - (profile.startingWeightKg as number))
          : Math.round(kgToLb(currentKg - (profile.startingWeightKg as number))))
      : undefined;

  const estimate = useMemo(() => {
    if (isMaintain || !goalWeightKg) return undefined as { date: string; days: number } | undefined;

    const deficitPerDay = maintenance - (target ?? maintenance);
    const surplusPerDay = (target ?? maintenance) - maintenance;
    const kgToLose = currentKg - goalWeightKg;
    const kgToGain = goalWeightKg - currentKg;

    let daysNeeded: number | undefined;
    if (kgToLose > 0 && deficitPerDay > 0) daysNeeded = (kgToLose * 7700) / deficitPerDay;
    else if (kgToGain > 0 && surplusPerDay > 0) daysNeeded = (kgToGain * 7700) / surplusPerDay;
    else if (goalWeightKg === currentKg) daysNeeded = 0;
    else return undefined;

    if (!isFinite(daysNeeded!)) return undefined;
    const rounded = Math.max(0, Math.ceil(daysNeeded!));
    const base = dayjs().format("YYYY-MM-DD");
    return { days: rounded, date: dayjs(base).add(rounded, "day").format("MMM D, YYYY") };
  }, [isMaintain, goalWeightKg, currentKg, maintenance, target]);

  // Theme tokens (keep in sync with Dashboard)
  const ACCENT = "#5eada8";
  const TEXT = "#0f172a";
  const BG = "#f7f7f7";
  const CARD_BG = "#ffffff";
  const BORDER = "#eef2f7";

  // rounded kcal display
  const kcal = (n?: number) => (typeof n === "number" ? `${Math.round(n)} kcal` : "—");

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: BG }]}>
      <ScrollView
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {/* Title */}
        <View style={s.header}>
          <Text style={[s.title, { color: TEXT, textAlign: "center" }]}>Goals</Text>
        </View>

        {/* ===== TOP: Metric Cards ===== */}
        <View style={s.tilesWrap}>
          <Tile title="Maintenance" value={kcal(maintenance)} BORDER={BORDER} CARD_BG={CARD_BG} TEXT={TEXT} />
          <Tile title="Target" value={kcal(target)} BORDER={BORDER} CARD_BG={CARD_BG} TEXT={TEXT} />

          <Tile title="Current Weight" value={toDisplay(profile.currentWeightKg)} BORDER={BORDER} CARD_BG={CARD_BG} TEXT={TEXT} />
          <Tile title="Starting Weight" value={toDisplay(profile.startingWeightKg)} BORDER={BORDER} CARD_BG={CARD_BG} TEXT={TEXT} />

          {!isMaintain && weightLeftDisplay != null && (
            <Tile title="Weight Left" value={weightLeftDisplay} BORDER={BORDER} CARD_BG={CARD_BG} TEXT={TEXT} />
          )}

          {deltaFromStart != null && (
            <Tile
              title={deltaFromStart < 0 ? "Weight Lost" : deltaFromStart > 0 ? "Weight Gained" : "Weight Change"}
              value={`${deltaFromStart > 0 ? "+" : ""}${deltaFromStart} ${unitSuffix}`}
              sub="vs start"
              BORDER={BORDER}
              CARD_BG={CARD_BG}
              TEXT={TEXT}
            />
          )}

          {!isMaintain && (
            <Tile
              title="Days to Go"
              value={
                estimate?.days != null
                  ? String(estimate.days)
                  : targetDateISO
                  ? String(Math.max(0, dayjs(targetDateISO).diff(dayjs(), "day")))
                  : "—"
              }
              sub={estimate?.date ?? (targetDateISO ? dayjs(targetDateISO).format("MMM D, YYYY") : "No date set")}
              BORDER={BORDER}
              CARD_BG={CARD_BG}
              TEXT={TEXT}
            />
          )}
        </View>

        {/* ===== MIDDLE: Mode, Activity, Units ===== */}
        <Pressable style={[s.card, s.full, { backgroundColor: CARD_BG, borderColor: BORDER }]} onPress={Keyboard.dismiss}>
          {/* Mode */}
          <Text style={s.label}>Mode</Text>
          <View style={s.chipsRow}>
            {(["lose", "maintain", "gain"] as const).map((m) => (
              <Chip key={m} text={cap(m)} active={mode === m} onPress={() => setMode(m)} accent={ACCENT} />
            ))}
          </View>

          {/* Activity */}
          <Text style={[s.label, { marginTop: 18 }]}>Activity Level</Text>
          <View style={s.chipsWrap}>
            {(["sedentary", "light", "moderate", "high"] as const).map((a) => (
              <Chip key={a} text={cap(a)} active={profile.activityLevel === a} onPress={() => setActivity(a)} accent={ACCENT} />
            ))}
          </View>

          {/* Units split into separate lines */}
          <Text style={[s.label, { marginTop: 18 }]}>Weight Units</Text>
          <View style={s.chipsRow}>
            <Chip
              text="lb"
              active={wUnits === "lb"}
              onPress={() => {
                setUnits("lb", hUnits as any);
                setWUnits("lb");
              }}
              accent={ACCENT}
            />
            <Chip
              text="kg"
              active={wUnits === "kg"}
              onPress={() => {
                setUnits("kg", hUnits as any);
                setWUnits("kg");
              }}
              accent={ACCENT}
            />
          </View>

          <Text style={[s.label, { marginTop: 18 }]}>Height Units</Text>
          <View style={s.chipsRow}>
            <Chip
              text="in"
              active={hUnits === "in"}
              onPress={() => {
                setUnits(wUnits as any, "in");
                setHUnits("in");
              }}
              accent={ACCENT}
            />
            <Chip
              text="cm"
              active={hUnits === "cm"}
              onPress={() => {
                setUnits(wUnits as any, "cm");
                setHUnits("cm");
              }}
              accent={ACCENT}
            />
          </View>
        </Pressable>

        {/* ===== BOTTOM: Edit Inputs ===== */}
        <Pressable style={[s.card, s.full, { backgroundColor: CARD_BG, borderColor: BORDER }]} onPress={Keyboard.dismiss}>
          {/* Starting Weight */}
          <Text style={s.label}>Starting Weight ({wUnits})</Text>
          <TextInput
            value={startW}
            onChangeText={(t) => {
              setStartW(t);
              const n = Number(t);
              if (!Number.isNaN(n)) setStartingWeightKg(wUnits === "lb" ? lbToKg(n) : n);
            }}
            placeholder={wUnits === "lb" ? "e.g. 200" : "e.g. 91"}
            keyboardType="numeric"
            returnKeyType="done"
            onSubmitEditing={Keyboard.dismiss}
            style={s.input}
          />

          {/* Goal weight + date (for lose / gain) */}
          {!isMaintain && (
            <>
              <Text style={[s.label, { marginTop: 16 }]}>Goal Weight ({wUnits})</Text>
              <TextInput
                value={goalW}
                onChangeText={(t) => {
                  setGoalW(t);
                  const n = Number(t);
                  if (!Number.isNaN(n)) setGoalWeightKg(wUnits === "lb" ? lbToKg(n) : n);
                }}
                placeholder={wUnits === "lb" ? "e.g. 170" : "e.g. 77"}
                keyboardType="numeric"
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
                style={s.input}
              />

              <Text style={[s.label, { marginTop: 16 }]}>Desired End Date (optional)</Text>
              <TextInput
                value={targetDateISO ?? ""}
                onChangeText={(s) => setTargetDateISO(s.trim() === "" ? undefined : s)}
                placeholder="YYYY-MM-DD"
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
                style={s.input}
              />
            </>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ---------- Small UI bits ---------- */

function cap(s: string) {
  return s.slice(0, 1).toUpperCase() + s.slice(1);
}

function Chip({
  text,
  active,
  onPress,
  accent,
}: {
  text: string;
  active?: boolean;
  onPress: () => void;
  accent: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        chipStyles.base,
        {
          backgroundColor: active ? accent : "#ffffff",
          borderColor: active ? accent : "#e5e7eb",
        },
      ]}
      android_ripple={{ color: "#00000010" }}
    >
      <Text style={[chipStyles.text, { color: active ? "#ffffff" : "#111827" }]}>{text}</Text>
    </Pressable>
  );
}

function Tile({
  title,
  value,
  sub,
  BORDER,
  CARD_BG,
  TEXT,
}: {
  title: string;
  value: string;
  sub?: string;
  BORDER: string;
  CARD_BG: string;
  TEXT: string;
}) {
  return (
    <View style={[tileStyles.card, { backgroundColor: CARD_BG, borderColor: BORDER }]}>
      <Text style={[tileStyles.title, { color: TEXT }]}>{title}</Text>
      <Text style={[tileStyles.value, { color: TEXT }]}>{value}</Text>
      {sub ? <Text style={tileStyles.sub}>{sub}</Text> : null}
    </View>
  );
}

/* ---------- Styles ---------- */

const s = StyleSheet.create({
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

  label: { fontSize: 14, color: "#6b7280", fontWeight: "600" },

  chipsRow: { flexDirection: "row", gap: 10, marginTop: 8 },
  chipsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 8 },

  tilesWrap: {
    paddingHorizontal: 20,
    marginBottom: 8,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  input: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
});

const chipStyles = StyleSheet.create({
  base: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  text: { fontSize: 14, fontWeight: "600" },
});

const tileStyles = StyleSheet.create({
  card: {
    width: "48%",
    marginBottom: 12,
    minHeight: 94,
    justifyContent: "center",
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  title: { fontSize: 16, fontWeight: "600" },
  value: { fontSize: 26, fontWeight: "800", marginTop: 4 },
  sub: { fontSize: 12, color: "#6b7280", marginTop: 2 },
});
