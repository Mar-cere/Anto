/**
 * Vista de error del Dashboard de Crisis (mensaje + Reintentar)
 */
import React from 'react';
import { SafeAreaView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { styles } from './crisisDashboardStyles';
import { TEXTS } from './crisisDashboardConstants';
import { colors } from '../../styles/globalStyles';

export function CrisisDashboardErrorView({ error, onRetry }) {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.errorContainer}>
        <MaterialCommunityIcons name="alert-circle" size={64} color={colors.primary} />
        <Text style={styles.errorText}>{TEXTS.ERROR}</Text>
        <Text style={styles.errorDetail}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
          <Text style={styles.retryButtonText}>{TEXTS.RETRY}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
