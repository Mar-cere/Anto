/**
 * Modal para editar un contacto de emergencia existente
 * 
 * Permite al usuario editar los datos de un contacto de emergencia:
 * nombre, email, teléfono y relación.
 * 
 * @author AntoApp Team
 */

import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { api, ENDPOINTS } from '../config/api';
import { colors } from '../styles/globalStyles';

// Constantes de validación
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_NAME_LENGTH = 2;
const MAX_NAME_LENGTH = 100;
const MAX_EMAIL_LENGTH = 255;
const MAX_PHONE_LENGTH = 20;
const MAX_RELATIONSHIP_LENGTH = 50;

// Constantes de textos
const TEXTS = {
  TITLE: 'Editar Contacto de Emergencia',
  NAME_LABEL: 'Nombre completo',
  NAME_PLACEHOLDER: 'Ej: María García',
  EMAIL_LABEL: 'Correo electrónico',
  EMAIL_PLACEHOLDER: 'Ej: maria@ejemplo.com',
  PHONE_LABEL: 'Teléfono (opcional)',
  PHONE_PLACEHOLDER: 'Ej: +54 11 1234-5678',
  RELATIONSHIP_LABEL: 'Relación (opcional)',
  RELATIONSHIP_PLACEHOLDER: 'Ej: Hermana, Amigo, etc.',
  SAVE: 'Guardar Cambios',
  CANCEL: 'Cancelar',
  REQUIRED_FIELD: 'Este campo es obligatorio',
  INVALID_EMAIL: 'Ingresa un correo válido',
  NAME_TOO_SHORT: `El nombre debe tener al menos ${MIN_NAME_LENGTH} caracteres`,
  NAME_TOO_LONG: `El nombre no puede exceder ${MAX_NAME_LENGTH} caracteres`,
  EMAIL_TOO_LONG: `El correo no puede exceder ${MAX_EMAIL_LENGTH} caracteres`,
  PHONE_TOO_LONG: `El teléfono no puede exceder ${MAX_PHONE_LENGTH} caracteres`,
  RELATIONSHIP_TOO_LONG: `La relación no puede exceder ${MAX_RELATIONSHIP_LENGTH} caracteres`,
  UPDATE_SUCCESS: 'Contacto actualizado exitosamente',
  UPDATE_ERROR: 'Error al actualizar contacto',
  DUPLICATE_EMAIL: 'Ya existe un contacto con ese correo',
};

