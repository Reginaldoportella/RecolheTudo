import React from "react";
import {
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import colors from "../../styles/colors";
import AppCard from "./AppCard";

interface StatCardProps {
  value: string;
  label: string;
  helperText?: string | undefined;
  iconName?: React.ComponentProps<typeof Ionicons>["name"];
  tone?: "default" | "inverse";
  style?: StyleProp<ViewStyle>;
}

const StatCard = ({
  value,
  label,
  helperText,
  iconName,
  tone = "default",
  style,
}: StatCardProps): React.JSX.Element => {
  const isInverse = tone === "inverse";

  return (
    <AppCard
      muted={!isInverse}
      style={[
        styles.card,
        isInverse ? styles.cardInverse : null,
        style,
      ]}
    >
      {iconName ? (
        <View style={[styles.iconWrap, isInverse ? styles.iconWrapInverse : null]}>
          <Ionicons
            name={iconName}
            size={16}
            color={isInverse ? colors.textLight : colors.primaryStrong}
          />
        </View>
      ) : null}
      <Text style={[styles.value, isInverse ? styles.valueInverse : null]}>
        {value}
      </Text>
      <Text style={[styles.label, isInverse ? styles.labelInverse : null]}>
        {label}
      </Text>
      {helperText ? (
        <Text
          style={[styles.helperText, isInverse ? styles.helperTextInverse : null]}
        >
          {helperText}
        </Text>
      ) : null}
    </AppCard>
  );
};

const styles = StyleSheet.create({
  card: {
    flexGrow: 1,
    minWidth: 140,
    padding: 14,
    borderRadius: 18,
  },
  cardInverse: {
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderColor: "rgba(255, 255, 255, 0.12)",
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primarySoft,
    marginBottom: 12,
  },
  iconWrapInverse: {
    backgroundColor: "rgba(255, 255, 255, 0.16)",
  },
  value: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "800",
  },
  valueInverse: {
    color: colors.textLight,
  },
  label: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 4,
  },
  labelInverse: {
    color: "rgba(255, 255, 255, 0.76)",
  },
  helperText: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 10,
  },
  helperTextInverse: {
    color: "rgba(255, 255, 255, 0.72)",
  },
});

export default StatCard;
