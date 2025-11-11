/**
 * Pantalla de Estadísticas
 * 
 * Muestra estadísticas visuales de tareas y hábitos del usuario, incluyendo
 * gráficos de línea, barras y circulares. Permite filtrar por período
 * (diario, semanal, mensual) y tipo de datos (tareas o hábitos).
 * 
 * @author AntoApp Team
 */

import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { BarChart, LineChart, PieChart } from 'react-native-chart-kit';
import { colors } from '../styles/globalStyles';

const { width } = Dimensions.get('window');

// Constantes de textos
const TEXTS = {
  TITLE: 'Estadísticas',
  LOADING: 'Cargando estadísticas...',
  ERROR: 'No pudimos cargar tus estadísticas. Por favor, intenta de nuevo.',
  RETRY: 'Reintentar',
  REFRESHING: 'Actualizando...',
  TASKS: 'Tareas',
  HABITS: 'Hábitos',
  DAILY: 'Diario',
  WEEKLY: 'Semanal',
  MONTHLY: 'Mensual',
  SUMMARY: 'Resumen',
  TOTAL: 'Total',
  AVERAGE: 'Promedio',
  MAX: 'Máximo',
  MIN: 'Mínimo',
  TASKS_COMPLETED: 'Tareas Completadas',
  HABITS_PROGRESS: 'Progreso de Hábitos',
  LAST_7_DAYS: ' (Últimos 7 días)',
  LAST_4_WEEKS: ' (Últimas 4 semanas)',
  LAST_6_MONTHS: ' (Últimos 6 meses)',
  TASKS_DISTRIBUTION: 'Distribución de Tareas',
  PROGRESS_BY_CATEGORY: 'Progreso por Categoría',
  ANALYSIS: 'Análisis',
  TREND: 'Tendencia',
  BEST_PERFORMANCE: 'Mejor desempeño',
  SUGGESTION: 'Sugerencia',
  TREND_TASKS: 'Has completado un 15% más de tareas que el período anterior.',
  TREND_HABITS: 'Tu progreso en hábitos ha mejorado un 8% respecto al período anterior.',
  SUGGESTION_TASKS: 'Intenta distribuir mejor tus tareas durante la semana para evitar sobrecarga.',
  SUGGESTION_HABITS: 'Mantén la consistencia en tus hábitos de salud para mejorar tu progreso general.',
};

// Constantes de tipos de datos y períodos
const DATA_TYPES = {
  TASKS: 'tasks',
  HABITS: 'habits',
};

const PERIODS = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
};

// Constantes de tiempo
const LOAD_DELAY = 1000; // ms

// Constantes de gráficos
const CHART_HEIGHT = 220;
const CHART_WIDTH_OFFSET = 40;
const CHART_BORDER_RADIUS = 16;
const CHART_DOT_RADIUS = 6;
const CHART_DOT_STROKE_WIDTH = 2;
const CHART_DECIMAL_PLACES = 1;
const PIE_CHART_PADDING_LEFT = 15;
const PIE_CHART_CENTER_X = 10;
const PIE_CHART_CENTER_Y = 0;

// Constantes de colores para gráficos
const CHART_COLORS = {
  TASK: (opacity = 1) => `rgba(255, 99, 132, ${opacity})`,
  HABIT: (opacity = 1) => `rgba(54, 162, 235, ${opacity})`,
  WHITE: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
  BACKGROUND_FROM: '#1D2B5F',
  BACKGROUND_TO: '#1D2B5F',
  STROKE: '#1D2B5F',
};

