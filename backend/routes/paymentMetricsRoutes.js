/**
 * Rutas de Métricas de Pagos
 * 
 * Endpoints para monitorear y obtener métricas del sistema de pagos
 * 
 * @author AntoApp Team
 */

import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { attachApiCopy } from '../middleware/apiLanguageMiddleware.js';
import { paymentApiCopy } from '../utils/paymentApiCopy.js';
import Transaction from '../models/Transaction.js';
import Subscription from '../models/Subscription.js';
import User from '../models/User.js';
import paymentAuditService from '../services/paymentAuditService.js';

const router = express.Router();

router.use(attachApiCopy(paymentApiCopy));

// Middleware: Solo administradores pueden acceder a métricas de pagos
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
 * GET /api/payments/metrics/overview
 * Obtener métricas generales del sistema de pagos
 * Requiere autenticación y rol de administrador
 */
router.get('/metrics/overview', authenticateToken, isAdmin, async (req, res) => {
  try {
    const now = new Date();
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Métricas de transacciones
    const totalTransactions = await Transaction.countDocuments();
    const completedTransactions = await Transaction.countDocuments({ status: 'completed' });
    const pendingTransactions = await Transaction.countDocuments({ status: 'pending' });
    const failedTransactions = await Transaction.countDocuments({ status: 'failed' });

    // Transacciones recientes
    const recentTransactions = await Transaction.countDocuments({
      createdAt: { $gte: last30Days },
    });

    const recentCompleted = await Transaction.countDocuments({
      status: 'completed',
      createdAt: { $gte: last30Days },
    });

    // Métricas de suscripciones
    const totalSubscriptions = await Subscription.countDocuments();
    const activeSubscriptions = await Subscription.countDocuments({ status: 'active' });
    const trialingSubscriptions = await Subscription.countDocuments({ status: 'trialing' });
    const canceledSubscriptions = await Subscription.countDocuments({ status: 'canceled' });

    // Usuarios en trial
    const usersInTrial = await User.countDocuments({
      'subscription.status': 'trial',
      'subscription.trialEndDate': { $gte: now },
    });

    // Usuarios premium
    const usersPremium = await User.countDocuments({
      'subscription.status': 'premium',
      'subscription.subscriptionEndDate': { $gte: now },
    });

    // Pagos no activados
    const unactivatedPayments = await paymentAuditService.findUnactivatedPayments();

    // Ingresos (últimos 30 días)
    const revenueData = await Transaction.aggregate([
      {
        $match: {
          status: 'completed',
          createdAt: { $gte: last30Days },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$amount' },
          averageAmount: { $avg: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    const revenue = revenueData[0] || { totalRevenue: 0, averageAmount: 0, count: 0 };

    // Conversión trial a premium (últimos 7 días)
    const trialConversions = await User.countDocuments({
      'subscription.status': 'premium',
      'subscription.subscriptionStartDate': { $gte: last7Days },
    });

    const newTrials = await User.countDocuments({
      'subscription.status': 'trial',
      'subscription.trialStartDate': { $gte: last7Days },
    });

    const conversionRate = newTrials > 0 ? (trialConversions / newTrials) * 100 : 0;

    // Calcular MRR (Monthly Recurring Revenue)
    const mrrData = await Subscription.aggregate([
      {
        $match: {
          status: 'active',
          currentPeriodEnd: { $gte: now },
        },
      },
      {
        $lookup: {
          from: 'transactions',
          localField: 'mercadopagoTransactionId',
          foreignField: 'providerTransactionId',
          as: 'transaction',
        },
      },
      {
        $unwind: {
          path: '$transaction',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $group: {
          _id: '$plan',
          count: { $sum: 1 },
          totalAmount: { $sum: { $ifNull: ['$transaction.amount', 0] } },
        },
      },
    ]);

    // Calcular MRR basado en planes activos
    let mrr = 0;
    const planPrices = {
      weekly: 990 * 4.33, // Aproximación mensual
      monthly: 3990,
      quarterly: 11990 / 3,
      semestral: 20990 / 6,
      yearly: 39990 / 12,
      semestral: 19400 / 6,
      yearly: 36900 / 12,
    };

    mrrData.forEach(plan => {
      const monthlyPrice = planPrices[plan._id] || 0;
      mrr += monthlyPrice * plan.count;
    });

    // Calcular Churn Rate (últimos 30 días)
    const canceledLast30Days = await Subscription.countDocuments({
      status: 'canceled',
      canceledAt: { $gte: last30Days },
    });

    const activeAtStartOfPeriod = await Subscription.countDocuments({
      status: 'active',
      currentPeriodStart: { $lte: last30Days },
    });

    const churnRate = activeAtStartOfPeriod > 0 
      ? (canceledLast30Days / activeAtStartOfPeriod) * 100 
      : 0;

    // Calcular LTV (Lifetime Value) promedio
    // Optimización: Usar índices existentes (status, type)
    const ltvData = await Transaction.aggregate([
      {
        $match: {
          status: 'completed',
          type: 'subscription',
        },
      },
      {
        // Optimización: Proyectar solo campos necesarios
        $project: {
          userId: 1,
          amount: 1
        }
      },
      {
        $group: {
          _id: '$userId',
          totalSpent: { $sum: '$amount' },
          transactionCount: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: null,
          averageLTV: { $avg: '$totalSpent' },
          medianLTV: { $avg: '$totalSpent' }, // Aproximación
          totalUsers: { $sum: 1 },
        },
      },
    ]);

    const ltv = ltvData[0] || { averageLTV: 0, medianLTV: 0, totalUsers: 0 };

    // Métricas por plan
    // Optimización: Usar índices existentes (status, plan)
    const metricsByPlan = await Subscription.aggregate([
      {
        $match: {
          status: { $in: ['active', 'trialing'] },
        },
      },
      {
        // Optimización: Proyectar solo campos necesarios
        $project: {
          plan: 1,
          status: 1
        }
      },
      {
        $group: {
          _id: '$plan',
          count: { $sum: 1 },
          active: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] },
          },
          trialing: {
            $sum: { $cond: [{ $eq: ['$status', 'trialing'] }, 1, 0] },
          },
        },
      },
    ]);

    res.json({
      success: true,
      metrics: {
        transactions: {
          total: totalTransactions,
          completed: completedTransactions,
          pending: pendingTransactions,
          failed: failedTransactions,
          recent30Days: recentTransactions,
          recentCompleted30Days: recentCompleted,
        },
        subscriptions: {
          total: totalSubscriptions,
          active: activeSubscriptions,
          trialing: trialingSubscriptions,
          canceled: canceledSubscriptions,
        },
        users: {
          inTrial: usersInTrial,
          premium: usersPremium,
        },
        revenue: {
          last30Days: revenue.totalRevenue,
          averageAmount: revenue.averageAmount,
          transactionCount: revenue.count,
        },
        conversion: {
          trialToPremiumRate: conversionRate.toFixed(2),
          newTrials7Days: newTrials,
          conversions7Days: trialConversions,
        },
        advanced: {
          mrr: Math.round(mrr), // Monthly Recurring Revenue
          churnRate: churnRate.toFixed(2), // Churn rate en porcentaje
          ltv: {
            average: Math.round(ltv.averageLTV || 0),
            median: Math.round(ltv.medianLTV || 0),
            totalUsers: ltv.totalUsers,
          },
          byPlan: metricsByPlan.reduce((acc, plan) => {
            acc[plan._id] = {
              total: plan.count,
              active: plan.active,
              trialing: plan.trialing,
            };
            return acc;
          }, {}),
        },
        issues: {
          unactivatedPayments: unactivatedPayments.length,
          unactivatedPaymentsList: unactivatedPayments.slice(0, 10), // Primeros 10
        },
      },
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error('Error obteniendo métricas de pagos:', error);
    res.status(500).json({
      success: false,
      error: req.apiCopy.paymentMetricsError,
    });
  }
});

/**
 * GET /api/payments/metrics/unactivated
 * Obtener lista detallada de pagos no activados
 * Requiere autenticación
 */
router.get('/metrics/unactivated', authenticateToken, isAdmin, async (req, res) => {
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
 * GET /api/payments/metrics/health
 * Verificar salud del sistema de pagos
 * Requiere autenticación
 */
router.get('/metrics/health', authenticateToken, isAdmin, async (req, res) => {
  try {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Verificar transacciones recientes
    const recentTransactions = await Transaction.countDocuments({
      createdAt: { $gte: last24Hours },
    });

    // Verificar pagos no activados
    const unactivated = await paymentAuditService.findUnactivatedPayments();
    const recentUnactivated = unactivated.filter(
      payment => new Date(payment.completedAt) >= last24Hours
    );

    // Verificar suscripciones activas
    const activeSubscriptions = await Subscription.countDocuments({ status: 'active' });

    // Determinar estado de salud
    let healthStatus = 'healthy';
    const issues = [];

    if (recentUnactivated.length > 0) {
      healthStatus = 'warning';
      issues.push({
        type: 'unactivated_payments',
        count: recentUnactivated.length,
        message: req.apiCopy.recentUnactivatedIssue(recentUnactivated.length),
      });
    }

    if (recentTransactions === 0 && activeSubscriptions === 0) {
      healthStatus = 'warning';
      issues.push({
        type: 'no_activity',
        message: req.apiCopy.noPaymentActivity,
      });
    }

    res.json({
      success: true,
      health: {
        status: healthStatus,
        timestamp: now.toISOString(),
        metrics: {
          recentTransactions24h: recentTransactions,
          unactivatedPayments24h: recentUnactivated.length,
          activeSubscriptions: activeSubscriptions,
        },
        issues: issues.length > 0 ? issues : null,
      },
    });
  } catch (error) {
    console.error('Error verificando salud del sistema de pagos:', error);
    res.status(500).json({
      success: false,
      error: req.apiCopy.paymentHealthCheckError,
      health: {
        status: 'error',
        message: error.message,
      },
    });
  }
});

/**
 * GET /api/payments/metrics/integrity
 * Alertas de integridad: pagos completados vs acceso premium, huérfanos, bloqueos.
 * Requiere rol admin.
 */
router.get('/metrics/integrity', authenticateToken, isAdmin, async (req, res) => {
  try {
    const now = new Date();
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const completedRecent = await Transaction.find({
      status: 'completed',
      type: 'subscription',
      paymentProvider: 'mercadopago',
      updatedAt: { $gte: last7d },
    })
      .select('userId amount plan metadata status updatedAt')
      .limit(400)
      .lean();

    let completedWithoutPremium = 0;
    const samples = [];

    for (const t of completedRecent) {
      const uid = t.userId;
      const user = await User.findById(uid)
        .select('subscription.status subscription.subscriptionEndDate')
        .lean();
      const sub = await Subscription.findOne({ userId: uid })
        .select('status currentPeriodEnd')
        .lean();

      const premiumUser =
        user?.subscription?.status === 'premium' &&
        user?.subscription?.subscriptionEndDate &&
        new Date(user.subscription.subscriptionEndDate) >= now;

      const activeSub =
        sub &&
        sub.status === 'active' &&
        sub.currentPeriodEnd &&
        new Date(sub.currentPeriodEnd) >= now;

      const wasBlocked = !!t.metadata?.activationBlockedReason;

      if (!premiumUser && !activeSub && !wasBlocked) {
        completedWithoutPremium += 1;
        if (samples.length < 20) {
          samples.push({
            transactionId: t._id,
            userId: uid,
            plan: t.plan,
            updatedAt: t.updatedAt,
          });
        }
      }
    }

    const orphansPending = await Transaction.countDocuments({
      status: 'pending',
      type: 'subscription',
      paymentProvider: 'mercadopago',
      createdAt: { $gte: last7d },
    });

    const duplicateAttempts = await Transaction.countDocuments({
      'metadata.duplicateTransactionAttempts.0': { $exists: true },
      updatedAt: { $gte: last7d },
    });

    const activationsBlocked = await Transaction.countDocuments({
      'metadata.activationBlockedReason': { $exists: true, $ne: null },
      updatedAt: { $gte: last7d },
    });

    res.json({
      success: true,
      integrity: {
        windowDays: 7,
        completedMercadoPagoRecentScanned: completedRecent.length,
        completedWithoutPremiumAccess: completedWithoutPremium,
        pendingOrphansRecent: orphansPending,
        duplicateActivationAttempts: duplicateAttempts,
        activationsBlockedByValidation: activationsBlocked,
        samplesCompletedWithoutPremium: samples,
      },
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error('Error en métricas de integridad de pagos:', error);
    res.status(500).json({
      success: false,
      error: req.apiCopy.paymentIntegrityError,
    });
  }
});

export default router;

