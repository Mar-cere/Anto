/**
 * Modal para agregar contactos de emergencia
 * 
 * Permite al usuario agregar hasta 2 contactos de emergencia que recibirán
 * alertas cuando se detecten situaciones de riesgo.
 * 
 * @author AntoApp Team
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useState } from 'react';
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
import { getApiErrorMessage } from '../utils/apiErrorHandler';
import { colors } from '../styles/globalStyles';
import { useToast } from '../context/ToastContext';

// Constantes de validación
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_NAME_LENGTH = 2;
const MAX_NAME_LENGTH = 100;
const MAX_EMAIL_LENGTH = 255;
const MAX_PHONE_LENGTH = 20;
const MAX_RELATIONSHIP_LENGTH = 50;

// Constantes de textos
const TEXTS = {
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
  MAX_CONTACTS_REACHED: 'Ya has alcanzado el límite de 2 contactos',
  DUPLICATE_EMAIL: 'Ya existe un contacto con ese correo',
  ALERT_CHANNEL_NOTE: 'Canal de alerta: WhatsApp al número indicado'
};

const EmergencyContactsModal = ({ visible, onClose, onSave, existingContacts = [], isFirstTime = false }) => {
  const { showToast } = useToast();
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
  }, []);

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
  }, [contacts, existingContacts, validateContact, showToast]);

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
  }, [contacts, existingContacts, showToast]);

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
          message: 'Debes agregar al menos un contacto de emergencia',
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
      
      let message = `${contactsToSave.length} contacto(s) agregado(s) exitosamente`;
      message += '\n\nLas alertas se enviarán por WhatsApp a los números configurados.';
      
      Alert.alert('Éxito', message, [
        { text: 'OK', onPress: () => {
          onSave?.();
          onClose();
        }}
      ]);
    } catch (error) {
      console.error('Error guardando contactos:', error);
      const errorMessage = getApiErrorMessage(error) || TEXTS.ADD_ERROR;
      const msg = (errorMessage || '').toLowerCase();
      if (msg.includes('límite') || msg.includes('máximo')) {
        showToast({
          message: TEXTS.MAX_CONTACTS_REACHED,
          type: 'error',
        });
      } else if (msg.includes('email') || msg.includes('duplicado')) {
        showToast({
          message: TEXTS.DUPLICATE_EMAIL,
          type: 'error',
        });
      } else {
        showToast({
          message: errorMessage,
          type: 'error',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [contacts, validateAllContacts, onSave, onClose, showToast]);

  // Omitir (cerrar sin guardar)
  const handleSkip = useCallback(async () => {
    Alert.alert(
      'Atención',
      'Los contactos de emergencia son importantes para tu seguridad. ¿Estás seguro de que quieres omitir esta configuración?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Omitir', 
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
  }, [onClose]);

  // Renderizar formulario de un contacto
  const renderContactForm = useCallback((contact, index) => {
    const contactErrors = errors[index] || {};
    const canRemove = contacts.length > 1;
    
    return (
      <View key={index} style={styles.contactForm}>
        {contacts.length > 1 && (
          <View style={styles.contactHeader}>
            <Text style={styles.contactNumber}>Contacto {index + 1}</Text>
            {canRemove && (
              <TouchableOpacity
                onPress={() => handleRemoveContact(index)}
                style={styles.removeButton}
              >
                <Ionicons name="trash-outline" size={20} color={colors.error || '#FF6B6B'} />
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
              placeholderTextColor={colors.accent}
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
              placeholderTextColor={colors.accent}
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
              placeholderTextColor={colors.accent}
              value={contact.relationship}
              onChangeText={(text) => handleFieldChange(index, 'relationship', text)}
              maxLength={MAX_RELATIONSHIP_LENGTH}
            />
          </View>
          {contactErrors.relationship ? <Text style={styles.errorText}>{contactErrors.relationship}</Text> : null}
        </View>

      </View>
    );
  }, [contacts, errors, handleFieldChange, handleRemoveContact]);

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
  modalContainer: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.background,
    borderRadius: 20,
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: 'rgba(163, 184, 232, 0.2)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(163, 184, 232, 0.1)',
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
    color: colors.white,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: colors.accent,
    lineHeight: 20,
  },
  closeButton: {
    padding: 4,
  },
  scrollView: {
    maxHeight: 400,
    padding: 20,
  },
  contactForm: {
    marginBottom: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(163, 184, 232, 0.1)',
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
    padding: 4,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(163, 184, 232, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(163, 184, 232, 0.2)',
    paddingHorizontal: 12,
    minHeight: 50,
  },
  inputError: {
    borderColor: colors.error || '#FF6B6B',
    borderWidth: 2,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: colors.white,
    fontSize: 16,
    paddingVertical: 12,
  },
  errorText: {
    color: colors.error || '#FF6B6B',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  helperText: {
    color: colors.accent,
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
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
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(163, 184, 232, 0.1)',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipButton: {
    backgroundColor: 'rgba(163, 184, 232, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(163, 184, 232, 0.3)',
  },
  skipButtonText: {
    color: colors.accent,
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: colors.primary,
  },
  saveButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default EmergencyContactsModal;

