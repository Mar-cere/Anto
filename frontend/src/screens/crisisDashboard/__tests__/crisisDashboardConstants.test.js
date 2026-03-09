/**
 * Tests unitarios para constantes de CrisisDashboardScreen
 * @author AntoApp Team
 */

jest.mock('../../../styles/globalStyles', () => ({ colors: {} }));

import {
  TEXTS,
  CHART_HEIGHT,
  CHART_CONFIG,
  PIE_CHART_CONFIG,
  EMOTION_COLORS,
  RISK_LEVEL_COLORS,
  RISK_LEVEL_TEXTS,
  TREND_PERIODS,
} from '../crisisDashboardConstants';

describe('crisisDashboardConstants', () => {
  describe('TEXTS', () => {
    it('debe tener título y textos de carga/error', () => {
      expect(TEXTS.TITLE).toBe('Dashboard de Crisis');
      expect(TEXTS.LOADING).toBe('Cargando métricas...');
      expect(TEXTS.ERROR).toBeDefined();
      expect(TEXTS.RETRY).toBe('Reintentar');
    });
    it('debe tener secciones y etiquetas', () => {
      expect(TEXTS.SUMMARY).toBe('Resumen');
      expect(TEXTS.TRENDS).toBe('Tendencias Emocionales');
      expect(TEXTS.CRISIS_BY_MONTH).toBe('Crisis por Mes');
      expect(TEXTS.EMOTION_DISTRIBUTION).toBe('Distribución de Emociones');
      expect(TEXTS.HISTORY).toBe('Historial de Crisis');
      expect(TEXTS.TOTAL_CRISES).toBe('Total de Crisis');
      expect(TEXTS.THIS_MONTH).toBe('Este Mes');
      expect(TEXTS.RECENT).toBe('Recientes (7 días)');
      expect(TEXTS.RESOLUTION_RATE).toBe('Tasa de Resolución');
      expect(TEXTS.AVERAGE_RISK).toBe('Riesgo Promedio');
    });
    it('debe tener períodos y niveles de riesgo', () => {
      expect(TEXTS.PERIOD_7D).toBe('7 días');
      expect(TEXTS.PERIOD_30D).toBe('30 días');
      expect(TEXTS.PERIOD_90D).toBe('90 días');
      expect(TEXTS.LOW).toBe('Bajo');
      expect(TEXTS.WARNING).toBe('Advertencia');
      expect(TEXTS.MEDIUM).toBe('Medio');
      expect(TEXTS.HIGH).toBe('Alto');
    });
    it('debe tener textos de tendencia y vacío', () => {
      expect(TEXTS.VIEW_ALL).toBe('Ver Todo');
      expect(TEXTS.NO_CRISIS).toBeDefined();
      expect(TEXTS.NO_CRISIS_MESSAGE).toBeDefined();
      expect(TEXTS.TREND_IMPROVING).toBe('Mejorando');
      expect(TEXTS.TREND_DECLINING).toBe('Deteriorando');
      expect(TEXTS.TREND_STABLE).toBe('Estable');
      expect(TEXTS.TREND_LABEL).toBe('Tendencia: ');
    });
  });

  describe('CHART_HEIGHT', () => {
    it('debe ser 220', () => {
      expect(CHART_HEIGHT).toBe(220);
    });
  });

  describe('CHART_CONFIG', () => {
    it('debe tener backgroundColor y decimalPlaces', () => {
      expect(CHART_CONFIG.backgroundColor).toBe('#1D2B5F');
      expect(CHART_CONFIG.decimalPlaces).toBe(1);
      expect(CHART_CONFIG.style).toEqual({ borderRadius: 16 });
    });
    it('debe tener color y labelColor como funciones', () => {
      expect(typeof CHART_CONFIG.color).toBe('function');
      expect(typeof CHART_CONFIG.labelColor).toBe('function');
      expect(CHART_CONFIG.color(0.5)).toContain('0.5');
      expect(CHART_CONFIG.propsForDots).toMatchObject({ r: '6', strokeWidth: '2', stroke: '#1ADDDB' });
    });
  });

  describe('PIE_CHART_CONFIG', () => {
    it('debe tener decimalPlaces 0 y style', () => {
      expect(PIE_CHART_CONFIG.decimalPlaces).toBe(0);
      expect(PIE_CHART_CONFIG.style).toEqual({ borderRadius: 16 });
    });
  });

  describe('EMOTION_COLORS', () => {
    it('debe tener color por emoción', () => {
      expect(EMOTION_COLORS.tristeza).toBe('#FF6B6B');
      expect(EMOTION_COLORS.ansiedad).toBe('#FFA500');
      expect(EMOTION_COLORS.alegria).toBe('#4ECDC4');
      expect(EMOTION_COLORS.miedo).toBe('#9B59B6');
      expect(EMOTION_COLORS.neutral).toBe('#95A5A6');
    });
  });

  describe('RISK_LEVEL_COLORS', () => {
    it('debe tener LOW, WARNING, MEDIUM, HIGH', () => {
      expect(RISK_LEVEL_COLORS.LOW).toBe('#4ECDC4');
      expect(RISK_LEVEL_COLORS.WARNING).toBe('#FFA500');
      expect(RISK_LEVEL_COLORS.MEDIUM).toBe('#FF6B6B');
      expect(RISK_LEVEL_COLORS.HIGH).toBe('#E74C3C');
    });
  });

  describe('RISK_LEVEL_TEXTS', () => {
    it('debe mapear a TEXTS', () => {
      expect(RISK_LEVEL_TEXTS.LOW).toBe(TEXTS.LOW);
      expect(RISK_LEVEL_TEXTS.WARNING).toBe(TEXTS.WARNING);
      expect(RISK_LEVEL_TEXTS.MEDIUM).toBe(TEXTS.MEDIUM);
      expect(RISK_LEVEL_TEXTS.HIGH).toBe(TEXTS.HIGH);
    });
  });

  describe('TREND_PERIODS', () => {
    it('debe ser array 7d, 30d, 90d', () => {
      expect(TREND_PERIODS).toEqual(['7d', '30d', '90d']);
    });
  });
});
