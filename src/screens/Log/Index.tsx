import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useTheme } from "@react-navigation/native";
import dayjs from "dayjs";
import advancedFormat from "dayjs/plugin/advancedFormat";
import * as Haptics from "expo-haptics";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  Keyboard,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import { Toast } from "../../components/ui/Toast";
import { kgToLb, lbToKg } from "../../lib/calorieMath";
import { useLogStore } from "../../state/logStore";
import { useProfileStore } from "../../state/profileStore";
import { useAuthStore } from "../../state/authStore";

dayjs.extend(advancedFormat);

type Draft = { id?: string; dateISO: string; calories: string; weight: string; notes?: string };

const isISODate = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s);

type DatePickerContext = "quick" | "edit" | "jump" | null;
type FilterMode = "all" | "weight" | "calories";

export default function Log() {
  const { logs, add, update, remove, syncWithFirebase } = useLogStore();
  const { profile } = useProfileStore();
  const { user } = useAuthStore();
  const { colors } = useTheme();
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

  // Pull-to-refresh state
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Firebase sync effect - sync when user is available
  const hasSyncedRef = useRef(false);
  
  useEffect(() => {
    if (user?.uid && !hasSyncedRef.current) {
      hasSyncedRef.current = true;
      console.log('🔄 Initial sync with Firebase for user:', user.uid);
      
      syncWithFirebase(user.uid).catch(error => {
        console.error('❌ Failed to sync logs from Firebase:', error);
        showToast('Failed to load your log data', 'error');
        hasSyncedRef.current = false; // Allow retry on error
      });
    }
  }, [user?.uid, syncWithFirebase]);

  // Toast state
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: 'error' | 'success' | 'info';
  }>({ visible: false, message: '', type: 'info' });

  // List ref for "jump to date"
  const listRef = useRef<FlatList<any>>(null);

  // Theme tokens with proper fallbacks
  const ACCENT = colors?.primary ?? "#5eada8";
  const TEXT = colors?.text ?? "#0f172a";
  const BG = colors?.background ?? "#f7f7f7";
  const CARD_BG = colors?.card ?? "#ffffff";
  const BORDER = colors?.border ?? "#eef2f7";
  const MUTED = colors?.text ? `${colors.text}99` : "#6b7280";
  const PLACEHOLDER = colors?.text ? `${colors.text}66` : "#9ca3af";

  // Toast helper
  const showToast = (message: string, type: 'error' | 'success' | 'info' = 'error') => {
    setToast({ visible: true, message, type });
  };

  const hideToast = () => {
    setToast(prev => ({ ...prev, visible: false }));
  };

  // Pull-to-refresh handler
  const handleRefresh = async () => {
    if (!user?.uid) return;
    
    setIsRefreshing(true);
    try {
      console.log('🔄 Manual refresh triggered by user');
      await syncWithFirebase(user.uid);
      showToast('Logs synced successfully!', 'success');
    } catch (error) {
      console.error('❌ Manual refresh failed:', error);
      showToast('Failed to sync logs', 'error');
    } finally {
      setIsRefreshing(false);
    }
  };

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
      showToast("Please enter a valid weight like 195 or 195.2", 'error');
      return null;
    }

    const rounded = Math.round(n * 10) / 10;
    const lbs = profile.weightUnit === "kg" ? kgToLb(rounded) : rounded;
    if (lbs < 50 || lbs > 999) {
      showToast("Weight must be between 50 and 999 lbs", 'error');
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
  }, [logs]);

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
      showToast("Please select a valid date", 'error');
      return;
    }

    const caloriesTrim = qa.calories.trim();
    const weightTrim = qa.weight.trim();
    const notesTrim = qa.notes?.trim() ?? "";

    // Require either weight or calories
    if (!caloriesTrim && !weightTrim) {
      showToast("Please enter either weight or calories", 'error');
      return;
    }

    // Validate calories if provided
    const calories = Number(caloriesTrim);
    if (caloriesTrim && (Number.isNaN(calories) || calories < 0 || calories > 10000)) {
      showToast("Please enter calories between 0 and 10,000", 'error');
      return;
    }

    const weightKgResult = parseWeightToKg(qa.weight);
    if (weightKgResult === null) return; // parseWeightToKg already shows toast

    add({
      dateISO: qa.dateISO,
      calories: caloriesTrim ? calories : 0,
      weightKg: weightKgResult === undefined ? undefined : weightKgResult,
      notes: notesTrim || undefined,
    }, user?.uid);

    showToast("Log entry saved successfully!", 'success');
    resetQuickAdd();
    setShowAddCard(false); // auto-hide after successful save
  };

  const saveEdit = () => {
    if (!edit?.id) return;
    if (!isISODate(edit.dateISO)) {
      showToast("Please select a valid date", 'error');
      return;
    }

    const caloriesTrim = edit.calories.trim();
    const weightTrim = edit.weight.trim();
    const notesTrim = edit.notes?.trim() ?? "";

    // Require either weight or calories
    if (!caloriesTrim && !weightTrim) {
      showToast("Please enter either weight or calories", 'error');
      return;
    }

    // Validate calories if provided
    const calories = Number(caloriesTrim);
    if (caloriesTrim && (Number.isNaN(calories) || calories < 0 || calories > 10000)) {
      showToast("Please enter calories between 0 and 10,000", 'error');
      return;
    }

    const weightKgResult = parseWeightToKg(edit.weight);
    if (weightKgResult === null) return; // parseWeightToKg already shows toast

    update(edit.id!, {
      dateISO: edit.dateISO,
      calories: caloriesTrim ? calories : 0,
      weightKg: weightKgResult === undefined ? undefined : weightKgResult,
      notes: notesTrim || undefined,
    }, user?.uid);
    
    showToast("Log entry updated successfully!", 'success');
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

  const applyPickedDate = (selectedDate?: Date) => {
    const dateToUse = selectedDate || tempDate;
    if (!dateToUse) {
      closeDatePicker();
      return;
    }
    const iso = dayjs(dateToUse).format("YYYY-MM-DD");
    console.log('📅 Date selected:', iso, 'Context:', datePickerContext);

    if (datePickerContext === "jump") {
      const index = filtered.findIndex((e) => e.dateISO === iso);
      if (index >= 0 && listRef.current) {
        listRef.current.scrollToIndex({ index, animated: true });
        showToast("Jumped to selected date", 'info');
      } else {
        showToast("No log entry found on that date", 'error');
      }
    } else if (datePickerContext === "quick") {
      console.log('📝 Updating quick add date to:', iso);
      setQa((prev) => ({ ...prev, dateISO: iso }));
    } else if (datePickerContext === "edit") {
      console.log('✏️ Updating edit date to:', iso);
      setEdit((prev) => (prev ? { ...prev, dateISO: iso } : prev));
    }

    closeDatePicker();
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
          onPress: () => remove(id, user?.uid),
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
      {/* Native Date Picker (no custom modal wrapper) */}
      {showDatePicker && (
        <DateTimePicker
          mode="date"
          value={tempDate ?? dayjs().toDate()}
          display={Platform.select({
            ios: "spinner",
            android: "default",
            default: "default",
          }) as any}
          onChange={(event, date) => {
            if (Platform.OS === 'android') {
              // Android: picker automatically closes after selection
              if (event.type === 'set' && date) {
                setTempDate(date);
                applyPickedDate(date); // Pass the date directly
              } else {
                closeDatePicker();
              }
            } else {
              // iOS: allow continuous date changes
              if (date) {
                setTempDate(date);
                // Auto-apply on iOS since there's no explicit "Done" button
                setTimeout(() => {
                  applyPickedDate(date); // Pass the date directly
                }, 100);
              }
            }
          }}
          onTouchCancel={closeDatePicker}
          themeVariant="light"
        />
      )}

      <FlatList
        ref={listRef}
        data={filtered}
        keyExtractor={(i) => i.id}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListHeaderComponent={
          <View>
            {/* Add New Log toggle button (PRIMARY COLOR) */}
            <View style={[styles.full, { marginTop: 16 }]}>
              <Button
                title={showAddCard ? "Hide New Log" : "Add New Log +"}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowAddCard((prev) => !prev);
                }}
                accentColor={ACCENT}
                style={styles.addToggleBtn}
              />
            </View>

            {/* Add New Log Card (expandable) */}
            {showAddCard && (
              <View style={[styles.full, { marginTop: 8 }]}>
                <View style={[styles.card, { backgroundColor: CARD_BG, borderColor: BORDER }]}>
                  <Text style={[styles.cardTitle, { color: TEXT }]}>New Log</Text>

                  {/* Date */}
                  <Text style={[styles.label, { color: MUTED }]}>Date</Text>
                  <Pressable
                    onPress={() => openDatePicker("quick")}
                    style={[styles.input, { justifyContent: "center" }]}
                  >
                    <Text style={{ fontSize: 16, color: TEXT, textAlign: "center" }}>
                      {prettyDate(qa.dateISO)}
                    </Text>
                  </Pressable>

                  {/* Weight */}
                  <Text style={[styles.label, { marginTop: 12, color: MUTED }]}>
                    Weight ({profile.weightUnit === "kg" ? "kg" : "lbs"})
                  </Text>
                  <TextInput
                    value={qa.weight}
                    onChangeText={(t) => setQa({ ...qa, weight: t })}
                    keyboardType="numeric"
                    returnKeyType="done"
                    placeholder={`Enter weight in ${profile.weightUnit === "kg" ? "kg" : "lbs"}`}
                    placeholderTextColor={PLACEHOLDER}
                    style={[styles.input, { backgroundColor: CARD_BG, borderColor: BORDER, color: TEXT }]}
                  />

                  {/* Calories */}
                  <Text style={[styles.label, { marginTop: 12, color: MUTED }]}>Calories</Text>
                  <TextInput
                    value={qa.calories}
                    onChangeText={(t) => setQa({ ...qa, calories: t })}
                    keyboardType="numeric"
                    returnKeyType="done"
                    placeholder="Enter calories consumed"
                    placeholderTextColor={PLACEHOLDER}
                    style={[styles.input, { backgroundColor: CARD_BG, borderColor: BORDER, color: TEXT }]}
                  />

                  {/* Notes */}
                  <Text style={[styles.label, { marginTop: 12, color: MUTED }]}>Notes — optional</Text>
                  <TextInput
                    value={qa.notes}
                    onChangeText={(t) => setQa({ ...qa, notes: t })}
                    multiline
                    placeholder="Add any notes about your day..."
                    placeholderTextColor={PLACEHOLDER}
                    style={[styles.input, { height: 80, textAlignVertical: "top", backgroundColor: CARD_BG, borderColor: BORDER, color: TEXT }]}
                  />
                  
                  <View style={{ marginTop: 16, alignItems: "center" }}>
                    <Button
                      title="Save"
                      onPress={saveQuickAdd}
                      accentColor={ACCENT}
                      style={{ ...styles.addBtn, width: "100%" }}
                    />

                    {/* Cancel under save to collapse form */}
                    <Pressable
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setShowAddCard(false);
                      }}
                      style={{ marginTop: 10 }}
                    >
                      <Text style={[styles.mutedLink, { color: MUTED }]}>Cancel</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            )}

            {/* History header + filters + jump */}
            <View style={[styles.full, { marginTop: 16, marginBottom: 4 }]}>
              <View style={styles.rowSpace}>
                <Text style={[styles.sectionTitle, { color: TEXT }]}>History</Text>
                <Pressable onPress={openJumpToDate} hitSlop={8}>
                  <View style={styles.jumpRow}>
                    <Ionicons name="calendar-outline" size={16} color={ACCENT} />
                    <Text style={[styles.jumpText, { color: ACCENT }]}>Jump to date</Text>
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
                        { borderColor: active ? ACCENT : BORDER },
                        active && { backgroundColor: ACCENT + "22" },
                      ]}
                    >
                      <Text
                        style={[
                          styles.filterText,
                          { color: active ? ACCENT : MUTED },
                          active && { fontWeight: "700" },
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
                  <Text style={[styles.editTitle, { color: TEXT }]}>Edit entry</Text>

                  {/* Date */}
                  <Text style={[styles.label, { color: MUTED }]}>Date</Text>
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
                    placeholder={`Enter weight in ${profile.weightUnit === "kg" ? "kg" : "lbs"}`}
                    placeholderTextColor={PLACEHOLDER}
                    style={[styles.input, { backgroundColor: CARD_BG, borderColor: BORDER, color: TEXT }]}
                  />

                  {/* Calories */}
                  <Text style={[styles.label, { marginTop: 12, color: MUTED }]}>Calories</Text>
                  <TextInput
                    value={edit.calories}
                    onChangeText={(t) => setEdit({ ...edit, calories: t })}
                    keyboardType="numeric"
                    returnKeyType="done"
                    placeholder="Enter calories consumed"
                    placeholderTextColor={PLACEHOLDER}
                    style={[styles.input, { backgroundColor: CARD_BG, borderColor: BORDER, color: TEXT }]}
                  />

                  {/* Notes */}
                  <Text style={[styles.label, { marginTop: 12, color: MUTED }]}>Notes — optional</Text>
                  <TextInput
                    value={edit.notes ?? ""}
                    onChangeText={(t) => setEdit({ ...edit, notes: t })}
                    multiline
                    placeholderTextColor={PLACEHOLDER}
                    style={[styles.input, { height: 80, textAlignVertical: "top", backgroundColor: CARD_BG, borderColor: BORDER, color: TEXT }]}
                  />

                  <View style={styles.editActions}>
                    <Pressable onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setEdit(null);
                    }}>
                      <Text style={[styles.mutedLink, { color: MUTED }]}>Cancel</Text>
                    </Pressable>
                    <Pressable onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      saveEdit();
                    }}>
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
                <Text style={[styles.rowText, { color: TEXT }]}>
                  Weight: <Text style={styles.rowStrong}>{wDisp}</Text>
                </Text>
                {item.trend && (
                  <Text style={[styles.trend, { color: MUTED }]}>
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
              <Text style={[styles.rowText, { color: TEXT }]}>
                Calories: <Text style={styles.rowStrong}>{item.calories ?? 0}</Text>
              </Text>
            );
          }

          // Right block only if both exist
          const rightContent =
            hasWeight && hasCalories ? (
              <Text style={[styles.rowText, { color: TEXT }]}>
                Calories: <Text style={styles.rowStrong}>{item.calories ?? 0}</Text>
              </Text>
            ) : null;

          return (
            <View style={[styles.full, { marginBottom: 10 }]}>
              {/* Year header */}
              {item.yearLabel && <Text style={[styles.yearHeader, { color: MUTED }]}>{item.yearLabel}</Text>}

              <Pressable
                style={({ pressed }) => [
                  styles.card,
                  { backgroundColor: CARD_BG, borderColor: BORDER },
                  pressed && { transform: [{ scale: 0.98 }], opacity: 0.9 }
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setEdit({
                    id: item.id,
                    dateISO: item.dateISO,
                    calories: String(item.calories ?? 0),
                    weight: formatWeightForInput(item.weightKg),
                    notes: item.notes,
                  });
                }}
              >
                <View style={styles.rowSpace}>
                  <View>
                    <Text style={[styles.rowDate, { color: TEXT }]}>{prettyDate(item.dateISO)}</Text>
                    {item.relative && (
                      <Text style={[styles.rowSub, { color: MUTED }]}>{item.relative}</Text>
                    )}
                  </View>
                  <Pressable
                    onPress={() => {
                      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                      handleDelete(item.id);
                    }}
                    hitSlop={8}
                    style={({ pressed }) => [{
                      transform: [{ scale: pressed ? 0.9 : 1 }],
                      opacity: pressed ? 0.7 : 1
                    }]}
                  >
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
                  <Text style={[styles.notesText, { color: MUTED }]}>{item.notes}</Text>
                ) : null}

                {/* Tap to edit centered */}
                <View style={styles.rowEdit}>
                  <Ionicons name="pencil" size={14} color={MUTED} />
                  <Text style={[styles.rowHint, { color: MUTED }]}>Tap to edit</Text>
                </View>
              </Pressable>
            </View>
          );
        }}
        contentContainerStyle={{ paddingBottom: 28 }}
      />
      
      {/* Toast notifications */}
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onDismiss={hideToast}
      />
    </SafeAreaView>
  );
}

