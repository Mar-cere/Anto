/**
 * Componente de Tarjeta de Sugerencia de Acción
 * Muestra sugerencias de acciones basadas en el análisis emocional
 * Incluye animaciones, gestos de deslizar y preview
 */
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { colors } from '../styles/globalStyles';

// Constantes de estilos
const CARD_PADDING = 12;
const CARD_BORDER_RADIUS = 12;
const CARD_MARGIN_BOTTOM = 8;
const ICON_SIZE = 20;
const ICON_MARGIN_RIGHT = 10;
const TITLE_FONT_SIZE = 14;
const TITLE_FONT_WEIGHT = '600';
const TITLE_MARGIN_BOTTOM = 4;

const ActionSuggestionCard = ({ suggestion, onPress, onDismiss }) => {
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
  }, []);

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
            size={16} 
            color={colors.accent} 
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
                Toca para abrir esta acción
              </Text>
              <TouchableOpacity
                style={styles.previewButton}
                onPress={() => {
                  closePreview();
                  handlePress();
                }}
              >
                <Text style={styles.previewButtonText}>Abrir</Text>
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

const styles = StyleSheet.create({
  cardContainer: {
    marginBottom: CARD_MARGIN_BOTTOM,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    padding: CARD_PADDING,
    borderRadius: CARD_BORDER_RADIUS,
    borderWidth: 1,
    borderColor: colors.accent + '30',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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
    fontSize: TITLE_FONT_SIZE,
    fontWeight: TITLE_FONT_WEIGHT,
    color: colors.text,
    flex: 1,
  },
  chevron: {
    marginLeft: 8,
  },
  previewOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  previewContainer: {
    width: '100%',
    maxWidth: 400,
  },
  previewCard: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  previewIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  previewTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  previewDescription: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  previewHint: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 20,
    fontStyle: 'italic',
  },
  previewButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  previewButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  previewCloseButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 8,
  },
});

export default ActionSuggestionCard;

