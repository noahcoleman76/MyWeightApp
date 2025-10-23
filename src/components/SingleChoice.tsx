import React, { useState } from "react";
import { Button, Text, TouchableOpacity, View } from "react-native";

type Option = { label: string; value: string };
type Props = { title: string; options: Option[]; onConfirm: (value: string) => void; cta?: string; };

export default function SingleChoice({ title, options, onConfirm, cta = "Continue" }: Props) {
  const [value, setValue] = useState<string | null>(null);
  return (
    <View className="flex-1 items-center justify-center px-6 bg-white">
      <Text className="text-xl font-semibold text-center">{title}</Text>
      <View className="mt-5 w-full">
        {options.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            className={`px-4 py-3 rounded-xl border mb-3 ${value === opt.value ? "bg-black" : "bg-white"}`}
            onPress={() => setValue(opt.value)}
          >
            <Text className={`${value === opt.value ? "text-white" : "text-black"} text-center`}>{opt.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View className="mt-4 w-56">
        <Button title={cta} onPress={() => value && onConfirm(value)} disabled={!value} />
      </View>
    </View>
  );
}