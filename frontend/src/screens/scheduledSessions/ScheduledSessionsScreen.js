/**
 * Pantalla de sesiones programadas (#15).
 * Permite al usuario configurar recordatorios semanales para sesiones con Anto.
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Header from '../../components/Header';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { useLanguage } from '../../context/LanguageContext';
import { useSectionTranslations } from '../../hooks/useTranslations';
import { SPACING } from '../../constants/ui';
import {
  fetchScheduledSessions,
  deleteScheduledSession,
  updateScheduledSession,
} from '../../services/scheduledSessionsService';
import {
  scheduleSessionNotification,
  cancelSessionNotification,
  rescheduleAllSessions,
} from '../../services/notificationScheduler';

/**
 * Pantalla principal de sesiones programadas.
 * Muestra lista agrupada por día de la semana con acciones inline.
 */
export default function ScheduledSessionsScreen({ navigation }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const { language } = useLanguage();
  const copy = useSectionTranslations('SCHEDULED_SESSIONS');

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const toast = useCallback(
    (message, type = 'default') => {
      if (!message) return;
      showToast({ message: String(message), type });
    },
    [showToast],
  );

  const loadSessions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchScheduledSessions();

      if (!Array.isArray(data)) {
        console.warn('[ScheduledSessionsScreen] API returned non-array:', data);
        setSessions([]);
        return;
      }

      const valid = data.filter(
        (s) => s && s.id && s.dayOfWeek !== undefined && s.time,
      );
      setSessions(valid);
    } catch (err) {
      console.error('[ScheduledSessionsScreen] Error loading sessions:', err);
      setError(err);
      toast(copy.TOAST_ERROR, 'error');
    } finally {
      setLoading(false);
    }
  }, [copy.TOAST_ERROR, toast]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const rescheduleNotifications = useCallback(async () => {
    try {
      const results = await rescheduleAllSessions(sessions, language);
      const failedCount = results.filter((r) => !r.success && !r.skipped).length;

      if (failedCount > 0) {
        console.warn(
          '[ScheduledSessionsScreen] Some notifications failed to schedule:',
          failedCount,
        );
      }
    } catch (err) {
      console.error('[ScheduledSessionsScreen] Error rescheduling notifications:', err);
    }
  }, [sessions, language]);

  useEffect(() => {
    if (sessions.length > 0 && !loading && !error) {
      void rescheduleNotifications();
    }
  }, [sessions, loading, error, rescheduleNotifications]);

  const handleToggleSession = async (session) => {
    if (!session || !session.id) {
      console.warn('[ScheduledSessionsScreen] Invalid session for toggle:', session);
      return;
    }

    try {
      const newIsActive = !session.isActive;
      await updateScheduledSession(session.id, { isActive: newIsActive });

      if (newIsActive) {
        await scheduleSessionNotification({ ...session, isActive: true }, language);
      } else {
        await cancelSessionNotification(session);
      }

      setSessions((prev) =>
        prev.map((s) => (s.id === session.id ? { ...s, isActive: newIsActive } : s)),
      );
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      toast(newIsActive ? copy.TOAST_TOGGLED_ON : copy.TOAST_TOGGLED_OFF, 'success');
    } catch (err) {
      console.error('[ScheduledSessionsScreen] Error toggling session:', err);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      toast(copy.TOAST_ERROR, 'error');
    }
  };

  const handleDeleteSession = (session) => {
    if (!session || !session.id) {
      console.warn('[ScheduledSessionsScreen] Invalid session for delete:', session);
      toast(copy.TOAST_ERROR, 'error');
      return;
    }

    Alert.alert(copy.DELETE_CONFIRM_TITLE, copy.DELETE_CONFIRM_MESSAGE, [
      { text: copy.DELETE_CANCEL, style: 'cancel' },
      {
        text: copy.DELETE_CONFIRM,
        style: 'destructive',
        onPress: async () => {
          try {
            await cancelSessionNotification(session);
            await deleteScheduledSession(session.id, true);
            setSessions((prev) => prev.filter((s) => s.id !== session.id));
            toast(copy.TOAST_DELETED, 'success');
          } catch (err) {
            console.error('[ScheduledSessionsScreen] Error deleting session:', err);
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            toast(copy.TOAST_ERROR, 'error');
          }
        },
      },
    ]);
  };

  const getDayName = (dayOfWeek) => {
    if (typeof dayOfWeek !== 'number' || isNaN(dayOfWeek) || !Number.isInteger(dayOfWeek)) {
      console.warn('[ScheduledSessionsScreen] Invalid dayOfWeek:', dayOfWeek);
      return '';
    }

    const days = [
      copy.DAY_SUNDAY,
      copy.DAY_MONDAY,
      copy.DAY_TUESDAY,
      copy.DAY_WEDNESDAY,
      copy.DAY_THURSDAY,
      copy.DAY_FRIDAY,
      copy.DAY_SATURDAY,
    ];

    if (dayOfWeek < 0 || dayOfWeek >= days.length) {
      console.warn('[ScheduledSessionsScreen] dayOfWeek out of range:', dayOfWeek);
      return '';
    }

    return days[dayOfWeek] || '';
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
        },
        loadingContainer: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
        },
        loadingText: {
          marginTop: 16,
          fontSize: 15,
          color: colors.textSecondary,
        },
        listContent: {
          padding: SPACING.SCREEN_EDGE_INSET,
        },
        sessionCard: {
          borderRadius: 12,
          padding: SPACING.HERO_INSET_COMPACT,
          marginBottom: 12,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
          backgroundColor: colors.chromeCard ?? colors.cardBackground,
        },
        sessionHeader: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        },
        sessionInfo: {
          flex: 1,
          marginRight: 8,
        },
        sessionDay: {
          marginBottom: 4,
          fontSize: 17,
          fontWeight: '700',
          color: colors.text,
        },
        sessionTime: {
          marginBottom: 4,
          fontSize: 15,
          color: colors.textSecondary,
        },
        sessionLabel: {
          marginTop: 4,
          fontSize: 13,
          color: colors.textMuted ?? colors.textSecondary,
        },
        pausedLabel: {
          marginTop: 8,
          fontSize: 12,
          fontWeight: '600',
          color: colors.warning,
        },
        sessionActions: {
          flexDirection: 'row',
          gap: SPACING.sm,
        },
        actionButton: {
          width: 36,
          height: 36,
          borderRadius: 18,
          justifyContent: 'center',
          alignItems: 'center',
        },
        actionButtonText: {
          fontSize: 18,
          color: colors.textOnPrimary ?? colors.white,
        },
        emptyContainer: {
          flex: 1,
          alignItems: 'center',
          paddingTop: SPACING.xl,
        },
        emptyTitle: {
          marginBottom: 12,
          textAlign: 'center',
          fontSize: 18,
          fontWeight: '700',
          color: colors.text,
        },
        emptyMessage: {
          textAlign: 'center',
          marginBottom: 24,
          fontSize: 15,
          lineHeight: 22,
          color: colors.textSecondary,
        },
        errorTitle: {
          marginBottom: 12,
          textAlign: 'center',
          fontSize: 18,
          fontWeight: '700',
          color: colors.error,
        },
        retryButton: {
          paddingHorizontal: SPACING.CHIP_INSET,
          paddingVertical: SPACING.CHIP_INSET_COMPACT,
          borderRadius: 8,
          backgroundColor: colors.primary,
        },
        retryButtonText: {
          fontSize: 15,
          fontWeight: '700',
          color: colors.textOnPrimary ?? colors.white,
        },
      }),
    [colors],
  );

  const renderSession = ({ item: session }) => {
    if (!session || !session.id || session.dayOfWeek === undefined || !session.time) {
      return null;
    }

    const dayName = getDayName(session.dayOfWeek);
    const isPaused = session.isPausedGlobally === true;
    const label =
      session.label && typeof session.label === 'string' ? session.label.trim() : null;

    return (
      <View style={styles.sessionCard}>
        <View style={styles.sessionHeader}>
          <View style={styles.sessionInfo}>
            <Text style={styles.sessionDay}>{dayName}</Text>
            <Text style={styles.sessionTime}>{session.time}</Text>
            {label ? (
              <Text style={styles.sessionLabel} numberOfLines={1} ellipsizeMode="tail">
                {label}
              </Text>
            ) : null}
            {isPaused ? <Text style={styles.pausedLabel}>{copy.PAUSED_BANNER_TITLE}</Text> : null}
          </View>

          <View style={styles.sessionActions}>
            <TouchableOpacity
              onPress={() => handleToggleSession(session)}
              style={[
                styles.actionButton,
                {
                  backgroundColor: session.isActive
                    ? colors.success
                    : colors.chromeInputDisabled ?? colors.border,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={
                session.isActive ? copy.SESSION_CARD_TOGGLE_OFF : copy.SESSION_CARD_TOGGLE_ON
              }
            >
              <Text style={styles.actionButtonText}>{session.isActive ? '✓' : '○'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleDeleteSession(session)}
              style={[styles.actionButton, { backgroundColor: colors.error }]}
              accessibilityRole="button"
              accessibilityLabel={copy.SESSION_CARD_DELETE}
            >
              <Text style={styles.actionButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>{copy.EMPTY_TITLE}</Text>
      <Text style={styles.emptyMessage}>{copy.EMPTY_MESSAGE}</Text>
    </View>
  );

  const renderErrorState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.errorTitle}>{copy.ERROR_LOADING}</Text>
      <TouchableOpacity onPress={loadSessions} style={styles.retryButton}>
        <Text style={styles.retryButtonText}>{copy.RETRY}</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Header title={copy.SCREEN_TITLE} showBackButton />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>{copy.LOADING}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title={copy.SCREEN_TITLE} showBackButton />

      {error ? (
        renderErrorState()
      ) : (
        <FlatList
          data={sessions}
          renderItem={renderSession}
          keyExtractor={(item, index) => (item && item.id) || `session-${index}`}
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={[
            styles.listContent,
            {
              paddingBottom: insets.bottom + SPACING.md,
              flexGrow: sessions.length === 0 ? 1 : undefined,
            },
          ]}
        />
      )}
    </View>
  );
}