// Constantes de estilos
const STATUS_BAR_STYLE = 'light-content';
const BACK_BUTTON_SIZE = 40;
const BACK_BUTTON_BORDER_RADIUS = 20;
const HEADER_PADDING_HORIZONTAL = 20;
const HEADER_PADDING_VERTICAL = 15;
const SELECTOR_MARGIN_HORIZONTAL = 20;
const SELECTOR_MARGIN_TOP = 20;
const SELECTOR_MARGIN_BOTTOM = 10;
const SELECTOR_BORDER_RADIUS = 10;
const SELECTOR_PADDING = 5;
const BUTTON_PADDING_VERTICAL = 10;
const BUTTON_BORDER_RADIUS = 8;
const SCROLL_PADDING_HORIZONTAL = 20;
const ERROR_BORDER_LEFT_WIDTH = 4;
const ERROR_PADDING = 15;
const ERROR_MARGIN_BOTTOM = 20;
const ERROR_BUTTON_PADDING_HORIZONTAL = 15;
const ERROR_BUTTON_PADDING_VERTICAL = 8;
const ERROR_BUTTON_BORDER_RADIUS = 5;
const ERROR_BUTTON_MARGIN_LEFT = 10;
const CHART_CONTAINER_PADDING = 15;
const CHART_CONTAINER_MARGIN_BOTTOM = 20;
const CHART_CONTAINER_BORDER_RADIUS = 15;
const CHART_SHADOW_OFFSET_Y = 2;
const CHART_SHADOW_OPACITY = 0.1;
const CHART_SHADOW_RADIUS = 4;
const CHART_ELEVATION = 3;
const CHART_TITLE_MARGIN_BOTTOM = 15;
const SECTION_TITLE_MARGIN_BOTTOM = 15;
const SECTION_TITLE_PADDING_LEFT = 5;
const STAT_ITEM_WIDTH = '48%';
const STAT_ITEM_PADDING = 15;
const STAT_ITEM_MARGIN_BOTTOM = 10;
const STAT_ITEM_BORDER_RADIUS = 10;
const STAT_VALUE_MARGIN_BOTTOM = 5;
const ANALYSIS_ITEM_MARGIN_BOTTOM = 15;
const ANALYSIS_ICON_SIZE = 40;
const ANALYSIS_ICON_BORDER_RADIUS = 20;
const ANALYSIS_ICON_MARGIN_RIGHT = 15;
const ANALYSIS_TITLE_MARGIN_BOTTOM = 5;
const BOTTOM_SPACE_HEIGHT = 40;
const LOADING_INDICATOR_MARGIN_BOTTOM = 20;
const LOADING_TEXT_MARGIN_TOP = 20;

// Constantes de colores
const COLORS = {
  BACKGROUND: colors.background,
  PRIMARY: colors.primary,
  WHITE: colors.white,
  ACCENT: '#A3B8E8',
  ERROR: '#FF6347',
  ITEM_BACKGROUND: 'rgba(29, 43, 95, 0.8)',
  SELECTOR_BACKGROUND: 'rgba(29, 43, 95, 0.5)',
  ACTIVE_BUTTON_BACKGROUND: 'rgba(255, 255, 255, 0.15)',
  ERROR_BACKGROUND: 'rgba(255, 99, 71, 0.2)',
  ERROR_BUTTON_BACKGROUND: 'rgba(255, 255, 255, 0.2)',
  STAT_ITEM_BACKGROUND: 'rgba(255, 255, 255, 0.05)',
  ANALYSIS_ITEM_BACKGROUND: 'rgba(255, 255, 255, 0.05)',
  ANALYSIS_ICON_BACKGROUND: 'rgba(255, 255, 255, 0.1)',
  BACK_BUTTON_BACKGROUND: 'rgba(255, 255, 255, 0.1)',
  SHADOW: '#000',
  LEGEND_FONT: '#7F7F7F',
};

