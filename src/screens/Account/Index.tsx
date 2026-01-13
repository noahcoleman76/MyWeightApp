import { SubscriptionService } from "@/src/lib/subscriptionService";
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
import { useSubscriptionStore } from "../../state/subscriptionStore";

export default function Account() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const primary = colors?.primary ?? "#5eada8";
  const TEXT = colors?.text ?? "#111827";
  const CARD_BG = colors?.card ?? "#FFFFFF";
  const BORDER = colors?.border ?? "#e5e7eb";

  const { profile, setName } = useProfileStore();
  const { user, signOut, deleteAccount, isLoading } = useAuthStore();
  const { isEntitled, productId, lastPurchaseDate } = useSubscriptionStore();
  
  const [name, setNameLocal] = useState(profile.name);
  const [isRestoring, setIsRestoring] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  
  React.useEffect(() => {
    setNameLocal(profile.name);
  }, [profile.name]);
  
  const hasUnsavedChanges = name.trim() !== profile.name;

  const save = async () => {
    try {
      const trimmedName = name.trim() || "You";
      setName(trimmedName);
      
      if (user?.uid) {
        await FirebaseAuthService.updateDisplayName(trimmedName);
        await UserDataService.syncToFirestore(user.uid);
        setSaveSuccess(true);
      } else {
        setSaveSuccess(true);
      }
    } catch (error) {
      console.error("❌ Failed to save profile:", error);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            try {
              await signOut();
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
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Account",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "Final Confirmation",
              "This will permanently delete your account and all associated data. Are you absolutely sure?",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Yes, Delete Forever",
                  style: "destructive",
                  onPress: async () => {
                    try {
                      if (user?.uid) {
                        await UserDataService.deleteAllUserData(user.uid);
                      }
                      await deleteAccount();
                    } catch (error) {
                      console.error("❌ Failed to delete account:", error);
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

  const handleManageSubscription = async () => {
    try {
      await SubscriptionService.openSubscriptionManagement();
    } catch (error) {
      console.error("❌ Error opening subscription management:", error);
      Alert.alert(
        "Unable to Open Settings",
        "Please manage your subscription through:\n\niOS: Settings > Apple ID > Subscriptions\nAndroid: Play Store > Menu > Subscriptions"
      );
    }
  };

  const handleRestorePurchase = async () => {
    if (isRestoring) return;

    setIsRestoring(true);
    try {
      const { success, restored } = await SubscriptionService.restorePurchases();

      if (success && restored) {
        Alert.alert(
          "Subscription Restored! ✅",
          "Your premium access has been restored successfully."
        );
      } else if (success && !restored) {
        Alert.alert(
          "No Active Subscription",
          "We couldn't find any active subscriptions for this account. If you believe this is an error, please contact support."
        );
      } else {
        Alert.alert(
          "Restore Failed",
          "There was an issue restoring your purchases. Please try again or contact support."
        );
      }
    } catch (error) {
      console.error("❌ Error restoring purchases:", error);
      Alert.alert(
        "Restore Failed",
        "There was an issue restoring your purchases. Please try again."
      );
    } finally {
      setIsRestoring(false);
    }
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
        <View style={s.header}>
          <Text style={[s.title, { color: TEXT }]}>Account</Text>
          <Text style={[s.subtitle, { color: TEXT }]}>
            Manage your profile and settings
          </Text>
        </View>

        {user && (
          <View style={s.userHeader}>
            <View style={[s.userHeaderCard, { backgroundColor: CARD_BG, borderColor: BORDER }]}>
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

        <View style={s.full}>
          <View style={[s.card, { borderColor: BORDER, backgroundColor: CARD_BG }]}>
            <Text style={[s.sectionTitle, { color: TEXT }]}>Subscription</Text>

            <View style={[s.subscriptionStatus, { backgroundColor: isEntitled ? "#f0fdf4" : "#fef2f2", borderColor: isEntitled ? "#86efac" : "#fecaca" }]}>
              <View style={s.statusHeader}>
                <MaterialIcons 
                  name={isEntitled ? "check-circle" : "info"} 
                  size={24} 
                  color={isEntitled ? "#16a34a" : "#dc2626"} 
                />
                <Text style={[s.statusTitle, { color: isEntitled ? "#16a34a" : "#dc2626" }]}>
                  {isEntitled ? "Premium Active" : "No Active Subscription"}
                </Text>
              </View>
              
              {isEntitled && productId && (
                <View style={s.statusDetails}>
                  <Text style={[s.statusDetail, { color: "#6b7280" }]}>
                    Plan: Monthly Premium
                  </Text>
                  {lastPurchaseDate && (
                    <Text style={[s.statusDetail, { color: "#6b7280" }]}>
                      Active since: {new Date(lastPurchaseDate).toLocaleDateString()}
                    </Text>
                  )}
                </View>
              )}
            </View>

            <View style={s.linkGroup}>
              {isEntitled && (
                <TouchableOpacity
                  style={[s.linkButton, { borderColor: BORDER, backgroundColor: colors?.background ?? "#f9fafb" }]}
                  onPress={handleManageSubscription}
                >
                  <View style={s.linkContent}>
                    <MaterialIcons name="settings" size={20} color={primary} />
                    <View style={{ flex: 1 }}>
                      <Text style={[s.linkText, { color: TEXT }]}>Manage Subscription</Text>
                      <Text style={[s.linkSubtext, { color: "#6b7280" }]}>
                        View or cancel your subscription
                      </Text>
                    </View>
                    <MaterialIcons name="chevron-right" size={20} color="#9ca3af" />
                  </View>
                </TouchableOpacity>
              )}

              <Button
                title={isRestoring ? "Restoring..." : "Restore Purchase"}
                onPress={handleRestorePurchase}
                disabled={isRestoring}
                variant="ghost"
                accentColor={primary}
                style={{ backgroundColor: colors?.background ?? "#f9fafb" }}
              />
            </View>

            <View style={s.infoBox}>
              <Text style={[s.infoText, { color: "#6b7280" }]}>
                {isEntitled 
                  ? "To cancel your subscription, use the 'Manage Subscription' button above. Your subscription will remain active until the end of the current billing period."
                  : "Already subscribed? Use 'Restore Purchase' to regain access. If you haven't subscribed yet, you'll see the paywall on next app launch."}
              </Text>
            </View>
          </View>
        </View>

        <View style={s.full}>
          <View style={[s.card, { borderColor: BORDER, backgroundColor: CARD_BG }]}>
            <Text style={[s.sectionTitle, { color: TEXT }]}>Help &amp; Support</Text>

            <View style={s.linkGroup}>
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

              <TouchableOpacity
                style={[s.linkButton, { borderColor: BORDER, backgroundColor: colors?.background ?? "#f9fafb" }]}
                onPress={() => navigation.navigate("PrivacyPolicy" as never)}
              >
                <View style={s.linkContent}>
                  <MaterialIcons name="privacy-tip" size={20} color={primary} />
                  <Text style={[s.linkText, { color: TEXT }]}>Privacy Policy</Text>
                </View>
              </TouchableOpacity>

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

const s = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#f3f4f6",
  },
  scroll: {
    paddingBottom: 28,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    alignItems: "flex-start",
  },
  title: {
    fontSize: 34,
    fontWeight: "800",
  },
  subtitle: {
    fontSize: 16,
    marginTop: 4,
    fontWeight: "400",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
  },
  full: {
    marginHorizontal: 20,
    marginBottom: 16,
  },
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
  linkGroup: {
    gap: 12,
  },
  linkButton: {
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: "flex-start",
  },
  linkText: {
    fontSize: 16,
    fontWeight: "600",
  },
  linkContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  linkSubtext: {
    fontSize: 13,
    marginTop: 2,
    fontWeight: "400",
  },
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
  subscriptionStatus: {
    borderRadius: 16,
    borderWidth: 2,
    padding: 16,
    marginBottom: 16,
  },
  statusHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  statusDetails: {
    marginLeft: 36,
    gap: 4,
  },
  statusDetail: {
    fontSize: 14,
    fontWeight: "500",
  },
  infoBox: {
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "400",
  },
});
