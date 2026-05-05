/**
 * Header de la pantalla Pomodoro.
 * @author AntoApp Team
 */

import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { StatusBar, StyleSheet, Text, View } from 'react-native';
import { FOCUS_BORDER_SUBTLE, FOCUS_META } from '../../styles/focusCardTheme';
import {
  COLORS,
  HEADER_GAP,
  HEADER_ICON_SIZE,
  HEADER_PADDING,
  STATUS_BAR_STYLE,
  STATUS_BAR_BACKGROUND,
  TEXTS,
} from '../../screens/pomodoro/pomodoroScreenConstants';

export default function PomodoroScreenHeader({ mode, isActive, completedTasksCount = 0, totalTasks = 0 }) {
  const modeLabelMap = {
    work: 'Trabajo',
    break: 'Descanso',
    longBreak: 'Descanso largo',
    meditation: 'Meditación',
    custom: 'Personalizado',
  };
  return (
    <View style={styles.headerContainer}>
      <StatusBar barStyle={STATUS_BAR_STYLE} backgroundColor={STATUS_BAR_BACKGROUND} />
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MaterialCommunityIcons
            name="timer-outline"
            size={HEADER_ICON_SIZE}
            color={COLORS.PRIMARY}
          />
          <View>
            <Text style={styles.headerTitle}>{TEXTS.TITLE}</Text>
            <Text style={styles.headerMeta}>
              {isActive ? 'En progreso' : 'Pausado'} · {modeLabelMap[mode] || 'Trabajo'} · {completedTasksCount}/{totalTasks} tareas
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: FOCUS_BORDER_SUBTLE,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: HEADER_PADDING,
    paddingBottom: HEADER_PADDING,
    paddingTop: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: HEADER_GAP,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '600',
    letterSpacing: -0.3,
    color: 'rgba(255,255,255,0.94)',
  },
  headerMeta: {
    marginTop: 4,
    color: FOCUS_META,
    fontSize: 12,
    fontWeight: '500',
  },
});
