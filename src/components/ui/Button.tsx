import React from "react";
import { ActivityIndicator, Text, TouchableOpacity, ViewStyle } from "react-native";

type Props = {
  title: string;
  onPress?: () => void;
  variant?: "primary" | "secondary" | "ghost";
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
};

export default function Button({ title, onPress, variant = "primary", loading, disabled, style }: Props) {
  const base = "rounded-2xl px-5 py-3";
  const map = {
    primary: "bg-brand-500",
    secondary: "bg-gray-100",
    ghost: "",
  } as const;

  const textMap = {
    primary: "text-white",
    secondary: "text-black",
    ghost: "text-brand-500",
  } as const;

  const opacity = disabled || loading ? "opacity-60" : "opacity-100";
  const border = variant === "ghost" ? "border border-brand-500" : "";

  return (
    <TouchableOpacity
      disabled={disabled || loading}
      onPress={onPress}
      className={`${base} ${map[variant]} ${opacity} ${border}`}
      style={style}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator />
      ) : (
        <Text className={`text-center font-semibold ${textMap[variant]}`}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}
