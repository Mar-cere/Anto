/**
 * Bloque "foco actual" (#34): vista minimal — sin contenido de chat fuera del chat;
 * recordatorio priorizado (metadatos), línea de foco, opcional siguiente tarea y CTA al chat.
 */
import { Ionicons } from '@expo/vector-icons';
import React, { memo, useCallback, useMemo } from 'react';
import { Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useSectionTranslations } from '../hooks/useTranslations';
import { createDashboardFocusStyles } from '../styles/focusCardTheme';

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

const DashboardFocusCard = ({ data, onOpenChat, onOpenConversation, onOpenBehavioralActivation }) => {
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
  const nextTask = data?.nextTask;
  const baWeekNext = data?.baWeekNext;

  const baWeekCopy = useMemo(() => {
    if (!baWeekNext) return null;
    const desc = String(baWeekNext.activityDescription || '').trim();
    if (!desc) return null;
    const day = String(baWeekNext.dayLabel || '').trim();
    let title = DASH.FOCUS_BA_UPCOMING;
    if (baWeekNext.isToday) title = DASH.FOCUS_BA_TODAY;
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

  const displayedReminder = useMemo(() => {
    const picked = pickDisplayedReminder(reminder?.candidates, isCompact);
    const localized = normalizeReminderForLanguage(picked, language, DASH);
    return normalizePreloadedChatCopy(localized, language, DASH);
  }, [reminder?.candidates, isCompact, language, DASH]);

  const lastSessionText = useMemo(() => {
    if (!lastSession) return '';
    const s = String(lastSession.snippet || '').trim();
    const b = String(lastSession.bridge || '').trim();
    if (lastSession.placeholder && b) return b;
    if (s) return s;
    return b;
  }, [lastSession]);

  const lastSessionConvId = lastSession?.conversationId ? String(lastSession.conversationId) : null;

  const lastSessionDuplicatesChatReminder = useMemo(() => {
    if (!lastSessionConvId || displayedReminder?.kind !== 'chat') return false;
    const rid = displayedReminder?.conversationId;
    if (!rid) return false;
    return String(rid) === lastSessionConvId;
  }, [displayedReminder, lastSessionConvId]);

  const onReminderPress = useCallback(() => {
    if (!displayedReminder || displayedReminder.kind !== 'chat') return;
    if (displayedReminder.conversationId) {
      handleConv(displayedReminder.conversationId);
    } else if (onOpenChat) {
      onOpenChat();
    }
  }, [displayedReminder, handleConv, onOpenChat]);

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

  if (!data) return null;

  const showLastSessionRow =
    Boolean(lastSessionText) && !lastSessionDuplicatesChatReminder;

  const showTherapeuticProtocol =
    protocolNext?.line && protocolNext?.source === 'therapeutic_record';

  const reminderIsPressable = displayedReminder?.kind === 'chat';

  const showNextTaskRow =
    nextTask?.title && displayedReminder?.kind !== 'task';

  const chevronMuted =
    resolvedScheme === 'dark' ? 'rgba(245, 247, 255, 0.35)' : 'rgba(36, 35, 79, 0.28)';

  return (
    <View style={styles.card} accessibilityRole="summary">
      <Text style={styles.kicker}>{DASH.FOCUS_CARD_LABEL}</Text>

      {displayedReminder ? (
        <TouchableOpacity
          style={[styles.reminderRow, reminderIsPressable && styles.reminderRowPressable]}
          onPress={reminderIsPressable ? onReminderPress : undefined}
          disabled={!reminderIsPressable}
          activeOpacity={reminderIsPressable ? 0.7 : 1}
          accessibilityRole={reminderIsPressable ? 'button' : 'text'}
          accessibilityLabel={`${displayedReminder.title}. ${displayedReminder.subtitle || ''}`}
        >
          <View style={styles.reminderIconWrap}>
            <Ionicons name={reminderIcon(displayedReminder.kind)} size={20} color={colors.primary} />
          </View>
          <View style={styles.reminderCopy}>
            <Text style={styles.reminderTitle} numberOfLines={2}>
              {displayedReminder.title}
            </Text>
            {displayedReminder.subtitle ? (
              <Text style={styles.reminderMeta} numberOfLines={2}>
                {displayedReminder.subtitle}
              </Text>
            ) : null}
          </View>
          {reminderIsPressable ? (
            <Ionicons name="chevron-forward" size={18} color={chevronMuted} style={styles.reminderChevron} />
          ) : null}
        </TouchableOpacity>
      ) : null}

      {baWeekCopy ? (
        <TouchableOpacity
          style={[styles.reminderRow, styles.reminderRowPressable]}
          onPress={onBaWeekPress}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={`${baWeekCopy.title}. ${baWeekCopy.subtitle}. ${DASH.FOCUS_BA_OPEN_A11Y}`}
        >
          <View style={styles.reminderIconWrap}>
            <Ionicons name="footsteps-outline" size={20} color={colors.primary} />
          </View>
          <View style={styles.reminderCopy}>
            <Text style={styles.reminderTitle} numberOfLines={2}>
              {baWeekCopy.title}
            </Text>
            <Text style={styles.reminderMeta} numberOfLines={2}>
              {baWeekCopy.subtitle}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={chevronMuted} style={styles.reminderChevron} />
        </TouchableOpacity>
      ) : null}

      {showLastSessionRow ? (
        <TouchableOpacity
          style={[styles.reminderRow, styles.reminderRowPressable, styles.lastSessionRow]}
          onPress={onLastSessionPress}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={`${lastSession?.headline || DASH.FOCUS_CHAT_CONTINUITY_HEADLINE}. ${lastSessionText}`}
        >
          <View style={styles.reminderIconWrap}>
            <Ionicons name="reader-outline" size={20} color={colors.primary} />
          </View>
          <View style={styles.reminderCopy}>
            <View style={styles.lastSessionTitleRow}>
              <Text style={[styles.reminderTitle, styles.lastSessionHeadline]} numberOfLines={1}>
                {lastSession?.headline || DASH.FOCUS_CHAT_CONTINUITY_HEADLINE}
              </Text>
              {lastSession?.placeholder ? (
                <Text style={styles.lastSessionBadge}>{DASH.FOCUS_CHAT_CONTINUITY_BADGE}</Text>
              ) : null}
            </View>
            <Text style={styles.reminderMeta} numberOfLines={3}>
              {lastSessionText}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={chevronMuted} style={styles.reminderChevron} />
        </TouchableOpacity>
      ) : null}

      {showTherapeuticProtocol ? (
        <View style={styles.protocolRow}>
          <View style={styles.protocolDot} />
          <Text style={styles.protocolText} numberOfLines={3}>
            {protocolNext.line}
          </Text>
        </View>
      ) : null}

      {focus?.line ? (
        <Text style={styles.focusHero} accessibilityRole="text">
          {focus.line}
        </Text>
      ) : null}

      {focus?.isSparseActivity ? (
        <TouchableOpacity
          style={styles.sparseLink}
          onPress={onOpenChat}
          accessibilityRole="button"
          accessibilityLabel={DASH.FOCUS_START_CHAT}
        >
          <Text style={styles.sparseLinkText}>{DASH.FOCUS_START_CHAT}</Text>
        </TouchableOpacity>
      ) : null}

      {showNextTaskRow ? (
        <View style={styles.nextTask}>
          <Text style={styles.nextTaskLabel}>{DASH.FOCUS_NEXT_TASK}</Text>
          <Text style={styles.nextTaskTitle} numberOfLines={1}>
            {nextTask.title}
          </Text>
          {nextTask.dueDate ? (
            <Text style={styles.nextTaskDue}>{formatDue(nextTask.dueDate, language)}</Text>
          ) : null}
        </View>
      ) : null}

      <TouchableOpacity
        style={styles.cta}
        onPress={onOpenChat}
        accessibilityRole="button"
        accessibilityLabel={DASH.FOCUS_CHAT_CTA}
      >
        <Text style={styles.ctaText}>{DASH.FOCUS_CHAT_CTA}</Text>
        <Ionicons name="arrow-forward" size={18} color={colors.textOnPrimary} style={styles.ctaArrow} />
      </TouchableOpacity>
    </View>
  );
};

export default memo(DashboardFocusCard);
