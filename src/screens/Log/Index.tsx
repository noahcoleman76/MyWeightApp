import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import dayjs from "dayjs";
import advancedFormat from "dayjs/plugin/advancedFormat";
import React, { useMemo, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import EmptyState from "../../components/ui/EmptyState";
import { kgToLb, lbToKg } from "../../lib/calorieMath";
import { useLogStore } from "../../state/logStore";
import { useProfileStore } from "../../state/profileStore";

dayjs.extend(advancedFormat);

type Draft = { id?: string; dateISO: string; calories: string; weight: string; notes?: string };

const isISODate = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s);

type DatePickerContext = "quick" | "edit" | "jump" | null;
type FilterMode = "all" | "weight" | "calories";

export default function Log() {
  const { logs, add, update, remove } = useLogStore();
  const { profile } = useProfileStore();
  const todayISO = dayjs().format("YYYY-MM-DD");

  // Quick add draft
  const [qa, setQa] = useState<Draft>({
    dateISO: todayISO,
    calories: "",
    weight: "",
    notes: "",
  });

  // Edit draft
  const [edit, setEdit] = useState<Draft | null>(null);

  // Date picker shared state (quick-add, edit, jump-to-date)
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerContext, setDatePickerContext] = useState<DatePickerContext>(null);
  const [tempDate, setTempDate] = useState<Date | null>(null);

  // Filters
  const [filter, setFilter] = useState<FilterMode>("all");

  // Toggle for "Add New Log" card
  const [showAddCard, setShowAddCard] = useState(false);

  // List ref for "jump to date"
  const listRef = useRef<FlatList<any>>(null);

  // Theme tokens
  const ACCENT = "#5eada8";
  const TEXT = "#0f172a";
  const BG = "#f7f7f7";
  const CARD_BG = "#ffffff";
  const BORDER = "#eef2f7";

  // ---- Formatting helpers ----

  const prettyDate = (iso: string) => dayjs(iso).format("MMM Do, YYYY");

  const relativeLabel = (iso: string): string | undefined => {
    const diff = dayjs().startOf("day").diff(dayjs(iso).startOf("day"), "day");
    if (diff === 0) return "Today";
    if (diff === 1) return "Yesterday";
    if (diff > 1 && diff <= 7) return `${diff} days ago`;
    return undefined;
  };

  const formatWeightDisplay = (weightKg?: number) => {
    if (typeof weightKg !== "number") return undefined;
    const isKg = profile.weightUnit === "kg";
    const unit = isKg ? "kg" : "lbs";
    const raw = isKg ? weightKg : kgToLb(weightKg);
    const rounded = Math.round(raw * 10) / 10;
    const text = rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(1);
    return `${text} ${unit}`;
  };

  const formatWeightForInput = (weightKg?: number) => {
    if (typeof weightKg !== "number") return "";
    const isKg = profile.weightUnit === "kg";
    const raw = isKg ? weightKg : kgToLb(weightKg);
    const rounded = Math.round(raw * 10) / 10;
    return rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(1);
  };

  const parseWeightToKg = (raw: string): number | undefined | null => {
    const weightTrim = raw.trim();
    if (!weightTrim) return undefined;

    const n = Number(weightTrim);
    if (Number.isNaN(n)) {
      Alert.alert("Invalid weight", "Please enter a weight like 195 or 195.2.");
      return null;
    }

    const rounded = Math.round(n * 10) / 10;
    const lbs = profile.weightUnit === "kg" ? kgToLb(rounded) : rounded;
    if (lbs < 50 || lbs > 999) {
      Alert.alert("Weight out of range", "Weight must be between 50 and 999 lbs.");
      return null;
    }

    const weightKg = profile.weightUnit === "kg" ? rounded : lbToKg(rounded);
    return weightKg;
  };

  // ---- Annotated log list (year headers, relative labels, trend arrows) ----

  type LogWithMeta = typeof logs[number] & {
    yearLabel?: string | null;
    relative?: string | undefined;
    trend?: "up" | "down" | "flat" | null;
  };

  const annotated: LogWithMeta[] = useMemo(() => {
    const sorted = [...logs].sort((a, b) =>
      a.dateISO === b.dateISO ? (a.id < b.id ? 1 : -1) : a.dateISO < b.dateISO ? 1 : -1
    );

    return sorted.map((entry, index) => {
      const thisYear = dayjs(entry.dateISO).format("YYYY");
      const prev = sorted[index - 1];
      const prevYear = prev ? dayjs(prev.dateISO).format("YYYY") : null;
      const yearLabel = !prev || thisYear !== prevYear ? thisYear : null;

      const rel = relativeLabel(entry.dateISO);

      let trend: "up" | "down" | "flat" | null = null;
      const next = sorted[index + 1];
      if (typeof entry.weightKg === "number" && next && typeof next.weightKg === "number") {
        if (entry.weightKg > next.weightKg) trend = "up";
        else if (entry.weightKg < next.weightKg) trend = "down";
        else trend = "flat";
      }

      return { ...entry, yearLabel, relative: rel, trend };
    });
  }, [logs, profile.weightUnit]);

  const filtered = useMemo(() => {
    return annotated.filter((entry) => {
      if (filter === "all") return true;
      if (filter === "weight") return typeof entry.weightKg === "number";
      if (filter === "calories") return !!entry.calories && entry.calories > 0;
      return true;
    });
  }, [annotated, filter]);

  // ---- Quick add & edit save helpers ----

  const resetQuickAdd = () => {
    setQa({
      dateISO: todayISO,
      calories: "",
      weight: "",
      notes: "",
    });
  };

  const saveQuickAdd = () => {
    if (!isISODate(qa.dateISO)) {
      Alert.alert("Invalid date", "Please use a valid date.");
      return;
    }

    const caloriesTrim = qa.calories.trim();
    const weightTrim = qa.weight.trim();
    const notesTrim = qa.notes?.trim() ?? "";

    if (!caloriesTrim && !weightTrim && !notesTrim) {
      Alert.alert("Add something", "Enter calories, weight, or a note before saving.");
      return;
    }

    const calories = Number(caloriesTrim);
    const weightKgResult = parseWeightToKg(qa.weight);
    if (weightKgResult === null) return;

    add({
      dateISO: qa.dateISO,
      calories: Number.isNaN(calories) ? 0 : calories,
      weightKg: weightKgResult === undefined ? undefined : weightKgResult,
      notes: notesTrim || undefined,
    });

    resetQuickAdd();
    setShowAddCard(false); // auto-hide after successful save
  };

  const saveEdit = () => {
    if (!edit?.id) return;
    if (!isISODate(edit.dateISO)) {
      Alert.alert("Invalid date", "Please use a valid date.");
      return;
    }

    const caloriesTrim = edit.calories.trim();
    const weightTrim = edit.weight.trim();
    const notesTrim = edit.notes?.trim() ?? "";

    if (!caloriesTrim && !weightTrim && !notesTrim) {
      Alert.alert("Add something", "Enter calories, weight, or a note before saving.");
      return;
    }

    const calories = Number(caloriesTrim);
    const weightKgResult = parseWeightToKg(edit.weight);
    if (weightKgResult === null) return;

    update(edit.id!, {
      dateISO: edit.dateISO,
      calories: Number.isNaN(calories) ? 0 : calories,
      weightKg: weightKgResult === undefined ? undefined : weightKgResult,
      notes: notesTrim || undefined,
    });
    setEdit(null);
  };

  // ---- Date picker helpers ----

  const openDatePicker = (ctx: DatePickerContext) => {
    Keyboard.dismiss();
    setDatePickerContext(ctx);

    if (ctx === "quick") {
      setTempDate(dayjs(qa.dateISO).toDate());
    } else if (ctx === "edit" && edit) {
      setTempDate(dayjs(edit.dateISO).toDate());
    } else {
      setTempDate(dayjs().toDate());
    }

    setShowDatePicker(true);
  };

  const closeDatePicker = () => {
    setShowDatePicker(false);
    setDatePickerContext(null);
  };

  const applyPickedDate = () => {
    if (!tempDate) {
      closeDatePicker();
      return;
    }
    const iso = dayjs(tempDate).format("YYYY-MM-DD");

    if (datePickerContext === "jump") {
      const index = filtered.findIndex((e) => e.dateISO === iso);
      if (index >= 0 && listRef.current) {
        listRef.current.scrollToIndex({ index, animated: true });
      } else {
        Alert.alert("No entry found", "There is no log on that date.");
      }
      closeDatePicker();
      return;
    }

    if (datePickerContext === "quick") {
      setQa((prev) => ({ ...prev, dateISO: iso }));
    } else if (datePickerContext === "edit") {
      setEdit((prev) => (prev ? { ...prev, dateISO: iso } : prev));
    }

    closeDatePicker();
  };

  const setTodayInPicker = () => {
    const now = new Date();
    const iso = dayjs(now).format("YYYY-MM-DD");
    setTempDate(now);

    if (datePickerContext === "quick") {
      setQa((prev) => ({ ...prev, dateISO: iso }));
    } else if (datePickerContext === "edit") {
      setEdit((prev) => (prev ? { ...prev, dateISO: iso } : prev));
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      "Delete entry",
      "Are you sure you want to delete this entry?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => remove(id),
        },
      ],
      { cancelable: true }
    );
  };

  const openJumpToDate = () => {
    Keyboard.dismiss();
    setDatePickerContext("jump");
    setTempDate(dayjs().toDate());
    setShowDatePicker(true);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: BG }]}>
      {/* Global Date Picker Modal */}
      <Modal
        visible={showDatePicker}
        transparent
        animationType="fade"
        onRequestClose={closeDatePicker}
        presentationStyle="overFullScreen"
      >
        <Pressable style={dateModalStyles.backdrop} onPress={closeDatePicker}>
          <Pressable
            style={[dateModalStyles.card, { backgroundColor: CARD_BG, borderColor: BORDER }]}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={[dateModalStyles.title, { color: TEXT }]}>
              {datePickerContext === "edit"
                ? "Edit log date"
                : datePickerContext === "jump"
                  ? "Jump to date"
                  : "Choose log date"}
            </Text>

            <View style={[dateModalStyles.pickerBox, { borderColor: BORDER }]}>
              <DateTimePicker
                mode="date"
                value={tempDate ?? dayjs().toDate()}
                display={
                  Platform.select({
                    ios: "inline",
                    android: "calendar",
                    default: "calendar",
                  }) as any
                }
                onChange={(_e, date) => {
                  if (date) setTempDate(date);
                }}
                themeVariant="light"
                style={dateModalStyles.picker}
              />
            </View>

            <View style={dateModalStyles.actions}>
              {datePickerContext !== "jump" && (
                <TouchableOpacity
                  onPress={setTodayInPicker}
                  style={[dateModalStyles.linkBtn, { borderColor: BORDER }]}
                >
                  <Text style={dateModalStyles.linkText}>Use Today</Text>
                </TouchableOpacity>
              )}

              <Pressable
                onPress={applyPickedDate}
                style={({ pressed }) => [
                  dateModalStyles.cta,
                  { backgroundColor: ACCENT, opacity: pressed ? 0.9 : 1 },
                ]}
              >
                <Text style={dateModalStyles.ctaText}>
                  {datePickerContext === "jump" ? "Jump" : "Save date"}
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <FlatList
        ref={listRef}
        data={filtered}
        keyExtractor={(i) => i.id}
        ListHeaderComponent={
          <View>
            {/* Add New Log toggle button (PRIMARY COLOR) */}
            <View style={[styles.full, { marginTop: 16 }]}>
              <Pressable
                style={[
                  styles.addToggleBtn,
                  { backgroundColor: ACCENT, borderColor: ACCENT },
                ]}
                onPress={() => setShowAddCard((prev) => !prev)}
              >
                <Text style={[styles.addToggleText, { color: "#ffffff" }]}>
                  {showAddCard ? "Hide New Log" : "Add New Log +"}
                </Text>
              </Pressable>
            </View>

            {/* Add New Log Card (expandable) */}
            {showAddCard && (
              <View style={[styles.full, { marginTop: 8 }]}>
                <View style={[styles.card, { backgroundColor: CARD_BG, borderColor: BORDER }]}>
                  <Text style={styles.cardTitle}>New Log</Text>

                  {/* Date */}
                  <Text style={styles.label}>Date</Text>
                  <Pressable
                    onPress={() => openDatePicker("quick")}
                    style={[styles.input, { justifyContent: "center" }]}
                  >
                    <Text style={{ fontSize: 16, color: TEXT, textAlign: "center" }}>
                      {prettyDate(qa.dateISO)}
                    </Text>
                  </Pressable>

                  {/* Weight */}
                  <Text style={[styles.label, { marginTop: 12 }]}>
                    Weight ({profile.weightUnit === "kg" ? "kg" : "lbs"}) — optional
                  </Text>
                  <TextInput
                    value={qa.weight}
                    onChangeText={(t) => setQa({ ...qa, weight: t })}
                    keyboardType="numeric"
                    returnKeyType="done"
                    style={styles.input}
                  />

                  {/* Calories */}
                  <Text style={[styles.label, { marginTop: 12 }]}>Calories — optional</Text>
                  <TextInput
                    value={qa.calories}
                    onChangeText={(t) => setQa({ ...qa, calories: t })}
                    keyboardType="numeric"
                    returnKeyType="done"
                    style={styles.input}
                  />

                  {/* Notes */}
                  <Text style={[styles.label, { marginTop: 12 }]}>Notes — optional</Text>
                  <TextInput
                    value={qa.notes}
                    onChangeText={(t) => setQa({ ...qa, notes: t })}
                    multiline
                    style={[styles.input, { height: 80, textAlignVertical: "top" }]}
                  />

                  <View style={{ marginTop: 16, alignItems: "center" }}>
                    <Pressable
                      style={[styles.addBtn, { backgroundColor: ACCENT, width: "100%" }]}
                      onPress={saveQuickAdd}
                    >
                      <Text style={styles.addBtnText}>Save</Text>
                    </Pressable>

                    {/* Cancel under save to collapse form */}
                    <Pressable
                      onPress={() => setShowAddCard(false)}
                      style={{ marginTop: 10 }}
                    >
                      <Text style={styles.mutedLink}>Cancel</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            )}

            {/* History header + filters + jump */}
            <View style={[styles.full, { marginTop: 16, marginBottom: 4 }]}>
              <View style={styles.rowSpace}>
                <Text style={styles.sectionTitle}>History</Text>
                <Pressable onPress={openJumpToDate} hitSlop={8}>
                  <View style={styles.jumpRow}>
                    <Ionicons name="calendar-outline" size={16} color={ACCENT} />
                    <Text style={styles.jumpText}>Jump to date</Text>
                  </View>
                </Pressable>
              </View>

              {/* Filters */}
              <View style={styles.filterRow}>
                {(["all", "weight", "calories"] as FilterMode[]).map((mode) => {
                  const active = filter === mode;
                  const label =
                    mode === "all" ? "All" : mode === "weight" ? "Weight" : "Calories";
                  return (
                    <Pressable
                      key={mode}
                      onPress={() => setFilter(mode)}
                      style={[
                        styles.filterChip,
                        active && { backgroundColor: ACCENT + "22", borderColor: ACCENT },
                      ]}
                    >
                      <Text
                        style={[
                          styles.filterText,
                          active && { color: ACCENT, fontWeight: "700" },
                        ]}
                      >
                        {label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Empty state */}
            {filtered.length === 0 && (
              <View style={[styles.full, { marginTop: 6 }]}>
                <View style={[styles.card, { backgroundColor: CARD_BG, borderColor: BORDER }]}>
                  <EmptyState
                    title="No entries yet"
                    cta="Start by adding today’s calories and weight. You’ll see your progress here."
                    onPress={() => setShowAddCard(true)}
                  />
                </View>
              </View>
            )}
          </View>
        }
        renderItem={({ item }) => {
          const wDisp = formatWeightDisplay(item.weightKg);
          const hasWeight = !!wDisp;
          const hasCalories = !!item.calories && item.calories > 0;
          const isEditing = edit?.id === item.id;

          if (isEditing && edit) {
            return (
              <View style={[styles.full, { marginBottom: 10 }]}>
                <View style={[styles.card, { backgroundColor: CARD_BG, borderColor: BORDER }]}>
                  <Text style={styles.editTitle}>Edit entry</Text>

                  {/* Date */}
                  <Text style={styles.label}>Date</Text>
                  <Pressable
                    onPress={() => openDatePicker("edit")}
                    style={[styles.input, { justifyContent: "center" }]}
                  >
                    <Text style={{ fontSize: 16, color: TEXT, textAlign: "center" }}>
                      {prettyDate(edit.dateISO)}
                    </Text>
                  </Pressable>

                  {/* Weight */}
                  <Text style={[styles.label, { marginTop: 12 }]}>
                    Weight ({profile.weightUnit === "kg" ? "kg" : "lbs"})
                  </Text>
                  <TextInput
                    value={edit.weight}
                    onChangeText={(t) => setEdit({ ...edit, weight: t })}
                    keyboardType="numeric"
                    returnKeyType="done"
                    style={styles.input}
                  />

                  {/* Calories */}
                  <Text style={[styles.label, { marginTop: 12 }]}>Calories</Text>
                  <TextInput
                    value={edit.calories}
                    onChangeText={(t) => setEdit({ ...edit, calories: t })}
                    keyboardType="numeric"
                    returnKeyType="done"
                    style={styles.input}
                  />

                  {/* Notes */}
                  <Text style={[styles.label, { marginTop: 12 }]}>Notes — optional</Text>
                  <TextInput
                    value={edit.notes ?? ""}
                    onChangeText={(t) => setEdit({ ...edit, notes: t })}
                    multiline
                    style={[styles.input, { height: 80, textAlignVertical: "top" }]}
                  />

                  <View style={styles.editActions}>
                    <Pressable onPress={() => setEdit(null)}>
                      <Text style={styles.mutedLink}>Cancel</Text>
                    </Pressable>
                    <Pressable onPress={saveEdit}>
                      <Text style={[styles.link, { color: ACCENT }]}>Save</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            );
          }

          // History card layout:
          // - If both weight + calories: weight (with trend) LEFT, calories RIGHT.
          // - If only one: show it on LEFT (no right side).
          const hasAnyMeta = hasWeight || hasCalories;

          // Left block
          let leftContent: React.ReactNode = null;
          if (hasWeight) {
            leftContent = (
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text style={styles.rowText}>
                  Weight: <Text style={styles.rowStrong}>{wDisp}</Text>
                </Text>
                {item.trend && (
                  <Text style={styles.trend}>
                    {item.trend === "up"
                      ? " ⬆"
                      : item.trend === "down"
                        ? " ⬇"
                        : " →"}
                  </Text>
                )}
              </View>
            );
          } else if (hasCalories) {
            leftContent = (
              <Text style={styles.rowText}>
                Calories: <Text style={styles.rowStrong}>{item.calories ?? 0}</Text>
              </Text>
            );
          }

          // Right block only if both exist
          const rightContent =
            hasWeight && hasCalories ? (
              <Text style={styles.rowText}>
                Calories: <Text style={styles.rowStrong}>{item.calories ?? 0}</Text>
              </Text>
            ) : null;

          return (
            <View style={[styles.full, { marginBottom: 10 }]}>
              {/* Year header */}
              {item.yearLabel && <Text style={styles.yearHeader}>{item.yearLabel}</Text>}

              <TouchableOpacity
                style={[styles.card, { backgroundColor: CARD_BG, borderColor: BORDER }]}
                onPress={() =>
                  setEdit({
                    id: item.id,
                    dateISO: item.dateISO,
                    calories: String(item.calories ?? 0),
                    weight: formatWeightForInput(item.weightKg),
                    notes: item.notes,
                  })
                }
              >
                <View style={styles.rowSpace}>
                  <View>
                    <Text style={styles.rowDate}>{prettyDate(item.dateISO)}</Text>
                    {item.relative && (
                      <Text style={styles.rowSub}>{item.relative}</Text>
                    )}
                  </View>
                  <Pressable onPress={() => handleDelete(item.id)} hitSlop={8}>
                    <Ionicons name="trash-outline" size={18} color="#ef4444" />
                  </Pressable>
                </View>

                {/* Weight / Calories row (only if there is data) */}
                {hasAnyMeta && (
                  <View style={styles.metaRow}>
                    {leftContent}
                    {rightContent}
                  </View>
                )}

                {/* Notes */}
                {item.notes ? (
                  <Text style={styles.notesText}>{item.notes}</Text>
                ) : null}

                {/* Tap to edit centered */}
                <View style={styles.rowEdit}>
                  <Ionicons name="pencil" size={14} color="#6b7280" />
                  <Text style={styles.rowHint}>Tap to edit</Text>
                </View>
              </TouchableOpacity>
            </View>
          );
        }}
        contentContainerStyle={{ paddingBottom: 28 }}
      />
    </SafeAreaView>
  );
}

/* ---------------- styles ---------------- */

const styles = StyleSheet.create({
  safe: { flex: 1 },

  full: { marginHorizontal: 20 },
  sectionTitle: { fontSize: 20, fontWeight: "800", color: "#0f172a" },

  card: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
    marginTop: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },

  yearHeader: {
    marginTop: 16,
    marginBottom: 2,
    fontSize: 14,
    fontWeight: "700",
    color: "#6b7280",
  },

  cardTitle: { fontSize: 18, fontWeight: "700", color: "#0f172a", marginBottom: 6 },
  editTitle: { fontSize: 16, fontWeight: "700", color: "#0f172a", marginBottom: 8 },

  label: { fontSize: 13, color: "#6b7280", fontWeight: "600", marginTop: 4 },

  row: { flexDirection: "row", alignItems: "center", marginTop: 6 },
  rowSpace: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },

  input: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },

  smallBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  smallBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },

  editActions: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  link: { fontSize: 16, fontWeight: "700" },
  mutedLink: { fontSize: 16, color: "#6b7280", fontWeight: "600" },

  rowDate: { fontSize: 16, fontWeight: "700", color: "#0f172a" },
  rowSub: { fontSize: 12, color: "#6b7280", marginTop: 2 },
  rowText: { marginTop: 6, fontSize: 15, color: "#0f172a" },
  rowStrong: { fontWeight: "800" },

  metaRow: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  trend: {
    marginTop: 6,
    marginLeft: 4,
    fontSize: 14,
    color: "#6b7280",
  },

  notesText: {
    marginTop: 8,
    fontSize: 13,
    color: "#4b5563",
  },

  rowHint: {
    marginTop: 0,
    fontSize: 12,
    color: "#6b7280",
    textAlign: "center",
  },

  rowEdit: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },

  delete: { color: "#ef4444", fontSize: 14, fontWeight: "700" },

  // Add button for quick add card toggle
  addToggleBtn: {
    borderRadius: 999,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  addToggleText: {
    fontSize: 15,
    fontWeight: "700",
  },

  // Save button on quick add
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

  filterRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  filterChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  filterText: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "600",
  },

  jumpRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  jumpText: {
    fontSize: 13,
    color: "#5eada8",
    fontWeight: "600",
  },
});

/* date picker modal styles */
const dateModalStyles = StyleSheet.create({
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
