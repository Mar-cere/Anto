/**
 * Bloque de suscripción en el perfil
 */
import React from 'react';
import { View, Text } from 'react-native';
import SubscriptionStatus from '../../components/payments/SubscriptionStatus';
import { useProfileScreenStyles } from './profileScreenStyles';

export function ProfileSubscription({ subscriptionStatus, nestedAfterProfile }) {
  const { styles } = useProfileScreenStyles();
  if (!subscriptionStatus?.hasSubscription) return null;
  return (
    <View
      style={[
        styles.subscriptionContainer,
        nestedAfterProfile ? styles.subscriptionFollowingProfile : null,
      ]}
    >
      <Text style={styles.sectionTitle}>Suscripción</Text>
      <SubscriptionStatus
        status={subscriptionStatus.status}
        plan={subscriptionStatus.plan}
        daysRemaining={subscriptionStatus.daysRemaining}
        trialEndDate={subscriptionStatus.trialEndDate}
        subscriptionEndDate={subscriptionStatus.subscriptionEndDate}
        isActive={subscriptionStatus.isActive}
      />
    </View>
  );
}
