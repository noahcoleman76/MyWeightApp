import dayjs from "dayjs";
import React, { useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import { kgToLb, lbToKg } from "../../lib/calorieMath";
import { useLogStore } from "../../state/logStore";
import { useProfileStore } from "../../state/profileStore";

type Draft = { id?: string; dateISO: string; calories: string; weight: string };

const isISODate = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s);

export default function Log() {
  const { logs, add, update, remove } = useLogStore();
  const { profile } = useProfileStore();
  const today = dayjs().format("YYYY-MM-DD");

  // Quick add draft
  const [qa, setQa] = useState<Draft>({ dateISO: today, calories: "", weight: "" });

  // Edit draft
  const [edit, setEdit] = useState<Draft | null>(null);

  const sorted = useMemo(
    () =>
      [...logs].sort((a, b) =>
        a.dateISO === b.dateISO ? (a.id < b.id ? 1 : -1) : a.dateISO < b.dateISO ? 1 : -1
      ),
    [logs]
  );

  const saveQuickAdd = () => {
    if (!isISODate(qa.dateISO)) {
      Alert.alert("Invalid date", "Please use YYYY-MM-DD.");
      return;
    }
    const calories = Number(qa.calories);
    const weightKg = qa.weight.trim()
      ? profile.weightUnit === "kg"
        ? Number(qa.weight)
        : lbToKg(Number(qa.weight))
      : undefined;

    add({
      dateISO: qa.dateISO,
      calories: Number.isNaN(calories) ? 0 : calories,
      weightKg,
    });
    setQa({ dateISO: today, calories: "", weight: "" });
  };

  const saveEdit = () => {
    if (!edit?.id) return;
    if (!isISODate(edit.dateISO)) {
      Alert.alert("Invalid date", "Please use YYYY-MM-DD.");
      return;
    }
    const calories = Number(edit.calories);
    const weightKg = edit.weight.trim()
      ? profile.weightUnit === "kg"
        ? Number(edit.weight)
        : lbToKg(Number(edit.weight))
      : undefined;

    update(edit.id, {
      dateISO: edit.dateISO,
      calories: Number.isNaN(calories) ? 0 : calories,
      weightKg,
    });
    setEdit(null);
  };

  // Theme tokens (kept consistent with Dashboard/Goals suggestions)
  const ACCENT = "#5eada8";
  const TEXT = "#0f172a";
  const BG = "#f7f7f7";
  const CARD_BG = "#ffffff";
  const BORDER = "#eef2f7";

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: BG }]}>
      <FlatList
        data={sorted}
        keyExtractor={(i) => i.id}
        ListHeaderComponent={
          <View>
            {/* Title */}
            <View style={styles.header}>
              <Text style={[styles.title, { color: TEXT, textAlign: "center" }]}>Log</Text>
            </View>

            {/* Quick Add Card */}
            <View style={[styles.card, styles.full, { backgroundColor: CARD_BG, borderColor: BORDER }]}>
              <Text style={styles.cardTitle}>Quick Add</Text>

              {/* Date row */}
              <Text style={styles.label}>Date (YYYY-MM-DD)</Text>
              <View style={styles.row}>
                <TextInput
                  value={qa.dateISO}
                  onChangeText={(t) => setQa({ ...qa, dateISO: t })}
                  placeholder="YYYY-MM-DD"
                  autoCapitalize="none"
                  returnKeyType="done"
                  style={styles.inputFlex}
                />
                <View style={{ width: 10 }} />
                <Pressable
                  onPress={() => setQa({ ...qa, dateISO: today })}
                  style={[styles.smallBtn, { backgroundColor: ACCENT }]}
                >
                  <Text style={styles.smallBtnText}>Today</Text>
                </Pressable>
              </View>

              {/* Calories */}
              <Text style={[styles.label, { marginTop: 12 }]}>Calories</Text>
              <TextInput
                value={qa.calories}
                onChangeText={(t) => setQa({ ...qa, calories: t })}
                keyboardType="numeric"
                returnKeyType="done"
                style={styles.input}
              />

              {/* Weight */}
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

              <View style={{ marginTop: 14 }}>
                <Button title="Save" onPress={saveQuickAdd} />
              </View>
            </View>

            {/* History header */}
            <View style={[styles.full, { marginTop: 6, marginBottom: 4 }]}>
              <Text style={styles.sectionTitle}>History</Text>
            </View>

            {/* Empty state */}
            {sorted.length === 0 && (
              <View style={[styles.full, { marginTop: 6 }]}>
                <View style={[styles.card, { backgroundColor: CARD_BG, borderColor: BORDER }]}>
                  <EmptyState
                    title="No entries yet"
                    subtitle="Start by adding today’s calories and weight. You’ll see your progress here."
                    cta="Add first entry"
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

          if (isEditing) {
            return (
              <View style={[styles.full, { marginBottom: 10 }]}>
                <View style={[styles.card, { backgroundColor: CARD_BG, borderColor: BORDER }]}>
                  <Text style={styles.editTitle}>Edit entry</Text>

                  {/* Date */}
                  <Text style={styles.label}>Date (YYYY-MM-DD)</Text>
                  <View style={styles.row}>
                    <TextInput
                      value={edit.dateISO}
                      onChangeText={(t) => setEdit({ ...edit!, dateISO: t })}
                      placeholder="YYYY-MM-DD"
                      autoCapitalize="none"
                      returnKeyType="done"
                      style={styles.inputFlex}
                    />
                    <View style={{ width: 10 }} />
                    <Pressable
                      onPress={() => setEdit({ ...edit!, dateISO: today })}
                      style={[styles.smallBtn, { backgroundColor: ACCENT }]}
                    >
                      <Text style={styles.smallBtnText}>Today</Text>
                    </Pressable>
                  </View>

                  {/* Calories */}
                  <Text style={[styles.label, { marginTop: 12 }]}>Calories</Text>
                  <TextInput
                    value={edit.calories}
                    onChangeText={(t) => setEdit({ ...edit!, calories: t })}
                    keyboardType="numeric"
                    returnKeyType="done"
                    style={styles.input}
                  />

                  {/* Weight */}
                  <Text style={[styles.label, { marginTop: 12 }]}>
                    Weight ({profile.weightUnit})
                  </Text>
                  <TextInput
                    value={edit.weight}
                    onChangeText={(t) => setEdit({ ...edit!, weight: t })}
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
                  {wDisp ? <Text>  •  Weight: <Text style={styles.rowStrong}>{wDisp}</Text></Text> : null}
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
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 6, alignItems: "center" },
  title: { fontSize: 34, fontWeight: "800" },

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
});
