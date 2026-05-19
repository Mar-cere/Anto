/**
 * Vista de error con reintentar para HabitsScreen.
 * @author AntoApp Team
 */

import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import {
  createHabitsColors,
  ERROR_CONTAINER_PADDING,
  ERROR_ICON_SIZE,
  RETRY_BUTTON_BORDER_RADIUS,
  RETRY_BUTTON_PADDING_HORIZONTAL,
  RETRY_BUTTON_PADDING_VERTICAL,
  useHabitsTexts,
} from '../../screens/habits/habitsScreenConstants';
import { getFocusTheme } from '../../styles/focusCardTheme';
import { SPACING } from '../../constants/ui';

export default function HabitsErrorView({ errorMessage, onRetry }) {
  const TEXTS = useHabitsTexts();
  const { colors, resolvedScheme } = useTheme();
  const t = useMemo(() => getFocusTheme(colors, resolvedScheme), [colors, resolvedScheme]);
  const HC = useMemo(() => createHabitsColors(colors), [colors]);
  const styles = useMemo(
    () =>
      StyleSheet.create({
        errorContainer: {
          marginBottom: 12,
          marginHorizontal: SPACING.SCREEN_EDGE_INSET,
          padding: ERROR_CONTAINER_PADDING / 1.4,
          borderRadius: 14,
          backgroundColor: colors.accentLineSoft,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.warning,
          gap: 10,
          alignItems: 'center',
        },
        errorText: {
          color: colors.text,
          fontSize: 15,
          fontWeight: '600',
          textAlign: 'center',
        },
        errorSubtext: {
          color: t.FOCUS_META,
          fontSize: 13,
          textAlign: 'center',
          lineHeight: 18,
        },
        retryButton: {
          backgroundColor: t.FOCUS_INNER_ROW.backgroundColor,
          paddingHorizontal: RETRY_BUTTON_PADDING_HORIZONTAL,
          paddingVertical: RETRY_BUTTON_PADDING_VERTICAL,
          borderRadius: RETRY_BUTTON_BORDER_RADIUS,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
        },
        retryText: {
          color: HC.PRIMARY,
          fontSize: 14,
          fontWeight: '600',
        },
      }),
    [colors, t, HC],
  );

  return (
    <View style={styles.errorContainer}>
      <MaterialCommunityIcons name="alert-circle" size={ERROR_ICON_SIZE} color={HC.ERROR} />
      <Text style={styles.errorText}>{TEXTS.ERROR_LOAD}</Text>
      <Text style={styles.errorSubtext}>{errorMessage}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
        <Text style={styles.retryText}>{TEXTS.RETRY}</Text>
      </TouchableOpacity>
    </View>
  );
}
