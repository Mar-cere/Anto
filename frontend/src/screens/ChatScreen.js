/**
 * Pantalla de Chat
 *
 * Orquesta la UI del chat usando useChatScreen y subcomponentes (ChatHeader,
 * ChatInput, ChatMessageItem, ChatTypingIndicator, ClearConversationModal).
 *
 * @author AntoApp Team
 */

import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useCallback, useMemo } from 'react';
import {
  Animated,
  FlatList,
  Image,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import ChatHeader from '../components/chat/ChatHeader';
import ChatInput from '../components/chat/ChatInput';
import ChatMessageItem from '../components/chat/ChatMessageItem';
import SessionIntentionBanner from '../components/chat/SessionIntentionBanner';
import ChatTypingIndicator from '../components/chat/ChatTypingIndicator';
import ChatOptionsSheet from '../components/chat/ChatOptionsSheet';
import ClearConversationModal from '../components/chat/ClearConversationModal';
import OfflineBanner from '../components/OfflineBanner';
import PendingOfflineMessageBanner from '../components/chat/PendingOfflineMessageBanner';
import ParticleBackground from '../components/ParticleBackground';
import { SkeletonBlock } from '../components/Skeleton';
import TrialBanner from '../components/TrialBanner';
import { useTheme } from '../context/ThemeContext';
import { useChatScreen } from '../hooks/useChatScreen';
import {
  recordInterventionClicked,
  recordInterventionDismissed,
} from '../utils/recordInterventionCompleted';
import { getFeedbackTargetMessageId } from './chat/chatFeedbackAnchor';
import { SPACING } from '../constants/ui';
import {
  formatGuestQuotaBanner,
  ICON_SIZES,
  LAYOUT,
  MESSAGE_ID_PREFIXES,
  STORAGE_KEYS,
  useChatColors,
  useChatTexts,
} from './chat/chatScreenConstants';

const BACKGROUND_IMAGE = require('../images/back.png');
const PRIVACY_URL = 'https://www.antoapps.com/privacidad';

function createChatScreenStyles(c, themeColors) {
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: c.BACKGROUND,
    paddingTop: Platform.OS === 'ios' ? LAYOUT.CONTAINER_PADDING_TOP_IOS : 0,
  },
  backgroundImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: LAYOUT.BACKGROUND_OPACITY,
  },
  chatContainer: {
    flex: 1,
  },
  messagesList: {
    paddingHorizontal: LAYOUT.MESSAGES_LIST_PADDING_HORIZONTAL,
    paddingTop: LAYOUT.MESSAGES_LIST_PADDING_TOP,
    paddingBottom: LAYOUT.MESSAGES_LIST_PADDING_BOTTOM,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: LAYOUT.EMPTY_CONTAINER_PADDING_VERTICAL,
    paddingHorizontal: LAYOUT.EMPTY_CONTAINER_PADDING_HORIZONTAL,
  },
  emptyKicker: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: c.ACCENT,
    marginBottom: 14,
    textAlign: 'center',
  },
  emptyIcon: {
    marginBottom: 14,
    opacity: 0.92,
  },
  emptyText: {
    color: c.BOT_TEXT,
    fontSize: 17,
    fontWeight: '600',
    lineHeight: 24,
    textAlign: 'center',
  },
  emptySubtext: {
    color: c.INPUT_PLACEHOLDER,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 10,
    paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
  },
  skeletonContainer: {
    flex: 1,
    paddingHorizontal: LAYOUT.MESSAGES_LIST_PADDING_HORIZONTAL,
    paddingTop: 16,
    paddingBottom: 16,
  },
  skeletonRow: {
    width: '100%',
    marginBottom: 14,
  },
  skeletonRowAssistant: {
    alignItems: 'flex-start',
  },
  skeletonRowUser: {
    alignItems: 'flex-end',
  },
  skeletonBubble: {
    width: '86%',
    paddingVertical: 12,
    paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
    borderRadius: 16,
    backgroundColor: themeColors.glassFillStrong,
    borderWidth: 1,
    borderColor: themeColors.border,
  },
  skeletonBubbleAssistant: {
    borderTopLeftRadius: 6,
  },
  skeletonBubbleUser: {
    borderTopRightRadius: 6,
  },
  skeletonLineSpacing: {
    marginTop: 10,
  },
  typingIndicatorContainer: {
    paddingHorizontal: LAYOUT.TYPING_INDICATOR_PADDING_HORIZONTAL,
    paddingBottom: LAYOUT.TYPING_INDICATOR_PADDING_BOTTOM,
  },
  scrollToBottomButton: {
    position: 'absolute',
    right: LAYOUT.SCROLL_BUTTON_RIGHT,
    bottom: LAYOUT.SCROLL_BUTTON_BOTTOM,
    width: LAYOUT.SCROLL_BUTTON_SIZE,
    height: LAYOUT.SCROLL_BUTTON_SIZE,
    zIndex: 1,
    elevation: 1,
    borderRadius: LAYOUT.SCROLL_BUTTON_BORDER_RADIUS,
    backgroundColor: c.SCROLL_BUTTON_BACKGROUND,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.SCROLL_BUTTON_BORDER,
  },
  aiModalOverlay: {
    flex: 1,
    backgroundColor: c.MODAL_OVERLAY,
    justifyContent: 'center',
    padding: SPACING.SCREEN_EDGE_INSET,
  },
  aiModalCard: {
    backgroundColor: c.MODAL_BACKGROUND,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.MODAL_BORDER,
    padding: 22,
  },
  aiModalTitle: {
    color: c.BOT_TEXT,
    fontSize: 19,
    fontWeight: '700',
    marginBottom: 10,
  },
  aiModalText: {
    color: c.INPUT_PLACEHOLDER,
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 18,
  },
  aiModalActions: {
    gap: 10,
  },
  aiPolicyButton: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: themeColors.accentLine,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  aiPolicyButtonText: {
    color: c.ACCENT,
    fontSize: 14,
    fontWeight: '600',
  },
  aiContinueButton: {
    backgroundColor: c.SEND_BUTTON_BACKGROUND,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.SEND_BUTTON_BORDER,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
  },
  aiContinueButtonText: {
    color: c.BOT_TEXT,
    fontSize: 15,
    fontWeight: '700',
  },
  handoffModalCard: {
    maxHeight: '82%',
  },
  handoffModalScroll: {
    maxHeight: 280,
    marginBottom: 14,
  },
  handoffPrivacyText: {
    color: c.ACCENT,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 14,
    opacity: 0.9,
    fontStyle: 'italic',
  },
  guestBanner: {
    paddingVertical: LAYOUT.GUEST_BANNER_PADDING_VERTICAL,
    paddingHorizontal: LAYOUT.GUEST_BANNER_PADDING_HORIZONTAL,
    backgroundColor: c.GUEST_BANNER_BACKGROUND,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: c.GUEST_BANNER_BORDER,
  },
  guestBannerText: {
    color: c.ACCENT,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  });
}

