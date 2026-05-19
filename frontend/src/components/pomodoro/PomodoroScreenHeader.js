/**
 * Header de la pantalla Pomodoro.
 * @author AntoApp Team
 */

import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { StatusBar, StyleSheet, Text, View } from 'react-native';
import {
  HEADER_GAP,
  HEADER_ICON_SIZE,
  HEADER_PADDING,
  usePomodoroTexts,
} from '../../screens/pomodoro/pomodoroScreenConstants';
import { useTheme } from '../../context/ThemeContext';
import { useSectionTranslations } from '../../hooks/useTranslations';
import { getFocusTheme } from '../../styles/focusCardTheme';

const DEFAULT_POMODORO_TEXTS = {
  MODE_WORK: 'Trabajo',
  MODE_BREAK: 'Descanso',
  MODE_LONG_BREAK: 'Descanso largo',
  MODE_MEDITATION: 'Meditacion',
  MODE_CUSTOM: 'Personalizado',
  STATUS_ACTIVE: 'En progreso',
  STATUS_PAUSED: 'Pausado',
  FOCUS_PREFIX: 'Enfoque',
  PENDING_SINGULAR: 'pendiente',
  PENDING_PLURAL: 'pendientes',
};

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
  const { colors, resolvedScheme, statusBarStyle } = useTheme();
  const TEXTS = usePomodoroTexts();
  const translated = useSectionTranslations('POMODORO');
  const I18N = useMemo(
    () => ({ ...DEFAULT_POMODORO_TEXTS, ...(translated || {}) }),
    [translated]
  );
  const t = useMemo(() => getFocusTheme(colors, resolvedScheme), [colors, resolvedScheme]);
  const styles = useMemo(
    () =>
      StyleSheet.create({
        headerContainer: {
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: t.FOCUS_BORDER_SUBTLE,
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
          color: colors.text,
        },
        headerMetaLine: {
          marginTop: 4,
          color: t.FOCUS_META,
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
          color: t.FOCUS_META,
          fontSize: 12,
          fontWeight: '500',
        },
        headerMetaFocusStrong: {
          color: colors.textSecondary,
          fontWeight: '600',
        },
      }),
    [colors, t],
  );

  const modeLabelMap = {
    work: I18N.MODE_WORK,
    break: I18N.MODE_BREAK,
    longBreak: I18N.MODE_LONG_BREAK,
    meditation: I18N.MODE_MEDITATION,
    custom: I18N.MODE_CUSTOM,
  };
  const modeLine = `${isActive ? I18N.STATUS_ACTIVE : I18N.STATUS_PAUSED} · ${modeLabelMap[mode] || I18N.MODE_WORK}`;
  const focusLine = focusTaskTitle
    ? `${I18N.FOCUS_PREFIX} · ${shorten(focusTaskTitle, 34)}`
    : `${pendingTasksCount} ${pendingTasksCount === 1 ? I18N.PENDING_SINGULAR : I18N.PENDING_PLURAL}`;
  return (
    <View style={styles.headerContainer}>
      <StatusBar barStyle={statusBarStyle} backgroundColor={colors.background} />
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MaterialCommunityIcons
            name="timer-outline"
            size={HEADER_ICON_SIZE}
            color={colors.primary}
          />
          <View style={styles.headerCopy}>
            <Text style={styles.headerTitle}>{TEXTS.TITLE}</Text>
            <Text style={styles.headerMetaLine}>{modeLine}</Text>
            <View style={styles.focusLineRow}>
              <MaterialCommunityIcons
                name={focusTaskTitle ? 'bookmark-outline' : 'format-list-checks'}
                size={14}
                color={t.FOCUS_META}
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
