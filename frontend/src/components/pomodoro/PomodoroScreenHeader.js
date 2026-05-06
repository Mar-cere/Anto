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

function shorten(text, maxLen) {
  if (!text || text.length <= maxLen) return text || '';
  return `${text.slice(0, maxLen - 1)}…`;
}

export default function PomodoroScreenHeader({
  mode,
  isActive,
  focusTaskTitle = '',
  pendingTasksCount = 0,
}) {
  const modeLabelMap = {
    work: 'Trabajo',
    break: 'Descanso',
    longBreak: 'Descanso largo',
    meditation: 'Meditación',
    custom: 'Personalizado',
  };
  const modeLine = `${isActive ? 'En progreso' : 'Pausado'} · ${modeLabelMap[mode] || 'Trabajo'}`;
  const focusLine = focusTaskTitle
    ? `Enfoque · ${shorten(focusTaskTitle, 34)}`
    : `${pendingTasksCount} pendiente${pendingTasksCount === 1 ? '' : 's'}`;
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
          <View style={styles.headerCopy}>
            <Text style={styles.headerTitle}>{TEXTS.TITLE}</Text>
            <Text style={styles.headerMetaLine}>{modeLine}</Text>
            <View style={styles.focusLineRow}>
              <MaterialCommunityIcons
                name={focusTaskTitle ? 'bookmark-outline' : 'format-list-checks'}
                size={14}
                color={FOCUS_META}
              />
              <Text
                style={[styles.headerMetaFocus, focusTaskTitle && styles.headerMetaFocusStrong]}
                numberOfLines={1}
              >
                {focusLine}
              </Text>
            </View>
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
    alignItems: 'flex-start',
    gap: HEADER_GAP,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '600',
    letterSpacing: -0.3,
    color: 'rgba(255,255,255,0.94)',
  },
  headerMetaLine: {
    marginTop: 4,
    color: FOCUS_META,
    fontSize: 12,
    fontWeight: '500',
  },
  focusLineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    maxWidth: '100%',
  },
  headerMetaFocus: {
    flex: 1,
    minWidth: 0,
    color: FOCUS_META,
    fontSize: 12,
    fontWeight: '500',
  },
  headerMetaFocusStrong: {
    color: 'rgba(255,255,255,0.78)',
    fontWeight: '600',
  },
});
