/**
 * Estilos para ProfileScreen y subcomponentes (tema claro/oscuro vía useProfileScreenStyles).
 */
import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { SPACING, TYPOGRAPHY } from '../../constants/ui';
import {
  createProfileColors,
  SCROLL_PADDING_BOTTOM,
  HEADER_PADDING_HORIZONTAL,
  HEADER_PADDING_VERTICAL,
  HEADER_BUTTON_SIZE,
  HEADER_BUTTON_BORDER_RADIUS,
  USER_NAME_MARGIN_BOTTOM,
  USER_EMAIL_MARGIN_BOTTOM,
  SECTION_TITLE_MARGIN_BOTTOM,
  STATS_GRID_PADDING_VERTICAL,
  STAT_ITEM_WIDTH,
  STAT_ITEM_BORDER_RADIUS,
  STAT_ITEM_PADDING,
  STAT_ITEM_MARGIN_RIGHT,
  STAT_ITEM_BORDER_WIDTH,
  STAT_VALUE_MARGIN_VERTICAL,
  STAT_SUB_LABEL_MARGIN_TOP,
  OPTION_BUTTON_BORDER_RADIUS,
  OPTION_BUTTON_PADDING,
  OPTION_BUTTON_MARGIN_BOTTOM,
  OPTION_BUTTON_BORDER_WIDTH,
  OPTION_TEXT_MARGIN_LEFT,
  LOGOUT_BUTTON_BORDER_RADIUS,
  LOGOUT_BUTTON_PADDING,
  LOGOUT_BUTTON_MARGIN,
  LOGOUT_BUTTON_BORDER_WIDTH,
  LOGOUT_TEXT_MARGIN_LEFT,
  LOADING_TEXT_MARGIN_TOP,
} from './profileScreenConstants';

