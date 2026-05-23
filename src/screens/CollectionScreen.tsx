import React, { useMemo, useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";

import AppCard from "../components/ui/AppCard";
import PrimaryButton from "../components/ui/PrimaryButton";
import { useCollectionsStore } from "../state/useCollectionsStore";
import type { Material, WeightRange } from "../domain/types/collection";
import type { RootTabParamList } from "../navigation/types";
import colors from "../styles/colors";
import { MATERIAL_LABEL } from "../components/ui/materialMeta";

type Props = BottomTabScreenProps<RootTabParamList, "Coleta">;

interface MaterialOption {
  id: Material;
  iconName: React.ComponentProps<typeof Ionicons>["name"];
}

interface WeightOption {
  id: WeightRange;
  value: number;
  label: string;
  helper: string;
}

const materials: MaterialOption[] = [
  { id: "papel", iconName: "document-text-outline" },
  { id: "plastico", iconName: "water-outline" },
  { id: "metal", iconName: "hardware-chip-outline" },
  { id: "vidro", iconName: "wine-outline" },
  { id: "outros", iconName: "ellipse-outline" },
];

const weights: WeightOption[] = [
  { id: "small", value: 1, label: "Leve", helper: "Volume pequeno ou saco rapido" },
  { id: "medium", value: 5, label: "Media", helper: "Coleta comum do dia a dia" },
  { id: "large", value: 15, label: "Grande", helper: "Carga maior ou acumulada" },
];

function StepTrack({
  step,
}: {
  step: number;
}): React.JSX.Element {
  const labels = ["Material", "Peso", "Confirmar"];

  return (
    <AppCard style={styles.stepCard}>
      <View style={styles.stepTrackRow}>
        {labels.map((label, index) => {
          const current = index + 1;
          const done = step > current;
          const active = step === current;

          return (
            <React.Fragment key={label}>
              <View style={styles.stepNodeWrap}>
                <View
                  style={[
                    styles.stepNode,
                    done || active ? styles.stepNodeActive : null,
                    active ? styles.stepNodeCurrent : null,
                  ]}
                >
                  <Ionicons
                    name={done ? "checkmark" : "ellipse-outline"}
                    size={done ? 16 : 0}
                    color={colors.textLight}
                  />
                  {!done ? (
                    <Text
                      style={[
                        styles.stepNodeText,
                        active ? styles.stepNodeTextActive : null,
                      ]}
                    >
                      {current}
                    </Text>
                  ) : null}
                </View>
                <Text
                  style={[
                    styles.stepLabel,
                    active ? styles.stepLabelActive : null,
                  ]}
                >
                  {label}
                </Text>
              </View>
              {index < labels.length - 1 ? <View style={styles.stepLine} /> : null}
            </React.Fragment>
          );
        })}
      </View>
    </AppCard>
  );
}

function getStatusTitle(step: number): string {
  if (step === 1) {
    return "Escolha o material para comecar";
  }

  if (step === 2) {
    return "Defina o peso aproximado da coleta";
  }

  return "Revise e salve sua coleta";
}

function getStatusDescription(
  step: number,
  material: Material | null,
  weight: WeightOption | null,
): string {
  if (step === 1) {
    return "Comece escolhendo o tipo de material para agilizar o registro.";
  }

  if (step === 2) {
    return material
      ? `${MATERIAL_LABEL[material]} selecionado. Agora escolha o peso mais proximo da sua coleta.`
      : "Escolha o peso que melhor representa esta coleta.";
  }

  return weight
    ? `Tudo pronto: ${weight.value.toFixed(1)} kg de ${material ? MATERIAL_LABEL[material].toLowerCase() : "material"} para salvar agora.`
    : "Revise os dados antes de salvar.";
}

const CollectionScreen = ({ navigation }: Props): React.JSX.Element => {
  const { width } = useWindowDimensions();
  const isWide = width >= 980;
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [estimatedWeight, setEstimatedWeight] = useState<WeightOption | null>(null);

  const registerCollection = useCollectionsStore((state) => state.registerCollection);
  const collectionStatus = useCollectionsStore((state) => state.collectionStatus);
  const errorMessage = useCollectionsStore((state) => state.errorMessage);

  const currentStep = useMemo(() => {
    if (!selectedMaterial) {
      return 1;
    }
    if (!estimatedWeight) {
      return 2;
    }
    return 3;
  }, [estimatedWeight, selectedMaterial]);

  const canSave = selectedMaterial && estimatedWeight && collectionStatus !== "loading";
  const statusTitle = getStatusTitle(currentStep);
  const statusDescription = getStatusDescription(
    currentStep,
    selectedMaterial,
    estimatedWeight,
  );

  const handleConfirmCollection = async (): Promise<void> => {
    try {
      if (!selectedMaterial || !estimatedWeight) {
        Alert.alert(
          "Falta um passo",
          "Escolha o material e o peso antes de salvar a coleta.",
        );
        return;
      }

      const timestamp = new Date().toISOString();
      const result = await registerCollection({
        material: selectedMaterial,
        weightRange: estimatedWeight.id,
        weightKg: estimatedWeight.value,
        collectedAt: timestamp,
        createdAt: timestamp,
      });

      Alert.alert(
        "Coleta salva com sucesso",
        result.status === "permission_denied"
          ? "A coleta foi salva, mas a localizacao nao foi capturada desta vez."
          : "A coleta foi salva no aparelho e entrara na sincronizacao quando houver internet.",
        [
          {
            text: "Ver painel",
            onPress: () => {
              setSelectedMaterial(null);
              setEstimatedWeight(null);
              navigation.navigate("Inicio");
            },
          },
        ],
      );
    } catch {
      Alert.alert(
        "Nao foi possivel salvar agora",
        errorMessage || "Tente novamente em alguns instantes.",
      );
    }
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.hero}>
        <Image
          source={require("../../assets/brand/brand-mark.png")}
          style={styles.heroMark}
          resizeMode="contain"
        />
        <View style={styles.heroIcon}>
          <Ionicons name="add" size={26} color={colors.primaryStrong} />
        </View>
        <Text style={styles.heroTitle}>Registrar coleta sem atrito.</Text>
        <Text style={styles.heroDescription}>
          Preencha o essencial para registrar rapido, mesmo sem internet.
        </Text>
      </View>

      <StepTrack step={currentStep} />

      <AppCard style={styles.statusCard}>
        <View style={styles.statusIconWrap}>
          <Ionicons
            name={
              currentStep === 1
                ? "layers-outline"
                : currentStep === 2
                  ? "scale-outline"
                  : "checkmark-circle-outline"
            }
            size={22}
            color={colors.primaryStrong}
          />
        </View>
        <View style={styles.statusBody}>
          <Text style={styles.statusTitle}>{statusTitle}</Text>
          <Text style={styles.statusDescription}>{statusDescription}</Text>
        </View>
      </AppCard>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Material da coleta</Text>
          <Text style={styles.sectionHelper}>Escolha um material para continuar</Text>
        </View>
        <View style={styles.materialRow}>
          {materials.map((material) => {
            const active = selectedMaterial === material.id;

            return (
              <View key={material.id} style={styles.materialChoiceWrap}>
                <PrimaryButton
                  label={MATERIAL_LABEL[material.id]}
                  iconName={material.iconName}
                  onPress={() => {
                    setSelectedMaterial(material.id);
                    setEstimatedWeight(null);
                  }}
                  variant={active ? "primary" : "secondary"}
                  style={[
                    styles.materialChoice,
                    isWide ? styles.materialChoiceWide : null,
                    active ? styles.materialChoiceActive : null,
                  ]}
                />
              </View>
            );
          })}
        </View>
      </View>

      {selectedMaterial ? (
        <>
          <AppCard style={styles.weightCard}>
            <View style={styles.weightIcon}>
              <Ionicons name="scale-outline" size={28} color={colors.primaryStrong} />
            </View>
            <View style={styles.weightBody}>
              <Text style={styles.weightLabel}>Peso da coleta</Text>
              <Text style={styles.weightValue}>
                {estimatedWeight ? estimatedWeight.value.toFixed(1) : "0.0"} kg
              </Text>
              <Text style={styles.weightHelper}>
                {estimatedWeight
                  ? estimatedWeight.helper
                  : "Escolha a faixa que mais se aproxima do peso coletado."}
              </Text>
            </View>
          </AppCard>

          <View style={styles.weightOptionsRow}>
            {weights.map((weight) => (
              <PrimaryButton
                key={weight.id}
                label={`${weight.label} ${weight.value} kg`}
                variant={estimatedWeight?.id === weight.id ? "primary" : "secondary"}
                onPress={() => setEstimatedWeight(weight)}
                style={styles.weightOption}
              />
            ))}
          </View>
        </>
      ) : null}

      <AppCard style={styles.locationCard}>
        <View style={styles.locationIcon}>
          <Ionicons name="location" size={24} color={colors.primaryStrong} />
        </View>
        <View style={styles.locationBody}>
          <Text style={styles.locationTitle}>Posicao atual do aparelho</Text>
          <Text style={styles.locationDescription}>
            O app tenta capturar sua localizacao ao salvar, sem impedir o registro se isso falhar.
          </Text>
          <View style={styles.locationPill}>
            <Ionicons name="cloud-offline-outline" size={14} color={colors.primaryStrong} />
            <Text style={styles.locationPillText}>Funciona sem internet</Text>
          </View>
        </View>
      </AppCard>

      {selectedMaterial && estimatedWeight ? (
        <AppCard style={styles.confirmCard}>
          <View style={styles.confirmHeader}>
            <Text style={styles.sectionTitle}>Confirmar antes de salvar</Text>
            <Text style={styles.confirmHelper}>Revise os dados essenciais desta coleta</Text>
          </View>

          <View style={styles.confirmRow}>
            <Ionicons name="document-text-outline" size={22} color={colors.primaryStrong} />
            <Text style={styles.confirmKey}>Material</Text>
            <Text style={styles.confirmValue}>{MATERIAL_LABEL[selectedMaterial]}</Text>
          </View>
          <View style={styles.confirmDivider} />
          <View style={styles.confirmRow}>
            <Ionicons name="scale-outline" size={22} color={colors.primaryStrong} />
            <Text style={styles.confirmKey}>Peso registrado</Text>
            <Text style={styles.confirmValue}>{estimatedWeight.value.toFixed(1)} kg</Text>
          </View>
          <View style={styles.confirmDivider} />
          <View style={styles.confirmRow}>
            <Ionicons name="location-outline" size={22} color={colors.primaryStrong} />
            <Text style={styles.confirmKey}>Origem da coleta</Text>
            <Text style={styles.confirmValue}>Posicao atual do aparelho</Text>
          </View>
          <View style={styles.confirmDivider} />
          <View style={styles.confirmRow}>
            <Ionicons name="cloud-upload-outline" size={22} color={colors.primaryStrong} />
            <Text style={styles.confirmKey}>Status esperado</Text>
            <Text style={styles.confirmValue}>Dados salvos no aparelho</Text>
          </View>
        </AppCard>
      ) : null}

      <PrimaryButton
        label={collectionStatus === "loading" ? "Salvando coleta..." : "Salvar coleta"}
        iconName={collectionStatus === "loading" ? "sync-outline" : "save-outline"}
        onPress={() => void handleConfirmCollection()}
        disabled={!canSave}
      />

      <PrimaryButton
        label={selectedMaterial || estimatedWeight ? "Editar informacoes" : "Voltar"}
        variant="secondary"
        onPress={() => {
          setSelectedMaterial(null);
          setEstimatedWeight(null);
        }}
      />

      {collectionStatus === "error" && errorMessage ? (
        <AppCard muted style={styles.feedbackCard}>
          <Ionicons name="alert-circle-outline" size={20} color={colors.error} />
          <Text style={styles.feedbackText}>{errorMessage}</Text>
        </AppCard>
      ) : null}
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
    gap: 16,
  },
  hero: {
    backgroundColor: colors.primaryStrong,
    borderRadius: 30,
    padding: 24,
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
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: colors.textLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  heroTitle: {
    color: colors.textLight,
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "800",
    maxWidth: 420,
  },
  heroDescription: {
    color: "rgba(255,255,255,0.92)",
    fontSize: 16,
    lineHeight: 26,
    marginTop: 14,
    maxWidth: 420,
  },
  stepCard: {
    borderRadius: 28,
  },
  stepTrackRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  stepNodeWrap: {
    alignItems: "center",
    gap: 10,
  },
  stepNode: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNodeActive: {
    backgroundColor: "#DDEEDF",
  },
  stepNodeCurrent: {
    backgroundColor: colors.primary,
  },
  stepNodeText: {
    color: colors.primaryStrong,
    fontSize: 18,
    fontWeight: "800",
  },
  stepNodeTextActive: {
    color: colors.textLight,
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: "#C7DEC9",
    marginHorizontal: 8,
  },
  stepLabel: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: "600",
  },
  stepLabelActive: {
    color: colors.primaryStrong,
    fontWeight: "800",
  },
  statusCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
  },
  statusIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  statusBody: {
    flex: 1,
  },
  statusTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
  },
  statusDescription: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 22,
    marginTop: 8,
  },
  section: {
    gap: 12,
  },
  sectionHeader: {
    gap: 6,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
  },
  sectionHelper: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
  },
  materialRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  materialChoiceWrap: {
    flexGrow: 1,
    minWidth: 140,
  },
  materialChoice: {
    justifyContent: "flex-start",
  },
  materialChoiceWide: {
    minHeight: 76,
  },
  materialChoiceActive: {
    backgroundColor: colors.primary,
  },
  weightCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  weightIcon: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  weightBody: {
    flex: 1,
  },
  weightLabel: {
    color: colors.textMuted,
    fontSize: 14,
  },
  weightValue: {
    color: colors.text,
    fontSize: 46,
    fontWeight: "800",
    marginTop: 4,
  },
  weightHelper: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 4,
  },
  weightOptionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  weightOption: {
    flexGrow: 1,
    minWidth: 140,
  },
  locationCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  locationIcon: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  locationBody: {
    flex: 1,
  },
  locationTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700",
  },
  locationDescription: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 22,
    marginTop: 6,
  },
  locationPill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#DDEEDF",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    marginTop: 10,
  },
  locationPillText: {
    color: colors.primaryStrong,
    fontSize: 13,
    fontWeight: "700",
  },
  confirmCard: {
    gap: 10,
  },
  confirmHeader: {
    gap: 6,
  },
  confirmHelper: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
  },
  confirmRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 54,
  },
  confirmKey: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
  },
  confirmValue: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
  },
  confirmDivider: {
    height: 1,
    backgroundColor: colors.border,
  },
  feedbackCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  feedbackText: {
    flex: 1,
    color: colors.error,
    fontSize: 13,
    lineHeight: 20,
  },
});

export default CollectionScreen;
