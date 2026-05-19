import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { useSectionTranslations } from '../../hooks/useTranslations';
import { SPACING } from '../../constants/ui';

const DEFAULT_TEXTS = {
  TYPE_TASK_UPPER: 'TAREA',
  TYPE_GOAL_UPPER: 'META',
  TYPE_REMINDER_UPPER: 'RECORDATORIO',
  STATUS_COMPLETED: 'Completada',
  STATUS_OVERDUE: 'Atrasada',
  STATUS_DUE_TODAY: 'Vence hoy',
  STATUS_TOMORROW: 'Mañana',
  STATUS_IN_DAYS: 'En {days} dias',
  STATUS_PLANNED_TASK: 'Planificada',
  STATUS_PLANNED_GOAL: 'Planificada',
  STATUS_PLANNED_REMINDER: 'Programado',
  DELETE_CONFIRM_TITLE: 'Confirmar eliminación',
  DELETE_CONFIRM_MESSAGE: '¿Estás seguro de que deseas eliminar este {type}?',
  TYPE_TASK_LOWER: 'tarea',
  TYPE_GOAL_LOWER: 'meta',
  TYPE_REMINDER_LOWER: 'recordatorio',
  PRIORITY_HIGH_LABEL: 'Alta',
  PRIORITY_MEDIUM_LABEL: 'Media',
  PRIORITY_LOW_LABEL: 'Baja',
  PRIORITY_NORMAL_LABEL: 'Normal',
  OVERDUE_TASK: 'Caducada',
  OVERDUE_GOAL: 'Caducada',
  OVERDUE_REMINDER: 'Pasado',
  SUBTASKS_PREVIEW: 'Subtareas · {done}/{total}',
  CANCEL: 'Cancelar',
  DELETE: 'Eliminar',
};

