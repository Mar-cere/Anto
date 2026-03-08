/**
 * Botón de cerrar sesión del perfil
 */
import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { styles } from './profileScreenStyles';
import { COLORS, TEXTS, ICON_SIZE } from './profileScreenConstants';

export function ProfileLogoutButton({ onLogout }) {
  return (
    <TouchableOpacity
      style={styles.logoutButton}
      onPress={onLogout}
      accessibilityLabel={TEXTS.LOGOUT_LABEL}
    >
      <MaterialCommunityIcons name="logout" size={ICON_SIZE} color={COLORS.ERROR} />
      <Text style={styles.logoutText}>{TEXTS.LOGOUT}</Text>
    </TouchableOpacity>
  );
}
