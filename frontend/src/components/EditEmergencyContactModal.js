/**
 * Modal para editar un contacto de emergencia existente
 * 
 * Permite al usuario editar los datos de un contacto de emergencia:
 * nombre, email, teléfono y relación.
 * 
 * @author AntoApp Team
 */

import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import { useToast } from '../context/ToastContext';
import { api, ENDPOINTS } from '../config/api';
import { useTheme } from '../context/ThemeContext';
import { SPACING } from '../constants/ui';
import { getEmergencyContactId } from '../utils/emergencyContactUtils';
import { useSectionTranslations } from '../hooks/useTranslations';

// Constantes de validación
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_NAME_LENGTH = 2;
const MAX_NAME_LENGTH = 100;
const MAX_EMAIL_LENGTH = 255;
const MAX_PHONE_LENGTH = 20;
const MAX_RELATIONSHIP_LENGTH = 50;

// Constantes de textos
const DEFAULT_TEXTS = {
  TITLE: 'Editar Contacto de Emergencia',
  NAME_LABEL: 'Nombre completo',
  NAME_PLACEHOLDER: 'Ej: María García',
  EMAIL_LABEL: 'Correo electrónico (solo identificación)',
  EMAIL_PLACEHOLDER: 'Ej: maria@ejemplo.com',
  PHONE_LABEL: 'Teléfono con WhatsApp',
  PHONE_PLACEHOLDER: 'Ej: +54 11 1234-5678',
  RELATIONSHIP_LABEL: 'Relación (opcional)',
  RELATIONSHIP_PLACEHOLDER: 'Ej: Hermana, Amigo, etc.',
  SAVE: 'Guardar Cambios',
  CANCEL: 'Cancelar',
  REQUIRED_FIELD: 'Este campo es obligatorio',
  INVALID_EMAIL: 'Ingresa un correo válido',
  PHONE_REQUIRED: 'El teléfono es obligatorio para alertas por WhatsApp',
  INVALID_PHONE: 'Ingresa un teléfono válido',
  NAME_TOO_SHORT: `El nombre debe tener al menos ${MIN_NAME_LENGTH} caracteres`,
  NAME_TOO_LONG: `El nombre no puede exceder ${MAX_NAME_LENGTH} caracteres`,
  EMAIL_TOO_LONG: `El correo no puede exceder ${MAX_EMAIL_LENGTH} caracteres`,
  PHONE_TOO_LONG: `El teléfono no puede exceder ${MAX_PHONE_LENGTH} caracteres`,
  RELATIONSHIP_TOO_LONG: `La relación no puede exceder ${MAX_RELATIONSHIP_LENGTH} caracteres`,
  UPDATE_SUCCESS: 'Contacto actualizado exitosamente',
  UPDATE_ERROR: 'Error al actualizar contacto',
  ALERT_ERROR_TITLE: 'Error',
  CONTACT_NOT_EDITABLE: 'No se puede editar el contacto. Por favor, intenta nuevamente.',
  DUPLICATE_EMAIL: 'Ya existe un contacto con ese correo',
  ALERT_CHANNEL_NOTE: 'Canal de alerta: WhatsApp al número indicado',
};

const isDuplicateEmailError = (error) => {
  const normalizedMessage = String(
    error?.response?.data?.message ?? error?.message ?? '',
  ).toLowerCase();
  return (
    error?.response?.status === 409 ||
    normalizedMessage.includes('email') ||
    normalizedMessage.includes('duplicado') ||
    normalizedMessage.includes('duplicate')
  );
};

