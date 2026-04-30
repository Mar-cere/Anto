/**
 * Bloque "foco actual" (#34): vista minimal — sin contenido de chat fuera del chat;
 * recordatorio priorizado (metadatos), línea de foco, opcional siguiente tarea y CTA al chat.
 */
import { Ionicons } from '@expo/vector-icons';
import React, { memo, useCallback, useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { DASH } from '../constants/translations';
import { colors } from '../styles/globalStyles';

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

  const { focus, reminder, protocolNext, nextTask } = data;

  const displayedReminder = useMemo(
    () => pickDisplayedReminder(reminder?.candidates, isCompact),
    [reminder?.candidates, isCompact]
  );

  const onReminderPress = useCallback(() => {
    if (!displayedReminder || displayedReminder.kind !== 'chat') return;
    if (displayedReminder.conversationId) {
      handleConv(displayedReminder.conversationId);
    } else if (onOpenChat) {
      onOpenChat();
    }
  }, [displayedReminder, handleConv, onOpenChat]);

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

const styles = StyleSheet.create({
  card: {
    alignSelf: 'stretch',
    marginBottom: 20,
    paddingVertical: 22,
    paddingHorizontal: 20,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.1)'
  },
  kicker: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: 'rgba(163, 184, 232, 0.85)',
    marginBottom: 14
  },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.03)'
  },
  reminderRowPressable: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(26, 221, 219, 0.22)'
  },
  reminderIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(26, 221, 219, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  reminderCopy: {
    flex: 1,
    minWidth: 0
  },
  reminderTitle: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 20
  },
  reminderMeta: {
    marginTop: 4,
    color: 'rgba(255,255,255,0.55)',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400'
  },
  reminderChevron: {
    marginLeft: 6
  },
  protocolRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingRight: 4
  },
  protocolDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginTop: 7,
    marginRight: 10,
    opacity: 0.85
  },
  protocolText: {
    flex: 1,
    color: 'rgba(255,255,255,0.72)',
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '400'
  },
  focusHero: {
    color: 'rgba(255,255,255,0.94)',
    fontSize: 17,
    lineHeight: 26,
    fontWeight: '300',
    letterSpacing: -0.2,
    marginBottom: 18
  },
  sparseLink: {
    alignSelf: 'flex-start',
    marginTop: -10,
    marginBottom: 14
  },
  sparseLinkText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '500'
  },
  nextTask: {
    marginBottom: 18,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.08)'
  },
  nextTaskLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: 'rgba(163, 184, 232, 0.75)',
    marginBottom: 6
  },
  nextTaskTitle: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '400'
  },
  nextTaskDue: {
    marginTop: 4,
    fontSize: 13,
    color: 'rgba(255,255,255,0.45)'
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 999
  },
  ctaText: {
    color: colors.background,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.2
  },
  ctaArrow: {
    marginLeft: 8
  }
});
