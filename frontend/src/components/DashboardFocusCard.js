/**
 * Bloque "foco actual" (#34): vista minimal — sin contenido de chat fuera del chat;
 * recordatorio priorizado (metadatos), línea de foco, opcional siguiente tarea y CTA al chat.
 */
import { Ionicons } from '@expo/vector-icons';
import React, { memo, useCallback, useMemo } from 'react';
import { Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { DASH } from '../constants/translations';
import { colors } from '../styles/globalStyles';
import { dashboardFocusStyles as styles } from '../styles/focusCardTheme';

const COMPACT_WIDTH = 400;

function pickDisplayedReminder(candidates, compact) {
  if (!candidates?.length) return null;
  if (!compact) return candidates[0];
  const nonHabit = candidates.find((c) => c.kind !== 'habit');
  return nonHabit || candidates[0];
}

function formatDue(d) {
  if (!d) return '';
  try {
    const dt = new Date(d);
    return dt.toLocaleDateString('es', { day: 'numeric', month: 'short' });
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

const DashboardFocusCard = ({ data, onOpenChat, onOpenConversation }) => {
  const { width } = useWindowDimensions();
  const isCompact = width < COMPACT_WIDTH;

  const handleConv = useCallback(
    (id) => {
      if (onOpenConversation) onOpenConversation(id);
    },
    [onOpenConversation]
  );

  if (!data) return null;

  const { focus, reminder, protocolNext, nextTask, lastSessionSummary: lastSession } = data;

  const displayedReminder = useMemo(
    () => pickDisplayedReminder(reminder?.candidates, isCompact),
    [reminder?.candidates, isCompact]
  );

  const lastSessionText = useMemo(() => {
    if (!lastSession) return '';
    const s = String(lastSession.snippet || '').trim();
    if (s) return s;
    return String(lastSession.bridge || '').trim();
  }, [lastSession]);

  const lastSessionConvId = lastSession?.conversationId ? String(lastSession.conversationId) : null;

  const lastSessionDuplicatesChatReminder = useMemo(() => {
    if (!lastSessionConvId || displayedReminder?.kind !== 'chat') return false;
    const rid = displayedReminder?.conversationId;
    if (!rid) return false;
    return String(rid) === lastSessionConvId;
  }, [displayedReminder, lastSessionConvId]);

  const showLastSessionRow =
    Boolean(lastSessionText) && !lastSessionDuplicatesChatReminder;

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

  const showTherapeuticProtocol =
    protocolNext?.line && protocolNext?.source === 'therapeutic_record';

  const reminderIsPressable = displayedReminder?.kind === 'chat';

  const showNextTaskRow =
    nextTask?.title && displayedReminder?.kind !== 'task';

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
            <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.35)" style={styles.reminderChevron} />
          ) : null}
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
          <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.35)" style={styles.reminderChevron} />
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
            <Text style={styles.nextTaskDue}>{formatDue(nextTask.dueDate)}</Text>
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
        <Ionicons name="arrow-forward" size={18} color={colors.background} style={styles.ctaArrow} />
      </TouchableOpacity>
    </View>
  );
};

export default memo(DashboardFocusCard);
