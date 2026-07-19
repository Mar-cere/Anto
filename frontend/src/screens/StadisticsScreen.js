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
import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import { useTheme } from '../context/ThemeContext';
import { SPACING } from '../constants/ui';
import { useMappedSectionTexts } from '../hooks/useTranslations';

const { width } = Dimensions.get('window');

// Constantes de textos
const DEFAULT_TEXTS = {
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
  DAY_LABELS: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
  WEEK_LABELS: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'],
  MONTH_LABELS: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
  LEGEND_TASKS_DAILY: 'Tareas completadas',
  LEGEND_TASKS_WEEKLY: 'Tareas completadas por semana',
  LEGEND_TASKS_MONTHLY: 'Tareas completadas por mes',
  LEGEND_HABITS_DAILY: 'Progreso de hábitos',
  LEGEND_HABITS_WEEKLY: 'Progreso promedio semanal',
  LEGEND_HABITS_MONTHLY: 'Progreso promedio mensual',
  PIE_COMPLETED: 'Completadas',
  PIE_PENDING: 'Pendientes',
  CATEGORY_WORK: 'Trabajo',
  CATEGORY_HEALTH: 'Salud',
  CATEGORY_HOME: 'Hogar',
  CATEGORY_STUDY: 'Estudio',
  BEST_TASKS_DAILY: 'Viernes',
  BEST_TASKS_WEEKLY: 'Semana 4',
  BEST_TASKS_MONTHLY: 'Mayo',
  BEST_HABITS_DAILY: 'Jueves',
  BEST_HABITS_WEEKLY: 'Semana 3',
  BEST_HABITS_MONTHLY: 'Junio',
};

