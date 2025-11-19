// app/screens/Account/Index.tsx
import { useTheme } from "@react-navigation/native";
import React, { useState } from "react";
import {
  Linking,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useProfileStore } from "../../state/profileStore";

export default function Account() {
  const { colors } = useTheme();
  const primary = colors.primary ?? "#2563eb";

  const { profile, setName, setEmail } = useProfileStore();
  const [name, setNameLocal] = useState(profile.name);
  const [email, setEmailLocal] = useState(profile.email ?? "");

  const save = () => {
    setName(name.trim() || "You");
    setEmail(email.trim() || undefined);
  };

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll}>
        {/* Header */}
        <View style={s.header}>
          <Text style={s.title}>Account</Text>
        </View>

        {/* Account details card */}
        <View style={s.full}>
          <View style={[s.card, { borderColor: "#e5e7eb", backgroundColor: "#fff" }]}>
            {/* Name */}
            <Text style={s.label}>Name</Text>
            <TextInput
              value={name}
              onChangeText={setNameLocal}
              style={s.input}
              placeholder="Your name"
              placeholderTextColor="#9ca3af"
            />

            {/* Email */}
            <View style={{ marginTop: 16 }}>
              <Text style={s.label}>Email</Text>
              <TextInput
                value={email}
                onChangeText={setEmailLocal}
                keyboardType="email-address"
                autoCapitalize="none"
                style={s.input}
                placeholder="you@example.com"
                placeholderTextColor="#9ca3af"
              />
            </View>

            {/* Save button */}
            <View style={{ marginTop: 20 }}>
              <TouchableOpacity
                onPress={save}
                style={[modalStyles.cta, { flex: undefined, backgroundColor: primary }]}
              >
                <Text style={modalStyles.ctaText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Help & Legal card */}
        <View style={s.full}>
          <View style={[s.card, { borderColor: "#e5e7eb", backgroundColor: "#fff" }]}>
            <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 12 }}>Help &amp; Legal</Text>

            <View style={{ gap: 10 }}>
              {/* Contact Support */}
              <TouchableOpacity
                style={[modalStyles.linkBtn, { borderColor: "#e5e7eb", backgroundColor: "#f9fafb" }]}
                onPress={() =>
                  Linking.openURL(
                    `mailto:support@myweightapp.com?subject=MyWeight%20Support`
                  )
                }
              >
                <Text style={modalStyles.linkText}>Contact Support</Text>
              </TouchableOpacity>

              {/* Privacy Policy */}
              <TouchableOpacity
                style={[modalStyles.linkBtn, { borderColor: "#e5e7eb", backgroundColor: "#f9fafb" }]}
                onPress={() => Linking.openURL("https://myweightapp.com/privacy")}
              >
                <Text style={modalStyles.linkText}>Privacy Policy</Text>
              </TouchableOpacity>

              {/* Terms of Use */}
              <TouchableOpacity
                style={[modalStyles.linkBtn, { borderColor: "#e5e7eb", backgroundColor: "#f9fafb" }]}
                onPress={() => Linking.openURL("https://myweightapp.com/terms")}
              >
                <Text style={modalStyles.linkText}>Terms of Use</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ---------- Styles ---------- */

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f3f4f6" },
  scroll: { paddingBottom: 28 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    alignItems: "flex-start",
  },
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
