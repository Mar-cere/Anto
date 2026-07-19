/**
 * Inicio de sesión (#72): sheet centrado unificado (intención + bienvenida).
 */
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  useChatTexts,
  useSessionIntentionOptions,
} from '../../screens/chat/chatScreenConstants';
import { isValidSessionIntentionId } from '../../constants/sessionIntention';
import { useTheme } from '../../context/ThemeContext';
import { SPACING } from '../../constants/ui';

export default function SessionIntentionSheet({
  visible,
  submitting,
  onSelect,
  onSkip,
}) {
  const TEXTS = useChatTexts();
  const options = useSessionIntentionOptions();
  const { colors, resolvedScheme } = useTheme();
  const dark = resolvedScheme === 'dark';
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.96)).current;

  const handleSelect = (id) => {
    if (submitting || !isValidSessionIntentionId(id)) return;
    onSelect?.(id);
  };

  useEffect(() => {
    if (visible) {
      fadeAnim.setValue(0);
      cardScale.setValue(0.96);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 280,
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

  const styles = useMemo(
    () =>
      StyleSheet.create({
        overlay: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: SPACING.SCREEN_EDGE_INSET,
        },
        backdrop: {
          ...StyleSheet.absoluteFillObject,
          backgroundColor: colors.backdropStrong ?? colors.overlay,
        },
        card: {
          width: '100%',
          maxWidth: 380,
          maxHeight: '82%',
          backgroundColor: colors.modalSurface ?? colors.surface,
          borderRadius: 22,
          borderWidth: 1,
          borderColor: colors.border,
          paddingVertical: SPACING.HERO_INSET,
          paddingHorizontal: SPACING.CARD_INNER_INSET,
          shadowColor: colors.glassShadow ?? colors.shadowAmbient,
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.28,
          shadowRadius: 24,
          elevation: 12,
        },
        scroll: {
          flexGrow: 0,
        },
        kicker: {
          fontSize: 11,
          fontWeight: '700',
          letterSpacing: 1.6,
          textTransform: 'uppercase',
          color: colors.primary,
          textAlign: 'center',
          marginBottom: 8,
        },
        title: {
          color: colors.text,
          fontSize: 20,
          fontWeight: '700',
          lineHeight: 26,
          textAlign: 'center',
          marginBottom: 6,
        },
        subtitle: {
          color: colors.textSecondary,
          fontSize: 14,
          lineHeight: 20,
          textAlign: 'center',
          marginBottom: 18,
          paddingHorizontal: SPACING.xs,
        },
        option: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: SPACING.HERO_INSET_COMPACT,
          paddingHorizontal: SPACING.CARD_INNER_INSET,
          borderRadius: 16,
          marginBottom: 8,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: dark ? 'rgba(255, 255, 255, 0.1)' : colors.accentLine,
          backgroundColor: dark ? 'rgba(255, 255, 255, 0.05)' : colors.accentLineSoft,
        },
        optionPressed: {
          borderColor: colors.primaryBright || colors.primary,
          backgroundColor: dark ? 'rgba(68, 215, 251, 0.12)' : colors.glassFillStrong ?? colors.glassFill,
        },
        optionDisabled: {
          opacity: 0.5,
        },
        iconWrap: {
          width: 44,
          height: 44,
          borderRadius: 12,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: dark ? 'rgba(68, 215, 251, 0.14)' : colors.glassFillStrong ?? colors.glassFill,
          marginRight: 12,
        },
        optionCopy: {
          flex: 1,
        },
        optionLabel: {
          color: colors.text,
          fontSize: 15,
          fontWeight: '600',
          lineHeight: 20,
        },
        optionHint: {
          color: colors.textSecondary,
          fontSize: 12,
          lineHeight: 17,
          marginTop: 3,
        },
        loading: {
          marginVertical: 20,
        },
        skip: {
          alignSelf: 'center',
          marginTop: 6,
          paddingVertical: SPACING.CHIP_INSET_COMPACT,
          paddingHorizontal: SPACING.HERO_INSET,
          borderRadius: 999,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
        },
        skipText: {
          color: colors.textSecondary,
          fontSize: 14,
          fontWeight: '600',
        },
      }),
    [colors, dark],
  );

  return (
    <Modal visible={visible} animationType="none" transparent onRequestClose={onSkip}>
      <View style={styles.overlay} accessibilityViewIsModal>
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]} />
        <Animated.View style={[styles.card, { transform: [{ scale: cardScale }] }]}>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={{ paddingBottom: SPACING.xs }}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <Text style={styles.kicker}>{TEXTS.SESSION_INTENTION_KICKER}</Text>
            <Text style={styles.title}>{TEXTS.SESSION_INTENTION_TITLE}</Text>
            <Text style={styles.subtitle}>{TEXTS.SESSION_INTENTION_SUBTITLE}</Text>

            {submitting ? (
              <ActivityIndicator style={styles.loading} color={colors.primary} />
            ) : (
              options.map((opt) => (
                <Pressable
                  key={opt.id}
                  style={({ pressed }) => [
                    styles.option,
                    pressed && styles.optionPressed,
                    submitting && styles.optionDisabled,
                  ]}
                  onPress={() => handleSelect(opt.id)}
                  disabled={submitting}
                  accessibilityRole="button"
                  accessibilityLabel={`${opt.label}. ${opt.hint}`}
                >
                  <View style={styles.iconWrap}>
                    <MaterialCommunityIcons
                      name={opt.icon}
                      size={22}
                      color={colors.primary}
                    />
                  </View>
                  <View style={styles.optionCopy}>
                    <Text style={styles.optionLabel}>{opt.label}</Text>
                    <Text style={styles.optionHint}>{opt.hint}</Text>
                  </View>
                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={20}
                    color={colors.textMuted}
                  />
                </Pressable>
              ))
            )}
          </ScrollView>

          {!submitting ? (
            <Pressable
              style={styles.skip}
              onPress={onSkip}
              accessibilityRole="button"
              accessibilityLabel={TEXTS.SESSION_INTENTION_SKIP}
              accessibilityHint={TEXTS.SESSION_INTENTION_SKIP_HINT}
            >
              <Text style={styles.skipText}>{TEXTS.SESSION_INTENTION_SKIP}</Text>
            </Pressable>
          ) : null}
        </Animated.View>
      </View>
    </Modal>
  );
}
