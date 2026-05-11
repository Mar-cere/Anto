/**
 * Pantalla de gestión de hábitos
 *
 * Permite ver, crear, completar, archivar y eliminar hábitos.
 * Lógica en useHabitsScreen; UI en HabitsScreenHeader, SwipeableHabitItem, HabitsErrorView, HabitsEmptyView.
 *
 * @author AntoApp Team
 */

import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import {
  RefreshControl,
  SectionList,
  StyleSheet,
  TouchableOpacity,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import CreateHabitModal from '../components/habits/CreateHabitModal';
import HabitsEmptyView from '../components/habits/HabitsEmptyView';
import HabitsErrorView from '../components/habits/HabitsErrorView';
import HabitsScreenHeader from '../components/habits/HabitsScreenHeader';
import SwipeableHabitItem from '../components/habits/SwipeableHabitItem';
import FloatingNavBar from '../components/FloatingNavBar';
import { SkeletonCard } from '../components/Skeleton';
import { useTheme } from '../context/ThemeContext';
import { useHabitsScreen } from '../hooks/useHabitsScreen';
import { SPACING } from '../constants/ui';
import { getFocusTheme } from '../styles/focusCardTheme';
import {
  createHabitsColors,
  FLATLIST_INITIAL_NUM_TO_RENDER,
  FLATLIST_MAX_TO_RENDER_PER_BATCH,
  FLATLIST_WINDOW_SIZE,
  LIST_PADDING_BOTTOM,
  FAB_BORDER_RADIUS,
  FAB_BOTTOM,
  FAB_SIZE,
  ICON_SIZE,
} from './habits/habitsScreenConstants';

let lastHabitsSearchQuery = '';
let lastHabitsFilterType = 'active';

export default function HabitsScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { colors, resolvedScheme } = useTheme();
  const t = useMemo(() => getFocusTheme(colors, resolvedScheme), [colors, resolvedScheme]);
  const HC = useMemo(() => createHabitsColors(colors), [colors]);
  const styles = useMemo(() => createHabitsScreenStyles(colors, t, HC), [colors, t, HC]);
  const [searchQuery, setSearchQuery] = useState(lastHabitsSearchQuery);
  const {
    habits,
    modalVisible,
    loading,
    refreshing,
    error,
    filterType,
    setFilterType,
    formData,
    setFormData,
    loadHabits,
    onRefresh,
    handleHabitPress,
    handleAddHabit,
    toggleHabitComplete,
    toggleArchiveHabit,
    handleDeleteHabit,
    openModal,
    handleHabitModalClose,
    habitModalReminderIso,
  } = useHabitsScreen({ route, navigation });

  const showSkeleton = loading && !error && habits.length === 0;
  const handleSearchChange = (value) => {
    setSearchQuery(value);
    lastHabitsSearchQuery = value;
  };
  const filteredHabits = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return habits;
    return habits.filter((h) => {
      const title = (h.title || '').toLowerCase();
      const description = (h.description || '').toLowerCase();
      return title.includes(q) || description.includes(q);
    });
  }, [habits, searchQuery]);

  const habitSections = useMemo(() => {
    if (showSkeleton) {
      return [{
        key: 'skeleton',
        title: '',
        data: Array.from({ length: 6 }, (_, i) => ({ _id: `skeleton-${i}` })),
        skeleton: true,
      }];
    }
    if (filterType === 'active') {
      const pending = filteredHabits.filter((h) => !h?.status?.completedToday);
      const completed = filteredHabits.filter((h) => h?.status?.completedToday);
      return [
        { key: 'pending', title: 'Pendientes', data: pending },
        { key: 'completed', title: 'Completados hoy', data: completed },
      ].filter((s) => s.data.length > 0);
    }
    return [{ key: 'archived', title: 'Archivados', data: filteredHabits }];
  }, [showSkeleton, filterType, filteredHabits]);
  const habitsCount = {
    active: filterType === 'active' ? filteredHabits.length : 0,
    archived: filterType === 'archived' ? filteredHabits.length : 0,
  };
  const completedTodayCount = useMemo(
    () => filteredHabits.filter((h) => h?.status?.completedToday).length,
    [filteredHabits]
  );
  const pendingTodayCount = useMemo(
    () => filteredHabits.filter((h) => !h?.status?.completedToday).length,
    [filteredHabits]
  );

  React.useEffect(() => {
    if (filterType !== lastHabitsFilterType) {
      setFilterType(lastHabitsFilterType);
    }
    // Restaurar el filtro al montar durante la sesión.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilterChange = (type) => {
    setFilterType(type);
    lastHabitsFilterType = type;
  };

  const renderItem = ({ item, section }) => {
    if (section?.skeleton) return <SkeletonCard />;
    return (
      <SwipeableHabitItem
        item={item}
        onPress={() => handleHabitPress(item)}
        onComplete={toggleHabitComplete}
        onDelete={handleDeleteHabit}
        onArchive={toggleArchiveHabit}
      />
    );
  };

  const renderSectionHeader = ({ section }) => {
    if (!section.title) return null;
    return (
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionHeaderText}>{section.title}</Text>
        <View style={styles.sectionCountPill}>
          <Text style={styles.sectionCountText}>{section.data.length}</Text>
        </View>
      </View>
    );
  };

  const listContent = (
    <SectionList
      sections={habitSections}
      renderItem={renderItem}
      renderSectionHeader={renderSectionHeader}
      keyExtractor={(item) => item._id}
      contentContainerStyle={styles.listContainer}
      showsVerticalScrollIndicator={false}
      initialNumToRender={FLATLIST_INITIAL_NUM_TO_RENDER}
      windowSize={FLATLIST_WINDOW_SIZE}
      maxToRenderPerBatch={FLATLIST_MAX_TO_RENDER_PER_BATCH}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[HC.REFRESH_COLOR]}
          tintColor={HC.REFRESH_COLOR}
        />
      }
      ListEmptyComponent={
        !loading && searchQuery.trim() ? (
          <View style={styles.searchEmpty}>
            <MaterialCommunityIcons name="magnify-close" size={36} color={HC.ACCENT} />
            <Text style={styles.searchEmptyTitle}>Sin resultados</Text>
            <Text style={styles.searchEmptyText}>Prueba con otra palabra o limpia la búsqueda.</Text>
          </View>
        ) : !loading ? (
          <HabitsEmptyView filterType={filterType} onCreateFirst={openModal} />
        ) : null
      }
      ListHeaderComponent={
        !showSkeleton ? (
          <View style={styles.listHeaderWrap}>
            <View style={styles.countRow}>
              <Text style={styles.countText}>
                {filterType === 'active'
                  ? `${habitsCount.active} activos`
                  : `${habitsCount.archived} archivados`}
              </Text>
            </View>
            {filterType === 'active' ? (
              <View style={styles.summaryRow}>
                <View style={styles.summaryPill}>
                  <Text style={styles.summaryPillLabel}>Pendientes</Text>
                  <Text style={styles.summaryPillValue}>{pendingTodayCount}</Text>
                </View>
                <View style={styles.summaryPill}>
                  <Text style={styles.summaryPillLabel}>Completados hoy</Text>
                  <Text style={styles.summaryPillValue}>{completedTodayCount}</Text>
                </View>
              </View>
            ) : null}
          </View>
        ) : null
      }
    />
  );

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeAreaContent} edges={['top', 'left', 'right']}>
        <HabitsScreenHeader
          filterType={filterType}
          onFilterChange={handleFilterChange}
          counts={habitsCount}
          searchQuery={searchQuery}
          onSearch={handleSearchChange}
        />
        {error ? (
          <HabitsErrorView errorMessage={error} onRetry={() => loadHabits()} />
        ) : (
          listContent
        )}
      </SafeAreaView>
      <TouchableOpacity style={[styles.fab, { bottom: insets.bottom + FAB_BOTTOM }]} onPress={openModal}>
        <MaterialCommunityIcons name="plus" size={ICON_SIZE} color={colors.textOnPrimary} />
      </TouchableOpacity>
      <CreateHabitModal
        visible={modalVisible}
        onClose={handleHabitModalClose}
        onSubmit={handleAddHabit}
        formData={formData}
        setFormData={setFormData}
        initialReminderIso={habitModalReminderIso}
      />
      <FloatingNavBar />
    </View>
  );
}

