/**
 * Modal de detalle de tarea / recordatorio (hoja inferior, estilo alineado al foco).
 * Tareas y metas: subtareas, sugerencia con IA (hasta 5), marcar completadas.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  InteractionManager,
  AccessibilityInfo,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { api, ENDPOINTS } from '../../config/api';
import { getApiErrorMessage } from '../../utils/apiErrorHandler';
import { colors } from '../../styles/globalStyles';
import {
  FOCUS_BORDER_SUBTLE,
  FOCUS_CHEVRON_MUTED,
  FOCUS_ICON_WRAP,
  FOCUS_INNER_ROW,
  FOCUS_KICKER_SOFT,
  FOCUS_META,
  FOCUS_META_SOFT,
} from '../../styles/focusCardTheme';

function taskPayloadFromApi(body) {
  if (!body || typeof body !== 'object') return null;
  if (body.data && typeof body.data === 'object' && body.data._id) return body.data;
  if (body._id) return body;
  return null;
}

const TaskDetailModal = ({
  visible,
  item,
  onClose,
  onToggleComplete,
  onDelete,
  onTaskUpdated,
  isOffline = false,
}) => {
  const scrollRef = useRef(null);
  const scrollHintTimeouts = useRef([]);
  const [generatingSubtasks, setGeneratingSubtasks] = useState(false);
  const [subtaskBusyIndex, setSubtaskBusyIndex] = useState(null);

  const handleClose = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!visible || !item) {
      scrollHintTimeouts.current.forEach(clearTimeout);
      scrollHintTimeouts.current = [];
      return undefined;
    }
    const clearAll = () => {
      scrollHintTimeouts.current.forEach(clearTimeout);
      scrollHintTimeouts.current = [];
    };
    const interaction = InteractionManager.runAfterInteractions(() => {
      const tOpen = setTimeout(() => {
        AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
          if (reduce) return;
          scrollRef.current?.scrollTo({ y: 18, animated: true });
          const tBack = setTimeout(() => {
            scrollRef.current?.scrollTo({ y: 0, animated: true });
          }, 340);
          scrollHintTimeouts.current.push(tBack);
        });
      }, 420);
      scrollHintTimeouts.current.push(tOpen);
    });
    return () => {
      interaction.cancel?.();
      clearAll();
    };
  }, [visible, item?._id]);

  useEffect(() => {
    if (!visible) {
      setGeneratingSubtasks(false);
      setSubtaskBusyIndex(null);
    }
  }, [visible]);

  const handleGenerateSubtasks = useCallback(async () => {
    if (!item?._id || generatingSubtasks) return;
    setGeneratingSubtasks(true);
    try {
      const body = await api.post(ENDPOINTS.TASK_SUBTASKS_GENERATE(item._id), {});
      const next = taskPayloadFromApi(body);
      if (next) onTaskUpdated?.(next);
      const added = typeof body?.addedCount === 'number' ? body.addedCount : 0;
      if (added > 0) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (e) {
      Alert.alert(
        'No se pudieron generar subtareas',
        getApiErrorMessage(e, { isOffline }) || 'Intenta de nuevo más tarde.'
      );
    } finally {
      setGeneratingSubtasks(false);
    }
  }, [item?._id, generatingSubtasks, onTaskUpdated, isOffline]);

  const handleToggleSubtask = useCallback(
    async (index) => {
      if (subtaskBusyIndex !== null || !item?._id) return;
      const subtasks = item.subtasks || [];
      const st = subtasks[index];
      if (!st) return;
      setSubtaskBusyIndex(index);
      try {
        let body;
        if (!st.completed) {
          body = await api.patch(
            `${ENDPOINTS.TASK_BY_ID(item._id)}/subtasks/${index}/complete`,
            {}
          );
        } else {
          const nextSubtasks = subtasks.map((s, i) =>
            i === index
              ? { title: s.title, completed: false, completedAt: null }
              : {
                  title: s.title,
                  completed: !!s.completed,
                  completedAt: s.completedAt ?? undefined,
                }
          );
          body = await api.put(ENDPOINTS.TASK_BY_ID(item._id), { subtasks: nextSubtasks });
        }
        const next = taskPayloadFromApi(body);
        if (next) onTaskUpdated?.(next);
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (e) {
        Alert.alert(
          'Subtarea',
          getApiErrorMessage(e, { isOffline }) || 'No se pudo actualizar.'
        );
      } finally {
        setSubtaskBusyIndex(null);
      }
    },
    [item, subtaskBusyIndex, onTaskUpdated, isOffline]
  );

  if (!item) return null;

  const isTask = item.itemType === 'task';
  const isGoal = item.itemType === 'goal';
  const canUseSubtasks = isTask || isGoal;
  const subtasks = Array.isArray(item.subtasks) ? item.subtasks : [];
  const taskDone = item.completed === true || item.status === 'completed';
  const isOverdue = new Date(item.dueDate) < new Date() && !taskDone;

  const formatDate = (d) =>
    new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  const formatTime = (d) =>
    new Date(d).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: true });

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={styles.wrap}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={handleClose} />
        <View style={styles.sheet}>
          <View style={styles.grabber} />
          <View style={styles.header}>
            <Text style={styles.kicker}>
              {isTask ? 'Tarea' : isGoal ? 'Meta' : 'Recordatorio'}
            </Text>
            <TouchableOpacity style={styles.closeBtn} onPress={handleClose} hitSlop={12}>
              <Ionicons name="close" size={22} color={FOCUS_CHEVRON_MUTED} />
            </TouchableOpacity>
          </View>

          <ScrollView
            ref={scrollRef}
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={Platform.OS === 'ios'}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.heroRow}>
              <View style={styles.iconWrap}>
                <Ionicons
                  name={isTask || isGoal ? 'checkbox-outline' : 'alarm-outline'}
                  size={20}
                  color={
                    isOverdue ? colors.error : isTask || isGoal ? colors.primary : colors.error
                  }
                />
              </View>
              <View style={styles.heroText}>
                <Text style={[styles.title, isOverdue && styles.titleOverdue]}>{item.title}</Text>
                {item.description ? (
                  <Text style={styles.description}>{item.description}</Text>
                ) : null}
              </View>
            </View>

            <View style={styles.metaBlock}>
              <Text style={styles.metaLabel}>Fecha</Text>
              <Text style={styles.metaValue}>{formatDate(item.dueDate)}</Text>
              <Text style={styles.metaLabel}>Hora</Text>
              <Text style={styles.metaValue}>{formatTime(item.dueDate)}</Text>
              {isOverdue ? (
                <View style={styles.overduePill}>
                  <Ionicons name="alert-circle" size={14} color={colors.error} />
                  <Text style={styles.overduePillText}>{isTask ? 'Caducada' : 'Pasado'}</Text>
                </View>
              ) : null}
            </View>

            {canUseSubtasks ? (
              <View style={styles.subtasksSection}>
                <Text style={styles.subtasksKicker}>Subtareas</Text>
                <Text style={styles.subtasksHint}>
                  Hasta cinco pasos sugeridos según el título y la descripción.
                </Text>
                <TouchableOpacity
                  style={[
                    styles.generateSubtasksBtn,
                    generatingSubtasks && styles.generateSubtasksBtnDisabled,
                  ]}
                  onPress={handleGenerateSubtasks}
                  disabled={generatingSubtasks || taskDone}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityLabel="Sugerir subtareas con inteligencia artificial"
                >
                  {generatingSubtasks ? (
                    <ActivityIndicator color={colors.background} size="small" />
                  ) : (
                    <Ionicons name="sparkles" size={18} color={colors.background} />
                  )}
                  <Text style={styles.generateSubtasksBtnText}>
                    {generatingSubtasks ? 'Generando…' : 'Sugerir pasos (IA)'}
                  </Text>
                </TouchableOpacity>
                {subtasks.length === 0 ? (
                  <Text style={styles.subtasksEmpty}>Aún no hay subtareas.</Text>
                ) : (
                  <View style={styles.subtasksList}>
                    {subtasks.map((st, idx) => {
                      const busy = subtaskBusyIndex === idx;
                      const done = !!st.completed;
                      return (
                        <TouchableOpacity
                          key={`subtask-row-${idx}`}
                          style={[styles.subtaskRow, done && styles.subtaskRowDone]}
                          onPress={() => handleToggleSubtask(idx)}
                          disabled={subtaskBusyIndex !== null || taskDone}
                          activeOpacity={0.75}
                          accessibilityRole="checkbox"
                          accessibilityState={{ checked: done, disabled: taskDone }}
                        >
                          {busy ? (
                            <ActivityIndicator size="small" color={colors.primary} />
                          ) : (
                            <Ionicons
                              name={done ? 'checkbox' : 'square-outline'}
                              size={22}
                              color={done ? colors.success : FOCUS_META}
                            />
                          )}
                          <Text
                            style={[styles.subtaskTitle, done && styles.subtaskTitleDone]}
                            numberOfLines={3}
                          >
                            {st.title}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>
            ) : null}
          </ScrollView>

          <View style={styles.actions}>
            {!taskDone ? (
              <TouchableOpacity
                style={styles.primaryCta}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  onToggleComplete(item._id);
                  onClose();
                }}
                activeOpacity={0.85}
              >
                <Ionicons name="checkmark-circle" size={20} color={colors.background} />
                <Text style={styles.primaryCtaText}>Marcar completada</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              style={styles.dangerBtn}
              onPress={() => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                onDelete(item._id);
                onClose();
              }}
              activeOpacity={0.85}
            >
              <Ionicons name="trash-outline" size={20} color={colors.error} />
              <Text style={styles.dangerText}>Eliminar</Text>
            </TouchableOpacity>
          </View>
          {Platform.OS === 'ios' ? <View style={styles.homeIndicatorSpacer} /> : null}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: FOCUS_BORDER_SUBTLE,
    maxHeight: '88%',
    paddingBottom: 8,
  },
  grabber: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginTop: 10,
    marginBottom: 6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  kicker: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: FOCUS_KICKER_SOFT,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  scroll: {
    maxHeight: 480,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 16,
  },
  heroRow: {
    ...FOCUS_INNER_ROW,
    alignItems: 'flex-start',
  },
  iconWrap: {
    ...FOCUS_ICON_WRAP,
    marginRight: 12,
  },
  heroText: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 17,
    fontWeight: '500',
    lineHeight: 24,
    letterSpacing: -0.2,
    color: 'rgba(255,255,255,0.94)',
  },
  titleOverdue: {
    color: colors.error,
  },
  description: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    color: FOCUS_META,
    fontWeight: '400',
  },
  metaBlock: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: FOCUS_BORDER_SUBTLE,
    gap: 6,
  },
  metaLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: FOCUS_KICKER_SOFT,
    marginTop: 4,
  },
  metaValue: {
    fontSize: 15,
    color: FOCUS_META_SOFT,
    marginBottom: 4,
  },
  overduePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 107, 107, 0.12)',
  },
  overduePillText: {
    color: colors.error,
    fontSize: 12,
    fontWeight: '600',
  },
  subtasksSection: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: FOCUS_BORDER_SUBTLE,
    gap: 10,
  },
  subtasksKicker: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: FOCUS_KICKER_SOFT,
  },
  subtasksHint: {
    fontSize: 12,
    color: FOCUS_META,
    lineHeight: 17,
  },
  generateSubtasksBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  generateSubtasksBtnDisabled: {
    opacity: 0.85,
  },
  generateSubtasksBtnText: {
    color: colors.background,
    fontSize: 14,
    fontWeight: '600',
  },
  subtasksEmpty: {
    fontSize: 13,
    color: FOCUS_META,
    fontStyle: 'italic',
  },
  subtasksList: {
    gap: 8,
  },
  subtaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: FOCUS_BORDER_SUBTLE,
  },
  subtaskRowDone: {
    opacity: 0.75,
  },
  subtaskTitle: {
    flex: 1,
    fontSize: 14,
    color: 'rgba(255,255,255,0.92)',
    lineHeight: 20,
  },
  subtaskTitleDone: {
    textDecorationLine: 'line-through',
    color: FOCUS_META,
  },
  actions: {
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 10,
  },
  primaryCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 999,
  },
  primaryCtaText: {
    color: colors.background,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  dangerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 107, 107, 0.28)',
    backgroundColor: 'rgba(255, 107, 107, 0.08)',
  },
  dangerText: {
    color: colors.error,
    fontSize: 15,
    fontWeight: '600',
  },
  homeIndicatorSpacer: {
    height: 8,
  },
});

export default TaskDetailModal;
