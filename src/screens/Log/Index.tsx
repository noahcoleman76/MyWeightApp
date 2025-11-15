import DateTimePicker from "@react-native-community/datetimepicker";
import dayjs from "dayjs";
import React, { useMemo, useState } from "react";
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

type Draft = { id?: string; dateISO: string; calories: string; weight: string };

const isISODate = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s);

type DatePickerContext = "quick" | "edit" | null;

export default function Log() {
  const { logs, add, update, remove } = useLogStore();
  const { profile } = useProfileStore();
  const todayISO = dayjs().format("YYYY-MM-DD");

  // Quick add draft
  const [qa, setQa] = useState<Draft>({ dateISO: todayISO, calories: "", weight: "" });

  // Edit draft
  const [edit, setEdit] = useState<Draft | null>(null);

  // Date picker shared state (used for both quick-add and edit)
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerContext, setDatePickerContext] = useState<DatePickerContext>(null);
  const [tempDate, setTempDate] = useState<Date | null>(null);

  const sorted = useMemo(
    () =>
      [...logs].sort((a, b) =>
        a.dateISO === b.dateISO ? (a.id < b.id ? 1 : -1) : a.dateISO < b.dateISO ? 1 : -1
      ),
    [logs]
  );

  const resetQuickAdd = () => {
    setQa({ dateISO: todayISO, calories: "", weight: "" });
  };

  const saveQuickAdd = () => {
    if (!isISODate(qa.dateISO)) {
      Alert.alert("Invalid date", "Please use a valid date.");
      return;
    }

    const caloriesTrim = qa.calories.trim();
    const weightTrim = qa.weight.trim();

    if (!caloriesTrim && !weightTrim) {
      Alert.alert("Add something", "Enter calories, weight, or both before saving.");
      return;
    }

    const calories = Number(caloriesTrim);
    const weightKg = weightTrim
      ? profile.weightUnit === "kg"
        ? Number(weightTrim)
        : lbToKg(Number(weightTrim))
      : undefined;

    add({
      dateISO: qa.dateISO,
      calories: Number.isNaN(calories) ? 0 : calories,
      weightKg,
    });

    resetQuickAdd();
  };

  const saveEdit = () => {
    if (!edit?.id) return;
    if (!isISODate(edit.dateISO)) {
      Alert.alert("Invalid date", "Please use a valid date.");
      return;
    }

    const caloriesTrim = edit.calories.trim();
    const weightTrim = edit.weight.trim();

    if (!caloriesTrim && !weightTrim) {
      Alert.alert("Add something", "Enter calories, weight, or both before saving.");
      return;
    }

    const calories = Number(caloriesTrim);
    const weightKg = weightTrim
      ? profile.weightUnit === "kg"
        ? Number(weightTrim)
        : lbToKg(Number(weightTrim))
      : undefined;

    update(edit.id, {
      dateISO: edit.dateISO,
      calories: Number.isNaN(calories) ? 0 : calories,
      weightKg,
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

  const prettyDate = (iso: string) => dayjs(iso).format("MMMM D, YYYY");

  // Theme tokens
  const ACCENT = "#5eada8";
  const TEXT = "#0f172a";
  const BG = "#f7f7f7";
  const CARD_BG = "#ffffff";
  const BORDER = "#eef2f7";

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: BG }]}>
      {/* Global Date Picker Modal (shared by quick-add + edit) */}
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
              {datePickerContext === "edit" ? "Edit log date" : "Choose log date"}
            </Text>

            <View style={[dateModalStyles.pickerBox, { borderColor: BORDER }]}>
              <DateTimePicker
                mode="date"
                value={
                  tempDate ??
                  (datePickerContext === "edit" && edit
                    ? dayjs(edit.dateISO).toDate()
                    : dayjs(qa.dateISO).toDate())
                }
                display={
                  Platform.select({
                    ios: "inline",
                    android: "calendar",
                    default: "calendar",
                  }) as any
                }
                onChange={(_e, date) => {
                  if (date) {
                    setTempDate(date);
                    if (Platform.OS === "android") {
                      const iso = dayjs(date).format("YYYY-MM-DD");
                      if (datePickerContext === "quick") {
                        setQa((prev) => ({ ...prev, dateISO: iso }));
                      } else if (datePickerContext === "edit") {
                        setEdit((prev) => (prev ? { ...prev, dateISO: iso } : prev));
                      }
                    }
                  }
                }}
                themeVariant="light"
                style={dateModalStyles.picker}
              />
            </View>

            <View style={dateModalStyles.actions}>
              <TouchableOpacity
                onPress={setTodayInPicker}
                style={[dateModalStyles.linkBtn, { borderColor: BORDER }]}
              >
                <Text style={dateModalStyles.linkText}>Use Today</Text>
              </TouchableOpacity>

              <Pressable
                onPress={applyPickedDate}
                style={({ pressed }) => [
                  dateModalStyles.cta,
                  { backgroundColor: ACCENT, opacity: pressed ? 0.9 : 1 },
                ]}
              >
                <Text style={dateModalStyles.ctaText}>Save date</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <FlatList
        data={sorted}
        keyExtractor={(i) => i.id}
        ListHeaderComponent={
          <View>
            {/* Quick Add Card (inline, not a modal) */}
            <View style={[styles.full, { marginTop: 16 }]}>
              <View
                style={[
                  styles.card,
                  { backgroundColor: CARD_BG, borderColor: BORDER },
                ]}
              >
                <Text style={styles.cardTitle}>Add New Log</Text>

                {/* Date (pretty, press to open picker) */}
                <Text style={styles.label}>Date</Text>
                <Pressable
                  onPress={() => openDatePicker("quick")}
                  style={[styles.input, { justifyContent: "center" }]}
                >
                  <Text style={{ fontSize: 16, color: TEXT, textAlign: "center" }}>
                    {prettyDate(qa.dateISO)}
                  </Text>
                </Pressable>

                {/* Weight FIRST */}
                <Text style={[styles.label, { marginTop: 12 }]}>
                  Weight ({profile.weightUnit}) — optional 
                </Text>
                <TextInput
                  value={qa.weight}
                  onChangeText={(t) => setQa({ ...qa, weight: t })}
                  keyboardType="numeric"
                  returnKeyType="done"
                  style={styles.input}
                />

                {/* Calories SECOND */}
                <Text style={[styles.label, { marginTop: 12 }]}>
                  Calories — optional 
                </Text>
                <TextInput
                  value={qa.calories}
                  onChangeText={(t) => setQa({ ...qa, calories: t })}
                  keyboardType="numeric"
                  returnKeyType="done"
                  style={styles.input}
                />

                <View style={{ marginTop: 16, alignItems: "center" }}>
                  <Pressable
                    style={[styles.addBtn, { backgroundColor: ACCENT, width: "100%" }]}
                    onPress={saveQuickAdd}
                  >
                    <Text style={styles.addBtnText}>Save</Text>
                  </Pressable>
                </View>
              </View>
            </View>

            {/* History header */}
            <View style={[styles.full, { marginTop: 12, marginBottom: 4 }]}>
              <Text style={styles.sectionTitle}>History</Text>
            </View>

            {/* Empty state */}
            {sorted.length === 0 && (
              <View style={[styles.full, { marginTop: 6 }]}>
                <View style={[styles.card, { backgroundColor: CARD_BG, borderColor: BORDER }]}>
                  <EmptyState
                    title="No entries yet"
                    cta="Start by adding today’s calories and weight. You’ll see your progress here."
                    onPress={saveQuickAdd}
                  />
                </View>
              </View>
            )}
          </View>
        }
        renderItem={({ item }) => {
          const wDisp =
            typeof item.weightKg === "number"
              ? profile.weightUnit === "kg"
                ? `${Math.round(item.weightKg)} ${profile.weightUnit}`
                : `${Math.round(kgToLb(item.weightKg))} ${profile.weightUnit}`
              : undefined;

          const isEditing = edit?.id === item.id;

          if (isEditing && edit) {
            return (
              <View style={[styles.full, { marginBottom: 10 }]}>
                <View style={[styles.card, { backgroundColor: CARD_BG, borderColor: BORDER }]}>
                  <Text style={styles.editTitle}>Edit entry</Text>

                  {/* Date with picker */}
                  <Text style={styles.label}>Date</Text>
                  <Pressable
                    onPress={() => openDatePicker("edit")}
                    style={[styles.input, { justifyContent: "center" }]}
                  >
                    <Text style={{ fontSize: 16, color: TEXT, textAlign: "center" }}>
                      {prettyDate(edit.dateISO)}
                    </Text>
                  </Pressable>

                  {/* Weight FIRST */}
                  <Text style={[styles.label, { marginTop: 12 }]}>
                    Weight ({profile.weightUnit})
                  </Text>
                  <TextInput
                    value={edit.weight}
                    onChangeText={(t) => setEdit({ ...edit, weight: t })}
                    keyboardType="numeric"
                    returnKeyType="done"
                    style={styles.input}
                  />

                  {/* Calories SECOND */}
                  <Text style={[styles.label, { marginTop: 12 }]}>Calories</Text>
                  <TextInput
                    value={edit.calories}
                    onChangeText={(t) => setEdit({ ...edit, calories: t })}
                    keyboardType="numeric"
                    returnKeyType="done"
                    style={styles.input}
                  />

                  <View style={styles.editActions}>
                    <Pressable onPress={saveEdit}>
                      <Text style={[styles.link, { color: ACCENT }]}>Save</Text>
                    </Pressable>
                    <Pressable onPress={() => setEdit(null)}>
                      <Text style={styles.mutedLink}>Cancel</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            );
          }

          return (
            <View style={[styles.full, { marginBottom: 10 }]}>
              <TouchableOpacity
                style={[styles.card, { backgroundColor: CARD_BG, borderColor: BORDER }]}
                onPress={() =>
                  setEdit({
                    id: item.id,
                    dateISO: item.dateISO,
                    calories: String(item.calories ?? 0),
                    weight:
                      typeof item.weightKg === "number"
                        ? profile.weightUnit === "kg"
                          ? String(Math.round(item.weightKg))
                          : String(Math.round(kgToLb(item.weightKg)))
                        : "",
                  })
                }
              >
                <View style={styles.rowSpace}>
                  <Text style={styles.rowDate}>{item.dateISO}</Text>
                  <Pressable onPress={() => remove(item.id)}>
                    <Text style={styles.delete}>Delete</Text>
                  </Pressable>
                </View>
                <Text style={styles.rowText}>
                  Calories: <Text style={styles.rowStrong}>{item.calories ?? 0}</Text>
                  {wDisp ? (
                    <Text>
                      {"  •  "}Weight: <Text style={styles.rowStrong}>{wDisp}</Text>
                    </Text>
                  ) : null}
                </Text>
                <Text style={styles.rowHint}>Tap to edit</Text>
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
  inputFlex: {
    flex: 1,
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
    gap: 24,
  },
  link: { fontSize: 16, fontWeight: "700" },
  mutedLink: { fontSize: 16, color: "#6b7280", fontWeight: "600" },

  rowDate: { fontSize: 16, fontWeight: "700", color: "#0f172a" },
  rowText: { marginTop: 6, fontSize: 15, color: "#0f172a" },
  rowStrong: { fontWeight: "800" },
  rowHint: { marginTop: 4, fontSize: 12, color: "#6b7280" },
  delete: { color: "#ef4444", fontSize: 14, fontWeight: "700" },

  // Add button style (also used for Save on quick add)
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

/* date picker modal styles (matching Goals formatting) */
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
