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
import { useTheme } from '../../context/ThemeContext';
import { SPACING } from '../../constants/ui';

const SubscriptionStatus = ({ status, plan, daysRemaining, trialEndDate, subscriptionEndDate, isActive }) => {
  const { colors } = useTheme();
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
          label: 'Plan Gratuito',
          description: 'Actualiza a Premium para acceder a todas las funciones',
        };
      case 'trialing':
      case 'trial':
        return {
          icon: 'clock-outline',
          color: colors.warning,
          label: 'Periodo de Prueba',
          description: `Trial activo - ${daysRemaining ?? 0} días restantes`,
        };
      case 'premium':
      case 'active':
        const planNames = {
          monthly: 'Plan Mensual',
          quarterly: 'Plan Trimestral',
          semestral: 'Plan Semestral',
          yearly: 'Plan Anual',
        };
        return {
          icon: 'crown',
          color: colors.primary,
          label: 'Premium Activo',
          description: planNames[plan] || 'Plan Premium',
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
          label: 'Suscripción Expirada',
          description: 'Tu suscripción ha expirado o fue cancelada',
        };
      default:
        return {
          icon: 'help-circle-outline',
          color: colors.textSecondary,
          label: 'Estado Desconocido',
          description: 'No se pudo determinar el estado',
        };
    }
  };

  const statusInfo = getStatusInfo();

  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CL', {
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
              <Text style={styles.dateLabel}>Fin del Trial:</Text>
              <Text style={styles.dateValue}>{formatDate(trialEndDate)}</Text>
            </View>
          )}
          {subscriptionEndDate &&
            (effectiveStatus === 'premium' || effectiveStatus === 'active') &&
            !subscriptionPeriodEnded && (
            <View style={styles.dateItem}>
              <Text style={styles.dateLabel}>Próxima Renovación:</Text>
              <Text style={styles.dateValue}>{formatDate(subscriptionEndDate)}</Text>
            </View>
          )}
          {subscriptionEndDate && effectiveStatus === 'expired' && subscriptionPeriodEnded && (
            <View style={styles.dateItem}>
              <Text style={styles.dateLabel}>Vigencia hasta:</Text>
              <Text style={styles.dateValue}>{formatDate(subscriptionEndDate)}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

export default SubscriptionStatus;

