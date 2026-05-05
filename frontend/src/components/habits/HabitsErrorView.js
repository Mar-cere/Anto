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
import { FOCUS_META } from '../../styles/focusCardTheme';

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
    margin: 16,
    padding: ERROR_CONTAINER_PADDING / 1.4,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 217, 61, 0.12)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 217, 61, 0.35)',
    gap: 10,
    alignItems: 'center',
  },
  errorText: {
    color: COLORS.WHITE,
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  errorSubtext: {
    color: FOCUS_META,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  retryButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: RETRY_BUTTON_PADDING_HORIZONTAL,
    paddingVertical: RETRY_BUTTON_PADDING_VERTICAL,
    borderRadius: RETRY_BUTTON_BORDER_RADIUS,
  },
  retryText: {
    color: COLORS.PRIMARY,
    fontSize: 14,
    fontWeight: '600',
  },
});