const EditEmergencyContactModal = ({ visible, onClose, onSave, contact }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    relationship: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cargar datos del contacto cuando se abre el modal
  useEffect(() => {
    if (visible && contact) {
      setFormData({
        name: contact.name || '',
        email: contact.email || '',
        phone: contact.phone || '',
        relationship: contact.relationship || ''
      });
      setErrors({});
    }
  }, [visible, contact]);

  // Validar formulario
  const validateForm = useCallback(() => {
    const newErrors = {};

    // Validar nombre
    if (!formData.name.trim()) {
      newErrors.name = TEXTS.REQUIRED_FIELD;
    } else if (formData.name.trim().length < MIN_NAME_LENGTH) {
      newErrors.name = TEXTS.NAME_TOO_SHORT;
    } else if (formData.name.length > MAX_NAME_LENGTH) {
      newErrors.name = TEXTS.NAME_TOO_LONG;
    }

    // Validar email
    if (!formData.email.trim()) {
      newErrors.email = TEXTS.REQUIRED_FIELD;
    } else if (!EMAIL_REGEX.test(formData.email.trim().toLowerCase())) {
      newErrors.email = TEXTS.INVALID_EMAIL;
    } else if (formData.email.length > MAX_EMAIL_LENGTH) {
      newErrors.email = TEXTS.EMAIL_TOO_LONG;
    }

    // Validar teléfono (opcional)
    if (formData.phone && formData.phone.length > MAX_PHONE_LENGTH) {
      newErrors.phone = TEXTS.PHONE_TOO_LONG;
    }

    // Validar relación (opcional)
    if (formData.relationship && formData.relationship.length > MAX_RELATIONSHIP_LENGTH) {
      newErrors.relationship = TEXTS.RELATIONSHIP_TOO_LONG;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Guardar cambios
  const handleSave = useCallback(async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await api.put(ENDPOINTS.EMERGENCY_CONTACT_BY_ID(contact._id), {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim() || null,
        relationship: formData.relationship.trim() || null,
      });

      Alert.alert('Éxito', TEXTS.UPDATE_SUCCESS, [
        { text: 'OK', onPress: () => {
          onSave?.();
          onClose();
        }}
      ]);
    } catch (error) {
      console.error('Error actualizando contacto:', error);
      const errorMessage = error.message || TEXTS.UPDATE_ERROR;
      
      if (errorMessage.includes('email') || errorMessage.includes('duplicado')) {
        Alert.alert('Error', TEXTS.DUPLICATE_EMAIL);
      } else {
        Alert.alert('Error', errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validateForm, contact, onSave, onClose]);

  if (!contact) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>{TEXTS.TITLE}</Text>
              <TouchableOpacity
                onPress={onClose}
                style={styles.closeButton}
                disabled={isSubmitting}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
            >
              {/* Nombre */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{TEXTS.NAME_LABEL} *</Text>
                <View style={[styles.inputContainer, errors.name && styles.inputError]}>
                  <Ionicons name="person-outline" size={20} color={colors.primary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder={TEXTS.NAME_PLACEHOLDER}
                    placeholderTextColor={colors.textSecondary}
                    value={formData.name}
                    onChangeText={(text) => setFormData({ ...formData, name: text })}
                    editable={!isSubmitting}
                    maxLength={MAX_NAME_LENGTH}
                  />
                </View>
                {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
              </View>

              {/* Email */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{TEXTS.EMAIL_LABEL} *</Text>
                <View style={[styles.inputContainer, errors.email && styles.inputError]}>
                  <Ionicons name="mail-outline" size={20} color={colors.primary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder={TEXTS.EMAIL_PLACEHOLDER}
                    placeholderTextColor={colors.textSecondary}
                    value={formData.email}
                    onChangeText={(text) => setFormData({ ...formData, email: text })}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isSubmitting}
                    maxLength={MAX_EMAIL_LENGTH}
                  />
                </View>
                {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
              </View>

              {/* Teléfono */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{TEXTS.PHONE_LABEL}</Text>
                <View style={[styles.inputContainer, errors.phone && styles.inputError]}>
                  <Ionicons name="call-outline" size={20} color={colors.primary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder={TEXTS.PHONE_PLACEHOLDER}
                    placeholderTextColor={colors.textSecondary}
                    value={formData.phone}
                    onChangeText={(text) => setFormData({ ...formData, phone: text })}
                    keyboardType="phone-pad"
                    editable={!isSubmitting}
                    maxLength={MAX_PHONE_LENGTH}
                  />
                </View>
                {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
              </View>

              {/* Relación */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{TEXTS.RELATIONSHIP_LABEL}</Text>
                <View style={[styles.inputContainer, errors.relationship && styles.inputError]}>
                  <Ionicons name="people-outline" size={20} color={colors.primary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder={TEXTS.RELATIONSHIP_PLACEHOLDER}
                    placeholderTextColor={colors.textSecondary}
                    value={formData.relationship}
                    onChangeText={(text) => setFormData({ ...formData, relationship: text })}
                    editable={!isSubmitting}
                    maxLength={MAX_RELATIONSHIP_LENGTH}
                  />
                </View>
                {errors.relationship && <Text style={styles.errorText}>{errors.relationship}</Text>}
              </View>
            </ScrollView>

            {/* Footer con botones */}
            <View style={styles.footer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={onClose}
                disabled={isSubmitting}
              >
                <Text style={styles.cancelButtonText}>{TEXTS.CANCEL}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.saveButton, isSubmitting && styles.saveButtonDisabled]}
                onPress={handleSave}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Text style={styles.saveButtonText}>{TEXTS.SAVE}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  closeButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBackground || colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  inputError: {
    borderColor: colors.error || '#FF6B6B',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  errorText: {
    fontSize: 12,
    color: colors.error || '#FF6B6B',
    marginTop: 4,
    marginLeft: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: colors.surface || '#F5F5F5',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  saveButton: {
    backgroundColor: colors.primary,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
});

export default EditEmergencyContactModal;

