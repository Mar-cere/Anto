/**
 * Componente Banner de Trial
 *
 * Muestra un banner informativo cuando el usuario está en trial,
 * indicando los días restantes y ofreciendo suscribirse.
 *
 * @author AntoApp Team
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../styles/globalStyles';
import { FOCUS_ACCENT_BORDER, FOCUS_META } from '../styles/focusCardTheme';
import * as Haptics from 'expo-haptics';

const TEXTS = {
  TRIAL_ACTIVE: 'Trial activo',
  DAYS_REMAINING: (days) => (days === 1 ? '1 día restante' : `${days} días restantes`),
  SUBSCRIBE: 'Suscribirse',
  TRIAL_EXPIRING_SOON: 'Tu trial expira pronto',
};

const TrialBanner = ({ daysRemaining, onDismiss, dismissed = false }) => {
  const navigation = useNavigation();
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

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
  const surfaceBg = isExpiringSoon
    ? 'rgba(255, 217, 61, 0.12)'
    : 'rgba(26, 221, 219, 0.1)';
  const borderColor = isExpiringSoon
    ? 'rgba(255, 217, 61, 0.4)'
    : FOCUS_ACCENT_BORDER;

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
          <MaterialCommunityIcons name="close" size={20} color={FOCUS_META} />
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
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
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
    backgroundColor: 'rgba(255,255,255,0.04)',
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
    color: FOCUS_META,
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
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: StyleSheet.hairlineWidth,
  },
  subscribeButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  dismissButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
});

export default TrialBanner;
