// app/screens/Goals/Index.tsx
import DateTimePicker from "@react-native-community/datetimepicker";
import { useFocusEffect } from "@react-navigation/native";
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
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Button from "../../components/ui/Button";
import { Toast } from "../../components/ui/Toast";
import { computeDailyTarget, kgToLb, lbToKg } from "../../lib/calorieMath";
import { UserDataService } from "../../lib/userDataService";
import { useAuthStore } from "../../state/authStore";
import { useGoalStore } from "../../state/goalStore";
import { useLogStore } from "../../state/logStore";
import { useProfileStore } from "../../state/profileStore";

export default function Goals() {
  const { profile, setActivity, setUnits, setStartingWeightKg } = useProfileStore();
  const {
    mode,
    goalWeightKg,
    targetDateISO,
    dailyTargetOverride,
    setMode,
    setGoalWeightKg,
    setTargetDateISO,
    setDailyTargetOverride,
  } = useGoalStore();
  const { logs } = useLogStore();
  const { user } = useAuthStore();
  const scrollRef = React.useRef<ScrollView | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      const timeout = setTimeout(() => {
        scrollRef.current?.scrollTo({ y: 0, animated: false });
      }, 0);

      return () => clearTimeout(timeout);
    }, [])
  );

  // ===== UNITS / DISPLAY HELPERS =====
  const [hUnits, setHUnits] = useState(profile.heightUnit ?? "in");
  const [wUnits, setWUnits] = useState(profile.weightUnit ?? "lb");
  const unitSuffix = wUnits === "kg" ? "kgs" : "lbs";

  const round1 = (n: number) => Math.round(n * 10) / 10;
  const smart1 = (n: number) => {
    const r = round1(n);
    return Number.isInteger(r) ? String(r) : r.toFixed(1);
  };

  const fmtWeight = (kg?: number | null) => {
    if (kg == null) return "—";
    const v = wUnits === "kg" ? kg : kgToLb(kg);
    return `${smart1(v)} ${unitSuffix}`;
  };

  const numberForInput = (kg?: number | null) => {
    if (kg == null) return "";
    const v = wUnits === "kg" ? kg : kgToLb(kg);
    return smart1(v);
  };

  // ===== INPUT STATE =====
  const [goalW, setGoalW] = useState(numberForInput(goalWeightKg));
  const [startW, setStartW] = useState(numberForInput(profile.startingWeightKg));

  const [lastValidGoalW, setLastValidGoalW] = useState(numberForInput(goalWeightKg));
  const [lastValidStartW, setLastValidStartW] = useState(numberForInput(profile.startingWeightKg));

  const [goalErr, setGoalErr] = useState<string | null>(null);
  const [startErr, setStartErr] = useState<string | null>(null);

  // ===== MANUAL TARGET INPUT STATE =====
  const [manualTarget, setManualTarget] = useState(
    dailyTargetOverride != null ? String(Math.round(dailyTargetOverride)) : ""
  );
  const [manualTargetErr, setManualTargetErr] = useState<string | null>(null);

  // Re-sync when units / weights change
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

  // Re-sync manual target when store changes
  useEffect(() => {
    setManualTarget(
      dailyTargetOverride != null ? String(Math.round(dailyTargetOverride)) : ""
    );
    setManualTargetErr(null);
  }, [dailyTargetOverride]);

  // ===== VALIDATION HELPERS =====
  const partialOK = (s: string) => /^\d{0,3}(\.\d?)?$/.test(s);
  
  // Basic range validation based on weight unit
  const getWeightRange = () => {
    if (wUnits === "kg") {
      return { min: 30, max: 300 }; // kg range
    } else {
      return { min: 66, max: 661 }; // lb range (roughly 30-300 kg)
    }
  };
  
  const finalOK = (s: string) => {
    if (!/^\d{2,3}(\.\d)?$/.test(s)) return false;
    const n = Number(s);
    const { min, max } = getWeightRange();
    return n >= min && n <= max;
  };

  const toKgFromInput = (s: string) => {
    const n = Number(s);
    return wUnits === "lb" ? lbToKg(n) : n;
  };

  // Goal weight validation based on mode
  const validateGoalWeight = (goalWeightStr: string, startWeightStr: string): string | null => {
    if (!finalOK(goalWeightStr)) {
      const { min, max } = getWeightRange();
      return `Enter ${min}–${max} ${wUnits} with up to 1 decimal (e.g., ${wUnits === "kg" ? "70" : "150"} or ${wUnits === "kg" ? "70.5" : "150.5"}).`;
    }

    const goalNum = Number(goalWeightStr);
    const startNum = Number(startWeightStr);

    if (mode === "lose" && goalNum >= startNum) {
      return `Goal weight must be less than starting weight (${startNum} ${wUnits}) for weight loss.`;
    }

    if (mode === "gain" && goalNum <= startNum) {
      return `Goal weight must be more than starting weight (${startNum} ${wUnits}) for weight gain.`;
    }

    return null;
  };

  // Starting weight validation
  const validateStartWeight = (startWeightStr: string): string | null => {
    if (!finalOK(startWeightStr)) {
      const { min, max } = getWeightRange();
      return `Enter ${min}–${max} ${wUnits} with up to 1 decimal (e.g., ${wUnits === "kg" ? "70" : "150"} or ${wUnits === "kg" ? "70.5" : "150.5"}).`;
    }
    return null;
  };

  const applyStartWeight = (s: string) => setStartingWeightKg(toKgFromInput(s));
  const applyGoalWeight = (s: string) => setGoalWeightKg(toKgFromInput(s));

  // Manual target kcal validation
  const MIN_TARGET = 1000;
  const partialTargetOK = (s: string) => /^\d{0,4}$/.test(s);
  const finalTargetOK = (s: string) => {
    if (!/^\d{3,4}$/.test(s)) return false;
    const n = Number(s);
    return n >= MIN_TARGET;
  };

  // ===== CURRENT WEIGHT RESOLUTION =====
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

  const rawTarget = typeof target === "number" ? target : 0;

  const isAutoTargetBelowMin =
    Number.isFinite(rawTarget) && rawTarget < MIN_TARGET;

  const safeTargetRaw = Number.isFinite(rawTarget) ? rawTarget : MIN_TARGET;

  const autoTargetDisplayNumber = Math.round(
    isAutoTargetBelowMin ? MIN_TARGET : safeTargetRaw
  );

  // manual override (from store) wins; always clamp to >= MIN_TARGET
  const effectiveTargetKcal =
    dailyTargetOverride != null && Number.isFinite(dailyTargetOverride)
      ? Math.round(Math.max(MIN_TARGET, dailyTargetOverride))
      : autoTargetDisplayNumber;

  const manualBelowMin =
    dailyTargetOverride != null && dailyTargetOverride < MIN_TARGET;

  const targetWarning =
    isAutoTargetBelowMin || manualBelowMin
      ? "This is the minimum required for sustainable weight loss."
      : undefined;

  // ===== DERIVED TILE METRICS =====
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

  const goalWeightDisplay = goalWeightKg != null ? fmtWeight(goalWeightKg) : undefined;

  // ===== DAYS LEFT (end date OR kcal math fallback) =====
  const maintKcal = typeof maintenance === "number" ? maintenance : undefined;

  let daysLeft: number | undefined;
  let daysLeftSub: string | undefined;

  if (!isMaintain && goalWeightKg != null) {
    if (hasEndDate && typeof daysRemaining === "number") {
      daysLeft = daysRemaining;
      daysLeftSub = dayjs(targetDateISO!).format("MMM D, YYYY");
    } else if (!hasEndDate && maintKcal != null && Number.isFinite(maintKcal)) {
      const maintRounded = Math.round(maintKcal);

      if (mode === "lose") {
        const deficit = maintRounded - effectiveTargetKcal; // positive if target < maintenance
        const diffKg = currentWeightKg - goalWeightKg; // >0 if weight to lose
        if (deficit > 0 && diffKg > 0) {
          const lbsToLose = kgToLb(diffKg);
          const totalKcal = lbsToLose * 3500;
          daysLeft = Math.max(1, Math.ceil(totalKcal / deficit));
          daysLeftSub = `${smart1(lbsToLose)} lbs @ ${deficit} kcal/day`;
        }
      } else if (mode === "gain") {
        const surplus = effectiveTargetKcal - maintRounded; // positive if target > maintenance
        const diffKg = goalWeightKg - currentWeightKg; // >0 if weight to gain
        if (surplus > 0 && diffKg > 0) {
          const lbsToGain = kgToLb(diffKg);
          const totalKcal = lbsToGain * 3500;
          daysLeft = Math.max(1, Math.ceil(totalKcal / surplus));
          daysLeftSub = `${smart1(lbsToGain)} lbs @ ${surplus} kcal/day`;
        }
      }
    }
  }

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

  const kcal = (n?: number) =>
    typeof n === "number" ? `${Math.round(n)} kcal` : "—";

  const maintenanceDisplay = kcal(maintenance);

  const scrollToBottom = () => {
    scrollRef.current?.scrollTo({ y: 9999, animated: true });
  };

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: BG }]}>
      <ScrollView
        ref={scrollRef}
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
          <Tile
            title="Maintenance"
            value={maintenanceDisplay}
            BORDER={BORDER}
            CARD_BG={CARD_BG}
            TEXT={TEXT}
          />
          <Tile
            title="Target"
            value={`${effectiveTargetKcal} kcal`}
            warning={targetWarning}
            BORDER={BORDER}
            CARD_BG={CARD_BG}
            TEXT={TEXT}
          />

          <Tile
            title="Current Weight"
            value={fmtWeight(currentWeightKg)}
            BORDER={BORDER}
            CARD_BG={CARD_BG}
            TEXT={TEXT}
          />
          <Tile
            title="Starting Weight"
            value={fmtWeight(profile.startingWeightKg)}
            BORDER={BORDER}
            CARD_BG={CARD_BG}
            TEXT={TEXT}
          />

          {goalWeightDisplay && (
            <Tile
              title="Goal Weight"
              value={goalWeightDisplay}
              BORDER={BORDER}
              CARD_BG={CARD_BG}
              TEXT={TEXT}
            />
          )}

          {!isMaintain && weightLeftDisplay != null && (
            <Tile
              title="Weight Left"
              value={weightLeftDisplay}
              BORDER={BORDER}
              CARD_BG={CARD_BG}
              TEXT={TEXT}
            />
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

          {!isMaintain && goalWeightKg != null && daysLeft != null && (
            <Tile
              title="Days Left"
              value={String(daysLeft)}
              sub={daysLeftSub}
              BORDER={BORDER}
              CARD_BG={CARD_BG}
              TEXT={TEXT}
            />
          )}
        </View>

        {/* ===== MIDDLE: Edit Inputs ===== */}
        <Pressable
          style={[s.card, s.full, { backgroundColor: CARD_BG, borderColor: BORDER }]}
          onPress={Keyboard.dismiss}
        >
          {/* Starting Weight */}
          <Text style={s.label}>Starting Weight ({wUnits})</Text>
          <TextInput
            value={startW}
            onChangeText={(t) => {
              if (partialOK(t)) {
                setStartW(t);
              }
              if (startErr) setStartErr(null);
            }}
            onEndEditing={() => {
              if (startW.trim() === "") {
                setStartW(lastValidStartW);
                setStartErr(null);
                return;
              }
              const error = validateStartWeight(startW);
              if (!error) {
                applyStartWeight(startW);
                setLastValidStartW(startW);
                setStartErr(null);
                setHasUnsavedChanges(true);
                
                // Re-validate goal weight if it exists
                if (!isMaintain && goalW.trim() !== "") {
                  const goalError = validateGoalWeight(goalW, startW);
                  setGoalErr(goalError);
                }
              } else {
                setStartErr(error);
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
                  const error = validateGoalWeight(goalW, startW);
                  if (!error) {
                    applyGoalWeight(goalW);
                    setLastValidGoalW(goalW);
                    setGoalErr(null);
                    setHasUnsavedChanges(true);
                  } else {
                    setGoalErr(error);
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
                <Text
                  style={{
                    fontSize: 16,
                    color: targetDateISO ? "#0f172a" : "#6b7280",
                    textAlign: "center",
                  }}
                >
                  {targetDateISO ? prettyEndDate : "select date"}
                </Text>
              </Pressable>

              {/* Picker Modal - Different handling for iOS vs Android */}
              {Platform.OS === "ios" ? (
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
                      <Text style={[modalStyles.title, { color: "#0f172a" }]}>
                        Choose your end date
                      </Text>

                      <View style={[modalStyles.pickerBox, { borderColor: BORDER }]}>
                        <DateTimePicker
                          mode="date"
                          value={tempDate ?? minSelectable}
                          minimumDate={minSelectable}
                          display="inline"
                          onChange={(_e, date) => {
                            if (date && dayjs(date).isAfter(today, "day")) {
                              setTempDate(date);
                            }
                          }}
                          themeVariant="light"
                          style={modalStyles.picker}
                        />
                      </View>

                      <View style={modalStyles.actions}>
                        <TouchableOpacity
                          onPress={() => {
                            setTempDate(null);
                            setTargetDateISO(undefined);
                            setHasUnsavedChanges(true);
                            closePicker();
                          }}
                          style={[modalStyles.linkBtn, { borderColor: BORDER }]}
                        >
                          <Text style={modalStyles.linkText}>No End Date</Text>
                        </TouchableOpacity>

                        <Pressable
                          onPress={() => {
                            if (tempDate) {
                              setTargetDateISO(
                                dayjs(tempDate).format("YYYY-MM-DD")
                              );
                              setHasUnsavedChanges(true);
                            }
                            closePicker();
                          }}
                          style={({ pressed }) => [
                            modalStyles.cta,
                            {
                              backgroundColor: "#5eada8",
                              opacity: pressed ? 0.9 : 1,
                            },
                          ]}
                        >
                          <Text style={modalStyles.ctaText}>Save date</Text>
                        </Pressable>
                      </View>
                    </Pressable>
                  </Pressable>
                </Modal>
              ) : (
                /* Android: DateTimePicker has its own native modal */
                showPicker && (
                  <DateTimePicker
                    mode="date"
                    value={tempDate ?? minSelectable}
                    minimumDate={minSelectable}
                    display="calendar"
                    onChange={(_e, date) => {
                      setShowPicker(false);
                      if (date && dayjs(date).isAfter(today, "day")) {
                        setTempDate(date);
                        setTargetDateISO(dayjs(date).format("YYYY-MM-DD"));
                        setHasUnsavedChanges(true);
                      }
                    }}
                    onTouchCancel={() => setShowPicker(false)}
                  />
                )
              )}

              {/* Manual daily target override */}
              <Text style={[s.label, { marginTop: 16 }]}>
                Daily Target Calories (optional)
              </Text>
              <TextInput
                value={manualTarget}
                onChangeText={(t) => {
                  if (partialTargetOK(t)) {
                    setManualTarget(t);
                  }
                  if (manualTargetErr) setManualTargetErr(null);
                }}
                onEndEditing={() => {
                  const trimmed = manualTarget.trim();
                  if (trimmed === "") {
                    // Clear override
                    setManualTarget("");
                    setDailyTargetOverride(undefined);
                    setManualTargetErr(null);
                    setHasUnsavedChanges(true);
                    return;
                  }
                  if (finalTargetOK(trimmed)) {
                    const n = Number(trimmed);
                    setDailyTargetOverride(n);
                    setManualTargetErr(null);
                    setHasUnsavedChanges(true);
                  } else {
                    setManualTargetErr(
                      `Enter at least ${MIN_TARGET} kcal (e.g. 1700).`
                    );
                  }
                }}
                onFocus={scrollToBottom}
                placeholder="e.g. 2300"
                keyboardType="number-pad"
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
                style={[
                  s.input,
                  manualTargetErr ? { borderColor: ERROR } : null,
                ]}
              />
              {manualTargetErr ? (
                <Text style={s.errText}>{manualTargetErr}</Text>
              ) : null}
            </>
          )}
        </Pressable>

        {/* ===== BOTTOM: Mode, Activity, Units ===== */}
        <Pressable
          style={[s.card, s.full, { backgroundColor: CARD_BG, borderColor: BORDER }]}
          onPress={Keyboard.dismiss}
        >
          <Text style={s.label}>Mode</Text>
          <View style={s.chipsRow}>
            {(["lose", "maintain", "gain"] as const).map((m) => (
              <Chip key={m} text={cap(m)} active={mode === m} onPress={() => { setMode(m); setHasUnsavedChanges(true); }} accent={ACCENT} />
            ))}
          </View>

          <Text style={[s.label, { marginTop: 18 }]}>Activity Level</Text>
          <View style={s.chipsWrap}>
            {(["sedentary", "light", "moderate", "high"] as const).map((a) => (
              <Chip key={a} text={cap(a)} active={profile.activityLevel === a} onPress={() => { setActivity(a); setHasUnsavedChanges(true); }} accent={ACCENT} />
            ))}
          </View>

          <Text style={[s.label, { marginTop: 18 }]}>Weight Units</Text>
          <View style={s.chipsRow}>
            <Chip
              text="lb"
              active={wUnits === "lb"}
              onPress={() => {
                setWUnits("lb");
                setUnits("lb", hUnits as any);
                setHasUnsavedChanges(true);
              }}
              accent={ACCENT}
            />
            <Chip
              text="kg"
              active={wUnits === "kg"}
              onPress={() => {
                setWUnits("kg");
                setUnits("kg", hUnits as any);
                setHasUnsavedChanges(true);
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
                setHUnits("in");
                setUnits(wUnits as any, "in");
                setHasUnsavedChanges(true);
              }}
              accent={ACCENT}
            />
            <Chip
              text="cm"
              active={hUnits === "cm"}
              onPress={() => {
                setHUnits("cm");
                setUnits(wUnits as any, "cm");
                setHasUnsavedChanges(true);
              }}
              accent={ACCENT}
            />
          </View>
        </Pressable>

        {/* Save Changes Button - Only show when there are unsaved changes */}
        {hasUnsavedChanges && (
          <View style={[s.full, { marginTop: 24, marginBottom: 16 }]}>
            <Button
              title="Save Changes"
              onPress={async () => {
                if (!user?.uid) {
                  setToastMessage("You must be logged in to save changes.");
                  setToastType("error");
                  setToastVisible(true);
                  return;
                }

                setIsSyncing(true);
                try {
                  await UserDataService.syncToFirestore(user.uid);
                  setToastMessage("Your goals have been saved!");
                  setToastType("success");
                  setToastVisible(true);
                  setHasUnsavedChanges(false);
                } catch (error) {
                  console.error("Failed to sync goals:", error);
                  setToastMessage("Failed to save changes. Please try again.");
                  setToastType("error");
                  setToastVisible(true);
                } finally {
                  setIsSyncing(false);
                }
              }}
              variant="primary"
              loading={isSyncing}
              disabled={isSyncing}
              accentColor={ACCENT}
              style={{
                paddingVertical: 16,
                borderRadius: 16,
                shadowColor: "#000",
                shadowOpacity: 0.1,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 4 },
                elevation: 3,
              }}
            />
          </View>
        )}
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
  warning,
  BORDER,
  CARD_BG,
  TEXT,
}: {
  title: string;
  value: string;
  sub?: string;
  warning?: string;
  BORDER: string;
  CARD_BG: string;
  TEXT: string;
}) {
  return (
    <View style={[tileStyles.card, { backgroundColor: CARD_BG, borderColor: BORDER }]}>
      <Text style={[tileStyles.title, { color: TEXT }]}>{title}</Text>
      <Text style={[tileStyles.value, { color: TEXT }]}>{value}</Text>
      {sub ? <Text style={tileStyles.sub}>{sub}</Text> : null}
      {warning ? <Text style={tileStyles.warning}>{warning}</Text> : null}
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
  warning: {
    fontSize: 11,
    color: "#ef4444",
    marginTop: 4,
  },
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
