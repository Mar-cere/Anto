/**
 * Modal de detalle de tarea / recordatorio (hoja inferior, estilo alineado al foco).
 * Tareas y metas: subtareas, sugerencia con IA (hasta 5), marcar completadas.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { useTheme } from '../../context/ThemeContext';
import { getFocusTheme } from '../../styles/focusCardTheme';
import { SPACING } from '../../constants/ui';

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
  const { colors, resolvedScheme } = useTheme();
  const t = useMemo(() => getFocusTheme(colors, resolvedScheme), [colors, resolvedScheme]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
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
          borderColor: t.FOCUS_BORDER_SUBTLE,
          maxHeight: '92%',
          paddingBottom: 8,
        },
        grabber: {
          alignSelf: 'center',
          width: 36,
          height: 4,
          borderRadius: 2,
          backgroundColor: colors.glassFill,
          marginTop: 10,
          marginBottom: 6,
        },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
          paddingBottom: 12,
        },
        kicker: {
          fontSize: 11,
          fontWeight: '600',
          letterSpacing: 1.2,
          textTransform: 'uppercase',
          color: t.FOCUS_KICKER_SOFT,
        },
        closeBtn: {
          padding: 6,
          borderRadius: 12,
          backgroundColor: colors.glassFill,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: t.FOCUS_BORDER_SUBTLE,
        },
        scroll: {},
        scrollContent: {
          paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
          paddingBottom: 16,
          gap: 16,
        },
        heroRow: {
          ...t.FOCUS_INNER_ROW,
          alignItems: 'flex-start',
        },
        iconWrap: {
          ...t.FOCUS_ICON_WRAP,
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
          color: colors.text,
        },
        titleOverdue: {
          color: colors.error,
        },
        description: {
          marginTop: 8,
          fontSize: 14,
          lineHeight: 21,
          color: t.FOCUS_META,
          fontWeight: '400',
        },
        metaBlock: {
          paddingVertical: 12,
          paddingHorizontal: 14,
          borderRadius: 14,
          backgroundColor: colors.glassFill,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: t.FOCUS_BORDER_SUBTLE,
          gap: 6,
        },
        metaLabel: {
          fontSize: 11,
          fontWeight: '600',
          letterSpacing: 0.8,
          textTransform: 'uppercase',
          color: t.FOCUS_KICKER_SOFT,
          marginTop: 4,
        },
        metaValue: {
          fontSize: 15,
          color: t.FOCUS_META_SOFT,
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
          backgroundColor: colors.dangerSoft ?? 'rgba(255, 107, 107, 0.12)',
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
          backgroundColor: colors.glassFill,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: t.FOCUS_BORDER_SUBTLE,
          gap: 10,
        },
        subtasksKicker: {
          fontSize: 11,
          fontWeight: '600',
          letterSpacing: 0.8,
          textTransform: 'uppercase',
          color: t.FOCUS_KICKER_SOFT,
        },
        subtasksHint: {
          fontSize: 12,
          color: t.FOCUS_META,
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
          color: colors.textOnPrimary,
          fontSize: 14,
          fontWeight: '600',
        },
        subtasksEmpty: {
          fontSize: 13,
          color: t.FOCUS_META,
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
          backgroundColor: colors.chromeInput,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: t.FOCUS_BORDER_SUBTLE,
        },
        clearSubtasksBtn: {
          alignSelf: 'flex-start',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          paddingVertical: 8,
          paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
          borderRadius: 12,
          backgroundColor: colors.dangerSoft ?? 'rgba(255, 107, 107, 0.08)',
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.dangerBorder ?? 'rgba(255, 107, 107, 0.22)',
        },
        clearSubtasksBtnText: {
          fontSize: 13,
          fontWeight: '600',
          color: colors.error,
        },
        subtaskMainPress: {
          flex: 1,
          minWidth: 0,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
        },
        subtaskDeleteBtn: {
          padding: 6,
          borderRadius: 10,
          backgroundColor: colors.chromeInput,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: t.FOCUS_BORDER_SUBTLE,
        },
        subtaskRowDone: {
          opacity: 0.75,
        },
        subtaskTitle: {
          flex: 1,
          fontSize: 14,
          color: colors.text,
          lineHeight: 20,
        },
        subtaskTitleDone: {
          textDecorationLine: 'line-through',
          color: t.FOCUS_META,
        },
        actions: {
          paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
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
          color: colors.textOnPrimary,
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
          borderColor: colors.dangerBorder ?? 'rgba(255, 107, 107, 0.28)',
          backgroundColor: colors.dangerSoft ?? 'rgba(255, 107, 107, 0.08)',
        },
        dangerText: {
          color: colors.error,
          fontSize: 15,
          fontWeight: '600',
        },
        homeIndicatorSpacer: {
          height: 8,
        },
      }),
    [colors, t],
  );

  const scrollRef = useRef(null);
  const scrollHintTimeouts = useRef([]);
  const [generatingSubtasks, setGeneratingSubtasks] = useState(false);
  const [subtaskBusyIndex, setSubtaskBusyIndex] = useState(null);
  const generateSubtasksInFlightRef = useRef(false);

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
      generateSubtasksInFlightRef.current = false;
      setGeneratingSubtasks(false);
      setSubtaskBusyIndex(null);
    }
  }, [visible]);

  const handleGenerateSubtasks = useCallback(async () => {
    if (!item?._id || generateSubtasksInFlightRef.current) return;
    generateSubtasksInFlightRef.current = true;
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
      generateSubtasksInFlightRef.current = false;
      setGeneratingSubtasks(false);
    }
  }, [item?._id, onTaskUpdated, isOffline]);

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

  const handleDeleteSubtask = useCallback(
    async (index) => {
      if (subtaskBusyIndex !== null || !item?._id) return;
      const st = Array.isArray(item.subtasks) ? item.subtasks[index] : null;
      if (!st) return;
      Alert.alert('Eliminar subtarea', `¿Eliminar "${st.title}"?`, [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              setSubtaskBusyIndex(index);
              const body = await api.delete(`${ENDPOINTS.TASK_BY_ID(item._id)}/subtasks/${index}`);
              const next = taskPayloadFromApi(body);
              if (next) onTaskUpdated?.(next);
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (e) {
              Alert.alert(
                'Subtarea',
                getApiErrorMessage(e, { isOffline }) || 'No se pudo eliminar.'
              );
            } finally {
              setSubtaskBusyIndex(null);
            }
          }
        }
      ]);
    },
    [item, subtaskBusyIndex, onTaskUpdated, isOffline]
  );

  const handleClearSubtasks = useCallback(() => {
    if (subtaskBusyIndex !== null || !item?._id) return;
    if (!Array.isArray(item.subtasks) || item.subtasks.length === 0) return;
    Alert.alert(
      'Eliminar subtareas',
      'Esto eliminará todas las subtareas de esta tarea. Podrás agregar nuevas manualmente.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              setSubtaskBusyIndex(0);
              const body = await api.delete(`${ENDPOINTS.TASK_BY_ID(item._id)}/subtasks`);
              const next = taskPayloadFromApi(body);
              if (next) onTaskUpdated?.(next);
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (e) {
              Alert.alert(
                'Subtareas',
                getApiErrorMessage(e, { isOffline }) || 'No se pudieron eliminar.'
              );
            } finally {
              setSubtaskBusyIndex(null);
            }
          }
        }
      ]
    );
  }, [item, subtaskBusyIndex, onTaskUpdated, isOffline]);

  if (!item) return null;

  const isTask = item.itemType === 'task';
  const isGoal = item.itemType === 'goal';
  const canUseSubtasks = isTask || isGoal;
  const subtasks = Array.isArray(item.subtasks) ? item.subtasks : [];
  const taskDone = item.completed === true || item.status === 'completed';
  const isOverdue = new Date(item.dueDate) < new Date() && !taskDone;
  const canGenerateSubtasks = canUseSubtasks && subtasks.length === 0;

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
              <Ionicons name="close" size={22} color={t.FOCUS_CHEVRON_MUTED} />
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
                {canGenerateSubtasks ? (
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
                ) : null}
                {subtasks.length === 0 ? (
                  <Text style={styles.subtasksEmpty}>Aún no hay subtareas.</Text>
                ) : (
                  <View style={styles.subtasksList}>
                    {subtasks.map((st, idx) => {
                      const busy = subtaskBusyIndex === idx;
                      const done = !!st.completed;
                      return (
                        <View
                          key={`subtask-row-${idx}`}
                          style={[styles.subtaskRow, done && styles.subtaskRowDone]}
                        >
                          <TouchableOpacity
                            style={styles.subtaskMainPress}
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
                                color={done ? colors.success : t.FOCUS_META}
                              />
                            )}
                            <Text
                              style={[styles.subtaskTitle, done && styles.subtaskTitleDone]}
                              numberOfLines={3}
                            >
                              {st.title}
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.subtaskDeleteBtn}
                            onPress={() => handleDeleteSubtask(idx)}
                            disabled={taskDone || subtaskBusyIndex !== null}
                            accessibilityRole="button"
                            accessibilityLabel={`Eliminar subtarea: ${st.title}`}
                            hitSlop={10}
                          >
                            <Ionicons name="close" size={18} color={t.FOCUS_META} />
                          </TouchableOpacity>
                        </View>
                      );
                    })}
                    <TouchableOpacity
                      style={styles.clearSubtasksBtn}
                      onPress={handleClearSubtasks}
                      activeOpacity={0.85}
                      accessibilityRole="button"
                      accessibilityLabel="Eliminar todas las subtareas"
                      disabled={taskDone || subtaskBusyIndex !== null}
                    >
                      <Ionicons name="trash-outline" size={16} color={colors.error} />
                      <Text style={styles.clearSubtasksBtnText}>
                        {`Eliminar todas (${subtasks.length})`}
                      </Text>
                    </TouchableOpacity>
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

/* const styles = StyleSheet.create({
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
    borderColor: t.FOCUS_BORDER_SUBTLE,
    maxHeight: '92%',
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
    paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
    paddingBottom: 12,
  },
  kicker: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: t.FOCUS_KICKER_SOFT,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  scroll: {},
  scrollContent: {
    paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
    paddingBottom: 16,
    gap: 16,
  },
  heroRow: {
    ...t.FOCUS_INNER_ROW,
    alignItems: 'flex-start',
  },
  iconWrap: {
    ...t.FOCUS_ICON_WRAP,
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
    color: t.FOCUS_META,
    fontWeight: '400',
  },
  metaBlock: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: t.FOCUS_BORDER_SUBTLE,
    gap: 6,
  },
  metaLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: t.FOCUS_KICKER_SOFT,
    marginTop: 4,
  },
  metaValue: {
    fontSize: 15,
    color: t.FOCUS_META_SOFT,
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
    borderColor: t.FOCUS_BORDER_SUBTLE,
    gap: 10,
  },
  subtasksKicker: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: t.FOCUS_KICKER_SOFT,
  },
  subtasksHint: {
    fontSize: 12,
    color: t.FOCUS_META,
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
    color: t.FOCUS_META,
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
    borderColor: t.FOCUS_BORDER_SUBTLE,
  },
  clearSubtasksBtn: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 107, 107, 0.08)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 107, 107, 0.22)',
  },
  clearSubtasksBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.error,
  },
  subtaskMainPress: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  subtaskDeleteBtn: {
    padding: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: t.FOCUS_BORDER_SUBTLE,
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
    color: t.FOCUS_META,
  },
  actions: {
    paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
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
}); */

export default TaskDetailModal;
