/**
 * Bloque "foco actual" (#34): recordatorio priorizado, protocolo (BD), línea de foco,
 * resumen, compromisos, chats y próximas tareas. En pantallas angostas se omite hábito en el recordatorio.
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
      return 'chatbubble-ellipses-outline';
    case 'task':
      return 'checkbox-outline';
    case 'habit':
      return 'fitness-outline';
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

  const {
    focus,
    narrative,
    commitments,
    upcomingTasks,
    recentConversations,
    progress,
    scales,
    reminder,
    protocolNext
  } = data;

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

  const commitmentItems = [
    ...(commitments?.goals || []),
    ...(commitments?.patterns || [])
  ].slice(0, 5);

  const showTherapeuticProtocol =
    protocolNext?.line && protocolNext?.source === 'therapeutic_record';

  const reminderIsPressable = displayedReminder?.kind === 'chat';

  return (
    <View style={styles.card} accessibilityRole="summary">
      <View style={styles.headerRow}>
        <Ionicons name="compass-outline" size={22} color={colors.white} style={styles.headerIcon} />
        <Text style={styles.title}>{DASH.FOCUS_TITLE}</Text>
      </View>

      {displayedReminder ? (
        <TouchableOpacity
          style={[styles.reminderStrip, !reminderIsPressable && styles.reminderStripStatic]}
          onPress={reminderIsPressable ? onReminderPress : undefined}
          disabled={!reminderIsPressable}
          accessibilityRole={reminderIsPressable ? 'button' : 'text'}
          accessibilityLabel={`${DASH.FOCUS_REMINDER_SECTION}. ${displayedReminder.title}`}
        >
          <Ionicons
            name={reminderIcon(displayedReminder.kind)}
            size={22}
            color="#A3B8E8"
            style={styles.reminderIcon}
          />
          <View style={styles.reminderTextWrap}>
            <Text style={styles.reminderSection}>{DASH.FOCUS_REMINDER_SECTION}</Text>
            <Text style={styles.reminderTitle}>{displayedReminder.title}</Text>
            {displayedReminder.subtitle ? (
              <Text style={styles.reminderSubtitle} numberOfLines={2}>
                {displayedReminder.subtitle}
              </Text>
            ) : null}
            {reminderIsPressable ? (
              <Text style={styles.reminderTapHint}>{DASH.FOCUS_REMINDER_TAP_CHAT}</Text>
            ) : null}
          </View>
        </TouchableOpacity>
      ) : null}

      {showTherapeuticProtocol ? (
        <View style={styles.protocolBox}>
          <Text style={styles.sectionTitle}>{DASH.FOCUS_PROTOCOL}</Text>
          <Text style={styles.protocolText}>{protocolNext.line}</Text>
        </View>
      ) : null}

      {focus?.line ? <Text style={styles.focusLine}>{focus.line}</Text> : null}

      {focus?.isSparseActivity ? (
        <TouchableOpacity
          style={styles.sparseCta}
          onPress={onOpenChat}
          accessibilityRole="button"
          accessibilityLabel={DASH.FOCUS_START_CHAT}
        >
          <Text style={styles.sparseCtaText}>{DASH.FOCUS_START_CHAT}</Text>
        </TouchableOpacity>
      ) : null}

      <TouchableOpacity
        style={styles.chatCta}
        onPress={onOpenChat}
        accessibilityRole="button"
        accessibilityLabel={DASH.FOCUS_CHAT_CTA}
      >
        <Ionicons name="chatbubble-ellipses-outline" size={18} color={colors.primary} style={styles.chatCtaIcon} />
        <Text style={styles.chatCtaText}>{DASH.FOCUS_CHAT_CTA}</Text>
      </TouchableOpacity>

      {narrative?.themes || narrative?.microWins ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{DASH.FOCUS_SUMMARY}</Text>
          {narrative.themes ? <Text style={styles.body}>{narrative.themes}</Text> : null}
          {narrative.microWins ? (
            <Text style={[styles.body, styles.microWins]}>{narrative.microWins}</Text>
          ) : null}
        </View>
      ) : null}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{DASH.FOCUS_COMMITMENTS}</Text>
        {commitmentItems.length === 0 ? (
          <Text style={styles.muted}>{DASH.FOCUS_NO_COMMITMENTS}</Text>
        ) : (
          commitmentItems.map((c, i) => (
            <Text key={`c-${i}`} style={styles.bullet}>
              • {c}
            </Text>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{DASH.FOCUS_UPCOMING_TASKS}</Text>
        {!upcomingTasks || upcomingTasks.length === 0 ? (
          <Text style={styles.muted}>{DASH.FOCUS_NO_TASKS}</Text>
        ) : (
          upcomingTasks.slice(0, 5).map((t) => (
            <View key={t._id} style={styles.taskRow}>
              <Text style={styles.taskTitle} numberOfLines={1}>
                {t.title}
              </Text>
              <Text style={styles.taskDue}>{formatDue(t.dueDate)}</Text>
            </View>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{DASH.FOCUS_RECENT_CHATS}</Text>
        {!recentConversations || recentConversations.length === 0 ? (
          <Text style={styles.muted}>{DASH.FOCUS_NO_CHATS}</Text>
        ) : (
          recentConversations.map((c) => (
            <TouchableOpacity
              key={c.conversationId}
              style={styles.convRow}
              onPress={() => handleConv(c.conversationId)}
              accessibilityRole="button"
            >
              <Text style={styles.convPreview} numberOfLines={2}>
                {c.lastMessagePreview || '…'}
              </Text>
              <Text style={styles.convMeta}>
                {c.messageCount} msg · {formatDue(c.updatedAt)}
              </Text>
            </TouchableOpacity>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{DASH.FOCUS_PROGRESS}</Text>
        <Text style={styles.body}>
          Chat: {progress?.chatUserMessagesWeek ?? 0} mensajes · {progress?.chatActiveDaysWeek ?? 0} días activos ·
          Tareas completadas: {progress?.tasksCompletedInWeek ?? 0}
          {!isCompact ? (
            <>
              {' '}
              · Avances hábitos: {progress?.habitsCompletionsInWeek ?? 0}
            </>
          ) : null}
        </Text>
      </View>

      {(scales?.phq9 || scales?.gad7) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{DASH.FOCUS_SCALES}</Text>
          <Text style={styles.disclaimer}>{scales.disclaimer}</Text>
          {scales.phq9 ? (
            <Text style={styles.body}>
              PHQ-9: puntuación {scales.phq9.totalScore} ({scales.phq9.severityLabel || '—'}) ·{' '}
              {formatDue(scales.phq9.completedAt)}
            </Text>
          ) : null}
          {scales.gad7 ? (
            <Text style={styles.body}>
              GAD-7: puntuación {scales.gad7.totalScore} ({scales.gad7.severityLabel || '—'}) ·{' '}
              {formatDue(scales.gad7.completedAt)}
            </Text>
          ) : null}
        </View>
      )}
    </View>
  );
};

export default memo(DashboardFocusCard);

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(29, 27, 112, 0.55)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(163, 184, 232, 0.25)'
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10
  },
  headerIcon: {
    marginRight: 8
  },
  title: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700'
  },
  reminderStrip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(163, 184, 232, 0.2)'
  },
  reminderStripStatic: {
    opacity: 1
  },
  reminderIcon: {
    marginRight: 10,
    marginTop: 2
  },
  reminderTextWrap: {
    flex: 1
  },
  reminderSection: {
    color: '#A3B8E8',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 4
  },
  reminderTitle: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20
  },
  reminderSubtitle: {
    color: '#C8D4F5',
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18
  },
  reminderTapHint: {
    color: '#8FA4D6',
    fontSize: 12,
    marginTop: 6,
    fontStyle: 'italic'
  },
  protocolBox: {
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(163, 184, 232, 0.25)'
  },
  protocolText: {
    color: '#E8ECFF',
    fontSize: 14,
    lineHeight: 20
  },
  focusLine: {
    color: '#E8ECFF',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12
  },
  sparseCta: {
    alignSelf: 'flex-start',
    marginBottom: 10,
    paddingVertical: 6,
    paddingHorizontal: 4
  },
  sparseCtaText: {
    color: '#B8C8F5',
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline'
  },
  chatCta: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.white,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    marginBottom: 14
  },
  chatCtaIcon: {
    marginRight: 8
  },
  chatCtaText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 14
  },
  section: {
    marginBottom: 14
  },
  sectionTitle: {
    color: '#A3B8E8',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  body: {
    color: colors.white,
    fontSize: 14,
    lineHeight: 20
  },
  microWins: {
    marginTop: 6,
    opacity: 0.95
  },
  muted: {
    color: '#8FA4D6',
    fontSize: 14,
    fontStyle: 'italic'
  },
  bullet: {
    color: colors.white,
    fontSize: 14,
    lineHeight: 22
  },
  taskRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6
  },
  taskTitle: {
    color: colors.white,
    fontSize: 14,
    flex: 1
  },
  taskDue: {
    color: '#A3B8E8',
    fontSize: 12
  },
  convRow: {
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(163, 184, 232, 0.2)'
  },
  convPreview: {
    color: colors.white,
    fontSize: 14
  },
  convMeta: {
    color: '#8FA4D6',
    fontSize: 12,
    marginTop: 4
  },
  disclaimer: {
    color: '#8FA4D6',
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 6
  }
});
