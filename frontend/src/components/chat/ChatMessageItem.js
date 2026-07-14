/**
 * Renderiza un ítem del chat: burbuja de mensaje (usuario/asistente/error) o bloque de sugerencias.
 */

import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import ActionSuggestionCard from '../ActionSuggestionCard';
import { useLanguage } from '../../context/LanguageContext';
import { hydrateInterventionSuggestion } from '../../utils/psychoeducationTopic';
import PsychoeducationSuggestionCard from '../PsychoeducationSuggestionCard';
import MarkdownText from '../MarkdownText';
import TccLiteMessageFooter from './TccLiteMessageFooter';
import AiLimitInfoButton from '../common/AiLimitInfoButton';
import { AI_LIMIT_TOPIC } from '../../constants/aiCompetenceLimits';
import { SPACING } from '../../constants/ui';
import { useTheme } from '../../context/ThemeContext';
import {
  LAYOUT,
  MESSAGE_ROLES,
  MESSAGE_TYPES,
  TYPING_ANIMATION_DELAYS,
  TYPING_ANIMATION_DURATION,
  TYPING_ANIMATION_TO_VALUE,
  TYPING_TRANSLATE_Y,
  useChatColors,
  useChatTexts,
} from '../../screens/chat/chatScreenConstants';
import {
  buildCommitmentDisplayTitle,
  isGenericCommitmentLabel,
} from '../../utils/commitmentDisplayCopy';
import { looksLikeChatBubbleCommitmentLabel } from '../../utils/commitmentLabelUtils';
import { useSectionTranslations } from '../../hooks/useTranslations';

function resolveCommitmentProposalLabel(proposal, texts) {
  const raw = String(proposal?.label || '').trim();
  if (!raw || looksLikeChatBubbleCommitmentLabel(raw)) {
    return texts.CHAT_COMMITMENT_DEFAULT_LABEL || '';
  }
  return raw;
}

function AnimatedDot({ delay, dotStyle, styles }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: TYPING_ANIMATION_TO_VALUE,
          duration: TYPING_ANIMATION_DURATION,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: TYPING_ANIMATION_DURATION,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [anim, delay]);

  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] });
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, TYPING_TRANSLATE_Y] });

  return (
    <Animated.View style={[styles.streamingDot, dotStyle, { opacity, transform: [{ translateY }] }]} />
  );
}

function StreamingDots({ isBot, styles }) {
  return (
    <View style={styles.streamingDotsContainer}>
      {TYPING_ANIMATION_DELAYS.map((delay, i) => (
        <AnimatedDot
          key={i}
          delay={delay}
          dotStyle={isBot ? styles.streamingDotBot : styles.streamingDotUser}
          styles={styles}
        />
      ))}
    </View>
  );
}

