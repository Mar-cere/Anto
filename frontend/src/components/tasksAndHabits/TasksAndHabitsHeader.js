import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Animated,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { useSectionTranslations } from '../../hooks/useTranslations';
import { SPACING } from '../../constants/ui';
import {
  capitalizeFirstLetter,
  formatTasksAndHabitsHeaderDate,
} from '../../utils/tasksAndHabitsUtils';

const TABS = [
  { key: 'tasks', labelKey: 'TAB_TASKS' },
  { key: 'habits', labelKey: 'TAB_HABITS' },
];

export default function TasksAndHabitsHeader({
  activeTab = 'tasks',
  onTabChange,
  searchQuery = '',
  onSearchChange,
}) {
  const { colors, statusBarStyle } = useTheme();
  const { language } = useLanguage();
  const T = useSectionTranslations('TASKS_AND_HABITS');
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const searchAnim = useRef(new Animated.Value(0)).current;

  const locale = language === 'en' ? 'en-US' : 'es-ES';
  const dateLabel = capitalizeFirstLetter(
    formatTasksAndHabitsHeaderDate(new Date(), locale),
  );

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
          paddingBottom: SPACING.CHIP_INSET,
        },
        headerTop: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 14,
        },
        headerTitle: {
          fontSize: 24,
          fontWeight: '600',
          letterSpacing: -0.4,
          color: colors.text,
        },
        headerMeta: {
          marginTop: 4,
          color: colors.textSecondary,
          fontSize: 13,
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
        tabSwitcher: {
          flexDirection: 'row',
          gap: SPACING.sm,
          padding: SPACING.xs,
          borderRadius: 16,
          backgroundColor: colors.glassFill,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.chromeHeaderBorder,
        },
        tabButton: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: SPACING.CHIP_INSET_COMPACT,
          borderRadius: 12,
        },
        tabButtonActive: {
          backgroundColor: colors.primary,
        },
        tabButtonText: {
          color: colors.textSecondary,
          fontSize: 14,
          fontWeight: '600',
        },
        tabButtonTextActive: {
          color: colors.textOnPrimary,
        },
      }),
    [colors],
  );

  const toggleSearch = useCallback(() => {
    Animated.spring(searchAnim, {
      toValue: isSearchVisible ? 0 : 1,
      useNativeDriver: false,
    }).start();
    setIsSearchVisible(!isSearchVisible);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }, [isSearchVisible, searchAnim]);

  return (
    <View style={styles.headerContainer}>
      <StatusBar barStyle={statusBarStyle} backgroundColor={colors.background} />
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>{T.SCREEN_TITLE || 'Tareas y hábitos'}</Text>
            <Text style={styles.headerMeta}>{dateLabel}</Text>
          </View>
          <TouchableOpacity
            style={styles.searchButton}
            onPress={toggleSearch}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={T.SEARCH_TOGGLE_A11Y || 'Buscar'}
          >
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
              placeholder={T.SEARCH_PLACEHOLDER || 'Buscar...'}
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={onSearchChange}
            />
            {searchQuery.length > 0 ? (
              <TouchableOpacity onPress={() => onSearchChange?.('')}>
                <MaterialCommunityIcons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            ) : null}
          </View>
        </Animated.View>

        <View style={styles.tabSwitcher} accessibilityRole="tablist">
          {TABS.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tabButton, active && styles.tabButtonActive]}
                onPress={() => {
                  onTabChange?.(tab.key);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                }}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
              >
                <Text style={[styles.tabButtonText, active && styles.tabButtonTextActive]}>
                  {T[tab.labelKey] || tab.key}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}
