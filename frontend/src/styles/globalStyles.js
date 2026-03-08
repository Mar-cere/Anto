import { StyleSheet } from 'react-native';
import { TYPOGRAPHY } from '../constants/ui';

export const colors = {
  primary: '#1ADDDB',
  background: '#030A24',
  white: '#FFFFFF',
  text: '#FFFFFF',
  accent: '#1ADDDB',
  // Colores secundarios
  textSecondary: '#A3B8E8',
  cardBackground: 'rgba(29, 43, 95, 0.8)',
  border: 'rgba(26, 221, 219, 0.15)',
  // Colores de estado
  error: '#FF6B6B',
  success: '#4CAF50',
  warning: '#FFD93D',
  info: '#6BCB77',
};

export const globalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  titleText: {
    fontSize: TYPOGRAPHY.TITLE,
    fontWeight: 'bold',
    color: colors.white,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    marginBottom: 20,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: TYPOGRAPHY.CAPTION,
    marginTop: 8,
    marginLeft: 5,
    textAlign: 'left',
    fontWeight: '500',
  },
  subTitleText: {
    fontSize: TYPOGRAPHY.SUBTITLE,
    color: colors.white,
    textAlign: 'center',
    opacity: 0.8,
  },
  bodyText: {
    fontSize: TYPOGRAPHY.BODY,
    color: colors.text,
  },
  captionText: {
    fontSize: TYPOGRAPHY.CAPTION,
    color: colors.textSecondary,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
  },
  modernButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 30,
    paddingVertical: 16,
    paddingHorizontal: 32,
    marginVertical: 10,
    shadowColor: colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  buttonText: {
    color: colors.white,
    fontSize: TYPOGRAPHY.BODY,
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: 'rgba(26, 221, 219, 0.5)',
  },
  FQText: {
    fontSize: 15,
    color: colors.accent,
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
    backgroundColor: 'rgba(29,43,95,0.8)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'transparent',
    paddingHorizontal: 10,
  },
  inputContainerFocused: {
    borderColor: 'rgba(26, 221, 219, 0.6)',
    borderWidth: 1.5,
  },
  input: {
    flex: 1,
    fontSize: TYPOGRAPHY.BODY,
    color: '#FFFFFF',
    paddingVertical: 14,
    paddingHorizontal: 10,
  },
  inputIcon: {
    marginHorizontal: 5,
  },
  inputError: {
    borderColor: '#FF6B6B',
    borderWidth: 1,
  },
}); 