const createStyles = (themeColors, c) =>
  StyleSheet.create({
  messageContainer: {
    flexDirection: 'row',
    marginBottom: LAYOUT.MESSAGE_CONTAINER_MARGIN_BOTTOM,
    maxWidth: '100%',
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
  },
  botMessageContainer: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '100%',
    padding: LAYOUT.MESSAGE_BUBBLE_PADDING,
    borderRadius: LAYOUT.MESSAGE_BUBBLE_BORDER_RADIUS,
    marginBottom: LAYOUT.MESSAGE_BUBBLE_MARGIN_BOTTOM,
  },
  userBubble: {
    maxWidth: '92%',
    backgroundColor: c.USER_BUBBLE,
    borderBottomRightRadius: LAYOUT.MESSAGE_BUBBLE_CORNER_RADIUS,
    marginLeft: 'auto',
  },
  botBubble: {
    backgroundColor: c.BOT_BUBBLE,
    borderBottomLeftRadius: LAYOUT.MESSAGE_BUBBLE_CORNER_RADIUS,
    marginRight: 'auto',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.BOT_BUBBLE_BORDER,
  },
  errorBubble: {
    backgroundColor: c.ERROR_BUBBLE_BACKGROUND,
    borderColor: c.ERROR_BUBBLE_BORDER,
    borderWidth: 1,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userMessageText: {
    color: c.USER_TEXT,
  },
  botMessageText: {
    color: c.BOT_TEXT,
  },
  messageTextBold: {
    fontWeight: 'bold',
  },
  userMessageTextBold: {
    fontWeight: 'bold',
    color: c.USER_TEXT,
  },
  botMessageTextBold: {
    fontWeight: 'bold',
    color: c.BOT_TEXT,
  },
  errorText: {
    color: c.ERROR,
  },
  suggestionsContainer: {
    marginBottom: 16,
    paddingHorizontal: 14,
  },
  commitmentFollowUpShell: {
    alignSelf: 'flex-start',
    width: '92%',
    maxWidth: '92%',
    marginTop: SPACING.sm,
  },
  suggestionsTitle: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: c.ACCENT,
    marginBottom: 12,
  },
  productProposalCard: {
    marginBottom: 12,
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: themeColors.border,
    backgroundColor: themeColors.cardBackground ?? themeColors.chromeCard,
    shadowColor: themeColors.glassShadow ?? themeColors.shadowAmbient,
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  productProposalTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  productProposalChip: {
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: themeColors.accentLine ?? themeColors.border,
    backgroundColor: themeColors.accentLineSoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  productProposalChipText: {
    color: themeColors.primary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  productProposalHint: {
    color: themeColors.textSecondary,
    fontSize: 11,
  },
  productProposalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: themeColors.text,
    marginBottom: 6,
  },
  productProposalSub: {
    fontSize: 12.5,
    color: themeColors.textSecondary,
    marginBottom: 7,
  },
  productProposalTitle: {
    fontSize: 14,
    lineHeight: 19,
    color: themeColors.text,
    fontStyle: 'italic',
    marginBottom: 2,
  },
  productProposalWhy: {
    fontSize: 11.5,
    color: themeColors.textSecondary,
    marginTop: 6,
    marginBottom: 8,
    borderLeftWidth: 2,
    borderLeftColor: themeColors.accentLine ?? themeColors.border,
    paddingLeft: 8,
    lineHeight: 16,
  },
  proposalDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: themeColors.border,
    marginBottom: 8,
  },
  proposalEditInput: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: themeColors.border,
    borderRadius: 10,
    paddingHorizontal: 11,
    paddingVertical: 8,
    color: themeColors.text,
    fontSize: 13,
    marginTop: 7,
    backgroundColor: themeColors.chromeInput,
    minHeight: 40,
    textAlignVertical: 'top',
  },
  proposalEditInputMultiline: {
    minHeight: 56,
  },  proposalActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 8,
  },
  proposalPrimaryBtn: {
    flex: 1,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: themeColors.accentLine ?? themeColors.border,
    backgroundColor: themeColors.accentLineSoft,
    paddingVertical: 9,
    alignItems: 'center',
  },
  proposalPrimaryBtnText: {
    color: themeColors.primary,
    fontSize: 12.5,
    fontWeight: '700',
  },
  proposalGhostBtn: {
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: themeColors.border,
    backgroundColor: themeColors.chromeListRow ?? themeColors.chromeInputDisabled,
    paddingVertical: 9,
    paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
    alignItems: 'center',
  },
  proposalGhostBtnText: {
    color: themeColors.textSecondary,
    fontSize: 12.5,
    fontWeight: '600',
  },
  statusCard: {
    marginBottom: 10,
    paddingVertical: 10,
    paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: themeColors.border,
    backgroundColor: themeColors.cardBackground ?? themeColors.chromeCard,
  },
  statusCardText: {
    color: themeColors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },
  streamingDotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streamingDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginHorizontal: 2,
  },
  streamingDotBot: {
    backgroundColor: c.BOT_TEXT,
  },
  streamingDotUser: {
    backgroundColor: c.USER_TEXT,
  },
  botColumn: {
    maxWidth: '94%',
    alignSelf: 'flex-start',
  },
  feedbackRow: {
    marginTop: 6,
    marginBottom: LAYOUT.MESSAGE_CONTAINER_MARGIN_BOTTOM,
    paddingLeft: 2,
  },
  feedbackHint: {
    fontSize: 11,
    color: c.ACCENT,
    opacity: 0.75,
    marginBottom: 6,
  },
  feedbackButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  feedbackButton: {
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  commitmentFollowUpCard: {
    borderRadius: LAYOUT.MESSAGE_BUBBLE_BORDER_RADIUS,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: themeColors.border,
    backgroundColor: themeColors.cardBackground || themeColors.surface || themeColors.background,
    padding: LAYOUT.MESSAGE_BUBBLE_PADDING + 2,
    width: '100%',
  },
  commitmentFollowUpLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: themeColors.text,
    marginBottom: 4,
  },
  commitmentFollowUpPrompt: {
    fontSize: 13,
    lineHeight: 18,
    color: themeColors.textSecondary,
    marginBottom: 10,
  },
  commitmentFollowUpChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  commitmentFollowUpChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: themeColors.primary,
    backgroundColor: themeColors.accentLineSoft || 'transparent',
  },
  commitmentFollowUpChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: themeColors.primary,
  },
  });

