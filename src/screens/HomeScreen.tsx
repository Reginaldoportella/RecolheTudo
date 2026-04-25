import React, { useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";

import globalStyles from "../styles/globalStyles";
import colors from "../styles/colors";
import { useCollectionsStore } from "../state/useCollectionsStore";
import type { RootTabParamList } from "../navigation/types";

type Props = BottomTabScreenProps<RootTabParamList, "Início">;

const HomeScreen = ({ navigation }: Props): React.JSX.Element => {
  const dateKey = new Date().toISOString().slice(0, 10);
  const loadHome = useCollectionsStore((state) => state.loadHome);
  const homeStatus = useCollectionsStore((state) => state.homeStatus);
  const dailySummaryByDate = useCollectionsStore((state) => state.dailySummaryByDate);
  const errorMessage = useCollectionsStore((state) => state.errorMessage);

  useEffect(() => {
    void loadHome(dateKey);
  }, [dateKey, loadHome]);

  const summary = dailySummaryByDate[dateKey];
  const totalKg = summary?.totalKg ?? 0;
  const byMaterial = summary?.byMaterial ?? {
    papel: 0,
    plastico: 0,
    metal: 0,
    vidro: 0,
    outros: 0,
  };

  return (
    <ScrollView style={globalStyles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Olá, Catador!</Text>
        <Text style={styles.dateText}>{dateKey}</Text>
      </View>

      {homeStatus === "loading" && (
        <View style={[globalStyles.card, styles.feedbackCard]}>
          <Text style={styles.feedbackText}>Carregando resumo do dia...</Text>
        </View>
      )}

      {homeStatus === "error" && (
        <View style={[globalStyles.card, styles.feedbackCard]}>
          <Text style={styles.feedbackText}>
            Erro ao carregar: {errorMessage ?? "falha desconhecida"}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => void loadHome(dateKey)}>
            <Text style={styles.retryButtonText}>TENTAR NOVAMENTE</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={[globalStyles.card, styles.summaryCard]}>
        <Text style={styles.cardTitle}>RESUMO DE HOJE</Text>
        {homeStatus === "empty" && (
          <Text style={styles.emptyHint}>Sem coletas registradas hoje.</Text>
        )}
        <View style={styles.totalContainer}>
          <Text style={styles.totalValue}>{totalKg.toFixed(1)} kg</Text>
          <Text style={styles.totalLabel}>TOTAL COLETADO</Text>
        </View>

        <View style={styles.materialsContainer}>
          <View style={styles.materialItem}>
            <View style={[styles.materialIcon, { backgroundColor: colors.paper }]}>
              <Ionicons name="document" size={24} color="white" />
            </View>
            <Text style={styles.materialValue}>{byMaterial.papel.toFixed(1)} kg</Text>
            <Text style={styles.materialLabel}>Papel</Text>
          </View>

          <View style={styles.materialItem}>
            <View style={[styles.materialIcon, { backgroundColor: colors.plastic }]}>
              <Ionicons name="water" size={24} color="white" />
            </View>
            <Text style={styles.materialValue}>{byMaterial.plastico.toFixed(1)} kg</Text>
            <Text style={styles.materialLabel}>Plástico</Text>
          </View>

          <View style={styles.materialItem}>
            <View style={[styles.materialIcon, { backgroundColor: colors.metal }]}>
              <Ionicons name="hardware-chip" size={24} color="white" />
            </View>
            <Text style={styles.materialValue}>{byMaterial.metal.toFixed(1)} kg</Text>
            <Text style={styles.materialLabel}>Metal</Text>
          </View>

          <View style={styles.materialItem}>
            <View style={[styles.materialIcon, { backgroundColor: colors.glass }]}>
              <Ionicons name="wine" size={24} color="white" />
            </View>
            <Text style={styles.materialValue}>{byMaterial.vidro.toFixed(1)} kg</Text>
            <Text style={styles.materialLabel}>Vidro</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={[globalStyles.largeButton, { backgroundColor: colors.primary }]}
        onPress={() => navigation.navigate("Coleta")}
      >
        <Text style={globalStyles.largeButtonText}>REGISTRAR COLETA</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[globalStyles.largeButton, { backgroundColor: colors.secondary }]}
        onPress={() => navigation.navigate("Rotas")}
      >
        <Text style={globalStyles.largeButtonText}>VER ROTA DE HOJE</Text>
      </TouchableOpacity>

      <View style={[globalStyles.card, styles.tipsCard]}>
        <Text style={styles.cardTitle}>DICA DO DIA</Text>
        <Text style={styles.tipText}>
          Separe os materiais por tipo durante a coleta para facilitar a pesagem e aumentar
          o valor recebido!
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  header: {
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: "bold",
    color: colors.text,
  },
  dateText: {
    fontSize: 16,
    color: colors.text,
    opacity: 0.7,
  },
  summaryCard: {
    marginBottom: 20,
  },
  feedbackCard: {
    marginBottom: 14,
  },
  feedbackText: {
    fontSize: 14,
    color: colors.text,
  },
  retryButton: {
    marginTop: 12,
    backgroundColor: colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  retryButtonText: {
    color: colors.textLight,
    fontWeight: "bold",
    fontSize: 12,
  },
  emptyHint: {
    color: colors.text,
    opacity: 0.7,
    marginBottom: 12,
    fontSize: 13,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 15,
  },
  totalContainer: {
    alignItems: "center",
    marginBottom: 15,
  },
  totalValue: {
    fontSize: 36,
    fontWeight: "bold",
    color: colors.primary,
  },
  totalLabel: {
    fontSize: 14,
    color: colors.text,
    opacity: 0.7,
  },
  materialsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
  },
  materialItem: {
    alignItems: "center",
    width: "25%",
    marginBottom: 10,
  },
  materialIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 5,
  },
  materialValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: colors.text,
  },
  materialLabel: {
    fontSize: 12,
    color: colors.text,
    opacity: 0.7,
  },
  tipsCard: {
    backgroundColor: "#FFF9C4",
    marginTop: 10,
    marginBottom: 20,
  },
  tipText: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 22,
  },
});

export default HomeScreen;
