/**
 * Rutas de Recuperación de Pagos
 * 
 * Endpoints administrativos para recuperar pagos que no activaron suscripciones
 * 
 * @author AntoApp Team
 */

import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import paymentRecoveryService from '../services/paymentRecoveryService.js';
import paymentAuditService from '../services/paymentAuditService.js';

const router = express.Router();

/**
 * GET /api/payments/recovery/unactivated
 * Obtener lista de pagos completados sin suscripción activa
 * Requiere autenticación (solo para administradores en el futuro)
 */
router.get('/recovery/unactivated', authenticateToken, async (req, res) => {
  try {
    const unactivated = await paymentAuditService.findUnactivatedPayments();
    
    res.json({
      success: true,
      count: unactivated.length,
      payments: unactivated,
    });
  } catch (error) {
    console.error('Error obteniendo pagos no activados:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener pagos no activados',
    });
  }
});

/**
 * POST /api/payments/recovery/activate/:transactionId
 * Intentar activar una suscripción desde una transacción
 * Requiere autenticación
 */
router.post('/recovery/activate/:transactionId', authenticateToken, async (req, res) => {
  try {
    const { transactionId } = req.params;
    
    const result = await paymentRecoveryService.activateFromTransaction(transactionId);
    
    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        ...result,
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    console.error('Error activando suscripción:', error);
    res.status(500).json({
      success: false,
      error: 'Error al activar suscripción',
    });
  }
});

/**
 * POST /api/payments/recovery/process-all
 * Procesar todos los pagos no activados
 * Requiere autenticación
 */
router.post('/recovery/process-all', authenticateToken, async (req, res) => {
  try {
    const results = await paymentRecoveryService.processUnactivatedPayments();
    
    res.json({
      success: true,
      ...results,
    });
  } catch (error) {
    console.error('Error procesando pagos no activados:', error);
    res.status(500).json({
      success: false,
      error: 'Error al procesar pagos no activados',
    });
  }
});

export default router;

