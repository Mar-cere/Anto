/**
 * Tokens visuales de la pantalla de bienvenida según tema claro/oscuro.
 */

const APP_LOGO = {
  light: require('../../assets/icon.png'),
  dark: require('../images/Anto.png'),
};

export function getWelcomeScreenTheme(resolvedScheme, colors = {}) {
  const dark = resolvedScheme === 'dark';

  return {
    background: colors.background,
    gradientTop: colors.gradientTop,
    text: colors.text,
    textMuted: colors.textSecondary,
    accent: colors.primaryBright || colors.primary,
    badgeBg: dark ? 'rgba(255, 255, 255, 0.06)' : colors.glassFill,
    badgeBorder: dark ? 'rgba(255, 255, 255, 0.12)' : colors.border,
    secondaryBg: dark ? 'rgba(255, 255, 255, 0.06)' : colors.chromeListRow,
    secondaryBorder: dark ? 'rgba(255, 255, 255, 0.14)' : colors.border,
    faq: dark ? '#8FA8E8' : colors.primary,
    primaryBtnText: colors.textOnPrimary || '#FFFFFF',
    secondaryBtnText: dark ? colors.text : colors.primary,
    gradientStart: colors.primary || '#1E83D3',
    gradientEnd: dark ? '#5B4BD4' : '#24234F',
    logoGlow: dark ? 'rgba(68, 215, 251, 0.18)' : 'rgba(30, 131, 211, 0.14)',
    logo: APP_LOGO[dark ? 'dark' : 'light'],
  };
}
