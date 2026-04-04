/**
 * Renderiza un ítem del chat: burbuja de mensaje (usuario/asistente/error) o bloque de sugerencias.
 */

import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ActionSuggestionCard from '../ActionSuggestionCard';
import MarkdownText from '../MarkdownText';
import {
  CHAT_COLORS,
  LAYOUT,
  MESSAGE_ROLES,
  MESSAGE_TYPES,
  TEXTS,
  TYPING_ANIMATION_DELAYS,
  TYPING_ANIMATION_DURATION,
  TYPING_ANIMATION_TO_VALUE,
  TYPING_TRANSLATE_Y,
} from '../../screens/chat/chatScreenConstants';

function AnimatedDot({ delay, dotStyle }) {
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

function StreamingDots({ isBot }) {
  return (
    <View style={styles.streamingDotsContainer}>
      {TYPING_ANIMATION_DELAYS.map((delay, i) => (
        <AnimatedDot
          key={i}
          delay={delay}
          dotStyle={isBot ? styles.streamingDotBot : styles.streamingDotUser}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
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
    maxWidth: '80%',
    padding: LAYOUT.MESSAGE_BUBBLE_PADDING,
    borderRadius: LAYOUT.MESSAGE_BUBBLE_BORDER_RADIUS,
    marginBottom: LAYOUT.MESSAGE_BUBBLE_MARGIN_BOTTOM,
  },
  userBubble: {
    backgroundColor: CHAT_COLORS.USER_BUBBLE,
    borderBottomRightRadius: LAYOUT.MESSAGE_BUBBLE_CORNER_RADIUS,
    marginLeft: 'auto',
  },
  botBubble: {
    backgroundColor: CHAT_COLORS.BOT_BUBBLE,
    borderBottomLeftRadius: LAYOUT.MESSAGE_BUBBLE_CORNER_RADIUS,
    marginRight: 'auto',
  },
  errorBubble: {
    backgroundColor: CHAT_COLORS.ERROR_BUBBLE_BACKGROUND,
    borderColor: CHAT_COLORS.ERROR_BUBBLE_BORDER,
    borderWidth: 1,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userMessageText: {
    color: CHAT_COLORS.USER_TEXT,
  },
  botMessageText: {
    color: CHAT_COLORS.BOT_TEXT,
  },
  messageTextBold: {
    fontWeight: 'bold',
  },
  userMessageTextBold: {
    fontWeight: 'bold',
    color: CHAT_COLORS.USER_TEXT,
  },
  botMessageTextBold: {
    fontWeight: 'bold',
    color: CHAT_COLORS.BOT_TEXT,
  },
  errorText: {
    color: CHAT_COLORS.ERROR,
  },
  suggestionsContainer: {
    marginBottom: 16,
    paddingHorizontal: 14,
  },
  suggestionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: CHAT_COLORS.ACCENT,
    marginBottom: 8,
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
    backgroundColor: CHAT_COLORS.BOT_TEXT,
  },
  streamingDotUser: {
    backgroundColor: CHAT_COLORS.USER_TEXT,
  },
  botColumn: {
    maxWidth: '88%',
    alignSelf: 'flex-start',
  },
  feedbackRow: {
    marginTop: 6,
    marginBottom: LAYOUT.MESSAGE_CONTAINER_MARGIN_BOTTOM,
    paddingLeft: 2,
  },
  feedbackHint: {
    fontSize: 11,
    color: CHAT_COLORS.ACCENT,
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
  feedbackEnabled,
  feedbackTargetId,
  onMessageFeedback,
  feedbackSubmittingId,
}) {
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

  const handleThumb = (dir) => {
    if (!onMessageFeedback || !showFeedback || feedbackBusy) return;
    const next = currentVote === dir ? null : dir;
    onMessageFeedback(String(rawId), next);
  };

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
        <StreamingDots isBot={!isUser} />
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
                    color={currentVote === 'up' ? CHAT_COLORS.PRIMARY : CHAT_COLORS.ACCENT}
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
                    color={currentVote === 'down' ? CHAT_COLORS.PRIMARY : CHAT_COLORS.ACCENT}
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
