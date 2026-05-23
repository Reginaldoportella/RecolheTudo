import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import AppCard from "../components/ui/AppCard";
import OfflineStatusCard from "../components/ui/OfflineStatusCard";
import PrimaryButton from "../components/ui/PrimaryButton";
import StatCard from "../components/ui/StatCard";
import {
  backendService,
  type BackendHealthSnapshot,
} from "../services/backendService";
import { databaseInspectionService } from "../services/databaseInspectionService";
import { profileService } from "../services/profileService";
import type {
  DailySummary,
  MaterialsSummary,
  ProductivitySummary,
} from "../domain/types/collection";
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
          },
        ]}
      />
    </View>
  );
}

function formatSyncTime(value: string | null): string {
  if (!value) {
    return "Ainda nao sincronizado";
  }

  return new Date(value).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatShortDate(value: string): string {
  return new Date(`${value}T00:00:00.000Z`).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });
}

const ProfileScreen = (): React.JSX.Element => {
  const { width } = useWindowDimensions();
  const isWide = width >= 980;
  const [goalKg, setGoalKg] = useState<number>(20);
  const [weeklySummaries, setWeeklySummaries] = useState<DailySummary[]>([]);
  const [productivitySummary, setProductivitySummary] = useState<ProductivitySummary | null>(
    null,
  );
  const [materialsSummary, setMaterialsSummary] = useState<MaterialsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState(false);
  const [offlineModal, setOfflineModal] = useState(false);
  const [inspectionSnapshot, setInspectionSnapshot] = useState<
    Awaited<ReturnType<typeof databaseInspectionService.inspect>> | null
  >(null);
  const [backendSnapshot, setBackendSnapshot] = useState<BackendHealthSnapshot | null>(
    null,
  );
  const [inputGoal, setInputGoal] = useState("");

  const refreshOfflineStatus = useCallback(async () => {
    const [snapshot, health] = await Promise.all([
      databaseInspectionService.inspect(),
      backendService.getHealth().catch(() => null),
    ]);
    setInspectionSnapshot(snapshot);
    setBackendSnapshot(health);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const dashboard = await profileService.loadDashboard();
      setGoalKg(dashboard.goalKg);
      setWeeklySummaries(dashboard.weeklySummaries);
      setProductivitySummary(dashboard.productivitySummary);
      setMaterialsSummary(dashboard.materialsSummary);
      await refreshOfflineStatus();
    } catch {
      Alert.alert("Erro", "Nao foi possivel carregar os dados do perfil.");
    } finally {
      setLoading(false);
    }
  }, [refreshOfflineStatus]);

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

  const today = weeklySummaries[weeklySummaries.length - 1];
  const todayKg = today?.totalKg ?? 0;
  const weekTotalKg = useMemo(
    () => weeklySummaries.reduce((acc, item) => acc + item.totalKg, 0),
    [weeklySummaries],
  );
  const activeDays = weeklySummaries.filter((item) => item.collectionsCount > 0).length;
  const productivityPoints = productivitySummary?.points ?? [];
  const bestDay = useMemo(() => {
    if (productivityPoints.length === 0) {
      return null;
    }

    return [...productivityPoints].sort((a, b) => b.totalKg - a.totalKg)[0];
  }, [productivityPoints]);
  const averagePerActiveDay = useMemo(() => {
    if (activeDays === 0) {
      return 0;
    }

    return weekTotalKg / activeDays;
  }, [activeDays, weekTotalKg]);
  const topMaterial = useMemo(() => {
    if (!materialsSummary || materialsSummary.items.length === 0) {
      return null;
    }

    return [...materialsSummary.items].sort((a, b) => b.totalKg - a.totalKg)[0];
  }, [materialsSummary]);
  const latestSyncLabel =
    inspectionSnapshot?.recentCollections.find((item) => item.lastSyncedAt)?.lastSyncedAt ??
    null;

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
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.hero}>
        <Image
          source={require("../../assets/brand/brand-mark.png")}
          style={styles.heroMark}
          resizeMode="contain"
        />
        <View style={styles.avatarWrap}>
          <Image
            source={require("../../assets/brand/worker-avatar.png")}
            style={styles.avatarImage}
            resizeMode="contain"
          />
        </View>
        <View style={styles.heroText}>
          <Text style={styles.heroTitle}>Perfil de trabalho</Text>
          <Text style={styles.heroSubtitle}>
            Veja, controle e acompanhe seu ritmo de trabalho, mesmo sem internet.
          </Text>
        </View>
      </View>

      <AppCard style={styles.goalCard}>
        <View style={styles.goalHeader}>
          <View>
            <Text style={styles.goalEyebrow}>Meta diaria</Text>
            <Text style={styles.goalValue}>{goalKg.toFixed(1)} kg por dia</Text>
          </View>
          <TouchableOpacity
            style={styles.goalAction}
            onPress={() => {
              setInputGoal(String(goalKg));
              setEditModal(true);
            }}
          >
            <Ionicons name="locate-outline" size={22} color={colors.primaryStrong} />
          </TouchableOpacity>
        </View>

        <View style={styles.goalInlineCard}>
          <Ionicons name="ellipse-outline" size={22} color={colors.primaryStrong} />
          <Text style={styles.goalInlineText}>
            {Math.max(goalKg - todayKg, 0).toFixed(1)} kg para atingir a meta de hoje
          </Text>
        </View>
      </AppCard>

      <View style={styles.statsRow}>
        <StatCard value={weekTotalKg.toFixed(1)} label="kg na semana" iconName="scale-outline" />
        <StatCard value={String(activeDays)} label="dia ativo" iconName="calendar-outline" />
        <StatCard value={todayKg.toFixed(1)} label="kg no dia" iconName="albums-outline" />
      </View>

      <View style={styles.statsRow}>
        <StatCard
          value={bestDay ? `${bestDay.totalKg.toFixed(1)} kg` : "0.0 kg"}
          label="melhor dia"
          helperText={bestDay ? formatShortDate(bestDay.date) : "Sem registros na semana"}
          iconName="trophy-outline"
        />
        <StatCard
          value={`${averagePerActiveDay.toFixed(1)} kg`}
          label="media por dia ativo"
          helperText={`${activeDays} dias com coleta nesta semana`}
          iconName="trending-up-outline"
        />
        <StatCard
          value={
            topMaterial
              ? topMaterial.material.charAt(0).toUpperCase() + topMaterial.material.slice(1)
              : "Sem destaque"
          }
          label="material em destaque"
          helperText={
            topMaterial
              ? `${topMaterial.totalKg.toFixed(1)} kg do total semanal`
              : "Comece registrando para ver a composicao"
          }
          iconName="layers-outline"
        />
      </View>

      <AppCard style={styles.weekCard}>
        <Text style={styles.weekEyebrow}>Ritmo semanal</Text>
        <Text style={styles.weekDescription}>
          Veja sua evolucao diaria nos ultimos 7 dias (kg)
        </Text>

        <View style={styles.chartRow}>
          {productivityPoints.map((point) => {
            const max = Math.max(...productivityPoints.map((item) => item.totalKg), 1);
            const barHeight = Math.max((point.totalKg / max) * 120, 10);
            const date = new Date(`${point.date}T00:00:00.000Z`);
            const weekday = date.toLocaleDateString("pt-BR", { weekday: "short" });

            return (
              <View key={point.date} style={styles.chartColumn}>
                <View style={styles.chartTrack}>
                  <View style={[styles.chartBar, { height: barHeight }]} />
                </View>
                <Text style={styles.chartDay}>{weekday}</Text>
                <Text style={styles.chartValue}>{point.totalKg.toFixed(1)}</Text>
              </View>
            );
          })}
        </View>
      </AppCard>

      <AppCard style={styles.weekCard}>
        <Text style={styles.weekEyebrow}>Composicao da semana</Text>
        <Text style={styles.weekDescription}>
          Veja quais materiais estao puxando sua produtividade nesta semana.
        </Text>

        <View style={styles.materialsList}>
          {(materialsSummary?.items ?? []).slice(0, 3).map((item) => (
            <View key={item.material} style={styles.materialRow}>
              <Text style={styles.materialName}>
                {item.material.charAt(0).toUpperCase() + item.material.slice(1)}
              </Text>
              <Text style={styles.materialAmount}>{item.totalKg.toFixed(1)} kg</Text>
            </View>
          ))}
          {(!materialsSummary || materialsSummary.items.length === 0) && (
            <Text style={styles.materialEmpty}>
              Ainda nao ha materiais suficientes para compor este resumo.
            </Text>
          )}
        </View>
      </AppCard>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Status offline</Text>

        <OfflineStatusCard
          title="Dados salvos no aparelho"
          description="Suas informacoes ficam salvas no aparelho e prontas para sincronizar."
          lastSyncLabel={formatSyncTime(latestSyncLabel)}
        />
        <OfflineStatusCard
          title="Modo offline ativo"
          description="Voce pode registrar normalmente mesmo sem internet."
        />
        <OfflineStatusCard
          title="Sincronizacao pendente quando houver internet"
          description="Assim que a conexao voltar, o app tenta enviar tudo automaticamente."
          pendingCount={inspectionSnapshot?.pendingSyncCount ?? 0}
        />
      </View>

      <AppCard muted style={styles.observeCard}>
        <View style={styles.observeIcon}>
          <Ionicons name="bulb-outline" size={22} color={colors.primaryStrong} />
        </View>
        <View style={styles.observeBody}>
          <Text style={styles.observeTitle}>O que observar</Text>
          <Text style={styles.observeText}>
            Pequenos registros geram grandes impactos. Cada coleta conta para um futuro mais sustentavel.
          </Text>
        </View>
      </AppCard>

      <PrimaryButton
        label="Ver detalhes do status offline"
        variant="secondary"
        onPress={() => setOfflineModal(true)}
      />

      <Modal visible={editModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Alterar meta diaria</Text>
            <Text style={styles.modalText}>
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
              <PrimaryButton
                label="Cancelar"
                variant="secondary"
                onPress={() => setEditModal(false)}
                style={styles.modalButton}
              />
              <PrimaryButton
                label="Salvar"
                onPress={() => {
                  void handleSaveGoal();
                }}
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={offlineModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Status offline</Text>
            <Text style={styles.modalText}>
              Coletas salvas no aparelho: {inspectionSnapshot?.collectionsCount ?? 0}
            </Text>
            <Text style={styles.modalText}>
              Pendentes de sincronizacao: {inspectionSnapshot?.pendingSyncCount ?? 0}
            </Text>
            <Text style={styles.modalText}>
              Ultima sincronizacao: {formatSyncTime(latestSyncLabel)}
            </Text>
            <Text style={styles.modalText}>
              Servidor: {backendSnapshot ? "disponivel" : "indisponivel"}
            </Text>

            <PrimaryButton
              label="Fechar"
              variant="secondary"
              onPress={() => setOfflineModal(false)}
              style={styles.modalSingleButton}
            />
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
    padding: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
    overflow: "hidden",
  },
  heroMark: {
    position: "absolute",
    right: -10,
    top: 0,
    width: 220,
    height: 220,
    opacity: 0.34,
  },
  avatarWrap: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImage: {
    width: 112,
    height: 112,
  },
  heroText: {
    flex: 1,
  },
  heroTitle: {
    color: colors.textLight,
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "800",
  },
  heroSubtitle: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 16,
    lineHeight: 26,
    marginTop: 14,
  },
  goalCard: {
    gap: 18,
  },
  goalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  goalEyebrow: {
    color: colors.primaryStrong,
    fontSize: 14,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  goalValue: {
    color: colors.text,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "800",
    marginTop: 8,
  },
  goalAction: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primarySoft,
  },
  goalInlineCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  goalInlineText: {
    color: colors.text,
    fontSize: 16,
  },
  statsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
  },
  weekCard: {
    gap: 12,
  },
  weekEyebrow: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  weekDescription: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
  materialsList: {
    marginTop: 8,
    gap: 10,
  },
  materialRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  materialName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
  },
  materialAmount: {
    color: colors.primaryStrong,
    fontSize: 15,
    fontWeight: "800",
  },
  materialEmpty: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 22,
  },
  chartRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 10,
    marginTop: 10,
  },
  chartColumn: {
    flex: 1,
    alignItems: "center",
  },
  chartTrack: {
    width: 34,
    height: 128,
    borderRadius: 17,
    backgroundColor: colors.surfaceMuted,
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  chartBar: {
    width: "100%",
    borderRadius: 17,
    backgroundColor: "#2F80ED",
  },
  chartDay: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "700",
    marginTop: 10,
  },
  chartValue: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  section: {
    gap: 14,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  observeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  observeIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#EAF4E5",
    alignItems: "center",
    justifyContent: "center",
  },
  observeBody: {
    flex: 1,
  },
  observeTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  observeText: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 22,
    marginTop: 6,
  },
  progressTrack: {
    height: 12,
    backgroundColor: colors.surfaceMuted,
    borderRadius: 999,
    overflow: "hidden",
  },
  progressValue: {
    height: 12,
    borderRadius: 999,
    backgroundColor: colors.primary,
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
  modalText: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 22,
    marginTop: 10,
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
  modalButton: {
    flex: 1,
  },
  modalSingleButton: {
    marginTop: 20,
  },
});

export default ProfileScreen;
