import { MaterialCommunityIcons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import React from "react";
import Account from "../screens/Account/Index";
import Dashboard from "../screens/Dashboard/Index";
import Goals from "../screens/Goals/Index";
import Log from "../screens/Log/Index";
import { AppTheme } from "../styles/theme";

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          const map: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
            Dashboard: "home-analytics",
            Goals: "target",
            Log: "notebook-edit",
            Account: "account-circle",
          };
          return <MaterialCommunityIcons name={map[route.name] || "circle-outline"} size={size} color={color} />;
        },
        tabBarActiveTintColor: AppTheme.colors.primary,
        tabBarInactiveTintColor: "#94a3b8",
        tabBarStyle: { height: 60, paddingBottom: 10, paddingTop: 6 },
        headerShown: false
      })}
    >
      <Tab.Screen name="Dashboard" component={Dashboard} />
      <Tab.Screen name="Goals" component={Goals} />
      <Tab.Screen name="Log" component={Log} />
      <Tab.Screen name="Account" component={Account} />
    </Tab.Navigator>
  );
}
