/**
 * Hint de "objetivo único de primera sesión" tras el onboarding.
 * El objetivo es empezar el chat con Anto; CTA principal "Empezar chat".
 *
 * @author AntoApp Team
 */

import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useMemo, useEffect, useRef } from 'react';
import {
  Animated,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { CHAT_BACK_TARGET } from '../navigation/navigationHelpers';
import { setChatEntryBackTarget } from '../utils/chatEntryContext';
import { canAttemptChatAccess } from '../utils/chatAccessGate';
import {
  getFirstSessionHintDismissedKey,
  isFirstSessionHintDismissed,
  setFirstSessionHintDismissed,
} from '../utils/firstSessionHintStorage';
import { useTheme } from '../context/ThemeContext';
import { useSectionTranslations } from '../hooks/useTranslations';
import { SPACING } from '../constants/ui';

export { getFirstSessionHintDismissedKey, isFirstSessionHintDismissed, setFirstSessionHintDismissed };

const DEFAULT_TEXTS = {
  TITLE: 'Tu objetivo por ahora',
  MESSAGE: 'Empezar el chat con Anto. Ahí podrás contarle cómo estás y recibir apoyo.',
  GO_TO_CHAT: 'Empezar chat',
  GOT_IT: 'Entendido',
};

const FirstSessionHint = ({ visible, onDismiss, userId = null, userCreatedAt = null }) => {
  const translated = useSectionTranslations('DASH');
  const chatTexts = useSectionTranslations('CHAT');
  const TEXTS = useMemo(
    () => ({
      ...DEFAULT_TEXTS,
      TITLE:
        translated?.FIRST_SESSION_HINT_TITLE || DEFAULT_TEXTS.TITLE,
      MESSAGE:
        translated?.FIRST_SESSION_HINT_MESSAGE || DEFAULT_TEXTS.MESSAGE,
      GO_TO_CHAT:
        translated?.FIRST_SESSION_HINT_GO_TO_CHAT || DEFAULT_TEXTS.GO_TO_CHAT,
      GOT_IT: translated?.FIRST_SESSION_HINT_GOT_IT || DEFAULT_TEXTS.GOT_IT,
    }),
    [translated],
  );
  const navigation = useNavigation();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.96)).current;
  const { colors } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        overlay: {
          ...StyleSheet.absoluteFillObject,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 24,
          zIndex: 1100,
        },
        backdrop: {
          ...StyleSheet.absoluteFillObject,
          backgroundColor: colors.backdropStrong ?? colors.overlay,
        },
        cardWrapper: {
          width: '100%',
          maxWidth: 340,
          alignSelf: 'center',
        },
        card: {
          backgroundColor: colors.modalSurface ?? colors.surface,
          borderRadius: 22,
          borderWidth: 1,
          borderColor: colors.border,
          marginBottom: 0,
          paddingVertical: 22,
          paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
          width: '100%',
          maxWidth: 340,
          shadowColor: colors.glassShadow ?? colors.shadowAmbient,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.28,
          shadowRadius: 24,
          elevation: 12,
        },
        iconRow: {
          alignItems: 'center',
          marginBottom: 12,
        },
        iconCircle: {
          width: 48,
          height: 48,
          borderRadius: 24,
          backgroundColor: colors.accentLineSoft,
          justifyContent: 'center',
          alignItems: 'center',
        },
        title: {
          fontSize: 18,
          fontWeight: '700',
          color: colors.text,
          textAlign: 'center',
          marginBottom: 6,
        },
        message: {
          fontSize: 15,
          color: colors.textSecondary,
          textAlign: 'center',
          lineHeight: 22,
          marginBottom: 20,
        },
        actions: {
          flexDirection: 'row',
          gap: 10,
          justifyContent: 'center',
        },
        primaryButton: {
          backgroundColor: colors.primary,
          paddingVertical: 12,
          paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
          borderRadius: 12,
        },
        primaryButtonText: {
          color: colors.textOnPrimary,
          fontSize: 15,
          fontWeight: '600',
        },
        secondaryButton: {
          paddingVertical: 12,
          paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: colors.border,
        },
        secondaryButtonText: {
          color: colors.textSecondary,
          fontSize: 15,
        },
      }),
    [colors],
  );

  useEffect(() => {
    if (visible) {
      fadeAnim.setValue(0);
      cardScale.setValue(0.96);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(cardScale, {
          toValue: 1,
          friction: 8,
          tension: 80,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      cardScale.setValue(0.96);
    }
  }, [visible, fadeAnim, cardScale]);

  const handleGoToChat = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const canChat = await canAttemptChatAccess(
      userCreatedAt ? { createdAt: userCreatedAt } : null,
    );
    if (!canChat) {
      Alert.alert(
        chatTexts.SUBSCRIPTION_REQUIRED_TITLE || 'Suscripción requerida',
        chatTexts.SUBSCRIPTION_REQUIRED_DEFAULT ||
          'Necesitas una suscripción activa o trial válido para usar el chat.',
        [
          { text: chatTexts.COMMON_CANCEL || 'Cancelar', style: 'cancel' },
          {
            text: chatTexts.SUBSCRIPTION_VIEW_PLANS || 'Ver planes',
            onPress: () => {
              navigation.navigate('Subscription');
            },
          },
        ],
      );
      return;
    }
    await setFirstSessionHintDismissed(userId);
    onDismiss?.();

    // Tras login el stack suele ser solo "Dash" (no MainTabs); Chat vive como tab dentro de MainTabs.
    await setChatEntryBackTarget('dash');
    const state = navigation.getState?.();
    if (state?.type === 'tab') {
      navigation.navigate('Chat', { chatBackTarget: CHAT_BACK_TARGET.DASH });
    } else {
      navigation.navigate('MainTabs', {
        screen: 'Chat',
        params: { chatBackTarget: CHAT_BACK_TARGET.DASH },
      });
    }
  };

  const handleGotIt = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await setFirstSessionHintDismissed(userId);
    onDismiss?.();
  };

  if (!visible) return null;

  return (
    <View style={styles.overlay} pointerEvents="auto">
      <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]} />
      <View style={styles.cardWrapper}>
        <Animated.View style={[styles.card, { transform: [{ scale: cardScale }] }]}>
        <View style={styles.iconRow}>
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons name="message-text-outline" size={24} color={colors.primary} />
          </View>
        </View>
        <Text style={styles.title}>{TEXTS.TITLE}</Text>
        <Text style={styles.message}>{TEXTS.MESSAGE}</Text>
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleGoToChat}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>{TEXTS.GO_TO_CHAT}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleGotIt}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryButtonText}>{TEXTS.GOT_IT}</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
      </View>
    </View>
  );
};

export default FirstSessionHint;
