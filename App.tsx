import { StatusBar } from "expo-status-bar";
import React from "react";
import TabNavigator from "./src/navigation/TabNavigator";

export default function App() {
  return (
    <>
      <StatusBar style="auto" />
      <TabNavigator />
    </>
  );
}
