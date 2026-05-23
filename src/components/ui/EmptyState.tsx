import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import colors from "../../styles/colors";
import AppCard from "./AppCard";

interface EmptyStateProps {
  title: string;
  description: string;
  iconName?: React.ComponentProps<typeof Ionicons>["name"];
  actionLabel?: string;
  onAction?: () => void;
}

const EmptyState = ({
  title,
  description,
  iconName = "archive-outline",
  actionLabel,
  onAction,
}: EmptyStateProps): React.JSX.Element => {
  return (
    <AppCard style={styles.card}>
      <View style={styles.iconWrap}>
        <Ionicons name={iconName} size={28} color={colors.textMuted} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      {actionLabel && onAction ? (
        <Text style={styles.action} onPress={onAction}>
          {actionLabel}
        </Text>
      ) : null}
    </AppCard>
  );
};

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    padding: 24,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceMuted,
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "800",
    marginTop: 16,
  },
  description: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
    textAlign: "center",
  },
  action: {
    color: colors.primaryStrong,
    fontSize: 14,
    fontWeight: "800",
    marginTop: 14,
  },
});

export default EmptyState;
