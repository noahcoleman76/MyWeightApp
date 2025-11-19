// app/screens/Auth/Login.tsx (or wherever you keep it)

import { useNavigation } from "@react-navigation/native";
import * as AppleAuthentication from "expo-apple-authentication";
import React, { useState } from "react";
import { Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";

export default function Login() {
  const nav = useNavigation();

  const [identifier, setIdentifier] = useState(""); // username or email
  const [password, setPassword] = useState("");

  const onLogin = () => {
    // TODO: Hook into your auth flow
    console.log("log in:", { identifier, password });
  };

  const handleAppleSignIn = async () => {
    try {
      // TODO: Implement real Apple sign-in
      console.log("Apple sign-in pressed");
    } catch (e) {
      console.warn(e);
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-white px-6"
      contentContainerStyle={{ paddingTop: 80, paddingBottom: 40 }}
      keyboardShouldPersistTaps="handled"
    >
      {/* Title */}
      <Text className="text-3xl font-bold text-gray-900">Log In</Text>
      <Text className="text-base text-gray-600 mt-2">
        Welcome back. Let’s get you logged in.
      </Text>

      {/* Inputs */}
      <View className="mt-8 space-y-4">
        <TextInput
          placeholder="Username or email"
          value={identifier}
          onChangeText={setIdentifier}
          className="border border-gray-300 rounded-xl px-4 py-3 text-base bg-gray-50"
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          placeholder="Enter password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          className="border border-gray-300 rounded-xl px-4 py-3 text-base bg-gray-50"
        />
      </View>

      {/* Primary button */}
      <Pressable
        onPress={onLogin}
        className="mt-8 bg-[#5eada8] py-3 rounded-2xl items-center"
      >
        <Text className="text-white font-semibold text-lg">Log In</Text>
      </Pressable>

      {/* OR divider */}
      <View className="flex-row items-center mt-6 mb-2">
        <View className="flex-1 h-px bg-gray-300" />
        <Text className="px-3 text-gray-500">or</Text>
        <View className="flex-1 h-px bg-gray-300" />
      </View>

      {/* Apple sign in */}
      {Platform.OS === "ios" ? (
        <AppleAuthentication.AppleAuthenticationButton
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
          buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
          cornerRadius={14}
          style={{ width: "100%", height: 48 }}
          onPress={handleAppleSignIn}
        />
      ) : (
        // Simple fallback for non-iOS
        <Pressable
          onPress={handleAppleSignIn}
          className="w-full py-3 rounded-2xl border border-gray-300 items-center"
        >
          <Text className="font-semibold text-base">Continue with Apple</Text>
        </Pressable>
      )}

      {/* Don’t have an account */}
      <Pressable
        onPress={() => nav.navigate("CreateAccount" as never)}
        className="mt-6 flex-row justify-center"
      >
        <Text className="text-gray-600 text-base">
          Don’t have an account?{" "}
        </Text>
        <Text className="text-[#5eada8] font-semibold text-base">
          Create one
        </Text>
      </Pressable>
    </ScrollView>
  );
}
