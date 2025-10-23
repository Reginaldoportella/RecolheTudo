import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../styles/colors';

const MaterialButton = ({ materialId, label, iconName, onPress }) => {
  const getMaterialColor = (type) => {
    switch (type) {
      case 'papel':
        return colors.paper;
      case 'plastico':
        return colors.plastic;
      case 'metal':
        return colors.metal;
      case 'vidro':
        return colors.glass;
      default:
        return colors.other;
    }
  };

  return (
    <TouchableOpacity style={[styles.button, { backgroundColor: getMaterialColor(materialId) }]} onPress={onPress}>
      <Ionicons name={iconName} size={48} color={colors.textLight} style={styles.icon} />
      <Text style={styles.text}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 150,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 15,
    margin: 10,
    elevation: 4,
  },
  icon: {
    marginBottom: 10,
  },
  text: {
    color: colors.textLight,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default MaterialButton;
