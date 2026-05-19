/**
 * Constantes para EditProfileScreen y subcomponentes
 */
import { useMemo } from 'react';
import { useSectionTranslations } from '../../hooks/useTranslations';
import { lightColors } from '../../styles/themePalettes';

export const TEXTS = {
  LOADING: 'Cargando perfil...',
  ERROR: 'Error',
  ERROR_DEFAULT: 'Ha ocurrido un error',
  ERROR_NETWORK: 'Error de conexión. Por favor, verifica tu internet.',
  ERROR_TIMEOUT: 'La solicitud ha tardado demasiado. Intenta de nuevo.',
  RETRY: 'Reintentar',
  OK: 'OK',
  VALIDATION_ERRORS: 'Errores de validación',
  SUCCESS: 'Éxito',
  PROFILE_UPDATED: 'Perfil actualizado correctamente',
  UNSAVED_CHANGES: 'Cambios sin guardar',
  UNSAVED_CHANGES_MESSAGE: '¿Deseas descartar los cambios?',
  CANCEL: 'Cancelar',
  DISCARD: 'Descartar',
  PROFILE_TITLE: 'Mi Perfil',
  BACK: 'Volver',
  SAVE_CHANGES: 'Guardar cambios',
  EDIT_PROFILE: 'Editar perfil',
  PERSONAL_INFO: 'Información Personal',
  NAME: 'Nombre',
  USERNAME: 'Nombre de Usuario',
  USERNAME_HELPER: 'El nombre de usuario no se puede cambiar',
  EMAIL: 'Correo Electrónico',
  ADD_NAME: 'Agregar nombre',
  EMAIL_PLACEHOLDER: 'Correo electrónico',
  SAVED: 'Guardado',
  PERMISSION_REQUIRED: 'Permiso requerido',
  SESSION_EXPIRED: 'Sesión Expirada',
  SESSION_EXPIRED_MESSAGE: 'Por favor, inicia sesión nuevamente',
  NO_SESSION: 'No se encontró la sesión del usuario',
  ERROR_LOAD_USER: 'Error al obtener datos del usuario',
  ERROR_UPDATE_PROFILE: 'Error al actualizar el perfil',
  ERROR_UPLOAD_IMAGE: 'No se pudo subir la imagen. Intenta nuevamente.',
  NAME_MIN_LENGTH: 'El nombre debe tener al menos 3 caracteres',
  EMAIL_REQUIRED: 'El correo es requerido',
  EMAIL_INVALID: 'Correo inválido',
};

