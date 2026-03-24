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
import React, { useCallback } from 'react';
import {
  Animated,
  FlatList,
  Image,
  Linking,
  Modal,
  Platform,
  Pressable,
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
const PRIVACY_URL = 'https://www.antoapps.com/privacidad';

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
  aiModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(3, 10, 36, 0.82)',
    justifyContent: 'center',
    padding: 20,
  },
  aiModalCard: {
    backgroundColor: '#1D2B5F',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(26, 221, 219, 0.3)',
    padding: 20,
  },
  aiModalTitle: {
    color: CHAT_COLORS.WHITE,
    fontSize: 19,
    fontWeight: '700',
    marginBottom: 10,
  },
  aiModalText: {
    color: CHAT_COLORS.ACCENT,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 18,
  },
  aiModalActions: {
    gap: 10,
  },
  aiPolicyButton: {
    borderWidth: 1,
    borderColor: 'rgba(163, 184, 232, 0.45)',
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
  },
  aiPolicyButtonText: {
    color: CHAT_COLORS.ACCENT,
    fontSize: 14,
    fontWeight: '600',
  },
  aiContinueButton: {
    backgroundColor: 'rgba(26, 221, 219, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(26, 221, 219, 0.5)',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  aiContinueButtonText: {
    color: CHAT_COLORS.WHITE,
    fontSize: 15,
    fontWeight: '700',
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
  const [showAIDisclosure, setShowAIDisclosure] = React.useState(false);

  React.useEffect(() => {
    let isMounted = true;
    const checkDisclosure = async () => {
      try {
        const ack = await AsyncStorage.getItem(STORAGE_KEYS.AI_DISCLOSURE_ACK);
        if (!ack && isMounted) {
          setShowAIDisclosure(true);
        }
      } catch (error) {
        console.warn('No se pudo leer estado de disclosure IA:', error);
      }
    };
    checkDisclosure();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleAIDisclosureAcknowledge = useCallback(async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.AI_DISCLOSURE_ACK, 'true');
    } catch (error) {
      console.warn('No se pudo guardar aceptación de disclosure IA:', error);
    } finally {
      setShowAIDisclosure(false);
    }
  }, []);

  const handleOpenPrivacyPolicy = useCallback(async () => {
    try {
      const canOpen = await Linking.canOpenURL(PRIVACY_URL);
      if (canOpen) {
        await Linking.openURL(PRIVACY_URL);
      }
    } catch (error) {
      console.warn('No se pudo abrir política de privacidad:', error);
    }
  }, []);

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
              <Pressable style={styles.aiContinueButton} onPress={handleAIDisclosureAcknowledge}>
                <Text style={styles.aiContinueButtonText}>{TEXTS.AI_MODAL_CONTINUE}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default ChatScreen;
