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
import * as Haptics from 'expo-haptics';

// Constantes
const TEXTS = {
  TRIAL_ACTIVE: 'Trial activo',
  DAYS_REMAINING: (days) => days === 1 ? '1 día restante' : `${days} días restantes`,
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
  }, [dismissed]);

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

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          backgroundColor: isExpiringSoon ? colors.warning + '20' : colors.primary + '20',
          borderLeftColor: isExpiringSoon ? colors.warning : colors.primary,
        },
      ]}
    >
      <View style={styles.content}>
        <MaterialCommunityIcons
          name={isExpiringSoon ? 'alert-circle' : 'clock-outline'}
          size={20}
          color={isExpiringSoon ? colors.warning : colors.primary}
        />
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: isExpiringSoon ? colors.warning : colors.primary }]}>
            {isExpiringSoon ? TEXTS.TRIAL_EXPIRING_SOON : TEXTS.TRIAL_ACTIVE}
          </Text>
          <Text style={styles.subtitle}>
            {TEXTS.DAYS_REMAINING(daysRemaining)}
          </Text>
        </View>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.subscribeButton, { backgroundColor: colors.primary }]}
          onPress={handleSubscribe}
        >
          <Text style={styles.subscribeButtonText}>{TEXTS.SUBSCRIBE}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.dismissButton}
          onPress={handleDismiss}
        >
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
  subscribeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 8,
  },
  subscribeButtonText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  dismissButton: {
    padding: 4,
  },
});

export default TrialBanner;

