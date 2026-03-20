/**
 * Pantalla de Pomodoro
 *
 * Gestión de sesiones trabajo/descanso/meditación y tareas de sesión.
 * Lógica en usePomodoroScreen; UI en subcomponentes (Header, TimerSection, Controls, TasksSection, CustomTimerModal).
 *
 * @author AntoApp Team
 */

import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native';
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
} from './pomodoro/pomodoroScreenConstants';

export default function PomodoroScreen() {
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
    toggleTimer,
    resetTimer,
    changeMode,
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
  } = usePomodoroScreen();

  return (
    <SafeAreaView style={styles.safeArea}>
      <PomodoroScreenHeader />
      <View style={styles.container}>
        <ScrollView style={styles.content}>
          <PomodoroTimerSection
            mode={mode}
            modes={modes}
            timeLeft={timeLeft}
            formatTime={formatTime}
            progressAnimation={progressAnimation}
            fadeAnim={fadeAnim}
            isMeditating={isMeditating}
          />
          <PomodoroControls
            mode={mode}
            modes={modes}
            isActive={isActive}
            toggleTimer={toggleTimer}
            resetTimer={resetTimer}
            changeMode={changeMode}
            onOpenCustomModal={() => setCustomTimeModalVisible(true)}
            buttonsOpacity={buttonsOpacity}
            buttonsScale={buttonsScale}
            mainControlsPosition={mainControlsPosition}
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
    paddingBottom: CONTAINER_PADDING_BOTTOM,
  },
  content: {
    flex: 1,
    padding: CONTENT_PADDING,
  },
});
