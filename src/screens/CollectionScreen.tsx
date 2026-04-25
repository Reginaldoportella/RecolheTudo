import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";

import globalStyles from "../styles/globalStyles";
import colors from "../styles/colors";
import MaterialButton from "../components/MaterialButton";
import { useCollectionsStore } from "../state/useCollectionsStore";
import type { Material } from "../domain/types/collection";
import type { RootTabParamList } from "../navigation/types";

type Props = BottomTabScreenProps<RootTabParamList, "Coleta">;

interface MaterialOption {
  id: Material;
  name: string;
  iconName: React.ComponentProps<typeof Ionicons>["name"];
}

interface WeightOption {
  id: string;
  value: number;
  label: string;
  image: string;
  description: string;
}

const materials: MaterialOption[] = [
  { id: "papel", name: "PAPEL", iconName: "document" },
  { id: "plastico", name: "PLASTICO", iconName: "water" },
  { id: "metal", name: "METAL", iconName: "hardware-chip" },
  { id: "vidro", name: "VIDRO", iconName: "wine" },
  { id: "outros", name: "OUTROS", iconName: "layers" },
];

const weights: WeightOption[] = [
  {
    id: "small",
    value: 1,
    label: "POUCO",
    image: "🧺",
    description: "Até 1kg (uma sacola pequena)",
  },
  {
    id: "medium",
    value: 5,
    label: "MÉDIO",
    image: "🛍️",
    description: "Até 5kg (sacola grande)",
  },
  {
    id: "large",
    value: 15,
    label: "MUITO",
    image: "📦",
    description: "Até 15kg (caixa grande)",
  },
];

const CollectionScreen = ({ navigation }: Props): React.JSX.Element => {
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialOption | null>(null);
  const [estimatedWeight, setEstimatedWeight] = useState<WeightOption | null>(null);

  const registerCollection = useCollectionsStore((state) => state.registerCollection);
  const collectionStatus = useCollectionsStore((state) => state.collectionStatus);
  const errorMessage = useCollectionsStore((state) => state.errorMessage);

  const handleMaterialSelect = (material: MaterialOption): void => {
    setSelectedMaterial(material);
    setEstimatedWeight(null);
  };

  const handleWeightSelect = (weight: WeightOption): void => {
    setEstimatedWeight(weight);
  };

  const handleConfirmCollection = async (): Promise<void> => {
    try {
      if (!selectedMaterial || !estimatedWeight) {
        Alert.alert("Dados incompletos", "Selecione material e peso.");
        return;
      }

      const result = await registerCollection({
        material: selectedMaterial.id,
        weightKg: estimatedWeight.value,
        createdAt: new Date().toISOString(),
      });

      Alert.alert(
        "Coleta Registrada!",
        result.status === "permission_denied"
          ? `Material: ${selectedMaterial.name}\nPeso: ${estimatedWeight.value}kg\nRegistrada sem localizacao.`
          : `Material: ${selectedMaterial.name}\nPeso: ${estimatedWeight.value}kg\nRegistrado com sucesso!`,
        [
          {
            text: "OK",
            onPress: () => {
              setSelectedMaterial(null);
              setEstimatedWeight(null);
              navigation.navigate("Início");
            },
          },
        ],
      );
    } catch (error) {
      Alert.alert(
        "Erro",
        errorMessage || "Não foi possível registrar a coleta. Tente novamente.",
      );
      console.error(error);
    }
  };

  if (!selectedMaterial) {
    return (
      <ScrollView style={globalStyles.container}>
        <Text style={globalStyles.heading}>QUE MATERIAL VOCÊ COLETOU?</Text>

        <View style={styles.materialsGrid}>
          {materials.map((material) => (
            <MaterialButton
              key={material.id}
              material={material.id}
              label={material.name}
              iconName={material.iconName}
              onPress={() => handleMaterialSelect(material)}
            />
          ))}
        </View>
      </ScrollView>
    );
  }

  if (!estimatedWeight) {
    return (
      <ScrollView style={globalStyles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setSelectedMaterial(null)}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={globalStyles.heading}>QUANTO VOCÊ COLETOU?</Text>
        </View>

        <Text style={styles.selectedMaterial}>Material: {selectedMaterial.name}</Text>

        <View style={styles.weightsContainer}>
          {weights.map((weight) => (
            <TouchableOpacity
              key={weight.id}
              style={styles.weightOption}
              onPress={() => handleWeightSelect(weight)}
            >
              <Text style={styles.weightEmoji}>{weight.image}</Text>
              <Text style={styles.weightLabel}>{weight.label}</Text>
              <Text style={styles.weightValue}>{weight.value} kg</Text>
              <Text style={styles.weightDescription}>{weight.description}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    );
  }

  return (
    <View style={globalStyles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setEstimatedWeight(null)}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={globalStyles.heading}>CONFIRMAR COLETA</Text>
      </View>

      <View style={[globalStyles.card, styles.confirmationCard]}>
        <View style={styles.confirmationItem}>
          <Text style={styles.confirmationLabel}>Material:</Text>
          <Text style={styles.confirmationValue}>{selectedMaterial.name}</Text>
        </View>

        <View style={styles.confirmationItem}>
          <Text style={styles.confirmationLabel}>Peso Estimado:</Text>
          <Text style={styles.confirmationValue}>{estimatedWeight.value} kg</Text>
        </View>

        <View style={styles.confirmationItem}>
          <Text style={styles.confirmationLabel}>Local:</Text>
          <Text style={styles.confirmationValue}>Posição atual</Text>
        </View>
      </View>

      <TouchableOpacity
        style={[
          globalStyles.largeButton,
          { backgroundColor: colors.success },
          collectionStatus === "loading" ? styles.buttonDisabled : null,
        ]}
        onPress={() => void handleConfirmCollection()}
        disabled={collectionStatus === "loading"}
      >
        <Text style={globalStyles.largeButtonText}>
          {collectionStatus === "loading" ? "SALVANDO..." : "CONFIRMAR COLETA"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[globalStyles.largeButton, { backgroundColor: colors.error }]}
        onPress={() => setSelectedMaterial(null)}
      >
        <Text style={globalStyles.largeButtonText}>CANCELAR</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  materialsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  selectedMaterial: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: colors.primary,
  },
  weightsContainer: {
    alignItems: "center",
  },
  weightOption: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    marginVertical: 10,
    width: "100%",
    alignItems: "center",
    elevation: 3,
  },
  weightEmoji: {
    fontSize: 40,
    marginBottom: 10,
  },
  weightLabel: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.text,
  },
  weightValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.primary,
    marginVertical: 5,
  },
  weightDescription: {
    fontSize: 14,
    color: colors.text,
    opacity: 0.7,
    textAlign: "center",
  },
  confirmationCard: {
    marginVertical: 20,
  },
  confirmationItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  confirmationLabel: {
    fontSize: 16,
    color: colors.text,
    opacity: 0.7,
  },
  confirmationValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
});

export default CollectionScreen;