const TaskItem = ({ item, onPress, onToggleComplete, onDelete, swipeRow, delayPressIn = 0, density = 'comfortable' }) => {
  const { language } = useLanguage();
  const { colors } = useTheme();
  const translated = useSectionTranslations('TASKS');
  const TEXTS = useMemo(
    () => ({ ...DEFAULT_TEXTS, ...(translated || {}) }),
    [translated]
  );
  const getPriorityColor = useCallback((priority) => {
    switch (priority) {
      case 'high': return colors.error;
      case 'medium': return colors.warning;
      case 'low': return colors.success;
      default: return colors.textMuted;
    }
  }, [colors]);

  const getPriorityAccent = useCallback((priority) => {
    switch (priority) {
      case 'high': return { backgroundColor: colors.error };
      case 'medium': return { backgroundColor: colors.warning };
      case 'low': return { backgroundColor: colors.success };
      default: return { backgroundColor: colors.textMuted };
    }
  }, [colors]);

  const isTask = item.itemType === 'task';
  const isGoal = item.itemType === 'goal';
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const prevCompletedRef = useRef(item.completed);
  const canShowSubtasks = (isTask || isGoal) && Array.isArray(item.subtasks) && item.subtasks.length > 0;
  const subtaskDoneCount = useRef(0);
  const nextSubtaskTitle = useRef('');
  if (canShowSubtasks) {
    const done = item.subtasks.filter((s) => !!s?.completed).length;
    subtaskDoneCount.current = done;
    const next = item.subtasks.find((s) => s && !s.completed && String(s.title || '').trim().length > 0);
    nextSubtaskTitle.current = next ? String(next.title || '').trim() : '';
  } else {
    subtaskDoneCount.current = 0;
    nextSubtaskTitle.current = '';
  }
  
  // Función para verificar si está caducado
  const isOverdue = useCallback(() => {
    return new Date(item.dueDate) < new Date();
  }, [item.dueDate]);

  // Función para determinar el estado del ítem
  const getItemState = useCallback(() => {
    if (item.completed) return 'completed';
    if (isOverdue()) return 'overdue';
    return 'pending';
  }, [item.completed, isOverdue]);

  const itemState = getItemState();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          marginBottom: 8,
        },
        containerSwipe: {
          marginBottom: 0,
        },
        itemCard: {
          backgroundColor: colors.chromeCard,
          borderRadius: 16,
          paddingVertical: 12,
          paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.chromeCardBorder,
          shadowColor: colors.glassShadow,
          shadowOpacity: 0.14,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 4 },
          elevation: 2,
          overflow: 'hidden',
        },
        entryGlow: {
          position: 'absolute',
          top: -24,
          left: -18,
          right: -18,
          height: 56,
          borderRadius: 20,
          backgroundColor: 'rgba(255,255,255,0.55)',
          transform: [{ rotate: '-7deg' }],
        },
        cardToneTask: {
          borderColor: colors.accentLine,
        },
        cardToneReminder: {
          borderColor: colors.error,
        },
        cardToneCompleted: {
          borderColor: colors.success,
        },
        cardToneOverdue: {
          borderColor: colors.error,
        },
        itemCardCompact: {
          paddingVertical: 10,
          paddingHorizontal: 11,
        },
        completedItem: {
          opacity: 0.72,
          backgroundColor: colors.glassFill,
          borderColor: colors.success,
        },
        itemHeader: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 12,
        },
        priorityAccent: {
          width: 3,
          borderRadius: 2,
          marginRight: 10,
          alignSelf: 'stretch',
          minHeight: 60,
          marginTop: 1,
        },
        priorityAccentOverdue: {
          backgroundColor: colors.error,
        },
        priorityAccentReminder: {
          backgroundColor: colors.warning,
        },
        itemTitleContainer: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: 12,
          flex: 1,
        },
        iconContainer: {
          width: 40,
          height: 40,
          borderRadius: 12,
          justifyContent: 'center',
          alignItems: 'center',
          marginTop: 2,
        },
        titleContainer: {
          flex: 1,
          gap: 4,
        },
        contextRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          marginBottom: 3,
          flexWrap: 'wrap',
        },
        typePill: {
          paddingHorizontal: 8,
          paddingVertical: 3,
          borderRadius: 999,
          borderWidth: StyleSheet.hairlineWidth,
        },
        typePillTask: {
          backgroundColor: colors.accentLineSoft,
          borderColor: colors.accentLine,
        },
        typePillReminder: {
          backgroundColor: 'rgba(255, 107, 107, 0.08)',
          borderColor: 'rgba(255, 107, 107, 0.24)',
        },
        typePillText: {
          fontSize: 10,
          fontWeight: '700',
          letterSpacing: 0.6,
        },
        typePillTextTask: {
          color: colors.primary,
        },
        typePillTextReminder: {
          color: colors.error,
        },
        timePill: {
          paddingHorizontal: 9,
          paddingVertical: 3,
          borderRadius: 999,
          backgroundColor: colors.glassFill,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.glassOutline,
        },
        timePillOverdue: {
          backgroundColor: 'rgba(255,107,107,0.14)',
          borderColor: 'rgba(255,107,107,0.32)',
        },
        timePillCompleted: {
          backgroundColor: 'rgba(76,175,80,0.14)',
          borderColor: 'rgba(76,175,80,0.32)',
        },
        timePillText: {
          fontSize: 10,
          fontWeight: '700',
          color: colors.textSecondary,
          letterSpacing: 0.5,
          textTransform: 'uppercase',
        },
        timePillTextOverdue: {
          color: colors.error,
        },
        timePillTextCompleted: {
          color: colors.success,
        },
        itemTitle: {
          fontSize: 15.5,
          fontWeight: '600',
          color: colors.text,
          lineHeight: 21,
          letterSpacing: -0.15,
        },
        itemTitleCompact: {
          fontSize: 15,
          lineHeight: 20,
        },
        completedTitle: {
          color: colors.textSecondary,
          textDecorationLine: 'line-through',
        },
        itemDescription: {
          fontSize: 13,
          color: colors.textSecondary,
          lineHeight: 18,
          fontWeight: '400',
        },
        subtasksPreviewRow: {
          marginTop: 8,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
        },
        subtasksPreviewText: {
          flex: 1,
          minWidth: 0,
          fontSize: 12,
          color: colors.textSecondary,
          fontWeight: '400',
        },
        itemDescriptionCompact: {
          fontSize: 12.5,
          lineHeight: 17,
        },
        completedDescription: {
          color: colors.textSecondary,
          opacity: 0.55,
        },
        itemActions: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
        },
        completeButton: {
          padding: 6,
          borderRadius: 12,
          backgroundColor: colors.glassFill,
        },
        completedButton: {
          backgroundColor: colors.accentLineSoft,
        },
        deleteButton: {
          padding: 6,
          borderRadius: 12,
          backgroundColor: 'rgba(255, 107, 107, 0.1)',
        },
        itemFooter: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        },
        itemMetadata: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
        },
        dateContainer: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          backgroundColor: colors.glassFill,
          paddingHorizontal: 10,
          paddingVertical: 6,
          borderRadius: 10,
        },
        timeContainer: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          backgroundColor: colors.glassFill,
          paddingHorizontal: 10,
          paddingVertical: 6,
          borderRadius: 10,
        },
        itemDate: {
          fontSize: 12,
          color: colors.textSecondary,
          fontWeight: '500',
        },
        itemDateCompact: {
          fontSize: 11,
        },
        metaContainerCompact: {
          paddingHorizontal: 8,
          paddingVertical: 4,
        },
        priorityBadge: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          paddingVertical: 6,
          paddingHorizontal: 10,
          borderRadius: 12,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
        },
        priorityText: {
          fontSize: 12,
          color: colors.textOnPrimary,
          fontWeight: '600',
        },
        overdueItem: {
          borderColor: colors.error,
          backgroundColor: 'rgba(255, 107, 107, 0.06)',
        },
        overdueTitle: {
          color: colors.error,
          textDecorationLine: 'line-through',
        },
        overdueDescription: {
          color: colors.error,
          opacity: 0.75,
        },
        overdueDateContainer: {
          backgroundColor: 'rgba(255, 107, 107, 0.1)',
        },
        overdueDate: {
          color: colors.error,
        },
        overdueBadge: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          backgroundColor: 'rgba(255, 107, 107, 0.2)',
          paddingVertical: 6,
          paddingHorizontal: 10,
          borderRadius: 12,
        },
        overdueText: {
          color: colors.error,
          fontSize: 12,
          fontWeight: '600',
        },
        badgeContainer: {
          flexDirection: 'row',
          gap: 8,
        },
      }),
    [colors],
  );

  const cardVisualTone =
    itemState === 'overdue'
      ? styles.cardToneOverdue
      : itemState === 'completed'
        ? styles.cardToneCompleted
        : isTask
          ? styles.cardToneTask
          : styles.cardToneReminder;

  const getTemporalLabel = useCallback(() => {
    if (itemState === 'completed') return TEXTS.STATUS_COMPLETED;
    const due = new Date(item.dueDate);
    if (Number.isNaN(due.getTime())) {
      return isTask
        ? TEXTS.TYPE_TASK_UPPER
        : isGoal
          ? TEXTS.TYPE_GOAL_UPPER
          : TEXTS.TYPE_REMINDER_UPPER;
    }
    const now = new Date();
    const startToday = new Date(now);
    startToday.setHours(0, 0, 0, 0);
    const startDue = new Date(due);
    startDue.setHours(0, 0, 0, 0);
    const diffDays = Math.round((startDue - startToday) / 86400000);
    if (itemState === 'overdue') return TEXTS.STATUS_OVERDUE;
    if (diffDays === 0) return TEXTS.STATUS_DUE_TODAY;
    if (diffDays === 1) return TEXTS.STATUS_TOMORROW;
    if (diffDays > 1 && diffDays <= 7) {
      return TEXTS.STATUS_IN_DAYS.replace('{days}', String(diffDays));
    }
    return isTask
      ? TEXTS.STATUS_PLANNED_TASK
      : isGoal
        ? TEXTS.STATUS_PLANNED_GOAL
        : TEXTS.STATUS_PLANNED_REMINDER;
  }, [itemState, item.dueDate, isTask, isGoal, TEXTS]);

  // Animación de entrada
  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }),
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 240,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [slideAnim, glowAnim]);

  // Animación premium cuando se completa.
  useEffect(() => {
    const wasCompleted = prevCompletedRef.current;
    if (!wasCompleted && item.completed) {
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.03,
          duration: 120,
          useNativeDriver: true,
        }),
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 0.98,
            duration: 180,
            useNativeDriver: true,
          }),
        Animated.timing(fadeAnim, {
          toValue: 0.82,
          duration: 180,
          useNativeDriver: true,
        }),
        ]),
        Animated.timing(fadeAnim, {
          toValue: 0.62,
          duration: 320,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (!item.completed) {
      fadeAnim.setValue(1);
      scaleAnim.setValue(1);
    }
    prevCompletedRef.current = item.completed;
  }, [item.completed, fadeAnim, scaleAnim]);

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress(item);
  }, [onPress, item]);

  const handleToggleComplete = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await onToggleComplete(item._id);
  }, [onToggleComplete, item._id]);

  const handleDelete = useCallback(() => {
    Alert.alert(
      TEXTS.DELETE_CONFIRM_TITLE,
      TEXTS.DELETE_CONFIRM_MESSAGE.replace(
        '{type}',
        isTask ? TEXTS.TYPE_TASK_LOWER : isGoal ? TEXTS.TYPE_GOAL_LOWER : TEXTS.TYPE_REMINDER_LOWER
      ),
      [
        { text: TEXTS.CANCEL, style: 'cancel' },
        {
          text: TEXTS.DELETE,
          style: 'destructive',
          onPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            onDelete(item._id);
          }
        }
      ]
    );
  }, [onDelete, item._id, isTask, isGoal, TEXTS]);

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
      tension: 100,
      friction: 5,
    }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 5,
    }).start();
  }, [scaleAnim]);

  if (!item) {
    console.warn('TaskItem: item es undefined');
    return null;
  }

  return (
    <Animated.View 
      style={[
        styles.container,
        swipeRow && styles.containerSwipe,
        {
          opacity: fadeAnim,
          transform: [
            { scale: scaleAnim },
            {
              translateX: slideAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [50, 0],
              })
            }
          ]
        }
      ]}
    >
      <TouchableOpacity
        style={[
          styles.itemCard,
          cardVisualTone,
          density === 'compact' && styles.itemCardCompact,
          itemState === 'completed' && styles.completedItem,
          itemState === 'overdue' && styles.overdueItem
        ]}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.8}
        delayPressIn={delayPressIn}
      >
        <Animated.View
          pointerEvents="none"
          style={[
            styles.entryGlow,
            {
              opacity: glowAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.22],
              }),
            },
          ]}
        />
        <View style={styles.itemHeader}>
          <View
            style={[
              styles.priorityAccent,
              itemState === 'overdue'
                ? styles.priorityAccentOverdue
                : isTask
                  ? getPriorityAccent(item.priority)
                  : styles.priorityAccentReminder,
            ]}
          />
          <View style={styles.itemTitleContainer}>
            <View style={[
              styles.iconContainer,
              { 
                backgroundColor: itemState === 'overdue' 
                  ? 'rgba(255, 107, 107, 0.12)' 
                  : isTask 
                    ? 'rgba(30, 131, 211, 0.1)' 
                    : 'rgba(255, 107, 107, 0.12)'
              }
            ]}>
              <Ionicons 
                name={isTask ? 'checkbox-outline' : isGoal ? 'flag-outline' : 'alarm-outline'} 
                size={20} 
                color={itemState === 'overdue' ? colors.error : isTask || isGoal ? colors.primary : colors.error} 
              />
            </View>
            <View style={styles.titleContainer}>
              <View style={styles.contextRow}>
                <View style={[styles.typePill, isTask || isGoal ? styles.typePillTask : styles.typePillReminder]}>
                  <Text style={[styles.typePillText, isTask || isGoal ? styles.typePillTextTask : styles.typePillTextReminder]}>
                    {isTask ? TEXTS.TYPE_TASK_UPPER : isGoal ? TEXTS.TYPE_GOAL_UPPER : TEXTS.TYPE_REMINDER_UPPER}
                  </Text>
                </View>
                <View
                  style={[
                    styles.timePill,
                    itemState === 'overdue' && styles.timePillOverdue,
                    itemState === 'completed' && styles.timePillCompleted,
                  ]}
                >
                  <Text
                    style={[
                      styles.timePillText,
                      itemState === 'overdue' && styles.timePillTextOverdue,
                      itemState === 'completed' && styles.timePillTextCompleted,
                    ]}
                  >
                    {getTemporalLabel()}
                  </Text>
                </View>
              </View>
              <Text style={[
                styles.itemTitle,
                density === 'compact' && styles.itemTitleCompact,
                itemState === 'completed' && styles.completedTitle,
                itemState === 'overdue' && styles.overdueTitle
              ]} numberOfLines={1}>
                {item.title}
              </Text>
              {item.description && (
                <Text style={[
                  styles.itemDescription,
                  density === 'compact' && styles.itemDescriptionCompact,
                  itemState === 'completed' && styles.completedDescription,
                  itemState === 'overdue' && styles.overdueDescription
                ]} numberOfLines={1}>
                  {item.description}
                </Text>
              )}
              {canShowSubtasks ? (
                <View style={styles.subtasksPreviewRow}>
                  <Text style={styles.subtasksPreviewText} numberOfLines={1}>
                    {TEXTS.SUBTASKS_PREVIEW
                      .replace('{done}', String(subtaskDoneCount.current))
                      .replace('{total}', String(item.subtasks.length))}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
                </View>
              ) : null}
            </View>
          </View>
          <View style={styles.itemActions}>
            {itemState === 'pending' && (
              <TouchableOpacity
                style={[
                  styles.completeButton,
                  item.completed && styles.completedButton
                ]}
                onPress={handleToggleComplete}
                activeOpacity={0.7}
              >
                <Ionicons 
                  name={item.completed ? 'checkmark-circle' : 'ellipse-outline'} 
                  size={24} 
                  color={item.completed ? colors.success : colors.primary} 
                />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleDelete}
              activeOpacity={0.7}
            >
              <Ionicons name="trash-outline" size={20} color={colors.error} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.itemFooter}>
          <View style={styles.itemMetadata}>
            <View style={[
              styles.dateContainer,
              density === 'compact' && styles.metaContainerCompact,
              itemState === 'overdue' && styles.overdueDateContainer
            ]}>
              <Ionicons 
                name="calendar-outline" 
                size={14} 
                color={itemState === 'overdue' ? colors.error : colors.primary} 
              />
              <Text style={[
                styles.itemDate,
                density === 'compact' && styles.itemDateCompact,
                itemState === 'overdue' && styles.overdueDate
              ]}>
                {new Date(item.dueDate).toLocaleDateString(language === 'en' ? 'en-US' : 'es-ES', {
                  day: '2-digit',
                  month: 'short'
                })}
              </Text>
            </View>
            <View style={[
              styles.timeContainer,
              density === 'compact' && styles.metaContainerCompact,
              itemState === 'overdue' && styles.overdueDateContainer
            ]}>
              <Ionicons 
                name="time-outline" 
                size={14} 
                color={itemState === 'overdue' ? colors.error : colors.primary} 
              />
              <Text style={[
                styles.itemDate,
                density === 'compact' && styles.itemDateCompact,
                itemState === 'overdue' && styles.overdueDate
              ]}>
                {new Date(item.dueDate).toLocaleTimeString(language === 'en' ? 'en-US' : 'es-ES', {
                  hour: '2-digit', 
                  minute: '2-digit',
                  hour12: true 
                })}
              </Text>
            </View>
          </View>
          <View style={styles.badgeContainer}>
            {isTask && itemState === 'pending' && (
              <View style={[
                styles.priorityBadge,
                { backgroundColor: getPriorityColor(item.priority) }
              ]}>
                <Ionicons 
                  name={getPriorityIcon(item.priority)} 
                  size={12} 
                  color={colors.textOnPrimary} 
                />
                <Text style={styles.priorityText}>
                  {getPriorityText(item.priority, TEXTS)}
                </Text>
              </View>
            )}
            {itemState === 'overdue' && (
              <View style={styles.overdueBadge}>
                <Ionicons name="alert-circle" size={12} color={colors.error} />
                <Text style={styles.overdueText}>
                  {isTask ? TEXTS.OVERDUE_TASK : isGoal ? TEXTS.OVERDUE_GOAL : TEXTS.OVERDUE_REMINDER}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const getPriorityIcon = (priority) => {
  switch (priority) {
    case 'high': return 'alert-circle';
    case 'medium': return 'alert';
    case 'low': return 'checkmark-circle';
    default: return 'help-circle';
  }
};

const getPriorityText = (priority, texts = DEFAULT_TEXTS) => {
  switch (priority) {
    case 'high': return texts.PRIORITY_HIGH_LABEL;
    case 'medium': return texts.PRIORITY_MEDIUM_LABEL;
    case 'low': return texts.PRIORITY_LOW_LABEL;
    default: return texts.PRIORITY_NORMAL_LABEL;
  }
};

export default TaskItem; 