import React, { useMemo, useState, useEffect, useCallback, memo, useRef } from 'react';
import { 
  View, Text, TouchableOpacity, ActivityIndicator, Alert, Animated, StyleSheet, RefreshControl, ScrollView 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CardHeader, EmptyState, useCardStylesDynamic } from './common/CardStyles';
import * as Haptics from 'expo-haptics';
import { api, ENDPOINTS } from '../config/api';
import { isAuthError } from '../utils/apiErrorHandler';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useSectionTranslations } from '../hooks/useTranslations';
import { getFocusTheme } from '../styles/focusCardTheme';
import { SPACING } from '../constants/ui';

const DEFAULT_TASKS_TEXTS = {
  TASK_CARD_TITLE: 'Mis Pendientes',
  TYPE_TASK: 'Tarea',
  TYPE_REMINDER: 'Recordatorio',
  OVERDUE_TASK: 'Caducada',
  OVERDUE_REMINDER: 'Pasado',
  PRIORITY_HIGH_LABEL: 'Alta',
  PRIORITY_MEDIUM_LABEL: 'Media',
  PRIORITY_LOW_LABEL: 'Baja',
  PRIORITY_PREFIX: 'Prioridad',
  A11Y_OPEN_DETAILS_HINT: 'Doble toque para ver detalles',
  SESSION_EXPIRED: 'Sesion expirada',
  SESSION_EXPIRED_MESSAGE: 'Por favor, inicia sesion nuevamente',
  ERROR_LOAD_ITEMS: 'No se pudieron cargar los items',
  LOAD_ERROR_HINT: 'Revisa tu conexion e intenta de nuevo.',
  RETRY: 'Reintentar',
  EMPTY_TASK: 'No tienes tareas pendientes',
  ADD_TASK: 'Agregar tarea',
};

