/**
 * Formulario de edición de perfil: nombre, username (solo lectura), email
 */
import React from 'react';
import { View, Text, TextInput } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { styles } from './editProfileScreenStyles';
import {
  COLORS,
  TEXTS,
  EMAIL_ICON_SIZE,
  EMAIL_ICON_MARGIN_RIGHT,
} from './editProfileScreenConstants';

export function EditProfileForm({
  formData,
  errors,
  editing,
  onFormChange,
}) {
  return (
    <>
      <View style={styles.profileHeader}>
        <Text style={styles.profileName}>{formData.name || ''}</Text>
        <Text style={styles.profileUsername}>@{formData.username}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{TEXTS.PERSONAL_INFO}</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>{TEXTS.NAME}</Text>
          <TextInput
            style={[styles.input, !editing && styles.inputDisabled]}
            value={formData.name}
            onChangeText={(text) => onFormChange('name', text)}
            editable={editing}
            placeholder={TEXTS.ADD_NAME}
            placeholderTextColor={COLORS.ACCENT}
          />
          {errors.name ? (
            <Text style={styles.errorText}>{errors.name}</Text>
          ) : null}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>{TEXTS.USERNAME}</Text>
          <TextInput
            style={[styles.input, { color: COLORS.ACCENT }]}
            value={formData.username}
            editable={false}
          />
          <Text style={styles.helperText}>{TEXTS.USERNAME_HELPER}</Text>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>{TEXTS.EMAIL}</Text>
          <View style={styles.inputWrapper}>
            <MaterialCommunityIcons
              name="email"
              size={EMAIL_ICON_SIZE}
              color={COLORS.ACCENT}
              style={{ marginRight: EMAIL_ICON_MARGIN_RIGHT }}
            />
            <TextInput
              style={[styles.input, errors.email && styles.inputError]}
              value={formData.email}
              onChangeText={(text) => onFormChange('email', text)}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={editing}
              placeholder={TEXTS.EMAIL_PLACEHOLDER}
              placeholderTextColor={COLORS.ACCENT}
            />
          </View>
          {errors.email ? (
            <Text style={styles.errorText}>{errors.email}</Text>
          ) : null}
        </View>
      </View>
    </>
  );
}
