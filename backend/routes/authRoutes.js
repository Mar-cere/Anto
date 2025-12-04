/**
 * Rutas de Autenticación - Gestiona registro, login, refresh token y recuperación de contraseña
 */
import crypto from 'crypto';
import express from 'express';
import rateLimit from 'express-rate-limit';
import Joi from 'joi';
import jwt from 'jsonwebtoken';
import mailer from '../config/mailer.js';
import { authenticateToken } from '../middleware/auth.js';
import User from '../models/User.js';

const router = express.Router();

// Rate limiters: control de frecuencia de peticiones
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5,
  message: 'Demasiados intentos de inicio de sesión. Por favor, intente más tarde.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3,
  message: 'Demasiados intentos de registro. Por favor, intente más tarde.',
  standardHeaders: true,
  legacyHeaders: false
});

const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3,
  message: 'Demasiados intentos de recuperación de contraseña. Por favor, intente más tarde.',
  standardHeaders: true,
  legacyHeaders: false
});

// Esquemas de validación Joi (normalizan email y username a lowercase)
const registerSchema = Joi.object({
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .required()
    .trim()
    .lowercase()
    .messages({
      'string.email': 'Por favor ingresa un email válido',
      'any.required': 'El email es requerido'
    }),
  password: Joi.string()
    .min(8)
    .required()
    .messages({
      'string.min': 'La contraseña debe tener al menos 8 caracteres',
      'any.required': 'La contraseña es requerida'
    }),
  username: Joi.string()
    .min(3)
    .max(20)
    .pattern(/^[a-z0-9_]+$/)
    .required()
    .trim()
    .lowercase()
    .messages({
      'string.min': 'El nombre de usuario debe tener al menos 3 caracteres',
      'string.max': 'El nombre de usuario debe tener máximo 20 caracteres',
      'string.pattern.base': 'El nombre de usuario solo puede contener letras minúsculas, números y guiones bajos',
      'any.required': 'El nombre de usuario es requerido'
    }),
  name: Joi.string()
    .min(2)
    .max(50)
    .trim()
    .optional()
    .messages({
      'string.min': 'El nombre debe tener al menos 2 caracteres',
      'string.max': 'El nombre debe tener máximo 50 caracteres'
    })
});

const loginSchema = Joi.object({
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .required()
    .trim()
    .lowercase()
    .messages({
      'string.email': 'Por favor ingresa un email válido',
      'any.required': 'El email es requerido'
    }),
  password: Joi.string()
    .required()
    .messages({
      'any.required': 'La contraseña es requerida'
    })
});

const passwordResetSchema = Joi.object({
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .required()
    .trim()
    .lowercase()
    .messages({
      'string.email': 'Por favor ingresa un email válido',
      'any.required': 'El email es requerido'
    })
});

const verifyCodeSchema = Joi.object({
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .required()
    .trim()
    .lowercase(),
  code: Joi.string()
    .length(6)
    .pattern(/^[0-9]+$/)
    .required()
    .messages({
      'string.length': 'El código debe tener 6 dígitos',
      'string.pattern.base': 'El código debe contener solo números',
      'any.required': 'El código es requerido'
    })
});

const resetPasswordSchema = Joi.object({
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .required()
    .trim()
    .lowercase(),
  code: Joi.string()
    .length(6)
    .pattern(/^[0-9]+$/)
    .required()
    .messages({
      'string.length': 'El código debe tener 6 dígitos',
      'string.pattern.base': 'El código debe contener solo números',
      'any.required': 'El código es requerido'
    }),
  newPassword: Joi.string()
    .min(8)
    .required()
    .messages({
      'string.min': 'La nueva contraseña debe tener al menos 8 caracteres',
      'any.required': 'La nueva contraseña es requerida'
    })
});

// Funciones helper
const generateTokens = async (userId, role = 'user') => {
  const accessToken = jwt.sign(
    { userId, role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
  const refreshToken = jwt.sign(
    { userId, role, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
  return { accessToken, refreshToken };
};

const hashPassword = (password) => {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return { salt, hash };
};

const validateResetCode = (user, code) => {
  return user.resetPasswordCode &&
         user.resetPasswordExpires &&
         user.resetPasswordCode === code &&
         user.resetPasswordExpires > Date.now();
};

// Health check
router.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: '1.3.0'
  });
});

