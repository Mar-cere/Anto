import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useSectionTranslations } from '../../hooks/useTranslations';
import { SPACING } from '../../constants/ui';
import { getFocusTheme } from '../../styles/focusCardTheme';
import { lightColors } from '../../styles/themePalettes';

const DEFAULT_TEXTS = {
  VIEW_ALL: 'Ver todos',
};

export function createCardStyles(colors, resolvedScheme = 'light') {
  const t = getFocusTheme(colors, resolvedScheme);

  const cardColors = {
    primary: colors.primary,
    secondary: colors.textSecondary,
    background: colors.cardBackground ?? colors.surface,
    cardBg: colors.glassFill,
    success: colors.success,
    warning: colors.warning,
    error: colors.error,
    border: colors.border,
  };

  const commonStyles = StyleSheet.create({
    cardContainer: {
      ...t.FOCUS_PANEL,
      paddingVertical: SPACING.CARD_INNER_INSET,
      paddingHorizontal: SPACING.CARD_INNER_INSET,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 14,
    },
    titleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.CHIP_INSET,
      flex: 1,
      minWidth: 0,
    },
    headerIconWrap: {
      ...t.FOCUS_ICON_WRAP,
    },
    title: {
      color: colors.text,
      fontSize: 15,
      fontWeight: '500',
      lineHeight: 20,
      flex: 1,
      minWidth: 0,
    },
    viewAllButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingVertical: SPACING.sm,
      paddingHorizontal: SPACING.CHIP_INSET_COMPACT,
      borderRadius: 12,
      backgroundColor: colors.accentLineSoft,
      flexShrink: 0,
    },
    viewAllText: {
      color: cardColors.primary,
      fontSize: 14,
      fontWeight: '500',
    },
    itemContainer: {
      backgroundColor: cardColors.cardBg,
      borderRadius: 14,
      paddingVertical: SPACING.CARD_INNER_INSET,
      paddingHorizontal: SPACING.CARD_INNER_INSET,
      marginBottom: 8,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.FOCUS_BORDER_SUBTLE,
    },
    emptyContainer: {
      alignItems: 'center',
      padding: SPACING.HERO_INSET,
      gap: SPACING.CHIP_INSET,
    },
    emptyText: {
      color: t.FOCUS_META,
      fontSize: 15,
      lineHeight: 22,
      textAlign: 'center',
    },
    addButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: SPACING.CARD_INNER_INSET,
      paddingVertical: SPACING.CHIP_INSET_COMPACT,
      paddingHorizontal: SPACING.CHIP_INSET_COMPACT,
      marginTop: 16,
      borderRadius: 14,
      backgroundColor: colors.accentLineSoft,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.FOCUS_ACCENT_BORDER,
      borderStyle: 'dashed',
    },
    addButtonText: {
      color: cardColors.primary,
      fontSize: 14,
      fontWeight: '500',
    },
    loader: {
      padding: SPACING.CARD_INNER_INSET,
    },
  });

  const compactStyles = StyleSheet.create({
    emptyContainer: {
      paddingVertical: SPACING.CHIP_INSET_COMPACT,
      paddingHorizontal: SPACING.sm,
      gap: SPACING.sm,
    },
    emptyText: {
      fontSize: 14,
      lineHeight: 20,
    },
    addButton: {
      marginTop: 6,
      paddingVertical: SPACING.CHIP_INSET_COMPACT,
      borderRadius: 12,
      borderColor: colors.accentLine,
      backgroundColor: colors.accentLineSoft,
    },
    addButtonText: {
      fontSize: 13,
    },
  });

  return { cardColors, commonStyles, compactStyles, t };
}

/**
 * Hook legacy: por estabilidad en runtime, devuelve siempre los estilos legacy (tema claro).
 * Para estilos dinámicos por tema, usar `useCardStylesDynamic()`.
 */
export function useCardStyles() {
  return _legacy;
}

export function useCardStylesDynamic() {
  const { colors, resolvedScheme } = useTheme();
  const value = useMemo(() => createCardStyles(colors, resolvedScheme), [colors, resolvedScheme]);
  return value ?? _legacy;
}

/** Compatibilidad legacy (imports estáticos) */
const _legacy = createCardStyles(lightColors, 'light');
export const cardColors = _legacy.cardColors;
export const commonStyles = _legacy.commonStyles;

export const CardHeader = ({ icon, title, onViewAll }) => {
  const { colors, resolvedScheme } = useTheme();
  const translated = useSectionTranslations('DASH');
  const { cardColors, commonStyles, t } = useMemo(
    () => createCardStyles(colors, resolvedScheme),
    [colors, resolvedScheme],
  );
  const viewAllText = translated?.VIEW_ALL || DEFAULT_TEXTS.VIEW_ALL;
  return (
    <View style={commonStyles.cardHeader}>
      <View style={commonStyles.titleContainer}>
        <View style={commonStyles.headerIconWrap}>
          <MaterialCommunityIcons name={icon} size={20} color={cardColors.primary} />
        </View>
        <Text style={commonStyles.title} numberOfLines={2}>
          {title}
        </Text>
      </View>
      <TouchableOpacity style={commonStyles.viewAllButton} onPress={onViewAll} activeOpacity={0.7}>
        <Text style={commonStyles.viewAllText}>{viewAllText}</Text>
        <MaterialCommunityIcons name="chevron-right" size={18} color={t.FOCUS_CHEVRON_MUTED} />
      </TouchableOpacity>
    </View>
  );
};

export const EmptyState = ({
  icon,
  message,
  onAdd,
  addButtonText,
  compact = false,
  showIcon = true,
}) => {
  const { colors, resolvedScheme } = useTheme();
  const { cardColors, commonStyles, compactStyles, t } = useMemo(
    () => createCardStyles(colors, resolvedScheme),
    [colors, resolvedScheme],
  );
  return (
    <View style={[commonStyles.emptyContainer, compact && compactStyles.emptyContainer]}>
      {showIcon ? (
        <MaterialCommunityIcons
          name={icon}
          size={compact ? 24 : 40}
          color={t.FOCUS_KICKER_COLOR}
        />
      ) : null}
      <Text style={[commonStyles.emptyText, compact && compactStyles.emptyText]}>{message}</Text>
      {onAdd && (
        <TouchableOpacity
          style={[commonStyles.addButton, compact && compactStyles.addButton]}
          onPress={onAdd}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="plus" size={compact ? 14 : 16} color={cardColors.primary} />
          <Text style={[commonStyles.addButtonText, compact && compactStyles.addButtonText]}>
            {addButtonText}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

/**
 * Compatibilidad adicional: algunos módulos pueden consumir `CardStyles` como default
 * (p. ej. `import CardStyles from ...` o `require(...).default`).
 */
export default {
  createCardStyles,
  useCardStyles,
  useCardStylesDynamic,
  cardColors,
  commonStyles,
  CardHeader,
  EmptyState,
};
