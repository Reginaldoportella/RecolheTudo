import React, { useMemo, useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";

import globalStyles from "../styles/globalStyles";
import colors from "../styles/colors";
import MaterialButton from "../components/MaterialButton";
import { useCollectionsStore } from "../state/useCollectionsStore";
import type { Material, WeightRange } from "../domain/types/collection";
import type { RootTabParamList } from "../navigation/types";

type Props = BottomTabScreenProps<RootTabParamList, "Coleta">;

interface MaterialOption {
  id: Material;
  name: string;
  iconName: React.ComponentProps<typeof Ionicons>["name"];
}

interface WeightOption {
  id: WeightRange;
  value: number;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  description: string;
}

const materials: MaterialOption[] = [
  { id: "papel", name: "Papel", iconName: "document-text-outline" },
  { id: "plastico", name: "Plastico", iconName: "water-outline" },
  { id: "metal", name: "Metal", iconName: "hardware-chip-outline" },
  { id: "vidro", name: "Vidro", iconName: "wine-outline" },
  { id: "outros", name: "Outros", iconName: "layers-outline" },
];

const weights: WeightOption[] = [
  {
    id: "small",
    value: 1,
    label: "Leve",
    icon: "leaf-outline",
    description: "Ate 1 kg. Ideal para uma coleta pequena e rapida.",
  },
  {
    id: "medium",
    value: 5,
    label: "Media",
    icon: "briefcase-outline",
    description: "Ate 5 kg. O tamanho mais comum para uma parada.",
  },
  {
    id: "large",
    value: 15,
    label: "Grande",
    icon: "cube-outline",
    description: "Ate 15 kg. Para volume alto ou carga mais pesada.",
  },
];

function StepPill({
  index,
  label,
  active,
  done,
}: {
  index: number;
  label: string;
  active: boolean;
  done: boolean;
}): React.JSX.Element {
  return (
    <View style={[styles.stepPill, active ? styles.stepPillActive : null]}>
      <View
        style={[
          styles.stepIndicator,
          active ? styles.stepIndicatorActive : null,
          done ? styles.stepIndicatorDone : null,
        ]}
      >
        <Text style={[styles.stepIndicatorText, active ? styles.stepIndicatorTextActive : null]}>
          {done ? "OK" : index}
        </Text>
      </View>
      <Text style={[styles.stepLabel, active ? styles.stepLabelActive : null]}>
        {label}
      </Text>
    </View>
  );
}

const CollectionScreen = ({ navigation }: Props): React.JSX.Element => {
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialOption | null>(null);
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

  const handleConfirmCollection = async (): Promise<void> => {
    try {
      if (!selectedMaterial || !estimatedWeight) {
        Alert.alert("Dados incompletos", "Selecione material e peso.");
        return;
      }

      const timestamp = new Date().toISOString();
      const result = await registerCollection({
        material: selectedMaterial.id,
        weightRange: estimatedWeight.id,
        weightKg: estimatedWeight.value,
        collectedAt: timestamp,
        createdAt: timestamp,
      });

      Alert.alert(
        "Coleta registrada",
        result.status === "permission_denied"
          ? "O registro foi salvo, mas sem localizacao."
          : "O registro foi salvo com sucesso.",
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
    } catch (error) {
      Alert.alert(
        "Erro",
        errorMessage || "Nao foi possivel registrar a coleta. Tente novamente.",
      );
      console.error(error);
    }
  };

  return (
    <ScrollView
      style={globalStyles.container}
      contentContainerStyle={globalStyles.screenContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.hero}>
        <Text style={globalStyles.sectionEyebrow}>Fluxo guiado</Text>
        <Text style={styles.heroTitle}>Registrar coleta sem atrito.</Text>
        <Text style={styles.heroSubtitle}>
          O foco aqui e registrar rapido, mesmo na rua e com internet ruim.
        </Text>

        <View style={styles.stepsRow}>
          <StepPill index={1} label="Material" active={currentStep === 1} done={currentStep > 1} />
          <StepPill index={2} label="Peso" active={currentStep === 2} done={currentStep > 2} />
          <StepPill index={3} label="Confirmar" active={currentStep === 3} done={false} />
        </View>
      </View>

      {currentStep === 1 && (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>1. Qual material voce coletou?</Text>
          <Text style={styles.sectionDescription}>
            Escolha o tipo principal para manter o historico mais util.
          </Text>

          <View style={styles.materialsGrid}>
            {materials.map((material) => (
              <MaterialButton
                key={material.id}
                material={material.id}
                label={material.name}
                iconName={material.iconName}
                onPress={() => {
                  setSelectedMaterial(material);
                  setEstimatedWeight(null);
                }}
              />
            ))}
          </View>
        </View>
      )}

      {currentStep === 2 && selectedMaterial && (
        <View style={styles.sectionCard}>
          <View style={styles.backRow}>
            <TouchableOpacity onPress={() => setSelectedMaterial(null)}>
              <Ionicons name="arrow-back" size={22} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.backRowText}>Voltar para material</Text>
          </View>

          <Text style={styles.sectionTitle}>2. Quanto foi coletado?</Text>
          <Text style={styles.sectionDescription}>
            Material selecionado: {selectedMaterial.name}
          </Text>

          <View style={styles.weightsList}>
            {weights.map((weight) => {
              const isSelected = estimatedWeight?.id === weight.id;

              return (
                <TouchableOpacity
                  key={weight.id}
                  style={[styles.weightCard, isSelected ? styles.weightCardSelected : null]}
                  onPress={() => setEstimatedWeight(weight)}
                >
                  <View style={styles.weightCardTop}>
                    <View style={styles.weightIconWrap}>
                      <Ionicons name={weight.icon} size={22} color={colors.primary} />
                    </View>
                    <View style={styles.weightCardBody}>
                      <Text style={styles.weightLabel}>{weight.label}</Text>
                      <Text style={styles.weightDescription}>{weight.description}</Text>
                    </View>
                    <Text style={styles.weightValue}>{weight.value} kg</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {currentStep === 3 && selectedMaterial && estimatedWeight && (
        <View style={styles.sectionCard}>
          <View style={styles.backRow}>
            <TouchableOpacity onPress={() => setEstimatedWeight(null)}>
              <Ionicons name="arrow-back" size={22} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.backRowText}>Voltar para peso</Text>
          </View>

          <Text style={styles.sectionTitle}>3. Conferir antes de salvar</Text>
          <Text style={styles.sectionDescription}>
            O app tenta capturar a localizacao automaticamente no momento do registro.
          </Text>

          <View style={styles.confirmationCard}>
            <View style={styles.confirmRow}>
              <Text style={styles.confirmLabel}>Material</Text>
              <Text style={styles.confirmValue}>{selectedMaterial.name}</Text>
            </View>
            <View style={styles.confirmRow}>
              <Text style={styles.confirmLabel}>Peso estimado</Text>
              <Text style={styles.confirmValue}>{estimatedWeight.value} kg</Text>
            </View>
            <View style={styles.confirmRow}>
              <Text style={styles.confirmLabel}>Origem do local</Text>
              <Text style={styles.confirmValue}>Posicao atual do aparelho</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[
              globalStyles.largeButton,
              collectionStatus === "loading" ? styles.buttonDisabled : null,
            ]}
            onPress={() => void handleConfirmCollection()}
            disabled={collectionStatus === "loading"}
          >
            <Text style={globalStyles.largeButtonText}>
              {collectionStatus === "loading" ? "Salvando..." : "Salvar coleta"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[globalStyles.largeButton, styles.secondaryButton]}
            onPress={() => {
              setSelectedMaterial(null);
              setEstimatedWeight(null);
            }}
          >
            <Text style={[globalStyles.largeButtonText, styles.secondaryButtonText]}>
              Reiniciar fluxo
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  hero: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
    ...Platform.select({
      web: {
        boxShadow: "0 10px 24px rgba(24, 33, 27, 0.08)",
      },
      default: {
        shadowColor: "#18211B",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 18,
        elevation: 4,
      },
    }),
  },
  heroTitle: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "800",
    marginTop: 10,
  },
  heroSubtitle: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
  },
  stepsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 18,
  },
  stepPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 8,
  },
  stepPillActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  stepIndicator: {
    width: 24,
    height: 24,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  stepIndicatorActive: {
    backgroundColor: colors.primary,
  },
  stepIndicatorDone: {
    backgroundColor: colors.primaryStrong,
  },
  stepIndicatorText: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: "800",
  },
  stepIndicatorTextActive: {
    color: colors.textLight,
  },
  stepLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
  },
  stepLabelActive: {
    color: colors.primaryStrong,
  },
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 23,
    fontWeight: "800",
  },
  sectionDescription: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 6,
  },
  materialsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 18,
  },
  backRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  backRowText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: "700",
  },
  weightsList: {
    marginTop: 18,
    gap: 12,
  },
  weightCard: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  weightCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  weightCardTop: {
    flexDirection: "row",
    alignItems: "center",
  },
  weightIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    marginRight: 14,
  },
  weightCardBody: {
    flex: 1,
  },
  weightLabel: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
  },
  weightDescription: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  weightValue: {
    color: colors.primaryStrong,
    fontSize: 18,
    fontWeight: "800",
    marginLeft: 12,
  },
  confirmationCard: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 18,
    marginBottom: 14,
  },
  confirmRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  confirmLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  confirmValue: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "800",
    marginTop: 4,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  secondaryButton: {
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryButtonText: {
    color: colors.text,
  },
});

export default CollectionScreen;
