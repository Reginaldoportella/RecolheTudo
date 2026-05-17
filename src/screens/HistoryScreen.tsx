import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  ActivityIndicator,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import AppButton from "../components/ui/AppButton";
import AppCard from "../components/ui/AppCard";
import EmptyState from "../components/ui/EmptyState";
import SectionHeader from "../components/ui/SectionHeader";
import StatCard from "../components/ui/StatCard";
import { useCollectionsStore } from "../state/useCollectionsStore";
import type { Collection, Material } from "../domain/types/collection";
import colors from "../styles/colors";
import globalStyles from "../styles/globalStyles";

const MATERIAL_ICON: Record<
  Material,
  React.ComponentProps<typeof Ionicons>["name"]
> = {
  papel: "document-text-outline",
  plastico: "water-outline",
  metal: "hardware-chip-outline",
  vidro: "wine-outline",
  outros: "layers-outline",
};

const MATERIAL_COLOR: Record<Material, string> = {
  papel: colors.paper,
  plastico: colors.plastic,
  metal: colors.metal,
  vidro: colors.glass,
  outros: colors.other,
};

const MATERIAL_LABEL: Record<Material, string> = {
  papel: "Papel",
  plastico: "Plastico",
  metal: "Metal",
  vidro: "Vidro",
  outros: "Outros",
};

const MATERIAL_FILTERS: Array<{
  key: Material | "todos";
  label: string;
}> = [
  { key: "todos", label: "Todos" },
  { key: "papel", label: "Papel" },
  { key: "plastico", label: "Plastico" },
  { key: "metal", label: "Metal" },
  { key: "vidro", label: "Vidro" },
  { key: "outros", label: "Outros" },
];

interface HistorySection {
  date: string;
  items: Collection[];
}

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function groupHistoryByDate(collections: Collection[]): HistorySection[] {
  const grouped = collections.reduce<Record<string, Collection[]>>(
    (acc, collection) => {
      const date = collection.collectedAt.slice(0, 10);
      acc[date] = [...(acc[date] ?? []), collection];
      return acc;
    },
    {},
  );

  return Object.entries(grouped).map(([date, items]) => ({ date, items }));
}

function HistoryItem({
  item,
  onDelete,
}: {
  item: Collection;
  onDelete: (item: Collection) => void;
}): React.JSX.Element {
  const hasLocation = item.latitude !== null && item.longitude !== null;

  return (
    <View style={styles.itemCard}>
      <View
        style={[
          styles.itemIconWrap,
          { backgroundColor: MATERIAL_COLOR[item.material] },
        ]}
      >
        <Ionicons
          name={MATERIAL_ICON[item.material]}
          size={20}
          color={colors.textLight}
        />
      </View>

      <View style={styles.itemBody}>
        <Text style={styles.itemTitle}>{MATERIAL_LABEL[item.material]}</Text>
        <Text style={styles.itemSubtitle}>{item.weightKg.toFixed(1)} kg</Text>
        {item.notes ? <Text style={styles.itemNote}>{item.notes}</Text> : null}
      </View>

      <View style={styles.itemMeta}>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => onDelete(item)}
        >
          <Ionicons name="trash-outline" size={16} color={colors.error} />
        </TouchableOpacity>
        <Text style={styles.itemMetaText}>{formatTime(item.collectedAt)}</Text>
        <View
          style={[
            styles.locationBadge,
            hasLocation ? styles.locationBadgeOk : styles.locationBadgeOff,
          ]}
        >
          <Ionicons
            name={hasLocation ? "location" : "cloud-offline-outline"}
            size={12}
            color={hasLocation ? colors.primaryStrong : colors.textMuted}
          />
          <Text
            style={[
              styles.locationBadgeText,
              hasLocation ? styles.locationBadgeTextOk : null,
            ]}
          >
            {hasLocation ? "GPS" : "Sem GPS"}
          </Text>
        </View>
      </View>
    </View>
  );
}

