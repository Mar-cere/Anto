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
        accessibilityRole="button"
        accessibilityLabel={TEXTS.SUMMARY_NAV_LABEL}
      >
        <MaterialCommunityIcons name="chart-timeline-variant" size={ICON_SIZE} color={profileColors.PRIMARY} />
        <Text style={styles.optionText}>{TEXTS.SUMMARY_NAV}</Text>
        <MaterialCommunityIcons name="chevron-right" size={ICON_SIZE} color={profileColors.PRIMARY} />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.optionButton}
        onPress={() => navigation.navigate('WeeklyInsight', { period: 'week' })}
        accessibilityRole="button"
        accessibilityLabel={TEXTS.WEEKLY_INSIGHT_NAV_LABEL}
      >
        <MaterialCommunityIcons name="chart-bell-curve" size={ICON_SIZE} color={profileColors.PRIMARY} />
        <Text style={styles.optionText}>{TEXTS.WEEKLY_INSIGHT_NAV}</Text>
        <MaterialCommunityIcons name="chevron-right" size={ICON_SIZE} color={profileColors.PRIMARY} />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.optionButton}
        onPress={() => navigation.navigate('InterventionGraph')}
        accessibilityRole="button"
        accessibilityLabel={TEXTS.INTERVENTION_GRAPH_NAV_LABEL}
      >
        <MaterialCommunityIcons name="graph-outline" size={ICON_SIZE} color={profileColors.PRIMARY} />
        <Text style={styles.optionText}>{TEXTS.INTERVENTION_GRAPH_NAV}</Text>
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
