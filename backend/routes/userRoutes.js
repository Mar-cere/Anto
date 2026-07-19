/**
 * Rutas de Usuario - Gestiona perfil, contraseña, suscripción y eliminación de cuenta
 */
import cloudinary from 'cloudinary';
import crypto from 'crypto';
import express from 'express';
import { createRateLimiter } from '../utils/createRateLimiter.js';
import mongoose from 'mongoose';
import { CURRENT_TERMS_VERSION } from '../constants/app.js';
import { authenticateToken } from '../middleware/auth.js';
import { attachApiCopy } from '../middleware/apiLanguageMiddleware.js';
import { validateUserObjectId } from '../middleware/validation.js';
import User from '../models/User.js';
import UserProfile from '../models/UserProfile.js';
import cacheService from '../services/cacheService.js';
import userProfileService from '../services/userProfileService.js';
import { resolveRequestLanguage } from '../utils/apiLanguage.js';
import { normalizeCountryPreferences } from '../utils/countryPreferences.js';
import { normalizePreferencesNotifications } from '../utils/preferencesNotifications.js';
import { validationErrorBody, validateBody } from '../utils/apiValidation.js';
import logger from '../utils/logger.js';
import { userApiCopy } from '../utils/userApiCopy.js';
import {
  getEmergencyContactSchema,
  getOnboardingPreferencesSchema,
  getReacceptTermsSchema,
  getUpdatePasswordSchema,
  getUpdateProfileSchema,
} from '../utils/userSchemas.js';

// Helper para validar ObjectId
const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

const router = express.Router();

router.use(attachApiCopy(userApiCopy));

// Constantes de configuración
const MILLISECONDS_PER_DAY = 1000 * 60 * 60 * 24;

// Rate limiters: control de frecuencia de peticiones
const updateProfileLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10,
  message: (req) => userApiCopy(resolveRequestLanguage(req)).rateLimitUpdateProfile,
  standardHeaders: true,
  legacyHeaders: false
});


const deleteUserLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3,
  message: (req) => userApiCopy(resolveRequestLanguage(req)).rateLimitDeleteUser,
  standardHeaders: true,
  legacyHeaders: false
});

const deleteContactLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10,
  message: (req) => userApiCopy(resolveRequestLanguage(req)).rateLimitDeleteContact,
  standardHeaders: true,
  legacyHeaders: false
});

const patchContactLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 20,
  message: (req) => userApiCopy(resolveRequestLanguage(req)).rateLimitPatchContact,
  standardHeaders: true,
  legacyHeaders: false
});

// Configuración de Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Helper: calcular días desde una fecha
const calculateDaysSince = (date) => {
  if (!date) return 0;
  return Math.floor((Date.now() - new Date(date).getTime()) / MILLISECONDS_PER_DAY);
};

// Helper: calcular días restantes hasta una fecha
const calculateDaysLeft = (endDate) => {
  if (!endDate) return 0;
  const now = new Date();
  const end = new Date(endDate);
  if (now >= end) return 0;
  return Math.ceil((end - now) / MILLISECONDS_PER_DAY);
};

// Helper: buscar usuario por ID
const findUserById = async (userId, select = '', lean = false) => {
  // Asegurar que userId sea un ObjectId válido
  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    return null;
  }
  try {
    const objectId = new mongoose.Types.ObjectId(userId);
    let query = User.findById(objectId);
    if (select) {
      query = query.select(select);
    }
    if (lean) {
      query = query.lean();
    }
    return await query;
  } catch (error) {
    return null;
  }
};

// Helper: hashear contraseña
const hashPassword = (password) => {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return { salt, hash };
};

const DEFAULT_CHAT_PREFERENCES = {
  reduceStockEmpathy: false,
  avoidApologyOpenings: false,
  preferQuestions: false
};

/** Inyecta preferencias de tono del chat desde UserProfile (no van en el documento User). */
async function attachChatPreferencesToUserPayload(userId, payload) {
  const cp = await UserProfile.findOne({ userId }).select('preferences.chatPreferences').lean();
  return {
    ...payload,
    preferences: {
      ...(payload.preferences || {}),
      chatPreferences: {
        ...DEFAULT_CHAT_PREFERENCES,
        ...(cp?.preferences?.chatPreferences || {})
      }
    }
  };
}