function createHabitsScreenStyles(colors, t, HC) {
  const pillBg = t.FOCUS_INNER_ROW.backgroundColor;
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: HC.BACKGROUND,
    },
    safeAreaContent: {
      flex: 1,
      backgroundColor: HC.BACKGROUND,
    },
    listContainer: {
      flexGrow: 1,
      paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
      paddingTop: 4,
      paddingBottom: LIST_PADDING_BOTTOM,
    },
    listHeaderWrap: {
      marginBottom: 8,
    },
    countRow: {
      marginBottom: 10,
      paddingVertical: 8,
      paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
      alignSelf: 'flex-start',
      borderRadius: 12,
      backgroundColor: pillBg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    countText: {
      color: t.FOCUS_META,
      fontSize: 13,
      fontWeight: '500',
    },
    summaryRow: {
      flexDirection: 'row',
      gap: 8,
    },
    summaryPill: {
      flex: 1,
      backgroundColor: pillBg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      borderRadius: 12,
      paddingVertical: 8,
      paddingHorizontal: 10,
    },
    summaryPillLabel: {
      color: HC.ACCENT,
      fontSize: 11,
      fontWeight: '500',
    },
    summaryPillValue: {
      color: colors.text,
      marginTop: 2,
      fontSize: 16,
      fontWeight: '700',
    },
    sectionHeader: {
      backgroundColor: colors.glassFillStrong,
      paddingVertical: 8,
      paddingHorizontal: 10,
      marginBottom: 6,
      marginTop: 4,
      borderRadius: 10,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    sectionHeaderText: {
      fontSize: 12,
      fontWeight: '600',
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      color: colors.textSecondary,
    },
    sectionCountPill: {
      minWidth: 24,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 999,
      backgroundColor: colors.accentLineSoft,
    },
    sectionCountText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.text,
    },
    searchEmpty: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: 30,
      gap: 8,
    },
    searchEmptyTitle: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '600',
    },
    searchEmptyText: {
      color: HC.ACCENT,
      fontSize: 13,
      textAlign: 'center',
    },
    fab: {
      position: 'absolute',
      right: SPACING.SCREEN_EDGE_INSET,
      bottom: FAB_BOTTOM,
      width: FAB_SIZE,
      height: FAB_SIZE,
      borderRadius: FAB_BORDER_RADIUS,
      backgroundColor: HC.PRIMARY,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 8,
      shadowColor: HC.PRIMARY,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
    },
  });
}