// Registro de usuario
router.post('/register', registerLimiter, async (req, res) => {
  try {
    // Validar datos de entrada (Joi normaliza email y username a lowercase)
    const { error, value } = registerSchema.validate(req.body, { stripUnknown: true });
    if (error) {
      return res.status(400).json({ 
        message: 'Datos inválidos',
        errors: error.details.map(detail => detail.message)
      });
    }

    const { email, password, username, name } = value;

    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    }).maxTimeMS(5000);

    if (existingUser) {
      return res.status(400).json({ 
        message: 'El email o nombre de usuario ya está en uso' 
      });
    }

    // Generar hash de contraseña
    const { salt, hash } = hashPassword(password);

    // Crear nuevo usuario
    const userData = {
      email,
      username,
      password: hash,
      salt,
      preferences: {
        theme: 'light',
        notifications: true,
        language: 'es'
      },
      stats: {
        tasksCompleted: 0,
        habitsStreak: 0,
        totalSessions: 0,
        lastActive: new Date()
      },
      subscription: {
        status: 'trial',
        trialStartDate: new Date(),
        trialEndDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 días de trial
      },
      ...(name && name.trim() ? { name: name.trim() } : {})
    };

    const user = new User(userData);
    await user.save();

    // Enviar correo de bienvenida (no bloquea si falla)
    console.log(`📧 Iniciando envío de correo de bienvenida a: ${email}`);
    mailer.sendWelcomeEmail(email, username)
      .then(success => {
        if (success) {
          console.log(`✅ Correo de bienvenida enviado exitosamente a: ${email}`);
        } else {
          console.warn(`⚠️ No se pudo enviar correo de bienvenida a: ${email} (retornó false)`);
        }
      })
      .catch(err => {
        console.error('❌ Error capturado en promise de correo de bienvenida:', err.message);
        if (err.stack) {
          console.error('Stack trace:', err.stack);
        }
        if (err.message.includes('Variables de entorno')) {
          console.error('💡 Configura EMAIL_USER y EMAIL_APP_PASSWORD en tu archivo .env para habilitar el envío de correos');
        }
      });

    // Generar tokens con el rol del usuario
    const { accessToken, refreshToken } = await generateTokens(user._id, user.role || 'user');

    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      accessToken,
      token: accessToken, // Alias para compatibilidad con frontend
      refreshToken,
      user: user.toJSON()
    });

  } catch (error) {
    console.error('Error en registro:', error);

    // Manejar errores específicos
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Error de validación',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        message: 'El email o nombre de usuario ya está en uso'
      });
    }

    res.status(500).json({ 
      message: 'Error al registrar usuario',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Login
router.post('/login', loginLimiter, async (req, res) => {
  try {
    // Validar datos de entrada
    const { error, value } = loginSchema.validate(req.body, { stripUnknown: true });
    if (error) {
      return res.status(400).json({
        message: 'Datos inválidos',
        errors: error.details.map(detail => detail.message)
      });
    }

    const { email, password } = value;

    // Buscar usuario (Joi ya normaliza email a lowercase)
    const user = await User.findOne({ email });

    if (!user || !user.comparePassword(password)) {
      return res.status(401).json({ 
        message: 'Credenciales incorrectas' 
      });
    }

    // Verificar si el usuario está activo
    if (!user.isActive) {
      return res.status(403).json({
        message: 'Tu cuenta ha sido desactivada. Contacta al soporte.'
      });
    }

    // Generar tokens con el rol del usuario
    const { accessToken, refreshToken } = await generateTokens(user._id, user.role || 'user');

    // Actualizar último login y actividad
    user.lastLogin = new Date();
    user.stats.lastActive = new Date();
    user.stats.totalSessions += 1;
    await user.save();

    res.json({
      accessToken,
      refreshToken,
      user: user.toJSON()
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ 
      message: 'Error al iniciar sesión' 
    });
  }
});

// Refresh token: genera nuevo access token
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token es requerido' });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
    
    if (decoded.type !== 'refresh') {
      return res.status(401).json({ message: 'Token inválido' });
    }

    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Usuario no encontrado o inactivo' });
    }

    // Generar nuevo access token con el rol actualizado del usuario
    const { accessToken } = await generateTokens(user._id, user.role || 'user');

    res.json({
      accessToken,
      user: user.toJSON()
    });

  } catch (error) {
    console.error('Error en refresh token:', error);
    res.status(401).json({ message: 'Token inválido o expirado' });
  }
});

