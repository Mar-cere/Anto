/**
 * Header de la pantalla de hábitos (título + filtros Activos/Archivados).
 * @author AntoApp Team
 */

import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import {
  createHabitsColors,
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
import { getFocusTheme } from '../../styles/focusCardTheme';
import { SPACING } from '../../constants/ui';

export default function HabitsScreenHeader({
  filterType,
  onFilterChange,
  counts = { active: 0, archived: 0 },
  searchQuery = '',
  onSearch,
}) {
  const { colors, resolvedScheme } = useTheme();
  const t = useMemo(() => getFocusTheme(colors, resolvedScheme), [colors, resolvedScheme]);
  const HC = useMemo(() => createHabitsColors(colors), [colors]);
  const styles = useMemo(
    () =>
      StyleSheet.create({
        headerContainer: {
          backgroundColor: HC.BACKGROUND,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: t.FOCUS_BORDER_SUBTLE,
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
          color: colors.text,
        },
        titleWrap: {
          marginBottom: HEADER_TITLE_MARGIN_BOTTOM,
        },
        headerMeta: {
          marginTop: 4,
          color: t.FOCUS_META,
          fontSize: 12,
          fontWeight: '500',
        },
        filterButtons: {
          flexDirection: 'row',
          gap: FILTER_GAP,
          marginBottom: 12,
        },
        filterButton: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          paddingVertical: FILTER_PADDING_VERTICAL,
          paddingHorizontal: FILTER_PADDING_HORIZONTAL,
          borderRadius: FILTER_BORDER_RADIUS,
          backgroundColor: t.FOCUS_INNER_ROW.backgroundColor,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: t.FOCUS_BORDER_SUBTLE,
        },
        filterButtonActive: {
          backgroundColor: HC.PRIMARY,
          borderColor: colors.accentLine,
        },
        filterButtonText: {
          color: t.FOCUS_KICKER_COLOR,
          fontSize: 13,
          fontWeight: '500',
        },
        filterButtonTextActive: {
          color: colors.textOnPrimary,
        },
        searchInputContainer: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: t.FOCUS_INNER_ROW.backgroundColor,
          borderRadius: 14,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: t.FOCUS_BORDER_SUBTLE,
          paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
          paddingVertical: 8,
          gap: 8,
        },
        searchInput: {
          flex: 1,
          color: colors.text,
          fontSize: 16,
          paddingVertical: 8,
        },
      }),
    [colors, t, HC],
  );

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
              color={filterType === FILTER_TYPES.ACTIVE ? colors.textOnPrimary : HC.ACCENT}
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
              color={filterType === FILTER_TYPES.ARCHIVED ? colors.textOnPrimary : HC.ACCENT}
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
        <View style={styles.searchInputContainer}>
          <MaterialCommunityIcons name="magnify" size={20} color={t.FOCUS_KICKER_COLOR} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar hábito…"
            placeholderTextColor={t.FOCUS_META}
            value={searchQuery}
            onChangeText={onSearch}
          />
          {searchQuery.length > 0 ? (
            <TouchableOpacity onPress={() => onSearch?.('')}>
              <MaterialCommunityIcons name="close" size={20} color={t.FOCUS_META} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </View>
  );
}
