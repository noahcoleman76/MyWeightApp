import { useNavigation } from "@react-navigation/native";
import React, { useState } from "react";
import { Button, Text, TouchableOpacity, View } from "react-native";
import { useGoalStore } from "../../state/goalStore";
import { useProfileStore } from "../../state/profileStore";

const BASE = ["health concerns", "mobility", "self image", "training", "personal growth"];

export default function Motivation() {
  const nav = useNavigation<any>();
  const mode = useGoalStore((s) => s.mode);
  const setMotivation = useProfileStore((s) => s.setMotivation);
  const [sel, setSel] = useState<string[]>([]);

  const toggle = (v: string) => setSel((arr) => (arr.includes(v) ? arr.filter((x) => x !== v) : arr.concat(v)));

  return (
    <View className="flex-1 items-center justify-center px-6 bg-white">
      <Text className="text-xl font-semibold text-center">Why do you want to {mode} weight?</Text>
      <View className="mt-5 w-full">
        {BASE.map((opt) => (
          <TouchableOpacity
            key={opt}
            className={`px-4 py-3 rounded-xl border mb-3 ${sel.includes(opt) ? "bg-black" : "bg-white"}`}
            onPress={() => toggle(opt)}
          >
            <Text className={`${sel.includes(opt) ? "text-white" : "text-black"} text-center`}>{opt}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View className="mt-4 w-56">
        <Button
          title="Continue"
          onPress={() => {
            setMotivation(sel);
            nav.navigate("Concerns");
          }}
        />
      </View>
    </View>
  );
}
