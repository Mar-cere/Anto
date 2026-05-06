/**
 * Pantalla de Pomodoro
 *
 * Gestión de sesiones trabajo/descanso/meditación e integración con tareas pendientes (API).
 * Lógica en usePomodoroScreen; UI en subcomponentes (Header, TimerSection, Controls, PendingTasksSection, CustomTimerModal).
 *
 * @author AntoApp Team
 */

import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import CustomTimerModal from '../components/pomodoro/CustomTimerModal';
import PomodoroControls from '../components/pomodoro/PomodoroControls';
import PomodoroScreenHeader from '../components/pomodoro/PomodoroScreenHeader';
import PomodoroPendingTasksSection from '../components/pomodoro/PomodoroPendingTasksSection';
import PomodoroTimerSection from '../components/pomodoro/PomodoroTimerSection';
import FloatingNavBar from '../components/FloatingNavBar';
import { usePomodoroScreen } from '../hooks/usePomodoroScreen';
import {
  COLORS,
  CONTAINER_PADDING_BOTTOM,
  CONTENT_PADDING,
  TEXTS,
} from './pomodoro/pomodoroScreenConstants';
import { FOCUS_BORDER_SUBTLE, FOCUS_KICKER_COLOR, FOCUS_META } from '../styles/focusCardTheme';

