import React, { useEffect, useMemo } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";

import AppButton from "../components/ui/AppButton";
import AppCard from "../components/ui/AppCard";
import SectionHeader from "../components/ui/SectionHeader";
import StatCard from "../components/ui/StatCard";
import { useCollectionsStore } from "../state/useCollectionsStore";
import type { RootTabParamList } from "../navigation/types";
import colors from "../styles/colors";

type Props = BottomTabScreenProps<RootTabParamList, "Inicio">;

const materialCards = [
  {
    key: "papel",
    label: "Papel",
    icon: "document-text-outline",
    color: colors.paper,
  },
  {
    key: "plastico",
    label: "Plastico",
    icon: "water-outline",
    color: colors.plastic,
  },
  {
    key: "metal",
    label: "Metal",
    icon: "hardware-chip-outline",
    color: colors.metal,
  },
  {
    key: "vidro",
    label: "Vidro",
    icon: "wine-outline",
    color: colors.glass,
  },
  {
    key: "outros",
    label: "Outros",
    icon: "layers-outline",
    color: colors.other,
  },
] as const;

const quickActions = [
  {
    label: "Nova coleta",
    description: "Registrar material em poucos toques",
    icon: "add-circle-outline",
    route: "Coleta",
    backgroundColor: colors.primary,
  },
  {
    label: "Ver rotas",
    description: "Consultar pontos e caminhos do dia",
    icon: "navigate-outline",
    route: "Rotas",
    backgroundColor: colors.secondary,
  },
  {
    label: "Historico",
    description: "Revisar o que ja foi coletado",
    icon: "time-outline",
    route: "Historico",
    backgroundColor: colors.accent,
  },
] as const;

function formatDate(date: Date): string {
  return date.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });
}

