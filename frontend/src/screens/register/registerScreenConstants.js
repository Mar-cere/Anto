/**
 * Constantes de layout y UI para RegisterScreen
 */
import { colors } from '../../styles/globalStyles';
import { OPACITIES, SCALES, STATUS_BAR } from '../../constants/ui';

export const STORAGE_KEYS = {
  USER_TOKEN: 'userToken',
  REFRESH_TOKEN: 'refreshToken',
  USER_DATA: 'userData',
  SAVED_EMAIL: 'savedEmail',
};

export const IMAGE_OPACITY = OPACITIES.IMAGE_BACKGROUND;
export const HORIZONTAL_PADDING = 20;
export const VERTICAL_PADDING = 40;
export const TITLE_MARGIN_TOP = 60;
export const TITLE_MARGIN_BOTTOM = 10;
export const SUBTITLE_MARGIN_BOTTOM = 30;
export const LOADING_SCALE = SCALES.LOADING;
export const STATUS_BAR_STYLE = STATUS_BAR.STYLE;
export const STATUS_BAR_BACKGROUND = colors.background;
export const CHECKBOX_SIZE = 20;
export const CHECKBOX_BORDER_WIDTH = 2;
export const CHECKBOX_BORDER_RADIUS = 4;
export const CHECKBOX_MARGIN_RIGHT = 10;
export const CHECKBOX_ICON_SIZE = 16;
export const EYE_ICON_SIZE = 24;
export const BUTTON_ICON_SIZE = 22;
export const BUTTON_ICON_MARGIN = 8;
export const ACTIVE_OPACITY = OPACITIES.HOVER;
export const BUTTON_ACTIVE_OPACITY = 0.85;
export const SERVER_CHECK_TIMEOUT = 3;

export const URLS = {
  TERMS: 'https://www.antoapps.com/terminos',
  PRIVACY: 'https://www.antoapps.com/privacidad',
};
