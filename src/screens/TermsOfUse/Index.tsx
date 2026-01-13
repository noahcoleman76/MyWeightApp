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

export default function TermsOfUse() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const TEXT = colors?.text ?? "#111827";
  const CARD_BG = colors?.card ?? "#FFFFFF";
  const BORDER = colors?.border ?? "#e5e7eb";

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors?.background ?? "#f3f4f6" }]}>
      <View style={[styles.header, { backgroundColor: CARD_BG, borderBottomColor: BORDER }]}>
        <BackButton onPress={() => navigation.goBack()} showText={false} />
        <Text style={[styles.headerTitle, { color: TEXT }]}>Terms of Use</Text>
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
            Welcome to MyWeightApp. These Terms of Use (&quot;Terms&quot;) govern your use of our mobile application and services. By using our app, you agree to these terms.
          </Text>

          <Text style={[styles.sectionTitle, { color: TEXT }]}>Acceptance of Terms</Text>
          <Text style={[styles.content, { color: TEXT }]}>
            By downloading, installing, or using MyWeightApp, you acknowledge that you have read, understood, and agree to be bound by these Terms. If you do not agree to these Terms, please do not use our app.
          </Text>

          <Text style={[styles.sectionTitle, { color: TEXT }]}>Description of Service</Text>
          <Text style={[styles.content, { color: TEXT }]}>
            MyWeightApp is a weight tracking application that helps you monitor your weight, set health goals, and track your progress over time. We provide tools for calorie calculation, progress visualization, and goal setting.
          </Text>

          <Text style={[styles.sectionTitle, { color: TEXT }]}>User Accounts</Text>
          <Text style={[styles.content, { color: TEXT }]}>
            To use certain features of our app, you must create an account. You are responsible for:{'\n'}
            • Maintaining the confidentiality of your account credentials{'\n'}
            • All activities that occur under your account{'\n'}
            • Notifying us immediately of any unauthorized use{'\n'}
            • Providing accurate and complete information
          </Text>

          <Text style={[styles.sectionTitle, { color: TEXT }]}>Acceptable Use</Text>
          <Text style={[styles.content, { color: TEXT }]}>
            You agree to use MyWeightApp only for lawful purposes. You will not:{'\n'}
            • Use the app in any way that violates applicable laws{'\n'}
            • Attempt to gain unauthorized access to our systems{'\n'}
            • Upload or transmit malicious code{'\n'}
            • Interfere with or disrupt our services{'\n'}
            • Share false, misleading, or harmful information
          </Text>

          <Text style={[styles.sectionTitle, { color: TEXT }]}>Health Disclaimer</Text>
          <Text style={[styles.content, { color: TEXT }]}>
            MyWeightApp is designed for informational purposes only and should not replace professional medical advice. Always consult with a healthcare professional before starting any weight loss or fitness program. We are not responsible for any health consequences resulting from your use of the app.
          </Text>

          <Text style={[styles.sectionTitle, { color: TEXT }]}>Intellectual Property</Text>
          <Text style={[styles.content, { color: TEXT }]}>
            All content, features, and functionality of MyWeightApp, including but not limited to software, text, graphics, logos, and images, are owned by us or our licensors and are protected by copyright, trademark, and other intellectual property laws.
          </Text>

          <Text style={[styles.sectionTitle, { color: TEXT }]}>Privacy</Text>
          <Text style={[styles.content, { color: TEXT }]}>
            Your privacy is important to us. Our collection and use of your personal information is governed by our Privacy Policy, which is incorporated into these Terms by reference.
          </Text>

          <Text style={[styles.sectionTitle, { color: TEXT }]}>Service Availability</Text>
          <Text style={[styles.content, { color: TEXT }]}>
            We strive to maintain high availability of our services, but we cannot guarantee uninterrupted access. We may modify, suspend, or discontinue our services at any time with or without notice.
          </Text>

          <Text style={[styles.sectionTitle, { color: TEXT }]}>Limitation of Liability</Text>
          <Text style={[styles.content, { color: TEXT }]}>
            To the maximum extent permitted by law, MyWeightApp and its creators shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the app.
          </Text>

          <Text style={[styles.sectionTitle, { color: TEXT }]}>Termination</Text>
          <Text style={[styles.content, { color: TEXT }]}>
            You may terminate your account at any time by deleting it through the app settings. We reserve the right to terminate or suspend accounts that violate these Terms without prior notice.
          </Text>

          <Text style={[styles.sectionTitle, { color: TEXT }]}>Changes to Terms</Text>
          <Text style={[styles.content, { color: TEXT }]}>
            We may update these Terms from time to time. When we do, we will post the updated Terms in the app and update the &quot;Last updated&quot; date. Your continued use of the app after changes constitutes acceptance of the new Terms.
          </Text>

          <Text style={[styles.sectionTitle, { color: TEXT }]}>Governing Law</Text>
          <Text style={[styles.content, { color: TEXT }]}>
            These Terms are governed by and construed in accordance with applicable laws. Any disputes arising under these Terms will be subject to the exclusive jurisdiction of the appropriate courts.
          </Text>

          <Text style={[styles.sectionTitle, { color: TEXT }]}>Contact Information</Text>
          <Text style={[styles.content, { color: TEXT }]}>
            If you have any questions about these Terms of Use, please contact us at:{'\n'}
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
    width: 40,
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
