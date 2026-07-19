/**
 * Modal para agregar contactos de emergencia
 * 
 * Permite al usuario agregar hasta 2 contactos de emergencia que recibirán
 * alertas cuando se detecten situaciones de riesgo.
 * 
 * @author AntoApp Team
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { SPACING } from '../constants/ui';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useMemo, useState } from 'react';
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
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
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
  TITLE: 'Contactos de Emergencia',
  SUBTITLE: 'Agrega hasta 2 contactos que recibirán alertas por WhatsApp si detectamos situaciones de riesgo',
  SUBTITLE_FIRST_TIME: '¡Bienvenido! Para tu seguridad, te recomendamos agregar contactos de emergencia con teléfono para alertas por WhatsApp',
  NAME_LABEL: 'Nombre completo',
  NAME_PLACEHOLDER: 'Ej: María García',
  EMAIL_LABEL: 'Correo electrónico (solo identificación)',
  EMAIL_PLACEHOLDER: 'Ej: maria@ejemplo.com',
  PHONE_LABEL: 'Teléfono con WhatsApp',
  PHONE_PLACEHOLDER: 'Ej: +54 11 1234-5678',
  RELATIONSHIP_LABEL: 'Relación (opcional)',
  RELATIONSHIP_PLACEHOLDER: 'Ej: Hermana, Amigo, etc.',
  ADD_CONTACT: 'Agregar Contacto',
  SAVE: 'Guardar',
  CANCEL: 'Cancelar',
  SKIP: 'Omitir por ahora',
  REQUIRED_FIELD: 'Este campo es obligatorio',
  INVALID_EMAIL: 'Ingresa un correo válido',
  NAME_TOO_SHORT: `El nombre debe tener al menos ${MIN_NAME_LENGTH} caracteres`,
  NAME_TOO_LONG: `El nombre no puede exceder ${MAX_NAME_LENGTH} caracteres`,
  EMAIL_TOO_LONG: `El correo no puede exceder ${MAX_EMAIL_LENGTH} caracteres`,
  INVALID_PHONE: 'Ingresa un teléfono válido',
  PHONE_REQUIRED: 'El teléfono es obligatorio para alertas por WhatsApp',
  PHONE_TOO_LONG: `El teléfono no puede exceder ${MAX_PHONE_LENGTH} caracteres`,
  RELATIONSHIP_TOO_LONG: `La relación no puede exceder ${MAX_RELATIONSHIP_LENGTH} caracteres`,
  ADD_SUCCESS: 'Contacto agregado exitosamente',
  ADD_ERROR: 'Error al agregar contacto',
  ALERT_SUCCESS_TITLE: 'Éxito',
  ALERT_ATTENTION_TITLE: 'Atención',
  ALERT_OK: 'OK',
  ALERT_CANCEL: 'Cancelar',
  MAX_CONTACTS_REACHED: 'Ya has alcanzado el límite de 2 contactos',
  DUPLICATE_EMAIL: 'Ya existe un contacto con ese correo',
  ALERT_CHANNEL_NOTE: 'Canal de alerta: WhatsApp al número indicado',
  REQUIRE_ONE_CONTACT: 'Debes agregar al menos un contacto de emergencia',
  CONTACTS_SAVED_SUMMARY: '{count} contacto(s) agregado(s) exitosamente',
  CONTACTS_SAVED_WHATSAPP_NOTE:
    'Las alertas se enviarán por WhatsApp a los números configurados.',
  SKIP_CONFIRM_MESSAGE:
    'Los contactos de emergencia son importantes para tu seguridad. ¿Estás seguro de que quieres omitir esta configuración?',
  CONTACT_LABEL: 'Contacto',
};

const classifyEmergencySaveError = (error) => {
  const normalizedMessage = String(
    error?.response?.data?.message ?? error?.message ?? '',
  ).toLowerCase();

  const isMaxContacts =
    normalizedMessage.includes('límite') ||
    normalizedMessage.includes('limite') ||
    normalizedMessage.includes('máximo') ||
    normalizedMessage.includes('maximo') ||
    normalizedMessage.includes('limit') ||
    normalizedMessage.includes('maximum');

  if (isMaxContacts) return 'max';

  const isDuplicate =
    error?.response?.status === 409 ||
    normalizedMessage.includes('email') ||
    normalizedMessage.includes('duplicado') ||
    normalizedMessage.includes('duplicate');

  if (isDuplicate) return 'duplicate';

  return 'generic';
};

const EmergencyContactsModal = ({ visible, onClose, onSave, existingContacts = [], isFirstTime = false }) => {
  const translated = useSectionTranslations('PROFILE');
  const TEXTS = useMemo(
    () => ({
      ...DEFAULT_TEXTS,
      TITLE: translated?.EMERGENCY_CONTACTS || DEFAULT_TEXTS.TITLE,
      SUBTITLE:
        translated?.EMERGENCY_MODAL_SUBTITLE || DEFAULT_TEXTS.SUBTITLE,
      SUBTITLE_FIRST_TIME:
        translated?.EMERGENCY_MODAL_SUBTITLE_FIRST_TIME ||
        DEFAULT_TEXTS.SUBTITLE_FIRST_TIME,
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
      ADD_CONTACT:
        translated?.EMERGENCY_ADD_CONTACT || DEFAULT_TEXTS.ADD_CONTACT,
      SAVE: translated?.EMERGENCY_SAVE || DEFAULT_TEXTS.SAVE,
      CANCEL: translated?.CANCEL || DEFAULT_TEXTS.CANCEL,
      SKIP: translated?.EMERGENCY_SKIP || DEFAULT_TEXTS.SKIP,
      ADD_ERROR:
        translated?.EMERGENCY_ADD_ERROR || DEFAULT_TEXTS.ADD_ERROR,
      MAX_CONTACTS_REACHED:
        translated?.EMERGENCY_MAX_CONTACTS || DEFAULT_TEXTS.MAX_CONTACTS_REACHED,
      DUPLICATE_EMAIL:
        translated?.EMERGENCY_DUPLICATE_EMAIL || DEFAULT_TEXTS.DUPLICATE_EMAIL,
      ALERT_CHANNEL_NOTE:
        translated?.EMERGENCY_ALERT_CHANNEL_NOTE || DEFAULT_TEXTS.ALERT_CHANNEL_NOTE,
      REQUIRE_ONE_CONTACT:
        translated?.EMERGENCY_REQUIRE_ONE_CONTACT || DEFAULT_TEXTS.REQUIRE_ONE_CONTACT,
      CONTACTS_SAVED_SUMMARY:
        translated?.EMERGENCY_CONTACTS_SAVED_SUMMARY ||
        DEFAULT_TEXTS.CONTACTS_SAVED_SUMMARY,
      CONTACTS_SAVED_WHATSAPP_NOTE:
        translated?.EMERGENCY_CONTACTS_SAVED_WHATSAPP_NOTE ||
        DEFAULT_TEXTS.CONTACTS_SAVED_WHATSAPP_NOTE,
      SKIP_CONFIRM_MESSAGE:
        translated?.EMERGENCY_SKIP_CONFIRM_MESSAGE ||
        DEFAULT_TEXTS.SKIP_CONFIRM_MESSAGE,
      ALERT_SUCCESS_TITLE: translated?.SUCCESS || DEFAULT_TEXTS.ALERT_SUCCESS_TITLE,
      ALERT_ATTENTION_TITLE:
        translated?.EMERGENCY_ATTENTION_TITLE || DEFAULT_TEXTS.ALERT_ATTENTION_TITLE,
      ALERT_OK: translated?.COMMON_OK || DEFAULT_TEXTS.ALERT_OK,
      ALERT_CANCEL: translated?.CANCEL || DEFAULT_TEXTS.ALERT_CANCEL,
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
      CONTACT_LABEL:
        translated?.EMERGENCY_CONTACT_LABEL || DEFAULT_TEXTS.CONTACT_LABEL,
    }),
    [translated],
  );
  const { showToast } = useToast();
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        modalContainer: {
          flex: 1,
        },
        modalOverlay: {
          flex: 1,
          backgroundColor: colors.backdropStrong ?? 'rgba(0, 0, 0, 0.7)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: SPACING.SCREEN_EDGE_INSET,
        },
        modalContent: {
          backgroundColor: colors.modalSurface ?? colors.background,
          borderRadius: 20,
          width: '100%',
          maxWidth: 500,
          maxHeight: '92%',
          borderWidth: 1,
          borderColor: colors.border ?? 'rgba(36, 35, 79, 0.10)',
        },
        modalHeader: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          padding: SPACING.CARD_INNER_INSET,
          borderBottomWidth: 1,
          borderBottomColor: colors.border ?? 'rgba(36, 35, 79, 0.06)',
        },
        headerContent: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          flex: 1,
          marginRight: 10,
        },
        headerText: {
          marginLeft: 12,
          flex: 1,
        },
        modalTitle: {
          fontSize: 22,
          fontWeight: 'bold',
          color: colors.text,
          marginBottom: 4,
        },
        modalSubtitle: {
          fontSize: 14,
          color: colors.textSecondary,
          lineHeight: 20,
        },
        closeButton: {
          padding: SPACING.xs,
        },
        scrollView: {
          maxHeight: 400,
          padding: SPACING.CARD_INNER_INSET,
        },
        contactForm: {
          marginBottom: 24,
          paddingBottom: SPACING.HERO_INSET,
          borderBottomWidth: 1,
          borderBottomColor: colors.border ?? 'rgba(36, 35, 79, 0.06)',
        },
        contactHeader: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        },
        contactNumber: {
          fontSize: 16,
          fontWeight: '600',
          color: colors.primary,
        },
        removeButton: {
          padding: SPACING.xs,
        },
        inputGroup: {
          marginBottom: 16,
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
          backgroundColor: colors.chromeInput ?? 'rgba(36, 35, 79, 0.06)',
          borderRadius: 12,
          borderWidth: 1,
          borderColor: colors.border ?? 'rgba(36, 35, 79, 0.10)',
          paddingHorizontal: SPACING.INPUT_INSET,
          minHeight: 50,
        },
        inputError: {
          borderColor: colors.error,
          borderWidth: 2,
        },
        inputIcon: {
          marginRight: 12,
        },
        input: {
          flex: 1,
          color: colors.text,
          fontSize: 16,
          paddingVertical: SPACING.CHIP_INSET,
        },
        errorText: {
          color: colors.error,
          fontSize: 12,
          marginTop: 4,
          marginLeft: 4,
        },
        helperText: {
          color: colors.textSecondary,
          fontSize: 12,
          marginTop: 4,
          marginLeft: 4,
        },
        addButton: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          padding: SPACING.CHIP_INSET,
          borderRadius: 12,
          borderWidth: 2,
          borderColor: colors.primary,
          borderStyle: 'dashed',
          marginTop: 8,
        },
        addButtonText: {
          color: colors.primary,
          fontSize: 16,
          fontWeight: '600',
          marginLeft: 8,
        },
        modalActions: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          padding: SPACING.CARD_INNER_INSET,
          borderTopWidth: 1,
          borderTopColor: colors.border ?? 'rgba(36, 35, 79, 0.06)',
          gap: SPACING.CHIP_INSET,
        },
        actionButton: {
          flex: 1,
          paddingVertical: SPACING.CHIP_INSET,
          borderRadius: 12,
          alignItems: 'center',
          justifyContent: 'center',
        },
        skipButton: {
          backgroundColor: colors.accentLineSoft ?? 'rgba(36, 35, 79, 0.06)',
          borderWidth: 1,
          borderColor: colors.accentLine ?? 'rgba(30, 131, 211, 0.18)',
        },
        skipButtonText: {
          color: colors.textSecondary,
          fontSize: 16,
          fontWeight: '600',
        },
        saveButton: {
          backgroundColor: colors.primary,
        },
        saveButtonText: {
          color: colors.textOnPrimary,
          fontSize: 16,
          fontWeight: 'bold',
        },
      }),
    [colors],
  );

  const [contacts, setContacts] = useState([
    { name: '', email: '', phone: '', relationship: '' }
  ]);
  const [errors, setErrors] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validar un contacto individual
  const validateContact = useCallback((contact, index) => {
    const contactErrors = {};
    
    // Validar nombre
    if (!contact.name.trim()) {
      contactErrors.name = TEXTS.REQUIRED_FIELD;
    } else if (contact.name.trim().length < MIN_NAME_LENGTH) {
      contactErrors.name = TEXTS.NAME_TOO_SHORT;
    } else if (contact.name.length > MAX_NAME_LENGTH) {
      contactErrors.name = TEXTS.NAME_TOO_LONG;
    }
    
    // Validar email
    if (!contact.email.trim()) {
      contactErrors.email = TEXTS.REQUIRED_FIELD;
    } else if (!EMAIL_REGEX.test(contact.email.trim().toLowerCase())) {
      contactErrors.email = TEXTS.INVALID_EMAIL;
    } else if (contact.email.length > MAX_EMAIL_LENGTH) {
      contactErrors.email = TEXTS.EMAIL_TOO_LONG;
    }
    
    // Validar teléfono (opcional)
    if (!contact.phone?.trim()) {
      contactErrors.phone = TEXTS.PHONE_REQUIRED;
    } else if (contact.phone.length > MAX_PHONE_LENGTH) {
      contactErrors.phone = TEXTS.PHONE_TOO_LONG;
    } else {
      const digits = contact.phone.replace(/\D/g, '');
      if (digits.length < 8) {
        contactErrors.phone = TEXTS.INVALID_PHONE;
      }
    }
    
    // Validar relación (opcional)
    if (contact.relationship && contact.relationship.length > MAX_RELATIONSHIP_LENGTH) {
      contactErrors.relationship = TEXTS.RELATIONSHIP_TOO_LONG;
    }
    
    return contactErrors;
  }, [TEXTS]);

  // Validar todos los contactos
  const validateAllContacts = useCallback(() => {
    const allErrors = contacts.map((contact, index) => validateContact(contact, index));
    setErrors(allErrors);
    
    // Verificar si hay errores
    const hasErrors = allErrors.some(err => Object.keys(err).length > 0);
    
    // Verificar emails duplicados
    const emails = contacts.map(c => c.email.trim().toLowerCase()).filter(e => e);
    const duplicateEmails = emails.filter((email, index) => emails.indexOf(email) !== index);
    
    if (duplicateEmails.length > 0) {
      showToast({
        message: TEXTS.DUPLICATE_EMAIL,
        type: 'warning',
      });
      return false;
    }
    
    // Verificar límite de contactos
    const totalContacts = existingContacts.length + contacts.filter(c => c.name.trim() && c.email.trim() && c.phone.trim()).length;
    if (totalContacts > 2) {
      showToast({
        message: TEXTS.MAX_CONTACTS_REACHED,
        type: 'warning',
      });
      return false;
    }
    
    return !hasErrors;
  }, [TEXTS, contacts, existingContacts, validateContact, showToast]);

  // Manejar cambio en un campo
  const handleFieldChange = useCallback((contactIndex, field, value) => {
    setContacts(prev => {
      const updated = [...prev];
      updated[contactIndex] = { ...updated[contactIndex], [field]: value };
      return updated;
    });
    
    // Limpiar error del campo cuando el usuario empieza a escribir
    if (errors[contactIndex]?.[field]) {
      setErrors(prev => {
        const updated = [...prev];
        updated[contactIndex] = { ...updated[contactIndex], [field]: '' };
        return updated;
      });
    }
  }, [errors]);

  // Agregar otro contacto
  const handleAddContact = useCallback(() => {
    const totalContacts = existingContacts.length + contacts.filter(c => c.name.trim() && c.email.trim()).length;
    if (totalContacts >= 2) {
      showToast({
        message: TEXTS.MAX_CONTACTS_REACHED,
        type: 'warning',
      });
      return;
    }
    
    setContacts(prev => [...prev, { name: '', email: '', phone: '', relationship: '' }]);
    setErrors(prev => [...prev, {}]);
  }, [TEXTS, contacts, existingContacts, showToast]);

  // Eliminar un contacto del formulario
  const handleRemoveContact = useCallback((index) => {
    setContacts(prev => prev.filter((_, i) => i !== index));
    setErrors(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Guardar contactos
  const handleSave = useCallback(async () => {
    if (!validateAllContacts()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Filtrar contactos vacíos y guardar solo los que tienen datos
      const contactsToSave = contacts.filter(c => c.name.trim() && c.email.trim() && c.phone.trim());
      
      if (contactsToSave.length === 0) {
        showToast({
          message: TEXTS.REQUIRE_ONE_CONTACT,
          type: 'warning',
        });
        setIsSubmitting(false);
        return;
      }

      // Guardar cada contacto
      const savePromises = contactsToSave.map((contact) => {
        return api.post(ENDPOINTS.EMERGENCY_CONTACTS, {
          name: contact.name.trim(),
          email: contact.email.trim().toLowerCase(),
          phone: contact.phone.trim() || null,
          relationship: contact.relationship.trim() || null,
        });
      });

      await Promise.all(savePromises);
      
      let message = TEXTS.CONTACTS_SAVED_SUMMARY.replace('{count}', String(contactsToSave.length));
      message += `\n\n${TEXTS.CONTACTS_SAVED_WHATSAPP_NOTE}`;
      
      Alert.alert(TEXTS.ALERT_SUCCESS_TITLE, message, [
        { text: TEXTS.ALERT_OK, onPress: () => {
          onSave?.();
          onClose();
        }}
      ]);
    } catch (error) {
      console.error('Error guardando contactos:', error);
      const errorType = classifyEmergencySaveError(error);
      if (errorType === 'max') {
        showToast({
          message: TEXTS.MAX_CONTACTS_REACHED,
          type: 'error',
        });
      } else if (errorType === 'duplicate') {
        showToast({
          message: TEXTS.DUPLICATE_EMAIL,
          type: 'error',
        });
      } else {
        showToast({
          message: TEXTS.ADD_ERROR,
          type: 'error',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [TEXTS, contacts, validateAllContacts, onSave, onClose, showToast]);

  // Omitir (cerrar sin guardar)
  const handleSkip = useCallback(async () => {
    Alert.alert(
      TEXTS.ALERT_ATTENTION_TITLE,
      TEXTS.SKIP_CONFIRM_MESSAGE,
      [
        { text: TEXTS.ALERT_CANCEL, style: 'cancel' },
        { 
          text: TEXTS.SKIP, 
          style: 'destructive',
          onPress: async () => {
            // Guardar en AsyncStorage que el usuario omitió
            try {
              await AsyncStorage.setItem('emergencyContactsSkipped', 'true');
            } catch (error) {
              console.error('Error guardando estado de omisión:', error);
            }
            
            setContacts([{ name: '', email: '', phone: '', relationship: '' }]);
            setErrors([]);
            onClose();
          }
        }
      ]
    );
  }, [TEXTS, onClose]);

  // Renderizar formulario de un contacto
  const renderContactForm = (contact, index) => {
    const contactErrors = errors[index] || {};
    const canRemove = contacts.length > 1;
    
    return (
      <View key={index} style={styles.contactForm}>
        {contacts.length > 1 && (
          <View style={styles.contactHeader}>
            <Text style={styles.contactNumber}>
              {TEXTS.CONTACT_LABEL} {index + 1}
            </Text>
            {canRemove && (
              <TouchableOpacity
                onPress={() => handleRemoveContact(index)}
                style={styles.removeButton}
              >
                <Ionicons name="trash-outline" size={20} color={colors.error} />
              </TouchableOpacity>
            )}
          </View>
        )}
        
        {/* Nombre */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>{TEXTS.NAME_LABEL} *</Text>
          <View style={[styles.inputContainer, contactErrors.name && styles.inputError]}>
            <Ionicons name="person-outline" size={20} color={colors.primary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder={TEXTS.NAME_PLACEHOLDER}
              placeholderTextColor={colors.accent}
              value={contact.name}
              onChangeText={(text) => handleFieldChange(index, 'name', text)}
              maxLength={MAX_NAME_LENGTH}
            />
          </View>
          {contactErrors.name ? <Text style={styles.errorText}>{contactErrors.name}</Text> : null}
        </View>

        {/* Email */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>{TEXTS.EMAIL_LABEL} *</Text>
          <View style={[styles.inputContainer, contactErrors.email && styles.inputError]}>
            <Ionicons name="mail-outline" size={20} color={colors.primary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder={TEXTS.EMAIL_PLACEHOLDER}
              placeholderTextColor={colors.textSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
              value={contact.email}
              onChangeText={(text) => handleFieldChange(index, 'email', text)}
              maxLength={MAX_EMAIL_LENGTH}
            />
          </View>
          {contactErrors.email ? <Text style={styles.errorText}>{contactErrors.email}</Text> : null}
        </View>

        {/* Teléfono */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>{TEXTS.PHONE_LABEL} *</Text>
          <View style={[styles.inputContainer, contactErrors.phone && styles.inputError]}>
            <Ionicons name="call-outline" size={20} color={colors.primary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder={TEXTS.PHONE_PLACEHOLDER}
              placeholderTextColor={colors.textSecondary}
              keyboardType="phone-pad"
              value={contact.phone}
              onChangeText={(text) => handleFieldChange(index, 'phone', text)}
              maxLength={MAX_PHONE_LENGTH}
            />
          </View>
          {contactErrors.phone ? <Text style={styles.errorText}>{contactErrors.phone}</Text> : null}
          {!contactErrors.phone && contact.phone.trim() ? (
            <Text style={styles.helperText}>{TEXTS.ALERT_CHANNEL_NOTE}</Text>
          ) : null}
        </View>

        {/* Relación */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>{TEXTS.RELATIONSHIP_LABEL}</Text>
          <View style={[styles.inputContainer, contactErrors.relationship && styles.inputError]}>
            <Ionicons name="people-outline" size={20} color={colors.primary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder={TEXTS.RELATIONSHIP_PLACEHOLDER}
              placeholderTextColor={colors.textSecondary}
              value={contact.relationship}
              onChangeText={(text) => handleFieldChange(index, 'relationship', text)}
              maxLength={MAX_RELATIONSHIP_LENGTH}
            />
          </View>
          {contactErrors.relationship ? <Text style={styles.errorText}>{contactErrors.relationship}</Text> : null}
        </View>

      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleSkip}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalContainer}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <View style={styles.headerContent}>
                <Ionicons name="alert-circle" size={32} color={colors.primary} />
                <View style={styles.headerText}>
                  <Text style={styles.modalTitle}>{TEXTS.TITLE}</Text>
                  <Text style={styles.modalSubtitle}>
                    {isFirstTime ? TEXTS.SUBTITLE_FIRST_TIME : TEXTS.SUBTITLE}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={handleSkip}
                style={styles.closeButton}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={24} color={colors.accent} />
              </TouchableOpacity>
            </View>

            {/* Formulario */}
            <ScrollView 
              style={styles.scrollView}
              showsVerticalScrollIndicator={true}
              keyboardShouldPersistTaps="handled"
            >
              {contacts.map((contact, index) => renderContactForm(contact, index))}
              
              {/* Botón para agregar otro contacto */}
              {existingContacts.length + contacts.filter(c => c.name.trim() && c.email.trim() && c.phone.trim()).length < 2 && (
                <TouchableOpacity
                  onPress={handleAddContact}
                  style={styles.addButton}
                  activeOpacity={0.7}
                >
                  <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
                  <Text style={styles.addButtonText}>{TEXTS.ADD_CONTACT}</Text>
                </TouchableOpacity>
              )}
            </ScrollView>

            {/* Botones de acción */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={handleSkip}
                style={[styles.actionButton, styles.skipButton]}
                disabled={isSubmitting}
              >
                <Text style={styles.skipButtonText}>{TEXTS.SKIP}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSave}
                style={[styles.actionButton, styles.saveButton]}
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

export default EmergencyContactsModal;

