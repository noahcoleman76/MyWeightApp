import { useNavigation, useTheme } from "@react-navigation/native";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import BackButton from "../../components/ui/BackButton";

export default function PrivacyPolicy() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const TEXT = colors?.text ?? "#111827";
  const CARD_BG = colors?.card ?? "#FFFFFF";
  const BORDER = colors?.border ?? "#e5e7eb";

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors?.background ?? "#f3f4f6" }]}>
      {/* Header with back button */}
      <View style={[styles.header, { backgroundColor: CARD_BG, borderBottomColor: BORDER }]}>
        <BackButton onPress={() => navigation.goBack()} showText={false} />
        <Text style={[styles.headerTitle, { color: TEXT }]}>Privacy Policy</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.card, { backgroundColor: CARD_BG, borderColor: BORDER }]}>
          <Text style={[styles.lastUpdated, { color: TEXT }]}>
            Last updated: December 5, 2025
          </Text>

          <Text style={[styles.content, { color: TEXT }]}>
            At MyWeightApp, we take your privacy seriously. This Privacy Policy explains how we collect, use, and protect your personal information when you use our mobile application.
          </Text>

          <Text style={[styles.sectionTitle, { color: TEXT }]}>Information We Collect</Text>
          <Text style={[styles.content, { color: TEXT }]}>
            <Text style={styles.bold}>Personal Information:</Text> When you create an account, we collect your name, email address, and authentication credentials.
          </Text>
          <Text style={[styles.content, { color: TEXT }]}>
            <Text style={styles.bold}>Health Data:</Text> We collect and store your weight, height, age, activity level, and fitness goals that you voluntarily provide to help track your progress.
          </Text>
          <Text style={[styles.content, { color: TEXT }]}>
            <Text style={styles.bold}>Usage Data:</Text> We may collect information about how you use our app, including features accessed and time spent in the app.
          </Text>

          <Text style={[styles.sectionTitle, { color: TEXT }]}>How We Use Your Information</Text>
          <Text style={[styles.content, { color: TEXT }]}>
            • Provide and maintain our weight tracking services{'\n'}
            • Calculate your daily calorie recommendations and track progress{'\n'}
            • Send you notifications and updates about your goals{'\n'}
            • Improve our app&apos;s functionality and user experience{'\n'}
            • Provide customer support when needed
          </Text>

          <Text style={[styles.sectionTitle, { color: TEXT }]}>Data Storage and Security</Text>
          <Text style={[styles.content, { color: TEXT }]}>
            Your data is securely stored using Firebase&apos;s cloud infrastructure with industry-standard encryption. We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
          </Text>

          <Text style={[styles.sectionTitle, { color: TEXT }]}>Data Sharing</Text>
          <Text style={[styles.content, { color: TEXT }]}>
            We do not sell, trade, or otherwise transfer your personal information to third parties. Your health data remains private and is only used within our app to provide you with personalized weight tracking services.
          </Text>

          <Text style={[styles.sectionTitle, { color: TEXT }]}>Your Rights</Text>
          <Text style={[styles.content, { color: TEXT }]}>
            You have the right to:{'\n'}
            • Access and update your personal information{'\n'}
            • Delete your account and associated data{'\n'}
            • Request a copy of your data{'\n'}
            • Withdraw consent for data processing
          </Text>

          <Text style={[styles.sectionTitle, { color: TEXT }]}>Data Retention</Text>
          <Text style={[styles.content, { color: TEXT }]}>
            We retain your personal information for as long as your account is active. If you delete your account, we will permanently remove all your personal data from our systems within 30 days.
          </Text>

          <Text style={[styles.sectionTitle, { color: TEXT }]}>Children&apos;s Privacy</Text>
          <Text style={[styles.content, { color: TEXT }]}>
            Our app is not intended for use by children under 13 years of age. We do not knowingly collect personal information from children under 13.
          </Text>

          <Text style={[styles.sectionTitle, { color: TEXT }]}>Changes to This Policy</Text>
          <Text style={[styles.content, { color: TEXT }]}>
            We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy in the app and updating the &quot;Last updated&quot; date.
          </Text>

          <Text style={[styles.sectionTitle, { color: TEXT }]}>Contact Us</Text>
          <Text style={[styles.content, { color: TEXT }]}>
            If you have any questions about this Privacy Policy, please contact us at:{'\n'}
            Email: support@myweightapp.com
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    flex: 1,
  },
  headerSpacer: {
    width: 40, // Same width as BackButton to center the title
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  lastUpdated: {
    fontSize: 14,
    fontStyle: 'italic',
    marginBottom: 24,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 24,
    marginBottom: 12,
  },
  content: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
  bold: {
    fontWeight: '600',
  },
});