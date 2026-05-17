import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import colors from "../../styles/colors";

interface SectionHeaderProps {
  eyebrow: string;
  title: string;
  iconName?: React.ComponentProps<typeof Ionicons>["name"];
}

const SectionHeader = ({
  eyebrow,
  title,
  iconName,
}: SectionHeaderProps): React.JSX.Element => {
  return (
    <View style={styles.row}>
      <View style={styles.textWrap}>
        <Text style={styles.eyebrow}>{eyebrow}</Text>
        <Text style={styles.title}>{title}</Text>
      </View>
      {iconName ? (
        <View style={styles.iconWrap}>
          <Ionicons name={iconName} size={18} color={colors.primary} />
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  textWrap: {
    flex: 1,
    paddingRight: 12,
  },
  eyebrow: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  title: {
    color: colors.text,
    fontSize: 21,
    fontWeight: "800",
    marginTop: 4,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primarySoft,
  },
});

export default SectionHeader;
