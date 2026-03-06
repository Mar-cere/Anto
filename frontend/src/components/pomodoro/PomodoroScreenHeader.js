/**
 * Header de la pantalla Pomodoro.
 * @author AntoApp Team
 */

import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { StatusBar, StyleSheet, Text, View } from 'react-native';
import {
  COLORS,
  HEADER_BORDER_WIDTH,
  HEADER_GAP,
  HEADER_ICON_SIZE,
  HEADER_PADDING,
  STATUS_BAR_STYLE,
  STATUS_BAR_BACKGROUND,
  TEXTS,
} from '../../screens/pomodoro/pomodoroScreenConstants';

export default function PomodoroScreenHeader() {
  return (
    <View style={styles.headerContainer}>
      <StatusBar barStyle={STATUS_BAR_STYLE} backgroundColor={STATUS_BAR_BACKGROUND} />
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MaterialCommunityIcons
            name="timer-outline"
            size={HEADER_ICON_SIZE}
            color={COLORS.PRIMARY}
          />
          <Text style={styles.headerTitle}>{TEXTS.TITLE}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    borderBottomWidth: HEADER_BORDER_WIDTH,
    borderBottomColor: COLORS.HEADER_BORDER,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: HEADER_PADDING,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: HEADER_GAP,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.WHITE,
  },
});
