/**
 * Vista vacía de la lista de hábitos (con opción de crear el primero).
 * @author AntoApp Team
 */

import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
  ADD_FIRST_BUTTON_BORDER_RADIUS,
  ADD_FIRST_BUTTON_BORDER_WIDTH,
  ADD_FIRST_BUTTON_GAP,
  ADD_FIRST_BUTTON_PADDING_HORIZONTAL,
  ADD_FIRST_BUTTON_PADDING_VERTICAL,
  ADD_ICON_SIZE,
  COLORS,
  EMPTY_CONTAINER_GAP,
  EMPTY_CONTAINER_PADDING,
  EMPTY_ICON_SIZE,
  FILTER_TYPES,
  TEXTS,
} from '../../screens/habits/habitsScreenConstants';

export default function HabitsEmptyView({ filterType, onCreateFirst }) {
  const isActive = filterType === FILTER_TYPES.ACTIVE;
  return (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons
        name="lightning-bolt"
        size={EMPTY_ICON_SIZE}
        color={COLORS.ACCENT}
      />
      <Text style={styles.emptyText}>
        {isActive ? TEXTS.EMPTY_ACTIVE : TEXTS.EMPTY_ARCHIVED}
      </Text>
      {isActive && (
        <>
          <Text style={styles.emptySubtext}>{TEXTS.EMPTY_ACTIVE_SUBTITLE}</Text>
          <TouchableOpacity style={styles.addFirstButton} onPress={onCreateFirst}>
            <MaterialCommunityIcons name="plus" size={ADD_ICON_SIZE} color={COLORS.PRIMARY} />
            <Text style={styles.addFirstText}>{TEXTS.CREATE_FIRST}</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: EMPTY_CONTAINER_PADDING,
    gap: EMPTY_CONTAINER_GAP,
  },
  emptyText: {
    color: COLORS.ACCENT,
    fontSize: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    color: COLORS.ACCENT,
    fontSize: 14,
    opacity: 0.9,
    textAlign: 'center',
    marginTop: 8,
  },
  addFirstButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ADD_FIRST_BUTTON_GAP,
    paddingHorizontal: ADD_FIRST_BUTTON_PADDING_HORIZONTAL,
    paddingVertical: ADD_FIRST_BUTTON_PADDING_VERTICAL,
    borderRadius: ADD_FIRST_BUTTON_BORDER_RADIUS,
    backgroundColor: COLORS.ADD_FIRST_BUTTON_BACKGROUND,
    borderWidth: ADD_FIRST_BUTTON_BORDER_WIDTH,
    borderColor: COLORS.ADD_FIRST_BUTTON_BORDER,
  },
  addFirstText: {
    color: COLORS.PRIMARY,
    fontSize: 16,
    fontWeight: '500',
  },
});
