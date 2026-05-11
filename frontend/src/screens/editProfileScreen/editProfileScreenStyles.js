/**
 * Estilos para EditProfileScreen (tema claro/oscuro vía useEditProfileScreenStyles).
 */
import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import {
  createEditProfileColors,
  BACKGROUND_OPACITY,
  HEADER_PADDING_HORIZONTAL,
  HEADER_PADDING_VERTICAL,
  HEADER_BORDER_WIDTH,
  HEADER_BUTTON_SIZE,
  HEADER_BUTTON_BORDER_RADIUS,
  CONTENT_PADDING,
  CONTENT_PADDING_BOTTOM,
  SECTION_MARGIN_BOTTOM,
  SECTION_TITLE_MARGIN_BOTTOM,
  INPUT_CONTAINER_MARGIN_BOTTOM,
  LABEL_MARGIN_BOTTOM,
  INPUT_BORDER_RADIUS,
  INPUT_PADDING_HORIZONTAL,
  INPUT_PADDING_VERTICAL,
  INPUT_BORDER_WIDTH,
  ERROR_TEXT_MARGIN_TOP,
  HELPER_TEXT_MARGIN_TOP,
  PROFILE_HEADER_PADDING_VERTICAL,
  PROFILE_NAME_MARGIN_BOTTOM,
  PROFILE_USERNAME_MARGIN_BOTTOM,
  INPUT_DISABLED_OPACITY,
  INPUT_WRAPPER_PADDING_HORIZONTAL,
  LOADING_TEXT_MARGIN_TOP,
  DISABLED_BUTTON_OPACITY,
  SAVE_SUCCESS_PADDING_HORIZONTAL,
  SAVE_SUCCESS_PADDING_VERTICAL,
  SAVE_SUCCESS_BORDER_RADIUS,
  SAVE_SUCCESS_TOP,
  SAVE_SUCCESS_Z_INDEX,
  SAVE_SUCCESS_SHADOW_OFFSET_Y,
  SAVE_SUCCESS_SHADOW_OPACITY,
  SAVE_SUCCESS_SHADOW_RADIUS,
  SAVE_SUCCESS_ELEVATION,
  SAVE_SUCCESS_TEXT_MARGIN_LEFT,
} from './editProfileScreenConstants';

function buildStyles(c) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.BACKGROUND,
    },
    background: {
      flex: 1,
    },
    imageStyle: {
      opacity: BACKGROUND_OPACITY,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: c.BACKGROUND,
    },
    loadingText: {
      color: c.ACCENT,
      fontSize: 18,
      marginTop: LOADING_TEXT_MARGIN_TOP,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: HEADER_PADDING_HORIZONTAL,
      paddingVertical: HEADER_PADDING_VERTICAL,
      backgroundColor: c.HEADER_BACKGROUND,
      borderBottomWidth: HEADER_BORDER_WIDTH,
      borderBottomColor: c.HEADER_BORDER,
    },
    headerButton: {
      width: HEADER_BUTTON_SIZE,
      height: HEADER_BUTTON_SIZE,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: HEADER_BUTTON_BORDER_RADIUS,
      backgroundColor: c.HEADER_BUTTON_BACKGROUND,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: c.WHITE,
    },
    content: {
      flex: 1,
      padding: CONTENT_PADDING,
    },
    contentPaddingBottom: {
      paddingBottom: CONTENT_PADDING_BOTTOM,
    },
    section: {
      marginBottom: SECTION_MARGIN_BOTTOM,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: c.WHITE,
      marginBottom: SECTION_TITLE_MARGIN_BOTTOM,
    },
    inputContainer: {
      marginBottom: INPUT_CONTAINER_MARGIN_BOTTOM,
    },
    label: {
      fontSize: 14,
      color: c.ACCENT,
      marginBottom: LABEL_MARGIN_BOTTOM,
    },
    input: {
      backgroundColor: c.INPUT_BACKGROUND,
      borderRadius: INPUT_BORDER_RADIUS,
      paddingHorizontal: INPUT_PADDING_HORIZONTAL,
      paddingVertical: INPUT_PADDING_VERTICAL,
      fontSize: 16,
      color: c.WHITE,
      borderWidth: INPUT_BORDER_WIDTH,
      borderColor: c.CARD_BORDER,
    },
    inputError: {
      borderColor: c.ERROR,
    },
    errorText: {
      color: c.ERROR,
      fontSize: 12,
      marginTop: ERROR_TEXT_MARGIN_TOP,
    },
    helperText: {
      color: c.ACCENT,
      fontSize: 12,
      marginTop: HELPER_TEXT_MARGIN_TOP,
    },
    profileHeader: {
      alignItems: 'center',
      paddingVertical: PROFILE_HEADER_PADDING_VERTICAL,
    },
    profileName: {
      fontSize: 24,
      fontWeight: 'bold',
      color: c.WHITE,
      marginBottom: PROFILE_NAME_MARGIN_BOTTOM,
    },
    profileUsername: {
      fontSize: 16,
      color: c.ACCENT,
      marginBottom: PROFILE_USERNAME_MARGIN_BOTTOM,
    },
    inputDisabled: {
      opacity: INPUT_DISABLED_OPACITY,
      backgroundColor: c.INPUT_DISABLED_BACKGROUND,
    },
    disabledButton: {
      opacity: DISABLED_BUTTON_OPACITY,
    },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.INPUT_BACKGROUND,
      borderRadius: INPUT_BORDER_RADIUS,
      paddingHorizontal: INPUT_WRAPPER_PADDING_HORIZONTAL,
      borderWidth: INPUT_BORDER_WIDTH,
      borderColor: c.CARD_BORDER,
    },
    saveSuccessIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.SAVE_SUCCESS_BACKGROUND,
      paddingHorizontal: SAVE_SUCCESS_PADDING_HORIZONTAL,
      paddingVertical: SAVE_SUCCESS_PADDING_VERTICAL,
      borderRadius: SAVE_SUCCESS_BORDER_RADIUS,
      position: 'absolute',
      top: SAVE_SUCCESS_TOP,
      alignSelf: 'center',
      zIndex: SAVE_SUCCESS_Z_INDEX,
      shadowColor: c.SAVE_SUCCESS_SHADOW,
      shadowOffset: { width: 0, height: SAVE_SUCCESS_SHADOW_OFFSET_Y },
      shadowOpacity: SAVE_SUCCESS_SHADOW_OPACITY,
      shadowRadius: SAVE_SUCCESS_SHADOW_RADIUS,
      elevation: SAVE_SUCCESS_ELEVATION,
    },
    saveSuccessText: {
      color: c.SUCCESS,
      marginLeft: SAVE_SUCCESS_TEXT_MARGIN_LEFT,
      fontSize: 18,
      fontWeight: 'bold',
    },
  });
}

export function useEditProfileScreenStyles() {
  const { colors } = useTheme();
  const editProfileColors = useMemo(() => createEditProfileColors(colors), [colors]);
  const styles = useMemo(() => buildStyles(editProfileColors), [editProfileColors]);
  return { styles, editProfileColors };
}
