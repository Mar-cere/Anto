/**
 * Pantalla de gestión de hábitos
 *
 * Permite ver, crear, completar, archivar y eliminar hábitos.
 * Lógica en useHabitsScreen; UI en HabitsScreenHeader, SwipeableHabitItem, HabitsErrorView, HabitsEmptyView.
 *
 * @author AntoApp Team
 */

import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import {
  FlatList,
  RefreshControl,
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
import { useHabitsScreen } from '../hooks/useHabitsScreen';
import {
  COLORS,
  FLATLIST_INITIAL_NUM_TO_RENDER,
  FLATLIST_MAX_TO_RENDER_PER_BATCH,
  FLATLIST_WINDOW_SIZE,
  LIST_PADDING,
  LIST_PADDING_BOTTOM,
  FAB_BORDER_RADIUS,
  FAB_BOTTOM,
  FAB_RIGHT,
  FAB_SIZE,
  ICON_SIZE,
} from './habits/habitsScreenConstants';

export default function HabitsScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const {
    habits,
    modalVisible,
    setModalVisible,
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
    resetForm,
    openModal,
    handleHabitModalClose,
    habitModalReminderIso,
  } = useHabitsScreen({ route, navigation });

  const showSkeleton = loading && !error && habits.length === 0;
  const habitsCount = {
    active: habits.filter((h) => !h?.status?.archived).length,
    archived: habits.filter((h) => h?.status?.archived).length,
  };

  const renderItem = ({ item }) => {
    if (showSkeleton) return <SkeletonCard />;
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

  const listContent = (
    <FlatList
      data={
        showSkeleton
          ? Array.from({ length: 6 }, (_, i) => ({ _id: `skeleton-${i}` }))
          : habits
      }
      renderItem={renderItem}
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
          colors={[COLORS.REFRESH_COLOR]}
          tintColor={COLORS.REFRESH_COLOR}
        />
      }
      ListEmptyComponent={
        !loading ? (
          <HabitsEmptyView filterType={filterType} onCreateFirst={openModal} />
        ) : null
      }
      ListHeaderComponent={
        !showSkeleton ? (
          <View style={styles.countRow}>
            <Text style={styles.countText}>
              {filterType === 'active'
                ? `${habitsCount.active} activos`
                : `${habitsCount.archived} archivados`}
            </Text>
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
          onFilterChange={setFilterType}
          counts={habitsCount}
        />
        {error ? (
          <HabitsErrorView errorMessage={error} onRetry={() => loadHabits()} />
        ) : (
          listContent
        )}
      </SafeAreaView>
      <TouchableOpacity style={[styles.fab, { bottom: insets.bottom + FAB_BOTTOM }]} onPress={openModal}>
        <MaterialCommunityIcons name="plus" size={ICON_SIZE} color={COLORS.WHITE} />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  safeAreaContent: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  listContainer: {
    flexGrow: 1,
    padding: LIST_PADDING,
    paddingBottom: LIST_PADDING_BOTTOM,
  },
  countRow: {
    marginBottom: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  countText: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 13,
    fontWeight: '500',
  },
  fab: {
    position: 'absolute',
    right: FAB_RIGHT,
    bottom: FAB_BOTTOM,
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_BORDER_RADIUS,
    backgroundColor: COLORS.PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: COLORS.PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});
