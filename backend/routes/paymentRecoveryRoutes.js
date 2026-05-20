/**
 * Rutas de Recuperación de Pagos
 * 
 * Endpoints administrativos para recuperar pagos que no activaron suscripciones
 * 
 * @author AntoApp Team
 */

import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { attachApiCopy } from '../middleware/apiLanguageMiddleware.js';
import { paymentApiCopy } from '../utils/paymentApiCopy.js';
import paymentRecoveryService from '../services/paymentRecoveryService.js';
import paymentAuditService from '../services/paymentAuditService.js';

const router = express.Router();

router.use(attachApiCopy(paymentApiCopy));

// Middleware: Solo administradores pueden acceder a rutas de recuperación
const isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: req.apiCopy.notAuthenticated
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: req.apiCopy.adminDenied,
      required: 'admin',
      current: req.user.role || 'user'
    });
  }

  next();
};

/**
 * GET /api/payments/recovery/unactivated
 * Obtener lista de pagos completados sin suscripción activa
 * Requiere autenticación y rol de administrador
 */
router.get('/recovery/unactivated', authenticateToken, isAdmin, async (req, res) => {
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
      error: req.apiCopy.unactivatedPaymentsError,
    });
  }
});

/**
 * POST /api/payments/recovery/activate/:transactionId
 * Intentar activar una suscripción desde una transacción
 * Requiere autenticación
 */
router.post('/recovery/activate/:transactionId', authenticateToken, isAdmin, async (req, res) => {
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
      error: req.apiCopy.activateSubscriptionError,
    });
  }
});

/**
 * POST /api/payments/recovery/process-all
 * Procesar todos los pagos no activados
 * Requiere autenticación
 */
router.post('/recovery/process-all', authenticateToken, isAdmin, async (req, res) => {
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
      error: req.apiCopy.processUnactivatedError,
    });
  }
});

export default router;

