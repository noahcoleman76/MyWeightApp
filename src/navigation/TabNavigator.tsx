import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import React from "react";
import { Text } from "react-native";
import Account from "../screens/Account/Index";
import Dashboard from "../screens/Dashboard/Index";
import Goals from "../screens/Goals/Index";
import Log from "../screens/Log/Index";

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerTitleAlign: "center",
        tabBarLabel: route.name,
        tabBarIcon: ({ focused }) => <Text style={{ fontSize: 12 }}>{focused ? "●" : "○"}</Text>,
      })}
    >
      <Tab.Screen name="Dashboard" component={Dashboard} />
      <Tab.Screen name="Goals" component={Goals} />
      <Tab.Screen name="Log" component={Log} />
      <Tab.Screen name="Account" component={Account} />
    </Tab.Navigator>
  );
}
