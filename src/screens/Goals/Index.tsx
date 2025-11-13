// app/screens/Goals/Index.tsx
import DateTimePicker from "@react-native-community/datetimepicker";
import dayjs from "dayjs";
import React, { useEffect, useMemo, useState } from "react";
import {
  Keyboard,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { computeDailyTarget, kgToLb, lbToKg } from "../../lib/calorieMath";
import { useGoalStore } from "../../state/goalStore";
import { useLogStore } from "../../state/logStore";
import { useProfileStore } from "../../state/profileStore";

export default function Goals() {
  const { profile, setActivity, setUnits, setStartingWeightKg } = useProfileStore();
  const { mode, goalWeightKg, targetDateISO, setMode, setGoalWeightKg, setTargetDateISO } = useGoalStore();
  const { logs } = useLogStore();

  // ===== UNITS / DISPLAY HELPERS =====
  const [hUnits, setHUnits] = useState(profile.heightUnit ?? "in");
  const [wUnits, setWUnits] = useState(profile.weightUnit ?? "lb");
  const unitSuffix = wUnits === "kg" ? "kg" : "lb";

  const round1 = (n: number) => Math.round(n * 10) / 10;
  // show 1 decimal only if needed (e.g., 250 -> "250", 250.2 -> "250.2")
  const smart1 = (n: number) => {
    const r = round1(n);
    return Number.isInteger(r) ? String(r) : r.toFixed(1);
  };

  const fmtWeight = (kg?: number | null) => {
    if (kg == null) return "—";
    const v = wUnits === "kg" ? kg : kgToLb(kg);
    return `${smart1(v)} ${unitSuffix}`;
  };

  // used only to prefill the text inputs from store values
  const numberForInput = (kg?: number | null) => {
    if (kg == null) return "";
    const v = wUnits === "kg" ? kg : kgToLb(kg);
    return smart1(v);
  };

  // ===== INPUT STATE =====
  const [goalW, setGoalW] = useState(numberForInput(goalWeightKg));
  const [startW, setStartW] = useState(numberForInput(profile.startingWeightKg));

  // last saved valid values (for optional revert-to-valid behavior if you want)
  const [lastValidGoalW, setLastValidGoalW] = useState(numberForInput(goalWeightKg));
  const [lastValidStartW, setLastValidStartW] = useState(numberForInput(profile.startingWeightKg));

  // error flags
  const [goalErr, setGoalErr] = useState<string | null>(null);
  const [startErr, setStartErr] = useState<string | null>(null);

  // Re-sync inputs when units or store values change
  useEffect(() => {
    const g = numberForInput(goalWeightKg);
    const s = numberForInput(profile.startingWeightKg);
    setGoalW(g);
    setLastValidGoalW(g);
    setGoalErr(null);

    setStartW(s);
    setLastValidStartW(s);
    setStartErr(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wUnits, goalWeightKg, profile.startingWeightKg]);

  // ===== VALIDATION HELPERS =====
  // Partial while-typing: up to 3 digits, optional dot + 1 decimal, or empty
  const partialOK = (s: string) => /^\d{0,3}(\.\d?)?$/.test(s);

  // Final on blur: 2–3 digits, optional 1 decimal, and in range 50–999
  const finalOK = (s: string) => /^\d{2,3}(\.\d)?$/.test(s) && Number(s) >= 50 && Number(s) <= 999;

  const toKgFromInput = (s: string) => {
    const n = Number(s);
    return wUnits === "lb" ? lbToKg(n) : n;
  };

  const applyStartWeight = (s: string) => setStartingWeightKg(toKgFromInput(s));
  const applyGoalWeight = (s: string) => setGoalWeightKg(toKgFromInput(s));

  // ===== CURRENT WEIGHT RESOLUTION (match Dashboard) =====
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
    (profile.startingWeightKg ?? profile.currentWeightKg ?? 0);

  // ===== CALORIE MATH =====
  const { maintenance, target } = useMemo(
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

  // ===== DERIVED TILE METRICS (smart 1-decimal) =====
  const isMaintain = mode === "maintain";

  const weightLeftDisplay =
    !isMaintain && goalWeightKg != null
      ? (() => {
        const diffKg = currentWeightKg - goalWeightKg;
        const left = wUnits === "kg" ? Math.abs(diffKg) : Math.abs(kgToLb(diffKg));
        return `${smart1(Math.max(0, left))} ${unitSuffix}`;
      })()
      : undefined;

  const hasStart = profile.startingWeightKg != null;
  const { deltaTitle, deltaDisplay } =
    hasStart && currentWeightKg != null
      ? (() => {
        const diffKg = currentWeightKg - (profile.startingWeightKg as number);
        const val = wUnits === "kg" ? diffKg : kgToLb(diffKg);
        const r = round1(val);
        const title = r < 0 ? "Weight Lost" : r > 0 ? "Weight Gained" : "Weight Change";
        const display = `${r > 0 ? "+" : ""}${smart1(r)} ${unitSuffix}`;
        return { deltaTitle: title, deltaDisplay: display };
      })()
      : { deltaTitle: undefined, deltaDisplay: undefined };

  const today = dayjs().startOf("day");
  const hasEndDate = !!targetDateISO;
  const daysRemaining = hasEndDate
    ? Math.max(0, dayjs(targetDateISO!).startOf("day").diff(today, "day"))
    : undefined;

  // ===== DATE PICKER STATE =====
  const [showPicker, setShowPicker] = useState(false);
  const [tempDate, setTempDate] = useState<Date | null>(targetDateISO ? dayjs(targetDateISO).toDate() : null);

  const minSelectable = today.add(1, "day").toDate();

  const prettyEndDate = targetDateISO ? dayjs(targetDateISO).format("MMMM D, YYYY") : "";
  const openPicker = () => {
    Keyboard.dismiss();
    setShowPicker(true);
  };
  const closePicker = () => setShowPicker(false);

  // ===== THEME TOKENS =====
  const ACCENT = "#5eada8";
  const TEXT = "#0f172a";
  const BG = "#f7f7f7";
  const CARD_BG = "#ffffff";
  const BORDER = "#eef2f7";
  const ERROR = "#ef4444";

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

          <Tile title="Current Weight" value={fmtWeight(currentWeightKg)} BORDER={BORDER} CARD_BG={CARD_BG} TEXT={TEXT} />
          <Tile title="Starting Weight" value={fmtWeight(profile.startingWeightKg)} BORDER={BORDER} CARD_BG={CARD_BG} TEXT={TEXT} />

          {!isMaintain && weightLeftDisplay != null && (
            <Tile title="Weight Left" value={weightLeftDisplay} BORDER={BORDER} CARD_BG={CARD_BG} TEXT={TEXT} />
          )}

          {deltaDisplay != null && (
            <Tile
              title={deltaTitle!}
              value={deltaDisplay!}
              sub="vs start"
              BORDER={BORDER}
              CARD_BG={CARD_BG}
              TEXT={TEXT}
            />
          )}

          {!isMaintain && hasEndDate && (
            <Tile
              title="Days to Go"
              value={String(daysRemaining)}
              sub={dayjs(targetDateISO!).format("MMM D, YYYY")}
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
              // allow in-progress typing; block characters that break partial pattern
              if (partialOK(t)) {
                setStartW(t);
              }
              // don't save to store here
              if (startErr) setStartErr(null); // clear live error as user types
            }}
            onEndEditing={() => {
              // empty: restore last saved valid UI value
              if (startW.trim() === "") {
                setStartW(lastValidStartW);
                setStartErr(null);
                return;
              }
              if (finalOK(startW)) {
                applyStartWeight(startW);
                setLastValidStartW(startW);
                setStartErr(null);
              } else {
                // invalid: keep what user typed, do not save, show error
                setStartErr("Enter 50–999 with up to 1 decimal (e.g., 150 or 150.5).");
              }
            }}
            placeholder={wUnits === "lb" ? "e.g. 200" : "e.g. 91"}
            keyboardType="decimal-pad"
            returnKeyType="done"
            onSubmitEditing={Keyboard.dismiss}
            style={[
              s.input,
              startErr ? { borderColor: ERROR } : null,
            ]}
          />
          {startErr ? <Text style={[s.errText]}>{startErr}</Text> : null}

          {/* Goal weight + date (for lose / gain) */}
          {!isMaintain && (
            <>
              <Text style={[s.label, { marginTop: 16 }]}>Goal Weight ({wUnits})</Text>
              <TextInput
                value={goalW}
                onChangeText={(t) => {
                  if (partialOK(t)) {
                    setGoalW(t);
                  }
                  if (goalErr) setGoalErr(null);
                }}
                onEndEditing={() => {
                  if (goalW.trim() === "") {
                    setGoalW(lastValidGoalW);
                    setGoalErr(null);
                    return;
                  }
                  if (finalOK(goalW)) {
                    applyGoalWeight(goalW);
                    setLastValidGoalW(goalW);
                    setGoalErr(null);
                  } else {
                    setGoalErr("Enter 50–999 with up to 1 decimal (e.g., 170 or 170.5).");
                  }
                }}
                placeholder={wUnits === "lb" ? "e.g. 170" : "e.g. 77"}
                keyboardType="decimal-pad"
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
                style={[
                  s.input,
                  goalErr ? { borderColor: ERROR } : null,
                ]}
              />
              {goalErr ? <Text style={s.errText}>{goalErr}</Text> : null}

              <Text style={[s.label, { marginTop: 16 }]}>Desired End Date (optional)</Text>

              {/* Display field that opens the picker */}
              <Pressable onPress={openPicker} style={[s.input, { justifyContent: "center" }]}>
                <Text style={{ fontSize: 16, color: targetDateISO ? "#0f172a" : "#6b7280", textAlign: "center" }}>
                  {targetDateISO ? prettyEndDate : "select date (optional)"}
                </Text>
              </Pressable>

              {/* Picker Modal (tap backdrop to close) */}
              <Modal
                animationType="fade"
                transparent
                visible={showPicker}
                onRequestClose={closePicker}
                presentationStyle="overFullScreen"
              >
                <Pressable style={modalStyles.backdrop} onPress={closePicker}>
                  <Pressable
                    style={[modalStyles.card, { backgroundColor: CARD_BG, borderColor: BORDER }]}
                    onPress={(e) => e.stopPropagation()}
                  >
                    <Text style={[modalStyles.title, { color: "#0f172a" }]}>Choose your end date</Text>

                    <View style={[modalStyles.pickerBox, { borderColor: BORDER }]}>
                      <DateTimePicker
                        mode="date"
                        value={tempDate ?? minSelectable}
                        minimumDate={minSelectable}
                        display={
                          Platform.select({
                            ios: "inline",
                            android: "calendar",
                            default: "calendar",
                          }) as any
                        }
                        onChange={(_e, date) => {
                          if (date && dayjs(date).isAfter(today, "day")) {
                            setTempDate(date);
                            if (Platform.OS === "android") setShowPicker(false);
                          }
                        }}
                        themeVariant="light"
                        style={modalStyles.picker}
                      />
                    </View>

                    {/* Actions */}
                    <View style={modalStyles.actions}>
                      <TouchableOpacity
                        onPress={() => {
                          setTempDate(null);
                          setTargetDateISO(undefined);
                          closePicker();
                        }}
                        style={[modalStyles.linkBtn, { borderColor: BORDER }]}
                      >
                        <Text style={modalStyles.linkText}>Choose date later</Text>
                      </TouchableOpacity>

                      <Pressable
                        onPress={() => {
                          if (tempDate) {
                            setTargetDateISO(dayjs(tempDate).format("YYYY-MM-DD"));
                          }
                          closePicker();
                        }}
                        style={({ pressed }) => [
                          modalStyles.cta,
                          { backgroundColor: "#5eada8", opacity: pressed ? 0.9 : 1 },
                        ]}
                      >
                        <Text style={modalStyles.ctaText}>Save date</Text>
                      </Pressable>
                    </View>
                  </Pressable>
                </Pressable>
              </Modal>
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

  errText: {
    marginTop: 6,
    color: "#ef4444",
    fontSize: 12,
    fontWeight: "600",
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

const modalStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  card: {
    width: "92%",
    maxWidth: 360,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: "stretch",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },
  pickerBox: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: "hidden",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  picker: {
    width: "100%",
    transform: Platform.select({
      ios: [{ scale: 0.98 }],
      android: [{ scale: 0.95 }],
      default: [{ scale: 0.95 }],
    }) as any,
  },
  actions: {
    marginTop: 12,
    gap: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  linkBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  linkText: { fontSize: 14, fontWeight: "600", color: "#6b7280" },
  cta: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