// Obtener datos del usuario actual
router.get('/me', authenticateToken, validateUserObjectId, async (req, res) => {
  try {
    // Asegurar que tenemos un userId válido
    const userId = req.user?._id || req.user?.userId;
    
    if (!userId) {
      return res.status(401).json({ message: req.apiCopy.notAuthenticated });
    }

    // Intentar obtener del caché primero
    const cacheKey = cacheService.generateKey('user', userId);
    const cachedUser = await cacheService.get(cacheKey);
    
    if (cachedUser) {
      const merged = await attachChatPreferencesToUserPayload(userId, cachedUser);
      return res.json(merged);
    }

    const user = await findUserById(userId, '-password -salt -__v -resetPasswordCode -resetPasswordExpires', true);
    
    if (!user) {
      return res.status(404).json({ message: req.apiCopy.userNotFound });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: req.apiCopy.accountDeactivated });
    }

    // Calcular tiempo desde último login (en segundos)
    const lastLogin = user.lastLogin ? new Date(user.lastLogin) : null;
    const timeSinceLastLogin = lastLogin ? Math.floor((Date.now() - lastLogin.getTime()) / 1000) : null;

    // Calcular días desde el registro
    const daysSinceRegistration = calculateDaysSince(user.createdAt);

    const userResponse = await attachChatPreferencesToUserPayload(userId, {
      ...user,
      timeSinceLastLogin,
      daysSinceRegistration
    });

    // Guardar en caché por 5 minutos (no crítico si falla)
    try {
      await cacheService.set(cacheKey, userResponse, 300);
    } catch (cacheError) {
      logger.warn('Error al guardar en caché', { error: cacheError.message });
    }

    res.json(userResponse);
  } catch (error) {
    logger.error('Error al obtener usuario', { error: error.message, userId: req.user?._id || req.user?.userId });
    
    // Verificar si es un error de conexión de MongoDB
    if (error.message && (
      error.message.includes('MongoServerSelectionError') ||
      error.message.includes('MongoNetworkError') ||
      error.message.includes('MongoTimeoutError') ||
      error.message.includes('connection') ||
      error.message.includes('connect ECONNREFUSED')
    )) {
      return res.status(503).json({ 
        success: false,
        message: req.apiCopy.serviceUnavailable,
        error: 'DATABASE_CONNECTION_ERROR'
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: req.apiCopy.getUserError,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Obtener estadísticas del usuario
router.get('/me/stats', authenticateToken, validateUserObjectId, async (req, res) => {
  try {
    const user = await findUserById(req.user._id, 'stats subscription createdAt', true);
    
    if (!user) {
      return res.status(404).json({ message: req.apiCopy.userNotFound });
    }

    const daysSinceRegistration = calculateDaysSince(user.createdAt);
    
    // Calcular estadísticas adicionales
    const stats = {
      ...user.stats,
      daysSinceRegistration,
      averageTasksPerDay: daysSinceRegistration > 0 
        ? (user.stats.tasksCompleted / daysSinceRegistration).toFixed(2) 
        : 0,
      subscriptionStatus: user.subscription.status,
      isInTrial: user.subscription.trialStartDate && 
                user.subscription.trialEndDate && 
                new Date() >= user.subscription.trialStartDate && 
                new Date() <= user.subscription.trialEndDate
    };

    res.json(stats);
  } catch (error) {
    logger.error('Error al obtener estadísticas', { error: error.message, userId: req.user._id });
    res.status(500).json({ 
      message: req.apiCopy.statsError,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Actualizar perfil del usuario
router.put('/me', authenticateToken, validateUserObjectId, updateProfileLimiter, async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.userId;
    
    if (!userId) {
      return res.status(401).json({ message: req.apiCopy.notAuthenticated });
    }

    // Validar datos de entrada
    const { error, value } = validateBody(getUpdateProfileSchema(req.apiCopy), req.body);
    if (error) {
      return res.status(400).json(validationErrorBody(req.apiCopy, error));
    }

    if (value.preferences) {
      value.preferences = normalizeCountryPreferences(value.preferences);
    }

    const user = await findUserById(userId);
    if (!user) {
      return res.status(404).json({ message: req.apiCopy.userNotFound });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: req.apiCopy.accountDeactivated });
    }

    // Verificar unicidad de email y username si se están actualizando
    if (value.email && value.email !== user.email) {
      const existingEmail = await User.findOne({ email: value.email })
        .select('_id')
        .lean();
      if (existingEmail) {
        return res.status(400).json({ message: req.apiCopy.emailInUse });
      }
    }

    if (value.username && value.username !== user.username) {
      const existingUsername = await User.findOne({ username: value.username })
        .select('_id')
        .lean();
      if (existingUsername) {
        return res.status(400).json({ message: req.apiCopy.usernameInUse });
      }
    }

    const chatPrefsPayload = value.preferences?.chatPreferences;
    const valueForUpdate = { ...value };
    if (value.preferences) {
      const { chatPreferences: _chatPref, ...restPrefs } = value.preferences;
      if (Object.keys(restPrefs).length > 0) {
        valueForUpdate.preferences = restPrefs;
      } else {
        delete valueForUpdate.preferences;
      }
    }

    // Actualizar campos (merge para objetos anidados)
    Object.keys(valueForUpdate).forEach(key => {
      if (key === 'preferences') {
        const incomingPrefs = { ...valueForUpdate.preferences };
        if (Object.prototype.hasOwnProperty.call(incomingPrefs, 'notifications')) {
          incomingPrefs.notifications = normalizePreferencesNotifications(
            incomingPrefs.notifications,
            user.preferences?.notifications
          );
        }
        // Asegurar que user.preferences existe antes de hacer el spread
        user.preferences = {
          ...(user.preferences || {}),
          ...incomingPrefs
        };
        user.markModified('preferences');
      } else if (key === 'notificationPreferences') {
        const incoming = valueForUpdate.notificationPreferences || {};
        const prev = user.notificationPreferences || {};
        const merged = { ...prev, ...incoming };
        if (incoming.types && typeof incoming.types === 'object') {
          merged.types = { ...(prev.types || {}), ...incoming.types };
        }
        if (incoming.morning && typeof incoming.morning === 'object') {
          merged.morning = { ...(prev.morning || {}), ...incoming.morning };
        }
        if (incoming.evening && typeof incoming.evening === 'object') {
          merged.evening = { ...(prev.evening || {}), ...incoming.evening };
        }
        user.notificationPreferences = merged;
      } else {
        user[key] = valueForUpdate[key];
      }
    });

    // Guardar (Mongoose timestamps maneja updatedAt automáticamente)
    await user.save();

    // Sincronizar responseStyle y/o chatPreferences a UserProfile (fuente de verdad del tono del chat)
    if (value.preferences?.responseStyle || chatPrefsPayload !== undefined) {
      const profile = await UserProfile.findOne({ userId }).select('preferences').lean();
      const nextPrefs = { ...(profile?.preferences || {}) };
      if (value.preferences?.responseStyle) {
        nextPrefs.responseStyle = value.preferences.responseStyle;
      }
      if (chatPrefsPayload !== undefined) {
        nextPrefs.chatPreferences = {
          ...DEFAULT_CHAT_PREFERENCES,
          ...(profile?.preferences?.chatPreferences || {}),
          ...chatPrefsPayload
        };
      }
      await userProfileService.updatePreferences(userId, nextPrefs);
    }

    // Invalidar caché del usuario (userId ya está declarado arriba)
    await cacheService.invalidateUserCache(userId);

    const userJson = user.toJSON();
    const userWithChatPrefs = await attachChatPreferencesToUserPayload(userId, userJson);

    // Recalentar GET /me para que la siguiente lectura refleje el PUT sin ir a BD en frío.
    try {
      const cacheKey = cacheService.generateKey('user', userId);
      await cacheService.set(cacheKey, userWithChatPrefs, 300);
    } catch (cacheError) {
      logger.warn('Error al recalentar caché de usuario', { error: cacheError.message });
    }

    res.json({
      message: req.apiCopy.profileUpdated,
      user: userWithChatPrefs
    });
  } catch (error) {
    logger.error('Error al actualizar usuario', { error: error.message, userId: req.user._id });
    res.status(400).json({ 
      message: req.apiCopy.profileUpdateError,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Cambiar contraseña del usuario
router.put('/me/password', authenticateToken, validateUserObjectId, updateProfileLimiter, async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.userId;
    
    if (!userId) {
      return res.status(401).json({ message: req.apiCopy.notAuthenticated });
    }

    const { error, value } = validateBody(getUpdatePasswordSchema(req.apiCopy), req.body);
    if (error) {
      return res.status(400).json(validationErrorBody(req.apiCopy, error));
    }

    const { currentPassword, newPassword } = value;

    const user = await findUserById(userId);
    if (!user) {
      return res.status(404).json({ message: req.apiCopy.userNotFound });
    }

    // Verificar contraseña actual
    if (!user.comparePassword(currentPassword)) {
      return res.status(400).json({ message: req.apiCopy.wrongCurrentPassword });
    }

    // Verificar que la nueva contraseña sea diferente
    if (user.comparePassword(newPassword)) {
      return res.status(400).json({ message: req.apiCopy.passwordSameAsCurrent });
    }

    // Hashear nueva contraseña
    const { salt, hash } = hashPassword(newPassword);
    
    user.password = hash;
    user.salt = salt;
    user.lastPasswordChange = new Date();
    await user.save();

    res.json({ message: req.apiCopy.passwordUpdated });
  } catch (error) {
    logger.error('Error al cambiar contraseña', { error: error.message, userId: req.user._id });
    res.status(500).json({ 
      message: req.apiCopy.changePasswordError,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Eliminar cuenta (soft delete)
router.delete('/me', authenticateToken, validateUserObjectId, deleteUserLimiter, async (req, res) => {
  try {
    const user = await findUserById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: req.apiCopy.userNotFound });
    }

    const userId = req.user._id;

    // Cancelar suscripciones activas antes de eliminar la cuenta
    try {
      const Subscription = (await import('../models/Subscription.js')).default;
      const paymentService = (await import('../services/paymentService.js')).default;
      const paymentAuditService = (await import('../services/paymentAuditService.js')).default;

      // Buscar suscripciones activas
      const activeSubscriptions = await Subscription.find({
        userId: userId,
        status: { $in: ['active', 'trialing'] },
      });

      if (activeSubscriptions.length > 0) {
        logger.info(`Cancelando ${activeSubscriptions.length} suscripción(es) activa(s) para usuario ${userId}`);

        // Cancelar cada suscripción activa
        for (const subscription of activeSubscriptions) {
          try {
            // Cancelar inmediatamente en el proveedor correspondiente
            // Verificar si es suscripción de Mercado Pago
            const isMercadoPago = subscription.mercadopagoSubscriptionId || 
                                  subscription.mercadopagoTransactionId ||
                                  subscription.mercadopagoPreferenceId ||
                                  (subscription.metadata && subscription.metadata.provider === 'mercadopago');
            
            // Verificar si es suscripción de Apple
            const isApple = (subscription.metadata && subscription.metadata.provider === 'apple') ||
                           (subscription.metadata && subscription.metadata.appleTransactionId) ||
                           (subscription.metadata && subscription.metadata.productId && subscription.metadata.productId.startsWith('com.anto.app'));

            if (isMercadoPago) {
              try {
                await paymentService.cancelSubscription(userId, true); // Cancelar inmediatamente
                logger.info(`Suscripción de Mercado Pago cancelada para usuario ${userId}`);
              } catch (mpError) {
                logger.warn(`Error cancelando suscripción de Mercado Pago: ${mpError.message}`);
                // Continuar con la cancelación local aunque falle en Mercado Pago
              }
            } else if (isApple) {
              // Para suscripciones de Apple, no podemos cancelarlas directamente desde el backend
              // Apple maneja las cancelaciones desde la app o App Store Connect
              // Solo actualizamos el estado local
              logger.info(`Suscripción de Apple detectada para usuario ${userId}. Cancelación local aplicada.`);
              // Nota: El usuario debería cancelar desde la app iOS o App Store Connect
            } else {
              // Proveedor desconocido o sin proveedor específico, cancelar localmente
              logger.info(`Suscripción sin proveedor específico detectada para usuario ${userId}. Cancelación local aplicada.`);
            }

            const cancellationDate = new Date();

            // Cancelar suscripción en base de datos (cancelar inmediatamente)
            subscription.status = 'canceled';
            subscription.canceledAt = cancellationDate;
            subscription.endedAt = cancellationDate;
            subscription.cancelAtPeriodEnd = false;
            
            // Agregar información de cancelación en metadata
            subscription.metadata = {
              ...subscription.metadata,
              canceledOnAccountDeletion: true,
              accountDeletedAt: cancellationDate.toISOString(),
              canceledBy: 'account_deletion',
            };
            
            await subscription.save();

            // Determinar proveedor para auditoría
            let provider = 'unknown';
            if (isMercadoPago) {
              provider = 'mercadopago';
            } else if (isApple) {
              provider = 'apple';
            } else if (subscription.metadata && subscription.metadata.provider) {
              provider = subscription.metadata.provider;
            }

            // Registrar evento de auditoría
            await paymentAuditService.logEvent('SUBSCRIPTION_CANCELED_ON_ACCOUNT_DELETION', {
              subscriptionId: subscription._id.toString(),
              userId: userId.toString(),
              plan: subscription.plan,
              provider: provider,
              canceledAt: subscription.canceledAt,
              isMercadoPago,
              isApple,
            }, userId.toString(), null);

            logger.info(`Suscripción ${subscription._id} cancelada por eliminación de cuenta`);
          } catch (subError) {
            logger.error(`Error cancelando suscripción ${subscription._id}:`, subError);
            // Continuar con otras suscripciones aunque una falle
          }
        }
      }

      // Actualizar estado de suscripción en el modelo User
      if (user.subscription && (user.subscription.status === 'premium' || user.subscription.status === 'trial')) {
        user.subscription.status = 'expired';
        user.subscription.subscriptionEndDate = new Date();
      }
    } catch (subscriptionError) {
      logger.error('Error cancelando suscripciones al eliminar cuenta:', subscriptionError);
      // Continuar con la eliminación de cuenta aunque falle la cancelación de suscripciones
    }

    // Soft delete: desactivar cuenta y modificar email/username para evitar conflictos
    user.isActive = false;
    user.email = `${user.email}_deleted_${Date.now()}`;
    // Asegurar que el username no exceda 20 caracteres
    const timestamp = Date.now().toString().slice(-6);
    const baseUsername = user.username.slice(0, 10); // Tomar primeros 10 caracteres
    user.username = `${baseUsername}_del_${timestamp}`.slice(0, 20); // Asegurar máximo 20 caracteres
    user.deletedAt = new Date();
    await user.save();

    res.json({ 
      message: req.apiCopy.accountDeleted,
      deletedAt: user.deletedAt
    });
  } catch (error) {
    logger.error('Error al eliminar cuenta', { error: error.message, userId: req.user._id });
    res.status(500).json({ 
      message: req.apiCopy.deleteAccountError,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

router.patch('/me/onboarding-preferences', authenticateToken, validateUserObjectId, updateProfileLimiter, async (req, res) => {
  try {
    const userId = req.user._id || req.user.userId;
    if (!userId) {
      return res.status(401).json({ message: req.apiCopy.notAuthenticated });
    }
    const { error, value } = validateBody(getOnboardingPreferencesSchema(), req.body);
    if (error) {
      return res.status(400).json(validationErrorBody(req.apiCopy, error));
    }
    const update = {};
    if (value.whatExpectFromApp !== undefined) update['onboardingAnswers.whatExpectFromApp'] = value.whatExpectFromApp || null;
    if (value.whatToImproveOrWorkOn !== undefined) update['onboardingAnswers.whatToImproveOrWorkOn'] = value.whatToImproveOrWorkOn || null;
    if (value.typeOfSpecialist !== undefined) update['onboardingAnswers.typeOfSpecialist'] = value.typeOfSpecialist || null;
    await userProfileService.getOrCreateProfile(userId);
    const profile = await UserProfile.findOneAndUpdate(
      { userId },
      { $set: update },
      { new: true }
    ).lean();
    await cacheService.invalidateUserCache(userId.toString());
    return res.json({
      message: req.apiCopy.onboardingSaved,
      onboardingAnswers: profile?.onboardingAnswers || {}
    });
  } catch (err) {
    logger.error('Error al guardar preferencias de onboarding', { error: err.message, userId: req.user?._id });
    return res.status(500).json({
      message: req.apiCopy.onboardingSaveError,
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

router.post('/me/accept-terms', authenticateToken, validateUserObjectId, async (req, res) => {
  try {
    const userId = req.user._id || req.user.userId;
    
    if (!userId) {
      return res.status(401).json({ message: req.apiCopy.notAuthenticated });
    }

    const { error, value } = validateBody(getReacceptTermsSchema(req.apiCopy), req.body);
    if (error) {
      return res.status(400).json(validationErrorBody(req.apiCopy, error));
    }

    const user = await findUserById(userId);
    if (!user) {
      return res.status(404).json({ message: req.apiCopy.userNotFound });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: req.apiCopy.accountDeactivated });
    }

    // Actualizar aceptación de términos y privacidad
    user.termsAccepted = true;
    user.termsAcceptedAt = new Date();
    user.privacyAccepted = true;
    user.privacyAcceptedAt = new Date();
    user.termsVersion = CURRENT_TERMS_VERSION;
    
    await user.save();

    // Invalidar caché del usuario
    await cacheService.invalidateUserCache(userId);

    res.json({
      message: req.apiCopy.termsAccepted,
      termsVersion: CURRENT_TERMS_VERSION,
      acceptedAt: new Date()
    });
  } catch (error) {
    logger.error('Error al re-aceptar términos', { error: error.message, userId: req.user._id });
    res.status(500).json({
      message: req.apiCopy.termsAcceptError,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Obtener información de suscripción
router.get('/me/subscription', authenticateToken, validateUserObjectId, async (req, res) => {
  try {
    const user = await findUserById(req.user._id, 'subscription', true);
    
    if (!user) {
      return res.status(404).json({ message: req.apiCopy.userNotFound });
    }

    const subscription = user.subscription;
    
    // Calcular días restantes de prueba y suscripción
    const trialDaysLeft = calculateDaysLeft(subscription.trialEndDate);
    const subscriptionDaysLeft = calculateDaysLeft(subscription.subscriptionEndDate);

    res.json({
      ...subscription,
      trialDaysLeft,
      subscriptionDaysLeft
    });
  } catch (error) {
    logger.error('Error al obtener información de suscripción', { error: error.message, userId: req.user._id });
    res.status(500).json({ 
      message: req.apiCopy.subscriptionError,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ========== RUTAS DE CONTACTOS DE EMERGENCIA ==========

// Obtener contactos de emergencia del usuario
router.get('/me/emergency-contacts', authenticateToken, validateUserObjectId, async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.userId;
    
    if (!userId) {
      return res.status(401).json({ message: req.apiCopy.notAuthenticated });
    }
    
    // Asegurar que req.user._id sea un ObjectId válido
    const userIdObjectId = mongoose.Types.ObjectId.isValid(userId) 
      ? new mongoose.Types.ObjectId(userId) 
      : userId;
    
    const user = await User.findById(userIdObjectId)
      .select('emergencyContacts')
      .lean();
    if (!user) {
      return res.status(404).json({ message: req.apiCopy.userNotFound });
    }

    res.json({
      contacts: user.emergencyContacts || [],
      maxContacts: 2,
      currentCount: user.emergencyContacts?.length || 0
    });
  } catch (error) {
    logger.error('Error al obtener contactos de emergencia', { error: error.message, userId: req.user._id });
    res.status(500).json({ 
      message: req.apiCopy.emergencyContactsError,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Agregar un contacto de emergencia
router.post('/me/emergency-contacts', authenticateToken, validateUserObjectId, async (req, res) => {
  try {
    const { error, value } = validateBody(getEmergencyContactSchema(req.apiCopy), req.body, { allowUnknown: false });
    
    if (error) {
      logger.warn('Error de validación en contacto de emergencia', { errors: error.details.map(d => d.message), userId: req.user._id });
      return res.status(400).json(validationErrorBody(req.apiCopy, error));
    }

    // Asegurar que req.user._id sea un ObjectId válido
    const userId = mongoose.Types.ObjectId.isValid(req.user._id) 
      ? new mongoose.Types.ObjectId(req.user._id) 
      : req.user._id;
    
    const user = await User.findById(userId)
      .select('emergencyContacts name')
      .lean();
    if (!user) {
      return res.status(404).json({ message: req.apiCopy.userNotFound });
    }

    // Verificar límite de contactos
    if (user.emergencyContacts && user.emergencyContacts.length >= 2) {
      return res.status(400).json({ 
        message: req.apiCopy.emergencyContactsLimit
      });
    }

    // Verificar que no exista un contacto con el mismo email
    if (user.emergencyContacts && user.emergencyContacts.some(c => c.email === value.email.toLowerCase())) {
      return res.status(400).json({ 
        message: req.apiCopy.emergencyContactEmailExists
      });
    }

    // Validación básica de email (verificar formato)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value.email.toLowerCase())) {
      return res.status(400).json({ 
        message: req.apiCopy.invalidEmailFormat
      });
    }

    // Agregar el nuevo contacto usando findByIdAndUpdate para evitar problemas de versión
    const newContact = {
      name: value.name,
      email: value.email.toLowerCase(),
      phone: value.phone.trim(),
      relationship: value.relationship || null,
      enabled: true
    };
    
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $push: { emergencyContacts: newContact } },
      { new: true, select: 'emergencyContacts name username' }
    );
    
    if (!updatedUser) {
      return res.status(404).json({ message: req.apiCopy.userNotFound });
    }

    const response = {
      message: req.apiCopy.emergencyContactAdded,
      contact: updatedUser.emergencyContacts[updatedUser.emergencyContacts.length - 1]
    };

    res.status(201).json(response);
  } catch (error) {
    logger.error('Error al agregar contacto de emergencia', { error: error.message, userId: req.user._id });
    res.status(500).json({ 
      message: req.apiCopy.emergencyContactAddError,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Actualizar un contacto de emergencia
router.put('/me/emergency-contacts/:contactId', authenticateToken, validateUserObjectId, async (req, res) => {
  try {
    const { contactId } = req.params;
    const { error, value } = validateBody(getEmergencyContactSchema(req.apiCopy), req.body);
    
    if (error) {
      return res.status(400).json(validationErrorBody(req.apiCopy, error));
    }

    if (!isValidObjectId(contactId)) {
      return res.status(400).json({ message: req.apiCopy.invalidContactId });
    }

    // Asegurar que req.user._id sea un ObjectId válido
    const userId = mongoose.Types.ObjectId.isValid(req.user._id) 
      ? new mongoose.Types.ObjectId(req.user._id) 
      : req.user._id;
    
    const user = await User.findById(userId).select('emergencyContacts');
    
    if (!user || !user.emergencyContacts) {
      return res.status(404).json({ message: req.apiCopy.userOrContactNotFound });
    }

    const contactIndex = user.emergencyContacts.findIndex(
      c => c._id.toString() === contactId
    );

    if (contactIndex === -1) {
      return res.status(404).json({ message: req.apiCopy.emergencyContactNotFound });
    }

    // Verificar que el nuevo email no esté en uso por otro contacto
    const emailInUse = user.emergencyContacts.some(
      (c, index) => index !== contactIndex && c.email === value.email.toLowerCase()
    );

    if (emailInUse) {
      return res.status(400).json({ 
        message: req.apiCopy.emergencyContactEmailDuplicate
      });
    }

    // Actualizar el contacto
    user.emergencyContacts[contactIndex] = {
      ...user.emergencyContacts[contactIndex].toObject(),
      name: value.name,
      email: value.email.toLowerCase(),
      phone: value.phone.trim(),
      relationship: value.relationship || null
    };

    await user.save();

    res.json({
      message: req.apiCopy.emergencyContactUpdated,
      contact: user.emergencyContacts[contactIndex]
    });
  } catch (error) {
    logger.error('Error al actualizar contacto de emergencia', { error: error.message, userId: req.user._id });
    res.status(500).json({ 
      message: req.apiCopy.emergencyContactUpdateError,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Eliminar un contacto de emergencia
router.delete('/me/emergency-contacts/:contactId', authenticateToken, validateUserObjectId, deleteContactLimiter, async (req, res) => {
  try {
    const { contactId } = req.params;

    if (!isValidObjectId(contactId)) {
      return res.status(400).json({ message: req.apiCopy.invalidContactId });
    }

    // Asegurar que req.user._id sea un ObjectId válido
    const userId = mongoose.Types.ObjectId.isValid(req.user._id) 
      ? new mongoose.Types.ObjectId(req.user._id) 
      : req.user._id;
    
    const user = await User.findById(userId).select('emergencyContacts');
    
    if (!user || !user.emergencyContacts) {
      return res.status(404).json({ message: req.apiCopy.userOrContactNotFound });
    }

    const contactIndex = user.emergencyContacts.findIndex(
      c => c._id.toString() === contactId
    );

    if (contactIndex === -1) {
      return res.status(404).json({ message: req.apiCopy.emergencyContactNotFound });
    }

    user.emergencyContacts.splice(contactIndex, 1);
    await user.save();

    res.json({
      message: req.apiCopy.emergencyContactDeleted
    });
  } catch (error) {
    logger.error('Error al eliminar contacto de emergencia', { error: error.message, userId: req.user._id });
    res.status(500).json({ 
      message: req.apiCopy.emergencyContactDeleteError,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Habilitar/deshabilitar un contacto de emergencia
router.patch('/me/emergency-contacts/:contactId/toggle', authenticateToken, validateUserObjectId, patchContactLimiter, async (req, res) => {
  try {
    const { contactId } = req.params;

    if (!isValidObjectId(contactId)) {
      return res.status(400).json({ message: req.apiCopy.invalidContactId });
    }

    // Asegurar que req.user._id sea un ObjectId válido
    const userId = mongoose.Types.ObjectId.isValid(req.user._id) 
      ? new mongoose.Types.ObjectId(req.user._id) 
      : req.user._id;
    
    const user = await User.findById(userId).select('emergencyContacts');
    
    if (!user || !user.emergencyContacts) {
      return res.status(404).json({ message: req.apiCopy.userOrContactNotFound });
    }

    const contact = user.emergencyContacts.find(
      c => c._id.toString() === contactId
    );

    if (!contact) {
      return res.status(404).json({ message: req.apiCopy.emergencyContactNotFound });
    }

    contact.enabled = !contact.enabled;
    await user.save();

    res.json({
      message: contact.enabled ? req.apiCopy.contactToggleEnabled : req.apiCopy.contactToggleDisabled,
      contact: {
        _id: contact._id,
        name: contact.name,
        email: contact.email,
        enabled: contact.enabled
      }
    });
  } catch (error) {
    logger.error('Error al cambiar estado del contacto', { error: error.message, userId: req.user._id });
    res.status(500).json({ 
      message: req.apiCopy.emergencyContactToggleError,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Endpoint legado de email de prueba (deshabilitado para evitar confusión de canales)
router.post('/me/emergency-contacts/:contactId/test', authenticateToken, validateUserObjectId, async (req, res) => {
  return res.status(410).json({
    message: req.apiCopy.emailTestDisabled
  });
});

// Confirmar alerta a contactos desde oferta MEDIUM en chat (protocolo v1)
router.post('/me/emergency-contacts/alert-from-chat', authenticateToken, validateUserObjectId, async (req, res) => {
  try {
    const { offerId, conversationId } = req.body || {};
    const Conversation = (await import('../models/Conversation.js')).default;
    const {
      confirmEmergencyContactAlertFromChat,
      isValidConversationIdForOffer,
      validateContactAlertOfferConfirmation,
    } = await import('../services/crisisContactAlertOfferService.js');
    const { markConversationContactAlertSent } = await import(
      '../services/crisisTurnClientExtrasService.js'
    );

    if (!isValidConversationIdForOffer(conversationId)) {
      return res.status(400).json({ message: req.apiCopy.invalidRequest || 'Solicitud inválida' });
    }

    const conversation = await Conversation.findById(conversationId).select(
      'userId crisisProtocolState',
    );
    const validation = validateContactAlertOfferConfirmation({
      offerId,
      conversation,
      userId: req.user._id,
    });
    if (!validation.ok) {
      return res.status(validation.status).json({
        message: req.apiCopy.invalidRequest || 'Solicitud inválida',
        code: validation.code,
      });
    }

    const result = await confirmEmergencyContactAlertFromChat(req.user._id, {
      riskLevel: 'MEDIUM',
      messageContent: null,
      metadata: { offerId, conversationId: String(conversationId), source: 'chat_offer_confirmed' },
    });

    await markConversationContactAlertSent(conversationId);

    if (!result.sent) {
      return res.status(400).json({
        message: result.reason || req.apiCopy.testAlertFailed,
        result,
      });
    }

    return res.json({
      success: true,
      result: {
        totalContacts: result.totalContacts,
        successfulSends: result.successfulSends,
        successfulWhatsApp: result.successfulWhatsApp,
      },
    });
  } catch (error) {
    logger.error('Error al confirmar alerta desde chat', { error: error.message, userId: req.user._id });
    return res.status(500).json({
      message: req.apiCopy.testAlertError,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

// Rechazar oferta MEDIUM en chat (no re-ofertar en la misma sesión de protocolo)
router.post('/me/emergency-contacts/dismiss-alert-from-chat', authenticateToken, validateUserObjectId, async (req, res) => {
  try {
    const { conversationId } = req.body || {};
    const { isValidConversationIdForOffer } = await import(
      '../services/crisisContactAlertOfferService.js'
    );
    const { dismissContactAlertOffer } = await import(
      '../services/crisisTurnClientExtrasService.js'
    );

    if (!isValidConversationIdForOffer(conversationId)) {
      return res.status(400).json({ message: req.apiCopy.invalidRequest || 'Solicitud inválida' });
    }

    const outcome = await dismissContactAlertOffer(conversationId, req.user._id);
    if (!outcome.ok) {
      return res.status(outcome.status).json({
        message: req.apiCopy.invalidRequest || 'Solicitud inválida',
        code: outcome.code,
      });
    }

    return res.json({ success: true });
  } catch (error) {
    logger.error('Error al rechazar oferta de alerta desde chat', {
      error: error.message,
      userId: req.user._id,
    });
    return res.status(500).json({
      message: req.apiCopy.testAlertError,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

// Ocultar check-in crisis suave (#19) sin salir del flujo de regulación en servidor
router.post('/me/emergency-contacts/dismiss-soft-check-in-from-chat', authenticateToken, validateUserObjectId, async (req, res) => {
  try {
    const { conversationId } = req.body || {};
    const { isValidConversationIdForOffer } = await import(
      '../services/crisisContactAlertOfferService.js'
    );
    const { dismissSoftCrisisCheckInForConversation } = await import(
      '../services/crisisTurnClientExtrasService.js'
    );

    if (!isValidConversationIdForOffer(conversationId)) {
      return res.status(400).json({ message: req.apiCopy.invalidRequest || 'Solicitud inválida' });
    }

    const outcome = await dismissSoftCrisisCheckInForConversation(conversationId, req.user._id);
    if (!outcome.ok) {
      return res.status(outcome.status).json({
        message: req.apiCopy.invalidRequest || 'Solicitud inválida',
        code: outcome.code,
      });
    }

    return res.json({ success: true });
  } catch (error) {
    logger.error('Error al rechazar check-in suave desde chat', {
      error: error.message,
      userId: req.user._id,
    });
    return res.status(500).json({
      message: req.apiCopy.testAlertError,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

// Probar alertas de emergencia (envía alerta de prueba a todos los contactos)
router.post('/me/emergency-contacts/test-alert', authenticateToken, validateUserObjectId, async (req, res) => {
  try {
    const emergencyAlertService = (await import('../services/emergencyAlertService.js')).default;
    
    // Enviar alerta de prueba con nivel MEDIUM (simulado)
    const result = await emergencyAlertService.sendEmergencyAlerts(
      req.user._id,
      'MEDIUM', // Nivel de riesgo simulado para prueba
      req.apiCopy.emergencyTestAlertBody,
      { isTest: true } // Marcar como prueba
    );

    if (result.sent) {
      const message = req.apiCopy.testAlertSent(result.successfulSends, result.totalContacts, result.successfulWhatsApp || 0)

      res.json({
        message,
        result: {
          totalContacts: result.totalContacts,
          successfulSends: result.successfulSends,
          successfulWhatsApp: result.successfulWhatsApp,
          contacts: result.contacts
        }
      });
    } else {
      res.status(400).json({
        message: result.reason || req.apiCopy.testAlertFailed,
        result
      });
    }
  } catch (error) {
    logger.error('Error al enviar alerta de prueba', { error: error.message, userId: req.user._id });
    res.status(500).json({ 
      message: req.apiCopy.testAlertError,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Enviar mensaje de prueba de WhatsApp a un contacto
router.post('/me/emergency-contacts/:contactId/test-whatsapp', authenticateToken, validateUserObjectId, async (req, res) => {
  try {
    const { contactId } = req.params;

    if (!isValidObjectId(contactId)) {
      return res.status(400).json({ message: req.apiCopy.invalidContactId });
    }

    // Asegurar que req.user._id sea un ObjectId válido
    const userId = mongoose.Types.ObjectId.isValid(req.user._id) 
      ? new mongoose.Types.ObjectId(req.user._id) 
      : req.user._id;
    
    const user = await User.findById(userId)
      .select('emergencyContacts name username email preferences.language')
      .lean();
    if (!user || !user.emergencyContacts) {
      return res.status(404).json({ message: req.apiCopy.userOrContactNotFound });
    }
    const contact = user.emergencyContacts.find(
      c => c._id.toString() === contactId
    );
    if (!contact) {
      return res.status(404).json({ message: req.apiCopy.emergencyContactNotFound });
    }

    if (!contact.phone) {
      return res.status(400).json({ message: req.apiCopy.contactNoPhone });
    }

    // Importar servicio de WhatsApp (Twilio)
    const whatsappService = (await import('../services/whatsappService.js')).default;
    
    if (!whatsappService.isConfigured()) {
      return res.status(400).json({
        message: req.apiCopy.whatsappNotConfigured,
        details: {
          twilio: 'No configurado',
          required: [
            'TWILIO_ACCOUNT_SID',
            'TWILIO_AUTH_TOKEN',
            'TWILIO_WHATSAPP_NUMBER'
          ]
        },
        help: 'Configura Twilio. Ver: backend/docs/WHATSAPP_SETUP.md'
      });
    }

    const userLanguage = user.preferences?.language || 'es';
    const userInfo = { name: user.name || user.username || 'Usuario', email: user.email };

    logger.info('Enviando mensaje de prueba de WhatsApp', { phone: contact.phone, userId: req.user._id });
    const result = await whatsappService.sendTestMessage(contact.phone, userInfo, userLanguage);

    if (result && result.success) {
      const response = {
        message: req.apiCopy.whatsappTestSent,
        service: 'Twilio WhatsApp',
        contact: {
          _id: contact._id,
          name: contact.name,
          phone: contact.phone
        },
        messageId: result.messageId,
        status: result.status
      };

      // Agregar advertencia si el mensaje está en cola
      if (result.warning) {
        response.warning = result.warning;
        response.help = {
          message: req.apiCopy.whatsappQueueHelp,
          reasons: [
            'El número no está verificado en Twilio Sandbox',
            'El número no tiene WhatsApp activo',
            'Estás en modo sandbox y solo puedes enviar a números verificados'
          ],
          action: 'Verifica el número en Twilio Console > Messaging > Try it out > WhatsApp Sandbox',
          link: 'https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn'
        };
      }

      res.json(response);
    } else {
      res.status(400).json({
        message: result?.error || req.apiCopy.whatsappSendFailed,
        service: 'Twilio WhatsApp',
        contact: {
          _id: contact._id,
          name: contact.name,
          phone: contact.phone
        },
        error: result?.error || req.apiCopy.unknownError,
        details: result || req.apiCopy.noServiceResponse
      });
    }
  } catch (error) {
    logger.error('Error al enviar mensaje de prueba de WhatsApp', { error: error.message, userId: req.user._id });
    res.status(500).json({ 
      message: req.apiCopy.whatsappTestError,
      error: process.env.NODE_ENV === 'development' ? error.message : req.apiCopy.internalServerError,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Verificar estado de un mensaje de WhatsApp
router.get('/me/whatsapp-message-status/:messageSid', authenticateToken, validateUserObjectId, async (req, res) => {
  try {
    const { messageSid } = req.params;

    if (!messageSid || !messageSid.startsWith('SM')) {
      return res.status(400).json({ 
        message: req.apiCopy.invalidMessageSid 
      });
    }

    const whatsappService = (await import('../services/whatsappService.js')).default;
    
    if (!whatsappService.isConfigured()) {
      return res.status(400).json({
        message: req.apiCopy.whatsappNotConfigured
      });
    }

    const status = await whatsappService.getMessageStatus(messageSid);

    if (status.success) {
      res.json({
        message: req.apiCopy.messageStatusSuccess,
        status: status.status,
        messageId: status.sid,
        details: {
          to: status.to,
          from: status.from,
          dateCreated: status.dateCreated,
          dateSent: status.dateSent,
          dateUpdated: status.dateUpdated,
          errorCode: status.errorCode,
          errorMessage: status.errorMessage,
          price: status.price,
          priceUnit: status.priceUnit,
          ...status.details
        },
        help: {
          statusMeanings: req.apiCopy.whatsappStatusMeanings,
          commonIssues: req.apiCopy.whatsappCommonIssues,
        }
      });
    } else {
      res.status(400).json({
        message: req.apiCopy.messageStatusFailed,
        error: status.error,
        code: status.code
      });
    }
  } catch (error) {
    logger.error('Error al obtener estado del mensaje de WhatsApp', { error: error.message, userId: req.user._id });
    res.status(500).json({ 
      message: req.apiCopy.messageStatusError,
      error: process.env.NODE_ENV === 'development' ? error.message : req.apiCopy.internalServerError
    });
  }
});

// Obtener historial de alertas de emergencia
router.get('/me/emergency-alerts', authenticateToken, validateUserObjectId, async (req, res) => {
  try {
    const EmergencyAlert = (await import('../models/EmergencyAlert.js')).default;
    const {
      limit = 50,
      skip = 0,
      startDate,
      endDate,
      riskLevel,
      status
    } = req.query;

    const options = {
      limit: parseInt(limit),
      skip: parseInt(skip),
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      riskLevel: riskLevel || null,
      status: status || null
    };

    const alerts = await EmergencyAlert.getUserAlerts(req.user._id, options);

    res.json({
      success: true,
      data: alerts,
      pagination: {
        limit: options.limit,
        skip: options.skip,
        total: alerts.length
      }
    });
  } catch (error) {
    logger.error('Error obteniendo historial de alertas', { error: error.message, userId: req.user._id });
    res.status(500).json({
      message: req.apiCopy.alertsHistoryError,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Obtener estadísticas de alertas
router.get('/me/emergency-alerts/stats', authenticateToken, validateUserObjectId, async (req, res) => {
  try {
    const EmergencyAlert = (await import('../models/EmergencyAlert.js')).default;
    const { days = 30 } = req.query;

    const stats = await EmergencyAlert.getUserAlertStats(req.user._id, parseInt(days));

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Error obteniendo estadísticas de alertas', { error: error.message, userId: req.user._id });
    res.status(500).json({
      message: req.apiCopy.alertsStatsError,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Obtener patrones detectados en las alertas
router.get('/me/emergency-alerts/patterns', authenticateToken, validateUserObjectId, async (req, res) => {
  try {
    const EmergencyAlert = (await import('../models/EmergencyAlert.js')).default;
    const { days = 90 } = req.query;

    const patterns = await EmergencyAlert.detectPatterns(req.user._id, parseInt(days));

    res.json({
      success: true,
      data: patterns
    });
  } catch (error) {
    logger.error('Error detectando patrones de alertas', { error: error.message, userId: req.user._id });
    res.status(500).json({
      message: req.apiCopy.alertsPatternsError,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;