function buildStyles(c, resolvedScheme) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.BACKGROUND,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
      paddingTop: 12,
      paddingBottom: SCROLL_PADDING_BOTTOM,
    },
    sectionBlock: {
      padding: SPACING.SCREEN_EDGE_INSET,
      marginBottom: 18,
      borderRadius: 18,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.CARD_BORDER,
      backgroundColor: c.SETTINGS_SECTION_SURFACE,
      shadowColor: c.GLASS_SHADOW,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: resolvedScheme === 'dark' ? 0.35 : 0.1,
      shadowRadius: 10,
      elevation: resolvedScheme === 'dark' ? 4 : 2,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: c.BACKGROUND,
    },
    loadingText: {
      color: c.TEXT_SECONDARY,
      fontSize: TYPOGRAPHY.SUBTITLE,
      marginTop: LOADING_TEXT_MARGIN_TOP,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 24,
      paddingHorizontal: HEADER_PADDING_HORIZONTAL,
      paddingVertical: HEADER_PADDING_VERTICAL,
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
      color: c.TEXT,
      textAlign: 'center',
    },
    profileSection: {
      alignItems: 'center',
      paddingVertical: 4,
    },
    userName: {
      fontSize: TYPOGRAPHY.TITLE,
      fontWeight: 'bold',
      color: c.TEXT,
      marginBottom: USER_NAME_MARGIN_BOTTOM,
    },
    userEmail: {
      fontSize: TYPOGRAPHY.BODY,
      color: c.TEXT_SECONDARY,
      marginBottom: USER_EMAIL_MARGIN_BOTTOM,
    },
    subscriptionContainer: {
      gap: 10,
    },
    subscriptionFollowingProfile: {
      marginTop: 18,
      width: '100%',
    },
    statsContainer: {
      gap: 8,
    },
    sectionTitle: {
      fontSize: TYPOGRAPHY.SUBTITLE,
      fontWeight: '600',
      color: c.TEXT,
      marginBottom: SECTION_TITLE_MARGIN_BOTTOM,
      letterSpacing: 0.2,
    },
    statsGrid: {
      flexDirection: 'row',
      alignItems: 'stretch',
      paddingVertical: STATS_GRID_PADDING_VERTICAL,
    },
    statItem: {
      width: STAT_ITEM_WIDTH,
      backgroundColor: c.CARD_BACKGROUND,
      borderRadius: STAT_ITEM_BORDER_RADIUS,
      padding: STAT_ITEM_PADDING,
      alignItems: 'center',
      marginRight: STAT_ITEM_MARGIN_RIGHT,
      borderWidth: STAT_ITEM_BORDER_WIDTH,
      borderColor: c.CARD_BORDER,
    },
    statValue: {
      fontSize: TYPOGRAPHY.TITLE,
      fontWeight: 'bold',
      color: c.TEXT,
      marginVertical: STAT_VALUE_MARGIN_VERTICAL,
    },
    statLabel: {
      fontSize: TYPOGRAPHY.SMALL,
      color: c.TEXT_SECONDARY,
      textAlign: 'center',
    },
    statSubLabel: {
      fontSize: 10,
      color: c.TEXT_MUTED,
      textAlign: 'center',
      marginTop: STAT_SUB_LABEL_MARGIN_TOP,
    },
    optionsContainer: {},
    optionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.CARD_BACKGROUND,
      borderRadius: OPTION_BUTTON_BORDER_RADIUS,
      padding: OPTION_BUTTON_PADDING,
      marginBottom: OPTION_BUTTON_MARGIN_BOTTOM,
      borderWidth: OPTION_BUTTON_BORDER_WIDTH,
      borderColor: c.CARD_BORDER,
    },
    optionText: {
      flex: 1,
      marginLeft: OPTION_TEXT_MARGIN_LEFT,
      fontSize: TYPOGRAPHY.BODY,
      fontWeight: '500',
      color: c.TEXT,
    },
    optionContent: {
      flex: 1,
      marginLeft: OPTION_TEXT_MARGIN_LEFT,
    },
    optionSubtext: {
      fontSize: TYPOGRAPHY.SMALL,
      color: c.TEXT_SECONDARY,
      marginTop: 2,
    },
    logoutButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.LOGOUT_BUTTON_BACKGROUND,
      borderRadius: LOGOUT_BUTTON_BORDER_RADIUS,
      padding: LOGOUT_BUTTON_PADDING,
      marginTop: LOGOUT_BUTTON_MARGIN,
      marginBottom: LOGOUT_BUTTON_MARGIN,
      borderWidth: LOGOUT_BUTTON_BORDER_WIDTH,
      borderColor: c.LOGOUT_BUTTON_BORDER,
    },
    logoutText: {
      marginLeft: LOGOUT_TEXT_MARGIN_LEFT,
      fontSize: TYPOGRAPHY.BODY,
      color: c.ERROR,
      fontWeight: '500',
    },
    emergencyContactsSection: {
      marginBottom: 16,
    },
    contactsList: {
      marginTop: 12,
    },
    contactItem: {
      backgroundColor: c.CARD_BACKGROUND,
      borderRadius: 12,
      padding: 14,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: c.CARD_BORDER,
    },
    contactMainContent: {
      flex: 1,
    },
    contactHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    contactHeaderLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      marginRight: 12,
    },
    contactTitleContainer: {
      flex: 1,
    },
    contactName: {
      fontSize: 16,
      fontWeight: '600',
      color: c.TEXT,
      marginBottom: 2,
    },
    contactRelationship: {
      fontSize: 12,
      color: c.TEXT_SECONDARY,
      fontStyle: 'italic',
    },
    contactDetails: {
      marginLeft: 0,
      gap: 6,
    },
    contactDetailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    contactDetailText: {
      fontSize: TYPOGRAPHY.CAPTION,
      color: c.TEXT_SECONDARY,
      flex: 1,
    },
    contactActions: {
      flexDirection: 'row',
      gap: 6,
    },
    contactActionButton: {
      padding: 6,
      borderRadius: 6,
      backgroundColor: c.CONTACT_ACTION_EDIT_BACKGROUND,
      minWidth: 32,
      alignItems: 'center',
      justifyContent: 'center',
    },
    contactActionButtonDelete: {
      backgroundColor: c.CONTACT_ACTION_DELETE_BACKGROUND,
    },
    emptyText: {
      fontSize: TYPOGRAPHY.CAPTION,
      color: c.TEXT_MUTED,
      textAlign: 'center',
      paddingVertical: SPACING.SCREEN_EDGE_INSET,
      fontStyle: 'italic',
    },
  });
}

export function useProfileScreenStyles() {
  const { colors, resolvedScheme } = useTheme();
  const profileColors = useMemo(() => createProfileColors(colors), [colors]);
  const styles = useMemo(
    () => buildStyles(profileColors, resolvedScheme),
    [profileColors, resolvedScheme],
  );
  return { styles, profileColors };
}