export default function PomodoroScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const {
    modes,
    isActive,
    timeLeft,
    mode,
    progressAnimation,
    pendingTasks,
    pendingTasksLoading,
    pendingTasksError,
    loadPendingTasks,
    focusTask,
    focusingTaskId,
    startFocusFromPendingTask,
    customTimeModalVisible,
    setCustomTimeModalVisible,
    customMinutes,
    setCustomMinutes,
    prepTimeEnabled,
    setPrepTimeEnabled,
    prepTime,
    setPrepTime,
    quickPresets,
    toggleTimer,
    applyQuickPreset,
    resetTimer,
    changeMode,
    primaryActionLabel,
    formatTime,
    buttonsOpacity,
    buttonsScale,
    mainControlsPosition,
    isMeditating,
    navBarAnim,
    fadeAnim,
    handleCustomTimerConfirm,
    dailyGoal,
    sessionsToday,
    summaryVisible,
    setSummaryVisible,
    summaryData,
    summaryActionBusy,
    completeLinkedTask,
    exitGuardEnabled,
  } = usePomodoroScreen();

  const [listRefreshing, setListRefreshing] = useState(false);

  const summaryBackdropOp = useRef(new Animated.Value(0)).current;
  const summaryCardScale = useRef(new Animated.Value(0.94)).current;
  const summaryCardTranslateY = useRef(new Animated.Value(14)).current;

  useEffect(() => {
    if (!summaryVisible) {
      summaryBackdropOp.setValue(0);
      summaryCardScale.setValue(0.94);
      summaryCardTranslateY.setValue(14);
      return undefined;
    }
    summaryBackdropOp.setValue(0);
    summaryCardScale.setValue(0.94);
    summaryCardTranslateY.setValue(14);
    const anim = Animated.parallel([
      Animated.timing(summaryBackdropOp, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(summaryCardScale, {
        toValue: 1,
        friction: 8,
        tension: 78,
        useNativeDriver: true,
      }),
      Animated.timing(summaryCardTranslateY, {
        toValue: 0,
        duration: 240,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);
    anim.start();
    return () => anim.stop();
  }, [summaryVisible]);

  const handleRefreshList = useCallback(async () => {
    setListRefreshing(true);
    try {
      await loadPendingTasks();
    } finally {
      setListRefreshing(false);
    }
  }, [loadPendingTasks]);

  useFocusEffect(
    useCallback(() => {
      loadPendingTasks();
    }, [loadPendingTasks])
  );

  const handleSeeAllTasks = useCallback(() => {
    navigation.navigate('Tasks');
  }, [navigation]);

  const handleOpenPendingTask = useCallback(
    (item) => {
      navigation.navigate('Tasks', {
        screen: 'TaskDetails',
        params: {
          taskId: item._id,
          task: item,
          mode: 'view',
          itemType: item.itemType || 'task',
        },
      });
    },
    [navigation]
  );

  const handleOpenSummaryLinkedTask = useCallback(() => {
    const id = summaryData.linkedTaskId;
    if (!id || summaryActionBusy) return;
    setSummaryVisible(false);
    navigation.navigate('Tasks', {
      screen: 'TaskDetails',
      params: {
        taskId: id,
        task: {
          _id: id,
          title: summaryData.linkedTaskTitle,
          itemType: 'task',
        },
        mode: 'view',
        itemType: 'task',
      },
    });
  }, [
    navigation,
    setSummaryVisible,
    summaryActionBusy,
    summaryData.linkedTaskId,
    summaryData.linkedTaskTitle,
  ]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (event) => {
      if (!isActive || !exitGuardEnabled) return;
      event.preventDefault();
      Alert.alert(TEXTS.EXIT_GUARD_TITLE, TEXTS.EXIT_GUARD_MESSAGE, [
        { text: TEXTS.EXIT_GUARD_STAY, style: 'cancel' },
        {
          text: TEXTS.EXIT_GUARD_LEAVE,
          style: 'destructive',
          onPress: () => {
            unsubscribe();
            navigation.dispatch(event.data.action);
          },
        },
      ]);
    });
    return unsubscribe;
  }, [navigation, isActive, exitGuardEnabled]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <PomodoroScreenHeader
        mode={mode}
        isActive={isActive}
        focusTaskTitle={focusTask?.title || ''}
        pendingTasksCount={pendingTasks.length}
      />
      <View style={styles.container}>
        <ScrollView
          style={styles.content}
          contentContainerStyle={{ paddingBottom: insets.bottom + CONTAINER_PADDING_BOTTOM }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={listRefreshing}
              onRefresh={handleRefreshList}
              colors={[COLORS.PRIMARY]}
              tintColor={COLORS.PRIMARY}
            />
          }
        >
          <View style={styles.goalCard}>
            <View style={styles.goalHeader}>
              <Text style={styles.goalTitle}>
                {TEXTS.DAILY_GOAL}: {sessionsToday}/{dailyGoal} pomodoros
              </Text>
              <Text style={styles.goalPct}>
                {Math.min(100, Math.round((sessionsToday / dailyGoal) * 100))}%
              </Text>
            </View>
            <View style={styles.goalTrack}>
              <View
                style={[
                  styles.goalFill,
                  { width: `${Math.min(100, (sessionsToday / dailyGoal) * 100)}%` },
                ]}
              />
            </View>
          </View>
          <PomodoroTimerSection
            mode={mode}
            modes={modes}
            timeLeft={timeLeft}
            formatTime={formatTime}
            progressAnimation={progressAnimation}
            fadeAnim={fadeAnim}
            isMeditating={isMeditating}
            density="compact"
          />
          <PomodoroControls
            mode={mode}
            modes={modes}
            isActive={isActive}
            currentWorkSeconds={modes.work.time}
            currentBreakSeconds={modes.break.time}
            density="compact"
            toggleTimer={toggleTimer}
            resetTimer={resetTimer}
            changeMode={changeMode}
            onOpenCustomModal={() => setCustomTimeModalVisible(true)}
            buttonsOpacity={buttonsOpacity}
            buttonsScale={buttonsScale}
            mainControlsPosition={mainControlsPosition}
            quickPresets={quickPresets}
            applyQuickPreset={applyQuickPreset}
            primaryActionLabel={primaryActionLabel}
          />
          <PomodoroPendingTasksSection
            tasks={pendingTasks}
            loading={pendingTasksLoading}
            error={pendingTasksError}
            onRetry={loadPendingTasks}
            onFocusTask={startFocusFromPendingTask}
            onOpenTask={handleOpenPendingTask}
            onSeeAllTasks={handleSeeAllTasks}
            focusTaskId={focusTask?._id}
            focusingTaskId={focusingTaskId}
            density="compact"
          />
        </ScrollView>
        <CustomTimerModal
          visible={customTimeModalVisible}
          onClose={() => setCustomTimeModalVisible(false)}
          customMinutes={customMinutes}
          setCustomMinutes={setCustomMinutes}
          prepTimeEnabled={prepTimeEnabled}
          setPrepTimeEnabled={setPrepTimeEnabled}
          prepTime={prepTime}
          setPrepTime={setPrepTime}
          onConfirm={handleCustomTimerConfirm}
        />
        <Modal
          visible={summaryVisible}
          transparent
          animationType="none"
          onRequestClose={() => {
            if (!summaryActionBusy) setSummaryVisible(false);
          }}
        >
          <View style={styles.summaryOverlay}>
            <TouchableWithoutFeedback
              onPress={() => {
                if (!summaryActionBusy) setSummaryVisible(false);
              }}
              accessibilityRole="button"
              accessibilityLabel={TEXTS.SUMMARY_DISMISS_HINT}
            >
              <Animated.View
                style={[styles.summaryBackdrop, { opacity: summaryBackdropOp }]}
                collapsable={false}
              />
            </TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.summaryCard,
                {
                  transform: [
                    { scale: summaryCardScale },
                    { translateY: summaryCardTranslateY },
                  ],
                },
              ]}
            >
              <View style={styles.summaryHero}>
                <View style={styles.summaryIconWrap}>
                  <MaterialCommunityIcons name="check-decagram" size={36} color={COLORS.PRIMARY} />
                </View>
                <Text style={styles.summaryTitle}>{TEXTS.SUMMARY_TITLE}</Text>
                <Text style={styles.summarySubtitle}>{TEXTS.SUMMARY_SUBTITLE}</Text>
              </View>
              <View style={styles.summaryMetricsRow}>
                <View style={styles.metricCard}>
                  <MaterialCommunityIcons name="clock-check-outline" size={18} color={FOCUS_KICKER_COLOR} />
                  <Text style={styles.metricValue}>{summaryData.focusedMinutes} min</Text>
                  <Text style={styles.metricLabel}>{TEXTS.SUMMARY_FOCUS_TIME}</Text>
                </View>
                <View style={styles.metricCard}>
                  <MaterialCommunityIcons
                    name={summaryData.linkedTaskTitle ? 'bookmark-outline' : 'minus'}
                    size={18}
                    color={FOCUS_KICKER_COLOR}
                  />
                  <Text style={styles.metricValue} numberOfLines={2}>
                    {summaryData.linkedTaskTitle || '—'}
                  </Text>
                  <Text style={styles.metricLabel}>{TEXTS.SUMMARY_LINKED_TASK}</Text>
                </View>
              </View>
              <View style={styles.streakRow}>
                <View style={styles.streakInnerRow}>
                  <MaterialCommunityIcons name="fire" size={16} color={FOCUS_KICKER_COLOR} />
                  <Text style={styles.summaryLine}>
                    {TEXTS.SUMMARY_STREAK}: {summaryData.streakDays} d
                  </Text>
                </View>
                {summaryData.linkedTaskId && summaryData.sessionBlockMinutes > 0 ? (
                  <View style={styles.streakInnerRow}>
                    <MaterialCommunityIcons name="chart-timeline-variant" size={16} color={FOCUS_META} />
                    <Text style={[styles.summaryLine, styles.summaryLoggedLine]}>
                      {TEXTS.SUMMARY_TIME_LOGGED.replace(
                        '{n}',
                        String(summaryData.sessionBlockMinutes)
                      )}
                    </Text>
                  </View>
                ) : null}
              </View>
              {summaryData.linkedTaskId ? (
                <View style={styles.summaryLinkedActions}>
                  <TouchableOpacity
                    style={styles.summaryButtonSuccess}
                    onPress={() => completeLinkedTask(summaryData.linkedTaskId)}
                    disabled={summaryActionBusy}
                  >
                    {summaryActionBusy ? (
                      <ActivityIndicator color={COLORS.WHITE} size="small" />
                    ) : (
                      <>
                        <MaterialCommunityIcons name="check-circle-outline" size={20} color={COLORS.WHITE} />
                        <Text style={styles.summaryButtonTextInline}>{TEXTS.SUMMARY_MARK_TASK_DONE}</Text>
                      </>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.summaryButtonSecondary}
                    onPress={handleOpenSummaryLinkedTask}
                    disabled={summaryActionBusy}
                  >
                    <MaterialCommunityIcons name="open-in-app" size={18} color="rgba(255,255,255,0.92)" />
                    <Text style={styles.summaryButtonSecondaryText}>{TEXTS.SUMMARY_OPEN_TASK}</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
              <Text style={styles.summaryDismissHint}>{TEXTS.SUMMARY_DISMISS_HINT}</Text>
              <TouchableOpacity
                style={styles.summaryButton}
                onPress={() => {
                  if (!summaryActionBusy) setSummaryVisible(false);
                }}
                disabled={summaryActionBusy}
              >
                <Text style={styles.summaryButtonText}>{TEXTS.SUMMARY_CLOSE}</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </Modal>
      </View>
      <FloatingNavBar activeTab="pomodoro" animValues={navBarAnim} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  content: {
    flex: 1,
    padding: CONTENT_PADDING,
  },
  goalCard: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: FOCUS_BORDER_SUBTLE,
    borderRadius: 14,
    backgroundColor: COLORS.CARD_BACKGROUND,
    padding: 12,
    marginBottom: 10,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalTitle: {
    color: 'rgba(255,255,255,0.94)',
    fontSize: 14,
    fontWeight: '600',
  },
  goalPct: {
    color: FOCUS_KICKER_COLOR,
    fontSize: 12,
    fontWeight: '600',
  },
  goalTrack: {
    marginTop: 8,
    height: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  goalFill: {
    height: '100%',
    backgroundColor: COLORS.PRIMARY,
  },
  summaryOverlay: {
    flex: 1,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  summaryBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  summaryCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 20,
    backgroundColor: COLORS.MODAL_BACKGROUND,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: FOCUS_BORDER_SUBTLE,
    padding: 20,
    zIndex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 12,
  },
  summaryHero: {
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: 'rgba(26, 221, 219, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(26, 221, 219, 0.22)',
  },
  summaryTitle: {
    color: 'rgba(255,255,255,0.94)',
    fontSize: 19,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  summarySubtitle: {
    marginTop: 6,
    color: FOCUS_META,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  summaryLine: {
    color: FOCUS_META,
    fontSize: 14,
  },
  summaryMetricsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  metricCard: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: FOCUS_BORDER_SUBTLE,
    gap: 6,
  },
  metricValue: {
    color: 'rgba(255,255,255,0.95)',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 0,
  },
  metricLabel: {
    color: FOCUS_META,
    fontSize: 11,
    fontWeight: '500',
  },
  streakRow: {
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: FOCUS_BORDER_SUBTLE,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 6,
    gap: 10,
  },
  streakInnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  summaryLoggedLine: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
  },
  summaryLinkedActions: {
    gap: 10,
    marginTop: 8,
  },
  summaryDismissHint: {
    textAlign: 'center',
    color: FOCUS_META,
    fontSize: 11,
    marginTop: 10,
    marginBottom: 4,
  },
  summaryButton: {
    marginTop: 6,
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  summaryButtonSecondary: {
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: FOCUS_BORDER_SUBTLE,
  },
  summaryButtonSecondaryText: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 14,
    fontWeight: '600',
  },
  summaryButtonSuccess: {
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.SUCCESS,
    minHeight: 52,
  },
  summaryButtonText: {
    color: COLORS.WHITE,
    fontSize: 15,
    fontWeight: '600',
  },
  summaryButtonTextInline: {
    color: COLORS.WHITE,
    fontSize: 15,
    fontWeight: '700',
  },
});
