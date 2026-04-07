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
import { colors } from '../styles/globalStyles';

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
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

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

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    borderRadius: 12,
    borderLeftWidth: 4,
    backgroundColor: colors.primary + '20',
    borderLeftColor: colors.primary,
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
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
    color: colors.primary,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  enableButton: {
    paddingHorizontal: 12,
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
});

export default NotificationsPromptBanner;

