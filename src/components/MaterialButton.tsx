import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import colors from "../styles/colors";
import type { Material } from "../domain/types/collection";

interface MaterialButtonProps {
  material: Material;
  iconName?: React.ComponentProps<typeof Ionicons>["name"];
  label?: string;
  onPress: () => void;
}

function getMaterialColor(type: Material): string {
  switch (type) {
    case "papel":
      return colors.paper;
    case "plastico":
      return colors.plastic;
    case "metal":
      return colors.metal;
    case "vidro":
      return colors.glass;
    default:
      return colors.other;
  }
}

const MaterialButton = ({
  material,
  iconName = "cube-outline",
  label,
  onPress,
}: MaterialButtonProps): React.JSX.Element => (
  <TouchableOpacity
    style={[styles.button, { backgroundColor: getMaterialColor(material) }]}
    onPress={onPress}
  >
    <Ionicons
      name={iconName}
      size={64}
      color={colors.textLight}
      style={styles.icon}
    />
    <Text style={styles.text}>{label ?? material.toUpperCase()}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  button: {
    width: 150,
    height: 150,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 15,
    margin: 10,
    elevation: 4,
  },
  icon: {
    marginBottom: 10,
  },
  text: {
    color: colors.textLight,
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
});

export default MaterialButton;
