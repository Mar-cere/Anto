/**
 * Indicador de guardado exitoso (toast "¡Guardado!")
 */
import React from 'react';
import { View, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { styles } from './editProfileScreenStyles';
import { COLORS, TEXTS, ICON_SIZE } from './editProfileScreenConstants';

export function EditProfileSaveSuccess() {
  return (
    <View style={styles.saveSuccessIndicator}>
      <MaterialCommunityIcons name="check-circle" size={ICON_SIZE} color={COLORS.SUCCESS} />
      <Text style={styles.saveSuccessText}>{TEXTS.SAVED}</Text>
    </View>
  );
}
