/**
 * Item de hábito con swipe para archivar/eliminar.
 * @author AntoApp Team
 */

import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useRef } from 'react';
import {
  Alert,
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import {
  ACTION_BUTTON_BORDER_RADIUS,
  ACTION_BUTTON_GAP,
  ACTION_BUTTON_MARGIN_HORIZONTAL,
  ACTION_BUTTON_PADDING_RIGHT,
  ACTION_BUTTON_PADDING_VERTICAL,
  ACTION_BUTTON_PADDING_HORIZONTAL,
  ACTION_BUTTON_WIDTH,
  ACTION_ICON_SIZE,
  ACTIVE_OFFSET_X,
  ACTIVE_OFFSET_Y,
  ANIMATION_FINAL_OPACITY,
  ANIMATION_INITIAL_OPACITY,
  ARCHIVE_BUTTON_MARGIN_LEFT,
  CARD_BORDER_RADIUS,
  CARD_BORDER_WIDTH,
  CARD_GAP,
  CARD_PADDING,
  CARD_FOOTER_MARGIN_TOP,
  COLORS,
  COMPLETE_BUTTON_BORDER_RADIUS,
  COMPLETE_BUTTON_SIZE,
  DELAY_COMPLETE_PRESS_IN,
  DELAY_PRESS_IN,
  DELETE_ANIMATION_DURATION,
  DELETE_DISTANCE,
  FREQUENCY_TYPES,
  HABIT_ICONS,
  HIT_SLOP_SIZE,
  ICON_CONTAINER_BORDER_RADIUS,
  ICON_CONTAINER_SIZE,
  ICON_SIZE,
  PROGRESS_ICON_SIZE,
  PROGRESS_INDICATOR_BORDER_RADIUS,
  PROGRESS_INDICATOR_BORDER_WIDTH,
  PROGRESS_INDICATOR_PADDING_HORIZONTAL,
  PROGRESS_INDICATOR_PADDING_VERTICAL,
  PROGRESS_INDICATOR_RIGHT,
  PROGRESS_MAX_DISTANCE,
  PROGRESS_TEXT_MARGIN_TOP,
  STAT_GAP,
  STAT_ICON_SIZE,
  STAT_ITEM_GAP,
  SWIPE_ANIMATION_DURATION,
  SWIPE_DISTANCE,
  SWIPE_THRESHOLD,
  TEXTS,
} from '../../screens/habits/habitsScreenConstants';

const ACTIVE_OPACITY = 0.7;

export default function SwipeableHabitItem({
  item,
  onPress,
  onComplete,
  onDelete,
  onArchive,
}) {
  const translateX = useRef(new Animated.Value(0)).current;
  const deleteOpacity = useRef(new Animated.Value(ANIMATION_INITIAL_OPACITY)).current;
  const archiveOpacity = useRef(new Animated.Value(ANIMATION_INITIAL_OPACITY)).current;
  const progressOpacity = useRef(new Animated.Value(ANIMATION_INITIAL_OPACITY)).current;

  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX } }],
    {
      useNativeDriver: true,
      listener: (event) => {
        const { translationX } = event.nativeEvent;
        if (translationX < SWIPE_THRESHOLD) {
          const progress = Math.min(1, Math.abs(translationX) / PROGRESS_MAX_DISTANCE);
          progressOpacity.setValue(progress);
        } else {
          progressOpacity.setValue(ANIMATION_INITIAL_OPACITY);
        }
      },
    }
  );

  const onHandlerStateChange = (event) => {
    const { oldState, translationX } = event.nativeEvent;
    if (oldState === State.ACTIVE) {
      if (translationX < SWIPE_THRESHOLD) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        Animated.parallel([
          Animated.timing(translateX, {
            toValue: SWIPE_DISTANCE,
            duration: SWIPE_ANIMATION_DURATION,
            useNativeDriver: true,
          }),
          Animated.timing(deleteOpacity, {
            toValue: ANIMATION_FINAL_OPACITY,
            duration: SWIPE_ANIMATION_DURATION,
            useNativeDriver: true,
          }),
          Animated.timing(archiveOpacity, {
            toValue: ANIMATION_FINAL_OPACITY,
            duration: SWIPE_ANIMATION_DURATION,
            useNativeDriver: true,
          }),
          Animated.timing(progressOpacity, {
            toValue: ANIMATION_INITIAL_OPACITY,
            duration: SWIPE_ANIMATION_DURATION,
            useNativeDriver: true,
          }),
        ]).start();
      } else {
        resetPosition();
      }
    }
  };

  const resetPosition = () => {
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: 0,
        duration: SWIPE_ANIMATION_DURATION,
        useNativeDriver: true,
      }),
      Animated.timing(deleteOpacity, {
        toValue: ANIMATION_INITIAL_OPACITY,
        duration: SWIPE_ANIMATION_DURATION,
        useNativeDriver: true,
      }),
      Animated.timing(archiveOpacity, {
        toValue: ANIMATION_INITIAL_OPACITY,
        duration: SWIPE_ANIMATION_DURATION,
        useNativeDriver: true,
      }),
      Animated.timing(progressOpacity, {
        toValue: ANIMATION_INITIAL_OPACITY,
        duration: SWIPE_ANIMATION_DURATION,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleDelete = () => {
    Alert.alert(
      TEXTS.DELETE_CONFIRM_TITLE,
      TEXTS.DELETE_CONFIRM_MESSAGE,
      [
        { text: TEXTS.CANCEL, style: 'cancel', onPress: resetPosition },
        {
          text: TEXTS.DELETE,
          style: 'destructive',
          onPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            Animated.timing(translateX, {
              toValue: DELETE_DISTANCE,
              duration: DELETE_ANIMATION_DURATION,
              useNativeDriver: true,
            }).start(() => onDelete(item._id));
          },
        },
      ]
    );
  };

  const handleArchive = () => {
    const isArchived = item.status?.archived;
    const action = isArchived ? TEXTS.UNARCHIVE : TEXTS.ARCHIVE;
    const actionCapitalized = action.charAt(0).toUpperCase() + action.slice(1);
    const confirmTitle = isArchived ? TEXTS.UNARCHIVE_CONFIRM : TEXTS.ARCHIVE_CONFIRM;
    Alert.alert(
      confirmTitle,
      `¿Estás seguro de que deseas ${action} este hábito?`,
      [
        { text: TEXTS.CANCEL, style: 'cancel', onPress: resetPosition },
        {
          text: actionCapitalized,
          onPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            Animated.timing(translateX, {
              toValue: DELETE_DISTANCE,
              duration: DELETE_ANIMATION_DURATION,
              useNativeDriver: true,
            }).start(() => {
              onArchive(item._id);
              resetPosition();
            });
          },
        },
      ]
    );
  };

  return (
    <View style={styles.swipeableContainer}>
      <Animated.View style={[styles.progressIndicator, { opacity: progressOpacity }]}>
        <MaterialCommunityIcons name="chevron-left" size={PROGRESS_ICON_SIZE} color={COLORS.PRIMARY} />
        <Text style={styles.progressText}>{TEXTS.PROGRESS_HINT}</Text>
      </Animated.View>

      <View style={styles.actionButtons}>
        <Animated.View style={[styles.actionButton, { opacity: archiveOpacity }]}>
          <TouchableOpacity
            style={[styles.actionButtonContent, styles.archiveButton]}
            onPress={handleArchive}
            disabled={item.status?.archived}
          >
            <MaterialCommunityIcons name="archive" size={ACTION_ICON_SIZE} color={COLORS.WHITE} />
          </TouchableOpacity>
        </Animated.View>
        <Animated.View style={[styles.actionButton, { opacity: deleteOpacity }]}>
          <TouchableOpacity
            style={[styles.actionButtonContent, styles.deleteButton]}
            onPress={handleDelete}
          >
            <MaterialCommunityIcons name="delete" size={ACTION_ICON_SIZE} color={COLORS.WHITE} />
          </TouchableOpacity>
        </Animated.View>
      </View>

      <PanGestureHandler
        onGestureEvent={onGestureEvent}
        onHandlerStateChange={onHandlerStateChange}
        activeOffsetX={ACTIVE_OFFSET_X}
        activeOffsetY={ACTIVE_OFFSET_Y}
        shouldCancelWhenOutside={false}
        simultaneousHandlers={[]}
        waitFor={[]}
      >
        <Animated.View
          style={[
            styles.habitCard,
            item.status?.archived && styles.archivedHabitCard,
            { transform: [{ translateX }] },
          ]}
        >
          <TouchableOpacity
            style={styles.habitContent}
            onPress={onPress}
            activeOpacity={ACTIVE_OPACITY}
            delayPressIn={DELAY_PRESS_IN}
          >
            <View style={styles.habitHeader}>
              <View style={styles.habitTitleContainer}>
                <View
                  style={[
                    styles.iconContainer,
                    item.status?.archived && styles.archivedIconContainer,
                  ]}
                >
                  <MaterialCommunityIcons
                    name={HABIT_ICONS[item.icon] || 'circle'}
                    size={ICON_SIZE}
                    color={item.status?.archived ? COLORS.ACCENT : COLORS.PRIMARY}
                  />
                </View>
                <View style={styles.habitInfo}>
                  <Text style={styles.habitTitle}>{item.title}</Text>
                  {item.description ? (
                    <Text style={styles.habitDescription} numberOfLines={2}>
                      {item.description}
                    </Text>
                  ) : null}
                </View>
              </View>
              <TouchableOpacity
                onPress={() => onComplete(item._id)}
                style={[
                  styles.completeButton,
                  item.status?.completedToday && styles.completedButton,
                ]}
                disabled={item.status?.archived}
                delayPressIn={DELAY_COMPLETE_PRESS_IN}
                hitSlop={{
                  top: HIT_SLOP_SIZE,
                  bottom: HIT_SLOP_SIZE,
                  left: HIT_SLOP_SIZE,
                  right: HIT_SLOP_SIZE,
                }}
              >
                <MaterialCommunityIcons
                  name={item.status?.completedToday ? 'check-circle' : 'circle-outline'}
                  size={28}
                  color={item.status?.completedToday ? COLORS.SUCCESS : COLORS.ACCENT}
                />
              </TouchableOpacity>
            </View>
            <View style={styles.habitFooter}>
              <View style={styles.habitStats}>
                <View style={styles.statItem}>
                  <MaterialCommunityIcons name="fire" size={STAT_ICON_SIZE} color={COLORS.WARNING} />
                  <Text style={styles.statText}>
                    {TEXTS.STREAK} {item.progress?.streak || 0}
                    {item.progress?.bestStreak > 0 &&
                      ` (${TEXTS.BEST_STREAK} ${item.progress.bestStreak})`}
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <MaterialCommunityIcons
                    name="calendar-check"
                    size={STAT_ICON_SIZE}
                    color={COLORS.INFO}
                  />
                  <Text style={styles.statText}>
                    {item.progress?.completedDays || 0}/{item.progress?.totalDays || 0} {TEXTS.DAYS}
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <MaterialCommunityIcons
                    name={
                      item.frequency === FREQUENCY_TYPES.DAILY ? 'repeat' : 'calendar-week'
                    }
                    size={STAT_ICON_SIZE}
                    color={COLORS.PRIMARY}
                  />
                  <Text style={styles.statText}>
                    {item.frequency === FREQUENCY_TYPES.DAILY ? TEXTS.DAILY : TEXTS.WEEKLY}
                  </Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
}

