// src/screens/Account/Index.tsx
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation, useTheme } from "@react-navigation/native";
import React, { useState } from "react";
import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Button from "../../components/ui/Button";
import { default as ToastComponent } from "../../components/ui/Toast";
import { FirebaseAuthService } from "../../lib/firebase";
import { UserDataService } from "../../lib/userDataService";
import { useAuthStore } from "../../state/authStore";
import { useProfileStore } from "../../state/profileStore";

export default function Account() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const primary = colors?.primary ?? "#5eada8";
  const TEXT = colors?.text ?? "#111827";
  const CARD_BG = colors?.card ?? "#FFFFFF";
  const BORDER = colors?.border ?? "#e5e7eb";

  const { profile, setName } = useProfileStore();
  const { user, signOut, deleteAccount, isLoading } = useAuthStore();
  const [name, setNameLocal] = useState(profile.name);
  
  // Update local state when profile changes
  React.useEffect(() => {
    setNameLocal(profile.name);
  }, [profile.name]);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Track if there are unsaved changes
  const hasUnsavedChanges = name.trim() !== profile.name;

  const save = async () => {
    try {
      const trimmedName = name.trim() || "You";
      
      // Update local stores
      setName(trimmedName);
      
      // Update Firebase Auth displayName and sync to Firestore if user is logged in
      if (user?.uid) {
        // Update Firebase Auth displayName
        await FirebaseAuthService.updateDisplayName(trimmedName);
        
        // Sync to Firestore
        await UserDataService.syncToFirestore(user.uid);
        setSaveSuccess(true);
      } else {
        setSaveSuccess(true);
      }
    } catch (error) {
      console.error("Failed to save profile:", error);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            try {
              await signOut();
              // Navigation will be handled by auth state change
            } catch {
              Alert.alert("Error", "Failed to sign out. Please try again.");
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to permanently delete your account? This action cannot be undone and will remove all your data.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete Account",
          style: "destructive",
          onPress: () => {
            // Second confirmation dialog
            Alert.alert(
              "Final Confirmation",
              "This will permanently delete your account and all associated data. Are you absolutely sure?",
              [
                {
                  text: "Cancel",
                  style: "cancel",
                },
                {
                  text: "Yes, Delete Forever",
                  style: "destructive",
                  onPress: async () => {
                    try {
                      // Delete user data from Firestore first
                      if (user?.uid) {
                        await UserDataService.deleteAllUserData(user.uid);
                      }
                      
                      // Then delete the Firebase Auth account
                      await deleteAccount();
                      // Navigation will be handled by auth state change
                    } catch (error) {
                      console.error("Failed to delete account:", error);
                      Alert.alert(
                        "Error", 
                        "Failed to delete account. You might need to re-authenticate and try again."
                      );
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors?.background ?? "#f3f4f6" }]}>
      <ToastComponent
        message="Profile updated successfully!"
        type="success"
        visible={saveSuccess}
        onDismiss={() => setSaveSuccess(false)}
      />

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={s.header}>
          <Text style={[s.title, { color: TEXT }]}>Account</Text>
          <Text style={[s.subtitle, { color: TEXT }]}>
            Manage your profile and settings
          </Text>
        </View>

        {/* User Info Header */}
        {user && (
          <View style={s.userHeader}>
            <View style={[s.userHeaderCard, { backgroundColor: CARD_BG, borderColor: BORDER }]}>
              {/* Edit Icon */}
              <TouchableOpacity 
                style={s.editIcon}
                onPress={() => setIsEditMode(!isEditMode)}
              >
                <MaterialIcons 
                  name={isEditMode ? "close" : "edit"} 
                  size={20} 
                  color={primary} 
                />
              </TouchableOpacity>
              
              <View style={s.avatarContainer}>
                <View style={[s.avatar, { backgroundColor: primary }]}>
                  <Text style={s.avatarText}>
                    {(profile.name || "U").charAt(0).toUpperCase()}
                  </Text>
                </View>
              </View>
              <Text style={[s.userName, { color: TEXT }]}>
                {profile.name || "User"}
              </Text>
              <Text style={[s.userEmail, { color: "#6b7280" }]}>
                {user.email}
              </Text>
              

              
              {/* Collapsible Edit Section */}
              {isEditMode && (
                <View style={[s.editSection, { borderTopColor: BORDER }]}>
                  <Text style={[s.editSectionTitle, { color: TEXT }]}>Update Display Name</Text>
                  
                  <View style={s.editInputContainer}>
                    <TextInput
                      value={name}
                      onChangeText={setNameLocal}
                      style={[s.editInput, { borderColor: primary, backgroundColor: CARD_BG, color: TEXT }]}
                      placeholder="Enter your display name"
                      placeholderTextColor="#9ca3af"
                    />
                  </View>

                  {hasUnsavedChanges && (
                    <View style={s.editActions}>
                      <Button
                        title="Update"
                        onPress={() => {
                          save();
                          setIsEditMode(false);
                        }}
                        variant="primary"
                        accentColor={primary}
                        style={s.updateButton}
                      />
                    </View>
                  )}
                </View>
              )}
            </View>
          </View>
        )}

        {/* Help & Legal Section */}
        <View style={s.full}>
          <View style={[s.card, { borderColor: BORDER, backgroundColor: CARD_BG }]}>
            <Text style={[s.sectionTitle, { color: TEXT }]}>Help &amp; Support</Text>

            <View style={s.linkGroup}>
              {/* Contact Support */}
              <TouchableOpacity
                style={[s.linkButton, { borderColor: BORDER, backgroundColor: colors?.background ?? "#f9fafb" }]}
                onPress={() =>
                  Linking.openURL(
                    `mailto:support@myweightapp.com?subject=MyWeight%20Support`
                  )
                }
              >
                <View style={s.linkContent}>
                  <MaterialIcons name="email" size={20} color={primary} />
                  <Text style={[s.linkText, { color: TEXT }]}>Contact Support</Text>
                </View>
              </TouchableOpacity>

              {/* Privacy Policy */}
              <TouchableOpacity
                style={[s.linkButton, { borderColor: BORDER, backgroundColor: colors?.background ?? "#f9fafb" }]}
                onPress={() => navigation.navigate("PrivacyPolicy" as never)}
              >
                <View style={s.linkContent}>
                  <MaterialIcons name="privacy-tip" size={20} color={primary} />
                  <Text style={[s.linkText, { color: TEXT }]}>Privacy Policy</Text>
                </View>
              </TouchableOpacity>

              {/* Terms of Use */}
              <TouchableOpacity
                style={[s.linkButton, { borderColor: BORDER, backgroundColor: colors?.background ?? "#f9fafb" }]}
                onPress={() => navigation.navigate("TermsOfUse" as never)}
              >
                <View style={s.linkContent}>
                  <MaterialIcons name="description" size={20} color={primary} />
                  <Text style={[s.linkText, { color: TEXT }]}>Terms of Use</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Account Management Section */}
        <View style={s.full}>
          <View style={[s.card, { borderColor: BORDER, backgroundColor: CARD_BG }]}>
            <Text style={[s.sectionTitle, { color: TEXT }]}>Account Management</Text>
            
            <View style={s.linkGroup}>
              <Button
                title={isLoading ? "Signing Out..." : "Sign Out"}
                onPress={handleLogout}
                disabled={isLoading}
                variant="ghost"
                accentColor="#dc2626"
                style={{ backgroundColor: "#fef2f2" }}
              />

              <Button
                title={isLoading ? "Processing..." : "Delete Account"}
                onPress={handleDeleteAccount}
                disabled={isLoading}
                variant="ghost"
                accentColor="#991b1b"
                style={{ backgroundColor: "#fee2e2", opacity: isLoading ? 0.5 : 1 }}
              />
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
  subtitle: { 
    fontSize: 16, 
    marginTop: 4,
    fontWeight: "400" 
  },
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: "700", 
    marginBottom: 16 
  },

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
  inputGroup: { marginBottom: 20 },
  linkGroup: { gap: 12 },
  linkButton: {
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: "flex-start",
  },
  linkText: { 
    fontSize: 16, 
    fontWeight: "600" 
  },
  linkContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },


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

  
  // New user header styles
  userHeader: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  userHeaderCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 32,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
    overflow: "hidden",
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "700",
    color: "#ffffff",
  },
  userName: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
    textAlign: "center",
  },
  userEmail: {
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
    marginBottom: 24,
  },
  
  // Collapsible edit section styles
  editSection: {
    width: "100%",
    borderTopWidth: 1,
    paddingTop: 24,
    marginTop: 16,
  },
  editSectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 20,
  },
  editInputContainer: {
    marginBottom: 20,
  },
  editInput: {
    borderWidth: 2,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 20,
    fontWeight: "500",
    textAlign: "center",
  },
  editActions: {
    alignItems: "center",
  },
  updateButton: {
    minWidth: 120,
  },
  
  // Edit icon styles
  editIcon: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
});






