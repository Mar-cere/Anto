/**
 * Componente SubscriptionStatus
 * 
 * Muestra el estado actual de la suscripción del usuario.
 * 
 * @author AntoApp Team
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { useSectionTranslations } from '../../hooks/useTranslations';
import { SPACING } from '../../constants/ui';

const DEFAULT_TEXTS = {
  LABEL_FREE: 'Plan Gratuito',
  DESCRIPTION_FREE: 'Actualiza a Premium para acceder a todas las funciones',
  LABEL_TRIAL: 'Periodo de Prueba',
  DESCRIPTION_TRIAL_TEMPLATE: 'Trial activo - {days} días restantes',
  LABEL_PREMIUM: 'Premium Activo',
  DESCRIPTION_PREMIUM_FALLBACK: 'Plan Premium',
  LABEL_EXPIRED: 'Suscripción Expirada',
  DESCRIPTION_EXPIRED: 'Tu suscripción ha expirado o fue cancelada',
  LABEL_UNKNOWN: 'Estado Desconocido',
  DESCRIPTION_UNKNOWN: 'No se pudo determinar el estado',
  PLAN_MONTHLY: 'Plan Mensual',
  PLAN_QUARTERLY: 'Plan Trimestral',
  PLAN_SEMESTRAL: 'Plan Semestral',
  PLAN_YEARLY: 'Plan Anual',
  DATE_TRIAL_END: 'Fin del Trial:',
  DATE_NEXT_RENEWAL: 'Próxima Renovación:',
  DATE_VALID_UNTIL: 'Vigencia hasta:',
};

const SubscriptionStatus = ({ status, plan, daysRemaining, trialEndDate, subscriptionEndDate, isActive }) => {
  const { colors } = useTheme();
  const { language } = useLanguage();
  const translated = useSectionTranslations('SUBSCRIPTION');
  const T = useMemo(
    () => ({
      LABEL_FREE: translated?.SUBSCRIPTION_STATUS_LABEL_FREE || DEFAULT_TEXTS.LABEL_FREE,
      DESCRIPTION_FREE:
        translated?.SUBSCRIPTION_STATUS_DESCRIPTION_FREE ||
        DEFAULT_TEXTS.DESCRIPTION_FREE,
      LABEL_TRIAL: translated?.SUBSCRIPTION_STATUS_LABEL_TRIAL || DEFAULT_TEXTS.LABEL_TRIAL,
      DESCRIPTION_TRIAL_TEMPLATE:
        translated?.SUBSCRIPTION_STATUS_DESCRIPTION_TRIAL_TEMPLATE ||
        DEFAULT_TEXTS.DESCRIPTION_TRIAL_TEMPLATE,
      LABEL_PREMIUM: translated?.SUBSCRIPTION_STATUS_LABEL_PREMIUM || DEFAULT_TEXTS.LABEL_PREMIUM,
      DESCRIPTION_PREMIUM_FALLBACK:
        translated?.SUBSCRIPTION_STATUS_DESCRIPTION_PREMIUM_FALLBACK ||
        DEFAULT_TEXTS.DESCRIPTION_PREMIUM_FALLBACK,
      LABEL_EXPIRED:
        translated?.SUBSCRIPTION_STATUS_LABEL_EXPIRED || DEFAULT_TEXTS.LABEL_EXPIRED,
      DESCRIPTION_EXPIRED:
        translated?.SUBSCRIPTION_STATUS_DESCRIPTION_EXPIRED ||
        DEFAULT_TEXTS.DESCRIPTION_EXPIRED,
      LABEL_UNKNOWN:
        translated?.SUBSCRIPTION_STATUS_LABEL_UNKNOWN || DEFAULT_TEXTS.LABEL_UNKNOWN,
      DESCRIPTION_UNKNOWN:
        translated?.SUBSCRIPTION_STATUS_DESCRIPTION_UNKNOWN ||
        DEFAULT_TEXTS.DESCRIPTION_UNKNOWN,
      PLAN_MONTHLY:
        translated?.SUBSCRIPTION_STATUS_PLAN_MONTHLY || DEFAULT_TEXTS.PLAN_MONTHLY,
      PLAN_QUARTERLY:
        translated?.SUBSCRIPTION_STATUS_PLAN_QUARTERLY || DEFAULT_TEXTS.PLAN_QUARTERLY,
      PLAN_SEMESTRAL:
        translated?.SUBSCRIPTION_STATUS_PLAN_SEMESTRAL || DEFAULT_TEXTS.PLAN_SEMESTRAL,
      PLAN_YEARLY:
        translated?.SUBSCRIPTION_STATUS_PLAN_YEARLY || DEFAULT_TEXTS.PLAN_YEARLY,
      DATE_TRIAL_END:
        translated?.SUBSCRIPTION_STATUS_DATE_TRIAL_END || DEFAULT_TEXTS.DATE_TRIAL_END,
      DATE_NEXT_RENEWAL:
        translated?.SUBSCRIPTION_STATUS_DATE_NEXT_RENEWAL || DEFAULT_TEXTS.DATE_NEXT_RENEWAL,
      DATE_VALID_UNTIL:
        translated?.SUBSCRIPTION_STATUS_DATE_VALID_UNTIL || DEFAULT_TEXTS.DATE_VALID_UNTIL,
    }),
    [translated],
  );
  const normalizedStatus = (status || 'free').toLowerCase();

  const nowMs = Date.now();
  const endMs = subscriptionEndDate ? new Date(subscriptionEndDate).getTime() : NaN;
  const subscriptionPeriodEnded = Number.isFinite(endMs) && endMs < nowMs;
  const trialEndMs = trialEndDate ? new Date(trialEndDate).getTime() : NaN;
  const trialPeriodEnded = Number.isFinite(trialEndMs) && trialEndMs < nowMs;

  let effectiveStatus = normalizedStatus;
  if (isActive === false && (normalizedStatus === 'premium' || normalizedStatus === 'active')) {
    effectiveStatus = 'expired';
  } else if (
    (normalizedStatus === 'premium' || normalizedStatus === 'active') &&
    subscriptionPeriodEnded
  ) {
    effectiveStatus = 'expired';
  } else if (
    (normalizedStatus === 'trialing' || normalizedStatus === 'trial') &&
    trialPeriodEnded
  ) {
    effectiveStatus = 'expired';
  }

  const getStatusInfo = () => {
    // Normalizar: estados que el backend puede devolver y el frontend no trataba
    switch (effectiveStatus) {
      case 'free':
        return {
          icon: 'account-outline',
          color: colors.textSecondary,
          label: T.LABEL_FREE,
          description: T.DESCRIPTION_FREE,
        };
      case 'trialing':
      case 'trial':
        return {
          icon: 'clock-outline',
          color: colors.warning,
          label: T.LABEL_TRIAL,
          description: T.DESCRIPTION_TRIAL_TEMPLATE.replace(
            '{days}',
            String(daysRemaining ?? 0),
          ),
        };
      case 'premium':
      case 'active':
        const normalizedPlan = String(plan || '').toLowerCase();
        const planNames = {
          monthly: T.PLAN_MONTHLY,
          quarterly: T.PLAN_QUARTERLY,
          semestral: T.PLAN_SEMESTRAL,
          semester: T.PLAN_SEMESTRAL,
          yearly: T.PLAN_YEARLY,
          annual: T.PLAN_YEARLY,
          year: T.PLAN_YEARLY,
        };
        return {
          icon: 'crown',
          color: colors.primary,
          label: T.LABEL_PREMIUM,
          description: planNames[normalizedPlan] || T.DESCRIPTION_PREMIUM_FALLBACK,
        };
      case 'expired':
      case 'canceled':
      case 'past_due':
      case 'unpaid':
      case 'incomplete':
      case 'incomplete_expired':
        return {
          icon: 'alert-circle-outline',
          color: colors.error,
          label: T.LABEL_EXPIRED,
          description: T.DESCRIPTION_EXPIRED,
        };
      default:
        return {
          icon: 'help-circle-outline',
          color: colors.textSecondary,
          label: T.LABEL_UNKNOWN,
          description: T.DESCRIPTION_UNKNOWN,
        };
    }
  };

  const statusInfo = getStatusInfo();

  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'en' ? 'en-US' : 'es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          backgroundColor: colors.cardBackground,
          borderRadius: 16,
          padding: SPACING.SCREEN_EDGE_INSET,
          marginBottom: 16,
          borderWidth: 1,
          borderColor: colors.border,
        },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 12,
        },
        headerText: {
          marginLeft: 12,
          flex: 1,
        },
        label: {
          fontSize: 18,
          fontWeight: 'bold',
          color: colors.text,
          marginBottom: 4,
        },
        description: {
          fontSize: 14,
          color: colors.textSecondary,
        },
        datesContainer: {
          marginTop: 12,
          paddingTop: 12,
          borderTopWidth: 1,
          borderTopColor: colors.border,
        },
        dateItem: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginBottom: 8,
        },
        dateLabel: {
          fontSize: 14,
          color: colors.textSecondary,
        },
        dateValue: {
          fontSize: 14,
          color: colors.text,
          fontWeight: '600',
        },
      }),
    [colors],
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <MaterialCommunityIcons 
          name={statusInfo.icon} 
          size={32} 
          color={statusInfo.color} 
        />
        <View style={styles.headerText}>
          <Text style={styles.label}>{statusInfo.label}</Text>
          <Text style={styles.description}>{statusInfo.description}</Text>
        </View>
      </View>

      {(trialEndDate || subscriptionEndDate) && (
        <View style={styles.datesContainer}>
          {trialEndDate && (effectiveStatus === 'trialing' || effectiveStatus === 'trial') && (
            <View style={styles.dateItem}>
              <Text style={styles.dateLabel}>{T.DATE_TRIAL_END}</Text>
              <Text style={styles.dateValue}>{formatDate(trialEndDate)}</Text>
            </View>
          )}
          {subscriptionEndDate &&
            (effectiveStatus === 'premium' || effectiveStatus === 'active') &&
            !subscriptionPeriodEnded && (
            <View style={styles.dateItem}>
              <Text style={styles.dateLabel}>{T.DATE_NEXT_RENEWAL}</Text>
              <Text style={styles.dateValue}>{formatDate(subscriptionEndDate)}</Text>
            </View>
          )}
          {subscriptionEndDate && effectiveStatus === 'expired' && subscriptionPeriodEnded && (
            <View style={styles.dateItem}>
              <Text style={styles.dateLabel}>{T.DATE_VALID_UNTIL}</Text>
              <Text style={styles.dateValue}>{formatDate(subscriptionEndDate)}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

export default SubscriptionStatus;

