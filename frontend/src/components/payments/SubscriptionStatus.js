/**
 * Componente SubscriptionStatus
 * 
 * Muestra el estado actual de la suscripción del usuario.
 * 
 * @author AntoApp Team
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../styles/globalStyles';

const SubscriptionStatus = ({ status, plan, daysRemaining, trialEndDate, subscriptionEndDate }) => {
  const getStatusInfo = () => {
    switch (status) {
      case 'free':
        return {
          icon: 'account-outline',
          color: colors.textSecondary,
          label: 'Plan Gratuito',
          description: 'Actualiza a Premium para acceder a todas las funciones',
        };
      case 'trialing':
        return {
          icon: 'clock-outline',
          color: colors.warning,
          label: 'Periodo de Prueba',
          description: `Trial activo - ${daysRemaining || 0} días restantes`,
        };
      case 'premium':
      case 'active':
        const planNames = {
          weekly: 'Plan Semanal',
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
        return {
          icon: 'alert-circle-outline',
          color: colors.error,
          label: 'Suscripción Expirada',
          description: 'Tu suscripción ha expirado',
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
          {trialEndDate && status === 'trialing' && (
            <View style={styles.dateItem}>
              <Text style={styles.dateLabel}>Fin del Trial:</Text>
              <Text style={styles.dateValue}>{formatDate(trialEndDate)}</Text>
            </View>
          )}
          {subscriptionEndDate && (status === 'premium' || status === 'active') && (
            <View style={styles.dateItem}>
              <Text style={styles.dateLabel}>Próxima Renovación:</Text>
              <Text style={styles.dateValue}>{formatDate(subscriptionEndDate)}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 20,
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
    color: colors.white,
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
    color: colors.white,
    fontWeight: '600',
  },
});

export default SubscriptionStatus;

