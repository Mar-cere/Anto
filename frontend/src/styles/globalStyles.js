import { StyleSheet } from 'react-native';
import { SPACING, TYPOGRAPHY } from '../constants/ui';
import { darkColors, lightColors } from './themePalettes';

export { darkColors, lightColors };

function rgbaFromHex(hex, alpha = 1) {
  const h = String(hex).replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const a = Math.min(1, Math.max(0, Number(alpha) === Number(alpha) ? alpha : 1));
  return `rgba(${r},${g},${b},${a})`;
}

/**
 * Referencia estática tema claro (imports legacy, mocks de tests).
 * En pantallas nuevas usar useTheme().colors.
 */
export const colors = lightColors;

export function createGlobalStyles(c) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.background,
    },
    titleText: {
      fontSize: TYPOGRAPHY.TITLE,
      fontWeight: 'bold',
      color: c.text,
      textAlign: 'center',
      marginBottom: 20,
    },
    errorText: {
      color: c.error,
      fontSize: TYPOGRAPHY.CAPTION,
      marginTop: 8,
      marginLeft: 5,
      textAlign: 'left',
      fontWeight: '500',
    },
    subTitleText: {
      fontSize: TYPOGRAPHY.SUBTITLE,
      color: c.textSecondary,
      textAlign: 'center',
      opacity: 0.95,
    },
    bodyText: {
      fontSize: TYPOGRAPHY.BODY,
      color: c.text,
    },
    captionText: {
      fontSize: TYPOGRAPHY.CAPTION,
      color: c.textSecondary,
    },
    buttonContainer: {
      width: '100%',
      alignItems: 'center',
    },
    modernButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.primary,
      borderRadius: 30,
      paddingVertical: SPACING.HERO_INSET_COMPACT,
      paddingHorizontal: SPACING.HERO_INSET,
      marginVertical: 10,
      shadowColor: c.primary,
      shadowOpacity: 0.28,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
    },
    secondaryButton: {
      backgroundColor: c.surface,
      borderWidth: 2,
      borderColor: c.primary,
    },
    buttonText: {
      color: c.white,
      fontSize: TYPOGRAPHY.BODY,
      fontWeight: 'bold',
    },
    disabledButton: {
      backgroundColor: rgbaFromHex(c.primary, 0.45),
    },
    FQText: {
      fontSize: 15,
      color: c.accent,
      textAlign: 'center',
      fontWeight: 'bold',
      marginTop: 10,
    },
    inputWrapper: {
      width: '100%',
      marginBottom: 18,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.chromeInput,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
      paddingHorizontal: SPACING.INPUT_INSET,
    },
    inputContainerFocused: {
      borderColor: c.accentLine,
      borderWidth: 1.5,
    },
    input: {
      flex: 1,
      fontSize: TYPOGRAPHY.BODY,
      color: c.text,
      paddingVertical: SPACING.CHIP_INSET,
      paddingHorizontal: SPACING.CHIP_INSET_COMPACT,
    },
    inputIcon: {
      marginHorizontal: 5,
    },
    inputError: {
      borderColor: c.error,
      borderWidth: 1,
    },
  });
}

/** Compatibilidad: tema claro fijo hasta migrar la pantalla a useTheme().globalStyles */
export const globalStyles = createGlobalStyles(lightColors);
