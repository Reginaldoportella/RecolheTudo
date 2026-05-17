import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { View } from "react-native";
import AppNavigator from "./src/navigation/AppNavigator";
import colors from "./src/styles/colors";

export default function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <AppNavigator />
      </View>
    </SafeAreaProvider>
  );
}
