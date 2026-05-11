/**
 * Vista de carga inicial de ProfileScreen
 */
import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { useProfileScreenStyles } from './profileScreenStyles';
import { TEXTS } from './profileScreenConstants';

export function ProfileLoadingView() {
  const { styles, profileColors } = useProfileScreenStyles();
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={profileColors.PRIMARY} />
      <Text style={styles.loadingText}>{TEXTS.LOADING}</Text>
    </View>
  );
}
