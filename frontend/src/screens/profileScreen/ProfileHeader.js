/**
 * Header de ProfileScreen: título, volver y ajustes
 */
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { styles } from './profileScreenStyles';
import { COLORS, TEXTS, ICON_SIZE } from './profileScreenConstants';

export function ProfileHeader({ navigation }) {
  return (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.headerButton}
        onPress={() => navigation.goBack()}
        accessibilityLabel={TEXTS.BACK}
      >
        <MaterialCommunityIcons name="arrow-left" size={ICON_SIZE} color={COLORS.WHITE} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{TEXTS.PROFILE_TITLE}</Text>
      <TouchableOpacity
        style={styles.headerButton}
        onPress={() => navigation.navigate('Ajustes')}
        accessibilityLabel={TEXTS.SETTINGS}
      >
        <MaterialCommunityIcons name="cog" size={ICON_SIZE} color={COLORS.WHITE} />
      </TouchableOpacity>
    </View>
  );
}