// Recuperar contraseña: envía código de verificación
router.post('/recover-password', passwordResetLimiter, async (req, res) => {
  try {
    const { error, value } = passwordResetSchema.validate(req.body, { stripUnknown: true });
    if (error) {
      return res.status(400).json({
        message: 'Datos inválidos',
        errors: error.details.map(detail => detail.message)
      });
    }

    const { email } = value;

    // Verificar si el usuario existe (Joi ya normaliza email a lowercase)
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ 
        message: 'No existe una cuenta con este correo electrónico' 
      });
    }

    // Verificar si ya hay un código activo
    if (user.resetPasswordCode && user.resetPasswordExpires > Date.now()) {
      return res.status(400).json({
        message: 'Ya existe un código de recuperación activo. Por favor, espere a que expire.'
      });
    }

    // Generar código de verificación (6 dígitos)
    const verificationCode = crypto.randomInt(100000, 999999).toString();
    const expiresIn = 600000; // 10 minutos
    
    // Guardar el código en el usuario
    user.resetPasswordCode = verificationCode;
    user.resetPasswordExpires = Date.now() + expiresIn;
    await user.save();

    // Enviar correo con el código
    await mailer.sendVerificationCode(email, verificationCode);

    res.json({ 
      message: 'Se ha enviado un código de verificación a tu correo',
      expiresIn: 600 // 10 minutos en segundos
    });

  } catch (error) {
    console.error('Error en recuperación de contraseña:', error);
    res.status(500).json({ 
      message: 'Error al procesar la solicitud' 
    });
  }
});

// Verificar código de recuperación
router.post('/verify-code', passwordResetLimiter, async (req, res) => {
  try {
    const { error, value } = verifyCodeSchema.validate(req.body, { stripUnknown: true });
    if (error) {
      return res.status(400).json({
        message: 'Datos inválidos',
        errors: error.details.map(detail => detail.message)
      });
    }

    const { email, code } = value;

    // Buscar usuario (Joi ya normaliza email a lowercase)
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'No existe una cuenta con este correo electrónico' });
    }

    // Validar código
    if (!validateResetCode(user, code)) {
      return res.status(400).json({ message: 'Código inválido o expirado' });
    }

    res.json({ 
      message: 'Código verificado correctamente',
      expiresIn: Math.floor((user.resetPasswordExpires - Date.now()) / 1000)
    });
  } catch (error) {
    console.error('Error al verificar código:', error);
    res.status(500).json({ message: 'Error al verificar el código' });
  }
});

// Restablecer contraseña: cambia la contraseña con código verificado
router.post('/reset-password', passwordResetLimiter, async (req, res) => {
  try {
    const { error, value } = resetPasswordSchema.validate(req.body, { stripUnknown: true });
    if (error) {
      return res.status(400).json({
        message: 'Datos inválidos',
        errors: error.details.map(detail => detail.message)
      });
    }

    const { email, code, newPassword } = value;

    // Buscar usuario (Joi ya normaliza email a lowercase)
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'No existe una cuenta con este correo electrónico' });
    }

    // Verificar código y expiración
    if (!validateResetCode(user, code)) {
      return res.status(400).json({ message: 'Código inválido o expirado' });
    }

    // Hashear la nueva contraseña
    const { salt, hash } = hashPassword(newPassword);
    
    // Actualizar usuario
    user.password = hash;
    user.salt = salt;
    user.resetPasswordCode = undefined;
    user.resetPasswordExpires = undefined;
    user.lastPasswordChange = new Date();
    await user.save();

    res.json({ message: 'Contraseña restablecida correctamente' });
  } catch (error) {
    console.error('Error al restablecer contraseña:', error);
    res.status(500).json({ message: 'Error al restablecer la contraseña' });
  }
});

// Logout: cierra sesión (en implementación futura se invalidaría el refresh token)
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    res.json({ message: 'Sesión cerrada correctamente' });
  } catch (error) {
    console.error('Error en logout:', error);
    res.status(500).json({ message: 'Error al cerrar sesión' });
  }
});

export default router;
