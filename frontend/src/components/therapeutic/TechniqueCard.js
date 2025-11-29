/**
 * Componente de Tarjeta de Técnica Terapéutica
 * Muestra una técnica terapéutica con su información básica
 */

import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { colors } from '../../styles/globalStyles';

// Constantes de estilos
const CARD_PADDING = 16;
const CARD_BORDER_RADIUS = 12;
const CARD_MARGIN_BOTTOM = 12;
const ICON_SIZE = 24;
const TITLE_FONT_SIZE = 16;
const DESCRIPTION_FONT_SIZE = 14;

// Mapeo de tipos a iconos
const TYPE_ICONS = {
  CBT: 'brain',
  DBT: 'heart-pulse',
  ACT: 'compass',
  immediate: 'lightning-bolt',
};

// Mapeo de tipos a colores
const TYPE_COLORS = {
  CBT: '#4A90E2',
  DBT: '#E94B3C',
  ACT: '#50C878',
  immediate: '#FFB800',
};

const TechniqueCard = ({ technique, onPress }) => {
  const type = technique.type || technique.category || 'immediate';
  const icon = TYPE_ICONS[type] || 'book-open-variant';
  const color = TYPE_COLORS[type] || colors.primary;

  return (
    <TouchableOpacity
      style={[styles.card, { borderLeftColor: color }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
          <MaterialCommunityIcons name={icon} size={ICON_SIZE} color={color} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>{technique.name}</Text>
          <View style={styles.typeContainer}>
            <View style={[styles.typeBadge, { backgroundColor: `${color}20` }]}>
              <Text style={[styles.typeText, { color }]}>{type}</Text>
            </View>
          </View>
        </View>
        <MaterialCommunityIcons
          name="chevron-right"
          size={24}
          color={colors.textSecondary}
        />
      </View>

      {technique.description && (
        <Text style={styles.description} numberOfLines={2}>
          {technique.description}
        </Text>
      )}

      {technique.whenToUse && (
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
      )}

      {technique.steps && technique.steps.length > 0 && (
        <View style={styles.stepsIndicator}>
          <MaterialCommunityIcons
            name="format-list-numbered"
            size={16}
            color={colors.textSecondary}
          />
          <Text style={styles.stepsText}>
            {technique.steps.length} {technique.steps.length === 1 ? 'paso' : 'pasos'}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cardBackground,
    borderRadius: CARD_BORDER_RADIUS,
    padding: CARD_PADDING,
    marginBottom: CARD_MARGIN_BOTTOM,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
    paddingHorizontal: 8,
    paddingVertical: 4,
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
  },
});

export default TechniqueCard;

