/**
 * Vista de carga del Dashboard de Crisis
 */
import React from 'react';
import { ActivityIndicator, SafeAreaView, StatusBar, Text, View } from 'react-native';
import { styles } from './crisisDashboardStyles';
import { TEXTS } from './crisisDashboardConstants';
import { colors } from '../../styles/globalStyles';

export function CrisisDashboardLoadingView() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>{TEXTS.LOADING}</Text>
      </View>
    </SafeAreaView>
  );
}
