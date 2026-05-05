import React, { useState, useEffect, useCallback, memo, useRef } from 'react';
import { 
  View, Text, TouchableOpacity, ActivityIndicator, Alert, Animated, StyleSheet, RefreshControl, ScrollView 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { commonStyles, cardColors, CardHeader, EmptyState } from './common/CardStyles';
import { FOCUS_CHEVRON_MUTED, FOCUS_KICKER_COLOR } from '../styles/focusCardTheme';
import * as Haptics from 'expo-haptics';
import { api, ENDPOINTS } from '../config/api';
import { getApiErrorMessage, isAuthError } from '../utils/apiErrorHandler';

const TaskItem = memo(({ item, onPress }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const isTask = item.itemType === 'task';
  const isOverdue = new Date(item.dueDate) < new Date();

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
      high: { color: cardColors.error, icon: 'alert-circle', label: 'Alta' },
      medium: { color: cardColors.warning, icon: 'alert', label: 'Media' },
      low: { color: cardColors.success, icon: 'check-circle', label: 'Baja' },
    };
    return priorities[priority] || priorities.medium;
  }, []);

  const priorityData = getPriorityData(item.priority);

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[
          styles.taskCard,
          {
            backgroundColor: isOverdue 
              ? 'rgba(255, 107, 107, 0.1)' 
              : isTask 
                ? 'rgba(255, 255, 255, 0.03)' 
                : 'rgba(255, 107, 107, 0.06)',
            borderColor: isOverdue 
              ? 'rgba(255, 107, 107, 0.28)' 
              : isTask 
                ? 'rgba(255, 255, 255, 0.1)' 
                : 'rgba(255, 107, 107, 0.15)',
          }
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`${isTask ? 'Tarea' : 'Recordatorio'}: ${item.title}. ${isOverdue ? 'Caducada.' : ''} ${new Date(item.dueDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}. Prioridad ${priorityData.label}.`}
        accessibilityHint="Doble toque para ver detalles"
      >
        <View style={styles.taskContent}>
          {/* Icono y tipo */}
          <View style={styles.taskHeader}>
            <View style={[
              styles.iconContainer,
              {
                backgroundColor: isOverdue 
                  ? 'rgba(255, 107, 107, 0.2)' 
                  : isTask 
                    ? 'rgba(26, 221, 219, 0.1)' 
                    : 'rgba(255, 107, 107, 0.15)'
              }
            ]}>
              <MaterialCommunityIcons 
                name={isTask ? 'checkbox-blank-outline' : 'clock-outline'} 
                size={20} 
                color={isOverdue ? cardColors.error : isTask ? cardColors.primary : cardColors.error} 
              />
            </View>
            <View style={styles.typeContainer}>
              <Text style={styles.typeText}>
                {isTask ? 'Tarea' : 'Recordatorio'}
              </Text>
              {isOverdue && (
                <View style={styles.overdueBadge}>
                  <Text style={styles.overdueText}>
                    {isTask ? 'Caducada' : 'Pasado'}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Título y prioridad */}
          <View style={styles.taskBody}>
            <Text style={[
              styles.title,
              isOverdue && styles.overdueTitle
            ]} numberOfLines={1}>
              {item.title}
            </Text>
            {isTask && !isOverdue && (
              <View style={[styles.priorityBadge, { backgroundColor: priorityData.color }]}>
                <MaterialCommunityIcons 
                  name={priorityData.icon} 
                  size={12} 
                  color="#FFFFFF" 
                />
                <Text style={styles.priorityText}>
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
                  color={isOverdue ? cardColors.error : FOCUS_KICKER_COLOR} 
                />
                <Text style={[
                  styles.dateText,
                  isOverdue && styles.overdueText
                ]}>
                  {new Date(item.dueDate).toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: 'short'
                  })}
                </Text>
              </View>
              <View style={styles.timeContainer}>
                <MaterialCommunityIcons 
                  name="clock-outline" 
                  size={12} 
                  color={isOverdue ? cardColors.error : FOCUS_KICKER_COLOR} 
                />
                <Text style={[
                  styles.timeText,
                  isOverdue && styles.overdueText
                ]}>
                  {new Date(item.dueDate).toLocaleTimeString('es-ES', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                  })}
                </Text>
              </View>
            </View>
            <MaterialCommunityIcons 
              name="chevron-right" 
              size={18} 
              color={FOCUS_CHEVRON_MUTED} 
            />
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

const TaskCard = memo(() => {
  const navigation = useNavigation();
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
      setError(getApiErrorMessage(error));
      if (isAuthError(error)) {
        Alert.alert('Sesión expirada', 'Por favor, inicia sesión nuevamente');
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
  }, [navigation]);

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
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle" size={40} color={cardColors.error} />
          <Text style={styles.errorText}>No se pudo cargar. Revisa tu conexión e intenta de nuevo.</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => loadItems()} accessibilityRole="button" accessibilityLabel="Reintentar">
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (items.length === 0) {
      return (
        <EmptyState 
          icon="clipboard-text-outline"
          message="No hay tareas pendientes"
          onAdd={() => navigation.navigate('Tasks', { mode: 'create', openModal: true })}
          addButtonText="Agregar tarea"
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
        <View style={styles.tasksContainer}>
          {items.map((item) => (
            <TaskItem
              key={item._id}
              item={item}
              onPress={() => handleItemPress(item)}
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
        title="Mis Pendientes"
        onViewAll={() => navigation.navigate('Tasks', { mode: 'list' })}
      />
      {renderContent()}
    </View>
  );
});

const styles = StyleSheet.create({
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
    color: FOCUS_KICKER_COLOR,
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
    color: '#FFFFFF',
    marginRight: 12,
  },
  overdueTitle: {
    color: cardColors.error,
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
    color: '#FFFFFF',
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
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  dateText: {
    color: 'rgba(255, 255, 255, 0.55)',
    fontSize: 13,
    lineHeight: 18,
  },
  timeText: {
    color: 'rgba(255, 255, 255, 0.55)',
    fontSize: 13,
    lineHeight: 18,
  },
  overdueBadge: {
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  overdueText: {
    color: cardColors.error,
    fontSize: 12,
    fontWeight: '500',
  },
  tasksContainer: {
    gap: 8,
  },
  errorContainer: {
    alignItems: 'center',
    padding: 24,
    gap: 12,
  },
  errorText: {
    color: cardColors.error,
    fontSize: 16,
    textAlign: 'center',
  },
  retryButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.2)',
  },
  retryButtonText: {
    color: cardColors.error,
    fontSize: 14,
    fontWeight: '500',
  },
});

export default TaskCard;
  