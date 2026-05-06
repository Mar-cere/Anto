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
import { colors } from '../../styles/globalStyles';
import { FOCUS_BORDER_SUBTLE, FOCUS_KICKER_COLOR, FOCUS_META } from '../../styles/focusCardTheme';

const TaskHeader = ({
  filterType,
  onFilterChange,
  onSearch,
  searchQuery = '',
  counts = { all: 0, task: 0, reminder: 0 },
}) => {
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
    if (filterType === 'task') return `${counts.task || 0} tareas`;
    if (filterType === 'reminder') return `${counts.reminder || 0} recordatorios`;
    return `${counts.all || 0} elementos`;
  }, [filterType, counts]);

  return (
    <View style={styles.headerContainer}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Mis tareas</Text>
            <Text style={styles.headerMeta}>{activeCountText}</Text>
          </View>
          <TouchableOpacity style={styles.searchButton} onPress={toggleSearch} activeOpacity={0.7}>
            <MaterialCommunityIcons
              name={isSearchVisible ? 'close' : 'magnify'}
              size={22}
              color={FOCUS_KICKER_COLOR}
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
            <MaterialCommunityIcons name="magnify" size={20} color={FOCUS_KICKER_COLOR} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar…"
              placeholderTextColor={FOCUS_META}
              value={searchQuery}
              onChangeText={handleSearchChange}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => handleSearchChange('')}>
                <MaterialCommunityIcons name="close" size={20} color={FOCUS_META} />
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>

        <View style={styles.filterButtons}>
          {[
            { type: 'all', label: 'Todos', icon: 'format-list-bulleted' },
            { type: 'task', label: 'Tareas', icon: 'checkbox-blank-outline' },
            { type: 'reminder', label: 'Recordatorios', icon: 'clock-outline' },
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
                color={filterType === filter.type ? colors.background : FOCUS_KICKER_COLOR}
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

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: colors.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: FOCUS_BORDER_SUBTLE,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
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
    color: 'rgba(255,255,255,0.94)',
  },
  headerMeta: {
    marginTop: 2,
    color: FOCUS_META,
    fontSize: 12,
    fontWeight: '500',
  },
  searchButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  searchContainer: {
    marginBottom: 12,
    overflow: 'hidden',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: FOCUS_BORDER_SUBTLE,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: colors.white,
    fontSize: 16,
    paddingVertical: 8,
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: FOCUS_BORDER_SUBTLE,
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
    borderColor: 'rgba(26, 221, 219, 0.35)',
  },
  filterButtonText: {
    color: FOCUS_KICKER_COLOR,
    fontSize: 13,
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: colors.background,
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
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
});

export default TaskHeader;
