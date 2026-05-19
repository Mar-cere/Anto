/**
 * Componente Toast / Snackbar
 *
 * Muestra un mensaje temporal en la parte inferior de la pantalla.
 * Se usa a través de useToast() y ToastProvider; no se renderiza directamente.
 *
 * @author AntoApp Team
 */

import React, { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import { SPACING } from '../constants/ui';

const Toast = () => {
  const { toast, hideToast } = useToast();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const TOAST_TYPES = useMemo(
    () => ({
      success: {
        backgroundColor: colors.success,
        icon: 'checkmark-circle',
        messageColor: colors.white,
        iconColor: colors.white,
      },
      error: {
        backgroundColor: colors.error,
        icon: 'close-circle',
        messageColor: colors.white,
        iconColor: colors.white,
      },
      warning: {
        backgroundColor: colors.warning,
        icon: 'warning',
        messageColor: colors.text,
        iconColor: colors.text,
      },
      info: {
        backgroundColor: colors.info,
        icon: 'information-circle',
        messageColor: colors.white,
        iconColor: colors.white,
      },
      /** Superficie clara: el texto debe ser oscuro (antes era blanco sobre card → ilegible). */
      default: {
        backgroundColor: colors.chromeCard,
        borderColor: colors.border,
        icon: null,
        messageColor: colors.text,
      },
    }),
    [colors],
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrapper: {
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
          alignItems: 'center',
          ...(Platform.OS === 'android' && { elevation: 8 }),
        },
        toast: {
          flexDirection: 'row',
          alignItems: 'center',
          minHeight: 48,
          maxWidth: '100%',
          paddingVertical: 12,
          paddingLeft: SPACING.SCREEN_EDGE_INSET,
          paddingRight: 12,
          borderRadius: 12,
          shadowColor: colors.glassShadow ?? colors.shadowAmbient,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 4,
        },
        icon: {
          marginRight: 10,
        },
        message: {
          flex: 1,
          fontSize: 15,
          fontWeight: '500',
        },
        actionButton: {
          marginLeft: 12,
          paddingVertical: 6,
          paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
          borderRadius: 8,
        },
        actionText: {
          fontSize: 14,
          fontWeight: '600',
        },
      }),
    [colors],
  );

  useEffect(() => {
    if (!toast) return;

    translateY.setValue(100);
    opacity.setValue(0);

    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [toast, translateY, opacity]);

  if (!toast) return null;

  const config = TOAST_TYPES[toast.type] || TOAST_TYPES.default;
  const hasAction = toast.action && typeof toast.action.onPress === 'function';
  const isDefaultToast = toast.type === 'default' || !TOAST_TYPES[toast.type];
  const messageColor = config.messageColor ?? colors.white;
  const iconColor = config.iconColor ?? colors.white;
  const actionButtonStyle = isDefaultToast
    ? { backgroundColor: colors.accentLineSoft }
    : { backgroundColor: 'rgba(255,255,255,0.2)' };
  const actionLabelColor = isDefaultToast ? colors.primary : colors.white;

  const handleActionPress = () => {
    toast.action?.onPress?.();
    hideToast();
  };

  return (
    <Animated.View
      style={[
        styles.wrapper,
        { paddingBottom: Math.max(insets.bottom, 12) + 8 },
      ]}
      pointerEvents="box-none"
    >
      <Animated.View
        style={[
          styles.toast,
          {
            backgroundColor: config.backgroundColor,
            borderWidth: toast.type === 'default' ? 1 : 0,
            borderColor: config.borderColor || 'transparent',
            opacity,
            transform: [{ translateY }],
          },
        ]}
        accessibilityRole="alert"
        accessibilityLabel={toast.message}
      >
        {config.icon && (
          <Ionicons
            name={config.icon}
            size={22}
            color={iconColor}
            style={styles.icon}
          />
        )}
        <Text style={[styles.message, { color: messageColor }]} numberOfLines={2}>
          {toast.message}
        </Text>
        {hasAction && (
          <TouchableOpacity
            onPress={handleActionPress}
            style={[styles.actionButton, actionButtonStyle]}
            activeOpacity={0.8}
            accessibilityLabel={toast.action.label}
            accessibilityRole="button"
          >
            <Text style={[styles.actionText, { color: actionLabelColor }]}>{toast.action.label}</Text>
          </TouchableOpacity>
        )}
      </Animated.View>
    </Animated.View>
  );
};

export default Toast;