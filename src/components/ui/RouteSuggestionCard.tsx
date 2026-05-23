import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import AppCard from "./AppCard";
import PrimaryButton from "./PrimaryButton";
import colors from "../../styles/colors";

interface RouteSuggestionCardProps {
  pointsCount: number;
  distanceLabel: string;
  durationLabel: string;
  providerLabel: string;
  helperText?: string;
  badgeLabel?: string;
  onStart: () => void;
}

const RouteSuggestionCard = ({
  pointsCount,
  distanceLabel,
  durationLabel,
  providerLabel,
  helperText,
  badgeLabel,
  onStart,
}: RouteSuggestionCardProps): React.JSX.Element => {
  return (
    <AppCard style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerMain}>
          <View style={styles.iconWrap}>
            <Ionicons name="navigate-outline" size={20} color={colors.textLight} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>Rota sugerida para hoje</Text>
            <Text style={styles.title}>Seu caminho mais rapido</Text>
          </View>
        </View>
        {badgeLabel ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badgeLabel}</Text>
          </View>
        ) : null}
      </View>

      {helperText ? (
        <Text style={styles.helperText}>{helperText}</Text>
      ) : null}

      <View style={styles.metricsRow}>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{pointsCount}</Text>
          <Text style={styles.metricLabel}>pontos</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{distanceLabel}</Text>
          <Text style={styles.metricLabel}>distancia</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{durationLabel}</Text>
          <Text style={styles.metricLabel}>tempo</Text>
        </View>
      </View>

      <Text style={styles.providerText}>{providerLabel}</Text>

      <PrimaryButton
        label="Iniciar rota"
        iconName="play-outline"
        onPress={onStart}
        style={styles.button}
      />
    </AppCard>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  headerMain: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  badge: {
    backgroundColor: colors.primarySoft,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  badgeText: {
    color: colors.primaryStrong,
    fontSize: 12,
    fontWeight: "800",
  },
  eyebrow: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "800",
    marginTop: 4,
  },
  helperText: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 14,
  },
  metricsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 18,
  },
  metricCard: {
    flexGrow: 1,
    minWidth: 90,
    backgroundColor: colors.surfaceMuted,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  metricValue: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
  },
  metricLabel: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  providerText: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 14,
  },
  button: {
    marginTop: 16,
  },
});

export default RouteSuggestionCard;
