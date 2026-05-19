/**
 * Componente PlanCard
 * 
 * Muestra una tarjeta con la información de un plan de suscripción.
 * 
 * @author AntoApp Team
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../context/ThemeContext';
import { useSectionTranslations } from '../../hooks/useTranslations';
import { SPACING } from '../../constants/ui';

const DEFAULT_TEXTS = {
  RECOMMENDED: 'Recomendado',
  CURRENT_PLAN: 'Plan Actual',
  INTERVAL_WEEK: '/semana',
  INTERVAL_MONTH: '/mes',
  INTERVAL_QUARTER: '/trimestre',
  INTERVAL_SEMESTER: '/semestre',
  INTERVAL_YEAR: '/año',
  FEATURE_FALLBACK: 'Servicio completo incluido',
  SELECTED: 'Seleccionado',
  SUBSCRIBE: 'Suscribirse',
};

const PlanCard = ({ 
  plan, 
  isSelected = false, 
  isCurrentPlan = false,
  isRecommended = false,
  onSelect,
  disabled = false,
}) => {
  const { colors } = useTheme();
  const translated = useSectionTranslations('SUBSCRIPTION');
  const T = useMemo(
    () => ({
      RECOMMENDED: translated?.PLAN_CARD_RECOMMENDED || DEFAULT_TEXTS.RECOMMENDED,
      CURRENT_PLAN: translated?.PLAN_CARD_CURRENT_PLAN || DEFAULT_TEXTS.CURRENT_PLAN,
      INTERVAL_WEEK: translated?.PLAN_CARD_INTERVAL_WEEK || DEFAULT_TEXTS.INTERVAL_WEEK,
      INTERVAL_MONTH: translated?.PLAN_CARD_INTERVAL_MONTH || DEFAULT_TEXTS.INTERVAL_MONTH,
      INTERVAL_QUARTER:
        translated?.PLAN_CARD_INTERVAL_QUARTER || DEFAULT_TEXTS.INTERVAL_QUARTER,
      INTERVAL_SEMESTER:
        translated?.PLAN_CARD_INTERVAL_SEMESTER || DEFAULT_TEXTS.INTERVAL_SEMESTER,
      INTERVAL_YEAR: translated?.PLAN_CARD_INTERVAL_YEAR || DEFAULT_TEXTS.INTERVAL_YEAR,
      FEATURE_FALLBACK:
        translated?.PLAN_CARD_FEATURE_FALLBACK || DEFAULT_TEXTS.FEATURE_FALLBACK,
      SELECTED: translated?.PLAN_CARD_SELECTED || DEFAULT_TEXTS.SELECTED,
      SUBSCRIBE: translated?.PLAN_CARD_SUBSCRIBE || DEFAULT_TEXTS.SUBSCRIBE,
    }),
    [translated],
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          backgroundColor: colors.cardBackground,
          borderRadius: 16,
          padding: SPACING.SCREEN_EDGE_INSET,
          marginBottom: 16,
          borderWidth: 2,
          borderColor: colors.border,
          position: 'relative',
        },
        cardSelected: {
          borderColor: colors.primary,
          backgroundColor: colors.accentLineSoft,
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
          paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
          paddingVertical: 4,
          borderRadius: 12,
          zIndex: 1,
        },
        recommendedText: {
          color: colors.textOnPrimary,
          fontSize: 12,
          fontWeight: 'bold',
        },
        currentBadge: {
          position: 'absolute',
          top: -10,
          right: 20,
          backgroundColor: colors.success,
          paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
          paddingVertical: 4,
          borderRadius: 12,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          zIndex: 1,
        },
        currentText: {
          color: colors.textOnPrimary,
          fontSize: 12,
          fontWeight: 'bold',
        },
        header: {
          marginBottom: 16,
        },
        name: {
          fontSize: 24,
          fontWeight: 'bold',
          color: colors.text,
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
          color: colors.textOnPrimary,
        },
        buttonTextDisabled: {
          color: colors.textSecondary,
        },
      }),
    [colors],
  );

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
          <Text style={styles.recommendedText}>{T.RECOMMENDED}</Text>
        </View>
      )}

      {isCurrentPlan && (
        <View style={styles.currentBadge}>
          <MaterialCommunityIcons name="check-circle" size={20} color={colors.success} />
          <Text style={styles.currentText}>{T.CURRENT_PLAN}</Text>
        </View>
      )}

      <View style={styles.header}>
        <Text style={styles.name}>{plan.name}</Text>
        <View style={styles.priceContainer}>
          <Text style={styles.price}>{plan.formattedAmount}</Text>
          <Text style={styles.interval}>
            {plan.interval === 'week' ? T.INTERVAL_WEEK :
             plan.interval === 'month' ? T.INTERVAL_MONTH :
             plan.interval === 'quarter' ? T.INTERVAL_QUARTER :
             plan.interval === 'semester' ? T.INTERVAL_SEMESTER :
             plan.interval === 'year' ? T.INTERVAL_YEAR : `/${plan.interval}`}
          </Text>
        </View>
      </View>

      <View style={styles.featuresContainer}>
        <View style={styles.feature}>
          <MaterialCommunityIcons 
            name="check-circle" 
            size={18} 
            color={colors.success} 
            style={styles.featureIcon}
          />
          <Text style={styles.featureText}>
            {plan.features && plan.features[0] ? plan.features[0] : T.FEATURE_FALLBACK}
          </Text>
        </View>
      </View>

      {!isCurrentPlan && (
        <View
          style={[
            styles.button,
            isSelected && styles.buttonSelected,
            disabled && styles.buttonDisabled,
          ]}
        >
          <Text style={[
            styles.buttonText,
            isSelected && styles.buttonTextSelected,
            disabled && styles.buttonTextDisabled,
          ]}>
            {isSelected ? T.SELECTED : T.SUBSCRIBE}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

export default PlanCard;

