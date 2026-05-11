/**
 * Vista de carga inicial de EditProfileScreen
 */
import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { useEditProfileScreenStyles } from './editProfileScreenStyles';
import { TEXTS } from './editProfileScreenConstants';

export function EditProfileLoadingView() {
  const { styles, editProfileColors } = useEditProfileScreenStyles();
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={editProfileColors.PRIMARY} />
      <Text style={styles.loadingText}>{TEXTS.LOADING}</Text>
    </View>
  );
}
