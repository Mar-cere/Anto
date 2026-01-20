/**
 * Rutas de Usuario - Gestiona perfil, contraseña, suscripción y eliminación de cuenta
 */
import cloudinary from 'cloudinary';
import crypto from 'crypto';
import express from 'express';
import rateLimit from 'express-rate-limit';
import Joi from 'joi';
import mongoose from 'mongoose';
import { authenticateToken } from '../middleware/auth.js';
import { validateUserObjectId } from '../middleware/validation.js';
import User from '../models/User.js';
import logger from '../utils/logger.js';
import cacheService from '../services/cacheService.js';
import { CURRENT_TERMS_VERSION } from '../constants/app.js';

// Helper para validar ObjectId
const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

const router = express.Router();

// Constantes de configuración
const MILLISECONDS_PER_DAY = 1000 * 60 * 60 * 24;

// Rate limiters: control de frecuencia de peticiones
const updateProfileLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10,
  message: 'Demasiadas actualizaciones de perfil. Por favor, intente más tarde.',
  standardHeaders: true,
  legacyHeaders: false
});


const deleteUserLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3,
  message: 'Demasiados intentos de eliminación de cuenta. Por favor, intente más tarde.',
  standardHeaders: true,
  legacyHeaders: false
});

const deleteContactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10,
  message: 'Demasiadas eliminaciones de contactos. Por favor, intente más tarde.',
  standardHeaders: true,
  legacyHeaders: false
});

const patchContactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 20,
  message: 'Demasiadas modificaciones de contactos. Por favor, intente más tarde.',
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

// Esquemas de validación Joi
const updateProfileSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(50)
    .trim()
    .optional()
    .messages({
      'string.min': 'El nombre debe tener al menos 2 caracteres',
      'string.max': 'El nombre debe tener máximo 50 caracteres'
    }),
  username: Joi.string()
    .min(3)
    .max(20)
    .pattern(/^[a-z0-9_]+$/)
    .trim()
    .lowercase()
    .optional()
    .messages({
      'string.min': 'El nombre de usuario debe tener al menos 3 caracteres',
      'string.max': 'El nombre de usuario debe tener máximo 20 caracteres',
      'string.pattern.base': 'El nombre de usuario solo puede contener letras minúsculas, números y guiones bajos'
    }),
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .trim()
    .lowercase()
    .optional()
    .messages({
      'string.email': 'Por favor ingresa un email válido'
    }),
  preferences: Joi.object({
    theme: Joi.string().valid('light', 'dark', 'auto'),
    notifications: Joi.boolean(),
    language: Joi.string().valid('es', 'en'),
    responseStyle: Joi.string().valid('brief', 'balanced', 'deep', 'empatico', 'profesional', 'directo', 'calido', 'estructurado'),
    privacy: Joi.object({
      profileVisibility: Joi.string().valid('public', 'private', 'friends')
    })
  }).optional(),
  notificationPreferences: Joi.object({
    enabled: Joi.boolean(),
    morning: Joi.object({
      enabled: Joi.boolean(),
      hour: Joi.number().min(0).max(23),
      minute: Joi.number().min(0).max(59)
    }),
    evening: Joi.object({
      enabled: Joi.boolean(),
      hour: Joi.number().min(0).max(23),
      minute: Joi.number().min(0).max(59)
    }),
    types: Joi.object({
      dailyReminders: Joi.boolean(),
      habitReminders: Joi.boolean(),
      taskReminders: Joi.boolean(),
      motivationalMessages: Joi.boolean()
    })
  }).optional(),
});

const updatePasswordSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    'any.required': 'La contraseña actual es requerida'
  }),
  newPassword: Joi.string()
    .min(8)
    .required()
    .messages({
      'string.min': 'La nueva contraseña debe tener al menos 8 caracteres',
      'any.required': 'La nueva contraseña es requerida'
    })
});

