/**
 * Renderiza un ítem del chat: burbuja de mensaje (usuario/asistente/error) o bloque de sugerencias.
 */

import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import ActionSuggestionCard from '../ActionSuggestionCard';
import MarkdownText from '../MarkdownText';
import { SPACING } from '../../constants/ui';
import { useTheme } from '../../context/ThemeContext';
import {
  LAYOUT,
  MESSAGE_ROLES,
  MESSAGE_TYPES,
  TEXTS,
  TYPING_ANIMATION_DELAYS,
  TYPING_ANIMATION_DURATION,
  TYPING_ANIMATION_TO_VALUE,
  TYPING_TRANSLATE_Y,
  useChatColors,
} from '../../screens/chat/chatScreenConstants';

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
    borderWidth: 1,
    borderColor: 'rgba(30, 131, 211, 0.28)',
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    shadowColor: themeColors.glassShadow,
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
    borderWidth: 1,
    borderColor: 'rgba(30, 131, 211, 0.45)',
    backgroundColor: 'rgba(30, 131, 211, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  productProposalChipText: {
    color: c.PRIMARY,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  productProposalHint: {
    color: c.ACCENT,
    fontSize: 11,
    opacity: 0.88,
  },
  productProposalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: c.BOT_TEXT,
    marginBottom: 6,
  },
  productProposalSub: {
    fontSize: 12.5,
    color: c.ACCENT,
    opacity: 0.92,
    marginBottom: 7,
  },
  productProposalTitle: {
    fontSize: 14,
    lineHeight: 19,
    color: c.BOT_TEXT,
    fontStyle: 'italic',
    marginBottom: 2,
  },
  productProposalWhy: {
    fontSize: 11.5,
    color: c.ACCENT,
    opacity: 0.9,
    marginTop: 6,
    marginBottom: 8,
    borderLeftWidth: 2,
    borderLeftColor: 'rgba(30, 131, 211, 0.35)',
    paddingLeft: 8,
    lineHeight: 16,
  },
  proposalDivider: {
    height: 1,
    backgroundColor: 'rgba(36, 35, 79, 0.08)',
    marginBottom: 8,
  },
  proposalEditInput: {
    borderWidth: 1,
    borderColor: themeColors.border,
    borderRadius: 10,
    paddingHorizontal: 11,
    paddingVertical: 8,
    color: c.BOT_TEXT,
    fontSize: 13,
    marginTop: 7,
    backgroundColor: themeColors.chromeInput,
  },
  proposalActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 8,
  },
  proposalPrimaryBtn: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(30, 131, 211, 0.45)',
    backgroundColor: 'rgba(30, 131, 211, 0.14)',
    paddingVertical: 9,
    alignItems: 'center',
  },
  proposalPrimaryBtnText: {
    color: c.PRIMARY,
    fontSize: 12.5,
    fontWeight: '700',
  },
  proposalGhostBtn: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(36, 35, 79, 0.14)',
    backgroundColor: 'rgba(36, 35, 79, 0.04)',
    paddingVertical: 9,
    paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
    alignItems: 'center',
  },
  proposalGhostBtnText: {
    color: c.ACCENT,
    fontSize: 12.5,
    fontWeight: '600',
  },
  statusCard: {
    marginBottom: 10,
    paddingVertical: 10,
    paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(36, 35, 79, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
  },
  statusCardText: {
    color: c.ACCENT,
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
  });

function isValidMongoMessageId(id) {
  const s = id != null ? String(id) : '';
  return /^[a-f0-9]{24}$/i.test(s);
}

