/**
 * Componente Banner de Trial
 *
 * Muestra un banner informativo cuando el usuario está en trial,
 * indicando los días restantes y ofreciendo suscribirse.
 *
 * @author AntoApp Team
 */

import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../context/ThemeContext';
import { SPACING } from '../constants/ui';

const TEXTS = {
  TRIAL_ACTIVE: 'Trial activo',
  DAYS_REMAINING: (days) => (days === 1 ? '1 día restante' : `${days} días restantes`),
  SUBSCRIBE: 'Suscribirse',
  TRIAL_EXPIRING_SOON: 'Tu trial expira pronto',
};

const TrialBanner = ({ daysRemaining, onDismiss, dismissed = false }) => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  const hexToRgba = (hex, alpha) => {
    const h = hex.replace('#', '');
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingVertical: 14,
          paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
          marginTop: 4,
          marginBottom: 12,
          borderRadius: 22,
          borderWidth: StyleSheet.hairlineWidth,
        },
        content: {
          flexDirection: 'row',
          alignItems: 'center',
          flex: 1,
          minWidth: 0,
        },
        iconWrap: {
          width: 40,
          height: 40,
          borderRadius: 12,
          borderWidth: StyleSheet.hairlineWidth,
          backgroundColor: colors.glassFill,
          alignItems: 'center',
          justifyContent: 'center',
        },
        textContainer: {
          marginLeft: 12,
          flex: 1,
          minWidth: 0,
        },
        title: {
          fontSize: 14,
          fontWeight: '600',
          marginBottom: 2,
          lineHeight: 19,
        },
        subtitle: {
          fontSize: 12,
          color: colors.textSecondary,
          lineHeight: 17,
        },
        actions: {
          flexDirection: 'row',
          alignItems: 'center',
          marginLeft: 8,
          flexShrink: 0,
        },
        subscribeButton: {
          paddingHorizontal: 14,
          paddingVertical: 8,
          borderRadius: 14,
          marginRight: 6,
          backgroundColor: colors.glassFill,
          borderWidth: StyleSheet.hairlineWidth,
        },
        subscribeButtonText: {
          fontSize: 13,
          fontWeight: '600',
        },
        dismissButton: {
          padding: 8,
          borderRadius: 12,
          backgroundColor: colors.glassFill,
        },
      }),
    [colors],
  );

  React.useEffect(() => {
    if (!dismissed) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [dismissed, fadeAnim]);

  if (dismissed || !daysRemaining || daysRemaining <= 0) {
    return null;
  }

  const handleSubscribe = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('Subscription');
  };

  const handleDismiss = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (onDismiss) {
      onDismiss();
    }
  };

  const isExpiringSoon = daysRemaining <= 2;
  const accentColor = isExpiringSoon ? colors.warning : colors.primary;
  const surfaceBg = isExpiringSoon ? hexToRgba(colors.warning, 0.12) : hexToRgba(colors.primary, 0.1);
  const borderColor = isExpiringSoon ? hexToRgba(colors.warning, 0.4) : colors.accentLine;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          backgroundColor: surfaceBg,
          borderColor,
        },
      ]}
      accessibilityRole="summary"
    >
      <View style={styles.content}>
        <View style={[styles.iconWrap, { borderColor: accentColor + '55' }]}>
          <MaterialCommunityIcons
            name={isExpiringSoon ? 'alert-circle-outline' : 'clock-outline'}
            size={22}
            color={accentColor}
          />
        </View>
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: accentColor }]}>
            {isExpiringSoon ? TEXTS.TRIAL_EXPIRING_SOON : TEXTS.TRIAL_ACTIVE}
          </Text>
          <Text style={styles.subtitle}>{TEXTS.DAYS_REMAINING(daysRemaining)}</Text>
        </View>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.subscribeButton, { borderColor: accentColor }]}
          onPress={handleSubscribe}
          accessibilityRole="button"
          accessibilityLabel={TEXTS.SUBSCRIBE}
        >
          <Text style={[styles.subscribeButtonText, { color: accentColor }]}>{TEXTS.SUBSCRIBE}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.dismissButton}
          onPress={handleDismiss}
          accessibilityRole="button"
          accessibilityLabel="Cerrar aviso de trial"
        >
          <MaterialCommunityIcons name="close" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

export default TrialBanner;
