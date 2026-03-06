/**
 * Header de la pantalla de hábitos (título + filtros Activos/Archivados).
 * @author AntoApp Team
 */

import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { Platform, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
  COLORS,
  DEFAULT_ANDROID_PADDING_TOP,
  DEFAULT_IOS_PADDING_TOP,
  FILTER_BORDER_RADIUS,
  FILTER_GAP,
  FILTER_ICON_SIZE,
  FILTER_PADDING_HORIZONTAL,
  FILTER_PADDING_VERTICAL,
  FILTER_TYPES,
  HEADER_PADDING,
  HEADER_TITLE_MARGIN_BOTTOM,
  STATUS_BAR_BACKGROUND,
  STATUS_BAR_STYLE,
  TEXTS,
} from '../../screens/habits/habitsScreenConstants';

export default function HabitsScreenHeader({ filterType, onFilterChange }) {
  const paddingTop =
    Platform.OS === 'ios' ? DEFAULT_IOS_PADDING_TOP : (StatusBar.currentHeight ?? DEFAULT_ANDROID_PADDING_TOP);

  return (
    <View style={[styles.headerContainer, { paddingTop }]}>
      <StatusBar barStyle={STATUS_BAR_STYLE} backgroundColor={STATUS_BAR_BACKGROUND} />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{TEXTS.TITLE}</Text>
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
    backgroundColor: COLORS.HEADER_BACKGROUND,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.HEADER_BORDER,
  },
  header: {
    padding: HEADER_PADDING,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.WHITE,
    marginBottom: HEADER_TITLE_MARGIN_BOTTOM,
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
    backgroundColor: COLORS.FILTER_BACKGROUND,
  },
  filterButtonActive: {
    backgroundColor: COLORS.PRIMARY,
  },
  filterButtonText: {
    color: COLORS.ACCENT,
    fontSize: 14,
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: COLORS.WHITE,
  },
});