function ChatMessageItem({
  item,
  onSuggestionPress,
  onSuggestionDismiss,
  onProductProposalPress,
  onProductProposalReject,
  feedbackEnabled,
  feedbackTargetId,
  onMessageFeedback,
  feedbackSubmittingId,
}) {
  const { colors } = useTheme();
  const chatColors = useChatColors();
  const styles = useMemo(() => createStyles(colors, chatColors), [colors, chatColors]);

  const [proposalDraftEdits, setProposalDraftEdits] = useState({});
  const message = item.userMessage || item.assistantMessage || item;
  const isUser = message.role === MESSAGE_ROLES.USER;
  const rawId = message._id || message.id;
  const isFeedbackAnchor =
    feedbackTargetId != null && String(rawId) === String(feedbackTargetId);
  const showFeedback =
    feedbackEnabled &&
    isFeedbackAnchor &&
    !isUser &&
    !message.metadata?.streaming &&
    (message.content || '').trim().length > 0 &&
    isValidMongoMessageId(rawId) &&
    message.type !== MESSAGE_TYPES.ERROR;
  const currentVote = message.metadata?.userFeedback?.helpful;
  const feedbackBusy =
    Boolean(feedbackSubmittingId) && String(feedbackSubmittingId) === String(rawId);

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
        return `Sugerencias en pausa unos minutos (${min} min) para no saturar la conversación.`;
      }
      return 'Sugerencias en pausa un momento para no saturar la conversación.';
    }
    if (status.reason === 'cap') {
      return 'En esta conversación ya alcanzamos el límite de sugerencias por ahora.';
    }
    if (status.reason === 'user_reject_streak') {
      return 'Reducimos la intensidad de las sugerencias porque no parecían útiles.';
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

  const handleThumb = (dir) => {
    if (!onMessageFeedback || !showFeedback || feedbackBusy) return;
    const next = currentVote === dir ? null : dir;
    onMessageFeedback(String(rawId), next);
  };

  if (message.type === 'product_proposals' && message.proposedProductActions?.length) {
    return (
      <View style={styles.suggestionsContainer}>
        <Text style={styles.suggestionsTitle}>{TEXTS.PRODUCT_ACTIONS_TITLE}</Text>
        {message.proposedProductActions.map((action) => (
          <View key={action.id} style={styles.productProposalCard}>
            <View style={styles.productProposalTopRow}>
              <View style={styles.productProposalChip}>
                <Text style={styles.productProposalChipText}>
                  {action.type === 'propose_habit' ? 'Hábito' : 'Tarea'}
                </Text>
              </View>
              <Text style={styles.productProposalHint}>Editar rápido</Text>
            </View>
            <Text style={styles.productProposalLabel}>
              {action.type === 'propose_habit' ? 'Sugerencia de hábito' : 'Sugerencia de tarea'}
            </Text>
            {action.rationaleShort ? (
              <Text style={styles.productProposalWhy}>Contexto: {action.rationaleShort}</Text>
            ) : null}
            {action.draft?.title ? (
              <Text style={styles.productProposalTitle} numberOfLines={2}>
                “{action.draft.title}”
              </Text>
            ) : null}
            <View style={styles.proposalDivider} />
            <TextInput
              style={styles.proposalEditInput}
              placeholder="Título (verbo + objeto + contexto)"
              placeholderTextColor="rgba(92, 90, 120, 0.62)"
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
              placeholder="Fecha/hora opcional (YYYY-MM-DD HH:mm)"
              placeholderTextColor="rgba(92, 90, 120, 0.62)"
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
                <Text style={styles.proposalPrimaryBtnText}>Crear</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.proposalGhostBtn}
                onPress={() => onProductProposalReject?.(message)}
                accessibilityRole="button"
              >
                <Text style={styles.proposalGhostBtnText}>No aplica</Text>
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
        {message.suggestions.map((suggestion, index) => (
          <ActionSuggestionCard
            key={suggestion.id || index}
            suggestion={suggestion}
            onPress={() => onSuggestionPress?.(suggestion, index)}
            onDismiss={() => onSuggestionDismiss?.(message, index)}
          />
        ))}
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
        <View style={styles.botColumn}>
          {bubble}
          {showFeedback ? (
            <View style={styles.feedbackRow}>
              <Text style={styles.feedbackHint}>{TEXTS.FEEDBACK_HINT}</Text>
              <View style={styles.feedbackButtons}>
                <TouchableOpacity
                  style={[styles.feedbackButton, { marginRight: 14 }]}
                  onPress={() => handleThumb('up')}
                  disabled={feedbackBusy}
                  accessibilityLabel={TEXTS.FEEDBACK_HELPFUL}
                  accessibilityRole="button"
                  accessibilityState={{ selected: currentVote === 'up', disabled: feedbackBusy }}
                >
                  <Ionicons
                    name={currentVote === 'up' ? 'thumbs-up' : 'thumbs-up-outline'}
                    size={20}
                    color={currentVote === 'up' ? chatColors.PRIMARY : chatColors.ACCENT}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.feedbackButton}
                  onPress={() => handleThumb('down')}
                  disabled={feedbackBusy}
                  accessibilityLabel={TEXTS.FEEDBACK_NOT_HELPFUL}
                  accessibilityRole="button"
                  accessibilityState={{ selected: currentVote === 'down', disabled: feedbackBusy }}
                >
                  <Ionicons
                    name={currentVote === 'down' ? 'thumbs-down' : 'thumbs-down-outline'}
                    size={20}
                    color={currentVote === 'down' ? chatColors.PRIMARY : chatColors.ACCENT}
                  />
                </TouchableOpacity>
              </View>
            </View>
          ) : null}
        </View>
      )}
    </View>
  );
}

export default React.memo(ChatMessageItem);
