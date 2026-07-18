/**
 * Construye filas accionables del bloque «Lo principal ahora».
 */
import { formatFocusNextTaskDue } from './focusNextTaskNavigation';
import { resolveFocusNextHabitSubtitle } from './focusNextHabitNavigation';
import { formatFocusDueDate, focusReminderIcon } from './focusReminderNormalization';

/**
 * @param {object} params
 * @returns {Array<object>}
 */
export function buildFocusActionRows({
  DASH,
  nextTaskCopy,
  onOpenNextTask,
  onNextTaskPress,
  nextHabitCopy,
  onOpenNextHabit,
  onNextHabitPress,
  showChatReminder,
  displayedReminder,
  reminderIsPressable,
  onReminderPress,
  baWeekCopy,
  onBaWeekPress,
  exposureCopy,
  onExposurePress,
  showLastSessionRow,
  lastSession,
  lastSessionText,
  lastSessionFullText,
  onLastSessionPress,
  experientialFollowUpDue = null,
  onExperientialFollowUpPress = null,
}) {
  const rows = [];
  if (nextTaskCopy && onOpenNextTask) {
    rows.push({
      key: 'next-task',
      icon: 'calendar-outline',
      title: nextTaskCopy.title,
      subtitle: nextTaskCopy.subtitle,
      onPress: onNextTaskPress,
      showChevron: true,
      a11yLabel: `${nextTaskCopy.title}. ${nextTaskCopy.subtitle || ''}. ${DASH.FOCUS_NEXT_TASK_OPEN_A11Y}`,
    });
  }
  if (nextHabitCopy && onOpenNextHabit) {
    rows.push({
      key: 'next-habit',
      icon: 'leaf-outline',
      title: nextHabitCopy.title,
      subtitle: nextHabitCopy.subtitle,
      onPress: onNextHabitPress,
      showChevron: true,
      a11yLabel: `${nextHabitCopy.title}. ${nextHabitCopy.subtitle || ''}. ${DASH.FOCUS_NEXT_HABIT_OPEN_A11Y}`,
    });
  }
  if (showChatReminder && displayedReminder) {
    const reminderOpenA11y =
      displayedReminder.kind === 'habit' && reminderIsPressable
        ? `. ${DASH.FOCUS_NEXT_HABIT_OPEN_A11Y}`
        : displayedReminder.kind === 'task' && reminderIsPressable
          ? `. ${DASH.FOCUS_NEXT_TASK_OPEN_A11Y}`
          : '';
    rows.push({
      key: `reminder-${displayedReminder.kind}`,
      icon: focusReminderIcon(displayedReminder.kind),
      title: displayedReminder.title,
      subtitle: displayedReminder.subtitle || null,
      onPress: reminderIsPressable ? onReminderPress : null,
      showChevron: reminderIsPressable,
      a11yLabel: `${displayedReminder.title}. ${displayedReminder.subtitle || ''}${reminderOpenA11y}`,
    });
  }
  if (baWeekCopy) {
    rows.push({
      key: 'ba-week',
      icon: 'footsteps-outline',
      title: baWeekCopy.title,
      subtitle: baWeekCopy.subtitle,
      onPress: onBaWeekPress,
      showChevron: true,
      a11yLabel: `${baWeekCopy.title}. ${baWeekCopy.subtitle}. ${DASH.FOCUS_BA_OPEN_A11Y}`,
    });
  }
  if (exposureCopy) {
    rows.push({
      key: 'exposure',
      icon: 'trail-sign-outline',
      title: exposureCopy.title,
      subtitle: exposureCopy.subtitle,
      onPress: onExposurePress,
      showChevron: true,
      a11yLabel: `${exposureCopy.title}. ${exposureCopy.subtitle}. ${DASH.FOCUS_EXPOSURE_OPEN_A11Y}`,
    });
  }
  if (experientialFollowUpDue?.id && onExperientialFollowUpPress) {
    const title =
      DASH.FOCUS_EXPERIENTIAL_FOLLOW_UP_HEADLINE || 'Hay algo de tu proceso para retomar';
    const subtitle = String(experientialFollowUpDue.statementPreview || '').trim() || null;
    rows.push({
      key: 'experiential-follow-up',
      icon: 'time-outline',
      title,
      subtitle,
      onPress: onExperientialFollowUpPress,
      showChevron: true,
      subtitleLines: 2,
      a11yLabel: `${title}. ${subtitle || ''}. ${DASH.FOCUS_EXPERIENTIAL_FOLLOW_UP_OPEN_A11Y || ''}`,
    });
  }
  if (showLastSessionRow) {
    const continuityTitle = lastSession?.headline || DASH.FOCUS_CHAT_CONTINUITY_HEADLINE;
    const continuityBadge = lastSession?.recentActivityPending
      ? DASH.FOCUS_CHAT_CONTINUITY_RECENT_BADGE
      : lastSession?.placeholder
        ? DASH.FOCUS_CHAT_CONTINUITY_BADGE
        : null;
    rows.push({
      key: 'last-session',
      icon: 'reader-outline',
      title: continuityTitle,
      subtitle: lastSessionText,
      badge: continuityBadge,
      onPress: onLastSessionPress,
      showChevron: true,
      subtitleLines: 2,
      a11yLabel: `${continuityTitle}. ${lastSessionFullText}`,
    });
  }
  return rows;
}

