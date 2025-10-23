import React, { useState } from "react";
import { Button, Text, TextInput, View } from "react-native";

type Props = {
  title: string;
  placeholder?: string;
  suffix?: string;
  onConfirm: (n: number) => void;
  cta?: string;
};

export default function NumericInput({ title, placeholder, suffix, onConfirm, cta = "Continue" }: Props) {
  const [val, setVal] = useState("");
  const n = val.trim() === "" ? NaN : Number(val);

  return (
    <View className="flex-1 items-center justify-center px-6 bg-white">
      <Text className="text-xl font-semibold text-center">{title}</Text>
      <View className="mt-5 w-64">
        <TextInput
          value={val}
          onChangeText={setVal}
          keyboardType="numeric"
          placeholder={placeholder}
          className="px-4 py-3 border rounded-xl"
        />
        {suffix ? <Text className="mt-2 text-center text-gray-500">{suffix}</Text> : null}
      </View>
      <View className="mt-4 w-56">
        <Button title={cta} onPress={() => !Number.isNaN(n) && onConfirm(n)} disabled={Number.isNaN(n)} />
      </View>
    </View>
  );
}