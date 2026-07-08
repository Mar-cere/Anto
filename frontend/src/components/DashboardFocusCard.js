/**
 * Bloque "foco actual" (#34): vista minimal — sin contenido de chat fuera del chat;
 * recordatorio priorizado (metadatos), línea de foco, opcional siguiente tarea y CTA al chat.
 */
import { Ionicons } from '@expo/vector-icons';
import React, { memo, useCallback, useMemo, useState } from 'react';
import { Text, Pressable, View, useWindowDimensions, TextInput } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useSectionTranslations } from '../hooks/useTranslations';
import { createDashboardFocusStyles } from '../styles/focusCardTheme';
import { updateSessionCommitment, renegotiateSessionCommitment } from '../services/sessionCommitmentsService';
import { getLastSessionDisplayText } from '../utils/dashboardHomeUtils';
import {
  buildCommitmentDisplayTitle,
  buildCommitmentFollowUpPrompt,
  buildCommitmentLinkHint,
} from '../utils/commitmentDisplayCopy';
import {
  buildFocusTaskOpenPayload,
  formatFocusNextTaskDue,
  resolveFocusNextTask,
} from '../utils/focusNextTaskNavigation';
import {
  buildFocusHabitOpenPayload,
  resolveFocusNextHabit,
  resolveFocusNextHabitSubtitle,
} from '../utils/focusNextHabitNavigation';
import { filterDashboardCommitments } from '../utils/commitmentLabelUtils';

const COMPACT_WIDTH = 400;

function pickDisplayedReminder(candidates, compact) {
  if (!candidates?.length) return null;
  if (!compact) return candidates[0];
  const nonHabit = candidates.find((c) => c.kind !== 'habit');
  return nonHabit || candidates[0];
}

function formatDue(d, language) {
  if (!d) return '';
  try {
    const dt = new Date(d);
    const locale = language === 'en' ? 'en-US' : 'es-ES';
    return dt.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
  } catch {
    return '';
  }
}

function reminderIcon(kind) {
  switch (kind) {
    case 'chat':
      return 'chatbubble-outline';
    case 'task':
      return 'calendar-outline';
    case 'habit':
      return 'leaf-outline';
    case 'push':
      return 'notifications-outline';
    default:
      return 'ellipse-outline';
  }
}

