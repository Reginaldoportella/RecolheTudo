import React, { useEffect, useMemo } from "react";
import { Image, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";

import ActionCard from "../components/ui/ActionCard";
import AppCard from "../components/ui/AppCard";
import EmptyState from "../components/ui/EmptyState";
import MaterialChip from "../components/ui/MaterialChip";
import PrimaryButton from "../components/ui/PrimaryButton";
import StatCard from "../components/ui/StatCard";
import { useCollectionsStore } from "../state/useCollectionsStore";
import type { Material, SummaryByMaterial } from "../domain/types/collection";
import type { RootTabParamList } from "../navigation/types";
import colors from "../styles/colors";

type Props = BottomTabScreenProps<RootTabParamList, "Inicio">;

const materialCards = [
  { key: "papel" as const, valueColor: colors.paper },
  { key: "plastico" as const, valueColor: colors.accent },
  { key: "metal" as const, valueColor: colors.metal },
  { key: "vidro" as const, valueColor: colors.glass },
  { key: "outros" as const, valueColor: "#7B61FF" },
];

const quickActions = [
  {
    label: "Nova coleta",
    description: "Registrar uma nova coleta",
    icon: "add-outline",
    route: "Coleta",
  },
  {
    label: "Ver rotas",
    description: "Veja e inicie sua rota do dia",
    icon: "location-outline",
    route: "Rotas",
  },
  {
    label: "Historico",
    description: "Veja coletas salvas e seu ritmo",
    icon: "time-outline",
    route: "Historico",
  },
  {
    label: "Perfil",
    description: "Veja metas, ritmo e status offline",
    icon: "person-outline",
    route: "Perfil",
  },
] as const;

const DAILY_GOAL_KG = 20;

const HomeScreen = ({ navigation }: Props): React.JSX.Element => {
  const { width } = useWindowDimensions();
  const isWide = width >= 980;
  const dateKey = new Date().toISOString().slice(0, 10);
  const loadHome = useCollectionsStore((state) => state.loadHome);
  const homeStatus = useCollectionsStore((state) => state.homeStatus);
  const dailySummaryByDate = useCollectionsStore(
    (state) => state.dailySummaryByDate,
  );
  const weeklySummaryByDate = useCollectionsStore(
    (state) => state.weeklySummaryByDate,
  );
  const materialsSummaryByDate = useCollectionsStore(
    (state) => state.materialsSummaryByDate,
  );
  const weeklyMaterialsSummaryByDate = useCollectionsStore(
    (state) => state.weeklyMaterialsSummaryByDate,
  );

  useEffect(() => {
    void loadHome(dateKey);
  }, [dateKey, loadHome]);

  const summary = dailySummaryByDate[dateKey];
  const weeklySummary = weeklySummaryByDate[dateKey];
  const materialsSummary = materialsSummaryByDate[dateKey];
  const weeklyMaterialsSummary = weeklyMaterialsSummaryByDate[dateKey];
  const totalKg = summary?.totalKg ?? 0;
  const collectionsCount = summary?.collectionsCount ?? 0;
  const weekTotalKg = weeklySummary?.totalKg ?? 0;
  const byMaterial = useMemo<SummaryByMaterial>(() => {
    if (!materialsSummary) {
      return (
        summary?.byMaterial ?? {
          papel: 0,
          plastico: 0,
          metal: 0,
          vidro: 0,
          outros: 0,
        }
      );
    }

    return materialsSummary.items.reduce<SummaryByMaterial>(
      (acc, item) => {
        acc[item.material] = item.totalKg;
        return acc;
      },
      {
        papel: 0,
        plastico: 0,
        metal: 0,
        vidro: 0,
        outros: 0,
      },
    );
  }, [materialsSummary, summary?.byMaterial]);
  const weeklyByMaterial = useMemo<SummaryByMaterial>(() => {
    if (!weeklyMaterialsSummary) {
      return byMaterial;
    }

    return weeklyMaterialsSummary.items.reduce<SummaryByMaterial>(
      (acc, item) => {
        acc[item.material] = item.totalKg;
        return acc;
      },
      {
        papel: 0,
        plastico: 0,
        metal: 0,
        vidro: 0,
        outros: 0,
      },
    );
  }, [byMaterial, weeklyMaterialsSummary]);

  const topMaterialKey = useMemo(() => {
    const entries = Object.entries(byMaterial) as Array<[Material, number]>;
    const [material, value] = entries.reduce((current, next) =>
      next[1] > current[1] ? next : current,
    );

    return value > 0 ? material : null;
  }, [byMaterial]);

  const materialsWithVolume = useMemo(
    () => Object.values(byMaterial).filter((value) => value > 0).length,
    [byMaterial],
  );
  const weeklyMaterialsWithVolume = weeklyMaterialsSummary?.items.length ?? 0;
  const activeDaysThisWeek = useMemo(
    () =>
      weeklySummary?.dailySummaries.filter((day) => day.collectionsCount > 0).length ?? 0,
    [weeklySummary],
  );
  const weeklyTopMaterial = useMemo(() => {
    if (!weeklyMaterialsSummary || weeklyMaterialsSummary.items.length === 0) {
      return null;
    }

    return [...weeklyMaterialsSummary.items].sort((a, b) => b.totalKg - a.totalKg)[0];
  }, [weeklyMaterialsSummary]);
  const weeklyAverageKg = useMemo(() => {
    if (!weeklySummary) {
      return 0;
    }

    return weeklySummary.totalKg / Math.max(weeklySummary.dailySummaries.length, 1);
  }, [weeklySummary]);

  const goalLeft = Math.max(DAILY_GOAL_KG - totalKg, 0);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.hero}>
        <Image
          source={require("../../assets/brand/brand-mark.png")}
          style={styles.heroLeaf}
          resizeMode="contain"
        />
        <View style={styles.heroBadge}>
          <Ionicons name="wifi-outline" size={16} color={colors.textLight} />
          <Text style={styles.heroBadgeText}>Offline ativo</Text>
        </View>

        <Text style={styles.heroTitle}>Operacao simples, rapida e offline.</Text>
        <Text style={styles.heroDescription}>
          Registre suas coletas sem internet e acompanhe seu ritmo de trabalho
          ao longo do dia.
        </Text>

        <PrimaryButton
          label="Registrar nova coleta"
          iconName="add-circle-outline"
          onPress={() => navigation.navigate("Coleta")}
          variant="secondary"
          style={styles.heroButton}
          textStyle={styles.heroButtonText}
        />
      </View>

      <View style={styles.overviewRow}>
        <StatCard
          value={`${totalKg.toFixed(1)} kg`}
          label="coletados hoje"
          iconName="leaf-outline"
          style={styles.overviewCard}
        />
        <StatCard
          value={String(collectionsCount)}
          label="registros hoje"
          iconName="document-text-outline"
          style={styles.overviewCard}
        />
        <StatCard
          value="ativo"
          label="modo offline"
          iconName="cloud-offline-outline"
          style={styles.overviewCard}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Como foi seu dia ate agora</Text>

        {homeStatus === "empty" ? (
          <EmptyState
            title="Nenhuma coleta registrada hoje"
            description="Comece pelo botao principal para salvar sua primeira coleta no aparelho."
            iconName="leaf-outline"
            actionLabel="Registrar primeira coleta"
            onAction={() => navigation.navigate("Coleta")}
          />
        ) : (
          <View style={styles.summaryRow}>
            <StatCard
              value={`${weekTotalKg.toFixed(1)} kg`}
              label="na semana"
              iconName="scale-outline"
              helperText={`${activeDaysThisWeek} dias ativos`}
              style={styles.summaryCard}
            />
            <StatCard
              value={String(weeklyMaterialsWithVolume || materialsWithVolume)}
              label="materiais da semana"
              iconName="cube-outline"
              helperText={`${weeklyAverageKg.toFixed(1)} kg por dia em media`}
              style={styles.summaryCard}
            />
            <StatCard
              value={
                weeklyTopMaterial
                  ? weeklyTopMaterial.material.charAt(0).toUpperCase() +
                    weeklyTopMaterial.material.slice(1)
                  : topMaterialKey
                    ? "Em destaque"
                    : "Sem destaque"
              }
              label={weeklyTopMaterial ? "mais coletado" : topMaterialKey ? "material" : "ainda"}
              iconName="star-outline"
              helperText={
                weeklyTopMaterial
                  ? `${weeklyTopMaterial.totalKg.toFixed(1)} kg acumulados na semana`
                  : topMaterialKey
                    ? `${goalLeft.toFixed(1)} kg para a meta do dia`
                  : undefined
              }
              style={styles.summaryCard}
            />
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Distribuicao da semana por material</Text>
        <View style={styles.materialGrid}>
          {materialCards.map((item) => (
            <AppCard
              key={item.key}
              style={[styles.materialCard, isWide ? styles.materialCardWide : null]}
            >
              <MaterialChip material={item.key} />
              <Text style={[styles.materialValue, { color: colors.text }]}>
                {weeklyByMaterial[item.key].toFixed(1)} kg
              </Text>
            </AppCard>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Acoes</Text>
        <AppCard style={styles.actionsCard}>
          {quickActions.map((action, index) => (
            <View key={action.label}>
              {index > 0 ? <View style={styles.actionDivider} /> : null}
              <ActionCard
                title={action.label}
                description={action.description}
                iconName={action.icon}
                accentColor={colors.primary}
                onPress={() => navigation.navigate(action.route as never)}
                style={styles.actionRow}
              />
            </View>
          ))}
        </AppCard>
      </View>

      <AppCard muted style={styles.tipCard}>
        <View style={styles.tipIcon}>
          <Ionicons name="bulb-outline" size={22} color={colors.primaryStrong} />
        </View>
        <Text style={styles.tipTitle}>Dica pratica:</Text>
        <Text style={styles.tipText}>
          separar o material antes da pesagem ajuda a registrar mais rapido e com menos erro.
        </Text>
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
    maxWidth: 1180,
    alignSelf: "center",
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 36,
    gap: 18,
  },
  hero: {
    backgroundColor: colors.primaryStrong,
    borderRadius: 30,
    padding: 22,
    overflow: "hidden",
  },
  heroLeaf: {
    position: "absolute",
    right: -30,
    bottom: -20,
    width: 240,
    height: 240,
    opacity: 0.36,
  },
  heroBadge: {
    alignSelf: "flex-end",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  heroBadgeText: {
    color: colors.textLight,
    fontSize: 12,
    fontWeight: "700",
  },
  heroTitle: {
    color: colors.textLight,
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "800",
    marginTop: 10,
    maxWidth: 360,
  },
  heroDescription: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 15,
    lineHeight: 24,
    marginTop: 16,
    maxWidth: 420,
  },
  heroButton: {
    marginTop: 24,
    alignSelf: "flex-start",
    minWidth: 260,
    backgroundColor: colors.textLight,
    borderColor: colors.textLight,
  },
  heroButtonText: {
    color: colors.primaryStrong,
  },
  overviewRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
  },
  overviewCard: {
    flexGrow: 1,
    minWidth: 170,
  },
  section: {
    gap: 14,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
  },
  summaryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
  },
  summaryCard: {
    flexGrow: 1,
    minWidth: 170,
  },
  materialGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  materialCard: {
    minWidth: 132,
    flexGrow: 1,
    padding: 16,
  },
  materialCardWide: {
    flexBasis: "18%",
  },
  materialValue: {
    fontSize: 18,
    fontWeight: "800",
    marginTop: 14,
  },
  actionsCard: {
    paddingVertical: 6,
  },
  actionDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: 8,
  },
  actionRow: {
    borderWidth: 0,
    paddingHorizontal: 8,
  },
  tipCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  tipIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#DDEEDF",
    alignItems: "center",
    justifyContent: "center",
  },
  tipTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
  },
  tipText: {
    flex: 1,
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 22,
  },
});

export default HomeScreen;
