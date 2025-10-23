import React, { useState } from "react";
import { Button, Linking, Text, TextInput, View } from "react-native";
import { useProfileStore } from "../../state/profileStore";

export default function Account() {
  const { profile, setName, setEmail } = useProfileStore();
  const [name, setNameLocal] = useState(profile.name);
  const [email, setEmailLocal] = useState(profile.email ?? "");

  const save = () => { setName(name.trim() || "You"); setEmail(email.trim() || undefined); };

  return (
    <View className="flex-1 bg-white p-4">
      <Text className="text-2xl font-semibold">Account</Text>

      <Text className="mt-4 text-sm text-gray-600">Name</Text>
      <TextInput value={name} onChangeText={setNameLocal} className="mt-2 border rounded-lg px-3 py-2" />

      <Text className="mt-4 text-sm text-gray-600">Email</Text>
      <TextInput
        value={email}
        onChangeText={setEmailLocal}
        keyboardType="email-address"
        autoCapitalize="none"
        className="mt-2 border rounded-lg px-3 py-2"
      />

      <View className="mt-4">
        <Button title="Save" onPress={save} />
      </View>

      <View className="mt-8 p-4 rounded-xl border">
        <Text className="text-lg font-semibold mb-2">Help & Legal</Text>
        <View className="mb-3">
          <Button
            title="Contact Support"
            onPress={() => Linking.openURL(`mailto:support@myweightapp.com?subject=MyWeight%20Support`)}
          />
        </View>
        <View className="mb-3">
          <Button title="Privacy Policy" onPress={() => Linking.openURL("https://myweightapp.com/privacy")} />
        </View>
        <View className="mb-1">
          <Button title="Terms of Use" onPress={() => Linking.openURL("https://myweightapp.com/terms")} />
        </View>
      </View>
    </View>
  );
}
