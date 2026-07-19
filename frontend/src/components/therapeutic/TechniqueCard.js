/**
 * Componente de Tarjeta de Técnica Terapéutica
 * Muestra una técnica terapéutica con su información básica
 */

import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SPACING } from '../../constants/ui';
import { useTheme } from '../../context/ThemeContext';
import { useSectionTranslations } from '../../hooks/useTranslations';
import { getFocusTheme } from '../../styles/focusCardTheme';

// Constantes de estilos
const CARD_PADDING = SPACING.HERO_INSET_COMPACT;
const CARD_BORDER_RADIUS = 22;
const CARD_MARGIN_BOTTOM = 12;
const ICON_SIZE = 24;
const TITLE_FONT_SIZE = 16;
const DESCRIPTION_FONT_SIZE = 14;
const DEFAULT_TEXTS = {
  DEFAULT_NAME: 'Técnica',
  A11Y_HINT: 'Doble toque para abrir la técnica',
  A11Y_PREFIX: 'Técnica',
  A11Y_TYPE_PREFIX: 'Tipo',
  STEPS_SINGULAR: 'paso',
  STEPS_PLURAL: 'pasos',
  WITHOUT_NAME: 'sin nombre',
};

// Mapeo de tipos a iconos
const TYPE_ICONS = {
  CBT: 'brain',
  DBT: 'heart-pulse',
  ACT: 'compass',
  immediate: 'lightning-bolt',
};

function resolveTechniqueType(technique) {
  const raw = technique.type ?? technique.category ?? 'immediate';
  if (typeof raw !== 'string' || raw.trim() === '') return 'immediate';
  const t = raw.trim();
  const lower = t.toLowerCase();
  if (lower === 'immediate') return 'immediate';
  const map = { cbt: 'CBT', dbt: 'DBT', act: 'ACT' };
  if (map[lower]) return map[lower];
  if (t === 'CBT' || t === 'DBT' || t === 'ACT') return t;
  return 'immediate';
}

