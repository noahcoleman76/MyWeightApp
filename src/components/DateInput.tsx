import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { useTheme } from "@react-navigation/native";
import dayjs from "dayjs";
import React, { useMemo, useState } from "react";
import {
  Keyboard,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import BackButton from "./ui/BackButton";

type Props = {
  title: string;
  onConfirm: (iso?: string) => void;
  optional?: boolean;
};

export default function DateInput({
  title,
  onConfirm,
  optional = true,
}: Props) {
  const { colors } = useTheme();

  const ACCENT = colors?.primary ?? "#16a34a";
  const TEXT = colors?.text ?? "#111827";
  const BG = colors?.background ?? "#FFFFFF";
  const MUTED = colors?.border ?? "#e5e7eb";
  const SUBTLE = colors?.text ? `${colors.text}99` : "#6b7280";

  const today = dayjs().startOf("day");
  const minSelectable = today.add(1, "day").toDate();

  const [selected, setSelected] = useState<Date | null>(null);
  const [showPicker, setShowPicker] = useState<boolean>(false);

  // Display: "October 13, 2026"
  const formattedPretty = useMemo(
    () => (selected ? dayjs(selected).format("MMMM D, YYYY") : ""),
    [selected]
  );
  // Value sent to onConfirm
  const formattedIso = useMemo(
    () => (selected ? dayjs(selected).format("YYYY-MM-DD") : ""),
    [selected]
  );

  const hasInput = !!selected;
  const canProceed = hasInput ? true : optional;
  const buttonTitle = hasInput ? "continue" : "Continue without end date";

  const openPicker = () => {
    Keyboard.dismiss();
    setShowPicker(true);
  };
  const closePicker = () => setShowPicker(false);

  const handlePress = () => {
    Keyboard.dismiss();
    if (!hasInput && optional) {
      onConfirm(undefined);
      return;
    }
    if (hasInput) {
      onConfirm(formattedIso);
    }
  };

  const onChange = (_e: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === "android") {
      // On Android, picker is dismissed automatically
      setShowPicker(false);
      if (date && dayjs(date).isAfter(today, "day")) {
        setSelected(date);
      }
    } else {
      // On iOS, keep modal open and update selection
      if (date && dayjs(date).isAfter(today, "day")) {
        setSelected(date);
        setShowPicker(false);
      }
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: BG }]}>
      <BackButton />
      <View style={styles.wrap}>
        {/* Title */}
        <Text style={[styles.title, { color: TEXT }]}>{title}</Text>

        {/* Helper blurb */}
        <Text style={[styles.blurb, { color: SUBTLE }]}>
          Do you have an end date to reach your goals? This optional goal helps us
          create a tailored plan for you to absolutely crush your goal.
        </Text>

        {/* Pressable display field */}
        <View style={styles.inputBlock}>
          <Pressable
            onPress={openPicker}
            style={[styles.display, { borderColor: MUTED, backgroundColor: BG }]}
          >
            <Text style={[styles.displayText, { color: hasInput ? TEXT : SUBTLE }]}>
              {hasInput ? formattedPretty : "select date (optional)"}
            </Text>
          </Pressable>
        </View>

        {/* CTA */}
        <Pressable
          disabled={!canProceed}
          onPress={handlePress}
          style={({ pressed }) => [
            styles.cta,
            {
              backgroundColor: canProceed ? ACCENT : MUTED,
              opacity: pressed ? 0.9 : 1,
            },
          ]}
        >
          <Text style={styles.ctaText}>{buttonTitle}</Text>
        </Pressable>

        {/* Android: Native picker (no custom modal wrapper) */}
        {Platform.OS === "android" && showPicker && (
          <DateTimePicker
            mode="date"
            value={selected ?? minSelectable}
            minimumDate={minSelectable}
            onChange={onChange}
            themeVariant="light"
          />
        )}

        {/* iOS: Custom Modal with inline picker */}
        {Platform.OS === "ios" && (
          <Modal
            animationType="fade"
            transparent
            visible={showPicker}
            onRequestClose={closePicker}
            presentationStyle="overFullScreen"
          >
            {/* Backdrop closes modal on press */}
            <Pressable style={styles.modalBackdrop} onPress={closePicker}>
              {/* Card intercepts press to avoid closing */}
              <Pressable
                style={[styles.modalCard, { backgroundColor: BG, borderColor: MUTED }]}
                onPress={(e) => e.stopPropagation()}
              >
                <Text style={[styles.modalTitle, { color: TEXT }]}>Choose your end date</Text>

                <View style={[styles.pickerBox, { borderColor: MUTED }]}>
                  <DateTimePicker
                    mode="date"
                    value={selected ?? minSelectable}
                    minimumDate={minSelectable}
                    display="inline"
                    onChange={onChange}
                    themeVariant="light"
                    style={styles.picker}
                  />
                </View>

                <TouchableOpacity onPress={closePicker} style={[styles.cancelBtn, { borderColor: MUTED }]}>
                  <Text style={[styles.cancelText, { color: SUBTLE }]}>Choose date later</Text>
                </TouchableOpacity>
              </Pressable>
            </Pressable>
          </Modal>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  wrap: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
  },
  blurb: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 360,
  },
  inputBlock: {
    width: 280,
    marginTop: 8,
    alignItems: "stretch",
    gap: 12,
  },
  display: {
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  displayText: {
    fontSize: 18,
    textAlign: "center",
  },

  // CTA
  cta: {
    marginTop: 16,
    width: 260,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
    textTransform: "capitalize",
  },

  // Modal + picker container
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  modalCard: {
    width: "92%",
    maxWidth: 360,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: "stretch",
  },
  modalTitle: {
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
  // Keep the picker comfortably within the card
  picker: {
    width: "100%",
    // Slight scale reduces visual crowding, especially on Android calendar
    transform:
      Platform.select({
        ios: [{ scale: 0.98 }],
        android: [{ scale: 0.95 }],
        default: [{ scale: 0.95 }],
      }) as any,
  },
  cancelBtn: {
    marginTop: 12,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
