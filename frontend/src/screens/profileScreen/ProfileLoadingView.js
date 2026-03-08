/**
 * Vista de carga inicial de ProfileScreen
 */
import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { styles } from './profileScreenStyles';
import { COLORS, TEXTS } from './profileScreenConstants';

export function ProfileLoadingView() {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={COLORS.PRIMARY} />
      <Text style={styles.loadingText}>{TEXTS.LOADING}</Text>
    </View>
  );
}
