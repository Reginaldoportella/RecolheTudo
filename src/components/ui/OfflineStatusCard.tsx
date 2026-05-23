import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import AppCard from "./AppCard";
import colors from "../../styles/colors";

interface OfflineStatusCardProps {
  title?: string;
  description: string;
  pendingCount?: number;
  lastSyncLabel?: string;
}

const OfflineStatusCard = ({
  title = "Modo offline ativo",
  description,
  pendingCount,
  lastSyncLabel,
}: OfflineStatusCardProps): React.JSX.Element => {
  return (
    <AppCard style={styles.card} muted>
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <Ionicons name="cloud-offline-outline" size={18} color={colors.primaryStrong} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>
        </View>
      </View>

      {(pendingCount !== undefined || lastSyncLabel) && (
        <View style={styles.metaRow}>
          {pendingCount !== undefined ? (
            <View style={styles.metaPill}>
              <Text style={styles.metaLabel}>Pendentes</Text>
              <Text style={styles.metaValue}>{pendingCount}</Text>
            </View>
          ) : null}
          {lastSyncLabel ? (
            <View style={styles.metaPill}>
              <Text style={styles.metaLabel}>Ultima sincronizacao</Text>
              <Text style={styles.metaValue}>{lastSyncLabel}</Text>
            </View>
          ) : null}
        </View>
      )}
    </AppCard>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primarySoft,
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
  },
  description: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 14,
  },
  metaPill: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  metaLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "700",
  },
  metaValue: {
    color: colors.primaryStrong,
    fontSize: 14,
    fontWeight: "800",
    marginTop: 4,
  },
});

export default OfflineStatusCard;
