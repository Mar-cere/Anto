/**
 * Indicador de guardado exitoso (toast "¡Guardado!")
 */
import React from 'react';
import { View, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEditProfileScreenStyles } from './editProfileScreenStyles';
import { useEditProfileTexts, ICON_SIZE } from './editProfileScreenConstants';

export function EditProfileSaveSuccess() {
  const { styles, editProfileColors } = useEditProfileScreenStyles();
  const TEXTS = useEditProfileTexts();
  return (
    <View style={styles.saveSuccessIndicator}>
      <MaterialCommunityIcons name="check-circle" size={ICON_SIZE} color={editProfileColors.SUCCESS} />
      <Text style={styles.saveSuccessText}>{TEXTS.SAVED}</Text>
    </View>
  );
}
