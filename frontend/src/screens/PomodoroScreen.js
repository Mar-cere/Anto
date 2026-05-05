/**
 * Pantalla de Pomodoro
 *
 * Gestión de sesiones trabajo/descanso/meditación y tareas de sesión.
 * Lógica en usePomodoroScreen; UI en subcomponentes (Header, TimerSection, Controls, TasksSection, CustomTimerModal).
 *
 * @author AntoApp Team
 */

import React, { useEffect } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import CustomTimerModal from '../components/pomodoro/CustomTimerModal';
import PomodoroControls from '../components/pomodoro/PomodoroControls';
import PomodoroScreenHeader from '../components/pomodoro/PomodoroScreenHeader';
import PomodoroTasksSection from '../components/pomodoro/PomodoroTasksSection';
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
    inputText,
    setInputText,
    tasks,
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
    handleAddTask,
    toggleTask,
    deleteTask,
    clearCompletedTasks,
    completedTasksCount,
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
    exitGuardEnabled,
  } = usePomodoroScreen();

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
        completedTasksCount={completedTasksCount}
        totalTasks={tasks.length}
      />
      <View style={styles.container}>
        <ScrollView
          style={styles.content}
          contentContainerStyle={{ paddingBottom: insets.bottom + CONTAINER_PADDING_BOTTOM }}
          showsVerticalScrollIndicator={false}
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
          <PomodoroTasksSection
            tasks={tasks}
            inputText={inputText}
            setInputText={setInputText}
            handleAddTask={handleAddTask}
            toggleTask={toggleTask}
            deleteTask={deleteTask}
            clearCompletedTasks={clearCompletedTasks}
            completedTasksCount={completedTasksCount}
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
          animationType="fade"
          onRequestClose={() => setSummaryVisible(false)}
        >
          <View style={styles.summaryOverlay}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>{TEXTS.SUMMARY_TITLE}</Text>
              <View style={styles.summaryMetricsRow}>
                <View style={styles.metricCard}>
                  <Text style={styles.metricValue}>{summaryData.focusedMinutes} min</Text>
                  <Text style={styles.metricLabel}>{TEXTS.SUMMARY_FOCUS_TIME}</Text>
                </View>
                <View style={styles.metricCard}>
                  <Text style={styles.metricValue}>{summaryData.completedTasks}</Text>
                  <Text style={styles.metricLabel}>{TEXTS.SUMMARY_TASKS_DONE}</Text>
                </View>
              </View>
              <View style={styles.streakRow}>
                <Text style={styles.summaryLine}>
                  {TEXTS.SUMMARY_STREAK}: {summaryData.streakDays} d
                </Text>
              </View>
              <TouchableOpacity
                style={styles.summaryButton}
                onPress={() => setSummaryVisible(false)}
              >
                <Text style={styles.summaryButtonText}>{TEXTS.SUMMARY_CLOSE}</Text>
              </TouchableOpacity>
            </View>
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
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  summaryCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 16,
    backgroundColor: COLORS.MODAL_BACKGROUND,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: FOCUS_BORDER_SUBTLE,
    padding: 18,
  },
  summaryTitle: {
    color: 'rgba(255,255,255,0.94)',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  summaryLine: {
    color: FOCUS_META,
    fontSize: 14,
  },
  summaryMetricsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  metricCard: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: FOCUS_BORDER_SUBTLE,
  },
  metricValue: {
    color: 'rgba(255,255,255,0.95)',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  metricLabel: {
    color: FOCUS_META,
    fontSize: 11,
    fontWeight: '500',
  },
  streakRow: {
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: FOCUS_BORDER_SUBTLE,
    paddingVertical: 9,
    paddingHorizontal: 10,
    marginBottom: 4,
  },
  summaryButton: {
    marginTop: 12,
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  summaryButtonText: {
    color: COLORS.WHITE,
    fontSize: 14,
    fontWeight: '600',
  },
});
