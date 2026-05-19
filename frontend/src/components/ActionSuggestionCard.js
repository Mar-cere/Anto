/**
 * Componente de Tarjeta de Sugerencia de Acción
 * Muestra sugerencias de acciones basadas en el análisis emocional
 * Incluye animaciones, gestos de deslizar y preview
 */
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useSectionTranslations } from '../hooks/useTranslations';
import { getFocusTheme } from '../styles/focusCardTheme';
import { SPACING } from '../constants/ui';

const CARD_MARGIN_BOTTOM = 8;
const ICON_SIZE = 20;
const ICON_MARGIN_RIGHT = 10;
const DEFAULT_TEXTS = {
  PREVIEW_HINT: 'Toca para abrir esta acción',
  OPEN_BUTTON: 'Abrir',
};

const ActionSuggestionCard = ({ suggestion, onPress, onDismiss }) => {
  const { colors, resolvedScheme } = useTheme();
  const translated = useSectionTranslations('DASH');
  const TEXTS = useMemo(
    () => ({
      PREVIEW_HINT:
        translated?.ACTION_SUGGESTION_PREVIEW_HINT || DEFAULT_TEXTS.PREVIEW_HINT,
      OPEN_BUTTON: translated?.ACTION_SUGGESTION_OPEN || DEFAULT_TEXTS.OPEN_BUTTON,
    }),
    [translated],
  );
  const t = useMemo(() => getFocusTheme(colors, resolvedScheme), [colors, resolvedScheme]);
  const styles = useMemo(
    () =>
      StyleSheet.create({
        cardContainer: {
          marginBottom: CARD_MARGIN_BOTTOM,
        },
        card: {
          ...t.FOCUS_INNER_ROW,
          justifyContent: 'space-between',
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: t.FOCUS_BORDER_SUBTLE,
        },
        content: {
          flexDirection: 'row',
          alignItems: 'center',
          flex: 1,
        },
        icon: {
          fontSize: ICON_SIZE,
          marginRight: ICON_MARGIN_RIGHT,
        },
        label: {
          fontSize: 15,
          fontWeight: '500',
          lineHeight: 20,
          color: colors.text,
          flex: 1,
        },
        chevron: {
          marginLeft: 8,
        },
        previewOverlay: {
          flex: 1,
          backgroundColor: colors.backdropStrong ?? 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: SPACING.SCREEN_EDGE_INSET,
        },
        previewContainer: {
          width: '100%',
          maxWidth: 400,
        },
        previewCard: {
          ...t.FOCUS_PANEL,
          marginBottom: 0,
          paddingVertical: 24,
          paddingHorizontal: 22,
          alignItems: 'center',
        },
        previewIcon: {
          fontSize: 48,
          marginBottom: 16,
        },
        previewTitle: {
          fontSize: 17,
          fontWeight: '400',
          lineHeight: 26,
          letterSpacing: -0.2,
          color: colors.text,
          marginBottom: 12,
          textAlign: 'center',
        },
        previewDescription: {
          fontSize: 14,
          color: t.FOCUS_BODY_SOFT,
          textAlign: 'center',
          marginBottom: 24,
          lineHeight: 21,
          fontWeight: '400',
        },
        previewHint: {
          fontSize: 13,
          color: t.FOCUS_META,
          marginBottom: 20,
          fontStyle: 'italic',
          lineHeight: 18,
        },
        previewButton: {
          backgroundColor: colors.primary,
          paddingHorizontal: 28,
          paddingVertical: 14,
          borderRadius: 999,
          marginBottom: 12,
        },
        previewButtonText: {
          color: colors.textOnPrimary,
          fontSize: 15,
          fontWeight: '600',
          letterSpacing: 0.2,
        },
        previewCloseButton: {
          position: 'absolute',
          top: 12,
          right: 12,
          padding: 8,
        },
      }),
    [colors, t],
  );

  const [showPreview, setShowPreview] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  // Animación de entrada
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim]);

  // Pan responder para gesto de deslizar
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 10;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx < 0) {
          translateX.setValue(gestureState.dx);
          opacity.setValue(1 + gestureState.dx / 200);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -100 && onDismiss) {
          // Deslizar para descartar
          Animated.parallel([
            Animated.timing(translateX, {
              toValue: -500,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start(() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onDismiss();
          });
        } else {
          // Volver a posición original
          Animated.parallel([
            Animated.spring(translateX, {
              toValue: 0,
              tension: 50,
              friction: 7,
              useNativeDriver: true,
            }),
            Animated.spring(opacity, {
              toValue: 1,
              tension: 50,
              friction: 7,
              useNativeDriver: true,
            }),
          ]).start();
        }
      },
    })
  ).current;

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (onPress) {
      onPress(suggestion);
    }
  };

  const handleLongPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowPreview(true);
  };

  const closePreview = () => {
    setShowPreview(false);
  };

  return (
    <>
      <Animated.View
        style={[
          styles.cardContainer,
          {
            opacity: Animated.multiply(fadeAnim, opacity),
            transform: [
              { scale: scaleAnim },
              { translateX: translateX },
            ],
          },
        ]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          style={styles.card}
          onPress={handlePress}
          onLongPress={handleLongPress}
          activeOpacity={0.7}
        >
          <View style={styles.content}>
            {suggestion.icon && (
              <Text style={styles.icon}>{suggestion.icon}</Text>
            )}
            <Text style={styles.label}>{suggestion.label}</Text>
          </View>
          <Ionicons 
            name="chevron-forward" 
            size={18} 
            color={t.FOCUS_CHEVRON_MUTED} 
            style={styles.chevron}
          />
        </TouchableOpacity>
      </Animated.View>

      {/* Modal de preview */}
      <Modal
        visible={showPreview}
        transparent
        animationType="fade"
        onRequestClose={closePreview}
      >
        <TouchableOpacity
          style={styles.previewOverlay}
          activeOpacity={1}
          onPress={closePreview}
        >
          <View style={styles.previewContainer}>
            <View style={styles.previewCard}>
              {suggestion.icon && (
                <Text style={styles.previewIcon}>{suggestion.icon}</Text>
              )}
              <Text style={styles.previewTitle}>{suggestion.label}</Text>
              {suggestion.description && (
                <Text style={styles.previewDescription}>
                  {suggestion.description}
                </Text>
              )}
              <Text style={styles.previewHint}>
                {TEXTS.PREVIEW_HINT}
              </Text>
              <TouchableOpacity
                style={styles.previewButton}
                onPress={() => {
                  closePreview();
                  handlePress();
                }}
              >
                <Text style={styles.previewButtonText}>{TEXTS.OPEN_BUTTON}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.previewCloseButton}
                onPress={closePreview}
              >
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

export default ActionSuggestionCard;