export function useEditProfileTexts() {
  const translated = useSectionTranslations('PROFILE');
  return useMemo(
    () => ({
      ...TEXTS,
      LOADING: translated?.EDIT_PROFILE_LOADING || TEXTS.LOADING,
      ERROR: translated?.EDIT_PROFILE_ERROR || TEXTS.ERROR,
      ERROR_DEFAULT:
        translated?.EDIT_PROFILE_ERROR_DEFAULT || TEXTS.ERROR_DEFAULT,
      ERROR_NETWORK:
        translated?.EDIT_PROFILE_ERROR_NETWORK || TEXTS.ERROR_NETWORK,
      ERROR_TIMEOUT:
        translated?.EDIT_PROFILE_ERROR_TIMEOUT || TEXTS.ERROR_TIMEOUT,
      RETRY: translated?.EDIT_PROFILE_RETRY || TEXTS.RETRY,
      OK: translated?.EDIT_PROFILE_OK || TEXTS.OK,
      VALIDATION_ERRORS:
        translated?.EDIT_PROFILE_VALIDATION_ERRORS || TEXTS.VALIDATION_ERRORS,
      SUCCESS: translated?.EDIT_PROFILE_SUCCESS || TEXTS.SUCCESS,
      PROFILE_UPDATED:
        translated?.EDIT_PROFILE_PROFILE_UPDATED || TEXTS.PROFILE_UPDATED,
      UNSAVED_CHANGES:
        translated?.EDIT_PROFILE_UNSAVED_CHANGES || TEXTS.UNSAVED_CHANGES,
      UNSAVED_CHANGES_MESSAGE:
        translated?.EDIT_PROFILE_UNSAVED_CHANGES_MESSAGE ||
        TEXTS.UNSAVED_CHANGES_MESSAGE,
      CANCEL: translated?.EDIT_PROFILE_CANCEL || TEXTS.CANCEL,
      DISCARD: translated?.EDIT_PROFILE_DISCARD || TEXTS.DISCARD,
      PROFILE_TITLE:
        translated?.EDIT_PROFILE_PROFILE_TITLE || TEXTS.PROFILE_TITLE,
      BACK: translated?.EDIT_PROFILE_BACK || TEXTS.BACK,
      SAVE_CHANGES:
        translated?.EDIT_PROFILE_SAVE_CHANGES || TEXTS.SAVE_CHANGES,
      EDIT_PROFILE:
        translated?.EDIT_PROFILE_EDIT_LABEL || TEXTS.EDIT_PROFILE,
      PERSONAL_INFO:
        translated?.EDIT_PROFILE_PERSONAL_INFO || TEXTS.PERSONAL_INFO,
      NAME: translated?.EDIT_PROFILE_NAME || TEXTS.NAME,
      USERNAME: translated?.EDIT_PROFILE_USERNAME || TEXTS.USERNAME,
      USERNAME_HELPER:
        translated?.EDIT_PROFILE_USERNAME_HELPER || TEXTS.USERNAME_HELPER,
      EMAIL: translated?.EDIT_PROFILE_EMAIL || TEXTS.EMAIL,
      ADD_NAME: translated?.EDIT_PROFILE_ADD_NAME || TEXTS.ADD_NAME,
      EMAIL_PLACEHOLDER:
        translated?.EDIT_PROFILE_EMAIL_PLACEHOLDER || TEXTS.EMAIL_PLACEHOLDER,
      SAVED: translated?.EDIT_PROFILE_SAVED || TEXTS.SAVED,
      PERMISSION_REQUIRED:
        translated?.EDIT_PROFILE_PERMISSION_REQUIRED || TEXTS.PERMISSION_REQUIRED,
      SESSION_EXPIRED:
        translated?.EDIT_PROFILE_SESSION_EXPIRED || TEXTS.SESSION_EXPIRED,
      SESSION_EXPIRED_MESSAGE:
        translated?.EDIT_PROFILE_SESSION_EXPIRED_MESSAGE ||
        TEXTS.SESSION_EXPIRED_MESSAGE,
      NO_SESSION: translated?.EDIT_PROFILE_NO_SESSION || TEXTS.NO_SESSION,
      ERROR_LOAD_USER:
        translated?.EDIT_PROFILE_ERROR_LOAD_USER || TEXTS.ERROR_LOAD_USER,
      ERROR_UPDATE_PROFILE:
        translated?.EDIT_PROFILE_ERROR_UPDATE_PROFILE ||
        TEXTS.ERROR_UPDATE_PROFILE,
      ERROR_UPLOAD_IMAGE:
        translated?.EDIT_PROFILE_ERROR_UPLOAD_IMAGE || TEXTS.ERROR_UPLOAD_IMAGE,
      NAME_MIN_LENGTH:
        translated?.EDIT_PROFILE_NAME_MIN_LENGTH || TEXTS.NAME_MIN_LENGTH,
      EMAIL_REQUIRED:
        translated?.EDIT_PROFILE_EMAIL_REQUIRED || TEXTS.EMAIL_REQUIRED,
      EMAIL_INVALID:
        translated?.EDIT_PROFILE_EMAIL_INVALID || TEXTS.EMAIL_INVALID,
    }),
    [translated],
  );
}