const TaskItem = memo(({ item, onPress, texts, language }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const isTask = item.itemType === 'task';
  const isOverdue = new Date(item.dueDate) < new Date();
  const locale = language === 'en' ? 'en-US' : 'es-ES';
  const { colors, resolvedScheme } = useTheme();
  const t = useMemo(() => getFocusTheme(colors, resolvedScheme), [colors, resolvedScheme]);

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  const getPriorityData = useCallback((priority) => {
    const priorities = {
      high: { color: colors.error, icon: 'alert-circle', label: texts.PRIORITY_HIGH_LABEL },
      medium: { color: colors.warning, icon: 'alert', label: texts.PRIORITY_MEDIUM_LABEL },
      low: { color: colors.success, icon: 'check-circle', label: texts.PRIORITY_LOW_LABEL },
    };
    return priorities[priority] || priorities.medium;
  }, [colors, texts]);

  const priorityData = getPriorityData(item.priority);
  const typeLabel = isTask ? texts.TYPE_TASK : texts.TYPE_REMINDER;
  const overdueLabel = isTask ? texts.OVERDUE_TASK : texts.OVERDUE_REMINDER;
  const formattedDate = new Date(item.dueDate).toLocaleDateString(locale, {
    day: '2-digit',
    month: 'short',
  });
  const formattedTime = new Date(item.dueDate).toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
  });

  const styles = useMemo(
    () =>
      StyleSheet.create({
        taskCard: {
          borderRadius: 14,
          paddingVertical: 12,
          paddingHorizontal: 12,
          marginBottom: 10,
          borderWidth: StyleSheet.hairlineWidth,
        },
        taskContent: {
          gap: 12,
        },
        taskHeader: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
        },
        iconContainer: {
          width: 40,
          height: 40,
          borderRadius: 12,
          justifyContent: 'center',
          alignItems: 'center',
        },
        typeContainer: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
        },
        typeText: {
          fontSize: 13,
          fontWeight: '500',
        },
        taskBody: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        },
        title: {
          flex: 1,
          fontSize: 15,
          fontWeight: '500',
          lineHeight: 20,
          marginRight: 12,
        },
        overdueTitle: {
          color: colors.error,
          textDecorationLine: 'line-through',
        },
        priorityBadge: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          paddingVertical: 4,
          paddingHorizontal: 8,
          borderRadius: 12,
        },
        priorityText: {
          fontSize: 12,
          fontWeight: '500',
        },
        taskFooter: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        },
        dateTimeContainer: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
        },
        dateContainer: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          backgroundColor: colors.glassFill,
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 10,
        },
        timeContainer: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          backgroundColor: colors.glassFill,
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 10,
        },
        dateText: {
          fontSize: 13,
          lineHeight: 18,
        },
        timeText: {
          fontSize: 13,
          lineHeight: 18,
        },
        overdueBadge: {
          backgroundColor: colors.dangerSoft ?? 'rgba(255, 107, 107, 0.2)',
          paddingVertical: 2,
          paddingHorizontal: 8,
          borderRadius: 8,
        },
        overdueText: {
          color: colors.error,
          fontSize: 12,
          fontWeight: '500',
        },
      }),
    [colors],
  );

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[
          styles.taskCard,
          {
            backgroundColor: isOverdue 
              ? (colors.dangerSoft ?? 'rgba(255, 107, 107, 0.1)') 
              : isTask 
                ? colors.glassFill 
                : (colors.dangerSoft ?? 'rgba(255, 107, 107, 0.06)'),
            borderColor: isOverdue 
              ? (colors.dangerBorder ?? 'rgba(255, 107, 107, 0.28)') 
              : isTask 
                ? t.FOCUS_BORDER_SUBTLE 
                : (colors.dangerBorder ?? 'rgba(255, 107, 107, 0.15)'),
          }
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`${typeLabel}: ${item.title}. ${isOverdue ? `${overdueLabel}. ` : ''}${formattedDate}. ${texts.PRIORITY_PREFIX} ${priorityData.label}.`}
        accessibilityHint={texts.A11Y_OPEN_DETAILS_HINT}
      >
        <View style={styles.taskContent}>
          {/* Icono y tipo */}
          <View style={styles.taskHeader}>
            <View style={[
              styles.iconContainer,
              {
                backgroundColor: isOverdue 
                  ? (colors.dangerSoft ?? 'rgba(255, 107, 107, 0.2)') 
                  : isTask 
                    ? colors.accentLineSoft 
                    : (colors.dangerSoft ?? 'rgba(255, 107, 107, 0.15)')
              }
            ]}>
              <MaterialCommunityIcons 
                name={isTask ? 'checkbox-blank-outline' : 'clock-outline'} 
                size={20} 
                color={isOverdue ? colors.error : isTask ? colors.primary : colors.error} 
              />
            </View>
            <View style={styles.typeContainer}>
            <Text style={[styles.typeText, { color: t.FOCUS_KICKER_COLOR }]}>
                {typeLabel}
              </Text>
              {isOverdue && (
                <View style={styles.overdueBadge}>
                  <Text style={styles.overdueText}>
                    {overdueLabel}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Título y prioridad */}
          <View style={styles.taskBody}>
            <Text
              style={[
                styles.title,
                { color: colors.text },
                isOverdue && styles.overdueTitle,
              ]}
              numberOfLines={1}
            >
              {item.title}
            </Text>
            {isTask && !isOverdue && (
              <View style={[styles.priorityBadge, { backgroundColor: priorityData.color }]}>
                <MaterialCommunityIcons 
                  name={priorityData.icon} 
                  size={12} 
                  color={colors.textOnPrimary} 
                />
                <Text style={[styles.priorityText, { color: colors.textOnPrimary }]}>
                  {priorityData.label}
                </Text>
              </View>
            )}
          </View>

          {/* Fecha y hora */}
          <View style={styles.taskFooter}>
            <View style={styles.dateTimeContainer}>
              <View style={styles.dateContainer}>
                <MaterialCommunityIcons 
                  name="calendar" 
                  size={12} 
                  color={isOverdue ? colors.error : t.FOCUS_KICKER_COLOR} 
                />
                <Text
                  style={[
                    styles.dateText,
                    { color: isOverdue ? colors.error : colors.textSecondary },
                    isOverdue && styles.overdueText,
                  ]}
                >
                  {formattedDate}
                </Text>
              </View>
              <View style={styles.timeContainer}>
                <MaterialCommunityIcons 
                  name="clock-outline" 
                  size={12} 
                  color={isOverdue ? colors.error : t.FOCUS_KICKER_COLOR} 
                />
                <Text
                  style={[
                    styles.timeText,
                    { color: isOverdue ? colors.error : colors.textSecondary },
                    isOverdue && styles.overdueText,
                  ]}
                >
                  {formattedTime}
                </Text>
              </View>
            </View>
            <MaterialCommunityIcons 
              name="chevron-right" 
              size={18} 
              color={t.FOCUS_CHEVRON_MUTED} 
            />
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});
TaskItem.displayName = 'TaskItem';

