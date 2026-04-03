/**
 * Estilos para RegisterScreen y subcomponentes
 */
import { StyleSheet } from 'react-native';
import { colors } from '../../styles/globalStyles';
import {
  IMAGE_OPACITY,
  HORIZONTAL_PADDING,
  VERTICAL_PADDING,
  TITLE_MARGIN_TOP,
  TITLE_MARGIN_BOTTOM,
  SUBTITLE_MARGIN_BOTTOM,
  LOADING_SCALE,
  CHECKBOX_SIZE,
  CHECKBOX_BORDER_WIDTH,
  CHECKBOX_BORDER_RADIUS,
  CHECKBOX_MARGIN_RIGHT,
} from './registerScreenConstants';

export const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageStyle: {
    opacity: IMAGE_OPACITY,
    resizeMode: 'cover',
  },
  content: {
    alignItems: 'center',
    width: '100%',
    flex: 1,
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingVertical: VERTICAL_PADDING,
  },
  title: {
    fontSize: 34,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: TITLE_MARGIN_BOTTOM,
    marginTop: TITLE_MARGIN_TOP,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  subtitle: {
    fontSize: 20,
    color: '#A3B8E8',
    marginBottom: SUBTITLE_MARGIN_BOTTOM,
    textAlign: 'center',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 20,
    marginTop: 5,
  },
  checkbox: {
    width: CHECKBOX_SIZE,
    height: CHECKBOX_SIZE,
    borderWidth: CHECKBOX_BORDER_WIDTH,
    borderColor: colors.primary,
    borderRadius: CHECKBOX_BORDER_RADIUS,
    marginRight: CHECKBOX_MARGIN_RIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
  },
  checkboxDisabled: {
    opacity: 0.5,
    borderColor: colors.textSecondary,
  },
  termsText: {
    color: '#A3B8E8',
    fontSize: 16,
  },
  termsTextFlex: {
    flex: 1,
    flexShrink: 1,
  },
  termsTextDisabled: {
    opacity: 0.5,
    color: colors.textSecondary,
  },
  termsLink: {
    color: colors.primary,
    textDecorationLine: 'underline',
    fontWeight: 'bold',
  },
  linkContainer: {
    marginTop: 20,
  },
  linkText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: 'bold',
  },
  loadingIndicator: {
    transform: [{ scale: LOADING_SCALE }],
  },
  nameInfoLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginTop: 8,
    marginLeft: 5,
  },
  nameInfoLinkText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
    lineHeight: 16,
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: colors.background,
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    alignSelf: 'center',
  },
  modalScrollView: {
    maxHeight: 300,
    marginBottom: 20,
  },
  modalLinksContainer: {
    marginTop: 20,
    gap: 12,
  },
  modalLinkButton: {
    backgroundColor: 'rgba(26, 221, 219, 0.1)',
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  modalLinkText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.white,
    flex: 1,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalMessage: {
    fontSize: 16,
    color: '#A3B8E8',
    lineHeight: 24,
    marginBottom: 24,
    textAlign: 'left',
  },
  modalButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 12,
  },
  modalButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  modalButtonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  modalButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalButtonTextSecondary: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
