/**
 * Fila de tarea con deslizamiento: completar (solo tareas pendientes) y eliminar (con confirmación).
 */
import React, { useMemo, useRef, useCallback } from 'react';
import { Alert, Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import TaskItem from './TaskItem';
import { useTheme } from '../../context/ThemeContext';

const SWIPE_THRESHOLD = -14;
const SWIPE_OPEN = -132;
const SWIPE_ANIM_MS = 220;
const ACTIVE_OFFSET_X = [-12, 12];
const ACTIVE_OFFSET_Y = [-80, 80];
const OP_HIDDEN = 0;
const OP_VISIBLE = 1;

export default function SwipeableTaskItem({ item, onPress, onToggleComplete, onDelete, density = 'comfortable' }) {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          position: 'relative',
          width: '100%',
          marginBottom: 8,
          overflow: 'hidden',
          borderRadius: 14,
        },
        actions: {
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          flexDirection: 'row',
          alignItems: 'stretch',
          justifyContent: 'flex-end',
          paddingRight: 8,
          gap: 8,
          zIndex: 0,
        },
        actionSlot: {
          justifyContent: 'center',
          minWidth: 76,
        },
        actionBtn: {
          flex: 1,
          borderRadius: 14,
          justifyContent: 'center',
          alignItems: 'center',
          paddingVertical: 10,
          paddingHorizontal: 10,
          minHeight: 96,
        },
        completeBg: {
          backgroundColor: colors.success,
          opacity: 0.95,
        },
        deleteBg: {
          backgroundColor: colors.error,
          opacity: 0.95,
        },
        actionLabel: {
          marginTop: 4,
          color: colors.textOnPrimary,
          fontSize: 11,
          fontWeight: '600',
        },
        cardLift: {
          width: '100%',
          zIndex: 1,
          backgroundColor: 'transparent',
        },
      }),
    [colors],
  );

  const translateX = useRef(new Animated.Value(0)).current;
  const completeOpacity = useRef(new Animated.Value(OP_HIDDEN)).current;
  const deleteOpacity = useRef(new Animated.Value(OP_HIDDEN)).current;

  const isTask = item.itemType === 'task';
  const showComplete = isTask && !item.completed;

  const resetPosition = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: 0,
        duration: SWIPE_ANIM_MS,
        useNativeDriver: false,
      }),
      Animated.timing(completeOpacity, {
        toValue: OP_HIDDEN,
        duration: SWIPE_ANIM_MS,
        useNativeDriver: false,
      }),
      Animated.timing(deleteOpacity, {
        toValue: OP_HIDDEN,
        duration: SWIPE_ANIM_MS,
        useNativeDriver: false,
      }),
    ]).start();
  }, [translateX, completeOpacity, deleteOpacity]);

  const onGestureEvent = useCallback(
    (e) => {
      const raw = e.nativeEvent.translationX;
      const tx = Math.min(0, Math.max(SWIPE_OPEN, raw));
      translateX.setValue(tx);
      if (raw < SWIPE_THRESHOLD) {
        const p = Math.min(1, Math.abs(raw) / 88);
        completeOpacity.setValue(showComplete ? p : 0);
        deleteOpacity.setValue(p);
      } else {
        completeOpacity.setValue(OP_HIDDEN);
        deleteOpacity.setValue(OP_HIDDEN);
      }
    },
    [translateX, completeOpacity, deleteOpacity, showComplete]
  );

  const onHandlerStateChange = useCallback(
    (e) => {
      const { oldState, translationX } = e.nativeEvent;
      if (oldState !== State.ACTIVE) return;
      if (translationX < SWIPE_THRESHOLD) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        Animated.parallel([
          Animated.timing(translateX, {
            toValue: SWIPE_OPEN,
            duration: SWIPE_ANIM_MS,
            useNativeDriver: false,
          }),
          Animated.timing(completeOpacity, {
            toValue: showComplete ? OP_VISIBLE : OP_HIDDEN,
            duration: SWIPE_ANIM_MS,
            useNativeDriver: false,
          }),
          Animated.timing(deleteOpacity, {
            toValue: OP_VISIBLE,
            duration: SWIPE_ANIM_MS,
            useNativeDriver: false,
          }),
        ]).start();
      } else {
        resetPosition();
      }
    },
    [showComplete, resetPosition, translateX, completeOpacity, deleteOpacity]
  );

  const handleSwipeDelete = useCallback(() => {
    Alert.alert(
      'Confirmar eliminación',
      `¿Eliminar este ${isTask ? 'tarea' : 'recordatorio'}?`,
      [
        { text: 'Cancelar', style: 'cancel', onPress: resetPosition },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            onDelete(item._id);
            resetPosition();
          },
        },
      ]
    );
  }, [isTask, item._id, onDelete, resetPosition]);

  const handleSwipeComplete = useCallback(() => {
    if (!showComplete) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    resetPosition();
    onToggleComplete(item._id);
  }, [showComplete, item._id, onToggleComplete, resetPosition]);

  if (item.completed) {
    return (
      <TaskItem
        item={item}
        onPress={onPress}
        onToggleComplete={onToggleComplete}
        onDelete={onDelete}
        density={density}
      />
    );
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.actions}>
        {showComplete ? (
          <Animated.View style={[styles.actionSlot, { opacity: completeOpacity }]}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.completeBg]}
              onPress={handleSwipeComplete}
              activeOpacity={0.85}
              accessibilityLabel="Completar tarea"
              accessibilityRole="button"
            >
              <Ionicons name="checkmark-done" size={26} color={colors.textOnPrimary} />
              <Text style={styles.actionLabel}>Completar</Text>
            </TouchableOpacity>
          </Animated.View>
        ) : null}
        <Animated.View style={[styles.actionSlot, { opacity: deleteOpacity }]}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.deleteBg]}
            onPress={handleSwipeDelete}
            activeOpacity={0.85}
            accessibilityLabel="Eliminar"
            accessibilityRole="button"
          >
            <Ionicons name="trash-outline" size={24} color={colors.textOnPrimary} />
            <Text style={styles.actionLabel}>Eliminar</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>

      <PanGestureHandler
        onGestureEvent={onGestureEvent}
        onHandlerStateChange={onHandlerStateChange}
        activeOffsetX={ACTIVE_OFFSET_X}
        activeOffsetY={ACTIVE_OFFSET_Y}
      >
        <Animated.View style={[styles.cardLift, { transform: [{ translateX }] }]}>
          <TaskItem
            item={item}
            onPress={onPress}
            onToggleComplete={onToggleComplete}
            onDelete={onDelete}
            swipeRow
            delayPressIn={380}
            density={density}
          />
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
}
