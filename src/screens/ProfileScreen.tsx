import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import AppButton from "../components/ui/AppButton";
import AppCard from "../components/ui/AppCard";
import StatCard from "../components/ui/StatCard";
import {
  backendService,
  type BackendHealthSnapshot,
} from "../services/backendService";
import { databaseInspectionService } from "../services/databaseInspectionService";
import { profileService } from "../services/profileService";
import type { DailySummary } from "../domain/types/collection";
import colors from "../styles/colors";
import globalStyles from "../styles/globalStyles";

function ProgressBar({
  value,
  max,
}: {
  value: number;
  max: number;
}): React.JSX.Element {
  const pct = max > 0 ? Math.min(value / max, 1) : 0;

  return (
    <View style={styles.progressTrack}>
      <View
        style={[
          styles.progressValue,
          {
            width: `${pct * 100}%`,
            backgroundColor:
              pct >= 1 ? colors.primary : pct >= 0.6 ? colors.accent : colors.secondary,
          },
        ]}
      />
    </View>
  );
}

const ProfileScreen = (): React.JSX.Element => {
  const [goalKg, setGoalKg] = useState<number>(20);
  const [weeklySummaries, setWeeklySummaries] = useState<DailySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState(false);
  const [inspectionModal, setInspectionModal] = useState(false);
  const [inspectionLoading, setInspectionLoading] = useState(false);
  const [inspectionError, setInspectionError] = useState<string | null>(null);
  const [inspectionSnapshot, setInspectionSnapshot] = useState<
    Awaited<ReturnType<typeof databaseInspectionService.inspect>> | null
  >(null);
  const [backendSnapshot, setBackendSnapshot] = useState<BackendHealthSnapshot | null>(
    null,
  );
  const [inputGoal, setInputGoal] = useState("");

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const dashboard = await profileService.loadDashboard();
      setGoalKg(dashboard.goalKg);
      setWeeklySummaries(dashboard.weeklySummaries);
    } catch {
      Alert.alert("Erro", "Nao foi possivel carregar os dados do perfil.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSaveGoal = useCallback(async () => {
    const value = parseFloat(inputGoal.replace(",", "."));

    if (Number.isNaN(value) || value <= 0) {
      Alert.alert("Valor invalido", "Digite um numero positivo para a meta.");
      return;
    }

    await profileService.saveDailyGoal(value);
    setGoalKg(value);
    setEditModal(false);
  }, [inputGoal]);

  const handleOpenInspection = useCallback(async () => {
    setInspectionModal(true);
    setInspectionLoading(true);
    setInspectionError(null);

    try {
      const [snapshot, health] = await Promise.all([
        databaseInspectionService.inspect(),
        backendService.getHealth(),
      ]);
      setInspectionSnapshot(snapshot);
      setBackendSnapshot(health);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Nao foi possivel inspecionar o banco agora.";
      setInspectionError(message);
      setBackendSnapshot(null);
    } finally {
      setInspectionLoading(false);
    }
  }, []);

  const today = weeklySummaries[weeklySummaries.length - 1];
  const todayKg = today?.totalKg ?? 0;
  const weekTotalKg = useMemo(
    () => weeklySummaries.reduce((acc, item) => acc + item.totalKg, 0),
    [weeklySummaries],
  );
  const weekGoalKg = goalKg * profileService.daysWindow;
  const activeDays = weeklySummaries.filter(
    (item) => item.collectionsCount > 0,
  ).length;
  const averageActiveDay = activeDays > 0 ? weekTotalKg / activeDays : 0;
  const bestDayKg = Math.max(...weeklySummaries.map((item) => item.totalKg), 0);

  if (loading) {
    return (
      <View style={styles.centerState}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.centerStateText}>Carregando perfil...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={globalStyles.container}
      contentContainerStyle={globalStyles.screenContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.hero}>
        <View style={styles.avatarWrap}>
          <Ionicons name="person-outline" size={34} color={colors.textLight} />
        </View>
        <Text style={styles.heroTitle}>Perfil de trabalho</Text>
        <Text style={styles.heroSubtitle}>
          Metas, consistencia semanal e ritmo medio para acompanhar seu progresso.
        </Text>
      </View>

      <AppCard style={styles.goalCard}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={globalStyles.sectionEyebrow}>Meta diaria</Text>
            <Text style={styles.cardTitle}>{goalKg.toFixed(1)} kg por dia</Text>
          </View>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => {
              setInputGoal(String(goalKg));
              setEditModal(true);
            }}
          >
            <Ionicons name="create-outline" size={18} color={colors.primaryStrong} />
          </TouchableOpacity>
        </View>

        <Text style={styles.supportText}>
          Hoje voce registrou {todayKg.toFixed(1)} kg.
        </Text>
        <ProgressBar value={todayKg} max={goalKg} />

        <View style={styles.goalStatusRow}>
          <Ionicons
            name={todayKg >= goalKg ? "checkmark-circle" : "time-outline"}
            size={16}
            color={todayKg >= goalKg ? colors.primary : colors.textMuted}
          />
          <Text style={styles.goalStatusText}>
            {todayKg >= goalKg
              ? "Meta atingida no dia de hoje."
              : `${(goalKg - todayKg).toFixed(1)} kg para atingir a meta de hoje.`}
          </Text>
        </View>
      </AppCard>

      <View style={styles.statsRow}>
        <StatCard value={weekTotalKg.toFixed(1)} label="kg na semana" />
        <StatCard value={String(activeDays)} label="dias ativos" />
        <StatCard value={averageActiveDay.toFixed(1)} label="kg por dia ativo" />
      </View>

      <AppCard style={styles.weekCard}>
        <Text style={globalStyles.sectionEyebrow}>
          Ultimos {profileService.daysWindow} dias
        </Text>
        <Text style={styles.cardTitle}>Ritmo semanal</Text>
        <Text style={styles.supportText}>
          Meta acumulada: {weekGoalKg.toFixed(1)} kg. Melhor dia: {bestDayKg.toFixed(1)} kg.
        </Text>
        <ProgressBar value={weekTotalKg} max={weekGoalKg} />

        <View style={styles.chartRow}>
          {weeklySummaries.map((summary) => {
            const barHeight =
              bestDayKg > 0 ? Math.max((summary.totalKg / bestDayKg) * 90, 6) : 6;
            const metGoal = summary.totalKg >= goalKg;

            return (
              <View key={summary.date} style={styles.chartColumn}>
                <Text style={styles.chartValueLabel}>
                  {summary.totalKg > 0 ? summary.totalKg.toFixed(0) : ""}
                </Text>
                <View style={styles.chartTrack}>
                  <View
                    style={[
                      styles.chartBar,
                      {
                        height: barHeight,
                        backgroundColor: metGoal ? colors.primary : colors.secondary,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.chartDateLabel}>{summary.date.slice(5)}</Text>
              </View>
            );
          })}
        </View>
      </AppCard>

      <AppCard style={styles.insightCard}>
        <Text style={globalStyles.sectionEyebrow}>Leitura rapida</Text>
        <Text style={styles.cardTitle}>O que observar</Text>
        <Text style={styles.supportText}>
          Se os dias ativos estiverem baixos, vale priorizar consistencia. Se o volume medio estiver baixo, a rota e o tipo de ponto coletado podem ser o proximo ajuste.
        </Text>
      </AppCard>

      <AppCard style={styles.debugCard}>
        <Text style={globalStyles.sectionEyebrow}>Diagnostico</Text>
        <Text style={styles.cardTitle}>Inspecao local do banco</Text>
        <Text style={styles.supportText}>
          Use este painel para validar quantidades, schema aplicado e ultimos registros salvos.
        </Text>
        <AppButton
          label="Abrir inspecao de dados"
          variant="secondary"
          onPress={() => {
            void handleOpenInspection();
          }}
          style={styles.debugButton}
        />
      </AppCard>

      <Modal visible={editModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Alterar meta diaria</Text>
            <Text style={styles.supportText}>
              Defina um valor realista para acompanhar sua rotina.
            </Text>

            <TextInput
              style={styles.input}
              keyboardType="decimal-pad"
              placeholder="Ex: 20"
              placeholderTextColor="#8B938D"
              value={inputGoal}
              onChangeText={setInputGoal}
            />

            <View style={styles.modalActions}>
              <AppButton
                label="Cancelar"
                variant="secondary"
                onPress={() => setEditModal(false)}
                style={styles.modalCancelButton}
              />
              <AppButton
                label="Salvar"
                onPress={() => {
                  void handleSaveGoal();
                }}
                style={styles.modalSaveButton}
              />
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={inspectionModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Inspecao do banco local</Text>
            <Text style={styles.supportText}>
              Este painel reflete o estado do armazenamento local do app nesta execucao.
            </Text>

            {inspectionLoading && (
              <View style={styles.inspectionLoadingRow}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.inspectionLoadingText}>Lendo dados...</Text>
              </View>
            )}

            {inspectionError && (
              <Text style={styles.inspectionErrorText}>{inspectionError}</Text>
            )}

            {inspectionSnapshot && !inspectionLoading && (
              <ScrollView style={styles.inspectionScroll} showsVerticalScrollIndicator={false}>
                <View style={styles.statsRow}>
                  <StatCard
                    value={String(inspectionSnapshot.collectionsCount)}
                    label="collections"
                  />
                  <StatCard
                    value={String(inspectionSnapshot.collectionPointsCount)}
                    label="collection_points"
                  />
                  <StatCard
                    value={String(inspectionSnapshot.routePointsCount)}
                    label="route_points"
                  />
                  <StatCard
                    value={String(inspectionSnapshot.pendingSyncCount)}
                    label="sync_queue"
                  />
                </View>

                <AppCard style={styles.inspectionBlock}>
                  <Text style={globalStyles.sectionEyebrow}>Backend</Text>
                  <View style={styles.inspectionRow}>
                    <Text style={styles.inspectionRowTitle}>
                      {backendSnapshot
                        ? `${backendSnapshot.service} online`
                        : "Backend nao configurado ou indisponivel"}
                    </Text>
                    <Text style={styles.inspectionRowText}>
                      {backendSnapshot
                        ? `Colecoes: ${backendSnapshot.state?.collectionsCount ?? 0} | Pontos: ${backendSnapshot.state?.collectionPointsCount ?? 0} | Rotas: ${backendSnapshot.state?.routeRunsCount ?? 0}`
                        : "Defina EXPO_PUBLIC_API_BASE_URL para usar sync, rotas e analytics centralizados."}
                    </Text>
                  </View>
                  {backendSnapshot ? (
                    <Text style={styles.inspectionRowText}>
                      Ultima leitura: {backendSnapshot.time}
                    </Text>
                  ) : null}
                </AppCard>

                <AppCard style={styles.inspectionBlock}>
                  <Text style={globalStyles.sectionEyebrow}>Schema</Text>
                  {inspectionSnapshot.schemaVersions.map((version) => (
                    <View key={version.version} style={styles.inspectionRow}>
                      <Text style={styles.inspectionRowTitle}>
                        v{version.version} - {version.name}
                      </Text>
                      <Text style={styles.inspectionRowText}>
                        {version.applied_at}
                      </Text>
                    </View>
                  ))}
                </AppCard>

                <AppCard style={styles.inspectionBlock}>
                  <Text style={globalStyles.sectionEyebrow}>Ultimas coletas</Text>
                  {inspectionSnapshot.recentCollections.length === 0 ? (
                    <Text style={styles.inspectionEmptyText}>
                      Nenhuma coleta salva no banco local.
                    </Text>
                  ) : (
                    inspectionSnapshot.recentCollections.map((collection) => (
                      <View key={collection.id} style={styles.inspectionRow}>
                        <Text style={styles.inspectionRowTitle}>
                          #{collection.id} - {collection.material} - {collection.weightKg.toFixed(1)} kg
                        </Text>
                        <Text style={styles.inspectionRowText}>
                          {collection.collectedAt}
                        </Text>
                        <Text style={styles.inspectionRowText}>
                          sync: {collection.syncStatus}
                          {collection.remoteId ? ` | remote: ${collection.remoteId}` : ""}
                        </Text>
                      </View>
                    ))
                  )}
                </AppCard>
              </ScrollView>
            )}

            <View style={styles.modalActions}>
              <AppButton
                label="Fechar"
                variant="secondary"
                onPress={() => setInspectionModal(false)}
                style={styles.modalCancelButton}
              />
              <AppButton
                label="Atualizar leitura"
                onPress={() => {
                  void handleOpenInspection();
                }}
                style={styles.modalSaveButton}
              />
            </View>
          </View>
        </View>
      </Modal>
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
    backgroundColor: colors.primaryStrong,
    borderRadius: 26,
    padding: 22,
    marginBottom: 18,
  },
  avatarWrap: {
    width: 58,
    height: 58,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.14)",
  },
  heroTitle: {
    color: colors.textLight,
    fontSize: 28,
    fontWeight: "800",
    marginTop: 18,
  },
  heroSubtitle: {
    color: "rgba(255,255,255,0.76)",
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
  },
  goalCard: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "800",
    marginTop: 4,
  },
  editButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primarySoft,
  },
  supportText: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
  },
  progressTrack: {
    height: 12,
    backgroundColor: colors.surfaceMuted,
    borderRadius: 999,
    overflow: "hidden",
    marginTop: 14,
  },
  progressValue: {
    height: 12,
    borderRadius: 999,
  },
  goalStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
  },
  goalStatusText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "700",
    flex: 1,
  },
  statsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 14,
  },
  weekCard: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14,
  },
  chartRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginTop: 18,
    minHeight: 126,
    gap: 8,
  },
  chartColumn: {
    flex: 1,
    alignItems: "center",
  },
  chartValueLabel: {
    color: colors.textMuted,
    fontSize: 10,
    height: 14,
    marginBottom: 4,
  },
  chartTrack: {
    width: "100%",
    maxWidth: 28,
    height: 92,
    borderRadius: 999,
    backgroundColor: colors.surfaceMuted,
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  chartBar: {
    width: "100%",
    borderRadius: 999,
  },
  chartDateLabel: {
    color: colors.textMuted,
    fontSize: 10,
    marginTop: 8,
  },
  insightCard: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  debugCard: {
    marginTop: 14,
  },
  debugButton: {
    alignSelf: "flex-start",
    marginTop: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(24, 33, 27, 0.42)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 22,
  },
  modalTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "800",
  },
  input: {
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
    marginTop: 16,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 18,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalSaveButton: {
    flex: 1,
  },
  inspectionLoadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 16,
  },
  inspectionLoadingText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  inspectionErrorText: {
    color: colors.error,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 16,
  },
  inspectionScroll: {
    maxHeight: 360,
    marginTop: 12,
  },
  inspectionBlock: {
    marginTop: 12,
  },
  inspectionRow: {
    paddingTop: 12,
  },
  inspectionRowTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "700",
  },
  inspectionRowText: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  inspectionEmptyText: {
    color: colors.textMuted,
    fontSize: 14,
    marginTop: 12,
  },
});

export default ProfileScreen;
