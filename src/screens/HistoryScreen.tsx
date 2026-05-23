import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import AppCard from "../components/ui/AppCard";
import CollectionListItem from "../components/ui/CollectionListItem";
import EmptyState from "../components/ui/EmptyState";
import MaterialChip from "../components/ui/MaterialChip";
import StatCard from "../components/ui/StatCard";
import { useCollectionsStore } from "../state/useCollectionsStore";
import type { Collection, Material } from "../domain/types/collection";
import colors from "../styles/colors";
import globalStyles from "../styles/globalStyles";
import { MATERIAL_LABEL } from "../components/ui/materialMeta";

type PeriodFilter = "hoje" | "semana" | "mes" | "todos";

const PERIOD_FILTERS: Array<{ key: PeriodFilter; label: string }> = [
  { key: "hoje", label: "Hoje" },
  { key: "semana", label: "Semana" },
  { key: "mes", label: "Mes" },
  { key: "todos", label: "Todos" },
];

const MATERIAL_FILTERS: Array<{ key: Material; label: string }> = [
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

interface FilterWindowMeta {
  title: string;
  description: string;
}

function formatSectionDate(date: string): string {
  return new Date(`${date}T00:00:00.000Z`).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTime(value: string): string {
  return new Date(value).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function groupHistoryByDate(collections: Collection[]): HistorySection[] {
  const grouped = collections.reduce<Record<string, Collection[]>>((acc, item) => {
    const date = item.collectedAt.slice(0, 10);
    acc[date] = [...(acc[date] ?? []), item];
    return acc;
  }, {});

  return Object.entries(grouped)
    .map(([date, items]) => ({ date, items }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

function getFilterWindowMeta(period: PeriodFilter, material: Material | "todos"): FilterWindowMeta {
  const materialLabel =
    material === "todos" ? "todos os materiais" : MATERIAL_LABEL[material].toLowerCase();

  if (period === "hoje") {
    return {
      title: "Resumo de hoje",
      description: `Acompanhe o que foi salvo hoje no aparelho em ${materialLabel}.`,
    };
  }

  if (period === "semana") {
    return {
      title: "Resumo da semana",
      description: `Veja como sua produtividade evoluiu nesta semana em ${materialLabel}.`,
    };
  }

  if (period === "mes") {
    return {
      title: "Resumo do mes",
      description: `Veja o acumulado do mes e em quais dias ${materialLabel} teve mais volume.`,
    };
  }

    return {
      title: "Resumo completo",
      description: `Veja todo o historico salvo no aparelho para ${materialLabel}.`,
    };
}

const HistoryScreen = (): React.JSX.Element => {
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("hoje");
  const [materialFilter, setMaterialFilter] = useState<Material | "todos">("todos");
  const history = useCollectionsStore((state) => state.history);
  const historyStatus = useCollectionsStore((state) => state.historyStatus);
  const loadHistory = useCollectionsStore((state) => state.loadHistory);

  useEffect(() => {
    void loadHistory(50, 0);
  }, [loadHistory]);

  const handleRefresh = useCallback(() => {
    void loadHistory(50, 0);
  }, [loadHistory]);

  const filteredHistory = useMemo(() => {
    const now = new Date();
    const periodFiltered = history.filter((item) => {
      if (periodFilter === "todos") {
        return true;
      }

      const collectedAt = new Date(item.collectedAt);

      if (periodFilter === "hoje") {
        return collectedAt.toDateString() === now.toDateString();
      }

      if (periodFilter === "semana") {
        return now.getTime() - collectedAt.getTime() <= 7 * 24 * 60 * 60 * 1000;
      }

      return (
        collectedAt.getMonth() === now.getMonth() &&
        collectedAt.getFullYear() === now.getFullYear()
      );
    });

    if (materialFilter === "todos") {
      return periodFiltered;
    }

    return periodFiltered.filter((item) => item.material === materialFilter);
  }, [history, materialFilter, periodFilter]);

  const sections = useMemo(() => groupHistoryByDate(filteredHistory), [filteredHistory]);
  const windowMeta = useMemo(
    () => getFilterWindowMeta(periodFilter, materialFilter),
    [materialFilter, periodFilter],
  );
  const totalKg = useMemo(
    () => filteredHistory.reduce((total, item) => total + item.weightKg, 0),
    [filteredHistory],
  );
  const activeDays = sections.length;
  const averagePerActiveDay = activeDays > 0 ? totalKg / activeDays : 0;
  const topMaterial = useMemo(() => {
    const totals = filteredHistory.reduce<Record<Material, number>>(
      (acc, item) => {
        acc[item.material] += item.weightKg;
        return acc;
      },
      { papel: 0, plastico: 0, metal: 0, vidro: 0, outros: 0 },
    );

    const entries = Object.entries(totals) as Array<[Material, number]>;
    const [material, value] = entries.reduce((current, next) =>
      next[1] > current[1] ? next : current,
    );

    return value > 0 ? MATERIAL_LABEL[material] : "Sem destaque";
  }, [filteredHistory]);
  const bestSection = useMemo(() => {
    if (sections.length === 0) {
      return null;
    }

    return sections.reduce((current, section) => {
      const sectionTotal = section.items.reduce((total, item) => total + item.weightKg, 0);
      const currentTotal = current.items.reduce(
        (total, item) => total + item.weightKg,
        0,
      );

      return sectionTotal > currentTotal ? section : current;
    });
  }, [sections]);
  const latestCollection = filteredHistory[0] ?? null;

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
      contentContainerStyle={styles.content}
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
        <View style={styles.heroRow}>
          <TouchableOpacity style={styles.heroBack}>
            <Ionicons name="arrow-back" size={24} color={colors.textLight} />
          </TouchableOpacity>
          <View style={styles.heroText}>
            <Text style={styles.heroTitle}>Historico de coletas</Text>
            <Text style={styles.heroDescription}>
              Veja suas coletas recentes e acompanhe sua evolucao.
            </Text>
          </View>
          <View style={styles.heroCalendar}>
            <Ionicons name="calendar-outline" size={22} color={colors.textLight} />
          </View>
        </View>
      </View>

      <View style={styles.summaryRow}>
        <StatCard
          value={String(filteredHistory.length)}
          label="registros"
          helperText={activeDays > 0 ? `${activeDays} dias com coleta` : "Sem dias ativos"}
          iconName="document-text-outline"
        />
        <StatCard
          value={`${totalKg.toFixed(1)} kg`}
          label={periodFilter === "hoje" ? "total do dia" : "total do periodo"}
          helperText={`${averagePerActiveDay.toFixed(1)} kg por dia ativo`}
          iconName="leaf-outline"
        />
        <StatCard
          value={topMaterial}
          label="material em destaque"
          helperText={
            latestCollection
              ? `Ultimo registro as ${formatTime(latestCollection.collectedAt)}`
              : "Sem registros para comparar"
          }
          iconName="ribbon-outline"
        />
      </View>

      <AppCard style={styles.summaryInsightCard}>
        <View style={styles.summaryInsightHeader}>
          <View style={styles.summaryInsightText}>
            <Text style={styles.summaryInsightTitle}>{windowMeta.title}</Text>
            <Text style={styles.summaryInsightDescription}>{windowMeta.description}</Text>
          </View>
          <View style={styles.summaryInsightIcon}>
            <Ionicons name="analytics-outline" size={20} color={colors.primaryStrong} />
          </View>
        </View>

        <View style={styles.summaryInsightRow}>
          <View style={styles.summaryInsightMetric}>
            <Text style={styles.summaryInsightLabel}>Melhor dia</Text>
            <Text style={styles.summaryInsightValue}>
              {bestSection ? formatSectionDate(bestSection.date) : "Sem registros"}
            </Text>
          </View>
          <View style={styles.summaryInsightMetric}>
            <Text style={styles.summaryInsightLabel}>Produziu</Text>
            <Text style={styles.summaryInsightValue}>
              {bestSection
                ? `${bestSection.items
                    .reduce((total, item) => total + item.weightKg, 0)
                    .toFixed(1)} kg`
                : "0.0 kg"}
            </Text>
          </View>
          <View style={styles.summaryInsightMetric}>
            <Text style={styles.summaryInsightLabel}>Filtro atual</Text>
            <Text style={styles.summaryInsightValue}>
              {materialFilter === "todos" ? "Todos" : MATERIAL_LABEL[materialFilter]}
            </Text>
          </View>
        </View>
      </AppCard>

      <AppCard style={styles.filtersCard}>
        <Text style={styles.filtersTitle}>Filtrar historico</Text>

        <View style={styles.periodRow}>
          {PERIOD_FILTERS.map((filter) => {
            const active = filter.key === periodFilter;
            return (
              <TouchableOpacity
                key={filter.key}
                style={[styles.periodButton, active ? styles.periodButtonActive : null]}
                onPress={() => setPeriodFilter(filter.key)}
              >
                <Text
                  style={[
                    styles.periodButtonText,
                    active ? styles.periodButtonTextActive : null,
                  ]}
                >
                  {filter.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.materialRow}>
          {MATERIAL_FILTERS.map((filter) => (
            <MaterialChip
              key={filter.key}
              material={filter.key}
              active={materialFilter === filter.key}
              onPress={() => setMaterialFilter(filter.key)}
            />
          ))}
          <TouchableOpacity
            style={[
              styles.allMaterialsChip,
              materialFilter === "todos" ? styles.allMaterialsChipActive : null,
            ]}
            onPress={() => setMaterialFilter("todos")}
          >
            <View
              style={[
                styles.allMaterialsIconWrap,
                materialFilter === "todos"
                  ? styles.allMaterialsIconWrapActive
                  : null,
              ]}
            >
              <Ionicons
                name="grid-outline"
                size={14}
                color={
                  materialFilter === "todos"
                    ? colors.textLight
                    : colors.primaryStrong
                }
              />
            </View>
            <Text
              style={[
                styles.allMaterialsText,
                materialFilter === "todos" ? styles.allMaterialsTextActive : null,
              ]}
            >
              Todos
            </Text>
          </TouchableOpacity>
        </View>
      </AppCard>

      {filteredHistory.length === 0 ? (
        <EmptyState
          title="Nenhuma coleta encontrada"
            description="Ajuste o periodo ou o material, ou salve novas coletas para preencher seu historico."
          iconName="time-outline"
          actionLabel="Atualizar lista"
          onAction={handleRefresh}
        />
      ) : (
        sections.map((section) => {
          const sectionTotal = section.items.reduce(
            (total, item) => total + item.weightKg,
            0,
          );

          return (
            <View key={section.date} style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{formatSectionDate(section.date)}</Text>
                <Text style={styles.sectionMeta}>
                  {section.items.length} coletas - {sectionTotal.toFixed(1)} kg
                </Text>
              </View>

              <View style={styles.itemsColumn}>
                {section.items.map((item) => (
                  <CollectionListItem
                    key={item.id}
                    item={item}
                    showChevron
                    subtitle={item.notes ?? "Coleta salva e pronta para futuras acoes"}
                  />
                ))}
              </View>
            </View>
          );
        })
      )}

      <AppCard muted style={styles.tipCard}>
        <View style={styles.tipIcon}>
          <Ionicons name="bulb-outline" size={22} color={colors.primaryStrong} />
        </View>
        <View style={styles.tipBody}>
          <Text style={styles.tipTitle}>Dica pratica:</Text>
          <Text style={styles.tipText}>
            Separe os materiais antes da pesagem para agilizar o registro e manter seu dia mais organizado.
          </Text>
        </View>
      </AppCard>
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
  content: {
    width: "100%",
    maxWidth: 900,
    alignSelf: "center",
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 36,
    gap: 18,
  },
  hero: {
    backgroundColor: colors.primaryStrong,
    borderRadius: 30,
    padding: 24,
  },
  heroRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
  },
  heroBack: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  heroText: {
    flex: 1,
  },
  heroCalendar: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  heroTitle: {
    color: colors.textLight,
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "800",
  },
  heroDescription: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 16,
    lineHeight: 24,
    marginTop: 10,
  },
  summaryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
  },
  summaryInsightCard: {
    gap: 16,
  },
  summaryInsightHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  summaryInsightText: {
    flex: 1,
  },
  summaryInsightTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "800",
  },
  summaryInsightDescription: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 22,
    marginTop: 8,
  },
  summaryInsightIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primarySoft,
  },
  summaryInsightRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  summaryInsightMetric: {
    flexGrow: 1,
    minWidth: 150,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: colors.surfaceMuted,
  },
  summaryInsightLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  summaryInsightValue: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "800",
    marginTop: 8,
  },
  filtersCard: {
    gap: 16,
  },
  filtersTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
  },
  periodRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  periodButton: {
    flexGrow: 1,
    minWidth: 110,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    backgroundColor: colors.surface,
  },
  periodButtonActive: {
    borderColor: colors.primary,
    backgroundColor: "#F4FBF5",
  },
  periodButtonText: {
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: "600",
  },
  periodButtonTextActive: {
    color: colors.primaryStrong,
    fontWeight: "800",
  },
  materialRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  allMaterialsChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  allMaterialsChipActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  allMaterialsIconWrap: {
    width: 22,
    height: 22,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primarySoft,
    marginRight: 8,
  },
  allMaterialsIconWrapActive: {
    backgroundColor: colors.primary,
  },
  allMaterialsText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "700",
  },
  allMaterialsTextActive: {
    color: colors.primaryStrong,
  },
  section: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
  },
  sectionMeta: {
    color: colors.primaryStrong,
    fontSize: 15,
    fontWeight: "700",
  },
  itemsColumn: {
    gap: 12,
  },
  tipCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  tipIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#DDEEDF",
    alignItems: "center",
    justifyContent: "center",
  },
  tipBody: {
    flex: 1,
  },
  tipTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
  },
  tipText: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 22,
    marginTop: 6,
  },
});

export default HistoryScreen;
