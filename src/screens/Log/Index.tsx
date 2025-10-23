import dayjs from "dayjs";
import React, { useMemo, useState } from "react";
import { Alert, Button, FlatList, Text, TextInput, TouchableOpacity, View } from "react-native";
import { kgToLb, lbToKg } from "../../lib/calorieMath";
import { useLogStore } from "../../state/logStore";
import { useProfileStore } from "../../state/profileStore";

type Draft = { id?: string; dateISO: string; calories: string; weight: string };

const isISODate = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s);

export default function Log() {
  const { logs, add, update, remove } = useLogStore();
  const { profile } = useProfileStore();
  const today = dayjs().format("YYYY-MM-DD");

  // Quick add draft (date is editable now)
  const [qa, setQa] = useState<Draft>({ dateISO: today, calories: "", weight: "" });

  // Edit draft state
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

  return (
    <View className="flex-1 bg-white p-4">
      <Text className="text-xl font-semibold">Quick add</Text>

      {/* Date */}
      <Text className="mt-3 text-sm text-gray-600">Date (YYYY-MM-DD)</Text>
      <View className="flex-row items-center gap-3">
        <TextInput
          value={qa.dateISO}
          onChangeText={(t) => setQa({ ...qa, dateISO: t })}
          placeholder="YYYY-MM-DD"
          autoCapitalize="none"
          className="flex-1 border rounded-lg px-3 py-2"
        />
        <Button title="Today" onPress={() => setQa({ ...qa, dateISO: today })} />
      </View>

      {/* Calories */}
      <Text className="mt-3 text-sm text-gray-600">Calories</Text>
      <TextInput
        value={qa.calories}
        onChangeText={(t) => setQa({ ...qa, calories: t })}
        keyboardType="numeric"
        className="border rounded-lg px-3 py-2"
      />

      {/* Weight */}
      <Text className="mt-3 text-sm text-gray-600">Weight ({profile.weightUnit}) — optional</Text>
      <TextInput
        value={qa.weight}
        onChangeText={(t) => setQa({ ...qa, weight: t })}
        keyboardType="numeric"
        className="border rounded-lg px-3 py-2"
      />

      <View className="mt-3">
        <Button title="Save" onPress={saveQuickAdd} />
      </View>

      <Text className="mt-6 text-lg font-semibold">History</Text>

      <FlatList
        className="mt-2"
        data={sorted}
        keyExtractor={(i) => i.id}
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
              <View className="py-3 border-b">
                <Text className="font-medium">Edit entry</Text>

                {/* Editable date */}
                <Text className="text-sm text-gray-600 mt-1">Date (YYYY-MM-DD)</Text>
                <View className="flex-row items-center gap-3">
                  <TextInput
                    value={edit.dateISO}
                    onChangeText={(t) => setEdit({ ...edit!, dateISO: t })}
                    placeholder="YYYY-MM-DD"
                    autoCapitalize="none"
                    className="flex-1 border rounded-lg px-3 py-2"
                  />
                  <Button title="Today" onPress={() => setEdit({ ...edit!, dateISO: today })} />
                </View>

                <Text className="text-sm text-gray-600 mt-2">Calories</Text>
                <TextInput
                  value={edit.calories}
                  onChangeText={(t) => setEdit({ ...edit!, calories: t })}
                  keyboardType="numeric"
                  className="border rounded-lg px-3 py-2"
                />

                <Text className="text-sm text-gray-600 mt-2">Weight ({profile.weightUnit})</Text>
                <TextInput
                  value={edit.weight}
                  onChangeText={(t) => setEdit({ ...edit!, weight: t })}
                  keyboardType="numeric"
                  className="border rounded-lg px-3 py-2"
                />

                <View className="mt-2 flex-row gap-16">
                  <Text className="text-blue-600" onPress={saveEdit}>Save</Text>
                  <Text className="text-gray-600" onPress={() => setEdit(null)}>Cancel</Text>
                </View>
              </View>
            );
          }

          return (
            <TouchableOpacity
              className="py-3 border-b"
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
              <Text className="font-medium">{item.dateISO}</Text>
              <Text>
                Calories: {item.calories ?? 0}
                {wDisp ? ` • Weight: ${wDisp}` : ""}
              </Text>
              <Text className="text-red-600 mt-1" onPress={() => remove(item.id)}>Delete</Text>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}
