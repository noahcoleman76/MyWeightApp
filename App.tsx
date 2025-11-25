import { StatusBar } from "expo-status-bar";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthProvider } from "./src/components/AuthProvider";
import RootNavigator from "./src/navigation/RootNavigator";
import { AppTheme } from "./src/styles/theme";

export default function App() {
  return (
    <>
      <SafeAreaView style={{ flex: 1, backgroundColor: AppTheme.colors.card }}>
        <AuthProvider>
          <RootNavigator />
        </AuthProvider>
        <StatusBar style="auto" />
      </SafeAreaView>
    </>
  );
}
