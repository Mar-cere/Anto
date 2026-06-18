import React, { useMemo, useState, useEffect, useCallback, memo } from 'react';
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { api, ENDPOINTS } from '../config/api';
import { isAuthError } from '../utils/apiErrorHandler';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useSectionTranslations } from '../hooks/useTranslations';
import { createDashboardStyles } from '../styles/dashboardTheme';
import DashboardGroupedRow from './dashboard/DashboardGroupedRow';
import DashboardSection from './dashboard/DashboardSection';

const MAX_VISIBLE_ITEMS = 5;

const DEFAULT_TEXTS_ES = {
  TASK_CARD_TITLE: 'Mis Pendientes',
  TYPE_TASK: 'Tarea',
  TYPE_REMINDER: 'Recordatorio',
  OVERDUE_TASK: 'Vencida',
  OVERDUE_REMINDER: 'Vencido',
  PRIORITY_HIGH_LABEL: 'Alta',
  PRIORITY_MEDIUM_LABEL: 'Media',
  PRIORITY_LOW_LABEL: 'Baja',
  PRIORITY_PREFIX: 'Prioridad',
  A11Y_OPEN_DETAILS_HINT: 'Doble toque para ver detalles',
  SESSION_EXPIRED: 'Sesión expirada',
  SESSION_EXPIRED_MESSAGE: 'Por favor, inicia sesión nuevamente',
  ERROR_LOAD_ITEMS: 'No se pudieron cargar los elementos',
  LOAD_ERROR_HINT: 'Revisa tu conexión e intenta de nuevo.',
  RETRY: 'Reintentar',
  EMPTY_TASK: 'No tienes tareas pendientes',
  ADD_TASK: 'Agregar tarea',
};

const DEFAULT_TEXTS_EN = {
  TASK_CARD_TITLE: 'My Pending Items',
  TYPE_TASK: 'Task',
  TYPE_REMINDER: 'Reminder',
  OVERDUE_TASK: 'Overdue',
  OVERDUE_REMINDER: 'Overdue',
  PRIORITY_HIGH_LABEL: 'High',
  PRIORITY_MEDIUM_LABEL: 'Medium',
  PRIORITY_LOW_LABEL: 'Low',
  PRIORITY_PREFIX: 'Priority',
  A11Y_OPEN_DETAILS_HINT: 'Double tap to view details',
  SESSION_EXPIRED: 'Session expired',
  SESSION_EXPIRED_MESSAGE: 'Please sign in again',
  ERROR_LOAD_ITEMS: 'Could not load items',
  LOAD_ERROR_HINT: 'Check your connection and try again.',
  RETRY: 'Retry',
  EMPTY_TASK: 'You have no pending tasks',
  ADD_TASK: 'Add task',
};

const TaskRow = memo(({ item, onPress, texts, language, colors, isLast }) => {
  const isTask = item.itemType === 'task';
  const isOverdue = new Date(item.dueDate) < new Date();
  const locale = language === 'en' ? 'en-US' : 'es-ES';
  const typeLabel = isTask ? texts.TYPE_TASK : texts.TYPE_REMINDER;
  const overdueLabel = isTask ? texts.OVERDUE_TASK : texts.OVERDUE_REMINDER;

  const priorityLabels = {
    high: texts.PRIORITY_HIGH_LABEL,
    medium: texts.PRIORITY_MEDIUM_LABEL,
    low: texts.PRIORITY_LOW_LABEL,
  };
  const priorityLabel = priorityLabels[item.priority] || priorityLabels.medium;

  const formattedDate = new Date(item.dueDate).toLocaleDateString(locale, {
    day: '2-digit',
    month: 'short',
  });
  const formattedTime = new Date(item.dueDate).toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
  });

  const metaParts = [
    isOverdue ? overdueLabel : typeLabel,
    `${formattedDate} · ${formattedTime}`,
  ];
  if (isTask && !isOverdue) {
    metaParts.push(`${texts.PRIORITY_PREFIX} ${priorityLabel}`);
  }

  const iconName = isTask ? 'checkbox-blank-outline' : 'clock-outline';
  const iconColor = isOverdue ? colors.error : colors.primary;

  return (
    <DashboardGroupedRow
      iconNode={(
        <MaterialCommunityIcons
          name={iconName}
          size={22}
          color={iconColor}
        />
      )}
      title={item.title}
      subtitle={metaParts.join(' · ')}
      onPress={onPress}
      isLast={isLast}
      titleStyle={isOverdue ? { color: colors.error, textDecorationLine: 'line-through' } : undefined}
      accessibilityLabel={`${typeLabel}: ${item.title}. ${metaParts.join('. ')}.`}
      accessibilityHint={texts.A11Y_OPEN_DETAILS_HINT}
    />
  );
});
TaskRow.displayName = 'TaskRow';

