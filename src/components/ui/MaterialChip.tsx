import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import type { Material } from "../../domain/types/collection";
import colors from "../../styles/colors";
import { MATERIAL_COLOR, MATERIAL_ICON, MATERIAL_LABEL } from "./materialMeta";

interface MaterialChipProps {
  material: Material;
  active?: boolean;
  onPress?: () => void;
  suffix?: string;
  style?: StyleProp<ViewStyle>;
}

const MaterialChip = ({
  material,
  active = false,
  onPress,
  suffix,
  style,
}: MaterialChipProps): React.JSX.Element => {
  const content = (
    <>
      <View
        style={[
          styles.iconWrap,
          { backgroundColor: MATERIAL_COLOR[material] },
        ]}
      >
        <Ionicons
          name={MATERIAL_ICON[material]}
          size={14}
          color={colors.textLight}
        />
      </View>
      <Text style={[styles.label, active ? styles.labelActive : null]}>
        {MATERIAL_LABEL[material]}
      </Text>
      {suffix ? <Text style={styles.suffix}>{suffix}</Text> : null}
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        style={[
          styles.chip,
          active ? styles.chipActive : null,
          style,
        ]}
        onPress={onPress}
        activeOpacity={0.9}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return (
    <View
      style={[
        styles.chip,
        active ? styles.chipActive : null,
        style,
      ]}
    >
      {content}
    </View>
  );
};

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  chipActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  iconWrap: {
    width: 22,
    height: 22,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  label: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "700",
  },
  labelActive: {
    color: colors.primaryStrong,
  },
  suffix: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
    marginLeft: 6,
  },
});

export default MaterialChip;
