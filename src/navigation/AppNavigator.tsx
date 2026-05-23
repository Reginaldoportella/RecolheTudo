import React from "react";
import { Platform } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

import HomeScreen from "../screens/HomeScreen";
import CollectionScreen from "../screens/CollectionScreen";
import HistoryScreen from "../screens/HistoryScreen";
import RoutesScreen from "../screens/RoutesScreen";
import ProfileScreen from "../screens/ProfileScreen";
import colors from "../styles/colors";
import type { RootTabParamList } from "./types";

const Tab = createBottomTabNavigator<RootTabParamList>();

type IconName = React.ComponentProps<typeof Ionicons>["name"];

function getTabIconName(
  routeName: keyof RootTabParamList,
  focused: boolean,
): IconName {
  switch (routeName) {
    case "Inicio":
      return focused ? "home" : "home-outline";
    case "Coleta":
      return focused ? "add-circle" : "add-circle-outline";
    case "Historico":
      return focused ? "time" : "time-outline";
    case "Rotas":
      return focused ? "map" : "map-outline";
    case "Perfil":
      return focused ? "person" : "person-outline";
    default:
      return "ellipse";
  }
}

function getInitialRouteName(): keyof RootTabParamList {
  if (Platform.OS !== "web") {
    return "Inicio";
  }

  const locationLike = (
    globalThis as typeof globalThis & { location?: { search?: string } }
  ).location;
  const params = new URLSearchParams(locationLike?.search ?? "");
  const screen = params.get("screen");

  switch (screen) {
    case "Coleta":
      return "Coleta";
    case "Historico":
      return "Historico";
    case "Rotas":
      return "Rotas";
    case "Perfil":
      return "Perfil";
    default:
      return "Inicio";
  }
}

const AppNavigator = (): React.JSX.Element => {
  return (
    <NavigationContainer>
      <Tab.Navigator
        initialRouteName={getInitialRouteName()}
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={getTabIconName(route.name, focused)}
              size={size}
              color={color}
            />
          ),
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textMuted,
          headerShown: false,
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: "700",
          },
          tabBarStyle: {
            height: 74,
            paddingTop: 10,
            paddingBottom: 10,
            backgroundColor: colors.surface,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            ...Platform.select({
              web: {
                boxShadow: "0 -10px 30px rgba(24, 33, 27, 0.08)",
              },
              default: {
                shadowColor: "#18211B",
                shadowOffset: { width: 0, height: -6 },
                shadowOpacity: 0.06,
                shadowRadius: 14,
                elevation: 12,
              },
            }),
          },
        })}
      >
        <Tab.Screen
          name="Inicio"
          component={HomeScreen}
          options={{ tabBarLabel: "Inicio" }}
        />
        <Tab.Screen name="Coleta" component={CollectionScreen} />
        <Tab.Screen
          name="Historico"
          component={HistoryScreen}
          options={{ tabBarLabel: "Historico" }}
        />
        <Tab.Screen name="Rotas" component={RoutesScreen} />
        <Tab.Screen name="Perfil" component={ProfileScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
