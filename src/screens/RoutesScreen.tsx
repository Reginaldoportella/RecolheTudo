import React from "react";
import { View, Text, StyleSheet } from "react-native";

import globalStyles from "../styles/globalStyles";
import colors from "../styles/colors";

const RoutesScreen = (): React.JSX.Element => {
  return (
    <View style={globalStyles.container}>
      <Text style={globalStyles.heading}>ROTAS</Text>
      <View style={styles.card}>
        <Text style={styles.title}>Em desenvolvimento</Text>
        <Text style={styles.description}>
          Aqui vamos exibir o mapa, pontos de coleta e rota otimizada do dia.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 16,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    color: colors.text,
    opacity: 0.8,
    lineHeight: 22,
  },
});

export default RoutesScreen;