const HomeScreen = ({ navigation }: Props): React.JSX.Element => {
  const dateKey = new Date().toISOString().slice(0, 10);
  const loadHome = useCollectionsStore((state) => state.loadHome);
  const homeStatus = useCollectionsStore((state) => state.homeStatus);
  const dailySummaryByDate = useCollectionsStore(
    (state) => state.dailySummaryByDate,
  );
  const weeklySummaryByDate = useCollectionsStore(
    (state) => state.weeklySummaryByDate,
  );
  const errorMessage = useCollectionsStore((state) => state.errorMessage);

  useEffect(() => {
    void loadHome(dateKey);
  }, [dateKey, loadHome]);

  const summary = dailySummaryByDate[dateKey];
  const weeklySummary = weeklySummaryByDate[dateKey];
  const totalKg = summary?.totalKg ?? 0;
  const collectionsCount = summary?.collectionsCount ?? 0;
  const weekTotalKg = weeklySummary?.totalKg ?? 0;
  const weekCollectionsCount = weeklySummary?.collectionsCount ?? 0;
  const byMaterial = summary?.byMaterial ?? {
    papel: 0,
    plastico: 0,
    metal: 0,
    vidro: 0,
    outros: 0,
  };

  const topMaterial = useMemo(() => {
    const entries = Object.entries(byMaterial) as Array<
      [keyof typeof byMaterial, number]
    >;
    const firstEntry = entries[0];

    if (!firstEntry) {
      return "Sem destaque ainda";
    }

    const [materialKey, materialValue] = entries.reduce((current, next) =>
      next[1] > current[1] ? next : current,
    );

    if (materialValue <= 0) {
      return "Sem destaque ainda";
    }

    return `${materialKey} ${materialValue.toFixed(1)} kg`;
  }, [byMaterial]);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.hero}>
        <View style={styles.heroTop}>
          <View style={styles.heroBadge}>
            <Ionicons name="leaf-outline" size={16} color={colors.primary} />
            <Text style={styles.heroBadgeText}>Painel do dia</Text>
          </View>
          <View style={styles.heroIcon}>
            <Ionicons
              name="sparkles-outline"
              size={22}
              color={colors.textLight}
            />
          </View>
        </View>

        <Text style={styles.heroTitle}>Operacao simples, rapida e offline.</Text>
        <Text style={styles.heroSubtitle}>{formatDate(new Date())}</Text>

        <View style={styles.heroMetrics}>
          <AppCard style={styles.heroMetricCard}>
            <Text style={styles.heroMetricValue}>{totalKg.toFixed(1)} kg</Text>
            <Text style={styles.heroMetricLabel}>coletado hoje</Text>
          </AppCard>
          <AppCard style={styles.heroMetricCard}>
            <Text style={styles.heroMetricValue}>{collectionsCount}</Text>
            <Text style={styles.heroMetricLabel}>registros do dia</Text>
          </AppCard>
        </View>
      </View>

      {homeStatus === "loading" && (
        <AppCard style={styles.statusCard}>
          <Text style={styles.statusText}>Carregando seu resumo...</Text>
        </AppCard>
      )}

      {homeStatus === "error" && (
        <AppCard style={styles.statusCard}>
          <Text style={styles.errorText}>
            Erro ao carregar: {errorMessage ?? "falha desconhecida"}
          </Text>
          <AppButton
            label="Tentar novamente"
            onPress={() => void loadHome(dateKey)}
            style={styles.retryButton}
          />
        </AppCard>
      )}

      <AppCard style={styles.summaryCard}>
        <SectionHeader
          eyebrow="Resumo"
          title="Como foi seu dia ate agora"
          iconName="stats-chart-outline"
        />

        {homeStatus === "empty" && (
          <Text style={styles.emptyText}>
            Nenhuma coleta registrada hoje. Comece pela primeira coleta.
          </Text>
        )}

        <View style={styles.metricsRow}>
          <StatCard
            value={`${weekTotalKg.toFixed(1)} kg`}
            label="ultimos 7 dias"
          />
          <StatCard
            value={String(weekCollectionsCount)}
            label="coletas na semana"
          />
          <StatCard value={topMaterial} label="material em destaque" />
        </View>

        <View style={styles.materialGrid}>
          {materialCards.map((item) => (
            <AppCard key={item.key} muted style={styles.materialCard}>
              <View
                style={[styles.materialIcon, { backgroundColor: item.color }]}
              >
                <Ionicons name={item.icon} size={20} color="#FFFFFF" />
              </View>
              <Text style={styles.materialWeight}>
                {byMaterial[item.key].toFixed(1)} kg
              </Text>
              <Text style={styles.materialLabel}>{item.label}</Text>
            </AppCard>
          ))}
        </View>
      </AppCard>

      <View style={styles.actionsSection}>
        <Text style={styles.sectionEyebrow}>Atalhos</Text>
        {quickActions.map((action) => (
          <TouchableOpacity
            key={action.label}
            style={styles.actionCard}
            onPress={() => navigation.navigate(action.route as never)}
          >
            <View
              style={[
                styles.actionIcon,
                { backgroundColor: action.backgroundColor },
              ]}
            >
              <Ionicons name={action.icon} size={22} color="#FFFFFF" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>{action.label}</Text>
              <Text style={styles.actionDescription}>{action.description}</Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.textMuted}
            />
          </TouchableOpacity>
        ))}
      </View>

      <AppCard style={styles.tipCard}>
        <View style={styles.tipIcon}>
          <Ionicons name="bulb-outline" size={20} color={colors.accent} />
        </View>
        <View style={styles.tipContent}>
          <Text style={styles.sectionEyebrow}>Dica pratica</Text>
          <Text style={styles.tipText}>
            Separar material antes da pesagem reduz erro no registro e ajuda no
            valor final.
          </Text>
        </View>
      </AppCard>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    width: "100%",
    maxWidth: 760,
    alignSelf: "center",
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 36,
  },
  hero: {
    backgroundColor: colors.primaryStrong,
    borderRadius: 28,
    padding: 22,
    marginBottom: 18,
    ...Platform.select({
      web: {
        boxShadow: "0 16px 40px rgba(24, 33, 27, 0.18)",
      },
      default: {
        shadowColor: "#18211B",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.18,
        shadowRadius: 24,
        elevation: 6,
      },
    }),
  },
  heroTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "rgba(255, 255, 255, 0.14)",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    gap: 8,
  },
  heroBadgeText: {
    color: colors.textLight,
    fontSize: 12,
    fontWeight: "700",
  },
  heroIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.14)",
  },
  heroTitle: {
    color: colors.textLight,
    fontSize: 31,
    fontWeight: "800",
    lineHeight: 38,
    marginTop: 18,
    maxWidth: 360,
  },
  heroSubtitle: {
    color: "rgba(255, 255, 255, 0.76)",
    fontSize: 15,
    marginTop: 8,
    textTransform: "capitalize",
  },
  heroMetrics: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 22,
  },
  heroMetricCard: {
    flexGrow: 1,
    minWidth: 140,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderColor: "rgba(255, 255, 255, 0.12)",
    padding: 16,
  },
  heroMetricValue: {
    color: colors.textLight,
    fontSize: 26,
    fontWeight: "800",
  },
  heroMetricLabel: {
    color: "rgba(255, 255, 255, 0.76)",
    fontSize: 13,
    marginTop: 4,
  },
  statusCard: {
    marginBottom: 14,
  },
  statusText: {
    color: colors.text,
    fontSize: 15,
  },
  errorText: {
    color: colors.error,
    fontSize: 15,
    lineHeight: 21,
  },
  retryButton: {
    alignSelf: "flex-start",
    marginTop: 12,
  },
  summaryCard: {
    marginBottom: 0,
  },
  sectionEyebrow: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 14,
  },
  metricsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 18,
  },
  materialGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 18,
  },
  materialCard: {
    flexGrow: 1,
    flexBasis: "46%",
    minWidth: 130,
    padding: 14,
    borderRadius: 18,
  },
  materialIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  materialWeight: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "800",
  },
  materialLabel: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 3,
  },
  actionsSection: {
    marginTop: 20,
  },
  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 10,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "800",
  },
  actionDescription: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 3,
  },
  tipCard: {
    flexDirection: "row",
    marginTop: 20,
  },
  tipIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.accentSoft,
    marginRight: 12,
  },
  tipContent: {
    flex: 1,
  },
  tipText: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
  },
});

export default HomeScreen;
