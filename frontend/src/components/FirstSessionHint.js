/**
 * Hint de "objetivo único de primera sesión" tras el onboarding.
 * El objetivo es empezar el chat con Anto; CTA principal "Empezar chat".
 *
 * @author AntoApp Team
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../styles/globalStyles';

const STORAGE_KEY_PREFIX = 'firstSessionHintDismissed_';

const TEXTS = {
  TITLE: 'Tu objetivo por ahora',
  MESSAGE: 'Empezar el chat con Anto. Ahí podrás contarle cómo estás y recibir apoyo.',
  GO_TO_CHAT: 'Empezar chat',
  GOT_IT: 'Entendido',
};

export const getFirstSessionHintDismissedKey = (userId) =>
  `${STORAGE_KEY_PREFIX}${userId || 'anonymous'}`;

export const isFirstSessionHintDismissed = async (userId) => {
  try {
    const key = getFirstSessionHintDismissedKey(userId);
    const value = await AsyncStorage.getItem(key);
    return value === 'true';
  } catch (e) {
    return false;
  }
};

export const setFirstSessionHintDismissed = async (userId) => {
  try {
    const key = getFirstSessionHintDismissedKey(userId);
    await AsyncStorage.setItem(key, 'true');
  } catch (e) {
    console.warn('FirstSessionHint: error persistiendo estado', e);
  }
};

const FirstSessionHint = ({ visible, onDismiss, userId = null }) => {
  const navigation = useNavigation();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      fadeAnim.setValue(0);
    }
  }, [visible, fadeAnim]);

  const handleGoToChat = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await setFirstSessionHintDismissed(userId);
    onDismiss?.();
    navigation.navigate('Chat');
  };

  const handleGotIt = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await setFirstSessionHintDismissed(userId);
    onDismiss?.();
  };

  if (!visible) return null;

  return (
    <Animated.View style={[styles.overlay, { opacity: fadeAnim }] pointerEvents="box-none">
      <View style={styles.card}>
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
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 340,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  iconRow: {
    alignItems: 'center',
    marginBottom: 12,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary + '22',
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
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '600',
  },
  secondaryButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.textSecondary + '60',
  },
  secondaryButtonText: {
    color: colors.textSecondary,
    fontSize: 15,
  },
});

export default FirstSessionHint;
