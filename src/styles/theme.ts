import { DarkTheme, DefaultTheme, Theme } from "@react-navigation/native";
import { Appearance } from "react-native";

const isDark = Appearance.getColorScheme() === "dark";

export const AppTheme: Theme = {
  ...(isDark ? DarkTheme : DefaultTheme),
  colors: {
    ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
    primary: "#3d72ff",            // brand.500
    background: isDark ? "#0b0f14" : "#ffffff",
    card: isDark ? "#121821" : "#ffffff",
    text: isDark ? "#e6eef8" : "#101418",
    border: isDark ? "#1e2a39" : "#e9eef5",
    notification: "#3d72ff",
  },
};
