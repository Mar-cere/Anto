/**
 * Componente de Indicador de Progreso de Protocolo
 * Muestra el progreso de un protocolo terapéutico activo
 */

import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useMemo } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useSectionTranslations } from '../hooks/useTranslations';
import { SPACING } from '../constants/ui';

const DEFAULT_TEXTS = {
  ACTIVE_PROTOCOL: 'Protocolo Activo',
  THERAPEUTIC_PROTOCOL_FALLBACK: 'Protocolo Terapéutico',
  PROGRESS_TEMPLATE: 'Paso {current} de {total}',
  SKIP_PROTOCOL: 'Saltar Protocolo',
};

const ProtocolProgressIndicator = ({ 
  protocol, 
  currentStep, 
  totalSteps,
  onSkip,
  onPause 
}) => {
  const { colors } = useTheme();
  const translated = useSectionTranslations('DASH');
  const TEXTS = useMemo(
    () => ({
      ACTIVE_PROTOCOL:
        translated?.PROTOCOL_ACTIVE || DEFAULT_TEXTS.ACTIVE_PROTOCOL,
      THERAPEUTIC_PROTOCOL_FALLBACK:
        translated?.PROTOCOL_NAME_FALLBACK || DEFAULT_TEXTS.THERAPEUTIC_PROTOCOL_FALLBACK,
      PROGRESS_TEMPLATE:
        translated?.PROTOCOL_PROGRESS_TEMPLATE || DEFAULT_TEXTS.PROGRESS_TEMPLATE,
      SKIP_PROTOCOL:
        translated?.PROTOCOL_SKIP || DEFAULT_TEXTS.SKIP_PROTOCOL,
    }),
    [translated],
  );
  const progress = currentStep / totalSteps;
  const progressAnim = React.useRef(new Animated.Value(progress)).current;

  React.useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [progress, progressAnim]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          backgroundColor: colors.cardBackground,
          borderRadius: 12,
          padding: SPACING.CARD_INNER_INSET,
          marginBottom: 12,
          borderWidth: 1,
          borderColor: colors.accentLine,
          shadowColor: colors.glassShadow,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        },
        header: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 8,
        },
        headerLeft: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: SPACING.sm,
        },
        title: {
          fontSize: 14,
          fontWeight: '600',
          color: colors.text,
        },
        pauseButton: {
          padding: SPACING.xs,
        },
        protocolName: {
          fontSize: 16,
          fontWeight: '600',
          color: colors.primary,
          marginBottom: 12,
        },
        progressContainer: {
          marginBottom: 12,
        },
        progressBar: {
          height: 6,
          backgroundColor: colors.border,
          borderRadius: 3,
          overflow: 'hidden',
          marginBottom: 8,
        },
        progressFill: {
          height: '100%',
          backgroundColor: colors.primary,
          borderRadius: 3,
        },
        progressText: {
          fontSize: 12,
          color: colors.textSecondary,
          textAlign: 'right',
        },
        skipButton: {
          alignSelf: 'flex-end',
          paddingVertical: 6,
          paddingHorizontal: SPACING.CHIP_INSET,
        },
        skipButtonText: {
          fontSize: 12,
          color: colors.textSecondary,
          textDecorationLine: 'underline',
        },
      }),
    [colors],
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MaterialCommunityIcons
            name="progress-clock"
            size={20}
            color={colors.primary}
          />
          <Text style={styles.title}>{TEXTS.ACTIVE_PROTOCOL}</Text>
        </View>
        {onPause && (
          <TouchableOpacity
            style={styles.pauseButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onPause();
            }}
          >
            <MaterialCommunityIcons
              name="pause"
              size={18}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.protocolName}>
        {protocol?.name || TEXTS.THERAPEUTIC_PROTOCOL_FALLBACK}
      </Text>
      
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <Animated.View
            style={[
              styles.progressFill,
              { width: progressWidth },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {TEXTS.PROGRESS_TEMPLATE
            .replace('{current}', String(currentStep))
            .replace('{total}', String(totalSteps))}
        </Text>
      </View>

      {onSkip && (
        <TouchableOpacity
          style={styles.skipButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onSkip();
          }}
        >
          <Text style={styles.skipButtonText}>{TEXTS.SKIP_PROTOCOL}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default ProtocolProgressIndicator;

