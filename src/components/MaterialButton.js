import React from 'react';
import { TouchableOpacity, Text, Image, StyleSheet, View } from 'react-native';
import colors from '../styles/colors';

const MaterialButton = ({ material, icon, onPress }) => {
  // Mapeia material para cor correspondente
  const getMaterialColor = (type) => {
    switch (type) {
      case 'papel': return colors.paper;
      case 'plastico': return colors.plastic;
      case 'metal': return colors.metal;
      case 'vidro': return colors.glass;
      default: return colors.other;
    }
  };

  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor: getMaterialColor(material) }]}
      onPress={onPress}
    >
      <Image source={icon} style={styles.icon} />
      <Text style={styles.text}>{material.toUpperCase()}</Text>
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
    width: 80,
    height: 80,
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