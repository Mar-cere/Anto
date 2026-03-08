/**
 * Opciones principales del perfil: Editar perfil, Ayuda
 */
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { styles } from './profileScreenStyles';
import { COLORS, TEXTS, ICON_SIZE } from './profileScreenConstants';

export function ProfileOptions({ navigation }) {
  return (
    <View style={styles.optionsContainer}>
      <TouchableOpacity
        style={styles.optionButton}
        onPress={() => navigation.navigate('EditProfile')}
        accessibilityLabel={TEXTS.EDIT_PROFILE_LABEL}
      >
        <MaterialCommunityIcons name="account-edit" size={ICON_SIZE} color={COLORS.PRIMARY} />
        <Text style={styles.optionText}>{TEXTS.EDIT_PROFILE}</Text>
        <MaterialCommunityIcons name="chevron-right" size={ICON_SIZE} color={COLORS.ACCENT} />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.optionButton}
        onPress={() => navigation.navigate('FaQ')}
        accessibilityLabel={TEXTS.HELP_LABEL}
      >
        <MaterialCommunityIcons name="help-circle" size={ICON_SIZE} color={COLORS.PRIMARY} />
        <Text style={styles.optionText}>{TEXTS.HELP}</Text>
        <MaterialCommunityIcons name="chevron-right" size={ICON_SIZE} color={COLORS.ACCENT} />
      </TouchableOpacity>
    </View>
  );
}