const TaskCard = memo(() => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { language } = useLanguage();
  const translated = useSectionTranslations('TASKS');
  const TEXTS = useMemo(() => ({ ...DEFAULT_TASKS_TEXTS, ...(translated || {}) }), [translated]);
  const { cardColors, commonStyles } = useCardStylesDynamic();
  const listStyles = useMemo(
    () =>
      StyleSheet.create({
        tasksContainer: {
          gap: 8,
        },
        errorContainer: {
          alignItems: 'center',
          padding: 12,
          gap: 12,
        },
        errorText: {
          color: colors.error,
          fontSize: 16,
          textAlign: 'center',
        },
        retryButton: {
          paddingVertical: 8,
          paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
          borderRadius: 8,
          backgroundColor: colors.dangerSoft ?? 'rgba(255, 107, 107, 0.1)',
          borderWidth: 1,
          borderColor: colors.dangerBorder ?? 'rgba(255, 107, 107, 0.2)',
        },
        retryButtonText: {
          color: colors.error,
          fontSize: 14,
          fontWeight: '500',
        },
      }),
    [colors],
  );
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Cargar tareas
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
      
      // Ordenar: recordatorios primero, luego por fecha
      const sortedItems = itemsArray.sort((a, b) => {
        if (a.itemType !== b.itemType) {
          return a.itemType === 'reminder' ? -1 : 1;
        }
        return new Date(a.dueDate) - new Date(b.dueDate);
      });
      
      setItems(sortedItems);
    } catch (error) {
      console.error('Error cargando tareas:', error);
      setError(TEXTS.ERROR_LOAD_ITEMS);
      if (isAuthError(error)) {
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
  }, [TEXTS.SESSION_EXPIRED, TEXTS.SESSION_EXPIRED_MESSAGE, TEXTS.ERROR_LOAD_ITEMS, navigation]);

  // Pull to refresh
  const onRefresh = useCallback(() => {
    loadItems(true);
  }, [loadItems]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const handleItemPress = useCallback((item) => {
    navigation.navigate('Tasks', { 
      screen: 'TaskDetails',
      params: {
        taskId: item._id,
        task: item,
        mode: 'view',
        itemType: item.itemType
      }
    });
  }, [navigation]);

  const renderContent = () => {
    if (loading) {
      return <ActivityIndicator color={cardColors.primary} style={commonStyles.loader} />;
    }

    if (error && !refreshing) {
      return (
        <View style={listStyles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle" size={40} color={cardColors.error} />
          <Text style={listStyles.errorText}>{`${TEXTS.ERROR_LOAD_ITEMS}. ${TEXTS.LOAD_ERROR_HINT}`}</Text>
          <TouchableOpacity style={listStyles.retryButton} onPress={() => loadItems()} accessibilityRole="button" accessibilityLabel={TEXTS.RETRY}>
            <Text style={listStyles.retryButtonText}>{TEXTS.RETRY}</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (items.length === 0) {
      return (
        <EmptyState 
          icon="clipboard-text-outline"
          message={TEXTS.EMPTY_TASK}
          onAdd={() => navigation.navigate('Tasks', { mode: 'create', openModal: true })}
          addButtonText={TEXTS.ADD_TASK}
          compact
          showIcon={false}
        />
      );
    }

    return (
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[cardColors.primary]}
            tintColor={cardColors.primary}
          />
        }
      >
        <View style={listStyles.tasksContainer}>
          {items.map((item) => (
            <TaskItem
              key={item._id}
              item={item}
              onPress={() => handleItemPress(item)}
              texts={TEXTS}
              language={language}
            />
          ))}
        </View>
      </ScrollView>
    );
  };

  return (
    <View style={commonStyles.cardContainer}>
      <CardHeader 
        icon="format-list-checks"
        title={TEXTS.TASK_CARD_TITLE}
        onViewAll={() => navigation.navigate('Tasks', { mode: 'list' })}
      />
      {renderContent()}
    </View>
  );
});
TaskCard.displayName = 'TaskCard';

export default TaskCard;
  