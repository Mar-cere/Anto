/**
 * Vista de carga inicial de EditProfileScreen
 */
import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { styles } from './editProfileScreenStyles';
import { COLORS, TEXTS } from './editProfileScreenConstants';

export function EditProfileLoadingView() {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={COLORS.PRIMARY} />
      <Text style={styles.loadingText}>{TEXTS.LOADING}</Text>
    </View>
  );
}
