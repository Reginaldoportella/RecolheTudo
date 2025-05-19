import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import globalStyles from '../styles/globalStyles';
import colors from '../styles/colors';

const HomeScreen = ({ navigation }) => {
  // Dados de exemplo
  const todaySummary = {
    paper: 5.2,
    plastic: 3.8,
    metal: 2.1,
    glass: 4.3,
    other: 1.0,
  };

  const totalKg = Object.values(todaySummary).reduce((sum, current) => sum + current, 0);

  return (
    <ScrollView style={globalStyles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Olá, Catador!</Text>
        <Text style={styles.dateText}>Quinta, 08 de Maio</Text>
      </View>

      <View style={[globalStyles.card, styles.summaryCard]}>
        <Text style={styles.cardTitle}>RESUMO DE HOJE</Text>
        <View style={styles.totalContainer}>
          <Text style={styles.totalValue}>{totalKg.toFixed(1)} kg</Text>
          <Text style={styles.totalLabel}>TOTAL COLETADO</Text>
        </View>
        
        <View style={styles.materialsContainer}>
          <View style={styles.materialItem}>
            <View style={[styles.materialIcon, { backgroundColor: colors.paper }]}>
              <Ionicons name="document" size={24} color="white" />
            </View>
            <Text style={styles.materialValue}>{todaySummary.paper.toFixed(1)} kg</Text>
            <Text style={styles.materialLabel}>Papel</Text>
          </View>
          
          <View style={styles.materialItem}>
            <View style={[styles.materialIcon, { backgroundColor: colors.plastic }]}>
              <Ionicons name="water" size={24} color="white" />
            </View>
            <Text style={styles.materialValue}>{todaySummary.plastic.toFixed(1)} kg</Text>
            <Text style={styles.materialLabel}>Plástico</Text>
          </View>
          
          <View style={styles.materialItem}>
            <View style={[styles.materialIcon, { backgroundColor: colors.metal }]}>
              <Ionicons name="hardware-chip" size={24} color="white" />
            </View>
            <Text style={styles.materialValue}>{todaySummary.metal.toFixed(1)} kg</Text>
            <Text style={styles.materialLabel}>Metal</Text>
          </View>
          
          <View style={styles.materialItem}>
            <View style={[styles.materialIcon, { backgroundColor: colors.glass }]}>
              <Ionicons name="wine" size={24} color="white" />
            </View>
            <Text style={styles.materialValue}>{todaySummary.glass.toFixed(1)} kg</Text>
            <Text style={styles.materialLabel}>Vidro</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity 
        style={[globalStyles.largeButton, { backgroundColor: colors.primary }]}
        onPress={() => navigation.navigate('Coleta')}
      >
        <Text style={globalStyles.largeButtonText}>REGISTRAR COLETA</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[globalStyles.largeButton, { backgroundColor: colors.secondary }]}
        onPress={() => navigation.navigate('Rotas')}
      >
        <Text style={globalStyles.largeButtonText}>VER ROTA DE HOJE</Text>
      </TouchableOpacity>
      
      <View style={[globalStyles.card, styles.tipsCard]}>
        <Text style={styles.cardTitle}>DICA DO DIA</Text>
        <Text style={styles.tipText}>
          Separe os materiais por tipo durante a coleta para facilitar a pesagem e aumentar o valor recebido!
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
    fontWeight: 'bold',
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
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 15,
  },
  totalContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  totalValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.primary,
  },
  totalLabel: {
    fontSize: 14,
    color: colors.text,
    opacity: 0.7,
  },
  materialsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  materialItem: {
    alignItems: 'center',
    width: '25%',
    marginBottom: 10,
  },
  materialIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  materialValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
  },
  materialLabel: {
    fontSize: 12,
    color: colors.text,
    opacity: 0.7,
  },
  tipsCard: {
    backgroundColor: '#FFF9C4',
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