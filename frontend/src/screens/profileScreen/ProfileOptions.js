/**
 * Opciones principales del perfil: resumen, editar perfil, ayuda
 */
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useProfileScreenStyles } from './profileScreenStyles';
import { ICON_SIZE, useProfileTexts } from './profileScreenConstants';

export function ProfileOptions({ navigation }) {
  const TEXTS = useProfileTexts();
  const { styles, profileColors } = useProfileScreenStyles();
  return (
    <View style={styles.optionsContainer}>
      <TouchableOpacity
        style={styles.optionButton}
        onPress={() => navigation.navigate('ActivitySummary')}
        accessibilityLabel={TEXTS.SUMMARY_NAV_LABEL}
      >
        <MaterialCommunityIcons name="chart-timeline-variant" size={ICON_SIZE} color={profileColors.PRIMARY} />
        <Text style={styles.optionText}>{TEXTS.SUMMARY_NAV}</Text>
        <MaterialCommunityIcons name="chevron-right" size={ICON_SIZE} color={profileColors.PRIMARY} />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.optionButton}
        onPress={() => navigation.navigate('EditProfile')}
        accessibilityLabel={TEXTS.EDIT_PROFILE_LABEL}
      >
        <MaterialCommunityIcons name="account-edit" size={ICON_SIZE} color={profileColors.PRIMARY} />
        <Text style={styles.optionText}>{TEXTS.EDIT_PROFILE}</Text>
        <MaterialCommunityIcons name="chevron-right" size={ICON_SIZE} color={profileColors.PRIMARY} />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.optionButton}
        onPress={() => navigation.navigate('FaQ')}
        accessibilityLabel={TEXTS.HELP_LABEL}
      >
        <MaterialCommunityIcons name="help-circle" size={ICON_SIZE} color={profileColors.PRIMARY} />
        <Text style={styles.optionText}>{TEXTS.HELP}</Text>
        <MaterialCommunityIcons name="chevron-right" size={ICON_SIZE} color={profileColors.PRIMARY} />
      </TouchableOpacity>
    </View>
  );
}
