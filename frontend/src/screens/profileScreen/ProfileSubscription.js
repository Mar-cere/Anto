/**
 * Bloque de suscripción en el perfil
 */
import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import SubscriptionStatus from '../../components/payments/SubscriptionStatus';
import { useSectionTranslations } from '../../hooks/useTranslations';
import { useProfileScreenStyles } from './profileScreenStyles';

const DEFAULT_TEXTS = {
  SUBSCRIPTION: 'Suscripción',
};

export function ProfileSubscription({ subscriptionStatus, nestedAfterProfile }) {
  const { styles } = useProfileScreenStyles();
  const translated = useSectionTranslations('PROFILE');
  const TEXTS = useMemo(
    () => ({
      SUBSCRIPTION: translated?.SUBSCRIPTION || DEFAULT_TEXTS.SUBSCRIPTION,
    }),
    [translated],
  );
  if (!subscriptionStatus?.hasSubscription) return null;
  return (
    <View
      style={[
        styles.subscriptionContainer,
        nestedAfterProfile ? styles.subscriptionFollowingProfile : null,
      ]}
    >
      <Text style={styles.sectionTitle}>{TEXTS.SUBSCRIPTION}</Text>
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
