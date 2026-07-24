/**
 * Mensajes de API de usuario (es/en).
 */
import { normalizeApiLanguage } from './apiLanguage.js';

const COPY = {
  es: {
    invalidData: 'Datos inválidos',
    notAuthenticated: 'Usuario no autenticado',
    userNotFound: 'Usuario no encontrado',
    accountDeactivated: 'Tu cuenta ha sido desactivada',
    serviceUnavailable:
      'Servicio temporalmente no disponible. La base de datos no está conectada.',
    getUserError: 'Error al obtener datos del usuario',
    statsError: 'Error al obtener estadísticas',
    emailInUse: 'El email ya está en uso',
    usernameInUse: 'El nombre de usuario ya está en uso',
    profileUpdated: 'Perfil actualizado correctamente',
    profileUpdateError: 'Error al actualizar el perfil',
    wrongCurrentPassword: 'La contraseña actual es incorrecta',
    passwordSameAsCurrent: 'La nueva contraseña debe ser diferente a la actual',
    passwordUpdated: 'Contraseña actualizada correctamente',
    changePasswordError: 'Error al cambiar la contraseña',
    accountDeleted: 'Cuenta eliminada correctamente',
    deleteAccountError: 'Error al eliminar la cuenta',
    onboardingSaved: 'Preferencias de onboarding guardadas',
    onboardingSaveError: 'Error al guardar preferencias',
    termsAccepted: 'Términos y política de privacidad aceptados correctamente',
    termsAcceptError: 'Error al actualizar aceptación de términos',
    subscriptionError: 'Error al obtener información de suscripción',
    emergencyContactsError: 'Error al obtener contactos de emergencia',
    emergencyContactsLimit: 'Ya has alcanzado el límite de 2 contactos de emergencia',
    emergencyContactEmailExists: 'Ya existe un contacto de emergencia con ese email',
    invalidEmailFormat: 'El formato del email no es válido',
    emergencyContactAdded: 'Contacto de emergencia agregado exitosamente',
    emergencyContactAddError: 'Error al agregar contacto de emergencia',
    invalidContactId: 'ID de contacto inválido',
    userOrContactNotFound: 'Usuario o contacto no encontrado',
    emergencyContactNotFound: 'Contacto de emergencia no encontrado',
    emergencyContactEmailDuplicate:
      'Ya existe otro contacto de emergencia con ese email',
    emergencyContactUpdated: 'Contacto de emergencia actualizado exitosamente',
    emergencyContactUpdateError: 'Error al actualizar contacto de emergencia',
    emergencyContactDeleted: 'Contacto de emergencia eliminado exitosamente',
    emergencyContactDeleteError: 'Error al eliminar contacto de emergencia',
    emergencyContactToggleError: 'Error al cambiar estado del contacto',
    emailTestDisabled:
      'Las alertas por email fueron deshabilitadas. Usa /api/users/me/emergency-contacts/:contactId/test-whatsapp para pruebas.',
    testAlertFailed: 'No se pudo enviar la alerta de prueba',
    testAlertError: 'Error al enviar alerta de prueba',
    contactNoPhone: 'El contacto no tiene número de teléfono configurado',
    whatsappNotConfigured: 'WhatsApp no está configurado',
    whatsappTestSent: 'Mensaje de prueba de WhatsApp enviado exitosamente',
    whatsappQueueHelp:
      'El mensaje está en cola. Si no llega, puede ser porque:',
    whatsappSendFailed: 'No se pudo enviar el mensaje de WhatsApp',
    whatsappTestError: 'Error al enviar mensaje de prueba de WhatsApp',
    invalidMessageSid: 'SID de mensaje inválido. Debe empezar con "SM"',
    messageStatusSuccess: 'Estado del mensaje obtenido exitosamente',
    messageStatusFailed: 'No se pudo obtener el estado del mensaje',
    messageStatusError: 'Error al obtener estado del mensaje',
    alertsHistoryError: 'Error al obtener historial de alertas',
    alertsStatsError: 'Error al obtener estadísticas de alertas',
    alertsPatternsError: 'Error al detectar patrones de alertas',
    rateLimitUpdateProfile:
      'Demasiadas actualizaciones de perfil. Por favor, intente más tarde.',
    rateLimitDeleteUser:
      'Demasiados intentos de eliminación de cuenta. Por favor, intente más tarde.',
    rateLimitDeleteContact:
      'Demasiadas eliminaciones de contactos. Por favor, intente más tarde.',
    rateLimitPatchContact:
      'Demasiadas modificaciones de contactos. Por favor, intente más tarde.',
    rateLimitSoftLandingDismiss:
      'Demasiados intentos de ocultar el acompañamiento. Por favor, intente más tarde.',
    joiNameMin: 'El nombre debe tener al menos 2 caracteres',
    joiNameMax: 'El nombre debe tener máximo 50 caracteres',
    joiUsernameMin: 'El nombre de usuario debe tener al menos 3 caracteres',
    joiUsernameMax: 'El nombre de usuario debe tener máximo 20 caracteres',
    joiUsernamePattern:
      'El nombre de usuario solo puede contener letras minúsculas, números y guiones bajos',
    joiEmailInvalid: 'Por favor ingresa un email válido',
    joiCurrentPasswordRequired: 'La contraseña actual es requerida',
    joiNewPasswordMin8: 'La nueva contraseña debe tener al menos 8 caracteres',
    joiNewPasswordRequired: 'La nueva contraseña es requerida',
    joiTermsRequired: 'Debes aceptar los términos y condiciones',
    joiPrivacyRequired: 'Debes aceptar la política de privacidad',
    joiContactNameRequired: 'El nombre del contacto es requerido',
    joiContactNameMin: 'El nombre debe tener al menos 2 caracteres',
    joiContactNameMax: 'El nombre no puede exceder 100 caracteres',
    joiContactEmailRequired: 'El email del contacto es requerido',
    joiContactPhoneRequired:
      'El teléfono del contacto es requerido para alertas por WhatsApp',
    joiContactPhoneMin: 'El teléfono debe tener al menos 8 caracteres',
    joiContactPhoneMax: 'El teléfono no puede exceder 20 caracteres',
    contactToggleEnabled: 'Contacto habilitado exitosamente',
    contactToggleDisabled: 'Contacto deshabilitado exitosamente',
    whatsappQueueReasons: [
      'El número no está verificado en Twilio Sandbox',
      'El número no tiene WhatsApp activo',
      'Estás en modo sandbox y solo puedes enviar a números verificados',
    ],
    whatsappQueueAction:
      'Verifica el número en Twilio Console > Messaging > Try it out > WhatsApp Sandbox',
    unknownError: 'Error desconocido',
    noServiceResponse: 'No se recibió respuesta del servicio',
    internalServerError: 'Error interno del servidor',
    emergencyTestAlertBody:
      '[PRUEBA] Este es un mensaje de prueba del sistema de alertas de emergencia. No hay ninguna situación real de riesgo.',
    whatsappStatusMeanings: {
      queued: 'Mensaje en cola esperando ser enviado',
      sending: 'Mensaje siendo enviado',
      sent: 'Mensaje enviado exitosamente',
      delivered: 'Mensaje entregado al destinatario',
      read: 'Mensaje leído por el destinatario',
      failed: 'Mensaje falló al enviar',
      undelivered: 'Mensaje no entregado',
    },
    whatsappCommonIssues: {
      queued:
        'Si el mensaje permanece en "queued", verifica que el número esté verificado en Twilio Sandbox',
      failed:
        'Si el mensaje falló, revisa errorCode y errorMessage para más detalles',
    },
    testAlertSent: (successful, total, whatsapp) => {
      let msg = `Alerta de prueba enviada a ${successful}/${total} contacto(s)`;
      if (whatsapp > 0) {
        msg += ` (${whatsapp} WhatsApp(s))`;
      }
      return msg;
    },
  },
  en: {
    invalidData: 'Invalid data',
    notAuthenticated: 'User not authenticated',
    userNotFound: 'User not found',
    accountDeactivated: 'Your account has been deactivated',
    serviceUnavailable:
      'Service temporarily unavailable. The database is not connected.',
    getUserError: 'Could not load user data',
    statsError: 'Could not load statistics',
    emailInUse: 'Email is already in use',
    usernameInUse: 'Username is already in use',
    profileUpdated: 'Profile updated successfully',
    profileUpdateError: 'Could not update profile',
    wrongCurrentPassword: 'Current password is incorrect',
    passwordSameAsCurrent: 'New password must be different from the current one',
    passwordUpdated: 'Password updated successfully',
    changePasswordError: 'Could not change password',
    accountDeleted: 'Account deleted successfully',
    deleteAccountError: 'Could not delete account',
    onboardingSaved: 'Onboarding preferences saved',
    onboardingSaveError: 'Could not save preferences',
    termsAccepted: 'Terms and privacy policy accepted successfully',
    termsAcceptError: 'Could not update terms acceptance',
    subscriptionError: 'Could not load subscription information',
    emergencyContactsError: 'Could not load emergency contacts',
    emergencyContactsLimit: 'You have reached the limit of 2 emergency contacts',
    emergencyContactEmailExists: 'An emergency contact with this email already exists',
    invalidEmailFormat: 'Email format is not valid',
    emergencyContactAdded: 'Emergency contact added successfully',
    emergencyContactAddError: 'Could not add emergency contact',
    invalidContactId: 'Invalid contact ID',
    userOrContactNotFound: 'User or contact not found',
    emergencyContactNotFound: 'Emergency contact not found',
    emergencyContactEmailDuplicate:
      'Another emergency contact already uses this email',
    emergencyContactUpdated: 'Emergency contact updated successfully',
    emergencyContactUpdateError: 'Could not update emergency contact',
    emergencyContactDeleted: 'Emergency contact deleted successfully',
    emergencyContactDeleteError: 'Could not delete emergency contact',
    emergencyContactToggleError: 'Could not change contact status',
    emailTestDisabled:
      'Email alerts have been disabled. Use /api/users/me/emergency-contacts/:contactId/test-whatsapp for tests.',
    testAlertFailed: 'Could not send test alert',
    testAlertError: 'Could not send test alert',
    contactNoPhone: 'Contact has no phone number configured',
    whatsappNotConfigured: 'WhatsApp is not configured',
    whatsappTestSent: 'WhatsApp test message sent successfully',
    whatsappQueueHelp:
      'The message is queued. If it does not arrive, it may be because:',
    whatsappSendFailed: 'Could not send WhatsApp message',
    whatsappTestError: 'Could not send WhatsApp test message',
    invalidMessageSid: 'Invalid message SID. It must start with "SM"',
    messageStatusSuccess: 'Message status retrieved successfully',
    messageStatusFailed: 'Could not retrieve message status',
    messageStatusError: 'Could not retrieve message status',
    alertsHistoryError: 'Could not load alert history',
    alertsStatsError: 'Could not load alert statistics',
    alertsPatternsError: 'Could not detect alert patterns',
    rateLimitUpdateProfile: 'Too many profile updates. Please try again later.',
    rateLimitDeleteUser: 'Too many account deletion attempts. Please try again later.',
    rateLimitDeleteContact: 'Too many contact deletions. Please try again later.',
    rateLimitPatchContact: 'Too many contact updates. Please try again later.',
    rateLimitSoftLandingDismiss:
      'Too many dismiss attempts for this suggestion. Please try again later.',
    joiNameMin: 'Name must be at least 2 characters',
    joiNameMax: 'Name must be at most 50 characters',
    joiUsernameMin: 'Username must be at least 3 characters',
    joiUsernameMax: 'Username must be at most 20 characters',
    joiUsernamePattern:
      'Username may only contain lowercase letters, numbers, and underscores',
    joiEmailInvalid: 'Please enter a valid email address',
    joiCurrentPasswordRequired: 'Current password is required',
    joiNewPasswordMin8: 'New password must be at least 8 characters',
    joiNewPasswordRequired: 'New password is required',
    joiTermsRequired: 'You must accept the terms and conditions',
    joiPrivacyRequired: 'You must accept the privacy policy',
    joiContactNameRequired: 'Contact name is required',
    joiContactNameMin: 'Name must be at least 2 characters',
    joiContactNameMax: 'Name must be at most 100 characters',
    joiContactEmailRequired: 'Contact email is required',
    joiContactPhoneRequired:
      'Contact phone is required for WhatsApp alerts',
    joiContactPhoneMin: 'Phone must be at least 8 characters',
    joiContactPhoneMax: 'Phone must be at most 20 characters',
    contactToggleEnabled: 'Contact enabled successfully',
    contactToggleDisabled: 'Contact disabled successfully',
    whatsappQueueReasons: [
      'The number is not verified in Twilio Sandbox',
      'The number does not have active WhatsApp',
      'You are in sandbox mode and can only send to verified numbers',
    ],
    whatsappQueueAction:
      'Verify the number in Twilio Console > Messaging > Try it out > WhatsApp Sandbox',
    unknownError: 'Unknown error',
    noServiceResponse: 'No response received from the service',
    internalServerError: 'Internal server error',
    emergencyTestAlertBody:
      '[TEST] This is a test message from the emergency alert system. There is no real risk situation.',
    whatsappStatusMeanings: {
      queued: 'Message queued waiting to be sent',
      sending: 'Message being sent',
      sent: 'Message sent successfully',
      delivered: 'Message delivered to recipient',
      read: 'Message read by recipient',
      failed: 'Message failed to send',
      undelivered: 'Message not delivered',
    },
    whatsappCommonIssues: {
      queued:
        'If the message stays "queued", verify the number in Twilio Sandbox',
      failed:
        'If the message failed, check errorCode and errorMessage for details',
    },
    testAlertSent: (successful, total, whatsapp) => {
      let msg = `Test alert sent to ${successful}/${total} contact(s)`;
      if (whatsapp > 0) {
        msg += ` (${whatsapp} WhatsApp)`;
      }
      return msg;
    },
  },
};

export function userApiCopy(language) {
  return COPY[normalizeApiLanguage(language)];
}