const EditEmergencyContactModal = ({ visible, onClose, onSave, contact }) => {
  const translated = useSectionTranslations('PROFILE');
  const TEXTS = useMemo(
    () => ({
      ...DEFAULT_TEXTS,
      TITLE: translated?.EMERGENCY_EDIT_TITLE || DEFAULT_TEXTS.TITLE,
      NAME_LABEL: translated?.EMERGENCY_NAME_LABEL || DEFAULT_TEXTS.NAME_LABEL,
      NAME_PLACEHOLDER:
        translated?.EMERGENCY_NAME_PLACEHOLDER || DEFAULT_TEXTS.NAME_PLACEHOLDER,
      EMAIL_LABEL:
        translated?.EMERGENCY_EMAIL_LABEL || DEFAULT_TEXTS.EMAIL_LABEL,
      EMAIL_PLACEHOLDER:
        translated?.EMERGENCY_EMAIL_PLACEHOLDER || DEFAULT_TEXTS.EMAIL_PLACEHOLDER,
      PHONE_LABEL:
        translated?.EMERGENCY_PHONE_LABEL || DEFAULT_TEXTS.PHONE_LABEL,
      PHONE_PLACEHOLDER:
        translated?.EMERGENCY_PHONE_PLACEHOLDER || DEFAULT_TEXTS.PHONE_PLACEHOLDER,
      RELATIONSHIP_LABEL:
        translated?.EMERGENCY_RELATION_LABEL || DEFAULT_TEXTS.RELATIONSHIP_LABEL,
      RELATIONSHIP_PLACEHOLDER:
        translated?.EMERGENCY_RELATION_PLACEHOLDER ||
        DEFAULT_TEXTS.RELATIONSHIP_PLACEHOLDER,
      SAVE: translated?.EMERGENCY_SAVE || DEFAULT_TEXTS.SAVE,
      CANCEL: translated?.CANCEL || DEFAULT_TEXTS.CANCEL,
      UPDATE_SUCCESS:
        translated?.EMERGENCY_UPDATE_SUCCESS || DEFAULT_TEXTS.UPDATE_SUCCESS,
      UPDATE_ERROR:
        translated?.EMERGENCY_UPDATE_ERROR || DEFAULT_TEXTS.UPDATE_ERROR,
      DUPLICATE_EMAIL:
        translated?.EMERGENCY_DUPLICATE_EMAIL || DEFAULT_TEXTS.DUPLICATE_EMAIL,
      ALERT_CHANNEL_NOTE:
        translated?.EMERGENCY_ALERT_CHANNEL_NOTE || DEFAULT_TEXTS.ALERT_CHANNEL_NOTE,
      CONTACT_NOT_EDITABLE:
        translated?.EMERGENCY_CONTACT_NOT_EDITABLE ||
        DEFAULT_TEXTS.CONTACT_NOT_EDITABLE,
      ALERT_ERROR_TITLE: translated?.ERROR || DEFAULT_TEXTS.ALERT_ERROR_TITLE,
      REQUIRED_FIELD:
        translated?.EMERGENCY_REQUIRED_FIELD || DEFAULT_TEXTS.REQUIRED_FIELD,
      INVALID_EMAIL:
        translated?.EMERGENCY_INVALID_EMAIL || DEFAULT_TEXTS.INVALID_EMAIL,
      PHONE_REQUIRED:
        translated?.EMERGENCY_PHONE_REQUIRED || DEFAULT_TEXTS.PHONE_REQUIRED,
      INVALID_PHONE:
        translated?.EMERGENCY_INVALID_PHONE || DEFAULT_TEXTS.INVALID_PHONE,
      NAME_TOO_SHORT:
        translated?.EMERGENCY_NAME_TOO_SHORT || DEFAULT_TEXTS.NAME_TOO_SHORT,
      NAME_TOO_LONG:
        translated?.EMERGENCY_NAME_TOO_LONG || DEFAULT_TEXTS.NAME_TOO_LONG,
      EMAIL_TOO_LONG:
        translated?.EMERGENCY_EMAIL_TOO_LONG || DEFAULT_TEXTS.EMAIL_TOO_LONG,
      PHONE_TOO_LONG:
        translated?.EMERGENCY_PHONE_TOO_LONG || DEFAULT_TEXTS.PHONE_TOO_LONG,
      RELATIONSHIP_TOO_LONG:
        translated?.EMERGENCY_RELATIONSHIP_TOO_LONG ||
        DEFAULT_TEXTS.RELATIONSHIP_TOO_LONG,
    }),
    [translated],
  );
  const { showToast } = useToast();
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
        },
        modalOverlay: {
          flex: 1,
          backgroundColor: colors.backdropStrong ?? 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'flex-end',
        },
        modalContent: {
          backgroundColor: colors.modalSurface ?? colors.background,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          maxHeight: '92%',
          paddingBottom: Platform.OS === 'ios' ? 20 : 10,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
        },
        header: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: SPACING.SCREEN_EDGE_INSET,
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
          padding: SPACING.SCREEN_EDGE_INSET,
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
          backgroundColor: colors.chromeInput ?? colors.surface,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: colors.border,
          paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
          paddingVertical: 12,
        },
        inputError: {
          borderColor: colors.error,
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
          color: colors.error,
          marginTop: 4,
          marginLeft: 4,
        },
        helperText: {
          fontSize: 12,
          color: colors.textSecondary,
          marginTop: 4,
          marginLeft: 4,
        },
        footer: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          padding: SPACING.SCREEN_EDGE_INSET,
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
          backgroundColor: colors.accentLineSoft ?? colors.surface,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
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
          color: colors.textOnPrimary,
        },
      }),
    [colors],
  );
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    relationship: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const contactId = getEmergencyContactId(contact);

  // Cargar datos del contacto cuando se abre el modal
  useEffect(() => {
    if (!visible || !contactId) return;
    setFormData({
      name: contact.name || '',
      email: contact.email || '',
      phone: contact.phone || '',
      relationship: contact.relationship || '',
    });
    setErrors({});
    setIsSubmitting(false);
  }, [visible, contactId, contact]);

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

    // Validar teléfono (obligatorio para alertas por WhatsApp)
    if (!formData.phone.trim()) {
      newErrors.phone = TEXTS.PHONE_REQUIRED;
    } else if (formData.phone.length > MAX_PHONE_LENGTH) {
      newErrors.phone = TEXTS.PHONE_TOO_LONG;
    } else {
      const digits = formData.phone.replace(/\D/g, '');
      if (digits.length < 8) {
        newErrors.phone = TEXTS.INVALID_PHONE;
      }
    }

    // Validar relación (opcional)
    if (formData.relationship && formData.relationship.length > MAX_RELATIONSHIP_LENGTH) {
      newErrors.relationship = TEXTS.RELATIONSHIP_TOO_LONG;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, TEXTS]);

  // Guardar cambios
  const handleSave = useCallback(async () => {
    if (!contact || !contactId) {
      Alert.alert(TEXTS.ALERT_ERROR_TITLE, TEXTS.CONTACT_NOT_EDITABLE);
      onClose?.();
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await api.put(ENDPOINTS.EMERGENCY_CONTACT_BY_ID(contactId), {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim() || null,
        relationship: formData.relationship.trim() || null,
      });

      showToast({ message: TEXTS.UPDATE_SUCCESS, type: 'success' });
      onSave?.();
      onClose?.();
    } catch (error) {
      console.error('Error actualizando contacto:', error);
      const isDuplicate = isDuplicateEmailError(error);
      Alert.alert(
        TEXTS.ALERT_ERROR_TITLE,
        isDuplicate ? TEXTS.DUPLICATE_EMAIL : TEXTS.UPDATE_ERROR,
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [
    TEXTS,
    formData,
    validateForm,
    contact,
    contactId,
    onSave,
    onClose,
    showToast,
  ]);

  // No renderizar el modal si no hay contacto o si no está visible
  if (!visible || !contact || !contactId) {
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
                <Text style={styles.label}>{TEXTS.PHONE_LABEL} *</Text>
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
                {!errors.phone && formData.phone.trim() ? (
                  <Text style={styles.helperText}>{TEXTS.ALERT_CHANNEL_NOTE}</Text>
                ) : null}
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
                  <ActivityIndicator size="small" color={colors.textOnPrimary} />
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

export default EditEmergencyContactModal;

