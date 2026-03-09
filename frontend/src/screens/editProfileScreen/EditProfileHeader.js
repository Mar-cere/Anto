/**
 * Header de EditProfileScreen: volver, título y botón guardar / editar
 */
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { styles } from './editProfileScreenStyles';
import { COLORS, TEXTS, ICON_SIZE } from './editProfileScreenConstants';

export function EditProfileHeader({
  navigation,
  editing,
  saving,
  onSave,
  onEdit,
}) {
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
      {editing ? (
        <TouchableOpacity
          style={[styles.headerButton, saving && styles.disabledButton]}
          onPress={onSave}
          disabled={saving}
          accessibilityLabel={TEXTS.SAVE_CHANGES}
        >
          <MaterialCommunityIcons
            name="content-save"
            size={ICON_SIZE}
            color={saving ? COLORS.ACCENT : COLORS.PRIMARY}
          />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={styles.headerButton}
          onPress={onEdit}
          accessibilityLabel={TEXTS.EDIT_PROFILE}
        >
          <MaterialCommunityIcons name="pencil" size={ICON_SIZE} color={COLORS.PRIMARY} />
        </TouchableOpacity>
      )}
    </View>
  );
}
