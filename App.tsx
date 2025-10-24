import { StatusBar } from "expo-status-bar";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import RootNavigator from "./src/navigation/RootNavigator";

export default function App() {
  return (
    <>
      <SafeAreaView style={{ flex: 1 }}>
        <RootNavigator />
        <StatusBar style="auto" />
      </SafeAreaView>
    </>
  );
}
