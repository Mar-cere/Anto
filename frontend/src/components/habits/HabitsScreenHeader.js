/**
 * Header de la pantalla de hábitos (título + filtros Activos/Archivados).
 * @author AntoApp Team
 */

import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { FOCUS_BORDER_SUBTLE, FOCUS_KICKER_COLOR, FOCUS_META } from '../../styles/focusCardTheme';
import {
  COLORS,
  FILTER_BORDER_RADIUS,
  FILTER_GAP,
  FILTER_ICON_SIZE,
  FILTER_PADDING_HORIZONTAL,
  FILTER_PADDING_VERTICAL,
  FILTER_TYPES,
  HEADER_PADDING,
  HEADER_TITLE_MARGIN_BOTTOM,
  TEXTS,
} from '../../screens/habits/habitsScreenConstants';

export default function HabitsScreenHeader({ filterType, onFilterChange, counts = { active: 0, archived: 0 } }) {
  return (
    <View style={styles.headerContainer}>
      <View style={styles.header}>
        <View style={styles.titleWrap}>
          <Text style={styles.headerTitle}>{TEXTS.TITLE}</Text>
          <Text style={styles.headerMeta}>
            {filterType === FILTER_TYPES.ACTIVE
              ? `${counts.active || 0} activos`
              : `${counts.archived || 0} archivados`}
          </Text>
        </View>
        <View style={styles.filterButtons}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              filterType === FILTER_TYPES.ACTIVE && styles.filterButtonActive,
            ]}
            onPress={() => onFilterChange(FILTER_TYPES.ACTIVE)}
          >
            <MaterialCommunityIcons
              name="checkbox-marked-circle-outline"
              size={FILTER_ICON_SIZE}
              color={filterType === FILTER_TYPES.ACTIVE ? COLORS.WHITE : COLORS.ACCENT}
            />
            <Text
              style={[
                styles.filterButtonText,
                filterType === FILTER_TYPES.ACTIVE && styles.filterButtonTextActive,
              ]}
            >
              {TEXTS.ACTIVE}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              filterType === FILTER_TYPES.ARCHIVED && styles.filterButtonActive,
            ]}
            onPress={() => onFilterChange(FILTER_TYPES.ARCHIVED)}
          >
            <MaterialCommunityIcons
              name="archive-outline"
              size={FILTER_ICON_SIZE}
              color={filterType === FILTER_TYPES.ARCHIVED ? COLORS.WHITE : COLORS.ACCENT}
            />
            <Text
              style={[
                styles.filterButtonText,
                filterType === FILTER_TYPES.ARCHIVED && styles.filterButtonTextActive,
              ]}
            >
              {TEXTS.ARCHIVED}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: COLORS.BACKGROUND,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: FOCUS_BORDER_SUBTLE,
  },
  header: {
    paddingHorizontal: HEADER_PADDING,
    paddingBottom: HEADER_PADDING,
    paddingTop: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '600',
    letterSpacing: -0.3,
    color: 'rgba(255,255,255,0.94)',
  },
  titleWrap: {
    marginBottom: HEADER_TITLE_MARGIN_BOTTOM,
  },
  headerMeta: {
    marginTop: 4,
    color: FOCUS_META,
    fontSize: 12,
    fontWeight: '500',
  },
  filterButtons: {
    flexDirection: 'row',
    gap: FILTER_GAP,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: FILTER_PADDING_VERTICAL,
    paddingHorizontal: FILTER_PADDING_HORIZONTAL,
    borderRadius: FILTER_BORDER_RADIUS,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: FOCUS_BORDER_SUBTLE,
  },
  filterButtonActive: {
    backgroundColor: COLORS.PRIMARY,
    borderColor: 'rgba(26, 221, 219, 0.35)',
  },
  filterButtonText: {
    color: FOCUS_KICKER_COLOR,
    fontSize: 13,
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: COLORS.WHITE,
  },
});
