import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import globalStyles from '../styles/globalStyles';
import colors from '../styles/colors';

const RoutesScreen = () => {
  return (
    <View style={[globalStyles.container, styles.container]}>
      <Ionicons name="map" size={64} color={colors.primary} style={styles.icon} />
      <Text style={globalStyles.heading}>Rotas do dia</Text>
      <Text style={styles.description}>
        Em uma versão futura, esta tela mostrará as melhores rotas de coleta próximas a você.
      </Text>
      <Text style={styles.description}>
        Enquanto isso, continue registrando suas coletas para que possamos sugerir caminhos mais eficientes.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    marginBottom: 24,
  },
  description: {
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
});

export default RoutesScreen;