const HistoryScreen = (): React.JSX.Element => {
  const [materialFilter, setMaterialFilter] = useState<Material | "todos">(
    "todos",
  );
  const history = useCollectionsStore((state) => state.history);
  const historyStatus = useCollectionsStore((state) => state.historyStatus);
  const errorMessage = useCollectionsStore((state) => state.errorMessage);
  const loadHistory = useCollectionsStore((state) => state.loadHistory);
  const deleteCollection = useCollectionsStore((state) => state.deleteCollection);

  useEffect(() => {
    void loadHistory(50, 0);
  }, [loadHistory]);

  const handleRefresh = useCallback(() => {
    void loadHistory(50, 0);
  }, [loadHistory]);

  const filteredHistory = useMemo(() => {
    if (materialFilter === "todos") {
      return history;
    }

    return history.filter((item) => item.material === materialFilter);
  }, [history, materialFilter]);

  const sections = useMemo(
    () => groupHistoryByDate(filteredHistory),
    [filteredHistory],
  );

  const totalKg = useMemo(
    () => filteredHistory.reduce((total, item) => total + item.weightKg, 0),
    [filteredHistory],
  );

  const handleDelete = useCallback(
    (item: Collection) => {
      const confirmationMessage = `Deseja excluir o registro de ${MATERIAL_LABEL[item.material]} com ${item.weightKg.toFixed(1)} kg?`;

      if (Platform.OS === "web") {
        const confirmFn = (
          globalThis as typeof globalThis & {
            confirm?: (message?: string) => boolean;
          }
        ).confirm;
        const confirmed = confirmFn?.(confirmationMessage) ?? false;

        if (confirmed) {
          void deleteCollection(item.id);
        }

        return;
      }

      Alert.alert(
        "Excluir coleta",
        confirmationMessage,
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Excluir",
            style: "destructive",
            onPress: () => {
              void deleteCollection(item.id);
            },
          },
        ],
      );
    },
    [deleteCollection],
  );

  if (historyStatus === "loading" && history.length === 0) {
    return (
      <View style={styles.centerState}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.centerStateText}>Carregando historico...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={globalStyles.container}
      contentContainerStyle={globalStyles.screenContent}
      refreshControl={
        <RefreshControl
          refreshing={historyStatus === "loading" && history.length > 0}
          onRefresh={handleRefresh}
          tintColor={colors.primary}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.hero}>
        <SectionHeader
          eyebrow="Memoria operacional"
          title="Historico de coletas."
          iconName="time-outline"
        />
        <Text style={styles.heroSubtitle}>
          Revise seus registros recentes, identifique volume acumulado e acompanhe consistencia.
        </Text>

        <View style={styles.heroMetrics}>
          <AppCard style={styles.heroMetricCard}>
            <Text style={styles.heroMetricValue}>{filteredHistory.length}</Text>
            <Text style={styles.heroMetricLabel}>registros listados</Text>
          </AppCard>
          <AppCard style={styles.heroMetricCard}>
            <Text style={styles.heroMetricValue}>{totalKg.toFixed(1)} kg</Text>
            <Text style={styles.heroMetricLabel}>volume no filtro atual</Text>
          </AppCard>
        </View>
      </View>

      <View style={styles.filterSection}>
        <SectionHeader eyebrow="Organizacao" title="Filtrar historico" />
        <View style={styles.filterStatsRow}>
          <StatCard value={String(sections.length)} label="dias exibidos" />
          <StatCard
            value={
              materialFilter === "todos"
                ? "Todos"
                : MATERIAL_LABEL[materialFilter]
            }
            label="filtro ativo"
          />
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterChipsRow}
        >
          {MATERIAL_FILTERS.map((filter) => {
            const active = filter.key === materialFilter;

            return (
              <TouchableOpacity
                key={filter.key}
                style={[
                  styles.filterChip,
                  active ? styles.filterChipActive : null,
                ]}
                onPress={() => setMaterialFilter(filter.key)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    active ? styles.filterChipTextActive : null,
                  ]}
                >
                  {filter.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {historyStatus === "error" && (
        <AppCard style={styles.feedbackCard}>
          <Text style={styles.errorText}>
            Erro ao carregar: {errorMessage ?? "falha desconhecida"}
          </Text>
          <AppButton
            label="Tentar novamente"
            onPress={handleRefresh}
            style={styles.retryButton}
          />
        </AppCard>
      )}

      {filteredHistory.length === 0 && (
        <EmptyState
          title="Nenhuma coleta encontrada"
          description="Ajuste o filtro ativo ou registre novas coletas para popular o historico."
        />
      )}

      {sections.map((section) => {
        const sectionTotal = section.items.reduce(
          (total, item) => total + item.weightKg,
          0,
        );

        return (
          <View key={section.date} style={styles.sectionBlock}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionDate}>
                  {formatDate(`${section.date}T00:00:00.000Z`)}
                </Text>
                <Text style={styles.sectionCount}>
                  {section.items.length} registros
                </Text>
              </View>
              <View style={styles.sectionTotalPill}>
                <Text style={styles.sectionTotalPillText}>
                  {sectionTotal.toFixed(1)} kg
                </Text>
              </View>
            </View>

            <View style={styles.itemsColumn}>
              {section.items.map((item) => (
                <HistoryItem
                  key={item.id}
                  item={item}
                  onDelete={handleDelete}
                />
              ))}
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  centerState: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  centerStateText: {
    color: colors.textMuted,
    fontSize: 15,
    marginTop: 12,
  },
  hero: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 18,
  },
  heroSubtitle: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
  },
  heroMetrics: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 18,
  },
  heroMetricCard: {
    flexGrow: 1,
    minWidth: 150,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    padding: 14,
  },
  heroMetricValue: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "800",
  },
  heroMetricLabel: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 4,
  },
  filterSection: {
    marginBottom: 18,
  },
  filterStatsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 14,
  },
  filterChipsRow: {
    gap: 10,
    paddingTop: 14,
    paddingBottom: 4,
  },
  filterChip: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  filterChipActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  filterChipText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "700",
  },
  filterChipTextActive: {
    color: colors.primaryStrong,
  },
  feedbackCard: {
    marginBottom: 16,
  },
  errorText: {
    color: colors.error,
    fontSize: 15,
    lineHeight: 21,
  },
  retryButton: {
    marginTop: 12,
    alignSelf: "flex-start",
  },
  sectionBlock: {
    marginBottom: 18,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  sectionDate: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
  },
  sectionCount: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
  sectionTotalPill: {
    backgroundColor: colors.primarySoft,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  sectionTotalPillText: {
    color: colors.primaryStrong,
    fontSize: 12,
    fontWeight: "800",
  },
  itemsColumn: {
    gap: 10,
  },
  itemCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
  },
  itemIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  itemBody: {
    flex: 1,
  },
  itemTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
  },
  itemSubtitle: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 3,
  },
  itemNote: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 6,
    fontStyle: "italic",
  },
  itemMeta: {
    alignItems: "flex-end",
    marginLeft: 12,
  },
  deleteButton: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FBEAEA",
    marginBottom: 8,
  },
  itemMetaText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
  },
  locationBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 5,
    marginTop: 8,
  },
  locationBadgeOk: {
    backgroundColor: colors.primarySoft,
  },
  locationBadgeOff: {
    backgroundColor: colors.surfaceMuted,
  },
  locationBadgeText: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: "800",
  },
  locationBadgeTextOk: {
    color: colors.primaryStrong,
  },
});

export default HistoryScreen;
