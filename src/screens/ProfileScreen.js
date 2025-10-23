import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import globalStyles from '../styles/globalStyles';
import colors from '../styles/colors';

const ProfileScreen = () => {
  return (
    <View style={globalStyles.container}>
      <View style={[globalStyles.card, styles.profileCard]}>
        <Image
          source={{ uri: 'https://avatars.githubusercontent.com/u/9919?s=200&v=4' }}
          style={styles.avatar}
        />
        <Text style={styles.name}>Catador Parceiro</Text>
        <Text style={styles.role}>Coletor de materiais recicláveis</Text>
      </View>

      <View style={globalStyles.card}>
        <Text style={globalStyles.heading}>Suas metas</Text>
        <Text style={styles.metaText}>• Registrar ao menos uma coleta por dia.</Text>
        <Text style={styles.metaText}>• Acompanhar o peso total coletado na semana.</Text>
        <Text style={styles.metaText}>• Manter os pontos de coleta sempre atualizados.</Text>
      </View>

      <View style={globalStyles.card}>
        <Text style={globalStyles.heading}>Como podemos ajudar?</Text>
        <Text style={styles.metaText}>
          Entre em contato com a equipe do RecolheTudo pelo e-mail suporte@recolhetudo.org.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  profileCard: {
    alignItems: 'center',
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    marginBottom: 12,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  role: {
    fontSize: 16,
    color: colors.text,
    marginTop: 4,
  },
  metaText: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 8,
  },
});

export default ProfileScreen;
