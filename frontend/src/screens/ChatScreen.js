/**
 * Pantalla de Chat
 *
 * Orquesta la UI del chat usando useChatScreen y subcomponentes (ChatHeader,
 * ChatInput, ChatMessageItem, ChatTypingIndicator, ClearConversationModal).
 *
 * @author AntoApp Team
 */

import { Ionicons } from '@expo/vector-icons';
import React, { useCallback } from 'react';
import {
  Animated,
  FlatList,
  Image,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import ChatHeader from '../components/chat/ChatHeader';
import ChatInput from '../components/chat/ChatInput';
import ChatMessageItem from '../components/chat/ChatMessageItem';
import ChatTypingIndicator from '../components/chat/ChatTypingIndicator';
import ClearConversationModal from '../components/chat/ClearConversationModal';
import OfflineBanner from '../components/OfflineBanner';
import ParticleBackground from '../components/ParticleBackground';
import { SkeletonBlock } from '../components/Skeleton';
import TrialBanner from '../components/TrialBanner';
import { useChatScreen } from '../hooks/useChatScreen';
import {
  CHAT_COLORS,
  ICON_SIZES,
  LAYOUT,
  MESSAGE_ID_PREFIXES,
  TEXTS,
} from './chat/chatScreenConstants';

const BACKGROUND_IMAGE = require('../images/back.png');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CHAT_COLORS.BACKGROUND,
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
    padding: LAYOUT.EMPTY_CONTAINER_PADDING,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyText: {
    color: CHAT_COLORS.ACCENT,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptySubtext: {
    color: CHAT_COLORS.ACCENT,
    fontSize: 14,
    opacity: 0.85,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 24,
  },
  skeletonContainer: {
    flex: 1,
    paddingHorizontal: 14,
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
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
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
    borderRadius: LAYOUT.SCROLL_BUTTON_BORDER_RADIUS,
    backgroundColor: CHAT_COLORS.SCROLL_BUTTON_BACKGROUND,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: CHAT_COLORS.SCROLL_BUTTON_BORDER,
  },
});

const ChatScreen = () => {
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
    handleScroll,
    handleBack,
    navigation,
  } = useChatScreen();

  const handleSuggestionPress = useCallback(
    (suggestion) => {
      if (suggestion?.screen) {
        try {
          navigation.navigate(suggestion.screen);
        } catch (err) {
          console.warn('Error navegando a pantalla:', suggestion.screen, err);
          setInputText(`Quiero probar: ${suggestion.label || ''}`);
        }
      } else {
        setInputText(`Quiero probar: ${suggestion?.label || ''}`);
      }
    },
    [navigation, setInputText]
  );

  const handleSuggestionDismiss = useCallback((message, index) => {
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
      />
    ),
    [handleSuggestionPress, handleSuggestionDismiss]
  );

  const keyExtractor = useCallback((item) => {
    const message = item.userMessage || item.assistantMessage || item;
    return message._id || message.id || `${MESSAGE_ID_PREFIXES.MESSAGE}-${Date.now()}-${Math.random()}`;
  }, []);

  const listEmptyComponent = useCallback(
    () => (
      <View style={styles.emptyContainer}>
        <Ionicons
          name="chatbubble-ellipses-outline"
          size={64}
          color={CHAT_COLORS.ACCENT}
          style={styles.emptyIcon}
        />
        <Text style={styles.emptyText}>{TEXTS.EMPTY}</Text>
        <Text style={styles.emptySubtext}>{TEXTS.EMPTY_SUBTITLE}</Text>
      </View>
    ),
    []
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
        barStyle="light-content"
      />

      <ChatHeader onBack={handleBack} onOpenMenu={() => setShowClearModal(true)} />

      <OfflineBanner />

      {trialInfo?.isInTrial && !trialBannerDismissed && (
        <TrialBanner
          daysRemaining={trialInfo.daysRemaining}
          onDismiss={handleTrialBannerDismiss}
          dismissed={trialBannerDismissed}
        />
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
            onContentSizeChange={() => scrollToBottom(false)}
            onLayout={() => scrollToBottom(false)}
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

      <ChatInput
        value={inputText}
        onChangeText={setInputText}
        onSend={handleSend}
        inputRef={inputRef}
      />

      {showScrollButton && (
        <TouchableOpacity
          style={styles.scrollToBottomButton}
          onPress={() => scrollToBottom()}
        >
          <Ionicons name="chevron-down" size={ICON_SIZES.SCROLL} color={CHAT_COLORS.WHITE} />
        </TouchableOpacity>
      )}

      <ClearConversationModal
        visible={showClearModal}
        onConfirm={clearConversation}
        onCancel={() => setShowClearModal(false)}
      />
    </View>
  );
};

export default ChatScreen;
