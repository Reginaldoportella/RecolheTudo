import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import globalStyles from '../styles/globalStyles';
import colors from '../styles/colors';
import MaterialButton from '../components/MaterialButton';

const CollectionScreen = ({ navigation }) => {
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [estimatedWeight, setEstimatedWeight] = useState(null);
  
  const materials = [
    { id: 'papel', name: 'PAPEL', icon: require('../../assets/icons/papel.png') },
    { id: 'plastico', name: 'PLÁSTICO', icon: require('../../assets/icons/plastico.png') },
    { id: 'metal', name: 'METAL', icon: require('../../assets/icons/metal.png') },
    { id: 'vidro', name: 'VIDRO', icon: require('../../assets/icons/vidro.png') },
    { id: 'outros', name: 'OUTROS', icon: require('../../assets/icons/outros.png') },
  ];

  const weights = [
    { id: 'small', value: 1, label: 'POUCO', image: '🧺', description: 'Até 1kg (uma sacola pequena)' },
    { id: 'medium', value: 5, label: 'MÉDIO', image: '🛍️', description: 'Até 5kg (sacola grande)' },
    { id: 'large', value: 15, label: 'MUITO', image: '📦', description: 'Até 15kg (caixa grande)' },
  ];

  const handleMaterialSelect = (material) => {
    setSelectedMaterial(material);
    setEstimatedWeight(null);
  };

  const handleWeightSelect = (weight) => {
    setEstimatedWeight(weight);
  };

  const handleConfirmCollection = async () => {
    try {
      // Solicitar permissão de localização
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permissão necessária', 'Precisamos da sua localização para registrar a coleta.');
        return;
      }
      
      // Obter localização atual
      const location = await Location.getCurrentPositionAsync({});
      
      // Dados da coleta
      const collectionData = {
        material: selectedMaterial.id,
        weight: estimatedWeight.value,
        location: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        },
        timestamp: new Date().toISOString(),
      };
      
      // Aqui você salvaria os dados no armazenamento local
      console.log('Dados da coleta:', collectionData);
      
      // Mostrar confirmação
      Alert.alert(
        'Coleta Registrada!',
        `Material: ${selectedMaterial.name}\nPeso: ${estimatedWeight.value}kg\nRegistrado com sucesso!`,
        [
          { 
            text: 'OK', 
            onPress: () => {
              // Resetar seleções
              setSelectedMaterial(null);
              setEstimatedWeight(null);
              // Voltar para a tela inicial
              navigation.navigate('Início');
            } 
          },
        ]
      );
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível registrar a coleta. Tente novamente.');
      console.error(error);
    }
  };

  // Render da seleção de material
  if (!selectedMaterial) {
    return (
      <ScrollView style={globalStyles.container}>
        <Text style={globalStyles.heading}>QUE MATERIAL VOCÊ COLETOU?</Text>
        
        <View style={styles.materialsGrid}>
          {materials.map((material) => (
            <MaterialButton
              key={material.id}
              material={material.id}
              icon={material.icon}
              onPress={() => handleMaterialSelect(material)}
            />
          ))}
        </View>
      </ScrollView>
    );
  }
  
  // Render da seleção de peso
  if (selectedMaterial && !estimatedWeight) {
    return (
      <ScrollView style={globalStyles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setSelectedMaterial(null)}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={globalStyles.heading}>QUANTO VOCÊ COLETOU?</Text>
        </View>
        
        <Text style={styles.selectedMaterial}>
          Material: {selectedMaterial.name}
        </Text>
        
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
  
  // Render da confirmação
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
        style={[globalStyles.largeButton, { backgroundColor: colors.success }]}
        onPress={handleConfirmCollection}
      >
        <Text style={globalStyles.largeButtonText}>CONFIRMAR COLETA</Text>
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
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  selectedMaterial: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: colors.primary,
  },
  weightsContainer: {
    alignItems: 'center',
  },
  weightOption: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    marginVertical: 10,
    width: '100%',
    alignItems: 'center',
    elevation: 3,
  },
  weightEmoji: {
    fontSize: 40,
    marginBottom: 10,
  },
  weightLabel: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  weightValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
    marginVertical: 5,
  },
  weightDescription: {
    fontSize: 14,
    color: colors.text,
    opacity: 0.7,
    textAlign: 'center',
  },
  confirmationCard: {
    marginVertical: 20,
  },
  confirmationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  confirmationLabel: {
    fontSize: 16,
    color: colors.text,
    opacity: 0.7,
  },
  confirmationValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
});

export default CollectionScreen;