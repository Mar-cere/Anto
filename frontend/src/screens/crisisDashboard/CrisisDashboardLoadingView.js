/**
 * Vista de carga del Dashboard de Crisis
 */
import React from 'react';
import { ActivityIndicator, SafeAreaView, StatusBar, Text, View } from 'react-native';
import { useCrisisDashboardStyles } from './crisisDashboardStyles';
import { useCrisisDashboardTexts } from './crisisDashboardConstants';
import { useTheme } from '../../context/ThemeContext';

export function CrisisDashboardLoadingView() {
  const styles = useCrisisDashboardStyles();
  const { colors, statusBarStyle } = useTheme();
  const TEXTS = useCrisisDashboardTexts();
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={statusBarStyle} backgroundColor={colors.background} />
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>{TEXTS.LOADING}</Text>
      </View>
    </SafeAreaView>
  );
}
