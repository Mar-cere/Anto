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
import BrandGradientFab from '../components/tasksAndHabits/BrandGradientFab';
import GratitudeJournalPromoCard from '../components/tasksAndHabits/GratitudeJournalPromoCard';
import HabitsFrequencyFilters from '../components/tasksAndHabits/HabitsFrequencyFilters';
import HabitsProgressSummaryCard from '../components/tasksAndHabits/HabitsProgressSummaryCard';
import CommitmentBridgeOffer from '../components/CommitmentBridgeOffer';
import FloatingNavBar from '../components/FloatingNavBar';
import { SkeletonCard } from '../components/Skeleton';
import { useTheme } from '../context/ThemeContext';
import { useSectionTranslations } from '../hooks/useTranslations';
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
import {
  computeHabitsTodayProgress,
  filterHabitsByFrequency,
} from '../utils/tasksAndHabitsUtils';

let lastHabitsSearchQuery = '';
let lastHabitsFilterType = 'active';
const DEFAULT_TEXTS = {
  SECTION_PENDING: 'Por completar',
  SECTION_TO_COMPLETE: 'Por completar',
  SECTION_COMPLETED_TODAY: 'Completados hoy',
  SECTION_ARCHIVED: 'Archivados',
  SEARCH_EMPTY_TITLE: 'Sin resultados',
  SEARCH_EMPTY_HINT: 'Prueba con otra palabra o limpia la búsqueda.',
  COUNT_ACTIVE_SUFFIX: 'activos',
  COUNT_ARCHIVED_SUFFIX: 'archivados',
  SUMMARY_PENDING: 'Pendientes',
  SUMMARY_COMPLETED_TODAY: 'Completados hoy',
};

