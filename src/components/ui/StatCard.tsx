import React from "react";
import { StyleSheet, Text } from "react-native";

import colors from "../../styles/colors";
import AppCard from "./AppCard";

interface StatCardProps {
  value: string;
  label: string;
}

const StatCard = ({ value, label }: StatCardProps): React.JSX.Element => {
  return (
    <AppCard muted style={styles.card}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
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
  value: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "800",
  },
  label: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 4,
  },
});

export default StatCard;
