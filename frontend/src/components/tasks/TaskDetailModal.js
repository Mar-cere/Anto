/**
 * Modal de detalle de tarea / recordatorio (hoja inferior, estilo alineado al foco).
 */
import React, { useCallback, useEffect, useRef } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
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

const TaskDetailModal = ({ visible, item, onClose, onToggleComplete, onDelete }) => {
  const scrollRef = useRef(null);
  const scrollHintTimeouts = useRef([]);

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

  if (!item) return null;

  const isTask = item.itemType === 'task';
  const isOverdue = new Date(item.dueDate) < new Date() && !item.completed;

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
            <Text style={styles.kicker}>{isTask ? 'Tarea' : 'Recordatorio'}</Text>
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
                  name={isTask ? 'checkbox-outline' : 'alarm-outline'}
                  size={20}
                  color={isOverdue ? colors.error : isTask ? colors.primary : colors.error}
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
          </ScrollView>

          <View style={styles.actions}>
            {!item.completed ? (
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
    maxHeight: 360,
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
