import { useFocusEffect, useNavigation, useTheme } from "@react-navigation/native";
import * as AppleAuthentication from "expo-apple-authentication";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { AuthInput } from "../../components/ui/AuthInput";
import Button from "../../components/ui/Button";
import { Toast } from "../../components/ui/Toast";
import { AuthValidation } from "../../lib/firebase";
import { useAuthStore } from "../../state/authStore";

export default function CreateAccount() {
  const nav = useNavigation();
  const { colors } = useTheme();
  const { signUp, signInWithApple, isLoading, signupError, clearSignupError } = useAuthStore();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);

  // Clear errors when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      clearSignupError();
      setShowToast(false);
      return () => {
        // Cleanup when leaving screen
        clearSignupError();
      };
    }, [clearSignupError])
  );

  const validateInputs = (): boolean => {
    const usernameValidation = AuthValidation.validateUsername(username);
    const emailValidation = AuthValidation.validateEmail(email);
    const passwordValidation = AuthValidation.validatePassword(password);

    setUsernameError(usernameValidation);
    setEmailError(emailValidation);
    setPasswordError(passwordValidation);

    return !usernameValidation && !emailValidation && !passwordValidation;
  };

  const onCreate = async () => {
    console.log('📝 Create Account button pressed');
    // Clear previous errors
    clearSignupError();
    setShowToast(false);

    // Validate inputs
    if (!validateInputs()) {
      console.log('❌ Validation failed');
      return;
    }

    console.log('✅ Validation passed, attempting sign up...');
    try {
      await signUp(email, password, username);
      console.log('✅ signUp completed successfully');
      // Clear form on success
      setUsername("");
      setEmail("");
      setPassword("");
      setUsernameError(null);
      setEmailError(null);
      setPasswordError(null);
      console.log('📝 Form cleared, waiting for navigation...');
      // Navigation will be handled by the auth state change
    } catch (error) {
      // Show toast for auth errors
      setShowToast(true);
      console.log("❌ Sign up error:", error);
    }
  };

  const handleAppleSignIn = async () => {
    try {
      setAppleLoading(true);
      await signInWithApple();
    } catch {
      setShowToast(true);
    } finally {
      setAppleLoading(false);
    }
  };

  const TEXT = colors?.text ?? "#111827";
  const BG = colors?.background ?? "#ffffff";
  const BORDER = colors?.border ?? "#d1d5db";
  const ACCENT = colors?.primary ?? "#5eada8";
  // Secondary text should be more visible than borders
  const SECONDARY_TEXT = colors?.text ? `${colors.text}99` : "#6b7280";

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: BG }]}
      contentContainerStyle={styles.contentContainer}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      bounces={false}
    >
      {/* Title */}
      <Text style={[styles.title, { color: TEXT }]}>Create Account</Text>
      <Text style={[styles.subtitle, { color: SECONDARY_TEXT }]}>
        Let&apos;s set up your account to get started
      </Text>

      {/* Toast for auth errors */}
      <Toast
        message={signupError?.message || ""}
        type="error"
        visible={showToast && !!signupError}
        onDismiss={() => setShowToast(false)}
      />

      {/* Inputs */}
      <View style={styles.inputContainer}>
        <AuthInput
          label="Username"
          placeholder="Choose a username"
          value={username}
          onChangeText={(text: string) => {
            setUsername(text);
            if (usernameError) setUsernameError(null);
            if (signupError) clearSignupError();
          }}
          error={usernameError}
          autoCapitalize="none"
          autoComplete="username"
          textContentType="username"
          editable={!isLoading}
          required
        />

        <AuthInput
          label="Email Address"
          placeholder="Enter your email"
          value={email}
          onChangeText={(text: string) => {
            setEmail(text);
            if (emailError) setEmailError(null);
            if (signupError) clearSignupError();
          }}
          error={emailError}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
          editable={!isLoading}
          required
        />

        <AuthInput
          label="Password"
          placeholder="Create a strong password"
          value={password}
          onChangeText={(text: string) => {
            setPassword(text);
            if (passwordError) setPasswordError(null);
            if (signupError) clearSignupError();
          }}
          error={passwordError}
          isPassword
          showPasswordToggle
          autoComplete="password"
          textContentType="password"
          editable={!isLoading}
          required
        />
      </View>

      {/* Primary button */}
      <Button
        title="Create Account"
        onPress={onCreate}
        variant="primary"
        loading={isLoading && !appleLoading}
        disabled={isLoading}
        style={styles.createButton}
      />

      {Platform.OS === "ios" && (
        <>
          {/* OR divider */}
          <View style={styles.dividerContainer}>
            <View style={[styles.dividerLine, { backgroundColor: BORDER }]} />
            <Text style={[styles.dividerText, { color: SECONDARY_TEXT }]}>or</Text>
            <View style={[styles.dividerLine, { backgroundColor: BORDER }]} />
          </View>

          {/* Apple sign in (iOS only) */}
          {appleLoading ? (
            <View style={styles.appleButtonLoading}>
              <ActivityIndicator color="#ffffff" />
            </View>
          ) : (
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
              cornerRadius={14}
              style={styles.appleButton}
              onPress={handleAppleSignIn}
            />
          )}
        </>
      )}

      {/* Already have an account */}
      <View style={styles.loginContainer}>
        <Text style={[styles.loginText, { color: SECONDARY_TEXT }]}>
          Already have an account?{" "}
        </Text>
        <Pressable onPress={() => nav.navigate("Login" as never)}>
          {({ pressed }) => (
            <Text style={[styles.loginLink, { color: ACCENT, opacity: pressed ? 0.6 : 1, textDecorationLine: "underline" }]}>
              Log in.
            </Text>
          )}
        </Pressable>
      </View>

      {/* Footer legal */}
      <View style={styles.legalContainer}>
        <Text style={[styles.legalText, { color: SECONDARY_TEXT }]}>
          By creating an account, you indicate that you have read and agree to the{" "}
        </Text>
        <Pressable onPress={() => nav.navigate("PrivacyPolicy" as never)}>
          {({ pressed }) => (
            <Text style={[styles.legalLink, { color: ACCENT, opacity: pressed ? 0.6 : 1 }]}>
              Privacy Policy
            </Text>
          )}
        </Pressable>
        <Text style={[styles.legalText, { color: SECONDARY_TEXT }]}> and </Text>
        <Pressable onPress={() => nav.navigate("TermsOfUse" as never)}>
          {({ pressed }) => (
            <Text style={[styles.legalLink, { color: ACCENT, opacity: pressed ? 0.6 : 1 }]}>
              Terms of Use
            </Text>
          )}
        </Pressable>
        <Text style={[styles.legalText, { color: SECONDARY_TEXT }]}>.</Text>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  contentContainer: {
    paddingTop: 80,
    paddingBottom: 40,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 16,
    marginTop: 8,
  },
  inputContainer: {
    marginTop: 32,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  createButton: {
    marginTop: 32,
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: 'center',
  },
  createButtonText: {
    fontWeight: '600',
    fontSize: 18,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    paddingHorizontal: 12,
  },
  appleButton: {
    width: '100%',
    height: 48,
  },
  appleButtonLoading: {
    width: '100%',
    height: 48,
    borderRadius: 14,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appleButtonFallback: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  appleButtonText: {
    fontWeight: '600',
    fontSize: 16,
  },
  loginContainer: {
    marginTop: 24,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  loginText: {
    fontSize: 16,
  },
  loginLink: {
    fontWeight: '600',
    fontSize: 16,
  },
  legalContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 40,
    paddingHorizontal: 20,
  },
  legalText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 20,
  },
  legalLink: {
    fontSize: 12,
    fontWeight: '600',
    textDecorationLine: 'underline',
    lineHeight: 20,
  },
  createButtonDisabled: {
    opacity: 0.7,
  },
});