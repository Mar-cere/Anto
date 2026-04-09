/**
 * Vista de error del Dashboard de Crisis (mensaje + Reintentar)
 */
import React from 'react';
import { SafeAreaView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { styles } from './crisisDashboardStyles';
import { TEXTS, CRISIS_ERROR_DETAIL_MAX_LEN } from './crisisDashboardConstants';
import { colors } from '../../styles/globalStyles';

function sanitizeErrorDetail(raw) {
  if (raw == null) return '';
  const s = typeof raw === 'string' ? raw : String(raw);
  if (s.length <= CRISIS_ERROR_DETAIL_MAX_LEN) return s;
  return `${s.slice(0, CRISIS_ERROR_DETAIL_MAX_LEN)}…`;
}

export function CrisisDashboardErrorView({ error, onRetry }) {
  const detail = sanitizeErrorDetail(error);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.errorContainer}>
        <MaterialCommunityIcons name="alert-circle" size={64} color={colors.primary} accessible={false} />
        <Text style={styles.errorText}>{TEXTS.ERROR}</Text>
        {detail.length > 0 ? (
          <Text style={styles.errorDetail} accessibilityLabel={detail}>
            {detail}
          </Text>
        ) : null}
        <TouchableOpacity
          style={styles.retryButton}
          onPress={onRetry}
          accessibilityRole="button"
          accessibilityLabel={TEXTS.RETRY}
        >
          <Text style={styles.retryButtonText}>{TEXTS.RETRY}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
