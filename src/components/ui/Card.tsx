import React, { ReactNode } from "react";
import { View, ViewStyle } from "react-native";

export default function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return (
    <View className="bg-white dark:bg-[#121821] rounded-2xl shadow-card border border-gray-100 dark:border-[#1e2a39] p-4" style={style}>
      {children}
    </View>
  );
}
