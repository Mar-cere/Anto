/**
 * Componente PlanCard
 * 
 * Muestra una tarjeta con la información de un plan de suscripción.
 * 
 * @author AntoApp Team
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../styles/globalStyles';
import * as Haptics from 'expo-haptics';

const PlanCard = ({ 
  plan, 
  isSelected = false, 
  isCurrentPlan = false,
  isRecommended = false,
  onSelect,
  disabled = false,
}) => {
  const handlePress = () => {
    if (!disabled && onSelect) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onSelect(plan);
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.card,
        isSelected && styles.cardSelected,
        isCurrentPlan && styles.cardCurrent,
        disabled && styles.cardDisabled,
      ]}
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      {isRecommended && (
        <View style={styles.recommendedBadge}>
          <Text style={styles.recommendedText}>Recomendado</Text>
        </View>
      )}

      {isCurrentPlan && (
        <View style={styles.currentBadge}>
          <MaterialCommunityIcons name="check-circle" size={20} color={colors.success} />
          <Text style={styles.currentText}>Plan Actual</Text>
        </View>
      )}

      <View style={styles.header}>
        <Text style={styles.name}>{plan.name}</Text>
        <View style={styles.priceContainer}>
          <Text style={styles.price}>{plan.formattedAmount}</Text>
          <Text style={styles.interval}>
            {plan.interval === 'week' ? '/semana' :
             plan.interval === 'month' ? '/mes' :
             plan.interval === 'quarter' ? '/trimestre' :
             plan.interval === 'semester' ? '/semestre' :
             plan.interval === 'year' ? '/año' : `/${plan.interval}`}
          </Text>
        </View>
      </View>

      {plan.discount && (
        <View style={styles.discountContainer}>
          <Text style={styles.discount}>{plan.discount} de descuento</Text>
          {plan.savings && (
            <Text style={styles.savings}>Ahorra {plan.savings}</Text>
          )}
        </View>
      )}

      <View style={styles.featuresContainer}>
        {plan.features && plan.features.map((feature, index) => (
          <View key={index} style={styles.feature}>
            <MaterialCommunityIcons 
              name="check-circle" 
              size={18} 
              color={colors.success} 
              style={styles.featureIcon}
            />
            <Text style={styles.featureText}>{feature}</Text>
          </View>
        ))}
      </View>

      {!isCurrentPlan && (
        <TouchableOpacity
          style={[
            styles.button,
            isSelected && styles.buttonSelected,
            disabled && styles.buttonDisabled,
          ]}
          onPress={handlePress}
          disabled={disabled}
        >
          <Text style={[
            styles.buttonText,
            isSelected && styles.buttonTextSelected,
            disabled && styles.buttonTextDisabled,
          ]}>
            {isSelected ? 'Seleccionado' : 'Suscribirse'}
          </Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: colors.border,
    position: 'relative',
  },
  cardSelected: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(26, 221, 219, 0.1)',
  },
  cardCurrent: {
    borderColor: colors.success,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  cardDisabled: {
    opacity: 0.6,
  },
  recommendedBadge: {
    position: 'absolute',
    top: -10,
    right: 20,
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  recommendedText: {
    color: colors.background,
    fontSize: 12,
    fontWeight: 'bold',
  },
  currentBadge: {
    position: 'absolute',
    top: -10,
    right: 20,
    backgroundColor: colors.success,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    zIndex: 1,
  },
  currentText: {
    color: colors.background,
    fontSize: 12,
    fontWeight: 'bold',
  },
  header: {
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  price: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary,
  },
  interval: {
    fontSize: 16,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  discountContainer: {
    backgroundColor: 'rgba(26, 221, 219, 0.2)',
    padding: 8,
    borderRadius: 8,
    marginBottom: 16,
  },
  discount: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  savings: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  featuresContainer: {
    marginBottom: 20,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureIcon: {
    marginRight: 8,
  },
  featureText: {
    color: colors.text,
    fontSize: 14,
    flex: 1,
  },
  button: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonSelected: {
    backgroundColor: colors.primary,
  },
  buttonDisabled: {
    borderColor: colors.textSecondary,
    opacity: 0.5,
  },
  buttonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonTextSelected: {
    color: colors.background,
  },
  buttonTextDisabled: {
    color: colors.textSecondary,
  },
});

export default PlanCard;

