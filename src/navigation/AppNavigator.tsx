import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

import HomeScreen from "../screens/HomeScreen";
import CollectionScreen from "../screens/CollectionScreen";
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
    case "Início":
      return focused ? "home" : "home-outline";
    case "Coleta":
      return focused ? "add-circle" : "add-circle-outline";
    case "Rotas":
      return focused ? "map" : "map-outline";
    case "Perfil":
      return focused ? "person" : "person-outline";
    default:
      return "ellipse";
  }
}

const AppNavigator = (): React.JSX.Element => {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={getTabIconName(route.name, focused)}
              size={size}
              color={color}
            />
          ),
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: "gray",
          tabBarLabelStyle: {
            fontSize: 14,
          },
          tabBarStyle: {
            height: 65,
            paddingBottom: 10,
          },
        })}
      >
        <Tab.Screen name="Início" component={HomeScreen} />
        <Tab.Screen name="Coleta" component={CollectionScreen} />
        <Tab.Screen name="Rotas" component={RoutesScreen} />
        <Tab.Screen name="Perfil" component={ProfileScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