const styles = StyleSheet.create({
  swipeableContainer: {
    position: 'relative',
    marginBottom: 12,
    width: '100%',
  },
  progressIndicator: {
    position: 'absolute',
    right: PROGRESS_INDICATOR_RIGHT,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
    backgroundColor: COLORS.PROGRESS_INDICATOR_BACKGROUND,
    borderRadius: PROGRESS_INDICATOR_BORDER_RADIUS,
    paddingHorizontal: PROGRESS_INDICATOR_PADDING_HORIZONTAL,
    paddingVertical: PROGRESS_INDICATOR_PADDING_VERTICAL,
    borderWidth: PROGRESS_INDICATOR_BORDER_WIDTH,
    borderColor: COLORS.PROGRESS_INDICATOR_BORDER,
    shadowColor: COLORS.PRIMARY,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  progressText: {
    color: COLORS.PRIMARY,
    fontSize: 11,
    fontWeight: '600',
    marginTop: PROGRESS_TEXT_MARGIN_TOP,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  actionButtons: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1,
    paddingRight: ACTION_BUTTON_PADDING_RIGHT,
    gap: ACTION_BUTTON_GAP,
  },
  actionButton: {
    width: ACTION_BUTTON_WIDTH,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: ACTION_BUTTON_MARGIN_HORIZONTAL,
    borderRadius: ACTION_BUTTON_BORDER_RADIUS,
    overflow: 'hidden',
  },
  actionButtonContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: ACTION_BUTTON_BORDER_RADIUS,
    marginHorizontal: ACTION_BUTTON_MARGIN_HORIZONTAL,
    paddingVertical: ACTION_BUTTON_PADDING_VERTICAL,
    paddingHorizontal: ACTION_BUTTON_PADDING_HORIZONTAL,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  archiveButton: {
    backgroundColor: COLORS.ARCHIVE,
    marginLeft: ARCHIVE_BUTTON_MARGIN_LEFT,
  },
  deleteButton: {
    backgroundColor: COLORS.DELETE,
  },
  habitCard: {
    backgroundColor: COLORS.CARD_BACKGROUND,
    borderRadius: CARD_BORDER_RADIUS,
    padding: CARD_PADDING,
    gap: CARD_GAP,
    borderWidth: CARD_BORDER_WIDTH,
    borderColor: COLORS.CARD_BORDER,
    width: '100%',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  archivedHabitCard: {
    backgroundColor: COLORS.CARD_ARCHIVED_BACKGROUND,
    borderColor: COLORS.CARD_ARCHIVED_BORDER,
  },
  habitContent: { flex: 1 },
  habitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  habitTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconContainer: {
    width: ICON_CONTAINER_SIZE,
    height: ICON_CONTAINER_SIZE,
    borderRadius: ICON_CONTAINER_BORDER_RADIUS,
    backgroundColor: COLORS.ICON_BACKGROUND,
    justifyContent: 'center',
    alignItems: 'center',
  },
  archivedIconContainer: {
    backgroundColor: COLORS.ICON_ARCHIVED_BACKGROUND,
  },
  habitInfo: { flex: 1, gap: 4 },
  habitTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.WHITE,
  },
  habitDescription: {
    fontSize: 14,
    color: COLORS.ACCENT,
  },
  habitFooter: { marginTop: CARD_FOOTER_MARGIN_TOP },
  habitStats: { flexDirection: 'row', gap: STAT_GAP },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: STAT_ITEM_GAP,
  },
  statText: {
    fontSize: 12,
    color: COLORS.ACCENT,
  },
  completeButton: {
    width: COMPLETE_BUTTON_SIZE,
    height: COMPLETE_BUTTON_SIZE,
    borderRadius: COMPLETE_BUTTON_BORDER_RADIUS,
    backgroundColor: COLORS.COMPLETE_BUTTON_BACKGROUND,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedButton: {
    backgroundColor: COLORS.COMPLETE_BUTTON_COMPLETED_BACKGROUND,
  },
});
