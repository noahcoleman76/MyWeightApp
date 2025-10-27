import { DarkTheme, DefaultTheme, Theme } from "@react-navigation/native";
import { Appearance } from "react-native";

const isDark = Appearance.getColorScheme() === "dark";

export const AppTheme: Theme = {
  ...(isDark ? DarkTheme : DefaultTheme),
  colors: {
    ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
    primary: "#5eada8",            // brand.500
    background: isDark ? "#0b0f14" : "#fffffeff",
    card: isDark ? "#121821" : "#ffffff",
    text: isDark ? "#e6eef8" : "#4b5760ff",
    border: isDark ? "#1e2a39" : "#e9eef5",
    notification: "#3d72ff",
  },
};

// 🩵 Teal Blue #3AAFA9 — primary; balance, calmness

// 🤍 Ivory White #FEFFFF — background; breathable space

// 💚 Sage Green #A8D5BA — secondary; organic, natural health

// 🌾 Warm Sand #E8DAB2 — accent; warmth and human touch
