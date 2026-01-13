import { useFocusEffect, useNavigation, useTheme } from "@react-navigation/native";
import * as AppleAuthentication from "expo-apple-authentication";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { AuthInput } from "../../components/ui/AuthInput";
import Button from "../../components/ui/Button";
import { Toast } from "../../components/ui/Toast";
import { AuthValidation } from "../../lib/firebase";
import { useAuthStore } from "../../state/authStore";

export default function Login() {
  const nav = useNavigation();
  const { colors } = useTheme();
  const { signIn, signInWithApple, isLoading, loginError, clearLoginError } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      clearLoginError();
      setShowToast(false);
      return () => {
        clearLoginError();
      };
    }, [clearLoginError])
  );

  const validateInputs = (): boolean => {
    const emailValidation = AuthValidation.validateEmail(email);
    const passwordValidation = AuthValidation.validatePassword(password);

    setEmailError(emailValidation);
    setPasswordError(passwordValidation);

    return !emailValidation && !passwordValidation;
  };

  const onLogin = async () => {
    clearLoginError();
    setShowToast(false);

    if (!validateInputs()) {
      console.log('❌ Validation failed');
      return;
    }

    try {
      await signIn(email, password);
      setEmail("");
      setPassword("");
      setEmailError(null);
      setPasswordError(null);
    } catch (error) {
      setShowToast(true);
      console.log("❌ Login error:", error);
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
  const SECONDARY_TEXT = colors?.text ? `${colors.text}99` : "#6b7280";

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: BG }]}
      contentContainerStyle={styles.contentContainer}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      bounces={false}
    >
      <Text style={[styles.title, { color: TEXT }]}>Log In</Text>
      <Text style={[styles.subtitle, { color: SECONDARY_TEXT }]}>
        Welcome back. Let&apos;s get you logged in.
      </Text>

      <Toast
        message={loginError?.message || ""}
        type="error"
        visible={showToast && !!loginError}
        onDismiss={() => setShowToast(false)}
      />

      <View style={styles.inputContainer}>
        <AuthInput
          label="Email Address"
          placeholder="Enter your email"
          value={email}
          onChangeText={(text: string) => {
            setEmail(text);
            if (emailError) setEmailError(null);
            if (loginError) clearLoginError();
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
          placeholder="Enter your password"
          value={password}
          onChangeText={(text: string) => {
            setPassword(text);
            if (passwordError) setPasswordError(null);
            if (loginError) clearLoginError();
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

      <Button
        title="Sign In"
        onPress={onLogin}
        variant="primary"
        loading={isLoading && !appleLoading}
        disabled={isLoading}
        style={styles.loginButton}
      />

      {Platform.OS === "ios" && (
        <>
          <View style={styles.dividerContainer}>
            <View style={[styles.dividerLine, { backgroundColor: BORDER }]} />
            <Text style={[styles.dividerText, { color: SECONDARY_TEXT }]}>or</Text>
            <View style={[styles.dividerLine, { backgroundColor: BORDER }]} />
          </View>

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
      )
      }

      <View style={styles.createAccountContainer}>
        <Text style={[styles.createAccountText, { color: SECONDARY_TEXT }]}>
          Don&apos;t have an account?{" "}
        </Text>
        <Pressable onPress={() => nav.navigate("CreateAccount" as never)}>
          {({ pressed }) => (
            <Text style={[styles.createAccountLink, { color: ACCENT, opacity: pressed ? 0.6 : 1, textDecorationLine: "underline" }]}>
              Create one.
            </Text>
          )}
        </Pressable>
      </View>
    </ScrollView >
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
  loginButton: {
    marginTop: 32,
    backgroundColor: '#5eada8',
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: 'center',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 24,
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
    marginBottom: 24,
  },
  appleButtonLoading: {
    width: '100%',
    height: 48,
    borderRadius: 14,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  createAccountContainer: {
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  createAccountText: {
    fontSize: 16,
  },
  createAccountLink: {
    fontWeight: '600',
    fontSize: 16,
  },
});