/**
 * Banner para invitar a activar notificaciones
 *
 * Se muestra cuando las notificaciones están deshabilitadas y el usuario
 * aún no lo descartó. Ofrece un CTA para solicitar permisos.
 */

import React from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../context/ThemeContext';
import { SPACING } from '../constants/ui';

const TEXTS = {
  TITLE: 'Activa las notificaciones',
  SUBTITLE: 'Para recordatorios y alertas importantes.',
  ENABLE: 'Activar',
};

const NotificationsPromptBanner = ({
  visible,
  onEnable,
  onDismiss,
  enabling = false,
}) => {
  const { colors } = useTheme();
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        container: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingVertical: 14,
          paddingHorizontal: 14,
          marginTop: 4,
          marginBottom: 12,
          borderRadius: 18,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
          borderLeftWidth: 4,
          borderLeftColor: colors.primary,
          backgroundColor: colors.cardBackground,
        },
        content: {
          flexDirection: 'row',
          alignItems: 'center',
          flex: 1,
        },
        textContainer: {
          marginLeft: 12,
          flex: 1,
        },
        title: {
          fontSize: 15,
          fontWeight: '600',
          marginBottom: 2,
          color: colors.text,
        },
        subtitle: {
          fontSize: 13,
          color: colors.textSecondary,
        },
        actions: {
          flexDirection: 'row',
          alignItems: 'center',
          marginLeft: 8,
        },
        enableButton: {
          paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
          paddingVertical: 6,
          borderRadius: 8,
          marginRight: 8,
          backgroundColor: colors.primary,
        },
        enableButtonDisabled: {
          opacity: 0.7,
        },
        enableButtonText: {
          color: colors.white,
          fontSize: 12,
          fontWeight: '600',
        },
        dismissButton: {
          padding: 4,
        },
      }),
    [colors],
  );

  React.useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
    } else {
      fadeAnim.setValue(0);
    }
  }, [visible, fadeAnim]);

  if (!visible) return null;

  const handleEnable = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (onEnable) await onEnable();
  };

  const handleDismiss = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (onDismiss) onDismiss();
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.content}>
        <MaterialCommunityIcons name="bell-outline" size={20} color={colors.primary} />
        <View style={styles.textContainer}>
          <Text style={styles.title}>{TEXTS.TITLE}</Text>
          <Text style={styles.subtitle}>{TEXTS.SUBTITLE}</Text>
        </View>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.enableButton, enabling && styles.enableButtonDisabled]}
          onPress={handleEnable}
          disabled={enabling}
        >
          <Text style={styles.enableButtonText}>{TEXTS.ENABLE}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.dismissButton} onPress={handleDismiss} accessibilityLabel="Cerrar banner">
          <MaterialCommunityIcons name="close" size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

export default NotificationsPromptBanner;

