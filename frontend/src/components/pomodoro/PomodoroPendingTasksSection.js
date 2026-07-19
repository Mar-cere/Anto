/**
 * Tareas pendientes enlazadas al Pomodoro (API); evita duplicar la lista local de la pantalla Tareas.
 * @author AntoApp Team
 */

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SPACING } from '../../constants/ui';
import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import {
  createPomodoroColors,
  POMODORO_DISPLAY_BLOCK_MINUTES,
  POMODORO_INNER_INSET,
  TASKS_SECTION_BORDER_RADIUS,
  TASKS_SECTION_PADDING,
  TITLE_FONT_SIZE,
  usePomodoroTexts,
} from '../../screens/pomodoro/pomodoroScreenConstants';
import { useLanguage } from '../../context/LanguageContext';
import { getFocusTheme } from '../../styles/focusCardTheme';

function formatDueShort(iso, language) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const locale = language === 'en' ? 'en-US' : 'es-ES';
    return d.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
  } catch {
    return '';
  }
}

export default function PomodoroPendingTasksSection({
  tasks,
  loading,
  error,
  onRetry,
  onFocusTask,
  onOpenTask,
  onSeeAllTasks,
  focusTaskId,
  focusingTaskId,
  timerActive = false,
  density = 'comfortable',
}) {
  const TEXTS = usePomodoroTexts();
  const { language } = useLanguage();
  const { colors, resolvedScheme } = useTheme();
  const t = useMemo(() => getFocusTheme(colors, resolvedScheme), [colors, resolvedScheme]);
  const PC = useMemo(() => createPomodoroColors(colors), [colors]);
  const styles = useMemo(() => createPendingTasksStyles(colors, t, PC), [colors, t, PC]);

  const taskCountLabel = useMemo(() => {
    const n = tasks.length;
    if (n === 0) return null;
    if (n === 1) return TEXTS.TASK_COUNT_SINGLE;
    return TEXTS.TASK_COUNT_MANY.replace('{n}', String(n));
  }, [tasks.length, TEXTS]);

  return (
    <View style={styles.section}>
      <Text style={styles.kicker}>{TEXTS.PENDING_SECTION_KICKER}</Text>
      <View style={styles.headerRow}>
        <View style={styles.headerIconTitle}>
          <View style={styles.headerIconWrap}>
            <MaterialCommunityIcons name="link-variant" size={20} color={PC.PRIMARY} />
          </View>
          <View style={styles.headerTextWrap}>
            <View style={styles.headerTitleRow}>
              <Text style={styles.title}>{TEXTS.PENDING_TASKS_TITLE}</Text>
              {taskCountLabel ? (
                <View style={styles.countPill}>
                  <Text style={styles.countPillText}>{taskCountLabel}</Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.hint}>{TEXTS.PENDING_TASKS_HINT}</Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={onSeeAllTasks}
          hitSlop={12}
          accessibilityRole="button"
          style={styles.seeAllWrap}
        >
          <Text style={styles.link}>{TEXTS.SEE_ALL_TASKS}</Text>
          <MaterialCommunityIcons name="chevron-right" size={18} color={t.FOCUS_KICKER_COLOR} />
        </TouchableOpacity>
      </View>

      {loading && !tasks.length ? (
        <ActivityIndicator color={PC.PRIMARY} style={styles.loader} />
      ) : null}

      {error ? (
        <View style={styles.errorBox}>
          <MaterialCommunityIcons name="alert-circle-outline" size={22} color={PC.ERROR} />
          <Text style={styles.errorText}>{error || TEXTS.PENDING_LOAD_ERROR}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={onRetry}>
            <Text style={styles.retryText}>{TEXTS.RETRY}</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {!loading && !error && tasks.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIconWrap}>
            <MaterialCommunityIcons name="timer-sand-empty" size={32} color={PC.PRIMARY} />
          </View>
          <Text style={styles.emptyTitle}>{TEXTS.PENDING_TASKS_EMPTY}</Text>
          <Text style={styles.emptyHint}>{TEXTS.PENDING_TASKS_EMPTY_HINT}</Text>
        </View>
      ) : null}

      <View style={styles.list}>
        {tasks.map((item) => {
          const hasEstimate =
            typeof item.estimatedTime === 'number' && item.estimatedTime > 0;
          const estRounded = hasEstimate ? Math.round(item.estimatedTime) : POMODORO_DISPLAY_BLOCK_MINUTES;
          const metaText = hasEstimate
            ? TEXTS.ESTIMATED_MINUTES.replace('{n}', String(estRounded))
            : TEXTS.ESTIMATE_DEFAULT_SHORT;
          const blockCount =
            hasEstimate && estRounded > POMODORO_DISPLAY_BLOCK_MINUTES
              ? Math.ceil(estRounded / POMODORO_DISPLAY_BLOCK_MINUTES)
              : 0;
          const isFocused = focusTaskId && item._id === focusTaskId;
          const isBusy = focusingTaskId && item._id === focusingTaskId;
          const inProgress = item.status === 'in_progress';
          const dueStr = formatDueShort(item.dueDate, language);
          const focusBtnLabel = isFocused
            ? (timerActive ? TEXTS.TASK_FOCUS_ACTIVE : TEXTS.START)
            : TEXTS.FOCUS_THIS_TASK;
          const focusBtnDisabled = Boolean(focusingTaskId) || (isFocused && timerActive);
          return (
            <View
              key={item._id}
              style={[styles.row, isFocused && styles.rowFocused, density === 'compact' && styles.rowCompact]}
            >
              <TouchableOpacity
                style={styles.rowMain}
                onPress={() => onOpenTask(item)}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityLabel={`${TEXTS.OPEN_TASK_A11Y_PREFIX} ${item.title}`}
              >
                <View style={styles.titleRow}>
                  <Text style={styles.rowTitle} numberOfLines={2}>
                    {item.title}
                  </Text>
                  <View style={styles.pillRow}>
                    {isFocused ? (
                      <View style={[styles.statusPill, styles.pillFocus]}>
                        <MaterialCommunityIcons name="target" size={11} color={PC.PRIMARY} />
                        <Text style={styles.statusPillTextFocus}>{TEXTS.TASK_FOCUS_ACTIVE}</Text>
                      </View>
                    ) : null}
                    {inProgress && !isFocused ? (
                      <View style={styles.statusPill}>
                        <Text style={styles.statusPillText}>{TEXTS.TASK_STATUS_IN_PROGRESS}</Text>
                      </View>
                    ) : null}
                  </View>
                </View>
                <View style={styles.metaRow}>
                  <MaterialCommunityIcons name="clock-outline" size={14} color={t.FOCUS_META} />
                  <Text style={styles.metaText}>{metaText}</Text>
                </View>
                {dueStr ? (
                  <View style={styles.dueRow}>
                    <MaterialCommunityIcons name="calendar-blank-outline" size={13} color={t.FOCUS_META} />
                    <Text style={styles.dueText}>
                      {TEXTS.DUE_DATE_SHORT.replace('{date}', dueStr)}
                    </Text>
                  </View>
                ) : null}
                {blockCount > 1 ? (
                  <View style={styles.blockHintRow}>
                    <MaterialCommunityIcons name="layers-triple-outline" size={13} color={t.FOCUS_META} />
                    <Text style={styles.blockHint}>
                      {TEXTS.MULTI_BLOCK_HINT.replace('{n}', String(blockCount))}
                    </Text>
                  </View>
                ) : null}
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.focusBtn,
                  focusBtnDisabled && styles.focusBtnDisabled,
                ]}
                onPress={() => onFocusTask(item)}
                activeOpacity={0.85}
                disabled={focusBtnDisabled}
                accessibilityRole="button"
                accessibilityLabel={`${TEXTS.FOCUS_TASK_A11Y_PREFIX} ${item.title}`}
                accessibilityState={{ disabled: focusBtnDisabled }}
              >
                {isBusy ? (
                  <ActivityIndicator color={colors.textOnPrimary} size="small" />
                ) : (
                  <>
                    <MaterialCommunityIcons
                      name={focusBtnDisabled ? 'target' : 'play-circle-outline'}
                      size={22}
                      color={colors.textOnPrimary}
                    />
                    <Text style={styles.focusBtnText}>{focusBtnLabel}</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function createPendingTasksStyles(colors, t, PC) {
  return StyleSheet.create({
    section: {
      backgroundColor: PC.CARD_BACKGROUND,
      borderRadius: TASKS_SECTION_BORDER_RADIUS,
      padding: TASKS_SECTION_PADDING,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.FOCUS_BORDER_SUBTLE,
    },
    kicker: {
      fontSize: 11,
      fontWeight: '600',
      letterSpacing: 1.6,
      textTransform: 'uppercase',
      color: t.FOCUS_KICKER_COLOR,
      marginBottom: 10,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: SPACING.CARD_INNER_INSET,
      marginBottom: 14,
    },
    headerIconTitle: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: SPACING.CARD_INNER_INSET,
      minWidth: 0,
    },
    headerIconWrap: {
      ...t.FOCUS_ICON_WRAP,
      width: 44,
      height: 44,
      borderRadius: 14,
    },
    headerTextWrap: {
      flex: 1,
      minWidth: 0,
    },
    headerTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: SPACING.sm,
      marginBottom: 4,
    },
    title: {
      fontSize: TITLE_FONT_SIZE,
      fontWeight: '600',
      letterSpacing: -0.2,
      color: colors.text,
      flexShrink: 1,
    },
    countPill: {
      paddingHorizontal: SPACING.sm,
      paddingVertical: 3,
      borderRadius: 8,
      backgroundColor: t.FOCUS_INNER_ROW.backgroundColor,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.FOCUS_ACCENT_BORDER,
    },
    countPillText: {
      fontSize: 11,
      fontWeight: '600',
      color: t.FOCUS_KICKER_COLOR,
    },
    hint: {
      fontSize: 12,
      color: t.FOCUS_META,
      lineHeight: 17,
    },
    seeAllWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 2,
    },
    link: {
      fontSize: 13,
      fontWeight: '600',
      color: PC.PRIMARY,
    },
    loader: {
      marginVertical: 16,
    },
    errorBox: {
      paddingVertical: SPACING.CHIP_INSET_COMPACT,
      gap: SPACING.sm,
      alignItems: 'flex-start',
    },
    errorText: {
      color: PC.ERROR,
      fontSize: 13,
      lineHeight: 18,
    },
    retryBtn: {
      alignSelf: 'flex-start',
      paddingVertical: SPACING.sm,
      paddingHorizontal: POMODORO_INNER_INSET,
      borderRadius: 10,
      backgroundColor: t.FOCUS_INNER_ROW.backgroundColor,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.FOCUS_BORDER_SUBTLE,
    },
    retryText: {
      color: PC.PRIMARY,
      fontSize: 13,
      fontWeight: '600',
    },
    empty: {
      alignItems: 'center',
      paddingVertical: SPACING.HERO_INSET,
      paddingHorizontal: SPACING.sm,
    },
    emptyIconWrap: {
      width: 56,
      height: 56,
      borderRadius: 18,
      backgroundColor: colors.accentLineSoft,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.FOCUS_ACCENT_BORDER,
    },
    emptyTitle: {
      marginTop: 12,
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
    },
    emptyHint: {
      marginTop: 6,
      fontSize: 12,
      color: t.FOCUS_META,
      textAlign: 'center',
      lineHeight: 17,
      maxWidth: 280,
    },
    list: {
      gap: SPACING.CARD_INNER_INSET,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'stretch',
      backgroundColor: PC.INPUT_BACKGROUND,
      borderRadius: 14,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.FOCUS_BORDER_SUBTLE,
      overflow: 'hidden',
    },
    rowCompact: {
      borderRadius: 12,
    },
    rowFocused: {
      borderColor: PC.PRIMARY,
      backgroundColor: colors.accentLineSoft,
    },
    rowMain: {
      flex: 1,
      minWidth: 0,
      paddingVertical: SPACING.CHIP_INSET,
      paddingHorizontal: POMODORO_INNER_INSET,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: SPACING.sm,
    },
    pillRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      maxWidth: '42%',
      justifyContent: 'flex-end',
    },
    rowTitle: {
      flex: 1,
      minWidth: 0,
      color: colors.text,
      fontSize: 15,
      fontWeight: '600',
      lineHeight: 20,
    },
    statusPill: {
      paddingHorizontal: SPACING.sm,
      paddingVertical: SPACING.xs,
      borderRadius: 8,
      backgroundColor: colors.successSoft,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.success,
    },
    pillFocus: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: colors.accentLineSoft,
      borderColor: t.FOCUS_ACCENT_BORDER,
    },
    statusPillText: {
      fontSize: 10,
      fontWeight: '700',
      color: PC.SUCCESS,
    },
    statusPillTextFocus: {
      fontSize: 10,
      fontWeight: '700',
      color: PC.PRIMARY,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      marginTop: 8,
    },
    metaText: {
      fontSize: 12,
      color: t.FOCUS_META,
      flex: 1,
    },
    dueRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      marginTop: 6,
    },
    dueText: {
      fontSize: 11,
      color: t.FOCUS_META,
    },
    blockHintRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      marginTop: 6,
    },
    blockHint: {
      fontSize: 11,
      color: t.FOCUS_META,
      flex: 1,
      lineHeight: 15,
    },
    focusBtn: {
      width: 88,
      paddingVertical: SPACING.CHIP_INSET_COMPACT,
      paddingHorizontal: SPACING.sm,
      backgroundColor: PC.PRIMARY,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
    },
    focusBtnDisabled: {
      opacity: 0.88,
    },
    focusBtnText: {
      color: colors.textOnPrimary,
      fontSize: 11,
      fontWeight: '700',
      textAlign: 'center',
    },
  });
}
