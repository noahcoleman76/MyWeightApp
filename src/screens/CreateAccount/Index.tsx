import { useFocusEffect, useNavigation } from "@react-navigation/native";
import * as AppleAuthentication from "expo-apple-authentication";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import AuthInput from "../../components/ui/AuthInput";
import Toast from "../../components/ui/Toast";
import { AuthValidation } from "../../lib/firebase";
import { useAuthStore } from "../../state/authStore";

export default function CreateAccount() {
  const nav = useNavigation();
  const { signUp, signInWithApple, isLoading, signupError, clearSignupError } = useAuthStore();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);

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
      console.log('Apple sign-in pressed');
      await signInWithApple();
    } catch (e) {
      console.warn(e);
      setShowToast(true);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      bounces={false}
    >
      {/* Title */}
      <Text style={styles.title}>Create Account</Text>
      <Text style={styles.subtitle}>
        Let's set up your account to get started
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
      <Pressable
        onPress={onCreate}
        style={[styles.createButton, isLoading && styles.createButtonDisabled]}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#ffffff" size="small" />
        ) : (
          <Text style={styles.createButtonText}>Create Account</Text>
        )}
      </Pressable>

      {Platform.OS === "ios" && (
        <>
          {/* OR divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Apple sign in (iOS only) */}
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
            cornerRadius={14}
            style={styles.appleButton}
            onPress={handleAppleSignIn}
          />
        </>
      )}

      {/* Already have an account */}
      <Pressable
        onPress={() => nav.navigate("Login" as never)}
        style={styles.loginContainer}
      >
        <Text style={styles.loginText}>
          Already have an account?{" "}
        </Text>
        <Text style={styles.loginLink}>
          Log In
        </Text>
      </Pressable>

      {/* Footer legal */}
      <Text style={styles.legalText}>
        By creating an account, you indicate that you have read and agree to the{" "}
        <Text
          style={styles.legalLink}
          onPress={() => Linking.openURL("https://MyWeightApp.com/PrivacyPolicy")}
        >
          Privacy Policy
        </Text>{" "}
        and{" "}
        <Text
          style={styles.legalLink}
          onPress={() => Linking.openURL("https://MyWeightApp.com/TermsOfUse")}
        >
          Terms of Use
        </Text>
        .
      </Text>


    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingHorizontal: 24,
  },
  contentContainer: {
    paddingTop: 80,
    paddingBottom: 40,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 8,
  },
  inputContainer: {
    marginTop: 32,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#f9fafb',
    marginBottom: 16,
  },
  createButton: {
    marginTop: 32,
    backgroundColor: '#5eada8',
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#ffffff',
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
    backgroundColor: '#d1d5db',
  },
  dividerText: {
    paddingHorizontal: 12,
    color: '#6b7280',
  },
  appleButton: {
    width: '100%',
    height: 48,
  },
  appleButtonFallback: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#d1d5db',
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
    color: '#6b7280',
    fontSize: 16,
  },
  loginLink: {
    color: '#5eada8',
    fontWeight: '600',
    fontSize: 16,
  },
  legalText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 40,
    textAlign: 'center',
    lineHeight: 20,
  },
  legalLink: {
    textDecorationLine: 'underline',
  },
  createButtonDisabled: {
    opacity: 0.7,
  },
});