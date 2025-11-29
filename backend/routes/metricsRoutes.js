/**
 * Rutas de Métricas y Monitoreo
 * 
 * Endpoints para obtener métricas del sistema y estadísticas de salud
 */
import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import metricsService from '../services/metricsService.js';

const router = express.Router();

// Middleware: Solo administradores pueden acceder a métricas globales
// Por ahora, cualquier usuario autenticado puede ver sus propias métricas
const isAdmin = (req, res, next) => {
  // TODO: Implementar verificación de rol de administrador
  // Por ahora, permitir acceso a todos los usuarios autenticados
  next();
};

// Obtener métricas generales del sistema (requiere autenticación)
router.get('/system', authenticateToken, isAdmin, async (req, res) => {
  try {
    const metrics = metricsService.getMetrics();
    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error('Error obteniendo métricas del sistema:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener métricas del sistema',
      error: error.message
    });
  }
});

// Obtener estadísticas de salud del sistema
router.get('/health', authenticateToken, isAdmin, async (req, res) => {
  try {
    const healthStats = await metricsService.getHealthStats();
    res.json({
      success: true,
      data: healthStats
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas de salud:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas de salud',
      error: error.message
    });
  }
});

// Obtener métricas del usuario actual
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const userMetrics = metricsService.getUserMetrics(req.user._id.toString());
    res.json({
      success: true,
      data: userMetrics
    });
  } catch (error) {
    console.error('Error obteniendo métricas del usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener métricas del usuario',
      error: error.message
    });
  }
});

// Obtener métricas por tipo
router.get('/type/:type', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { type } = req.params;
    const metrics = metricsService.getMetricsByType(type);
    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error('Error obteniendo métricas por tipo:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener métricas por tipo',
      error: error.message
    });
  }
});

export default router;

