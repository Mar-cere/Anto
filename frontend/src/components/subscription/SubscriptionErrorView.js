import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSubscriptionTexts } from '../../screens/subscription/subscriptionScreenConstants';
import { useTheme } from '../../context/ThemeContext';
import { SPACING } from '../../constants/ui';

export default function SubscriptionErrorView({ error, onRetry }) {
  const TEXTS = useSubscriptionTexts();
  const { colors } = useTheme();
  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        centerContainer: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: SPACING.SCREEN_EDGE_INSET,
        },
        errorText: {
          color: colors.error,
          fontSize: 16,
          textAlign: 'center',
          marginTop: 16,
          marginBottom: 24,
        },
        retryButton: {
          backgroundColor: colors.primary,
          paddingHorizontal: 24,
          paddingVertical: 12,
          borderRadius: 12,
        },
        retryButtonText: {
          color: colors.textOnPrimary,
          fontSize: 16,
          fontWeight: 'bold',
        },
      }),
    [colors],
  );

  return (
    <View style={styles.centerContainer}>
      <MaterialCommunityIcons name="alert-circle" size={64} color={colors.error} />
      <Text style={styles.errorText}>{error}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
        <Text style={styles.retryButtonText}>{TEXTS.RETRY}</Text>
      </TouchableOpacity>
    </View>
  );
}