const COMMITMENT_FOLLOW_UP_COPY = {
  es: { yes: 'Lo hice', partial: 'A medias', no: 'Aún no', skip: 'Omitir por ahora' },
  en: { yes: 'I did it', partial: 'Partly', no: 'Not yet', skip: 'Skip for now' },
};

function ChatMessageItem({
  item,
  onSuggestionPress,
  onSuggestionDismiss,
  onProductProposalPress,
  onProductProposalReject,
  onCommitmentFollowUpAnswer,
  onCommitmentProposalPress,
  onCommitmentProposalReject,
  onEmergencyContactAlertConfirm,
  onEmergencyContactAlertReject,
  emergencyContactAlertConfirmingId = null,
  onOpenAiLimitsLibrary,
}) {
  const { language } = useLanguage();
  const TEXTS = useChatTexts();
  const DASH = useSectionTranslations('DASH');
  const { colors } = useTheme();
  const chatColors = useChatColors();
  const styles = useMemo(() => createStyles(colors, chatColors), [colors, chatColors]);

  const [proposalDraftEdits, setProposalDraftEdits] = useState({});
  const [commitmentSavingId, setCommitmentSavingId] = useState(null);
  const message = item.userMessage || item.assistantMessage || item;
  const isUser = message.role === MESSAGE_ROLES.USER;
  const rawId = message._id || message.id;

  const parseDateOrNull = (raw) => {
    const s = String(raw || '').trim();
    if (!s) return null;
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return null;
    return d.toISOString();
  };

  const getStatusText = (status) => {
    if (!status?.paused) return null;
    if (status.reason === 'cooldown') {
      const sec = Number(status.cooldownSecondsRemaining || 0);
      if (sec > 0) {
        const min = Math.max(1, Math.ceil(sec / 60));
        return TEXTS.PRODUCT_STATUS_COOLDOWN_WITH_MIN.replace('{minutes}', String(min));
      }
      return TEXTS.PRODUCT_STATUS_COOLDOWN;
    }
    if (status.reason === 'cap') {
      return TEXTS.PRODUCT_STATUS_CAP;
    }
    if (status.reason === 'user_reject_streak') {
      return TEXTS.PRODUCT_STATUS_REJECT_STREAK;
    }
    return null;
  };

  if (message.type === 'product_action_status') {
    const txt = getStatusText(message.status);
    if (!txt) return null;
    return (
      <View style={styles.suggestionsContainer}>
        <View style={styles.statusCard}>
          <Text style={styles.statusCardText}>{txt}</Text>
        </View>
      </View>
    );
  }

  if (message.type === 'emergency_contact_alert_offer' && message.proposedEmergencyContactAlert) {
    const offer = message.proposedEmergencyContactAlert;
    const offerKey = String(message.id || message._id || offer.id);
    const isConfirming = emergencyContactAlertConfirmingId === offerKey;
    return (
      <View style={styles.suggestionsContainer}>
        <View style={styles.productProposalTopRow}>
          <Text style={styles.suggestionsTitle}>{TEXTS.EMERGENCY_CONTACT_ALERT_OFFER_TITLE}</Text>
          <AiLimitInfoButton
            topicId={AI_LIMIT_TOPIC.EMERGENCY_CONTACTS}
            size={18}
            color={colors.textSecondary}
            onOpenFullLibrary={onOpenAiLimitsLibrary}
          />
        </View>
        <View style={styles.productProposalCard}>
          <Text style={styles.productProposalTitle}>{offer.message}</Text>
          <View style={styles.proposalActionsRow}>
            <TouchableOpacity
              style={[styles.proposalPrimaryBtn, isConfirming && { opacity: 0.6 }]}
              onPress={() => onEmergencyContactAlertConfirm?.(message)}
              disabled={isConfirming}
              accessibilityRole="button"
              accessibilityState={{ disabled: isConfirming }}
            >
              <Text style={styles.proposalPrimaryBtnText}>
                {TEXTS.EMERGENCY_CONTACT_ALERT_OFFER_YES}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.proposalGhostBtn, isConfirming && { opacity: 0.6 }]}
              onPress={() => onEmergencyContactAlertReject?.(message)}
              disabled={isConfirming}
              accessibilityRole="button"
              accessibilityState={{ disabled: isConfirming }}
            >
              <Text style={styles.proposalGhostBtnText}>
                {TEXTS.EMERGENCY_CONTACT_ALERT_OFFER_NO}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  if (message.type === 'commitment_proposals' && message.proposedCommitments?.length) {
    return (
      <View style={styles.suggestionsContainer}>
        <Text style={styles.suggestionsTitle}>{TEXTS.CHAT_COMMITMENT_PROPOSE_TITLE}</Text>
        {message.proposedCommitments.map((proposal) => {
          const defaultLabel = resolveCommitmentProposalLabel(proposal, TEXTS);
          const edited = proposalDraftEdits[proposal.id]?.label;
          const value = edited != null ? edited : defaultLabel;
          const isSaving = commitmentSavingId === proposal.id;
          const isBusy = Boolean(commitmentSavingId);
          return (
          <View key={proposal.id} style={styles.productProposalCard}>
            {proposal.rationaleShort ? (
              <Text style={styles.productProposalWhy}>{proposal.rationaleShort}</Text>
            ) : null}
            <TextInput
              style={[styles.proposalEditInput, styles.proposalEditInputMultiline]}
              placeholder={TEXTS.CHAT_COMMITMENT_LABEL_PLACEHOLDER}
              placeholderTextColor={colors.textMuted ?? colors.textSecondary}
              value={value}
              multiline
              numberOfLines={3}
              maxLength={120}
              editable={!isBusy}
              onChangeText={(next) =>
                setProposalDraftEdits((prev) => ({
                  ...prev,
                  [proposal.id]: { ...(prev[proposal.id] || {}), label: next },
                }))
              }
            />
            <View style={styles.proposalActionsRow}>
              <TouchableOpacity
                style={[styles.proposalPrimaryBtn, isBusy && { opacity: 0.65 }]}
                disabled={isBusy}
                onPress={async () => {
                  if (isBusy) return;
                  setCommitmentSavingId(proposal.id);
                  try {
                    const edit = proposalDraftEdits[proposal.id] || {};
                    const ok = await onCommitmentProposalPress?.(
                      {
                        ...proposal,
                        label: (edit.label != null ? edit.label : defaultLabel) || proposal.label,
                      },
                      message,
                    );
                    if (ok) {
                      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
                        () => {},
                      );
                    } else {
                      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(
                        () => {},
                      );
                    }
                  } finally {
                    setCommitmentSavingId(null);
                  }
                }}
                accessibilityRole="button"
                accessibilityState={{ disabled: isBusy, busy: isSaving }}
              >
                <Text style={styles.proposalPrimaryBtnText}>
                  {isSaving
                    ? TEXTS.CHAT_COMMITMENT_SAVING
                    : TEXTS.CHAT_COMMITMENT_SAVE}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.proposalGhostBtn, isBusy && { opacity: 0.65 }]}
                disabled={isBusy}
                onPress={() => onCommitmentProposalReject?.(message)}
                accessibilityRole="button"
                accessibilityState={{ disabled: isBusy }}
              >
                <Text style={styles.proposalGhostBtnText}>{TEXTS.CHAT_COMMITMENT_DISMISS}</Text>
              </TouchableOpacity>
            </View>
          </View>
          );
        })}
      </View>
    );
  }

  if (message.type === 'product_proposals' && message.proposedProductActions?.length) {
    return (
      <View style={styles.suggestionsContainer}>
        <View style={styles.productProposalTopRow}>
          <Text style={styles.suggestionsTitle}>{TEXTS.PRODUCT_ACTIONS_TITLE}</Text>
          <AiLimitInfoButton
            topicId={AI_LIMIT_TOPIC.CHAT_ACTIONS}
            size={18}
            color={colors.textSecondary}
            onOpenFullLibrary={onOpenAiLimitsLibrary}
          />
        </View>
        {message.proposedProductActions.map((action) => (
          <View key={action.id} style={styles.productProposalCard}>
            <View style={styles.productProposalTopRow}>
              <View style={styles.productProposalChip}>
                <Text style={styles.productProposalChipText}>
                  {action.type === 'propose_habit'
                    ? TEXTS.PRODUCT_PROPOSAL_TYPE_HABIT
                    : TEXTS.PRODUCT_PROPOSAL_TYPE_TASK}
                </Text>
              </View>
              <Text style={styles.productProposalHint}>{TEXTS.PRODUCT_PROPOSAL_HINT_EDIT}</Text>
            </View>
            <Text style={styles.productProposalLabel}>
              {action.type === 'propose_habit'
                ? TEXTS.PRODUCT_PROPOSAL_LABEL_HABIT
                : TEXTS.PRODUCT_PROPOSAL_LABEL_TASK}
            </Text>
            {action.rationaleShort ? (
              <Text style={styles.productProposalWhy}>
                {TEXTS.PRODUCT_PROPOSAL_CONTEXT_PREFIX} {action.rationaleShort}
              </Text>
            ) : null}
            {action.draft?.title ? (
              <Text style={styles.productProposalTitle} numberOfLines={2}>
                “{action.draft.title}”
              </Text>
            ) : null}
            <View style={styles.proposalDivider} />
            <TextInput
              style={styles.proposalEditInput}
              placeholder={TEXTS.PRODUCT_PROPOSAL_TITLE_PLACEHOLDER}
              placeholderTextColor={colors.textMuted ?? colors.textSecondary}
              value={proposalDraftEdits[action.id]?.title ?? action.draft?.title ?? ''}
              onChangeText={(value) =>
                setProposalDraftEdits((prev) => ({
                  ...prev,
                  [action.id]: {
                    ...(prev[action.id] || {}),
                    title: value,
                  },
                }))
              }
            />
            <TextInput
              style={styles.proposalEditInput}
              placeholder={TEXTS.PRODUCT_PROPOSAL_WHEN_PLACEHOLDER}
              placeholderTextColor={colors.textMuted ?? colors.textSecondary}
              value={proposalDraftEdits[action.id]?.when ?? ''}
              onChangeText={(value) =>
                setProposalDraftEdits((prev) => ({
                  ...prev,
                  [action.id]: {
                    ...(prev[action.id] || {}),
                    when: value,
                  },
                }))
              }
            />
            <View style={styles.proposalActionsRow}>
              <TouchableOpacity
                style={styles.proposalPrimaryBtn}
                onPress={() => {
                  const edit = proposalDraftEdits[action.id] || {};
                  const nextAction = {
                    ...action,
                    draft: {
                      ...action.draft,
                      ...(edit.title ? { title: edit.title } : {}),
                    },
                  };
                  const parsedWhen = parseDateOrNull(edit.when);
                  if (parsedWhen) {
                    if (action.type === 'propose_habit') {
                      nextAction.draft.reminder = {
                        ...(nextAction.draft.reminder || {}),
                        enabled: true,
                        time: parsedWhen,
                      };
                    } else {
                      nextAction.draft.dueDate = parsedWhen;
                    }
                  }
                  onProductProposalPress?.(nextAction, message);
                }}
                accessibilityRole="button"
              >
                <Text style={styles.proposalPrimaryBtnText}>
                  {TEXTS.PRODUCT_PROPOSAL_CREATE}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.proposalGhostBtn}
                onPress={() => onProductProposalReject?.(message)}
                accessibilityRole="button"
              >
                <Text style={styles.proposalGhostBtnText}>
                  {TEXTS.PRODUCT_PROPOSAL_DISMISS}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    );
  }

  if (message.type === 'suggestions' && message.suggestions) {
    return (
      <View style={styles.suggestionsContainer}>
        <Text style={styles.suggestionsTitle}>{TEXTS.SUGGESTIONS_TITLE}</Text>
        {message.suggestions.map((suggestion, index) => {
          const hydrated = hydrateInterventionSuggestion(suggestion, language);
          const isPsychoed =
            hydrated?.cardVariant === 'psychoeducation_native' ||
            hydrated?.interventionType === 'psychoeducation';
          const isMicroGuide =
            hydrated?.cardVariant === 'micro_guide_native' ||
            hydrated?.interventionType === 'micro_guide';
          const Card = isPsychoed
            ? PsychoeducationSuggestionCard
            : isMicroGuide
              ? PsychoeducationSuggestionCard
              : ActionSuggestionCard;
          return (
            <Card
              key={hydrated.id || index}
              suggestion={hydrated}
              onPress={() => onSuggestionPress?.(hydrated, index)}
              onDismiss={() => onSuggestionDismiss?.(message, index)}
            />
          );
        })}
      </View>
    );
  }

  if (message.type === 'commitment_follow_up' && message.commitmentFollowUp?.id) {
    const cf = message.commitmentFollowUp;
    if (isGenericCommitmentLabel(cf.label)) return null;
    const L = COMMITMENT_FOLLOW_UP_COPY[language === 'en' ? 'en' : 'es'];
    const title = buildCommitmentDisplayTitle({ label: cf.label }, DASH);
    const prompt =
      DASH.FOCUS_COMMITMENT_FOLLOW_UP_SHORT ||
      (language === 'en' ? 'Were you able to do it?' : '¿Pudiste hacerlo?');
    const options = [
      ['yes', L.yes],
      ['partial', L.partial],
      ['no', L.no],
      ['skipped', L.skip],
    ];
    return (
      <View style={styles.suggestionsContainer}>
        <View
          style={styles.commitmentFollowUpShell}
          accessibilityRole="summary"
          accessibilityLabel={`${title}. ${prompt}`}
        >
          <View style={styles.commitmentFollowUpCard}>
            {title ? (
              <Text style={styles.commitmentFollowUpLabel} numberOfLines={2}>
                {title}
              </Text>
            ) : null}
            <Text style={styles.commitmentFollowUpPrompt}>{prompt}</Text>
            <View style={styles.commitmentFollowUpChips}>
            {options.map(([answer, label]) => (
              <TouchableOpacity
                key={answer}
                style={styles.commitmentFollowUpChip}
                onPress={() => onCommitmentFollowUpAnswer?.(cf.id, answer, message)}
                accessibilityRole="button"
                accessibilityLabel={label}
              >
                <Text style={styles.commitmentFollowUpChipText}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        </View>
      </View>
    );
  }

  const bubble = (
    <View
      style={[
        styles.messageBubble,
        isUser ? styles.userBubble : styles.botBubble,
        message.type === MESSAGE_TYPES.ERROR && styles.errorBubble,
      ]}
    >
      {message.metadata?.streaming && !message.content ? (
        <StreamingDots isBot={!isUser} styles={styles} />
      ) : (
        <MarkdownText
          style={[
            styles.messageText,
            isUser ? styles.userMessageText : styles.botMessageText,
            message.type === MESSAGE_TYPES.ERROR && styles.errorText,
          ]}
          boldStyle={[
            styles.messageTextBold,
            isUser ? styles.userMessageTextBold : styles.botMessageTextBold,
          ]}
        >
          {message.content}
        </MarkdownText>
      )}
      {!isUser && message.metadata?.tccLite ? (
        <TccLiteMessageFooter tccLite={message.metadata.tccLite} />
      ) : null}
    </View>
  );

  return (
    <View
      style={[
        styles.messageContainer,
        isUser ? styles.userMessageContainer : styles.botMessageContainer,
      ]}
    >
      {isUser ? (
        bubble
      ) : (
        <View style={styles.botColumn}>{bubble}</View>
      )}
    </View>
  );
}

export default React.memo(ChatMessageItem);
