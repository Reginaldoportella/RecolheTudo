import React from "react";
import { TouchableOpacity, Text, StyleSheet, View } from "react-native";
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
    style={styles.button}
    onPress={onPress}
  >
    <View
      style={[styles.iconWrap, { backgroundColor: getMaterialColor(material) }]}
    >
      <Ionicons name={iconName} size={28} color={colors.textLight} />
    </View>
    <Text style={styles.text}>{label ?? material.toUpperCase()}</Text>
    <Text style={styles.caption}>Toque para registrar</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  button: {
    width: "47%",
    minWidth: 145,
    backgroundColor: colors.surface,
    borderRadius: 22,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconWrap: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  text: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
  },
  caption: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 6,
  },
});

export default MaterialButton;
