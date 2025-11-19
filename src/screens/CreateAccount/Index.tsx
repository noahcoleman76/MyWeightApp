import { useNavigation } from "@react-navigation/native";
import * as AppleAuthentication from "expo-apple-authentication";
import React, { useState } from "react";
import { Linking, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";

export default function CreateAccount() {
  const nav = useNavigation();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const onCreate = () => {
    // TODO: Hook into your auth flow
    console.log("create account:", { username, email, password });
  };

  const handleAppleSignIn = async () => {
    try {
      // TODO: implement real Apple sign-in
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
      <Text className="text-3xl font-bold text-gray-900">Create Account</Text>
      <Text className="text-base text-gray-600 mt-2">
        Let’s set up your account to get started
      </Text>

      {/* Inputs */}
      <View className="mt-8 space-y-4">
        <TextInput
          placeholder="Your username"
          value={username}
          onChangeText={setUsername}
          className="border border-gray-300 rounded-xl px-4 py-3 text-base bg-gray-50"
          autoCapitalize="none"
        />
        <TextInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
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
        onPress={onCreate}
        className="mt-8 bg-[#5eada8] py-3 rounded-2xl items-center"
      >
        <Text className="text-white font-semibold text-lg">Create Account</Text>
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
        // Simple fallback button for non-iOS (optional)
        <Pressable
          onPress={handleAppleSignIn}
          className="w-full py-3 rounded-2xl border border-gray-300 items-center"
        >
          <Text className="font-semibold text-base">Continue with Apple</Text>
        </Pressable>
      )}

      {/* Already have an account */}
      <Pressable
        onPress={() => nav.navigate("Login" as never)}
        className="mt-6 flex-row justify-center"
      >
        <Text className="text-gray-600 text-base">
          Already have an account?{" "}
        </Text>
        <Text className="text-[#5eada8] font-semibold text-base">
          Log In
        </Text>
      </Pressable>

      {/* Footer legal */}
      <Text className="text-xs text-gray-500 mt-10 text-center leading-5">
        By creating an account, you indicate that you have read and agree to the{" "}
        <Text
          className="underline"
          onPress={() => Linking.openURL("https://MyWeightApp.com/PrivacyPolicy")}
        >
          Privacy Policy
        </Text>{" "}
        and{" "}
        <Text
          className="underline"
          onPress={() => Linking.openURL("https://MyWeightApp.com/TermsOfUse")}
        >
          Terms of Use
        </Text>
        .
      </Text>
    </ScrollView>
  );
}