export default function HabitsScreen({
  route,
  navigation,
  embedded = false,
  externalSearchQuery,
  contentBottomInset,
}) {
  const insets = useSafeAreaInsets();
  const { colors, resolvedScheme } = useTheme();
  const translated = useSectionTranslations('HABITS');
  const unifiedTexts = useSectionTranslations('TASKS_AND_HABITS');
  const T = useMemo(
    () => ({
      SECTION_PENDING: translated?.SECTION_PENDING || DEFAULT_TEXTS.SECTION_PENDING,
      SECTION_TO_COMPLETE:
        unifiedTexts.SECTION_TO_COMPLETE || DEFAULT_TEXTS.SECTION_TO_COMPLETE,
      SECTION_COMPLETED_TODAY:
        translated?.SECTION_COMPLETED_TODAY || DEFAULT_TEXTS.SECTION_COMPLETED_TODAY,
      SECTION_ARCHIVED: translated?.ARCHIVED || DEFAULT_TEXTS.SECTION_ARCHIVED,
      SEARCH_EMPTY_TITLE: translated?.SEARCH_EMPTY_TITLE || DEFAULT_TEXTS.SEARCH_EMPTY_TITLE,
      SEARCH_EMPTY_HINT:
        translated?.SEARCH_EMPTY_HINT ||
        DEFAULT_TEXTS.SEARCH_EMPTY_HINT,
      COUNT_ACTIVE_SUFFIX:
        translated?.COUNT_ACTIVE_SUFFIX || DEFAULT_TEXTS.COUNT_ACTIVE_SUFFIX,
      COUNT_ARCHIVED_SUFFIX:
        translated?.COUNT_ARCHIVED_SUFFIX || DEFAULT_TEXTS.COUNT_ARCHIVED_SUFFIX,
      SUMMARY_PENDING: translated?.SUMMARY_PENDING || DEFAULT_TEXTS.SUMMARY_PENDING,
      SUMMARY_COMPLETED_TODAY:
        translated?.SUMMARY_COMPLETED_TODAY || DEFAULT_TEXTS.SUMMARY_COMPLETED_TODAY,
    }),
    [translated, unifiedTexts],
  );
  const t = useMemo(() => getFocusTheme(colors, resolvedScheme), [colors, resolvedScheme]);
  const HC = useMemo(() => createHabitsColors(colors), [colors]);
  const styles = useMemo(() => createHabitsScreenStyles(colors, t, HC), [colors, t, HC]);
  const [searchQuery, setSearchQuery] = useState(lastHabitsSearchQuery);
  const [frequencyFilter, setFrequencyFilter] = useState('daily');
  const effectiveSearchQuery =
    embedded && externalSearchQuery !== undefined ? externalSearchQuery : searchQuery;
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
    commitmentBridgeOffer,
    commitmentBridgeSaving,
    handleCommitmentBridgeSave,
    handleCommitmentBridgeDismiss,
  } = useHabitsScreen({ route, navigation });

  const showSkeleton = loading && !error && habits.length === 0;
  const handleSearchChange = (value) => {
    setSearchQuery(value);
    lastHabitsSearchQuery = value;
  };
  const filteredHabits = useMemo(() => {
    const base = embedded
      ? filterHabitsByFrequency(habits, frequencyFilter)
      : habits;
    const q = effectiveSearchQuery.trim().toLowerCase();
    if (!q) return base;
    return base.filter((h) => {
      const title = (h.title || '').toLowerCase();
      const description = (h.description || '').toLowerCase();
      return title.includes(q) || description.includes(q);
    });
  }, [habits, effectiveSearchQuery, embedded, frequencyFilter]);

  const habitsProgress = useMemo(
    () => computeHabitsTodayProgress(filteredHabits),
    [filteredHabits],
  );

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
      const pendingTitle = embedded ? T.SECTION_TO_COMPLETE : T.SECTION_PENDING;
      return [
        { key: 'pending', title: pendingTitle, data: pending },
        { key: 'completed', title: T.SECTION_COMPLETED_TODAY, data: completed },
      ].filter((s) => s.data.length > 0);
    }
    return [{ key: 'archived', title: T.SECTION_ARCHIVED, data: filteredHabits }];
  }, [showSkeleton, filterType, filteredHabits, T]);
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
      contentContainerStyle={[
        styles.listContainer,
        {
          paddingBottom:
            contentBottomInset ??
            LIST_PADDING_BOTTOM,
        },
      ]}
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
        !loading && effectiveSearchQuery.trim() ? (
          <View style={styles.searchEmpty}>
            <MaterialCommunityIcons name="magnify-close" size={36} color={HC.ACCENT} />
            <Text style={styles.searchEmptyTitle}>{T.SEARCH_EMPTY_TITLE}</Text>
            <Text style={styles.searchEmptyText}>{T.SEARCH_EMPTY_HINT}</Text>
          </View>
        ) : !loading ? (
          <HabitsEmptyView filterType={filterType} onCreateFirst={openModal} />
        ) : null
      }
      ListHeaderComponent={
        !showSkeleton ? (
          <View style={styles.listHeaderWrap}>
            {commitmentBridgeOffer ? (
              <CommitmentBridgeOffer
                title={unifiedTexts.COMMITMENT_BRIDGE_TITLE_HABIT}
                subtitle={unifiedTexts.COMMITMENT_BRIDGE_SUBTITLE}
                saveLabel={unifiedTexts.COMMITMENT_BRIDGE_SAVE}
                dismissLabel={unifiedTexts.COMMITMENT_BRIDGE_DISMISS}
                saving={commitmentBridgeSaving}
                onSave={handleCommitmentBridgeSave}
                onDismiss={handleCommitmentBridgeDismiss}
              />
            ) : null}
            {embedded ? (
              <>
                <HabitsProgressSummaryCard
                  completed={habitsProgress.completed}
                  total={habitsProgress.total}
                  pending={habitsProgress.pending}
                  maxStreak={habitsProgress.maxStreak}
                />
                <GratitudeJournalPromoCard />
                <HabitsFrequencyFilters
                  value={frequencyFilter}
                  onChange={setFrequencyFilter}
                />
              </>
            ) : (
              <>
                <View style={styles.countRow}>
                  <Text style={styles.countText}>
                    {filterType === 'active'
                      ? `${habitsCount.active} ${T.COUNT_ACTIVE_SUFFIX}`
                      : `${habitsCount.archived} ${T.COUNT_ARCHIVED_SUFFIX}`}
                  </Text>
                </View>
                {filterType === 'active' ? (
                  <View style={styles.summaryRow}>
                    <View style={styles.summaryPill}>
                      <Text style={styles.summaryPillLabel}>{T.SUMMARY_PENDING}</Text>
                      <Text style={styles.summaryPillValue}>{pendingTodayCount}</Text>
                    </View>
                    <View style={styles.summaryPill}>
                      <Text style={styles.summaryPillLabel}>{T.SUMMARY_COMPLETED_TODAY}</Text>
                      <Text style={styles.summaryPillValue}>{completedTodayCount}</Text>
                    </View>
                  </View>
                ) : null}
              </>
            )}
          </View>
        ) : null
      }
    />
  );

  return (
    <View style={styles.container}>
      <SafeAreaView
        style={styles.safeAreaContent}
        edges={embedded ? ['left', 'right'] : ['top', 'left', 'right']}
      >
        {!embedded ? (
          <HabitsScreenHeader
            filterType={filterType}
            onFilterChange={handleFilterChange}
            counts={habitsCount}
            searchQuery={searchQuery}
            onSearch={handleSearchChange}
          />
        ) : null}
        {error ? (
          <HabitsErrorView errorMessage={error} onRetry={() => loadHabits()} />
        ) : (
          listContent
        )}
      </SafeAreaView>
      <BrandGradientFab
        bottom={insets.bottom + FAB_BOTTOM}
        onPress={openModal}
        accessibilityLabel={translated?.CREATE_BUTTON || 'Crear hábito'}
      />
      <CreateHabitModal
        visible={modalVisible}
        onClose={handleHabitModalClose}
        onSubmit={handleAddHabit}
        formData={formData}
        setFormData={setFormData}
        initialReminderIso={habitModalReminderIso}
      />
      {!embedded ? <FloatingNavBar /> : null}
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
      paddingTop: SPACING.xs,
      paddingBottom: LIST_PADDING_BOTTOM,
    },
    listHeaderWrap: {
      marginBottom: 8,
    },
    countRow: {
      marginBottom: 10,
      paddingVertical: SPACING.sm,
      paddingHorizontal: SPACING.CHIP_INSET,
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
      gap: SPACING.sm,
    },
    summaryPill: {
      flex: 1,
      backgroundColor: pillBg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      borderRadius: 12,
      paddingVertical: SPACING.sm,
      paddingHorizontal: SPACING.CHIP_INSET_COMPACT,
    },
    summaryPillLabel: {
      color: colors.textSecondary,
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
      paddingVertical: SPACING.sm,
      paddingHorizontal: SPACING.CHIP_INSET_COMPACT,
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
      fontSize: 14,
      fontWeight: '600',
      letterSpacing: -0.1,
      color: colors.text,
    },
    sectionCountPill: {
      minWidth: 24,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: SPACING.sm,
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
      paddingTop: SPACING.HERO_INSET + SPACING.CHIP_INSET,
      gap: SPACING.sm,
    },
    searchEmptyTitle: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '600',
    },
    searchEmptyText: {
      color: colors.textSecondary,
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
