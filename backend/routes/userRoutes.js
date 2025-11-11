/**
 * Rutas de Usuario - Gestiona perfil, contraseña, avatar, suscripción y eliminación de cuenta
 */
import cloudinary from 'cloudinary';
import crypto from 'crypto';
import express from 'express';
import rateLimit from 'express-rate-limit';
import Joi from 'joi';
import { authenticateToken } from '../middleware/auth.js';
import { validateUserObjectId } from '../middleware/validation.js';
import User from '../models/User.js';

const router = express.Router();

// Constantes de configuración
const AVATAR_URL_EXPIRY = 300; // 5 minutos en segundos
const AVATAR_SIZE = 200;
const MILLISECONDS_PER_DAY = 1000 * 60 * 60 * 24;

// Rate limiters: control de frecuencia de peticiones
const updateProfileLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10,
  message: 'Demasiadas actualizaciones de perfil. Por favor, intente más tarde.',
  standardHeaders: true,
  legacyHeaders: false
});

const avatarLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 5,
  message: 'Demasiados cambios de avatar. Por favor, intente más tarde.',
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
  let query = User.findById(userId);
  if (select) {
    query = query.select(select);
  }
  if (lean) {
    query = query.lean();
  }
  return await query;
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
  avatar: Joi.string()
    .uri()
    .optional()
    .messages({
      'string.uri': 'El avatar debe ser una URL válida'
    })
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
    const user = await User.findById(req.user._id)
      .select('-password -salt -__v -resetPasswordCode -resetPasswordExpires')
      .lean();
    
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

    res.json({
      ...user,
      timeSinceLastLogin,
      daysSinceRegistration
    });
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({ 
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
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ 
      message: 'Error al obtener estadísticas',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Actualizar perfil del usuario
router.put('/me', authenticateToken, validateUserObjectId, updateProfileLimiter, async (req, res) => {
  try {
    // Validar datos de entrada
    const { error, value } = updateProfileSchema.validate(req.body, { stripUnknown: true });
    if (error) {
      return res.status(400).json({ 
        message: 'Datos inválidos',
        errors: error.details.map(detail => detail.message)
      });
    }

    const user = await findUserById(req.user._id);
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
        user.preferences = {
          ...user.preferences,
          ...value.preferences
        };
      } else if (key === 'notificationPreferences') {
        user.notificationPreferences = {
          ...user.notificationPreferences,
          ...value.notificationPreferences
        };
      } else {
        user[key] = value[key];
      }
    });

    // Guardar (Mongoose timestamps maneja updatedAt automáticamente)
    await user.save();

    res.json({
      message: 'Perfil actualizado correctamente',
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(400).json({ 
      message: 'Error al actualizar el perfil',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Cambiar contraseña del usuario
router.put('/me/password', authenticateToken, validateUserObjectId, updateProfileLimiter, async (req, res) => {
  try {
    const { error, value } = updatePasswordSchema.validate(req.body, { stripUnknown: true });
    if (error) {
      return res.status(400).json({
        message: 'Datos inválidos',
        errors: error.details.map(detail => detail.message)
      });
    }

    const { currentPassword, newPassword } = value;

    const user = await findUserById(req.user._id);
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
    console.error('Error al cambiar contraseña:', error);
    res.status(500).json({ 
      message: 'Error al cambiar la contraseña',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Obtener URL firmada para avatar (Cloudinary)
router.get('/avatar-url/:publicId', authenticateToken, avatarLimiter, async (req, res) => {
  try {
    const { publicId } = req.params;

    // Validar que el publicId pertenece al usuario
    const user = await User.findOne({ 
      _id: req.user._id,
      avatar: { $regex: publicId }
    });

    if (!user) {
      return res.status(403).json({ 
        message: 'No tienes permiso para acceder a este avatar' 
      });
    }

    // Generar URL firmada con expiración
    const url = cloudinary.url(publicId, {
      type: 'authenticated',
      sign_url: true,
      expires_at: Math.floor(Date.now() / 1000) + AVATAR_URL_EXPIRY,
      transformation: [
        { width: AVATAR_SIZE, height: AVATAR_SIZE, crop: 'fill' },
        { quality: 'auto' },
        { fetch_format: 'auto' }
      ]
    });

    res.json({ 
      url,
      expiresIn: AVATAR_URL_EXPIRY
    });
  } catch (error) {
    console.error('Error generando URL de avatar:', error);
    res.status(500).json({ 
      message: 'Error al generar URL del avatar',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Eliminar cuenta (soft delete)
router.delete('/me', authenticateToken, validateUserObjectId, async (req, res) => {
  try {
    const user = await findUserById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Soft delete: desactivar cuenta y modificar email/username para evitar conflictos
    user.isActive = false;
    user.email = `${user.email}_deleted_${Date.now()}`;
    user.username = `${user.username}_deleted_${Date.now()}`;
    user.deletedAt = new Date();
    await user.save();

    res.json({ 
      message: 'Cuenta eliminada correctamente',
      deletedAt: user.deletedAt
    });
  } catch (error) {
    console.error('Error al eliminar cuenta:', error);
    res.status(500).json({ 
      message: 'Error al eliminar la cuenta',
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
    console.error('Error al obtener información de suscripción:', error);
    res.status(500).json({ 
      message: 'Error al obtener información de suscripción',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;