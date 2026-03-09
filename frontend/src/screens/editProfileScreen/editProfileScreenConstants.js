/**
 * Constantes para EditProfileScreen y subcomponentes
 */
import { colors } from '../../styles/globalStyles';

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
  SAVED: '¡Guardado!',
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

export const COLORS = {
  BACKGROUND: colors.background,
  PRIMARY: colors.primary,
  WHITE: colors.white,
  ACCENT: '#A3B8E8',
  ERROR: '#FF6B6B',
  SUCCESS: '#4CAF50',
  HEADER_BACKGROUND: 'rgba(3, 10, 36, 0.8)',
  HEADER_BORDER: 'rgba(26, 221, 219, 0.1)',
  HEADER_BUTTON_BACKGROUND: 'rgba(29, 43, 95, 0.5)',
  CARD_BACKGROUND: 'rgba(29, 43, 95, 0.8)',
  CARD_BORDER: 'rgba(26, 221, 219, 0.1)',
  INPUT_BACKGROUND: '#1D2B5F',
  INPUT_DISABLED_BACKGROUND: 'rgba(29, 43, 95, 0.5)',
  SAVE_SUCCESS_BACKGROUND: 'rgba(76, 175, 80, 0.15)',
  SAVE_SUCCESS_SHADOW: '#4CAF50',
};

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
