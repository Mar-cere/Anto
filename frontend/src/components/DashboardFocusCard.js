/**
 * Bloque "foco actual" (#34): vista minimal — sin contenido de chat fuera del chat;
 * recordatorio priorizado (metadatos), línea de foco, opcional siguiente tarea y CTA al chat.
 */
import { Ionicons } from '@expo/vector-icons';
import React, { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';
import { useSectionTranslations } from '../hooks/useTranslations';
import { createDashboardFocusStyles } from '../styles/focusCardTheme';
import { updateSessionCommitment, renegotiateSessionCommitment } from '../services/sessionCommitmentsService';
import { getLastSessionDisplayText, truncateFocusPreviewText } from '../utils/dashboardHomeUtils';
import {
  buildFocusHabitOpenPayload,
  resolveFocusNextHabit,
} from '../utils/focusNextHabitNavigation';
import {
  buildFocusTaskOpenPayload,
  resolveFocusNextTask,
} from '../utils/focusNextTaskNavigation';
import { filterDashboardCommitments } from '../utils/commitmentLabelUtils';
import { postCommitmentTelemetry } from '../utils/commitmentTelemetry';
import { MAX_FOCUS_COMMITMENT_FOLLOW_UP_ATTEMPTS } from '../utils/focusCardConstants';
import {
  buildFocusActionRows,
  buildFocusBaWeekCopy,
  buildFocusExposureCopy,
  buildFocusNextHabitCopy,
  buildFocusNextTaskCopy,
} from '../utils/focusActionRows';
import { FOCUS_COMPACT_WIDTH, resolveDisplayedReminder } from '../utils/focusReminderNormalization';
import DashboardFocusActiveBlock from './dashboard/DashboardFocusActiveBlock';
import DashboardFocusCommitmentsSection from './dashboard/DashboardFocusCommitmentsSection';
import FocusActionRow from './dashboard/FocusActionRow';

const DashboardFocusCard = ({
  data,
  onOpenChat,
  onOpenConversation,
  onOpenBehavioralActivation,
  onOpenExposureHierarchy,
  onOpenNextTask,
  onOpenNextHabit,
  onCommitmentsChanged,
  onOpenFocusProgress,
  onOpenFocusOnboarding,
  onSaveCustomGoal,
}) => {
  const DASH = useSectionTranslations('DASH');
  const FOCUS_PROGRESS = useSectionTranslations('FOCUS_PROGRESS');
  const { showToast } = useToast();
  const { language } = useLanguage();
  const { width } = useWindowDimensions();
  const { colors, resolvedScheme } = useTheme();
  const styles = useMemo(
    () => createDashboardFocusStyles(colors, resolvedScheme),
    [colors, resolvedScheme],
  );

  const handleConv = useCallback(
    (id, options) => {
      if (onOpenConversation) onOpenConversation(id, options);
    },
    [onOpenConversation],
  );

  const isCompact = width < FOCUS_COMPACT_WIDTH;
  const reminder = data?.reminder;
  const lastSession = data?.lastSessionSummary;
  const focus = data?.focus;
  const activeFocus = data?.activeFocus;
  const protocolNext = data?.protocolNext;
  const nextTask = useMemo(() => resolveFocusNextTask(data), [data]);
  const nextHabit = useMemo(() => resolveFocusNextHabit(data), [data]);
  const baWeekNext = data?.baWeekNext;
  const exposureNext = data?.exposureNext;
  const commitments = Array.isArray(data?.commitments) ? data.commitments : [];

  const lastSessionFullText = useMemo(
    () => getLastSessionDisplayText(lastSession),
    [lastSession],
  );
  const lastSessionText = useMemo(
    () => truncateFocusPreviewText(lastSessionFullText, 88),
    [lastSessionFullText],
  );
  const hasChatContinuity = Boolean(lastSessionFullText);
  const lastSessionConvId = lastSession?.conversationId ? String(lastSession.conversationId) : null;

  const visibleCommitments = useMemo(
    () =>
      filterDashboardCommitments(commitments, {
        hasBaWeekRow: Boolean(baWeekNext),
        hasChatContinuity,
        continuityConversationId: lastSessionConvId,
      }),
    [commitments, baWeekNext, hasChatContinuity, lastSessionConvId],
  );

  const reportedFollowUpRef = useRef(new Set());
  const isCommitmentFollowUpDue = useCallback((item) => {
    return (
      item?.followUpAnswer === 'pending' &&
      item?.followUpDue === true &&
      Number(item?.followUpAttempts || 0) < MAX_FOCUS_COMMITMENT_FOLLOW_UP_ATTEMPTS
    );
  }, []);

  const [renegotiateId, setRenegotiateId] = React.useState(null);
  const [renegotiateLabel, setRenegotiateLabel] = React.useState('');
  const [partialNoteId, setPartialNoteId] = React.useState(null);
  const [partialNote, setPartialNote] = React.useState('');

  useEffect(() => {
    visibleCommitments.forEach((item) => {
      if (!item?.id || !isCommitmentFollowUpDue(item)) return;
      if (reportedFollowUpRef.current.has(item.id)) return;
      reportedFollowUpRef.current.add(item.id);
      void postCommitmentTelemetry({ event: 'follow_up_shown', surface: 'dashboard' });
    });
  }, [visibleCommitments, isCommitmentFollowUpDue]);

  const handleCommitmentAnswer = useCallback(
    async (id, answer) => {
      if (!id) return;
      try {
        await updateSessionCommitment(id, { followUpAnswer: answer });
        const item = commitments.find((c) => c.id === id);
        if (answer === 'no') {
          setPartialNoteId(null);
          setPartialNote('');
          setRenegotiateId(id);
          setRenegotiateLabel(String(item?.label || ''));
        } else if (answer === 'partial') {
          setRenegotiateId(null);
          setRenegotiateLabel(String(item?.label || ''));
          setPartialNoteId(id);
          setPartialNote(String(item?.partialNote || ''));
        } else {
          setRenegotiateId(null);
          setRenegotiateLabel('');
          setPartialNoteId(null);
          setPartialNote('');
        }
        onCommitmentsChanged?.();
      } catch (_) {
        showToast({ message: DASH.FOCUS_COMMITMENT_ACTION_ERROR, type: 'error' });
      }
    },
    [onCommitmentsChanged, commitments, showToast, DASH.FOCUS_COMMITMENT_ACTION_ERROR],
  );

  const handleCommitmentOmit = useCallback(
    async (id) => {
      if (!id) return;
      try {
        await updateSessionCommitment(id, { status: 'skipped' });
        setRenegotiateId(null);
        setRenegotiateLabel('');
        setPartialNoteId(null);
        setPartialNote('');
        onCommitmentsChanged?.();
      } catch (_) {
        showToast({ message: DASH.FOCUS_COMMITMENT_ACTION_ERROR, type: 'error' });
      }
    },
    [onCommitmentsChanged, showToast, DASH.FOCUS_COMMITMENT_ACTION_ERROR],
  );

  const handleCommitmentRenegotiate = useCallback(
    async (id) => {
      const label = String(renegotiateLabel || '').trim();
      if (!id || label.length < 2) return;
      try {
        await renegotiateSessionCommitment(id, { label });
        setRenegotiateId(null);
        setRenegotiateLabel('');
        setPartialNoteId(null);
        setPartialNote('');
        onCommitmentsChanged?.();
      } catch (_) {
        showToast({ message: DASH.FOCUS_COMMITMENT_ACTION_ERROR, type: 'error' });
      }
    },
    [onCommitmentsChanged, renegotiateLabel, showToast, DASH.FOCUS_COMMITMENT_ACTION_ERROR],
  );

  const handlePartialNoteSave = useCallback(
    async (id, { dismissWithoutNote = false } = {}) => {
      if (!id) return;
      try {
        const note = dismissWithoutNote ? '' : String(partialNote || '').trim();
        await updateSessionCommitment(id, { partialNote: note });
        setPartialNoteId(null);
        setPartialNote('');
        onCommitmentsChanged?.();
      } catch (_) {
        showToast({ message: DASH.FOCUS_COMMITMENT_ACTION_ERROR, type: 'error' });
      }
    },
    [onCommitmentsChanged, partialNote, showToast, DASH.FOCUS_COMMITMENT_ACTION_ERROR],
  );

  const baWeekCopy = useMemo(() => buildFocusBaWeekCopy(baWeekNext, DASH), [baWeekNext, DASH]);
  const exposureCopy = useMemo(
    () => buildFocusExposureCopy(exposureNext, DASH),
    [exposureNext, DASH],
  );

  const displayedReminder = useMemo(
    () => resolveDisplayedReminder(reminder, isCompact, language, DASH),
    [reminder, isCompact, language, DASH],
  );

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

  const experientialFollowUpDue = data?.experientialFollowUpDue?.id
    ? data.experientialFollowUpDue
    : null;

  const onExperientialFollowUpPress = useCallback(() => {
    if (!experientialFollowUpDue || !onOpenConversation) return;
    const cid = experientialFollowUpDue.conversationId
      ? String(experientialFollowUpDue.conversationId)
      : lastSessionConvId;
    onOpenConversation(cid || null, {
      resumeCommitmentFollowUp: false,
      resumeExperientialFollowUp: true,
    });
  }, [experientialFollowUpDue, onOpenConversation, lastSessionConvId]);

  const onBaWeekPress = useCallback(() => {
    if (!onOpenBehavioralActivation) return;
    onOpenBehavioralActivation(baWeekNext?.slotId ? String(baWeekNext.slotId) : null);
  }, [onOpenBehavioralActivation, baWeekNext?.slotId]);

  const onExposurePress = useCallback(() => {
    if (!onOpenExposureHierarchy) return;
    onOpenExposureHierarchy(exposureNext?.planId ? String(exposureNext.planId) : null);
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

  const showNextTaskRow = nextTask?.title && displayedReminder?.kind !== 'task';
  const showNextHabitRow = nextHabit?.title && displayedReminder?.kind !== 'habit';

  const chevronMuted =
    resolvedScheme === 'dark' ? 'rgba(245, 247, 255, 0.35)' : 'rgba(36, 35, 79, 0.28)';

  const nextTaskCopy = useMemo(
    () => buildFocusNextTaskCopy({ showNextTaskRow, nextTask, DASH, language }),
    [showNextTaskRow, nextTask, DASH, language],
  );

  const nextHabitCopy = useMemo(
    () => buildFocusNextHabitCopy({ showNextHabitRow, nextHabit, DASH, language }),
    [showNextHabitRow, nextHabit, DASH, language],
  );

  const actionRows = useMemo(
    () =>
      buildFocusActionRows({
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
        experientialFollowUpDue,
        onExperientialFollowUpPress,
      }),
    [
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
      experientialFollowUpDue,
      onExperientialFollowUpPress,
    ],
  );

  const showChatCta = Boolean(onOpenChat) && !hasChatContinuity;
  const hasAlternateChatEntry = showChatReminder || showChatCta || showLastSessionRow;
  const showSparseChatLink =
    Boolean(focus?.isSparseActivity && onOpenChat) && !hasAlternateChatEntry;

  const showFocusHero = (() => {
    const line = String(focus?.line || '').trim();
    if (!line) return false;
    if (hasChatContinuity || focus?.suppressForChatContinuity) return false;
    return true;
  })();

  const hasActiveFocus = Boolean(activeFocus?.themeId && activeFocus.status === 'active');
  const showStartFocusCta =
    !hasActiveFocus && Boolean(onOpenFocusOnboarding) && actionRows.length === 0;

  if (!data) return null;

  return (
    <View
      style={styles.section}
      accessibilityRole="summary"
      accessibilityLabel={DASH.FOCUS_REMINDER_SECTION}
    >
      <View style={styles.card}>
        <DashboardFocusActiveBlock
          activeFocus={activeFocus}
          hasActiveFocus={hasActiveFocus}
          FOCUS_PROGRESS={FOCUS_PROGRESS}
          colors={colors}
          styles={styles}
          onOpenFocusProgress={onOpenFocusProgress}
          onOpenFocusOnboarding={onOpenFocusOnboarding}
          onSaveCustomGoal={onSaveCustomGoal}
          showStartFocusCta={showStartFocusCta}
        />

        {showFocusHero ? (
          <Text style={styles.focusHero} accessibilityRole="text">
            {String(focus.line).trim()}
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
                    subtitleLines={row.subtitleLines}
                    styles={styles}
                    iconColor={colors.primary}
                    chevronColor={chevronMuted}
                  />
                </View>
              ))}
            </View>
            {!hasActiveFocus && onOpenFocusOnboarding ? (
              <Pressable
                onPress={onOpenFocusOnboarding}
                style={({ pressed }) => [
                  styles.activeFocusInlineLink,
                  pressed && { opacity: 0.85 },
                ]}
                accessibilityRole="button"
                accessibilityLabel={FOCUS_PROGRESS.GOAL_START_CTA}
              >
                <Text style={styles.activeFocusStartCta}>{FOCUS_PROGRESS.GOAL_START_CTA}</Text>
              </Pressable>
            ) : null}
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

        {showSparseChatLink ? (
          <Pressable
            style={({ pressed }) => [styles.sparseLink, pressed && { opacity: 0.85 }]}
            onPress={onOpenChat}
            accessibilityRole="button"
            accessibilityLabel={DASH.FOCUS_START_CHAT}
          >
            <Text style={styles.sparseLinkText}>{DASH.FOCUS_START_CHAT}</Text>
          </Pressable>
        ) : null}

        <DashboardFocusCommitmentsSection
          visibleCommitments={visibleCommitments}
          DASH={DASH}
          styles={styles}
          chevronMuted={chevronMuted}
          renegotiateId={renegotiateId}
          renegotiateLabel={renegotiateLabel}
          setRenegotiateId={setRenegotiateId}
          setRenegotiateLabel={setRenegotiateLabel}
          partialNoteId={partialNoteId}
          partialNote={partialNote}
          setPartialNoteId={setPartialNoteId}
          setPartialNote={setPartialNote}
          isCommitmentFollowUpDue={isCommitmentFollowUpDue}
          handleCommitmentAnswer={handleCommitmentAnswer}
          handleCommitmentOmit={handleCommitmentOmit}
          handleCommitmentRenegotiate={handleCommitmentRenegotiate}
          handlePartialNoteSave={handlePartialNoteSave}
          handleConv={handleConv}
          onOpenChat={onOpenChat}
        />

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