const ChatScreen = () => {
  const TEXTS = useChatTexts();
  const { colors: themeColors, statusBarStyle } = useTheme();
  const chatColors = useChatColors();
  const styles = useMemo(
    () => createChatScreenStyles(chatColors, themeColors),
    [chatColors, themeColors],
  );

  const {
    messages,
    setMessages,
    inputText,
    setInputText,
    isLoading,
    isTyping,
    showScrollButton,
    showClearModal,
    setShowClearModal,
    trialInfo,
    trialBannerDismissed,
    handleTrialBannerDismiss,
    refreshing,
    fadeAnim,
    flatListRef,
    inputRef,
    handleSend,
    clearConversation,
    refreshMessages,
    scrollToBottom,
    handleMessagesContentSizeChange,
    handleMessagesListLayout,
    handleScroll,
    handleBack,
    navigation,
    guestQuota,
    guestHandoffModal,
    guestHandoffStartFresh,
    guestHandoffUseSummary,
    isOffline,
    offlinePendingMessage,
    retryOfflinePending,
    chatFeedbackEnabled,
    handleMessageFeedback,
    handleProductProposalPress,
    handleProductProposalReject,
    feedbackSubmittingId,
    showSessionIntentionPrompt,
    sessionIntentionSubmitting,
    selectSessionIntention,
    skipSessionIntention,
  } = useChatScreen();
  const feedbackTargetId = useMemo(
    () => getFeedbackTargetMessageId(messages, chatFeedbackEnabled),
    [messages, chatFeedbackEnabled]
  );
  const [showAIDisclosure, setShowAIDisclosure] = React.useState(false);
  const [showChatOptions, setShowChatOptions] = React.useState(false);

  React.useEffect(() => {
    let isMounted = true;
    const checkDisclosure = async () => {
      try {
        const ack = await AsyncStorage.getItem(STORAGE_KEYS.AI_DISCLOSURE_ACK);
        if (!ack && isMounted) {
          setShowAIDisclosure(true);
        }
      } catch (error) {
        console.warn(TEXTS.AI_DISCLOSURE_READ_WARN, error);
      }
    };
    checkDisclosure();
    return () => {
      isMounted = false;
    };
  }, [TEXTS.AI_DISCLOSURE_READ_WARN]);

  const handleAIDisclosureAcknowledge = useCallback(async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.AI_DISCLOSURE_ACK, 'true');
    } catch (error) {
      console.warn(TEXTS.AI_DISCLOSURE_SAVE_WARN, error);
    } finally {
      setShowAIDisclosure(false);
    }
  }, [TEXTS.AI_DISCLOSURE_SAVE_WARN]);

  const handleOpenPrivacyPolicy = useCallback(async () => {
    try {
      const canOpen = await Linking.canOpenURL(PRIVACY_URL);
      if (canOpen) {
        await Linking.openURL(PRIVACY_URL);
      }
    } catch (error) {
      console.warn(TEXTS.PRIVACY_OPEN_WARN, error);
    }
  }, [TEXTS.PRIVACY_OPEN_WARN]);

  const handleOpenAIDetails = useCallback(() => {
    try {
      navigation.navigate('AIPrivacy');
    } catch (error) {
      console.warn(TEXTS.PRIVACY_SCREEN_WARN, error);
    }
  }, [navigation, TEXTS.PRIVACY_SCREEN_WARN]);

  const handleOpenChatCustomization = useCallback(() => {
    try {
      navigation.navigate('Ajustes', { expandChatCustomization: true });
    } catch (error) {
      console.warn(TEXTS.SETTINGS_OPEN_WARN, error);
    }
  }, [navigation, TEXTS.SETTINGS_OPEN_WARN]);

  const handleSuggestionPress = useCallback(
    (suggestion) => {
      recordInterventionClicked(suggestion?.id);
      if (suggestion?.screen) {
        try {
          navigation.navigate(suggestion.screen, suggestion?.params || undefined);
        } catch (err) {
          console.warn(TEXTS.NAVIGATION_ERROR_WARN, suggestion.screen, err);
          setInputText(`${TEXTS.SUGGESTION_TRY_PREFIX}${suggestion.label || ''}`);
        }
      } else {
        setInputText(`${TEXTS.SUGGESTION_TRY_PREFIX}${suggestion?.label || ''}`);
      }
    },
    [navigation, setInputText, TEXTS.NAVIGATION_ERROR_WARN, TEXTS.SUGGESTION_TRY_PREFIX]
  );

  const handleSuggestionDismiss = useCallback((message, index) => {
    const dismissed = message?.suggestions?.[index];
    recordInterventionDismissed(dismissed?.id);
    setMessages((prev) =>
      prev
        .map((msg) => {
          if (msg !== message || msg.type !== 'suggestions' || !msg.suggestions) return msg;
          const updated = msg.suggestions.filter((_, i) => i !== index);
          return updated.length === 0 ? null : { ...msg, suggestions: updated };
        })
        .filter(Boolean)
    );
  }, [setMessages]);

  const renderMessage = useCallback(
    ({ item }) => (
      <ChatMessageItem
        item={item}
        onSuggestionPress={handleSuggestionPress}
        onSuggestionDismiss={handleSuggestionDismiss}
        onProductProposalPress={handleProductProposalPress}
        onProductProposalReject={handleProductProposalReject}
        feedbackEnabled={chatFeedbackEnabled}
        feedbackTargetId={feedbackTargetId}
        onMessageFeedback={handleMessageFeedback}
        feedbackSubmittingId={feedbackSubmittingId}
      />
    ),
    [
      handleSuggestionPress,
      handleSuggestionDismiss,
      handleProductProposalPress,
      handleProductProposalReject,
      chatFeedbackEnabled,
      feedbackTargetId,
      handleMessageFeedback,
      feedbackSubmittingId,
    ]
  );

  const keyExtractor = useCallback((item) => {
    const message = item.userMessage || item.assistantMessage || item;
    if (message?._id) return String(message._id);
    if (message?.id) return String(message.id);
    const ts = message?.createdAt || message?.metadata?.timestamp;
    const role = message?.role || 'unknown';
    const content = typeof message?.content === 'string' ? message.content.slice(0, 24) : '';
    if (ts) return `${MESSAGE_ID_PREFIXES.MESSAGE}-${role}-${String(ts)}-${content}`;
    return `${MESSAGE_ID_PREFIXES.MESSAGE}-${role}-${content}`;
  }, []);

  const listEmptyComponent = useCallback(
    () => (
      <View
        style={styles.emptyContainer}
        accessibilityRole="text"
        accessibilityLabel={`${TEXTS.EMPTY_KICKER}. ${TEXTS.EMPTY}. ${TEXTS.EMPTY_SUBTITLE}`}
      >
        <Text style={styles.emptyKicker}>{TEXTS.EMPTY_KICKER}</Text>
        <Ionicons
          name="chatbubble-ellipses-outline"
          size={56}
          color={chatColors.PRIMARY}
          style={styles.emptyIcon}
        />
        <Text style={styles.emptyText}>{TEXTS.EMPTY}</Text>
        <Text style={styles.emptySubtext}>{TEXTS.EMPTY_SUBTITLE}</Text>
      </View>
    ),
    [chatColors.PRIMARY, styles, TEXTS.EMPTY, TEXTS.EMPTY_KICKER, TEXTS.EMPTY_SUBTITLE],
  );

  return (
    <View style={styles.container}>
      <Image
        source={BACKGROUND_IMAGE}
        style={styles.backgroundImage}
        resizeMode="cover"
      />
      <ParticleBackground />
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={statusBarStyle}
      />

      <ChatHeader onBack={handleBack} onOpenMenu={() => setShowChatOptions(true)} />

      <ChatOptionsSheet
        visible={showChatOptions}
        onClose={() => setShowChatOptions(false)}
        onScrollToBottom={() => scrollToBottom(true, { force: true })}
        onOpenCustomization={handleOpenChatCustomization}
        onOpenPrivacy={handleOpenAIDetails}
        onOpenAiInfo={() => setShowAIDisclosure(true)}
        onRequestClearConversation={() => setShowClearModal(true)}
      />

      <OfflineBanner />

      <PendingOfflineMessageBanner
        visible={!!offlinePendingMessage}
        isOffline={isOffline}
        onRetry={retryOfflinePending}
        hintText={TEXTS.OFFLINE_PENDING_ONE}
        retryLabel={TEXTS.OFFLINE_PENDING_RETRY}
      />

      {trialInfo?.isInTrial && !trialBannerDismissed && (
        <TrialBanner
          daysRemaining={trialInfo.daysRemaining}
          hoursRemaining={trialInfo.hoursRemaining}
          onDismiss={handleTrialBannerDismiss}
          dismissed={trialBannerDismissed}
        />
      )}

      {guestQuota !== null && (
        <View style={styles.guestBanner} accessibilityRole="text">
          <Text style={styles.guestBannerText}>
            {formatGuestQuotaBanner(guestQuota.remaining, guestQuota.max, TEXTS)}
          </Text>
        </View>
      )}

      <Animated.View style={[styles.chatContainer, { opacity: fadeAnim }]}>
        {isLoading ? (
          <View style={styles.skeletonContainer}>
            {Array.from({ length: 6 }, (_, i) => {
              const isUser = i % 2 === 1;
              return (
                <View
                  key={`chat-skeleton-${i}`}
                  style={[
                    styles.skeletonRow,
                    isUser ? styles.skeletonRowUser : styles.skeletonRowAssistant,
                  ]}
                >
                  <View
                    style={[
                      styles.skeletonBubble,
                      isUser ? styles.skeletonBubbleUser : styles.skeletonBubbleAssistant,
                    ]}
                  >
                    <SkeletonBlock width={isUser ? '70%' : '78%'} height={12} radius={8} />
                    <SkeletonBlock
                      width={isUser ? '45%' : '55%'}
                      height={12}
                      radius={8}
                      style={styles.skeletonLineSpacing}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={keyExtractor}
            contentContainerStyle={styles.messagesList}
            onContentSizeChange={handleMessagesContentSizeChange}
            onLayout={handleMessagesListLayout}
            extraData={messages}
            onScroll={handleScroll}
            scrollEventThrottle={LAYOUT.SCROLL_EVENT_THROTTLE}
            refreshing={refreshing}
            onRefresh={refreshMessages}
            inverted={false}
            initialNumToRender={LAYOUT.FLATLIST_INITIAL_NUM_TO_RENDER}
            windowSize={LAYOUT.FLATLIST_WINDOW_SIZE}
            maxToRenderPerBatch={LAYOUT.FLATLIST_MAX_TO_RENDER_PER_BATCH}
            ListEmptyComponent={listEmptyComponent}
            ListFooterComponent={
              isTyping && !messages.some((m) => (m.metadata?.streaming && m.role === 'assistant'))
                ? ChatTypingIndicator
                : null
            }
            ListFooterComponentStyle={styles.typingIndicatorContainer}
          />
        )}
      </Animated.View>

      <SessionIntentionBanner
        visible={showSessionIntentionPrompt && guestQuota === null}
        submitting={sessionIntentionSubmitting}
        onSelect={selectSessionIntention}
        onSkip={skipSessionIntention}
      />

      <ChatInput
        value={inputText}
        onChangeText={setInputText}
        onSend={handleSend}
        inputRef={inputRef}
        sendDisabled={
          (guestQuota !== null && guestQuota.remaining <= 0) || isTyping
        }
      />

      {showScrollButton && (
        <TouchableOpacity
          style={styles.scrollToBottomButton}
          onPress={() => scrollToBottom(true, { force: true })}
          accessibilityRole="button"
          accessibilityLabel={TEXTS.SCROLL_TO_BOTTOM_LABEL}
        >
          <Ionicons name="chevron-down" size={ICON_SIZES.SCROLL} color={chatColors.PRIMARY} />
        </TouchableOpacity>
      )}

      <ClearConversationModal
        visible={showClearModal}
        onConfirm={clearConversation}
        onCancel={() => setShowClearModal(false)}
      />

      <Modal
        visible={showAIDisclosure}
        animationType="fade"
        transparent
        onRequestClose={handleAIDisclosureAcknowledge}
      >
        <View style={styles.aiModalOverlay}>
          <View style={styles.aiModalCard}>
            <Text style={styles.aiModalTitle}>{TEXTS.AI_MODAL_TITLE}</Text>
            <Text style={styles.aiModalText}>{TEXTS.AI_MODAL_MESSAGE}</Text>
            <View style={styles.aiModalActions}>
              <Pressable style={styles.aiPolicyButton} onPress={handleOpenPrivacyPolicy}>
                <Text style={styles.aiPolicyButtonText}>{TEXTS.AI_MODAL_POLICY}</Text>
              </Pressable>
              <Pressable style={styles.aiPolicyButton} onPress={handleOpenAIDetails}>
                <Text style={styles.aiPolicyButtonText}>{TEXTS.AI_MODAL_DETAILS}</Text>
              </Pressable>
              <Pressable style={styles.aiContinueButton} onPress={handleAIDisclosureAcknowledge}>
                <Text style={styles.aiContinueButtonText}>{TEXTS.AI_MODAL_CONTINUE}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={!!guestHandoffModal}
        animationType="fade"
        transparent
        onRequestClose={guestHandoffStartFresh}
      >
        <View style={styles.aiModalOverlay}>
          <View style={[styles.aiModalCard, styles.handoffModalCard]}>
            <Text style={styles.aiModalTitle}>{TEXTS.GUEST_HANDOFF_TITLE}</Text>
            <ScrollView
              style={styles.handoffModalScroll}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator
            >
              <Text style={styles.aiModalText}>{TEXTS.GUEST_HANDOFF_BODY}</Text>
              <Text style={styles.handoffPrivacyText}>{TEXTS.GUEST_HANDOFF_PRIVACY}</Text>
            </ScrollView>
            <View style={styles.aiModalActions}>
              <Pressable style={styles.aiPolicyButton} onPress={guestHandoffStartFresh}>
                <Text style={styles.aiPolicyButtonText}>{TEXTS.GUEST_HANDOFF_START_FRESH}</Text>
              </Pressable>
              <Pressable style={styles.aiContinueButton} onPress={guestHandoffUseSummary}>
                <Text style={styles.aiContinueButtonText}>{TEXTS.GUEST_HANDOFF_USE_SUMMARY}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default ChatScreen;