/** Ajusta recordatorios legacy en español cuando la UI está en inglés (p. ej. caché). */
function normalizeReminderForLanguage(reminder, language, DASH) {
  if (!reminder) return reminder;
  const isEnglish = language === 'en';
  let title = String(reminder.title || '').trim();
  let subtitle = reminder.subtitle != null ? String(reminder.subtitle).trim() : '';

  if (isEnglish) {
    if (/recordatorio programado\s*\(mañana\)/i.test(title)) {
      title = DASH.FOCUS_PUSH_SCHEDULED_MORNING;
    } else if (/recordatorio programado\s*\(tarde/i.test(title)) {
      title = DASH.FOCUS_PUSH_SCHEDULED_EVENING;
    } else if (/^recordatorio programado$/i.test(title)) {
      title = DASH.FOCUS_PUSH_SCHEDULED_GENERIC;
    } else if (/^pr[oó]xima tarea:/i.test(title)) {
      title = title.replace(/^pr[oó]xima tarea:/i, DASH.FOCUS_REMINDER_NEXT_TASK_PREFIX);
    } else if (/^h[aá]bito:/i.test(title)) {
      title = title.replace(/^h[aá]bito:/i, DASH.FOCUS_REMINDER_HABIT_PREFIX);
    }
    if (/^recordatorio hacia las/i.test(subtitle)) {
      subtitle = subtitle.replace(/^recordatorio hacia las/i, DASH.FOCUS_REMINDER_AROUND_PREFIX);
    } else if (/^vence el /i.test(subtitle)) {
      subtitle = subtitle.replace(/^vence el /i, 'Due ');
    }
  } else if (language === 'es') {
    if (/^scheduled reminder\s*\(morning\)/i.test(title)) {
      title = DASH.FOCUS_PUSH_SCHEDULED_MORNING;
    } else if (/^scheduled reminder\s*\(evening/i.test(title)) {
      title = DASH.FOCUS_PUSH_SCHEDULED_EVENING;
    } else if (/^next task:/i.test(title)) {
      title = title.replace(/^next task:/i, DASH.FOCUS_REMINDER_NEXT_TASK_PREFIX);
    } else if (/^habit:/i.test(title)) {
      title = title.replace(/^habit:/i, DASH.FOCUS_REMINDER_HABIT_PREFIX);
    }
    if (/^reminder around /i.test(subtitle)) {
      subtitle = subtitle.replace(/^reminder around /i, `${DASH.FOCUS_REMINDER_AROUND_PREFIX} `);
    } else if (/^due /i.test(subtitle)) {
      subtitle = subtitle.replace(/^due /i, 'Vence el ');
    }
  }

  if (title === reminder.title && subtitle === (reminder.subtitle || '')) return reminder;
  return { ...reminder, title, subtitle: subtitle || null };
}

function normalizePreloadedChatCopy(reminder, language, DASH) {
  if (!reminder || reminder.kind !== 'chat') return reminder;
  const originalTitle = String(reminder.title || '').trim();
  const originalSubtitle = String(reminder.subtitle || '').trim();
  if (!originalTitle && !originalSubtitle) return reminder;

  const isEnglish = language === 'en';
  const titleLooksSpanish = /retoma tu ultima conversacion|retoma tu última conversación/i.test(originalTitle);
  const titleLooksEnglish = /resume your last conversation/i.test(originalTitle);
  const subtitleSpanishMatch = originalSubtitle.match(/ultima actividad en el chat:\s*hace\s*(\d+)\s*d[ii]as?\.?/i);
  const subtitleEnglishMatch = originalSubtitle.match(/last chat activity:\s*(\d+)\s*days?\s*ago\.?/i);

  if (isEnglish) {
    if (titleLooksSpanish) {
      return {
        ...reminder,
        title: DASH.FOCUS_PRELOADED_LAST_CHAT_TITLE_EN,
        subtitle: subtitleSpanishMatch
          ? DASH.FOCUS_PRELOADED_LAST_CHAT_SUBTITLE_EN.replace('{days}', subtitleSpanishMatch[1])
          : DASH.FOCUS_PRELOADED_LAST_CHAT_SUBTITLE_FALLBACK_EN,
      };
    }
    return reminder;
  }

  if (titleLooksEnglish) {
    return {
      ...reminder,
      title: DASH.FOCUS_PRELOADED_LAST_CHAT_TITLE_ES,
      subtitle: subtitleEnglishMatch
        ? DASH.FOCUS_PRELOADED_LAST_CHAT_SUBTITLE_ES.replace('{days}', subtitleEnglishMatch[1])
        : DASH.FOCUS_PRELOADED_LAST_CHAT_SUBTITLE_FALLBACK_ES,
    };
  }
  return reminder;
}

const FocusActionRow = memo(({ icon, title, subtitle, badge, onPress, a11yLabel, styles, iconColor, chevronColor, showChevron }) => (
  <Pressable
    onPress={onPress}
    disabled={!onPress}
    style={({ pressed }) => [
      styles.actionRow,
      pressed && onPress && { opacity: 0.88 },
    ]}
    accessibilityRole={onPress ? 'button' : 'text'}
    accessibilityLabel={a11yLabel}
  >
    <View style={styles.actionIconWrap}>
      <Ionicons name={icon} size={22} color={iconColor} />
    </View>
    <View style={styles.actionCopy}>
      {badge ? (
        <View style={styles.lastSessionTitleRow}>
          <Text style={[styles.actionTitle, styles.lastSessionHeadline]} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.lastSessionBadge}>{badge}</Text>
        </View>
      ) : (
        <Text style={styles.actionTitle} numberOfLines={2}>
          {title}
        </Text>
      )}
      {subtitle ? (
        <Text style={styles.actionMeta} numberOfLines={badge ? 3 : 2}>
          {subtitle}
        </Text>
      ) : null}
    </View>
    {showChevron ? (
      <Ionicons name="chevron-forward" size={18} color={chevronColor} style={styles.actionChevron} />
    ) : null}
  </Pressable>
));
FocusActionRow.displayName = 'FocusActionRow';

const DashboardFocusCard = ({
  data,
  onOpenChat,
  onOpenConversation,
  onOpenBehavioralActivation,
  onOpenExposureHierarchy,
  onOpenNextTask,
  onOpenNextHabit,
  onCommitmentsChanged,
}) => {
  const DASH = useSectionTranslations('DASH');
  const { language } = useLanguage();
  const { width } = useWindowDimensions();
  const { colors, resolvedScheme } = useTheme();
  const styles = useMemo(
    () => createDashboardFocusStyles(colors, resolvedScheme),
    [colors, resolvedScheme],
  );

  const handleConv = useCallback(
    (id) => {
      if (onOpenConversation) onOpenConversation(id);
    },
    [onOpenConversation],
  );

  const isCompact = width < COMPACT_WIDTH;
  const reminder = data?.reminder;
  const lastSession = data?.lastSessionSummary;
  const focus = data?.focus;
  const protocolNext = data?.protocolNext;
  const nextTask = useMemo(() => resolveFocusNextTask(data), [data]);
  const nextHabit = useMemo(() => resolveFocusNextHabit(data), [data]);
  const baWeekNext = data?.baWeekNext;
  const exposureNext = data?.exposureNext;
  const commitments = Array.isArray(data?.commitments) ? data.commitments : [];
  const visibleCommitments = useMemo(
    () => filterDashboardCommitments(commitments, { hasBaWeekRow: Boolean(baWeekNext) }),
    [commitments, baWeekNext],
  );
  const [renegotiateId, setRenegotiateId] = useState(null);
  const [renegotiateLabel, setRenegotiateLabel] = useState('');

  const handleCommitmentAnswer = useCallback(
    async (id, answer) => {
      if (!id) return;
      try {
        await updateSessionCommitment(id, { followUpAnswer: answer });
        if (answer === 'no') {
          const item = commitments.find((c) => c.id === id);
          setRenegotiateId(id);
          setRenegotiateLabel(String(item?.label || ''));
        } else {
          setRenegotiateId(null);
          setRenegotiateLabel('');
        }
        onCommitmentsChanged?.();
      } catch (_) {
        /* silencioso */
      }
    },
    [onCommitmentsChanged, commitments],
  );

  const handleCommitmentOmit = useCallback(
    async (id) => {
      if (!id) return;
      try {
        await updateSessionCommitment(id, { status: 'skipped' });
        setRenegotiateId(null);
        setRenegotiateLabel('');
        onCommitmentsChanged?.();
      } catch (_) {
        /* silencioso */
      }
    },
    [onCommitmentsChanged],
  );

  const handleCommitmentRenegotiate = useCallback(
    async (id) => {
      const label = String(renegotiateLabel || '').trim();
      if (!id || label.length < 2) return;
      try {
        await renegotiateSessionCommitment(id, { label });
        setRenegotiateId(null);
        setRenegotiateLabel('');
        onCommitmentsChanged?.();
      } catch (_) {
        /* silencioso */
      }
    },
    [onCommitmentsChanged, renegotiateLabel],
  );

  const baWeekCopy = useMemo(() => {
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
  }, [baWeekNext, DASH]);

  const exposureCopy = useMemo(() => {
    if (!exposureNext) return null;
    const title = DASH.FOCUS_EXPOSURE_TITLE;
    const planTitle = String(exposureNext.planTitle || '').trim();
    const stepDesc = String(exposureNext.stepDescription || '').trim();
    if (!planTitle && !stepDesc) return null;
    const stepPart =
      exposureNext.stepTotal > 0
        ? `${exposureNext.stepIndex}/${exposureNext.stepTotal}`
        : '';
    const stepLabel = language === 'en' ? 'Step' : 'Paso';
    const parts = [
      planTitle,
      stepPart ? `${stepLabel} ${stepPart}` : null,
      stepDesc,
    ].filter(Boolean);
    return { title, subtitle: parts.join(' · ') };
  }, [exposureNext, DASH, language]);

  const displayedReminder = useMemo(() => {
    const picked = pickDisplayedReminder(reminder?.candidates, isCompact);
    const localized = normalizeReminderForLanguage(picked, language, DASH);
    return normalizePreloadedChatCopy(localized, language, DASH);
  }, [reminder?.candidates, isCompact, language, DASH]);

  const lastSessionText = useMemo(
    () => getLastSessionDisplayText(lastSession),
    [lastSession],
  );

  const hasChatContinuity = Boolean(lastSessionText);
  const lastSessionConvId = lastSession?.conversationId ? String(lastSession.conversationId) : null;

  const showChatReminder =
    displayedReminder && !(hasChatContinuity && displayedReminder.kind === 'chat');

  const onReminderPress = useCallback(() => {
    if (!displayedReminder) return;
    if (displayedReminder.kind === 'chat') {
      if (displayedReminder.conversationId) {
        handleConv(displayedReminder.conversationId);
      } else if (onOpenChat) {
        onOpenChat();
      }
      return;
    }
    if (displayedReminder.kind === 'habit' && onOpenNextHabit) {
      const payload = buildFocusHabitOpenPayload(displayedReminder, nextHabit);
      if (payload) onOpenNextHabit(payload);
      return;
    }
    if (displayedReminder.kind === 'task' && onOpenNextTask) {
      const payload = buildFocusTaskOpenPayload(displayedReminder, nextTask);
      if (payload) onOpenNextTask(payload);
    }
  }, [displayedReminder, handleConv, onOpenChat, onOpenNextHabit, nextHabit, onOpenNextTask, nextTask]);

  const onLastSessionPress = useCallback(() => {
    if (lastSessionConvId && onOpenConversation) {
      handleConv(lastSessionConvId);
    } else if (onOpenChat) {
      onOpenChat();
    }
  }, [lastSessionConvId, handleConv, onOpenConversation, onOpenChat]);

  const onBaWeekPress = useCallback(() => {
    if (!onOpenBehavioralActivation) return;
    onOpenBehavioralActivation(baWeekNext?.slotId ? String(baWeekNext.slotId) : null);
  }, [onOpenBehavioralActivation, baWeekNext?.slotId]);

  const onExposurePress = useCallback(() => {
    if (!onOpenExposureHierarchy) return;
    onOpenExposureHierarchy(
      exposureNext?.planId ? String(exposureNext.planId) : null,
    );
  }, [onOpenExposureHierarchy, exposureNext?.planId]);

  const onNextTaskPress = useCallback(() => {
    if (!onOpenNextTask) return;
    onOpenNextTask(nextTask);
  }, [onOpenNextTask, nextTask]);

  const onNextHabitPress = useCallback(() => {
    if (!onOpenNextHabit) return;
    onOpenNextHabit(nextHabit);
  }, [onOpenNextHabit, nextHabit]);

  const showLastSessionRow = hasChatContinuity;

  const showTherapeuticProtocol =
    protocolNext?.line && protocolNext?.source === 'therapeutic_record';

  const reminderIsPressable =
    displayedReminder?.kind === 'chat' ||
    (displayedReminder?.kind === 'habit' && Boolean(onOpenNextHabit)) ||
    (displayedReminder?.kind === 'task' && Boolean(onOpenNextTask));

  const showNextTaskRow =
    nextTask?.title && displayedReminder?.kind !== 'task';

  const showNextHabitRow =
    nextHabit?.title && displayedReminder?.kind !== 'habit';

  const chevronMuted =
    resolvedScheme === 'dark' ? 'rgba(245, 247, 255, 0.35)' : 'rgba(36, 35, 79, 0.28)';

  const nextTaskCopy = useMemo(() => {
    if (!showNextTaskRow || !nextTask?.title) return null;
    const title = `${DASH.FOCUS_REMINDER_NEXT_TASK_PREFIX} ${String(nextTask.title).trim()}`;
    const dueFormatted = nextTask.dueDate ? formatDue(nextTask.dueDate, language) : '';
    const subtitle = dueFormatted
      ? formatFocusNextTaskDue(dueFormatted, DASH)
      : (nextTask.dueSubtitle || null);
    return { title, subtitle };
  }, [showNextTaskRow, nextTask, DASH, language]);

  const nextHabitCopy = useMemo(() => {
    if (!showNextHabitRow || !nextHabit?.title) return null;
    const title = `${DASH.FOCUS_REMINDER_HABIT_PREFIX} ${String(nextHabit.title).trim()}`;
    const subtitle = resolveFocusNextHabitSubtitle(nextHabit, language, DASH);
    return { title, subtitle };
  }, [showNextHabitRow, nextHabit, DASH, language]);

  const actionRows = useMemo(() => {
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
    if (showChatReminder) {
      const reminderOpenA11y =
        displayedReminder.kind === 'habit' && reminderIsPressable
          ? `. ${DASH.FOCUS_NEXT_HABIT_OPEN_A11Y}`
          : displayedReminder.kind === 'task' && reminderIsPressable
            ? `. ${DASH.FOCUS_NEXT_TASK_OPEN_A11Y}`
            : '';
      rows.push({
        key: `reminder-${displayedReminder.kind}`,
        icon: reminderIcon(displayedReminder.kind),
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
    if (showLastSessionRow) {
      rows.push({
        key: 'last-session',
        icon: 'reader-outline',
        title: lastSession?.headline || DASH.FOCUS_CHAT_CONTINUITY_HEADLINE,
        subtitle: lastSessionText,
        badge: lastSession?.recentActivityPending
          ? DASH.FOCUS_CHAT_CONTINUITY_RECENT_BADGE
          : lastSession?.placeholder
            ? DASH.FOCUS_CHAT_CONTINUITY_BADGE
            : null,
        onPress: onLastSessionPress,
        showChevron: true,
        a11yLabel: `${lastSession?.headline || DASH.FOCUS_CHAT_CONTINUITY_HEADLINE}. ${lastSessionText}`,
      });
    }
    return rows;
  }, [
    nextTaskCopy,
    onOpenNextTask,
    onNextTaskPress,
    nextHabitCopy,
    onOpenNextHabit,
    onNextHabitPress,
    showChatReminder,
    displayedReminder,
    baWeekCopy,
    exposureCopy,
    showLastSessionRow,
    lastSession,
    lastSessionText,
    reminderIsPressable,
    onReminderPress,
    onBaWeekPress,
    onExposurePress,
    onLastSessionPress,
    DASH,
  ]);

  const showChatCta = Boolean(onOpenChat) && !hasChatContinuity;

  const showFocusHero =
    Boolean(focus?.line) && !hasChatContinuity && !focus?.suppressForChatContinuity;

  if (!data) return null;

  return (
    <View
      style={styles.section}
      accessibilityRole="summary"
      accessibilityLabel={DASH.FOCUS_REMINDER_SECTION}
    >
      <View style={styles.card}>
        {showFocusHero ? (
          <Text style={styles.focusHero} accessibilityRole="text">
            {focus.line}
          </Text>
        ) : null}

        {actionRows.length > 0 ? (
          <>
            <Text style={styles.groupLabel}>{DASH.FOCUS_REMINDER_SECTION}</Text>
            <View style={styles.groupedList}>
              {actionRows.map((row, index) => (
                <View
                  key={row.key}
                  style={index < actionRows.length - 1 ? styles.actionRowBorder : undefined}
                >
                  <FocusActionRow
                    icon={row.icon}
                    title={row.title}
                    subtitle={row.subtitle}
                    badge={row.badge}
                    onPress={row.onPress}
                    a11yLabel={row.a11yLabel}
                    showChevron={row.showChevron}
                    styles={styles}
                    iconColor={colors.primary}
                    chevronColor={chevronMuted}
                  />
                </View>
              ))}
            </View>
          </>
        ) : null}

        {showTherapeuticProtocol ? (
          <View style={styles.protocolRow}>
            <View style={styles.protocolDot} />
            <Text style={styles.protocolText} numberOfLines={3}>
              {protocolNext.line}
            </Text>
          </View>
        ) : null}

        {focus?.isSparseActivity ? (
          <Pressable
            style={({ pressed }) => [styles.sparseLink, pressed && { opacity: 0.85 }]}
            onPress={onOpenChat}
            accessibilityRole="button"
            accessibilityLabel={DASH.FOCUS_START_CHAT}
          >
            <Text style={styles.sparseLinkText}>{DASH.FOCUS_START_CHAT}</Text>
          </Pressable>
        ) : null}

        {visibleCommitments.length > 0 ? (
          <View style={styles.insetSection}>
            <Text style={styles.insetLabel}>{DASH.FOCUS_COMMITMENTS}</Text>
            {visibleCommitments.map((item) => {
              const commitmentTitle = buildCommitmentDisplayTitle(item, DASH);
              const followUpPrompt = buildCommitmentFollowUpPrompt(item, DASH);
              const linkHint = buildCommitmentLinkHint(item, DASH);
              const maxFollowUpAttempts = 2;
              const showFollowUp =
                item.followUpAnswer === 'pending' &&
                item.followUpDue === true &&
                Number(item.followUpAttempts || 0) < maxFollowUpAttempts;
              const showRenegotiate =
                item.status === 'active' &&
                (renegotiateId === item.id ||
                  (item.followUpAnswer === 'no' &&
                    Number(item.followUpAttempts || 0) >= 1 &&
                    Number(item.followUpAttempts || 0) < maxFollowUpAttempts));
              return (
              <View key={item.id} style={styles.commitmentRow}>
                <Text style={styles.commitmentLabel} numberOfLines={2}>
                  {commitmentTitle}
                </Text>
                {linkHint ? (
                  <Text style={styles.commitmentLinkHint}>{linkHint}</Text>
                ) : null}
                {showFollowUp ? (
                  <View
                    style={styles.commitmentActions}
                    accessibilityRole="group"
                    accessibilityLabel={`${commitmentTitle}. ${followUpPrompt}`}
                  >
                    <Text style={styles.commitmentPrompt}>{followUpPrompt}</Text>
                    <View style={styles.commitmentButtons}>
                      <Pressable
                        onPress={() => handleCommitmentAnswer(item.id, 'yes')}
                        style={({ pressed }) => [styles.commitmentChip, pressed && { opacity: 0.88 }]}
                        accessibilityRole="button"
                      >
                        <Text style={styles.commitmentChipText}>{DASH.FOCUS_COMMITMENT_YES}</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => handleCommitmentAnswer(item.id, 'partial')}
                        style={({ pressed }) => [styles.commitmentChip, pressed && { opacity: 0.88 }]}
                        accessibilityRole="button"
                      >
                        <Text style={styles.commitmentChipText}>{DASH.FOCUS_COMMITMENT_PARTIAL}</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => handleCommitmentAnswer(item.id, 'no')}
                        style={({ pressed }) => [styles.commitmentChip, pressed && { opacity: 0.88 }]}
                        accessibilityRole="button"
                      >
                        <Text style={styles.commitmentChipText}>{DASH.FOCUS_COMMITMENT_NO}</Text>
                      </Pressable>
                    </View>
                    <Pressable
                      onPress={() => handleCommitmentOmit(item.id)}
                      style={({ pressed }) => [styles.commitmentOmitLink, pressed && { opacity: 0.72 }]}
                      accessibilityRole="button"
                    >
                      <Text style={styles.commitmentOmitLinkText}>{DASH.FOCUS_COMMITMENT_OMIT}</Text>
                    </Pressable>
                  </View>
                ) : null}
                {showRenegotiate && !showFollowUp ? (
                  <View style={styles.commitmentActions}>
                    <Text style={styles.commitmentPrompt}>{DASH.FOCUS_COMMITMENT_RENEGOTIATE_HINT}</Text>
                    <TextInput
                      style={styles.commitmentRenegotiateInput}
                      value={renegotiateId === item.id ? renegotiateLabel : String(item.label || '')}
                      onChangeText={(v) => {
                        setRenegotiateId(item.id);
                        setRenegotiateLabel(v);
                      }}
                      placeholder={DASH.FOCUS_COMMITMENT_RENEGOTIATE}
                    />
                    <View style={styles.commitmentButtons}>
                      <Pressable
                        onPress={() => handleCommitmentRenegotiate(item.id)}
                        style={({ pressed }) => [styles.commitmentChip, pressed && { opacity: 0.88 }]}
                        accessibilityRole="button"
                      >
                        <Text style={styles.commitmentChipText}>{DASH.FOCUS_COMMITMENT_RENEGOTIATE_SAVE}</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => handleCommitmentOmit(item.id)}
                        style={({ pressed }) => [styles.commitmentChip, pressed && { opacity: 0.88 }]}
                        accessibilityRole="button"
                      >
                        <Text style={styles.commitmentChipText}>{DASH.FOCUS_COMMITMENT_OMIT}</Text>
                      </Pressable>
                    </View>
                  </View>
                ) : null}
              </View>
            );
            })}
          </View>
        ) : null}

        {showChatCta ? (
          <Pressable
            style={({ pressed }) => [styles.ctaSecondary, pressed && { opacity: 0.9 }]}
            onPress={onOpenChat}
            accessibilityRole="button"
            accessibilityLabel={DASH.FOCUS_CHAT_CTA}
          >
            <Text style={styles.ctaSecondaryText}>{DASH.FOCUS_CHAT_CTA}</Text>
            <Ionicons
              name="arrow-forward"
              size={17}
              color={colors.primary}
              style={styles.ctaSecondaryIcon}
            />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
};

export default memo(DashboardFocusCard);