export function buildFocusNextTaskCopy({ showNextTaskRow, nextTask, DASH, language }) {
  if (!showNextTaskRow || !nextTask?.title) return null;
  const title = `${DASH.FOCUS_REMINDER_NEXT_TASK_PREFIX} ${String(nextTask.title).trim()}`;
  const dueFormatted = nextTask.dueDate ? formatFocusDueDate(nextTask.dueDate, language) : '';
  const subtitle = dueFormatted
    ? formatFocusNextTaskDue(dueFormatted, DASH)
    : (nextTask.dueSubtitle || null);
  return { title, subtitle };
}

export function buildFocusNextHabitCopy({ showNextHabitRow, nextHabit, DASH, language }) {
  if (!showNextHabitRow || !nextHabit?.title) return null;
  const title = `${DASH.FOCUS_REMINDER_HABIT_PREFIX} ${String(nextHabit.title).trim()}`;
  const subtitle = resolveFocusNextHabitSubtitle(nextHabit, language, DASH);
  return { title, subtitle };
}

export function buildFocusBaWeekCopy(baWeekNext, DASH) {
  if (!baWeekNext) return null;
  const desc = String(baWeekNext.activityDescription || '').trim();
  if (!desc) return null;
  const day = String(baWeekNext.dayLabel || '').trim();
  let title = DASH.FOCUS_BA_UPCOMING;
  if (baWeekNext.isToday) title = DASH.FOCUS_BA_TODAY;
  else if (baWeekNext.isTomorrow) title = DASH.FOCUS_BA_TOMORROW;
  else if (baWeekNext.isOverdue) title = DASH.FOCUS_BA_OVERDUE;

  let subtitle = desc;
  if (baWeekNext.isToday) {
    if (baWeekNext.pendingCount > 1) {
      const extra = baWeekNext.pendingCount - 1;
      subtitle = `${desc} · ${extra} ${DASH.FOCUS_BA_MORE_SUFFIX}`;
    }
  } else if (day) {
    subtitle = `${day} · ${desc}`;
  }

  return { title, subtitle };
}

export function buildFocusExposureCopy(exposureNext, DASH) {
  if (!exposureNext) return null;
  const title = DASH.FOCUS_EXPOSURE_TITLE;
  const planTitle = String(exposureNext.planTitle || '').trim();
  const stepDesc = String(exposureNext.stepDescription || '').trim();
  if (!planTitle && !stepDesc) return null;
  const stepPart =
    exposureNext.stepTotal > 0
      ? `${exposureNext.stepIndex}/${exposureNext.stepTotal}`
      : '';
  const stepLabel = DASH.FOCUS_EXPOSURE_STEP_LABEL;
  const parts = [
    planTitle,
    stepPart ? `${stepLabel} ${stepPart}` : null,
    stepDesc,
  ].filter(Boolean);
  return { title, subtitle: parts.join(' · ') };
}
