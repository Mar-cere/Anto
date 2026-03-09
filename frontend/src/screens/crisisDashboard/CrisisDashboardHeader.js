/**
 * Cabecera del Dashboard de Crisis (atrás + título)
 */
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { styles } from './crisisDashboardStyles';
import { TEXTS } from './crisisDashboardConstants';

export function CrisisDashboardHeader({ onBack }) {
  return (
    <View style={styles.header}>
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
      </TouchableOpacity>
      <Text style={styles.title}>{TEXTS.TITLE}</Text>
      <View style={styles.placeholder} />
    </View>
  );
}
