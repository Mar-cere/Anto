import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { TEXTS } from '../../screens/subscription/subscriptionScreenConstants';
import { useTheme } from '../../context/ThemeContext';
import { SPACING } from '../../constants/ui';

export default function SubscriptionLoadingView() {
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
        loadingText: {
          color: colors.textSecondary,
          fontSize: 16,
          marginTop: 16,
        },
      }),
    [colors],
  );

  return (
    <View style={styles.centerContainer}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.loadingText}>{TEXTS.LOADING}</Text>
    </View>
  );
}
