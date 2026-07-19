import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  TextInput,
  Animated,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../context/ThemeContext';
import { useSectionTranslations } from '../../hooks/useTranslations';
import { SPACING } from '../../constants/ui';

const DEFAULT_TASKS_TEXTS = {
  HEADER_TITLE: 'Mis tareas',
  SEARCH_PLACEHOLDER: 'Buscar...',
  FILTER_ALL: 'Todos',
  FILTER_TASKS: 'Tareas',
  FILTER_REMINDERS: 'Recordatorios',
  TASK_SINGULAR: 'tarea',
  TASK_PLURAL: 'tareas',
  REMINDER_SINGULAR: 'recordatorio',
  REMINDER_PLURAL: 'recordatorios',
  ITEM_SINGULAR: 'elemento',
  ITEM_PLURAL: 'elementos',
};

const TaskHeader = ({
  filterType,
  onFilterChange,
  onSearch,
  searchQuery = '',
  counts = { all: 0, task: 0, reminder: 0 },
}) => {
  const { colors, statusBarStyle } = useTheme();
  const translated = useSectionTranslations('TASKS');
  const TEXTS = useMemo(
    () => ({ ...DEFAULT_TASKS_TEXTS, ...(translated || {}) }),
    [translated]
  );
  const handleSearchChange = useCallback(
    (text) => {
      onSearch?.(text);
    },
    [onSearch]
  );
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const searchAnim = useRef(new Animated.Value(0)).current;

  const toggleSearch = useCallback(() => {
    Animated.spring(searchAnim, {
      toValue: isSearchVisible ? 0 : 1,
      useNativeDriver: false,
    }).start();
    setIsSearchVisible(!isSearchVisible);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [isSearchVisible, searchAnim]);

  const handleFilterChange = useCallback(
    (type) => {
      onFilterChange(type);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
    [onFilterChange]
  );

  const activeCountText = useMemo(() => {
    if (filterType === 'task') {
      const n = counts.task || 0;
      return `${n} ${n === 1 ? TEXTS.TASK_SINGULAR : TEXTS.TASK_PLURAL}`;
    }
    if (filterType === 'reminder') {
      const n = counts.reminder || 0;
      return `${n} ${n === 1 ? TEXTS.REMINDER_SINGULAR : TEXTS.REMINDER_PLURAL}`;
    }
    const n = counts.all || 0;
    return `${n} ${n === 1 ? TEXTS.ITEM_SINGULAR : TEXTS.ITEM_PLURAL}`;
  }, [filterType, counts, TEXTS]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        headerContainer: {
          backgroundColor: colors.background,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: colors.chromeHeaderBorder,
        },
        header: {
          paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
          paddingTop: SPACING.sm,
          paddingBottom: SPACING.HERO_INSET_COMPACT,
        },
        headerTop: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 14,
        },
        headerTitle: {
          fontSize: 22,
          fontWeight: '600',
          letterSpacing: -0.3,
          color: colors.text,
        },
        headerMeta: {
          marginTop: 2,
          color: colors.textSecondary,
          fontSize: 12,
          fontWeight: '500',
        },
        searchButton: {
          padding: SPACING.sm,
          borderRadius: 12,
          backgroundColor: colors.glassFill,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.chromeHeaderBorder,
        },
        searchContainer: {
          marginBottom: 12,
          overflow: 'hidden',
        },
        searchInputContainer: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.chromeInput,
          borderRadius: 14,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.chromeHeaderBorder,
          paddingHorizontal: SPACING.INPUT_INSET,
          paddingVertical: SPACING.sm,
          gap: SPACING.sm,
        },
        searchInput: {
          flex: 1,
          color: colors.text,
          fontSize: 16,
          paddingVertical: SPACING.sm,
        },
        filterButtons: {
          flexDirection: 'row',
          gap: SPACING.sm,
        },
        filterButton: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          paddingVertical: SPACING.CHIP_INSET_COMPACT,
          paddingHorizontal: SPACING.CHIP_INSET,
          borderRadius: 14,
          backgroundColor: colors.glassFill,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.chromeHeaderBorder,
        },
        filterButtonActive: {
          backgroundColor: colors.primary,
          borderColor: colors.accentLine,
        },
        filterButtonText: {
          color: colors.text,
          fontSize: 13,
          fontWeight: '500',
        },
        filterButtonTextActive: {
          color: colors.textOnPrimary,
          fontWeight: '600',
        },
        filterCount: {
          backgroundColor: 'rgba(255, 255, 255, 0.2)',
          borderRadius: 10,
          paddingHorizontal: 6,
          paddingVertical: 2,
          minWidth: 20,
          alignItems: 'center',
        },
        filterCountText: {
          color: colors.textOnPrimary,
          fontSize: 12,
          fontWeight: '600',
        },
      }),
    [colors],
  );

  return (
    <View style={styles.headerContainer}>
      <StatusBar barStyle={statusBarStyle} backgroundColor={colors.background} />
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>{TEXTS.HEADER_TITLE}</Text>
            <Text style={styles.headerMeta}>{activeCountText}</Text>
          </View>
          <TouchableOpacity style={styles.searchButton} onPress={toggleSearch} activeOpacity={0.7}>
            <MaterialCommunityIcons
              name={isSearchVisible ? 'close' : 'magnify'}
              size={22}
              color={colors.primary}
            />
          </TouchableOpacity>
        </View>

        <Animated.View
          style={[
            styles.searchContainer,
            {
              height: searchAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 50],
              }),
              opacity: searchAnim,
            },
          ]}
        >
          <View style={styles.searchInputContainer}>
            <MaterialCommunityIcons name="magnify" size={20} color={colors.primary} />
            <TextInput
              style={styles.searchInput}
              placeholder={TEXTS.SEARCH_PLACEHOLDER}
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={handleSearchChange}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => handleSearchChange('')}>
                <MaterialCommunityIcons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>

        <View style={styles.filterButtons}>
          {[
            { type: 'all', label: TEXTS.FILTER_ALL, icon: 'format-list-bulleted' },
            { type: 'task', label: TEXTS.FILTER_TASKS, icon: 'checkbox-blank-outline' },
            { type: 'reminder', label: TEXTS.FILTER_REMINDERS, icon: 'clock-outline' },
          ].map((filter) => (
            <TouchableOpacity
              key={filter.type}
              style={[styles.filterButton, filterType === filter.type && styles.filterButtonActive]}
              onPress={() => handleFilterChange(filter.type)}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name={filter.icon}
                size={16}
                color={filterType === filter.type ? colors.textOnPrimary : colors.primary}
              />
              <Text
                style={[styles.filterButtonText, filterType === filter.type && styles.filterButtonTextActive]}
              >
                {filter.label}
              </Text>
              {!!counts?.[filter.type] && (
                <View style={styles.filterCount}>
                  <Text style={styles.filterCountText}>{counts[filter.type]}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
};

export default TaskHeader;