export const MIN_NAME_LENGTH = 3;
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const BACKGROUND_OPACITY = 0.1;
export const FADE_ANIMATION_DURATION = 500;
export const FADE_ANIMATION_TO_VALUE = 1;
export const SAVE_SUCCESS_DELAY = 2000;
export const CONTENT_PADDING_BOTTOM = 48;
export const HEADER_PADDING_HORIZONTAL = 16;
export const HEADER_PADDING_VERTICAL = 12;
export const HEADER_BUTTON_SIZE = 40;
export const HEADER_BUTTON_BORDER_RADIUS = 20;
export const HEADER_BORDER_WIDTH = 1;
export const CONTENT_PADDING = 16;
export const SECTION_MARGIN_BOTTOM = 24;
export const SECTION_TITLE_MARGIN_BOTTOM = 16;
export const INPUT_CONTAINER_MARGIN_BOTTOM = 16;
export const LABEL_MARGIN_BOTTOM = 8;
export const INPUT_BORDER_RADIUS = 12;
export const INPUT_PADDING_HORIZONTAL = 16;
export const INPUT_PADDING_VERTICAL = 12;
export const INPUT_BORDER_WIDTH = 1;
export const ERROR_TEXT_MARGIN_TOP = 4;
export const HELPER_TEXT_MARGIN_TOP = 4;
export const PROFILE_HEADER_PADDING_VERTICAL = 24;
export const PROFILE_NAME_MARGIN_BOTTOM = 4;
export const PROFILE_USERNAME_MARGIN_BOTTOM = 16;
export const INPUT_DISABLED_OPACITY = 0.7;
export const DISABLED_BUTTON_OPACITY = 0.5;
export const INPUT_WRAPPER_PADDING_HORIZONTAL = 12;
export const LOADING_TEXT_MARGIN_TOP = 10;
export const SAVE_SUCCESS_PADDING_HORIZONTAL = 18;
export const SAVE_SUCCESS_PADDING_VERTICAL = 10;
export const SAVE_SUCCESS_BORDER_RADIUS = 20;
export const SAVE_SUCCESS_TOP = '45%';
export const SAVE_SUCCESS_Z_INDEX = 10;
export const SAVE_SUCCESS_SHADOW_OFFSET_Y = 2;
export const SAVE_SUCCESS_SHADOW_OPACITY = 0.3;
export const SAVE_SUCCESS_SHADOW_RADIUS = 6;
export const SAVE_SUCCESS_ELEVATION = 6;
export const SAVE_SUCCESS_TEXT_MARGIN_LEFT = 8;
export const ICON_SIZE = 24;
export const EMAIL_ICON_SIZE = 20;
export const EMAIL_ICON_MARGIN_RIGHT = 8;

export function createEditProfileColors(colors) {
  return {
    BACKGROUND: colors.background,
    PRIMARY: colors.primary,
    WHITE: colors.white,
    ACCENT: colors.primaryBright ?? colors.primary,
    ERROR: colors.error,
    SUCCESS: colors.success,
    HEADER_BACKGROUND: colors.chromeHeader ?? colors.background,
    HEADER_BORDER: colors.chromeHeaderBorder ?? colors.border,
    HEADER_BUTTON_BACKGROUND: colors.chromeIconButton ?? colors.glassFill ?? colors.accentLineSoft,
    CARD_BACKGROUND: colors.chromeCard ?? colors.cardBackground ?? colors.surface,
    CARD_BORDER: colors.chromeCardBorder ?? colors.border,
    INPUT_BACKGROUND: colors.chromeInput ?? colors.surface,
    INPUT_DISABLED_BACKGROUND: colors.chromeInputDisabled ?? colors.chromeInput ?? colors.surface,
    SAVE_SUCCESS_BACKGROUND: colors.successSoft,
    SAVE_SUCCESS_SHADOW: colors.success,
  };
}

/** Compatibilidad legacy (tests/archivos no migrados) */
export const COLORS = createEditProfileColors(lightColors);

export const DEFAULT_FORM_DATA = {
  name: '',
  username: '',
  email: '',
};

export const STORAGE_KEYS = {
  USER_TOKEN: 'userToken',
  USER_DATA: 'userData',
};

export const BACKGROUND_IMAGE = require('../../images/back.png');