/* ---------------- styles ---------------- */

const styles = StyleSheet.create({
  safe: { flex: 1 },

  full: { marginHorizontal: 20 },
  sectionTitle: { fontSize: 20, fontWeight: "800" },

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

  hint: {
    fontSize: 14,
    textAlign: "center",
    fontStyle: "italic",
  },

  yearHeader: {
    marginTop: 16,
    marginBottom: 2,
    fontSize: 14,
    fontWeight: "700",
  },

  cardTitle: { fontSize: 18, fontWeight: "700", marginBottom: 6 },
  editTitle: { fontSize: 16, fontWeight: "700", marginBottom: 8 },

  label: { fontSize: 13, fontWeight: "600", marginTop: 4 },

  row: { flexDirection: "row", alignItems: "center", marginTop: 6 },
  rowSpace: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },

  input: {
    marginTop: 6,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  
  optional: {
    color: "#ef4444",
    fontSize: 13,
    fontWeight: "600",
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
  mutedLink: { fontSize: 16, fontWeight: "600" },

  rowDate: { fontSize: 16, fontWeight: "700" },
  rowSub: { fontSize: 12, marginTop: 2 },
  rowText: { marginTop: 6, fontSize: 15 },
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
  },

  notesText: {
    marginTop: 8,
    fontSize: 13,
  },

  rowHint: {
    marginTop: 0,
    fontSize: 12,
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

  // Button overrides for custom sizing
  addToggleBtn: {
    borderRadius: 999,
    minWidth: 160,
  },

  // Save button on quick add
  addBtn: {
    borderRadius: 24,
    paddingVertical: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },

  filterRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  filterChip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  filterText: {
    fontSize: 12,
    fontWeight: "600",
  },

  jumpRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  jumpText: {
    fontSize: 13,
    fontWeight: "600",
  },
});