const TaskCard = memo(() => {
  const navigation = useNavigation();
  const { colors, resolvedScheme } = useTheme();
  const { language } = useLanguage();
  const { language } = useLanguage();
  const translated = useSectionTranslations('TASKS');
  const dashTexts = useSectionTranslations('DASH');
  const fallbackTexts = language === 'en' ? DEFAULT_TEXTS_EN : DEFAULT_TEXTS_ES;
  const styles = useMemo(
    () => createDashboardStyles(colors, resolvedScheme),
    [colors, resolvedScheme],
  );
  const listStyles = useMemo(
    () =>
      StyleSheet.create({
        errorText: {
          color: colors.error,
          fontSize: 15,
          textAlign: 'center',
          lineHeight: 22,
          marginBottom: 12,
        },
        retryButton: {
          paddingVertical: 9,
          paddingHorizontal: 16,
          borderRadius: 999,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.dangerBorder ?? colors.error,
          backgroundColor: colors.dangerSoft ?? 'rgba(255, 107, 107, 0.1)',
        },
        retryButtonText: {
          color: colors.error,
          fontSize: 14,
          fontWeight: '600',
        },
        emptyText: {
          fontSize: 15,
          lineHeight: 22,
          color: colors.textSecondary,
          textAlign: 'center',
          marginBottom: 12,
        },
        addButton: {
          alignSelf: 'center',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          paddingVertical: 9,
          paddingHorizontal: 14,
          borderRadius: 999,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.accentLine,
          backgroundColor: colors.accentLineSoft,
        },
        addButtonText: {
          color: colors.primary,
          fontSize: 14,
          fontWeight: '600',
        },
      }),
    [colors],
  );

  const TEXTS = useMemo(() => ({ ...fallbackTexts, ...(translated || {}) }), [fallbackTexts, translated]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const loadItems = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const response = await api.get(ENDPOINTS.TASKS_PENDING);
      const itemsArray = response.data || [];
      const sortedItems = itemsArray.sort((a, b) => {
        if (a.itemType !== b.itemType) {
          return a.itemType === 'reminder' ? -1 : 1;
        }
        return new Date(a.dueDate) - new Date(b.dueDate);
      });

      setItems(sortedItems);
    } catch (err) {
      console.error('Error cargando tareas:', err);
      setError(TEXTS.ERROR_LOAD_ITEMS);
      if (isAuthError(err)) {
        Alert.alert(TEXTS.SESSION_EXPIRED, TEXTS.SESSION_EXPIRED_MESSAGE);
        await AsyncStorage.removeItem('userToken');
        navigation.reset({
          index: 0,
          routes: [{ name: 'SignIn' }],
        });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [TEXTS, navigation]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const handleItemPress = useCallback(
    (item) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      navigation.navigate('Tasks', {
        screen: 'TaskDetails',
        params: {
          taskId: item._id,
          task: item,
          mode: 'view',
          itemType: item.itemType,
        },
      });
    },
    [navigation],
  );

  const visibleItems = items.slice(0, MAX_VISIBLE_ITEMS);

  const renderBody = () => {
    if (loading && !refreshing) {
      return (
        <View style={[styles.surfaceCard, styles.inlineState]}>
          <ActivityIndicator color={colors.primary} />
        </View>
      );
    }

    if (error && !refreshing) {
      return (
        <View style={[styles.surfaceCard, styles.inlineState]}>
          <Text style={listStyles.errorText}>{`${TEXTS.ERROR_LOAD_ITEMS}. ${TEXTS.LOAD_ERROR_HINT}`}</Text>
          <Pressable
            style={({ pressed }) => [listStyles.retryButton, pressed && { opacity: 0.88 }]}
            onPress={() => loadItems()}
            accessibilityRole="button"
            accessibilityLabel={TEXTS.RETRY}
          >
            <Text style={listStyles.retryButtonText}>{TEXTS.RETRY}</Text>
          </Pressable>
        </View>
      );
    }

    if (items.length === 0) {
      return (
        <View style={[styles.surfaceCard, styles.inlineState]}>
          <Text style={listStyles.emptyText}>{TEXTS.EMPTY_TASK}</Text>
          <Pressable
            style={({ pressed }) => [listStyles.addButton, pressed && { opacity: 0.88 }]}
            onPress={() => navigation.navigate('Tasks', { mode: 'create', openModal: true })}
            accessibilityRole="button"
            accessibilityLabel={TEXTS.ADD_TASK}
          >
            <MaterialCommunityIcons name="plus" size={16} color={colors.primary} />
            <Text style={listStyles.addButtonText}>{TEXTS.ADD_TASK}</Text>
          </Pressable>
        </View>
      );
    }

    return (
      <View style={styles.groupedList}>
        {visibleItems.map((item, index) => (
          <TaskRow
            key={item._id}
            item={item}
            onPress={() => handleItemPress(item)}
            texts={TEXTS}
            language={language}
            colors={colors}
            isLast={index === visibleItems.length - 1}
          />
        ))}
      </View>
    );
  };

  return (
    <DashboardSection
      title={TEXTS.TASK_CARD_TITLE}
      viewAllLabel={dashTexts.VIEW_ALL || (language === 'en' ? 'View all' : 'Ver todos')}
      onViewAll={() => navigation.navigate('Tasks', { mode: 'list' })}
    >
      {renderBody()}
    </DashboardSection>
  );
});
TaskCard.displayName = 'TaskCard';

export default TaskCard;
