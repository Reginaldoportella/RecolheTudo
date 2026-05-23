import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import type { Collection } from "../../domain/types/collection";
import colors from "../../styles/colors";
import { MATERIAL_COLOR, MATERIAL_ICON, MATERIAL_LABEL } from "./materialMeta";

interface CollectionListItemProps {
  item: Collection;
  onDelete?: (item: Collection) => void;
  showChevron?: boolean;
  subtitle?: string | null;
}

function formatDateTime(isoString: string): { date: string; time: string } {
  const date = new Date(isoString);

  return {
    date: date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
    }),
    time: date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
}

const CollectionListItem = ({
  item,
  onDelete,
  showChevron = false,
  subtitle,
}: CollectionListItemProps): React.JSX.Element => {
  const hasLocation = item.latitude !== null && item.longitude !== null;
  const { date, time } = formatDateTime(item.collectedAt);

  return (
    <View style={styles.card}>
      <View
        style={[styles.iconWrap, { backgroundColor: `${MATERIAL_COLOR[item.material]}20` }]}
      >
        <Ionicons
          name={MATERIAL_ICON[item.material]}
          size={22}
          color={MATERIAL_COLOR[item.material]}
        />
      </View>

      <View style={styles.body}>
        <View style={styles.topRow}>
          <Text style={styles.title}>{MATERIAL_LABEL[item.material]}</Text>
          <Text style={styles.weight}>{item.weightKg.toFixed(1)} kg</Text>
        </View>

        <Text style={styles.meta}>{subtitle ?? `${date} as ${time}`}</Text>

        {item.notes ? <Text style={styles.notes}>{item.notes}</Text> : null}

        <View style={styles.badgesRow}>
          <View
            style={[
              styles.badge,
              hasLocation ? styles.badgePrimary : styles.badgeMuted,
            ]}
          >
            <Ionicons
              name={hasLocation ? "location" : "cloud-offline-outline"}
              size={12}
              color={hasLocation ? colors.primaryStrong : colors.textMuted}
            />
            <Text
              style={[
                styles.badgeText,
                hasLocation ? styles.badgeTextPrimary : null,
              ]}
            >
              {hasLocation ? "Localizacao capturada" : "Sem localizacao"}
            </Text>
          </View>

          <View
            style={[
              styles.badge,
              item.syncStatus === "synced" ? styles.badgePrimary : styles.badgeMuted,
            ]}
          >
            <Ionicons
              name={item.syncStatus === "synced" ? "cloud-done-outline" : "cloud-upload-outline"}
              size={12}
              color={item.syncStatus === "synced" ? colors.primaryStrong : colors.textMuted}
            />
            <Text
              style={[
                styles.badgeText,
                item.syncStatus === "synced" ? styles.badgeTextPrimary : null,
              ]}
            >
              {item.syncStatus === "synced" ? "Coleta concluida" : "Sincronizacao pendente"}
            </Text>
          </View>
        </View>
      </View>

      {onDelete ? (
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => onDelete(item)}
          activeOpacity={0.9}
        >
          <Ionicons name="trash-outline" size={16} color={colors.error} />
        </TouchableOpacity>
      ) : showChevron ? (
        <View style={styles.chevronWrap}>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 22,
    padding: 14,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  body: {
    flex: 1,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  title: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "800",
    flex: 1,
  },
  weight: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
  },
  meta: {
    color: colors.textMuted,
    fontSize: 14,
    marginTop: 6,
  },
  notes: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 8,
  },
  badgesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 6,
    gap: 5,
  },
  badgePrimary: {
    backgroundColor: colors.primarySoft,
  },
  badgeMuted: {
    backgroundColor: colors.surfaceMuted,
  },
  badgeText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "800",
  },
  badgeTextPrimary: {
    color: colors.primaryStrong,
  },
  deleteButton: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FBEAEA",
    marginLeft: 12,
  },
  chevronWrap: {
    justifyContent: "center",
    marginLeft: 12,
  },
});

export default CollectionListItem;