const STATS_SCREEN_TEXT_MAP = {
  TITLE: 'STATS_SCREEN_TITLE',
  LOADING: 'STATS_SCREEN_LOADING',
  ERROR: 'STATS_SCREEN_ERROR',
  RETRY: 'RETRY',
  REFRESHING: 'STATS_SCREEN_REFRESHING',
  TASKS: 'STATS_SCREEN_TASKS',
  HABITS: 'STATS_SCREEN_HABITS',
  DAILY: 'STATS_SCREEN_DAILY',
  WEEKLY: 'STATS_SCREEN_WEEKLY',
  MONTHLY: 'STATS_SCREEN_MONTHLY',
  SUMMARY: 'STATS_SCREEN_SUMMARY',
  TOTAL: 'STATS_SCREEN_TOTAL',
  AVERAGE: 'STATS_SCREEN_AVERAGE',
  MAX: 'STATS_SCREEN_MAX',
  MIN: 'STATS_SCREEN_MIN',
  TASKS_COMPLETED: 'STATS_SCREEN_TASKS_COMPLETED',
  HABITS_PROGRESS: 'STATS_SCREEN_HABITS_PROGRESS',
  LAST_7_DAYS: 'STATS_SCREEN_LAST_7_DAYS',
  LAST_4_WEEKS: 'STATS_SCREEN_LAST_4_WEEKS',
  LAST_6_MONTHS: 'STATS_SCREEN_LAST_6_MONTHS',
  TASKS_DISTRIBUTION: 'STATS_SCREEN_TASKS_DISTRIBUTION',
  PROGRESS_BY_CATEGORY: 'STATS_SCREEN_PROGRESS_BY_CATEGORY',
  ANALYSIS: 'STATS_SCREEN_ANALYSIS',
  TREND: 'STATS_SCREEN_TREND',
  BEST_PERFORMANCE: 'STATS_SCREEN_BEST_PERFORMANCE',
  SUGGESTION: 'STATS_SCREEN_SUGGESTION',
  TREND_TASKS: 'STATS_SCREEN_TREND_TASKS',
  TREND_HABITS: 'STATS_SCREEN_TREND_HABITS',
  SUGGESTION_TASKS: 'STATS_SCREEN_SUGGESTION_TASKS',
  SUGGESTION_HABITS: 'STATS_SCREEN_SUGGESTION_HABITS',
  DAY_LABELS: 'STATS_SCREEN_DAY_LABELS',
  WEEK_LABELS: 'STATS_SCREEN_WEEK_LABELS',
  MONTH_LABELS: 'STATS_SCREEN_MONTH_LABELS',
  LEGEND_TASKS_DAILY: 'STATS_SCREEN_LEGEND_TASKS_DAILY',
  LEGEND_TASKS_WEEKLY: 'STATS_SCREEN_LEGEND_TASKS_WEEKLY',
  LEGEND_TASKS_MONTHLY: 'STATS_SCREEN_LEGEND_TASKS_MONTHLY',
  LEGEND_HABITS_DAILY: 'STATS_SCREEN_LEGEND_HABITS_DAILY',
  LEGEND_HABITS_WEEKLY: 'STATS_SCREEN_LEGEND_HABITS_WEEKLY',
  LEGEND_HABITS_MONTHLY: 'STATS_SCREEN_LEGEND_HABITS_MONTHLY',
  PIE_COMPLETED: 'STATS_SCREEN_PIE_COMPLETED',
  PIE_PENDING: 'STATS_SCREEN_PIE_PENDING',
  CATEGORY_WORK: 'STATS_SCREEN_CATEGORY_WORK',
  CATEGORY_HEALTH: 'STATS_SCREEN_CATEGORY_HEALTH',
  CATEGORY_HOME: 'STATS_SCREEN_CATEGORY_HOME',
  CATEGORY_STUDY: 'STATS_SCREEN_CATEGORY_STUDY',
  BEST_TASKS_DAILY: 'STATS_SCREEN_BEST_TASKS_DAILY',
  BEST_TASKS_WEEKLY: 'STATS_SCREEN_BEST_TASKS_WEEKLY',
  BEST_TASKS_MONTHLY: 'STATS_SCREEN_BEST_TASKS_MONTHLY',
  BEST_HABITS_DAILY: 'STATS_SCREEN_BEST_HABITS_DAILY',
  BEST_HABITS_WEEKLY: 'STATS_SCREEN_BEST_HABITS_WEEKLY',
  BEST_HABITS_MONTHLY: 'STATS_SCREEN_BEST_HABITS_MONTHLY',
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

function rgbaFromHex(hex, alpha = 1) {
  const h = String(hex).replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function buildInitialTaskStats(cc, texts) {
  return {
    daily: {
      labels: texts.DAY_LABELS,
      datasets: [
        {
          data: [3, 5, 2, 4, 6, 3, 4],
          color: cc.TASK,
          strokeWidth: 2,
        },
      ],
      legend: [texts.LEGEND_TASKS_DAILY],
    },
    weekly: {
      labels: texts.WEEK_LABELS,
      datasets: [
        {
          data: [12, 18, 15, 20],
          color: cc.TASK,
          strokeWidth: 2,
        },
      ],
      legend: [texts.LEGEND_TASKS_WEEKLY],
    },
    monthly: {
      labels: texts.MONTH_LABELS,
      datasets: [
        {
          data: [45, 52, 38, 60, 55, 48],
          color: cc.TASK,
          strokeWidth: 2,
        },
      ],
      legend: [texts.LEGEND_TASKS_MONTHLY],
    },
  };
}

function buildInitialHabitStats(cc, texts) {
  return {
    daily: {
      labels: texts.DAY_LABELS,
      datasets: [
        {
          data: [0.7, 0.8, 0.5, 0.9, 0.6, 0.7, 0.8],
          color: cc.HABIT,
          strokeWidth: 2,
        },
      ],
      legend: [texts.LEGEND_HABITS_DAILY],
    },
    weekly: {
      labels: texts.WEEK_LABELS,
      datasets: [
        {
          data: [0.65, 0.75, 0.8, 0.85],
          color: cc.HABIT,
          strokeWidth: 2,
        },
      ],
      legend: [texts.LEGEND_HABITS_WEEKLY],
    },
    monthly: {
      labels: texts.MONTH_LABELS,
      datasets: [
        {
          data: [0.6, 0.65, 0.7, 0.75, 0.8, 0.85],
          color: cc.HABIT,
          strokeWidth: 2,
        },
      ],
      legend: [texts.LEGEND_HABITS_MONTHLY],
    },
  };
}

function buildInitialPieData(texts) {
  return [
    { name: texts.PIE_COMPLETED, population: 75, legendFontSize: 15 },
    { name: texts.PIE_PENDING, population: 25, legendFontSize: 15 },
  ];
}

function buildInitialCategoryData(texts) {
  return [
    { name: texts.CATEGORY_WORK, tasks: 12, legendFontSize: 15 },
    { name: texts.CATEGORY_HEALTH, tasks: 8, legendFontSize: 15 },
    { name: texts.CATEGORY_HOME, tasks: 6, legendFontSize: 15 },
    { name: texts.CATEGORY_STUDY, tasks: 4, legendFontSize: 15 },
  ];
}

// Constantes de gráficos
const CHART_HEIGHT = 220;
const CHART_WIDTH_OFFSET = 40;
const CHART_BORDER_RADIUS = 16;
const CHART_DOT_RADIUS = 6;
const CHART_DOT_STROKE_WIDTH = 2;
const CHART_DECIMAL_PLACES = 1;
const PIE_CHART_PADDING_LEFT = SPACING.HERO_INSET_COMPACT;
const PIE_CHART_CENTER_X = 10;
const PIE_CHART_CENTER_Y = 0;

const BACK_BUTTON_SIZE = 40;
const BACK_BUTTON_BORDER_RADIUS = 20;
const HEADER_PADDING_HORIZONTAL = SPACING.SCREEN_EDGE_INSET;
const HEADER_PADDING_VERTICAL = SPACING.HERO_INSET_COMPACT;
const SELECTOR_MARGIN_HORIZONTAL = 20;
const SELECTOR_MARGIN_TOP = 20;
const SELECTOR_MARGIN_BOTTOM = 10;
const SELECTOR_BORDER_RADIUS = 10;
const SELECTOR_PADDING = SPACING.xs;
const BUTTON_PADDING_VERTICAL = SPACING.CHIP_INSET_COMPACT;
const BUTTON_BORDER_RADIUS = 8;
const SCROLL_PADDING_HORIZONTAL = SPACING.SCREEN_EDGE_INSET;
const ERROR_BORDER_LEFT_WIDTH = 4;
const ERROR_PADDING = SPACING.ERROR_PADDING;
const ERROR_MARGIN_BOTTOM = 20;
const ERROR_BUTTON_PADDING_HORIZONTAL = SPACING.ERROR_BUTTON_PADDING_HORIZONTAL;
const ERROR_BUTTON_PADDING_VERTICAL = SPACING.sm;
const ERROR_BUTTON_BORDER_RADIUS = 5;
const ERROR_BUTTON_MARGIN_LEFT = 10;
const CHART_CONTAINER_PADDING = SPACING.ERROR_PADDING;
const CHART_CONTAINER_MARGIN_BOTTOM = 20;
const CHART_CONTAINER_BORDER_RADIUS = 15;
const CHART_SHADOW_OFFSET_Y = 2;
const CHART_SHADOW_OPACITY = 0.1;
const CHART_SHADOW_RADIUS = 4;
const CHART_ELEVATION = 3;
const CHART_TITLE_MARGIN_BOTTOM = 15;
const SECTION_TITLE_MARGIN_BOTTOM = 15;
const SECTION_TITLE_PADDING_LEFT = SPACING.xs;
const STAT_ITEM_WIDTH = '48%';
const STAT_ITEM_PADDING = SPACING.ERROR_PADDING;
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

const StadisticsScreen = () => {
  const TEXTS = useMappedSectionTexts('PROFILE', DEFAULT_TEXTS, STATS_SCREEN_TEXT_MAP);
  const navigation = useNavigation();
  const { colors, statusBarStyle } = useTheme();

  const chartColors = useMemo(
    () => ({
      TASK: (opacity = 1) => rgbaFromHex(colors.error, opacity),
      HABIT: (opacity = 1) => rgbaFromHex(colors.primary, opacity),
      LABEL: (opacity = 1) => rgbaFromHex(colors.text, Math.min(1, 0.75 + opacity * 0.25)),
      LINE: (opacity = 1) => rgbaFromHex(colors.primary, opacity),
      BACKGROUND_FROM: colors.surface ?? colors.cardBackground ?? colors.background,
      BACKGROUND_TO: colors.surface ?? colors.cardBackground ?? colors.background,
      STROKE: colors.primary,
    }),
    [colors],
  );

  const chartConfig = useMemo(
    () => ({
      backgroundGradientFrom: chartColors.BACKGROUND_FROM,
      backgroundGradientTo: chartColors.BACKGROUND_TO,
      decimalPlaces: CHART_DECIMAL_PLACES,
      color: chartColors.LINE,
      labelColor: chartColors.LABEL,
      style: {
        borderRadius: CHART_BORDER_RADIUS,
      },
      propsForDots: {
        r: CHART_DOT_RADIUS.toString(),
        strokeWidth: CHART_DOT_STROKE_WIDTH.toString(),
        stroke: chartColors.STROKE,
      },
    }),
    [chartColors],
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
        },
        loadingContainer: {
          justifyContent: 'center',
          alignItems: 'center',
        },
        loadingText: {
          color: colors.textSecondary,
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
          backgroundColor: colors.cardBackground ?? colors.surface,
        },
        headerTitle: {
          fontSize: 20,
          fontWeight: 'bold',
          color: colors.text,
        },
        backButton: {
          width: BACK_BUTTON_SIZE,
          height: BACK_BUTTON_SIZE,
          borderRadius: BACK_BUTTON_BORDER_RADIUS,
          backgroundColor: colors.chromeIconButton ?? colors.glassFill ?? colors.accentLineSoft,
          justifyContent: 'center',
          alignItems: 'center',
        },
        backButtonText: {
          fontSize: 24,
          color: colors.text,
        },
        dataTypeSelector: {
          flexDirection: 'row',
          marginHorizontal: SELECTOR_MARGIN_HORIZONTAL,
          marginTop: SELECTOR_MARGIN_TOP,
          marginBottom: SELECTOR_MARGIN_BOTTOM,
          borderRadius: SELECTOR_BORDER_RADIUS,
          backgroundColor: colors.chromeInput ?? 'rgba(36, 35, 79, 0.06)',
          padding: SELECTOR_PADDING,
        },
        dataTypeButton: {
          flex: 1,
          paddingVertical: BUTTON_PADDING_VERTICAL,
          alignItems: 'center',
          borderRadius: BUTTON_BORDER_RADIUS,
        },
        activeDataTypeButton: {
          backgroundColor: colors.accentLineSoft,
        },
        dataTypeButtonText: {
          color: colors.textSecondary,
          fontSize: 16,
          fontWeight: '500',
        },
        activeDataTypeButtonText: {
          color: colors.text,
          fontWeight: 'bold',
        },
        tabSelector: {
          flexDirection: 'row',
          marginHorizontal: SELECTOR_MARGIN_HORIZONTAL,
          marginTop: SELECTOR_MARGIN_BOTTOM,
          marginBottom: SELECTOR_MARGIN_TOP,
          borderRadius: SELECTOR_BORDER_RADIUS,
          backgroundColor: colors.chromeInput ?? 'rgba(36, 35, 79, 0.06)',
          padding: SELECTOR_PADDING,
        },
        tabButton: {
          flex: 1,
          paddingVertical: BUTTON_PADDING_VERTICAL,
          alignItems: 'center',
          borderRadius: BUTTON_BORDER_RADIUS,
        },
        activeTabButton: {
          backgroundColor: colors.accentLineSoft,
        },
        tabButtonText: {
          color: colors.textSecondary,
          fontSize: 16,
          fontWeight: '500',
        },
        activeTabButtonText: {
          color: colors.text,
          fontWeight: 'bold',
        },
        scrollView: {
          flex: 1,
        },
        scrollViewContent: {
          paddingHorizontal: SCROLL_PADDING_HORIZONTAL,
        },
        errorContainer: {
          backgroundColor: colors.dangerSoft ?? 'rgba(255, 99, 71, 0.2)',
          borderRadius: SELECTOR_BORDER_RADIUS,
          padding: ERROR_PADDING,
          marginBottom: ERROR_MARGIN_BOTTOM,
          borderLeftWidth: ERROR_BORDER_LEFT_WIDTH,
          borderLeftColor: colors.error,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        },
        errorText: {
          color: colors.text,
          fontSize: 16,
          flex: 1,
        },
        errorButton: {
          paddingHorizontal: ERROR_BUTTON_PADDING_HORIZONTAL,
          paddingVertical: ERROR_BUTTON_PADDING_VERTICAL,
          borderRadius: ERROR_BUTTON_BORDER_RADIUS,
          backgroundColor: colors.glassFill ?? 'rgba(255, 255, 255, 0.2)',
          marginLeft: ERROR_BUTTON_MARGIN_LEFT,
        },
        errorButtonText: {
          color: colors.text,
          fontSize: 14,
        },
        chartContainer: {
          backgroundColor: colors.cardBackground ?? colors.surface,
          borderRadius: CHART_CONTAINER_BORDER_RADIUS,
          padding: CHART_CONTAINER_PADDING,
          marginBottom: CHART_CONTAINER_MARGIN_BOTTOM,
          shadowColor: colors.glassShadow ?? colors.shadowAmbient,
          shadowOffset: { width: 0, height: CHART_SHADOW_OFFSET_Y },
          shadowOpacity: CHART_SHADOW_OPACITY,
          shadowRadius: CHART_SHADOW_RADIUS,
          elevation: CHART_ELEVATION,
        },
        chartTitle: {
          color: colors.textSecondary,
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
          color: colors.textSecondary,
          marginBottom: SECTION_TITLE_MARGIN_BOTTOM,
          paddingLeft: SECTION_TITLE_PADDING_LEFT,
        },
        statsContainer: {
          backgroundColor: colors.cardBackground ?? colors.surface,
          borderRadius: CHART_CONTAINER_BORDER_RADIUS,
          padding: CHART_CONTAINER_PADDING,
          marginBottom: CHART_CONTAINER_MARGIN_BOTTOM,
          shadowColor: colors.glassShadow ?? colors.shadowAmbient,
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
          backgroundColor: colors.glassFill ?? 'rgba(255, 255, 255, 0.55)',
          borderRadius: STAT_ITEM_BORDER_RADIUS,
          padding: STAT_ITEM_PADDING,
          marginBottom: STAT_ITEM_MARGIN_BOTTOM,
          alignItems: 'center',
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
        },
        statValue: {
          fontSize: 24,
          fontWeight: 'bold',
          color: colors.text,
          marginBottom: STAT_VALUE_MARGIN_BOTTOM,
        },
        statLabel: {
          fontSize: 14,
          color: colors.textSecondary,
        },
        analysisContainer: {
          backgroundColor: colors.cardBackground ?? colors.surface,
          borderRadius: CHART_CONTAINER_BORDER_RADIUS,
          padding: CHART_CONTAINER_PADDING,
          marginBottom: CHART_CONTAINER_MARGIN_BOTTOM,
          shadowColor: colors.glassShadow ?? colors.shadowAmbient,
          shadowOffset: { width: 0, height: CHART_SHADOW_OFFSET_Y },
          shadowOpacity: CHART_SHADOW_OPACITY,
          shadowRadius: CHART_SHADOW_RADIUS,
          elevation: CHART_ELEVATION,
        },
        analysisItem: {
          flexDirection: 'row',
          marginBottom: ANALYSIS_ITEM_MARGIN_BOTTOM,
          backgroundColor: colors.glassFill ?? 'rgba(255, 255, 255, 0.45)',
          borderRadius: STAT_ITEM_BORDER_RADIUS,
          padding: STAT_ITEM_PADDING,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
        },
        analysisIconContainer: {
          width: ANALYSIS_ICON_SIZE,
          height: ANALYSIS_ICON_SIZE,
          borderRadius: ANALYSIS_ICON_BORDER_RADIUS,
          backgroundColor: colors.accentLineSoft,
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
          color: colors.text,
          marginBottom: ANALYSIS_TITLE_MARGIN_BOTTOM,
        },
        analysisDescription: {
          fontSize: 14,
          color: colors.textSecondary,
          lineHeight: 20,
        },
      }),
    [colors],
  );
  const [activeTab, setActiveTab] = useState(PERIODS.DAILY);
  const [activeDataType, setActiveDataType] = useState(DATA_TYPES.TASKS);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  
  // Datos de ejemplo para las gráficas (colores de series vía chartColors; pie/categoría en useMemo)
  const [taskStats, setTaskStats] = useState(() =>
    buildInitialTaskStats(chartColors, TEXTS),
  );
  const [habitStats, setHabitStats] = useState(() =>
    buildInitialHabitStats(chartColors, TEXTS),
  );

  const [pieData, setPieData] = useState(() => buildInitialPieData(TEXTS));

  const [categoryData, setCategoryData] = useState(() =>
    buildInitialCategoryData(TEXTS),
  );

  useEffect(() => {
    setTaskStats(buildInitialTaskStats(chartColors, TEXTS));
    setHabitStats(buildInitialHabitStats(chartColors, TEXTS));
    setPieData(buildInitialPieData(TEXTS));
    setCategoryData(buildInitialCategoryData(TEXTS));
  }, [chartColors, TEXTS]);

  const pieDataForChart = useMemo(
    () =>
      pieData.map((item, index) => ({
        ...item,
        color:
          index === 0
            ? rgbaFromHex(colors.primary, 0.85)
            : rgbaFromHex(colors.error, 0.85),
        legendFontColor: colors.textSecondary,
      })),
    [pieData, colors],
  );

  const categoryDataForChart = useMemo(() => {
    const accents = [colors.primary, colors.info, colors.warning, colors.success];
    return categoryData.map((item, i) => ({
      ...item,
      color: accents[i % accents.length],
      legendFontColor: colors.textSecondary,
    }));
  }, [categoryData, colors]);

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
      setTaskStats((prev) => ({
        daily: {
          ...prev.daily,
          datasets: [{
            ...prev.daily.datasets[0],
            data: Array(7).fill().map(() => Math.floor(Math.random() * 8) + 1),
            color: chartColors.TASK,
          }],
        },
        weekly: {
          ...prev.weekly,
          datasets: [{
            ...prev.weekly.datasets[0],
            data: Array(4).fill().map(() => Math.floor(Math.random() * 15) + 10),
            color: chartColors.TASK,
          }],
        },
        monthly: {
          ...prev.monthly,
          datasets: [{
            ...prev.monthly.datasets[0],
            data: Array(6).fill().map(() => Math.floor(Math.random() * 30) + 30),
            color: chartColors.TASK,
          }],
        },
      }));

      setHabitStats((prev) => ({
        daily: {
          ...prev.daily,
          datasets: [{
            ...prev.daily.datasets[0],
            data: Array(7).fill().map(() => parseFloat((Math.random() * 0.5 + 0.5).toFixed(1))),
            color: chartColors.HABIT,
          }],
        },
        weekly: {
          ...prev.weekly,
          datasets: [{
            ...prev.weekly.datasets[0],
            data: Array(4).fill().map(() => parseFloat((Math.random() * 0.3 + 0.6).toFixed(1))),
            color: chartColors.HABIT,
          }],
        },
        monthly: {
          ...prev.monthly,
          datasets: [{
            ...prev.monthly.datasets[0],
            data: Array(6).fill().map(() => parseFloat((Math.random() * 0.3 + 0.6).toFixed(1))),
            color: chartColors.HABIT,
          }],
        },
      }));

      const completedPercentage = Math.floor(Math.random() * 40) + 60;
      setPieData((prev) => [
        { ...prev[0], population: completedPercentage },
        { ...prev[1], population: 100 - completedPercentage },
      ]);
      
    } catch (err) {
      console.error('Error cargando estadísticas:', err);
      setError(TEXTS.ERROR);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [chartColors, TEXTS]);

  useEffect(() => {
    loadData();
  }, [loadData]);
  
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
  }, [activeTab, getActiveData, chartConfig, styles.chart]);
  
  // Renderizar pantalla de carga
  if (loading && !refreshing) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <StatusBar barStyle={statusBarStyle} />
        <ActivityIndicator 
          size="large" 
          color={colors.primary} 
          style={{ marginBottom: LOADING_INDICATOR_MARGIN_BOTTOM }} 
        />
        <Text style={styles.loadingText}>{TEXTS.LOADING}</Text>
      </View>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={statusBarStyle} />
      
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
            colors={[colors.primary]}
            tintColor={colors.primary}
            title={TEXTS.REFRESHING}
            titleColor={colors.primary}
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
            data={activeDataType === DATA_TYPES.TASKS ? pieDataForChart : categoryDataForChart}
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
                  ? activeTab === PERIODS.DAILY
                    ? TEXTS.BEST_TASKS_DAILY
                    : activeTab === PERIODS.WEEKLY
                    ? TEXTS.BEST_TASKS_WEEKLY
                    : TEXTS.BEST_TASKS_MONTHLY
                  : activeTab === PERIODS.DAILY
                  ? TEXTS.BEST_HABITS_DAILY
                  : activeTab === PERIODS.WEEKLY
                  ? TEXTS.BEST_HABITS_WEEKLY
                  : TEXTS.BEST_HABITS_MONTHLY}
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

export default StadisticsScreen;
