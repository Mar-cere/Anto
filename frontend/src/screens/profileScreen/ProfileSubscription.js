/**
 * Bloque de suscripción en el perfil
 */
import React from 'react';
import { View, Text } from 'react-native';
import SubscriptionStatus from '../../components/payments/SubscriptionStatus';
import { styles } from './profileScreenStyles';

export function ProfileSubscription({ subscriptionStatus }) {
  if (!subscriptionStatus?.hasSubscription) return null;
  return (
    <View style={styles.subscriptionContainer}>
      <Text style={styles.sectionTitle}>Suscripción</Text>
      <SubscriptionStatus
        status={subscriptionStatus.status}
        plan={subscriptionStatus.plan}
        daysRemaining={subscriptionStatus.daysRemaining}
        trialEndDate={subscriptionStatus.trialEndDate}
        subscriptionEndDate={subscriptionStatus.subscriptionEndDate}
      />
    </View>
  );
}