const TechniqueCard = ({ technique, onPress, variant = 'default' }) => {
  const { colors, resolvedScheme } = useTheme();
  const translated = useSectionTranslations('TECHNIQUES');
  const T = useMemo(
    () => ({
      DEFAULT_NAME:
        translated?.TECHNIQUE_CARD_DEFAULT_NAME || DEFAULT_TEXTS.DEFAULT_NAME,
      A11Y_HINT:
        translated?.TECHNIQUE_CARD_A11Y_HINT ||
        DEFAULT_TEXTS.A11Y_HINT,
      A11Y_PREFIX: translated?.TECHNIQUE_CARD_A11Y_PREFIX || DEFAULT_TEXTS.A11Y_PREFIX,
      A11Y_TYPE_PREFIX:
        translated?.TECHNIQUE_CARD_A11Y_TYPE_PREFIX || DEFAULT_TEXTS.A11Y_TYPE_PREFIX,
      STEPS_SINGULAR:
        translated?.TECHNIQUE_CARD_STEPS_SINGULAR || DEFAULT_TEXTS.STEPS_SINGULAR,
      STEPS_PLURAL: translated?.TECHNIQUE_CARD_STEPS_PLURAL || DEFAULT_TEXTS.STEPS_PLURAL,
      WITHOUT_NAME: translated?.TECHNIQUE_CARD_WITHOUT_NAME || DEFAULT_TEXTS.WITHOUT_NAME,
    }),
    [translated]
  );
  const t = useMemo(() => getFocusTheme(colors, resolvedScheme), [colors, resolvedScheme]);
  const typeAccent = useMemo(
    () => ({
      CBT: colors.primary,
      DBT: colors.error,
      ACT: colors.success,
      immediate: colors.warning,
    }),
    [colors],
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          backgroundColor: colors.cardBackground,
          borderRadius: CARD_BORDER_RADIUS,
          padding: CARD_PADDING,
          marginBottom: CARD_MARGIN_BOTTOM,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: t.FOCUS_BORDER_SUBTLE,
          borderLeftWidth: 3,
          shadowColor: colors.glassShadow ?? colors.shadowAmbient,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 2,
        },
        cardCompact: {
          borderLeftWidth: 3,
          paddingVertical: SPACING.CARD_INNER_INSET,
          paddingHorizontal: SPACING.CARD_INNER_INSET,
          marginBottom: 10,
          shadowOpacity: 0.06,
          shadowRadius: 6,
          elevation: 2,
        },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 12,
        },
        headerCompact: {
          marginBottom: 8,
        },
        iconContainer: {
          width: 48,
          height: 48,
          borderRadius: 14,
          justifyContent: 'center',
          alignItems: 'center',
          marginRight: 12,
        },
        headerText: {
          flex: 1,
        },
        title: {
          fontSize: TITLE_FONT_SIZE,
          fontWeight: '600',
          color: colors.text,
          marginBottom: 4,
        },
        typeContainer: {
          flexDirection: 'row',
        },
        typeBadge: {
          paddingHorizontal: SPACING.sm,
          paddingVertical: SPACING.xs,
          borderRadius: 12,
        },
        typeText: {
          fontSize: 11,
          fontWeight: '600',
          textTransform: 'uppercase',
        },
        description: {
          fontSize: DESCRIPTION_FONT_SIZE,
          color: colors.textSecondary,
          lineHeight: 20,
          marginBottom: 12,
        },
        descriptionCompact: {
          marginBottom: 8,
          fontSize: 13,
          lineHeight: 18,
        },
        whenToUseContainer: {
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 8,
          gap: 6,
        },
        whenToUseText: {
          fontSize: 12,
          color: colors.textSecondary,
          flex: 1,
        },
        stepsIndicator: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
        },
        stepsText: {
          fontSize: 12,
          color: colors.textSecondary,
          fontWeight: '600',
        },
      }),
    [colors, t],
  );

  if (technique == null || typeof technique !== 'object') {
    return null;
  }

  const compact = variant === 'compact';
  const type = resolveTechniqueType(technique);
  const icon = TYPE_ICONS[type] || 'book-open-variant';
  const color = typeAccent[type] || colors.primary;

  return (
    <TouchableOpacity
      style={[
        styles.card,
        compact && styles.cardCompact,
        { borderLeftColor: color },
      ]}
      onPress={typeof onPress === 'function' ? onPress : undefined}
      disabled={typeof onPress !== 'function'}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`${T.A11Y_PREFIX} ${technique.name != null ? String(technique.name) : T.WITHOUT_NAME}. ${T.A11Y_TYPE_PREFIX} ${type}. ${technique.description != null ? String(technique.description) : ''}`}
      accessibilityHint={T.A11Y_HINT}
    >
      <View style={[styles.header, compact && styles.headerCompact]}>
        <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
          <MaterialCommunityIcons name={icon} size={ICON_SIZE} color={color} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>
            {technique.name != null && String(technique.name).trim() !== ''
              ? String(technique.name)
              : T.DEFAULT_NAME}
          </Text>
          {!compact ? (
            <View style={styles.typeContainer}>
              <View style={[styles.typeBadge, { backgroundColor: `${color}20` }]}>
                <Text style={[styles.typeText, { color }]}>{type}</Text>
              </View>
            </View>
          ) : null}
        </View>
        <MaterialCommunityIcons name="chevron-right" size={22} color={t.FOCUS_CHEVRON_MUTED} />
      </View>

      {technique.description ? (
        <Text
          style={[styles.description, compact && styles.descriptionCompact]}
          numberOfLines={2}
        >
          {technique.description}
        </Text>
      ) : null}

      {!compact && technique.whenToUse ? (
        <View style={styles.whenToUseContainer}>
          <MaterialCommunityIcons
            name="information"
            size={16}
            color={colors.textSecondary}
          />
          <Text style={styles.whenToUseText} numberOfLines={1}>
            {technique.whenToUse}
          </Text>
        </View>
      ) : null}

      {technique.steps && technique.steps.length > 0 ? (
        <View style={styles.stepsIndicator}>
          <MaterialCommunityIcons
            name="format-list-numbered"
            size={16}
            color={colors.textSecondary}
          />
          <Text style={styles.stepsText}>
            {technique.steps.length} {technique.steps.length === 1 ? T.STEPS_SINGULAR : T.STEPS_PLURAL}
          </Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
};

// `styles` se deriva del tema dentro del componente.

export default TechniqueCard;

