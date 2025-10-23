import dayjs from "dayjs";
import React, { useState } from "react";
import { Button, Text, TextInput, View } from "react-native";

type Props = {
  title: string;
  onConfirm: (iso?: string) => void;
  optional?: boolean;
  cta?: string;
};

export default function DateInput({ title, onConfirm, optional = false, cta = "Continue" }: Props) {
  const [val, setVal] = useState("");

  const isValid = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s);

  return (
    <View className="flex-1 items-center justify-center px-6 bg-white">
      <Text className="text-xl font-semibold text-center">{title}</Text>
      <View className="mt-5 w-64">
        <TextInput
          value={val}
          onChangeText={setVal}
          placeholder="YYYY-MM-DD"
          className="px-4 py-3 border rounded-xl"
        />
        {optional ? <Text className="mt-2 text-center text-gray-500">Optional</Text> : null}
      </View>
      <View className="mt-4 w-56">
        <Button
          title={cta}
          onPress={() => {
            if (val.trim() === "" && optional) onConfirm(undefined);
            else if (isValid(val)) onConfirm(val);
          }}
          disabled={!(optional ? true : isValid(val))}
        />
        <View className="mt-2 w-56">
          <Button title="Use Today" onPress={() => onConfirm(dayjs().format("YYYY-MM-DD"))} />
        </View>
      </View>
    </View>
  );
}
