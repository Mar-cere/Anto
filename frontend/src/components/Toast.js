/**
 * Componente Toast / Snackbar
 *
 * Muestra un mensaje temporal en la parte inferior de la pantalla.
 * Se usa a través de useToast() y ToastProvider; no se renderiza directamente.
 *
 * @author AntoApp Team
 */

import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useToast } from '../context/ToastContext';
import { colors } from '../styles/globalStyles';

const TOAST_TYPES = {
  success: {
    backgroundColor: colors.success,
    icon: 'checkmark-circle',
  },
  error: {
    backgroundColor: colors.error,
    icon: 'close-circle',
  },
  warning: {
    backgroundColor: colors.warning,
    icon: 'warning',
  },
  info: {
    backgroundColor: colors.info,
    icon: 'information-circle',
  },
  default: {
    backgroundColor: colors.cardBackground,
    borderColor: colors.border,
    icon: null,
  },
};

const Toast = () => {
  const { toast, hideToast } = useToast();
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

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
            color={colors.white}
            style={styles.icon}
          />
        )}
        <Text style={styles.message} numberOfLines={2}>
          {toast.message}
        </Text>
        {hasAction && (
          <TouchableOpacity
            onPress={handleActionPress}
            style={styles.actionButton}
            activeOpacity={0.8}
            accessibilityLabel={toast.action.label}
            accessibilityRole="button"
          >
            <Text style={styles.actionText}>{toast.action.label}</Text>
          </TouchableOpacity>
        )}
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    alignItems: 'center',
    ...(Platform.OS === 'android' && { elevation: 8 }),
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    maxWidth: '100%',
    paddingVertical: 12,
    paddingLeft: 16,
    paddingRight: 12,
    borderRadius: 12,
    shadowColor: '#000',
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
    color: colors.white,
    fontWeight: '500',
  },
  actionButton: {
    marginLeft: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  actionText: {
    fontSize: 14,
    color: colors.white,
    fontWeight: '600',
  },
});

export default Toast;