// Obtener datos del usuario actual
router.get('/me', authenticateToken, validateUserObjectId, async (req, res) => {
  try {
    // Asegurar que tenemos un userId válido
    const userId = req.user?._id || req.user?.userId;
    
    if (!userId) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }

    // Intentar obtener del caché primero
    const cacheKey = cacheService.generateKey('user', userId);
    const cachedUser = await cacheService.get(cacheKey);
    
    if (cachedUser) {
      return res.json(cachedUser);
    }

    const user = await findUserById(userId, '-password -salt -__v -resetPasswordCode -resetPasswordExpires', true);
    
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Tu cuenta ha sido desactivada' });
    }

    // Calcular tiempo desde último login (en segundos)
    const lastLogin = user.lastLogin ? new Date(user.lastLogin) : null;
    const timeSinceLastLogin = lastLogin ? Math.floor((Date.now() - lastLogin.getTime()) / 1000) : null;

    // Calcular días desde el registro
    const daysSinceRegistration = calculateDaysSince(user.createdAt);

    const userResponse = {
      ...user,
      timeSinceLastLogin,
      daysSinceRegistration
    };

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
        message: 'Servicio temporalmente no disponible. La base de datos no está conectada.',
        error: 'DATABASE_CONNECTION_ERROR'
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener datos del usuario',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Obtener estadísticas del usuario
router.get('/me/stats', authenticateToken, validateUserObjectId, async (req, res) => {
  try {
    const user = await findUserById(req.user._id, 'stats subscription createdAt', true);
    
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
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
      message: 'Error al obtener estadísticas',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Actualizar perfil del usuario
router.put('/me', authenticateToken, validateUserObjectId, updateProfileLimiter, async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.userId;
    
    if (!userId) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }

    // Validar datos de entrada
    const { error, value } = updateProfileSchema.validate(req.body, { stripUnknown: true });
    if (error) {
      return res.status(400).json({ 
        message: 'Datos inválidos',
        errors: error.details.map(detail => detail.message)
      });
    }

    const user = await findUserById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Tu cuenta ha sido desactivada' });
    }

    // Verificar unicidad de email y username si se están actualizando
    if (value.email && value.email !== user.email) {
      const existingEmail = await User.findOne({ email: value.email });
      if (existingEmail) {
        return res.status(400).json({ message: 'El email ya está en uso' });
      }
    }

    if (value.username && value.username !== user.username) {
      const existingUsername = await User.findOne({ username: value.username });
      if (existingUsername) {
        return res.status(400).json({ message: 'El nombre de usuario ya está en uso' });
      }
    }

    // Actualizar campos (merge para objetos anidados)
    Object.keys(value).forEach(key => {
      if (key === 'preferences') {
        // Asegurar que user.preferences existe antes de hacer el spread
        user.preferences = {
          ...(user.preferences || {}),
          ...value.preferences
        };
      } else if (key === 'notificationPreferences') {
        // Asegurar que user.notificationPreferences existe antes de hacer el spread
        user.notificationPreferences = {
          ...(user.notificationPreferences || {}),
          ...value.notificationPreferences
        };
      } else {
        user[key] = value[key];
      }
    });

    // Guardar (Mongoose timestamps maneja updatedAt automáticamente)
    await user.save();

    // Invalidar caché del usuario (userId ya está declarado arriba)
    await cacheService.invalidateUserCache(userId);

    res.json({
      message: 'Perfil actualizado correctamente',
      user: user.toJSON()
    });
  } catch (error) {
    logger.error('Error al actualizar usuario', { error: error.message, userId: req.user._id });
    res.status(400).json({ 
      message: 'Error al actualizar el perfil',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Cambiar contraseña del usuario
router.put('/me/password', authenticateToken, validateUserObjectId, updateProfileLimiter, async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.userId;
    
    if (!userId) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }

    const { error, value } = updatePasswordSchema.validate(req.body, { stripUnknown: true });
    if (error) {
      return res.status(400).json({
        message: 'Datos inválidos',
        errors: error.details.map(detail => detail.message)
      });
    }

    const { currentPassword, newPassword } = value;

    const user = await findUserById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Verificar contraseña actual
    if (!user.comparePassword(currentPassword)) {
      return res.status(400).json({ message: 'La contraseña actual es incorrecta' });
    }

    // Verificar que la nueva contraseña sea diferente
    if (user.comparePassword(newPassword)) {
      return res.status(400).json({ message: 'La nueva contraseña debe ser diferente a la actual' });
    }

    // Hashear nueva contraseña
    const { salt, hash } = hashPassword(newPassword);
    
    user.password = hash;
    user.salt = salt;
    user.lastPasswordChange = new Date();
    await user.save();

    res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    logger.error('Error al cambiar contraseña', { error: error.message, userId: req.user._id });
    res.status(500).json({ 
      message: 'Error al cambiar la contraseña',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Eliminar cuenta (soft delete)
router.delete('/me', authenticateToken, validateUserObjectId, deleteUserLimiter, async (req, res) => {
  try {
    const user = await findUserById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
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

            // Cancelar suscripción en base de datos (cancelar inmediatamente)
            subscription.status = 'canceled';
            subscription.canceledAt = new Date();
            subscription.endedAt = new Date();
            subscription.cancelAtPeriodEnd = false;
            
            // Agregar información de cancelación en metadata
            subscription.metadata = {
              ...subscription.metadata,
              canceledOnAccountDeletion: true,
              accountDeletedAt: new Date().toISOString(),
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
      message: 'Cuenta eliminada correctamente',
      deletedAt: user.deletedAt
    });
  } catch (error) {
    logger.error('Error al eliminar cuenta', { error: error.message, userId: req.user._id });
    res.status(500).json({ 
      message: 'Error al eliminar la cuenta',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Re-aceptar términos y condiciones (cuando cambian)
const reacceptTermsSchema = Joi.object({
  termsAccepted: Joi.boolean().valid(true).required().messages({
    'any.only': 'Debes aceptar los términos y condiciones',
    'any.required': 'Debes aceptar los términos y condiciones'
  }),
  privacyAccepted: Joi.boolean().valid(true).required().messages({
    'any.only': 'Debes aceptar la política de privacidad',
    'any.required': 'Debes aceptar la política de privacidad'
  })
});

router.post('/me/accept-terms', authenticateToken, validateUserObjectId, async (req, res) => {
  try {
    const userId = req.user._id || req.user.userId;
    
    if (!userId) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }

    const { error, value } = reacceptTermsSchema.validate(req.body, { stripUnknown: true });
    if (error) {
      return res.status(400).json({
        message: 'Datos inválidos',
        errors: error.details.map(detail => detail.message)
      });
    }

    const user = await findUserById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Tu cuenta ha sido desactivada' });
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
      message: 'Términos y política de privacidad aceptados correctamente',
      termsVersion: CURRENT_TERMS_VERSION,
      acceptedAt: new Date()
    });
  } catch (error) {
    logger.error('Error al re-aceptar términos', { error: error.message, userId: req.user._id });
    res.status(500).json({
      message: 'Error al actualizar aceptación de términos',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Obtener información de suscripción
router.get('/me/subscription', authenticateToken, validateUserObjectId, async (req, res) => {
  try {
    const user = await findUserById(req.user._id, 'subscription', true);
    
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
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
      message: 'Error al obtener información de suscripción',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ========== RUTAS DE CONTACTOS DE EMERGENCIA ==========

// Esquema de validación para contactos de emergencia
const emergencyContactSchema = Joi.object({
  name: Joi.string().required().trim().min(2).max(100).messages({
    'string.empty': 'El nombre del contacto es requerido',
    'string.min': 'El nombre debe tener al menos 2 caracteres',
    'string.max': 'El nombre no puede exceder 100 caracteres'
  }),
  email: Joi.string().required().email().trim().lowercase().messages({
    'string.empty': 'El email del contacto es requerido',
    'string.email': 'Por favor ingresa un email válido'
  }),
  phone: Joi.string().allow(null, '').trim().max(20).optional(),
  relationship: Joi.string().allow(null, '').trim().max(50).optional()
});

// Obtener contactos de emergencia del usuario
router.get('/me/emergency-contacts', authenticateToken, validateUserObjectId, async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.userId;
    
    if (!userId) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }
    
    // Asegurar que req.user._id sea un ObjectId válido
    const userIdObjectId = mongoose.Types.ObjectId.isValid(userId) 
      ? new mongoose.Types.ObjectId(userId) 
      : userId;
    
    const user = await User.findById(userIdObjectId).select('emergencyContacts');
    
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.json({
      contacts: user.emergencyContacts || [],
      maxContacts: 2,
      currentCount: user.emergencyContacts?.length || 0
    });
  } catch (error) {
    logger.error('Error al obtener contactos de emergencia', { error: error.message, userId: req.user._id });
    res.status(500).json({ 
      message: 'Error al obtener contactos de emergencia',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Agregar un contacto de emergencia
router.post('/me/emergency-contacts', authenticateToken, validateUserObjectId, async (req, res) => {
  try {
    // Extraer sendTestEmail antes de validar (no es parte del esquema de contacto)
    const { sendTestEmail, ...contactData } = req.body;
    
    const { error, value } = emergencyContactSchema.validate(contactData, { 
      allowUnknown: false // No permitir campos desconocidos
    });
    
    if (error) {
      logger.warn('Error de validación en contacto de emergencia', { errors: error.details.map(d => d.message), userId: req.user._id });
      return res.status(400).json({ 
        message: 'Datos inválidos',
        errors: error.details.map(d => d.message)
      });
    }

    // Asegurar que req.user._id sea un ObjectId válido
    const userId = mongoose.Types.ObjectId.isValid(req.user._id) 
      ? new mongoose.Types.ObjectId(req.user._id) 
      : req.user._id;
    
    const user = await User.findById(userId).select('emergencyContacts name');
    
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Verificar límite de contactos
    if (user.emergencyContacts && user.emergencyContacts.length >= 2) {
      return res.status(400).json({ 
        message: 'Ya has alcanzado el límite de 2 contactos de emergencia'
      });
    }

    // Verificar que no exista un contacto con el mismo email
    if (user.emergencyContacts && user.emergencyContacts.some(c => c.email === value.email.toLowerCase())) {
      return res.status(400).json({ 
        message: 'Ya existe un contacto de emergencia con ese email'
      });
    }

    // Validación básica de email (verificar formato)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value.email.toLowerCase())) {
      return res.status(400).json({ 
        message: 'El formato del email no es válido'
      });
    }

    // Agregar el nuevo contacto usando findByIdAndUpdate para evitar problemas de versión
    const newContact = {
      name: value.name,
      email: value.email.toLowerCase(),
      phone: value.phone || null,
      relationship: value.relationship || null,
      enabled: true
    };
    
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $push: { emergencyContacts: newContact } },
      { new: true, select: 'emergencyContacts name username' }
    );
    
    if (!updatedUser) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Enviar email de prueba si se solicita
    let testEmailSent = false;
    let testEmailError = null;
    if (sendTestEmail === true) {
      try {
        const mailer = (await import('../config/mailer.js')).default;
        testEmailSent = await mailer.sendEmergencyContactTestEmail(
          newContact.email,
          newContact.name,
          updatedUser.name || updatedUser.username || 'Usuario'
        );
        if (!testEmailSent) {
          testEmailError = 'No se pudo enviar el email de prueba. Verifica la configuración del servidor de email.';
        }
      } catch (emailError) {
        logger.error('Error enviando email de prueba', { error: emailError.message, userId: req.user._id });
        testEmailError = emailError.message || 'Error al enviar email de prueba';
        // No fallar la creación del contacto si falla el email de prueba
      }
    }

    const response = {
      message: 'Contacto de emergencia agregado exitosamente',
      contact: updatedUser.emergencyContacts[updatedUser.emergencyContacts.length - 1]
    };

    // Incluir información del email de prueba solo si se solicitó
    if (sendTestEmail === true) {
      response.testEmailSent = testEmailSent;
      if (testEmailError) {
        response.testEmailError = testEmailError;
      }
    }

    res.status(201).json(response);
  } catch (error) {
    logger.error('Error al agregar contacto de emergencia', { error: error.message, userId: req.user._id });
    res.status(500).json({ 
      message: 'Error al agregar contacto de emergencia',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Actualizar un contacto de emergencia
router.put('/me/emergency-contacts/:contactId', authenticateToken, validateUserObjectId, async (req, res) => {
  try {
    const { contactId } = req.params;
    const { error, value } = emergencyContactSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({ 
        message: 'Datos inválidos',
        errors: error.details.map(d => d.message)
      });
    }

    if (!isValidObjectId(contactId)) {
      return res.status(400).json({ message: 'ID de contacto inválido' });
    }

    // Asegurar que req.user._id sea un ObjectId válido
    const userId = mongoose.Types.ObjectId.isValid(req.user._id) 
      ? new mongoose.Types.ObjectId(req.user._id) 
      : req.user._id;
    
    const user = await User.findById(userId).select('emergencyContacts');
    
    if (!user || !user.emergencyContacts) {
      return res.status(404).json({ message: 'Usuario o contacto no encontrado' });
    }

    const contactIndex = user.emergencyContacts.findIndex(
      c => c._id.toString() === contactId
    );

    if (contactIndex === -1) {
      return res.status(404).json({ message: 'Contacto de emergencia no encontrado' });
    }

    // Verificar que el nuevo email no esté en uso por otro contacto
    const emailInUse = user.emergencyContacts.some(
      (c, index) => index !== contactIndex && c.email === value.email.toLowerCase()
    );

    if (emailInUse) {
      return res.status(400).json({ 
        message: 'Ya existe otro contacto de emergencia con ese email'
      });
    }

    // Actualizar el contacto
    user.emergencyContacts[contactIndex] = {
      ...user.emergencyContacts[contactIndex].toObject(),
      name: value.name,
      email: value.email.toLowerCase(),
      phone: value.phone || null,
      relationship: value.relationship || null
    };

    await user.save();

    res.json({
      message: 'Contacto de emergencia actualizado exitosamente',
      contact: user.emergencyContacts[contactIndex]
    });
  } catch (error) {
    logger.error('Error al actualizar contacto de emergencia', { error: error.message, userId: req.user._id });
    res.status(500).json({ 
      message: 'Error al actualizar contacto de emergencia',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Eliminar un contacto de emergencia
router.delete('/me/emergency-contacts/:contactId', authenticateToken, validateUserObjectId, deleteContactLimiter, async (req, res) => {
  try {
    const { contactId } = req.params;

    if (!isValidObjectId(contactId)) {
      return res.status(400).json({ message: 'ID de contacto inválido' });
    }

    // Asegurar que req.user._id sea un ObjectId válido
    const userId = mongoose.Types.ObjectId.isValid(req.user._id) 
      ? new mongoose.Types.ObjectId(req.user._id) 
      : req.user._id;
    
    const user = await User.findById(userId).select('emergencyContacts');
    
    if (!user || !user.emergencyContacts) {
      return res.status(404).json({ message: 'Usuario o contacto no encontrado' });
    }

    const contactIndex = user.emergencyContacts.findIndex(
      c => c._id.toString() === contactId
    );

    if (contactIndex === -1) {
      return res.status(404).json({ message: 'Contacto de emergencia no encontrado' });
    }

    user.emergencyContacts.splice(contactIndex, 1);
    await user.save();

    res.json({
      message: 'Contacto de emergencia eliminado exitosamente'
    });
  } catch (error) {
    logger.error('Error al eliminar contacto de emergencia', { error: error.message, userId: req.user._id });
    res.status(500).json({ 
      message: 'Error al eliminar contacto de emergencia',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Habilitar/deshabilitar un contacto de emergencia
router.patch('/me/emergency-contacts/:contactId/toggle', authenticateToken, validateUserObjectId, patchContactLimiter, async (req, res) => {
  try {
    const { contactId } = req.params;

    if (!isValidObjectId(contactId)) {
      return res.status(400).json({ message: 'ID de contacto inválido' });
    }

    // Asegurar que req.user._id sea un ObjectId válido
    const userId = mongoose.Types.ObjectId.isValid(req.user._id) 
      ? new mongoose.Types.ObjectId(req.user._id) 
      : req.user._id;
    
    const user = await User.findById(userId).select('emergencyContacts');
    
    if (!user || !user.emergencyContacts) {
      return res.status(404).json({ message: 'Usuario o contacto no encontrado' });
    }

    const contact = user.emergencyContacts.find(
      c => c._id.toString() === contactId
    );

    if (!contact) {
      return res.status(404).json({ message: 'Contacto de emergencia no encontrado' });
    }

    contact.enabled = !contact.enabled;
    await user.save();

    res.json({
      message: `Contacto ${contact.enabled ? 'habilitado' : 'deshabilitado'} exitosamente`,
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
      message: 'Error al cambiar estado del contacto',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Enviar email de prueba a un contacto de emergencia
router.post('/me/emergency-contacts/:contactId/test', authenticateToken, validateUserObjectId, async (req, res) => {
  try {
    const { contactId } = req.params;

    if (!isValidObjectId(contactId)) {
      return res.status(400).json({ message: 'ID de contacto inválido' });
    }

    // Asegurar que req.user._id sea un ObjectId válido
    const userId = mongoose.Types.ObjectId.isValid(req.user._id) 
      ? new mongoose.Types.ObjectId(req.user._id) 
      : req.user._id;
    
    const user = await User.findById(userId).select('emergencyContacts name username');
    
    if (!user || !user.emergencyContacts) {
      return res.status(404).json({ message: 'Usuario o contacto no encontrado' });
    }

    const contact = user.emergencyContacts.find(
      c => c._id.toString() === contactId
    );

    if (!contact) {
      return res.status(404).json({ message: 'Contacto de emergencia no encontrado' });
    }

    const mailer = (await import('../config/mailer.js')).default;
    let emailSent = false;
    let emailError = null;
    
    try {
      emailSent = await mailer.sendEmergencyContactTestEmail(
        contact.email,
        contact.name,
        user.name || user.username || 'Usuario'
      );
      if (!emailSent) {
        emailError = 'No se pudo enviar el email de prueba. Verifica la configuración del servidor de email.';
      }
    } catch (error) {
      logger.error('Error enviando email de prueba', { error: error.message, userId: req.user._id });
      emailError = error.message || 'Error al enviar email de prueba';
    }

    if (emailSent) {
      res.json({
        message: 'Email de prueba enviado exitosamente',
        contact: {
          _id: contact._id,
          name: contact.name,
          email: contact.email
        },
        testEmailSent: true
      });
    } else {
      // Retornar 200 en lugar de 500, ya que el contacto existe y el error es solo del email
      res.status(200).json({
        message: 'El contacto existe, pero no se pudo enviar el email de prueba. Verifica la configuración del servidor de email.',
        contact: {
          _id: contact._id,
          name: contact.name,
          email: contact.email
        },
        testEmailSent: false,
        error: emailError || 'Error de conexión con el servidor de email'
      });
    }
  } catch (error) {
    logger.error('Error al enviar email de prueba', { error: error.message, userId: req.user._id });
    res.status(500).json({ 
      message: 'Error al enviar email de prueba',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
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
      '[PRUEBA] Este es un mensaje de prueba del sistema de alertas de emergencia. No hay ninguna situación real de riesgo.',
      { isTest: true } // Marcar como prueba
    );

    if (result.sent) {
      let message = `Alerta de prueba enviada a ${result.successfulSends}/${result.totalContacts} contacto(s)`;
      if (result.successfulEmails > 0) {
        message += ` (${result.successfulEmails} email(s))`;
      }
      if (result.successfulWhatsApp > 0) {
        message += ` (${result.successfulWhatsApp} WhatsApp(s))`;
      }

      res.json({
        message,
        result: {
          totalContacts: result.totalContacts,
          successfulSends: result.successfulSends,
          successfulEmails: result.successfulEmails,
          successfulWhatsApp: result.successfulWhatsApp,
          contacts: result.contacts
        }
      });
    } else {
      res.status(400).json({
        message: result.reason || 'No se pudo enviar la alerta de prueba',
        result
      });
    }
  } catch (error) {
    logger.error('Error al enviar alerta de prueba', { error: error.message, userId: req.user._id });
    res.status(500).json({ 
      message: 'Error al enviar alerta de prueba',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Enviar mensaje de prueba de WhatsApp a un contacto
router.post('/me/emergency-contacts/:contactId/test-whatsapp', authenticateToken, validateUserObjectId, async (req, res) => {
  try {
    const { contactId } = req.params;

    if (!isValidObjectId(contactId)) {
      return res.status(400).json({ message: 'ID de contacto inválido' });
    }

    // Asegurar que req.user._id sea un ObjectId válido
    const userId = mongoose.Types.ObjectId.isValid(req.user._id) 
      ? new mongoose.Types.ObjectId(req.user._id) 
      : req.user._id;
    
    const user = await User.findById(userId).select('emergencyContacts name username email preferences.language');
    
    if (!user || !user.emergencyContacts) {
      return res.status(404).json({ message: 'Usuario o contacto no encontrado' });
    }

    const contact = user.emergencyContacts.find(
      c => c._id.toString() === contactId
    );

    if (!contact) {
      return res.status(404).json({ message: 'Contacto de emergencia no encontrado' });
    }

    if (!contact.phone) {
      return res.status(400).json({ message: 'El contacto no tiene número de teléfono configurado' });
    }

    // Importar servicio de WhatsApp (Twilio)
    const whatsappService = (await import('../services/whatsappService.js')).default;
    
    if (!whatsappService.isConfigured()) {
      return res.status(400).json({
        message: 'WhatsApp no está configurado',
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
        message: 'Mensaje de prueba de WhatsApp enviado exitosamente',
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
          message: 'El mensaje está en cola. Si no llega, puede ser porque:',
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
        message: result?.error || 'No se pudo enviar el mensaje de WhatsApp',
        service: 'Twilio WhatsApp',
        contact: {
          _id: contact._id,
          name: contact.name,
          phone: contact.phone
        },
        error: result?.error || 'Error desconocido',
        details: result || 'No se recibió respuesta del servicio'
      });
    }
  } catch (error) {
    logger.error('Error al enviar mensaje de prueba de WhatsApp', { error: error.message, userId: req.user._id });
    res.status(500).json({ 
      message: 'Error al enviar mensaje de prueba de WhatsApp',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno del servidor',
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
        message: 'SID de mensaje inválido. Debe empezar con "SM"' 
      });
    }

    const whatsappService = (await import('../services/whatsappService.js')).default;
    
    if (!whatsappService.isConfigured()) {
      return res.status(400).json({
        message: 'WhatsApp no está configurado'
      });
    }

    const status = await whatsappService.getMessageStatus(messageSid);

    if (status.success) {
      res.json({
        message: 'Estado del mensaje obtenido exitosamente',
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
          statusMeanings: {
            queued: 'Mensaje en cola esperando ser enviado',
            sending: 'Mensaje siendo enviado',
            sent: 'Mensaje enviado exitosamente',
            delivered: 'Mensaje entregado al destinatario',
            read: 'Mensaje leído por el destinatario',
            failed: 'Mensaje falló al enviar',
            undelivered: 'Mensaje no entregado'
          },
          commonIssues: {
            queued: 'Si el mensaje permanece en "queued", verifica que el número esté verificado en Twilio Sandbox',
            failed: 'Si el mensaje falló, revisa errorCode y errorMessage para más detalles'
          }
        }
      });
    } else {
      res.status(400).json({
        message: 'No se pudo obtener el estado del mensaje',
        error: status.error,
        code: status.code
      });
    }
  } catch (error) {
    logger.error('Error al obtener estado del mensaje de WhatsApp', { error: error.message, userId: req.user._id });
    res.status(500).json({ 
      message: 'Error al obtener estado del mensaje',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno del servidor'
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
      message: 'Error al obtener historial de alertas',
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
      message: 'Error al obtener estadísticas de alertas',
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
      message: 'Error al detectar patrones de alertas',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;