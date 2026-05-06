/**
 * Tareas pendientes enlazadas al Pomodoro (API); evita duplicar la lista local de la pantalla Tareas.
 * @author AntoApp Team
 */

import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  COLORS,
  POMODORO_DISPLAY_BLOCK_MINUTES,
  TASKS_SECTION_BORDER_RADIUS,
  TASKS_SECTION_PADDING,
  TITLE_FONT_SIZE,
  TEXTS,
} from '../../screens/pomodoro/pomodoroScreenConstants';
import {
  FOCUS_ACCENT_BORDER,
  FOCUS_BORDER_SUBTLE,
  FOCUS_ICON_WRAP,
  FOCUS_KICKER_COLOR,
  FOCUS_META,
} from '../../styles/focusCardTheme';

function formatDueShort(iso) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString('es', { day: 'numeric', month: 'short' });
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
  density = 'comfortable',
}) {
  const taskCountLabel = useMemo(() => {
    const n = tasks.length;
    if (n === 0) return null;
    return n === 1 ? '1 tarea' : `${n} tareas`;
  }, [tasks.length]);

  return (
    <View style={[styles.section, density === 'compact' && styles.sectionCompact]}>
      <Text style={styles.kicker}>{TEXTS.PENDING_SECTION_KICKER}</Text>
      <View style={styles.headerRow}>
        <View style={styles.headerIconTitle}>
          <View style={styles.headerIconWrap}>
            <MaterialCommunityIcons name="link-variant" size={20} color={COLORS.PRIMARY} />
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
          <MaterialCommunityIcons name="chevron-right" size={18} color={FOCUS_KICKER_COLOR} />
        </TouchableOpacity>
      </View>

      {loading && !tasks.length ? (
        <ActivityIndicator color={COLORS.PRIMARY} style={styles.loader} />
      ) : null}

      {error ? (
        <View style={styles.errorBox}>
          <MaterialCommunityIcons name="alert-circle-outline" size={22} color={COLORS.ERROR} />
          <Text style={styles.errorText}>{error || TEXTS.PENDING_LOAD_ERROR}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={onRetry}>
            <Text style={styles.retryText}>{TEXTS.RETRY}</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {!loading && !error && tasks.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIconWrap}>
            <MaterialCommunityIcons name="timer-sand-empty" size={32} color={COLORS.PRIMARY} />
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
          const dueStr = formatDueShort(item.dueDate);
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
                accessibilityLabel={`Abrir tarea ${item.title}`}
              >
                <View style={styles.titleRow}>
                  <Text style={styles.rowTitle} numberOfLines={2}>
                    {item.title}
                  </Text>
                  <View style={styles.pillRow}>
                    {isFocused ? (
                      <View style={[styles.statusPill, styles.pillFocus]}>
                        <MaterialCommunityIcons name="target" size={11} color={COLORS.PRIMARY} />
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
                  <MaterialCommunityIcons name="clock-outline" size={14} color={FOCUS_META} />
                  <Text style={styles.metaText}>{metaText}</Text>
                </View>
                {dueStr ? (
                  <View style={styles.dueRow}>
                    <MaterialCommunityIcons name="calendar-blank-outline" size={13} color={FOCUS_META} />
                    <Text style={styles.dueText}>
                      {TEXTS.DUE_DATE_SHORT.replace('{date}', dueStr)}
                    </Text>
                  </View>
                ) : null}
                {blockCount > 1 ? (
                  <View style={styles.blockHintRow}>
                    <MaterialCommunityIcons name="layers-triple-outline" size={13} color={FOCUS_META} />
                    <Text style={styles.blockHint}>
                      {TEXTS.MULTI_BLOCK_HINT.replace('{n}', String(blockCount))}
                    </Text>
                  </View>
                ) : null}
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.focusBtn,
                  (isBusy || focusingTaskId) && styles.focusBtnDisabled,
                ]}
                onPress={() => onFocusTask(item)}
                activeOpacity={0.85}
                disabled={Boolean(focusingTaskId)}
                accessibilityRole="button"
                accessibilityLabel={`Enfocar tarea ${item.title}`}
              >
                {isBusy ? (
                  <ActivityIndicator color={COLORS.WHITE} size="small" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="play-circle-outline" size={22} color={COLORS.WHITE} />
                    <Text style={styles.focusBtnText}>{TEXTS.FOCUS_THIS_TASK}</Text>
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

const styles = StyleSheet.create({
  section: {
    backgroundColor: COLORS.CARD_BACKGROUND,
    borderRadius: TASKS_SECTION_BORDER_RADIUS,
    padding: TASKS_SECTION_PADDING,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: FOCUS_BORDER_SUBTLE,
  },
  sectionCompact: {
    padding: 12,
  },
  kicker: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: FOCUS_KICKER_COLOR,
    marginBottom: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 14,
  },
  headerIconTitle: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    minWidth: 0,
  },
  headerIconWrap: {
    ...FOCUS_ICON_WRAP,
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
    gap: 8,
    marginBottom: 4,
  },
  title: {
    fontSize: TITLE_FONT_SIZE,
    fontWeight: '600',
    letterSpacing: -0.2,
    color: 'rgba(255,255,255,0.94)',
    flexShrink: 1,
  },
  countPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: FOCUS_ACCENT_BORDER,
  },
  countPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: FOCUS_KICKER_COLOR,
  },
  hint: {
    fontSize: 12,
    color: FOCUS_META,
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
    color: COLORS.PRIMARY,
  },
  loader: {
    marginVertical: 16,
  },
  errorBox: {
    paddingVertical: 10,
    gap: 8,
    alignItems: 'flex-start',
  },
  errorText: {
    color: COLORS.ERROR,
    fontSize: 13,
    lineHeight: 18,
  },
  retryBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: FOCUS_BORDER_SUBTLE,
  },
  retryText: {
    color: COLORS.PRIMARY,
    fontSize: 13,
    fontWeight: '600',
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 8,
  },
  emptyIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: 'rgba(26, 221, 219, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: FOCUS_ACCENT_BORDER,
  },
  emptyTitle: {
    marginTop: 12,
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
  },
  emptyHint: {
    marginTop: 6,
    fontSize: 12,
    color: FOCUS_META,
    textAlign: 'center',
    lineHeight: 17,
    maxWidth: 280,
  },
  list: {
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: COLORS.INPUT_BACKGROUND,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: FOCUS_BORDER_SUBTLE,
    overflow: 'hidden',
  },
  rowCompact: {
    borderRadius: 12,
  },
  rowFocused: {
    borderColor: COLORS.PRIMARY,
    backgroundColor: 'rgba(26, 221, 219, 0.06)',
  },
  rowMain: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
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
    color: COLORS.WHITE,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(76, 175, 80, 0.18)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(76, 175, 80, 0.4)',
  },
  pillFocus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(26, 221, 219, 0.12)',
    borderColor: FOCUS_ACCENT_BORDER,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.SUCCESS,
  },
  statusPillTextFocus: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.PRIMARY,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 8,
  },
  metaText: {
    fontSize: 12,
    color: FOCUS_META,
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
    color: FOCUS_META,
  },
  blockHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 6,
  },
  blockHint: {
    fontSize: 11,
    color: FOCUS_META,
    flex: 1,
    lineHeight: 15,
  },
  focusBtn: {
    width: 88,
    paddingVertical: 10,
    paddingHorizontal: 8,
    backgroundColor: COLORS.PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  focusBtnDisabled: {
    opacity: 0.88,
  },
  focusBtnText: {
    color: COLORS.WHITE,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
});