const StadisticsScreen = () => {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState(PERIODS.DAILY);
  const [activeDataType, setActiveDataType] = useState(DATA_TYPES.TASKS);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  
  // Datos de ejemplo para las gráficas
  const [taskStats, setTaskStats] = useState({
    daily: {
      labels: ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"],
      datasets: [
        {
          data: [3, 5, 2, 4, 6, 3, 4],
          color: (opacity = 1) => `rgba(255, 99, 132, ${opacity})`,
          strokeWidth: 2
        }
      ],
      legend: ["Tareas completadas"]
    },
    weekly: {
      labels: ["Sem 1", "Sem 2", "Sem 3", "Sem 4"],
      datasets: [
        {
          data: [12, 18, 15, 20],
          color: (opacity = 1) => `rgba(255, 99, 132, ${opacity})`,
          strokeWidth: 2
        }
      ],
      legend: ["Tareas completadas por semana"]
    },
    monthly: {
      labels: ["Ene", "Feb", "Mar", "Abr", "May", "Jun"],
      datasets: [
        {
          data: [45, 52, 38, 60, 55, 48],
          color: (opacity = 1) => `rgba(255, 99, 132, ${opacity})`,
          strokeWidth: 2
        }
      ],
      legend: ["Tareas completadas por mes"]
    }
  });
  
  const [habitStats, setHabitStats] = useState({
    daily: {
      labels: ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"],
      datasets: [
        {
          data: [0.7, 0.8, 0.5, 0.9, 0.6, 0.7, 0.8],
          color: (opacity = 1) => `rgba(54, 162, 235, ${opacity})`,
          strokeWidth: 2
        }
      ],
      legend: ["Progreso de hábitos"]
    },
    weekly: {
      labels: ["Sem 1", "Sem 2", "Sem 3", "Sem 4"],
      datasets: [
        {
          data: [0.65, 0.75, 0.8, 0.85],
          color: (opacity = 1) => `rgba(54, 162, 235, ${opacity})`,
          strokeWidth: 2
        }
      ],
      legend: ["Progreso promedio semanal"]
    },
    monthly: {
      labels: ["Ene", "Feb", "Mar", "Abr", "May", "Jun"],
      datasets: [
        {
          data: [0.6, 0.65, 0.7, 0.75, 0.8, 0.85],
          color: (opacity = 1) => `rgba(54, 162, 235, ${opacity})`,
          strokeWidth: 2
        }
      ],
      legend: ["Progreso promedio mensual"]
    }
  });
  
  const [pieData, setPieData] = useState([
    {
      name: "Completadas",
      population: 75,
      color: "rgba(54, 162, 235, 0.8)",
      legendFontColor: "#7F7F7F",
      legendFontSize: 15
    },
    {
      name: "Pendientes",
      population: 25,
      color: "rgba(255, 99, 132, 0.8)",
      legendFontColor: "#7F7F7F",
      legendFontSize: 15
    }
  ]);
  
  const [categoryData, setCategoryData] = useState([
    {
      name: "Trabajo",
      tasks: 12,
      color: "#FF6384",
      legendFontColor: "#7F7F7F",
      legendFontSize: 15
    },
    {
      name: "Salud",
      tasks: 8,
      color: "#36A2EB",
      legendFontColor: "#7F7F7F",
      legendFontSize: 15
    },
    {
      name: "Hogar",
      tasks: 6,
      color: "#FFCE56",
      legendFontColor: "#7F7F7F",
      legendFontSize: 15
    },
    {
      name: "Estudio",
      tasks: 4,
      color: "#4BC0C0",
      legendFontColor: "#7F7F7F",
      legendFontSize: 15
    }
  ]);
  
  // Configuración común para gráficos
  const chartConfig = {
    backgroundGradientFrom: CHART_COLORS.BACKGROUND_FROM,
    backgroundGradientTo: CHART_COLORS.BACKGROUND_TO,
    decimalPlaces: CHART_DECIMAL_PLACES,
    color: CHART_COLORS.WHITE,
    labelColor: CHART_COLORS.WHITE,
    style: {
      borderRadius: CHART_BORDER_RADIUS
    },
    propsForDots: {
      r: CHART_DOT_RADIUS.toString(),
      strokeWidth: CHART_DOT_STROKE_WIDTH.toString(),
      stroke: CHART_COLORS.STROKE
    }
  };
  
  // Cargar datos
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Simular carga de datos
      await new Promise(resolve => setTimeout(resolve, LOAD_DELAY));
      
      // Aquí cargarías datos reales de AsyncStorage o una API
      // Por ahora usamos datos de ejemplo
      
      // Generar datos aleatorios para simular cambios
      setTaskStats({
        daily: {
          ...taskStats.daily,
          datasets: [{
            ...taskStats.daily.datasets[0],
            data: Array(7).fill().map(() => Math.floor(Math.random() * 8) + 1)
          }]
        },
        weekly: {
          ...taskStats.weekly,
          datasets: [{
            ...taskStats.weekly.datasets[0],
            data: Array(4).fill().map(() => Math.floor(Math.random() * 15) + 10)
          }]
        },
        monthly: {
          ...taskStats.monthly,
          datasets: [{
            ...taskStats.monthly.datasets[0],
            data: Array(6).fill().map(() => Math.floor(Math.random() * 30) + 30)
          }]
        }
      });
      
      setHabitStats({
        daily: {
          ...habitStats.daily,
          datasets: [{
            ...habitStats.daily.datasets[0],
            data: Array(7).fill().map(() => parseFloat((Math.random() * 0.5 + 0.5).toFixed(1)))
          }]
        },
        weekly: {
          ...habitStats.weekly,
          datasets: [{
            ...habitStats.weekly.datasets[0],
            data: Array(4).fill().map(() => parseFloat((Math.random() * 0.3 + 0.6).toFixed(1)))
          }]
        },
        monthly: {
          ...habitStats.monthly,
          datasets: [{
            ...habitStats.monthly.datasets[0],
            data: Array(6).fill().map(() => parseFloat((Math.random() * 0.3 + 0.6).toFixed(1)))
          }]
        }
      });
      
      // Actualizar datos de gráfico circular
      const completedPercentage = Math.floor(Math.random() * 40) + 60;
      setPieData([
        {
          ...pieData[0],
          population: completedPercentage
        },
        {
          ...pieData[1],
          population: 100 - completedPercentage
        }
      ]);
      
    } catch (err) {
      console.error('Error cargando estadísticas:', err);
      setError(TEXTS.ERROR);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);
  
  // Cargar datos al inicio
  useEffect(() => {
    loadData();
  }, []);
  
  // Pull to refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    loadData();
  }, [loadData]);
  
  // Cambiar pestaña
  const handleTabChange = useCallback((tab) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveTab(tab);
  }, []);
  
  // Cambiar tipo de datos
  const handleDataTypeChange = useCallback((type) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveDataType(type);
  }, []);
  
  // Renderizar pantalla de carga
  if (loading && !refreshing) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <StatusBar barStyle={STATUS_BAR_STYLE} />
        <ActivityIndicator 
          size="large" 
          color={COLORS.ACCENT} 
          style={{ marginBottom: LOADING_INDICATOR_MARGIN_BOTTOM }} 
        />
        <Text style={styles.loadingText}>{TEXTS.LOADING}</Text>
      </View>
    );
  }
  
  // Obtener datos según la pestaña y tipo activos
  const getActiveData = useCallback(() => {
    if (activeDataType === DATA_TYPES.TASKS) {
      return taskStats[activeTab];
    } else {
      return habitStats[activeTab];
    }
  }, [activeDataType, activeTab, taskStats, habitStats]);
  
  // Renderizar gráfico según la pestaña activa
  const renderChart = useCallback(() => {
    const data = getActiveData();
    
    // Para datos diarios y semanales, usar gráfico de línea
    if (activeTab === PERIODS.DAILY || activeTab === PERIODS.WEEKLY) {
      return (
        <LineChart
          data={data}
          width={width - CHART_WIDTH_OFFSET}
          height={CHART_HEIGHT}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
        />
      );
    }
    // Para datos mensuales, usar gráfico de barras
    else if (activeTab === PERIODS.MONTHLY) {
      return (
        <BarChart
          data={data}
          width={width - CHART_WIDTH_OFFSET}
          height={CHART_HEIGHT}
          chartConfig={chartConfig}
          style={styles.chart}
          verticalLabelRotation={0}
        />
      );
    }
  }, [activeTab, getActiveData, chartConfig]);
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={STATUS_BAR_STYLE} />
      
      {/* Encabezado */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{TEXTS.TITLE}</Text>
        <View style={{ width: BACK_BUTTON_SIZE }} />
      </View>
      
      {/* Selector de tipo de datos */}
      <View style={styles.dataTypeSelector}>
        <TouchableOpacity
          style={[
            styles.dataTypeButton,
            activeDataType === DATA_TYPES.TASKS && styles.activeDataTypeButton
          ]}
          onPress={() => handleDataTypeChange(DATA_TYPES.TASKS)}
        >
          <Text style={[
            styles.dataTypeButtonText,
            activeDataType === DATA_TYPES.TASKS && styles.activeDataTypeButtonText
          ]}>{TEXTS.TASKS}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.dataTypeButton,
            activeDataType === DATA_TYPES.HABITS && styles.activeDataTypeButton
          ]}
          onPress={() => handleDataTypeChange(DATA_TYPES.HABITS)}
        >
          <Text style={[
            styles.dataTypeButtonText,
            activeDataType === DATA_TYPES.HABITS && styles.activeDataTypeButtonText
          ]}>{TEXTS.HABITS}</Text>
        </TouchableOpacity>
      </View>
      
      {/* Selector de período */}
      <View style={styles.tabSelector}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === PERIODS.DAILY && styles.activeTabButton]}
          onPress={() => handleTabChange(PERIODS.DAILY)}
        >
          <Text style={[styles.tabButtonText, activeTab === PERIODS.DAILY && styles.activeTabButtonText]}>{TEXTS.DAILY}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === PERIODS.WEEKLY && styles.activeTabButton]}
          onPress={() => handleTabChange(PERIODS.WEEKLY)}
        >
          <Text style={[styles.tabButtonText, activeTab === PERIODS.WEEKLY && styles.activeTabButtonText]}>{TEXTS.WEEKLY}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === PERIODS.MONTHLY && styles.activeTabButton]}
          onPress={() => handleTabChange(PERIODS.MONTHLY)}
        >
          <Text style={[styles.tabButtonText, activeTab === PERIODS.MONTHLY && styles.activeTabButtonText]}>{TEXTS.MONTHLY}</Text>
        </TouchableOpacity>
      </View>
      
      {/* Contenido principal */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.ACCENT]}
            tintColor={COLORS.ACCENT}
            title={TEXTS.REFRESHING}
            titleColor={COLORS.ACCENT}
          />
        }
      >
        {/* Mostrar error si existe */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>⚠️ {error}</Text>
            <TouchableOpacity style={styles.errorButton} onPress={loadData}>
              <Text style={styles.errorButtonText}>{TEXTS.RETRY}</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {/* Gráfico principal */}
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>
            {activeDataType === DATA_TYPES.TASKS ? TEXTS.TASKS_COMPLETED : TEXTS.HABITS_PROGRESS}
            {activeTab === PERIODS.DAILY ? TEXTS.LAST_7_DAYS : 
             activeTab === PERIODS.WEEKLY ? TEXTS.LAST_4_WEEKS : TEXTS.LAST_6_MONTHS}
          </Text>
          {renderChart()}
        </View>
        
        {/* Resumen de estadísticas */}
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>{TEXTS.SUMMARY}</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {activeDataType === DATA_TYPES.TASKS 
                  ? taskStats[activeTab].datasets[0].data.reduce((a, b) => a + b, 0)
                  : (habitStats[activeTab].datasets[0].data.reduce((a, b) => a + b, 0) / 
                     habitStats[activeTab].datasets[0].data.length).toFixed(2)
                }
              </Text>
              <Text style={styles.statLabel}>
                {activeDataType === DATA_TYPES.TASKS ? TEXTS.TOTAL : TEXTS.AVERAGE}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {activeDataType === DATA_TYPES.TASKS
                  ? Math.max(...taskStats[activeTab].datasets[0].data)
                  : Math.max(...habitStats[activeTab].datasets[0].data).toFixed(2)
                }
              </Text>
              <Text style={styles.statLabel}>{TEXTS.MAX}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {activeDataType === DATA_TYPES.TASKS
                  ? Math.min(...taskStats[activeTab].datasets[0].data)
                  : Math.min(...habitStats[activeTab].datasets[0].data).toFixed(2)
                }
              </Text>
              <Text style={styles.statLabel}>{TEXTS.MIN}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {activeDataType === DATA_TYPES.TASKS
                  ? (taskStats[activeTab].datasets[0].data.reduce((a, b) => a + b, 0) / 
                     taskStats[activeTab].datasets[0].data.length).toFixed(1)
                  : ((habitStats[activeTab].datasets[0].data.reduce((a, b) => a + b, 0) / 
                      habitStats[activeTab].datasets[0].data.length) * 100).toFixed(0) + '%'
                }
              </Text>
              <Text style={styles.statLabel}>{TEXTS.AVERAGE}</Text>
            </View>
          </View>
        </View>
        
        {/* Gráfico circular */}
        <View style={styles.chartContainer}>
          <Text style={styles.sectionTitle}>
            {activeDataType === DATA_TYPES.TASKS ? TEXTS.TASKS_DISTRIBUTION : TEXTS.PROGRESS_BY_CATEGORY}
          </Text>
          <PieChart
            data={activeDataType === DATA_TYPES.TASKS ? pieData : categoryData}
            width={width - CHART_WIDTH_OFFSET}
            height={CHART_HEIGHT}
            chartConfig={chartConfig}
            accessor={activeDataType === DATA_TYPES.TASKS ? "population" : "tasks"}
            backgroundColor="transparent"
            paddingLeft={PIE_CHART_PADDING_LEFT.toString()}
            center={[PIE_CHART_CENTER_X, PIE_CHART_CENTER_Y]}
            absolute
          />
        </View>
        
        {/* Tendencias y análisis */}
        <View style={styles.analysisContainer}>
          <Text style={styles.sectionTitle}>{TEXTS.ANALYSIS}</Text>
          
          <View style={styles.analysisItem}>
            <View style={styles.analysisIconContainer}>
              <Text style={styles.analysisIcon}>📈</Text>
            </View>
            <View style={styles.analysisTextContainer}>
              <Text style={styles.analysisTitle}>{TEXTS.TREND}</Text>
              <Text style={styles.analysisDescription}>
                {activeDataType === DATA_TYPES.TASKS ? TEXTS.TREND_TASKS : TEXTS.TREND_HABITS}
              </Text>
            </View>
          </View>
          
          <View style={styles.analysisItem}>
            <View style={styles.analysisIconContainer}>
              <Text style={styles.analysisIcon}>🏆</Text>
            </View>
            <View style={styles.analysisTextContainer}>
              <Text style={styles.analysisTitle}>{TEXTS.BEST_PERFORMANCE}</Text>
              <Text style={styles.analysisDescription}>
                {activeDataType === DATA_TYPES.TASKS
                  ? activeTab === PERIODS.DAILY ? 'Viernes' : activeTab === PERIODS.WEEKLY ? 'Semana 4' : 'Mayo'
                  : activeTab === PERIODS.DAILY ? 'Jueves' : activeTab === PERIODS.WEEKLY ? 'Semana 3' : 'Junio'}
              </Text>
            </View>
          </View>
          
          <View style={styles.analysisItem}>
            <View style={styles.analysisIconContainer}>
              <Text style={styles.analysisIcon}>💡</Text>
            </View>
            <View style={styles.analysisTextContainer}>
              <Text style={styles.analysisTitle}>{TEXTS.SUGGESTION}</Text>
              <Text style={styles.analysisDescription}>
                {activeDataType === DATA_TYPES.TASKS ? TEXTS.SUGGESTION_TASKS : TEXTS.SUGGESTION_HABITS}
              </Text>
            </View>
          </View>
        </View>
        
        {/* Espacio al final */}
        <View style={{ height: BOTTOM_SPACE_HEIGHT }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.ACCENT,
    fontSize: 18,
    fontWeight: '500',
    marginTop: LOADING_TEXT_MARGIN_TOP,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: HEADER_PADDING_HORIZONTAL,
    paddingVertical: HEADER_PADDING_VERTICAL,
    backgroundColor: COLORS.ITEM_BACKGROUND,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.WHITE,
  },
  backButton: {
    width: BACK_BUTTON_SIZE,
    height: BACK_BUTTON_SIZE,
    borderRadius: BACK_BUTTON_BORDER_RADIUS,
    backgroundColor: COLORS.BACK_BUTTON_BACKGROUND,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 24,
    color: COLORS.WHITE,
  },
  dataTypeSelector: {
    flexDirection: 'row',
    marginHorizontal: SELECTOR_MARGIN_HORIZONTAL,
    marginTop: SELECTOR_MARGIN_TOP,
    marginBottom: SELECTOR_MARGIN_BOTTOM,
    borderRadius: SELECTOR_BORDER_RADIUS,
    backgroundColor: COLORS.SELECTOR_BACKGROUND,
    padding: SELECTOR_PADDING,
  },
  dataTypeButton: {
    flex: 1,
    paddingVertical: BUTTON_PADDING_VERTICAL,
    alignItems: 'center',
    borderRadius: BUTTON_BORDER_RADIUS,
  },
  activeDataTypeButton: {
    backgroundColor: COLORS.ACTIVE_BUTTON_BACKGROUND,
  },
  dataTypeButtonText: {
    color: COLORS.ACCENT,
    fontSize: 16,
    fontWeight: '500',
  },
  activeDataTypeButtonText: {
    color: COLORS.WHITE,
    fontWeight: 'bold',
  },
  tabSelector: {
    flexDirection: 'row',
    marginHorizontal: SELECTOR_MARGIN_HORIZONTAL,
    marginTop: SELECTOR_MARGIN_BOTTOM,
    marginBottom: SELECTOR_MARGIN_TOP,
    borderRadius: SELECTOR_BORDER_RADIUS,
    backgroundColor: COLORS.SELECTOR_BACKGROUND,
    padding: SELECTOR_PADDING,
  },
  tabButton: {
    flex: 1,
    paddingVertical: BUTTON_PADDING_VERTICAL,
    alignItems: 'center',
    borderRadius: BUTTON_BORDER_RADIUS,
  },
  activeTabButton: {
    backgroundColor: COLORS.ACTIVE_BUTTON_BACKGROUND,
  },
  tabButtonText: {
    color: COLORS.ACCENT,
    fontSize: 16,
    fontWeight: '500',
  },
  activeTabButtonText: {
    color: COLORS.WHITE,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingHorizontal: SCROLL_PADDING_HORIZONTAL,
  },
  errorContainer: {
    backgroundColor: COLORS.ERROR_BACKGROUND,
    borderRadius: SELECTOR_BORDER_RADIUS,
    padding: ERROR_PADDING,
    marginBottom: ERROR_MARGIN_BOTTOM,
    borderLeftWidth: ERROR_BORDER_LEFT_WIDTH,
    borderLeftColor: COLORS.ERROR,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorText: {
    color: COLORS.WHITE,
    fontSize: 16,
    flex: 1,
  },
  errorButton: {
    paddingHorizontal: ERROR_BUTTON_PADDING_HORIZONTAL,
    paddingVertical: ERROR_BUTTON_PADDING_VERTICAL,
    borderRadius: ERROR_BUTTON_BORDER_RADIUS,
    backgroundColor: COLORS.ERROR_BUTTON_BACKGROUND,
    marginLeft: ERROR_BUTTON_MARGIN_LEFT,
  },
  errorButtonText: {
    color: COLORS.WHITE,
    fontSize: 14,
  },
  chartContainer: {
    backgroundColor: COLORS.ITEM_BACKGROUND,
    borderRadius: CHART_CONTAINER_BORDER_RADIUS,
    padding: CHART_CONTAINER_PADDING,
    marginBottom: CHART_CONTAINER_MARGIN_BOTTOM,
    shadowColor: COLORS.SHADOW,
    shadowOffset: { width: 0, height: CHART_SHADOW_OFFSET_Y },
    shadowOpacity: CHART_SHADOW_OPACITY,
    shadowRadius: CHART_SHADOW_RADIUS,
    elevation: CHART_ELEVATION,
  },
  chartTitle: {
    color: COLORS.ACCENT,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: CHART_TITLE_MARGIN_BOTTOM,
    textAlign: 'center',
  },
  chart: {
    borderRadius: SELECTOR_BORDER_RADIUS,
    marginVertical: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.ACCENT,
    marginBottom: SECTION_TITLE_MARGIN_BOTTOM,
    paddingLeft: SECTION_TITLE_PADDING_LEFT,
  },
  statsContainer: {
    backgroundColor: COLORS.ITEM_BACKGROUND,
    borderRadius: CHART_CONTAINER_BORDER_RADIUS,
    padding: CHART_CONTAINER_PADDING,
    marginBottom: CHART_CONTAINER_MARGIN_BOTTOM,
    shadowColor: COLORS.SHADOW,
    shadowOffset: { width: 0, height: CHART_SHADOW_OFFSET_Y },
    shadowOpacity: CHART_SHADOW_OPACITY,
    shadowRadius: CHART_SHADOW_RADIUS,
    elevation: CHART_ELEVATION,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: STAT_ITEM_WIDTH,
    backgroundColor: COLORS.STAT_ITEM_BACKGROUND,
    borderRadius: STAT_ITEM_BORDER_RADIUS,
    padding: STAT_ITEM_PADDING,
    marginBottom: STAT_ITEM_MARGIN_BOTTOM,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.WHITE,
    marginBottom: STAT_VALUE_MARGIN_BOTTOM,
  },
  statLabel: {
    fontSize: 14,
    color: COLORS.ACCENT,
  },
  analysisContainer: {
    backgroundColor: COLORS.ITEM_BACKGROUND,
    borderRadius: CHART_CONTAINER_BORDER_RADIUS,
    padding: CHART_CONTAINER_PADDING,
    marginBottom: CHART_CONTAINER_MARGIN_BOTTOM,
    shadowColor: COLORS.SHADOW,
    shadowOffset: { width: 0, height: CHART_SHADOW_OFFSET_Y },
    shadowOpacity: CHART_SHADOW_OPACITY,
    shadowRadius: CHART_SHADOW_RADIUS,
    elevation: CHART_ELEVATION,
  },
  analysisItem: {
    flexDirection: 'row',
    marginBottom: ANALYSIS_ITEM_MARGIN_BOTTOM,
    backgroundColor: COLORS.ANALYSIS_ITEM_BACKGROUND,
    borderRadius: STAT_ITEM_BORDER_RADIUS,
    padding: STAT_ITEM_PADDING,
  },
  analysisIconContainer: {
    width: ANALYSIS_ICON_SIZE,
    height: ANALYSIS_ICON_SIZE,
    borderRadius: ANALYSIS_ICON_BORDER_RADIUS,
    backgroundColor: COLORS.ANALYSIS_ICON_BACKGROUND,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: ANALYSIS_ICON_MARGIN_RIGHT,
  },
  analysisIcon: {
    fontSize: 20,
  },
  analysisTextContainer: {
    flex: 1,
  },
  analysisTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.WHITE,
    marginBottom: ANALYSIS_TITLE_MARGIN_BOTTOM,
  },
  analysisDescription: {
    fontSize: 14,
    color: COLORS.ACCENT,
    lineHeight: 20,
  },
});

export default StadisticsScreen;
