/**
 * Header de EditProfileScreen: volver, título y botón guardar / editar
 */
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEditProfileScreenStyles } from './editProfileScreenStyles';
import { useEditProfileTexts, ICON_SIZE } from './editProfileScreenConstants';

export function EditProfileHeader({
  navigation,
  editing,
  saving,
  onSave,
  onEdit,
}) {
  const { styles, editProfileColors } = useEditProfileScreenStyles();
  const TEXTS = useEditProfileTexts();
  return (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.headerButton}
        onPress={() => navigation.goBack()}
        accessibilityLabel={TEXTS.BACK}
      >
        <MaterialCommunityIcons name="arrow-left" size={ICON_SIZE} color={editProfileColors.WHITE} />
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
            color={saving ? editProfileColors.ACCENT : editProfileColors.PRIMARY}
          />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={styles.headerButton}
          onPress={onEdit}
          accessibilityLabel={TEXTS.EDIT_PROFILE}
        >
          <MaterialCommunityIcons name="pencil" size={ICON_SIZE} color={editProfileColors.PRIMARY} />
        </TouchableOpacity>
      )}
    </View>
  );
}
