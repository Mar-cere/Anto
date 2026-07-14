/**
 * Pantalla de sesiones programadas (#15).
 * Permite al usuario configurar recordatorios semanales para sesiones con Anto.
 */
import React, { useState, useEffect, useCallback } from 'react';
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
import Header from '../../components/common/Header';
import { useTheme } from '../../contexts/ThemeContext';
import { useToast } from '../../contexts/ToastContext';
import { useTranslation } from '../../contexts/LanguageContext';
import {
  fetchScheduledSessions,
  deleteScheduledSession,
  updateScheduledSession,
} from '../../services/scheduledSessionsService';

/**
 * Pantalla principal de sesiones programadas.
 * Muestra lista agrupada por día de la semana con acciones inline.
 */
export default function ScheduledSessionsScreen({ navigation }) {
  const { colors, typography, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const { t } = useTranslation();

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const copy = t('SCHEDULED_SESSIONS');

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchScheduledSessions();
      
      // Validar que data sea array
      if (!Array.isArray(data)) {
        console.warn('[ScheduledSessionsScreen] API returned non-array:', data);
        setSessions([]);
        return;
      }

      // Ordenar por día de la semana y luego por hora
      const sorted = data.sort((a, b) => {
        if (a.dayOfWeek !== b.dayOfWeek) {
          return a.dayOfWeek - b.dayOfWeek;
        }
        return a.time.localeCompare(b.time);
      });

      setSessions(sorted);
    } catch (err) {
      console.error('[ScheduledSessionsScreen] Error loading sessions:', err);
      setError(err.message || copy.ERROR_LOADING);
      showToast(copy.TOAST_ERROR, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSession = async (session) => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      const newIsActive = !session.isActive;
      await updateScheduledSession(session.id, { isActive: newIsActive });
      
      // Actualizar estado local
      setSessions((prev) =>
        prev.map((s) => (s.id === session.id ? { ...s, isActive: newIsActive } : s))
      );
      
      showToast(newIsActive ? copy.TOAST_TOGGLED_ON : copy.TOAST_TOGGLED_OFF, 'success');
    } catch (err) {
      console.error('[ScheduledSessionsScreen] Error toggling session:', err);
      showToast(copy.TOAST_ERROR, 'error');
    }
  };

  const handleDeleteSession = (session) => {
    Alert.alert(copy.DELETE_CONFIRM_TITLE, copy.DELETE_CONFIRM_MESSAGE, [
      {
        text: copy.DELETE_CANCEL,
        style: 'cancel',
      },
      {
        text: copy.DELETE_CONFIRM,
        style: 'destructive',
        onPress: async () => {
          try {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            await deleteScheduledSession(session.id, true); // Hard delete
            
            // Actualizar estado local
            setSessions((prev) => prev.filter((s) => s.id !== session.id));
            
            showToast(copy.TOAST_DELETED, 'success');
          } catch (err) {
            console.error('[ScheduledSessionsScreen] Error deleting session:', err);
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            showToast(copy.TOAST_ERROR, 'error');
          }
        },
      },
    ]);
  };

  const getDayName = (dayOfWeek) => {
    const days = [
      copy.DAY_SUNDAY,
      copy.DAY_MONDAY,
      copy.DAY_TUESDAY,
      copy.DAY_WEDNESDAY,
      copy.DAY_THURSDAY,
      copy.DAY_FRIDAY,
      copy.DAY_SATURDAY,
    ];
    return days[dayOfWeek] || '';
  };

  const renderSession = ({ item: session }) => {
    // Validar que session tenga los campos requeridos
    if (!session || !session.id || session.dayOfWeek === undefined || !session.time) {
      return null;
    }

    const dayName = getDayName(session.dayOfWeek);
    const isPaused = session.isPausedGlobally === true;

    return (
      <View
        style={[
          styles.sessionCard,
          {
            backgroundColor: colors.cardBackground,
            borderColor: colors.border,
          },
        ]}
      >
        <View style={styles.sessionHeader}>
          <View style={styles.sessionInfo}>
            <Text
              style={[
                styles.sessionDay,
                {
                  color: colors.textPrimary,
                  ...typography.bodyLarge,
                },
              ]}
            >
              {dayName}
            </Text>
            <Text
              style={[
                styles.sessionTime,
                {
                  color: colors.textSecondary,
                  ...typography.bodyMedium,
                },
              ]}
            >
              {session.time}
            </Text>
            {session.label ? (
              <Text
                style={[
                  styles.sessionLabel,
                  {
                    color: colors.textTertiary,
                    ...typography.bodySmall,
                  },
                ]}
              >
                {session.label}
              </Text>
            ) : null}
            {isPaused ? (
              <Text
                style={[
                  styles.pausedLabel,
                  {
                    color: colors.warning,
                    ...typography.caption,
                  },
                ]}
              >
                {copy.PAUSED_BANNER_TITLE}
              </Text>
            ) : null}
          </View>

          <View style={styles.sessionActions}>
            <TouchableOpacity
              onPress={() => handleToggleSession(session)}
              style={[
                styles.actionButton,
                {
                  backgroundColor: session.isActive ? colors.success : colors.disabled,
                },
              ]}
            >
              <Text
                style={[
                  styles.actionButtonText,
                  {
                    color: colors.buttonText,
                    ...typography.bodySmall,
                  },
                ]}
              >
                {session.isActive ? '✓' : '○'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleDeleteSession(session)}
              style={[
                styles.actionButton,
                {
                  backgroundColor: colors.error,
                },
              ]}
            >
              <Text
                style={[
                  styles.actionButtonText,
                  {
                    color: colors.buttonText,
                    ...typography.bodySmall,
                  },
                ]}
              >
                ✕
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={[styles.emptyContainer, { paddingTop: spacing.xl }]}>
      <Text
        style={[
          styles.emptyTitle,
          {
            color: colors.textPrimary,
            ...typography.headingMedium,
          },
        ]}
      >
        {copy.EMPTY_TITLE}
      </Text>
      <Text
        style={[
          styles.emptyMessage,
          {
            color: colors.textSecondary,
            ...typography.bodyMedium,
          },
        ]}
      >
        {copy.EMPTY_MESSAGE}
      </Text>
    </View>
  );

  const renderErrorState = () => (
    <View style={[styles.emptyContainer, { paddingTop: spacing.xl }]}>
      <Text
        style={[
          styles.emptyTitle,
          {
            color: colors.error,
            ...typography.headingMedium,
          },
        ]}
      >
        {copy.ERROR_LOADING}
      </Text>
      <TouchableOpacity
        onPress={loadSessions}
        style={[
          styles.retryButton,
          {
            backgroundColor: colors.primary,
          },
        ]}
      >
        <Text
          style={[
            styles.retryButtonText,
            {
              color: colors.buttonText,
              ...typography.button,
            },
          ]}
        >
          {copy.RETRY}
        </Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Header title={copy.SCREEN_TITLE} onBackPress={() => navigation.goBack()} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text
            style={[
              styles.loadingText,
              {
                color: colors.textSecondary,
                ...typography.bodyMedium,
              },
            ]}
          >
            {copy.LOADING}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title={copy.SCREEN_TITLE} onBackPress={() => navigation.goBack()} />
      
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
              paddingBottom: insets.bottom + spacing.md,
            },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
  },
  listContent: {
    padding: 16,
  },
  sessionCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  sessionInfo: {
    flex: 1,
  },
  sessionDay: {
    marginBottom: 4,
  },
  sessionTime: {
    marginBottom: 4,
  },
  sessionLabel: {
    marginTop: 4,
  },
  pausedLabel: {
    marginTop: 8,
  },
  sessionActions: {
    flexDirection: 'row',
    gap: 8,
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
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    padding: 24,
  },
  emptyTitle: {
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyMessage: {
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {},
});
