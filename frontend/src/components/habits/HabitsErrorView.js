/**
 * Vista de error con reintentar para HabitsScreen.
 * @author AntoApp Team
 */

import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
  COLORS,
  ERROR_CONTAINER_GAP,
  ERROR_CONTAINER_PADDING,
  ERROR_ICON_SIZE,
  RETRY_BUTTON_BORDER_RADIUS,
  RETRY_BUTTON_PADDING_HORIZONTAL,
  RETRY_BUTTON_PADDING_VERTICAL,
  TEXTS,
} from '../../screens/habits/habitsScreenConstants';

export default function HabitsErrorView({ errorMessage, onRetry }) {
  return (
    <View style={styles.errorContainer}>
      <MaterialCommunityIcons name="alert-circle" size={ERROR_ICON_SIZE} color={COLORS.ERROR} />
      <Text style={styles.errorText}>{TEXTS.ERROR_LOAD}</Text>
      <Text style={styles.errorSubtext}>{errorMessage}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
        <Text style={styles.retryText}>{TEXTS.RETRY}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: ERROR_CONTAINER_PADDING,
    gap: ERROR_CONTAINER_GAP,
  },
  errorText: {
    color: COLORS.ERROR,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  errorSubtext: {
    color: COLORS.ACCENT,
    fontSize: 14,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: RETRY_BUTTON_PADDING_HORIZONTAL,
    paddingVertical: RETRY_BUTTON_PADDING_VERTICAL,
    borderRadius: RETRY_BUTTON_BORDER_RADIUS,
  },
  retryText: {
    color: COLORS.WHITE,
    fontSize: 16,
    fontWeight: '600',
  },
});
