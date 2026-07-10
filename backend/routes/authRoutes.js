/**
 * Rutas de Autenticación - Gestiona registro, login, refresh token y recuperación de contraseña
 */
import crypto from 'crypto';
import express from 'express';
import { createRateLimiter } from '../utils/createRateLimiter.js';
import jwt from 'jsonwebtoken';
import mailer from '../config/mailer.js';
import { authenticateToken } from '../middleware/auth.js';
import { attachApiCopy } from '../middleware/apiLanguageMiddleware.js';
import User from '../models/User.js';
import { CURRENT_TERMS_VERSION } from '../constants/app.js';
import { addTrialDays, getAppTrialPublicConfig } from '../constants/subscription.js';
import { enqueueEmail } from '../services/emailQueueService.js';
import { resolveRequestLanguage } from '../utils/apiLanguage.js';
import { authApiCopy } from '../utils/authApiCopy.js';
import {
  getChangePasswordSchema,
  getLoginSchema,
  getPasswordResetSchema,
  getRegisterSchema,
  getResetPasswordSchema,
  getVerifyCodeSchema,
  getVerifyEmailSchema,
} from '../utils/authSchemas.js';
import { validationErrorBody, validateBody } from '../utils/apiValidation.js';
import { resolveAppLanguage } from '../utils/resolveAppLanguage.js';
import { resolveEmailLanguageFromRequest, resolveUserEmailLanguage } from '../utils/emailLanguage.js';
import { buildDuplicateRegisterBody } from '../utils/authErrorCodes.js';
import {
  isResetCodeExpired,
  isResetCodeValid,
} from '../utils/authResetCode.js';

const router = express.Router();

router.use(attachApiCopy(authApiCopy));

// Rate limiters: control de frecuencia de peticiones
const loginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5,
  message: (req) => authApiCopy(resolveRequestLanguage(req)).rateLimitLogin,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true
});

const registerLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3,
  message: (req) => authApiCopy(resolveRequestLanguage(req)).rateLimitRegister,
  standardHeaders: true,
  legacyHeaders: false
});

const passwordRecoverSendLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: (req) => authApiCopy(resolveRequestLanguage(req)).rateLimitPasswordReset,
  standardHeaders: true,
  legacyHeaders: false,
});

const passwordVerifyCodeLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: (req) => authApiCopy(resolveRequestLanguage(req)).rateLimitPasswordReset,
  standardHeaders: true,
  legacyHeaders: false,
});

const passwordResetSubmitLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 8,
  message: (req) => authApiCopy(resolveRequestLanguage(req)).rateLimitPasswordReset,
  standardHeaders: true,
  legacyHeaders: false,
});

const RESET_CODE_TTL_MS = 15 * 60 * 1000;

const changePasswordLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5,
  message: (req) => authApiCopy(resolveRequestLanguage(req)).rateLimitChangePassword,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

const refreshLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: (req) => authApiCopy(resolveRequestLanguage(req)).rateLimitLogin,
  standardHeaders: true,
  legacyHeaders: false,
});

// Funciones helper
const generateTokens = async (userId, role = 'user') => {
  // Asegurar que userId sea un string válido
  const userIdString = userId?.toString() || userId;
  
  const accessToken = jwt.sign(
    { userId: userIdString, _id: userIdString, role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
  const refreshToken = jwt.sign(
    { userId: userIdString, _id: userIdString, role, type: 'refresh' },
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

// Generar código de verificación de email (6 dígitos)
const generateEmailVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const respondInvalidResetCode = (res, copy, user) => {
  const message = isResetCodeExpired(user)
    ? copy.resetCodeExpired
    : copy.resetCodeInvalid;
  const code = isResetCodeExpired(user) ? 'RESET_CODE_EXPIRED' : 'RESET_CODE_INVALID';
  return res.status(400).json({ message, code });
};

// Health check
router.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: '1.5.3'
  });
});

// Registro de usuario
router.post('/register', registerLimiter, async (req, res) => {
  const copy = req.apiCopy;
  try {
    const { error, value } = validateBody(getRegisterSchema(copy), req.body);
    if (error) {
      return res.status(400).json(validationErrorBody(copy, error));
    }

    const {
      email,
      password,
      username,
      name,
      termsAccepted,
      termsAcceptedAt,
      privacyAccepted,
      privacyAcceptedAt,
      termsVersion,
      language: registerLanguage,
    } = value;

    const initialLanguage = resolveAppLanguage({
      headerLanguage: req.get('X-App-Language'),
      preferenceLanguage: registerLanguage,
    });

    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    })
      .select('_id')
      .lean()
      .maxTimeMS(5000);

    if (existingUser) {
      return res.status(400).json(buildDuplicateRegisterBody(copy));
    }

    // Generar hash de contraseña
    const { salt, hash } = hashPassword(password);

    // Generar código de verificación de email
    const verificationCode = generateEmailVerificationCode();
    const codeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos

    // Crear nuevo usuario (sin verificar email)
    const trialStartDate = new Date();
    const userData = {
      email,
      username,
      password: hash,
      salt,
      emailVerified: false,
      emailVerificationCode: verificationCode,
      emailVerificationCodeExpires: codeExpires,
      preferences: {
        theme: 'light',
        notifications: true,
        language: initialLanguage,
      },
      stats: {
        tasksCompleted: 0,
        habitsStreak: 0,
        totalSessions: 0,
        lastActive: new Date()
      },
      subscription: {
        status: 'trial',
        trialStartDate,
        trialEndDate: addTrialDays(trialStartDate),
        trialGrantedAt: trialStartDate,
      },
      termsAccepted: termsAccepted || false,
      termsAcceptedAt: termsAcceptedAt ? new Date(termsAcceptedAt) : new Date(),
      privacyAccepted: privacyAccepted || false,
      privacyAcceptedAt: privacyAcceptedAt ? new Date(privacyAcceptedAt) : new Date(),
      termsVersion: termsVersion || CURRENT_TERMS_VERSION,
      ...(name && name.trim() ? { name: name.trim() } : {})
    };

    const user = new User(userData);
    await user.save();

    // Enviar código de verificación por email
    try {
      await mailer.sendEmailVerificationCode(email, verificationCode, username, {
        language: initialLanguage,
      });
      console.log('✅ Código de verificación enviado');
    } catch (err) {
      console.error('❌ Error enviando código de verificación:', err.message);
      // No bloqueamos el registro si falla el envío del email
      // El usuario puede solicitar reenvío después
    }

    // NO generar tokens todavía - el usuario debe verificar su email primero
    // Retornar información de que necesita verificar email
    res.status(201).json({
      message: copy.registerSuccess,
      requiresVerification: true,
      email: email, // Enviar email para la pantalla de verificación
      ...getAppTrialPublicConfig(),
      user: {
        _id: user._id,
        email: user.email,
        username: user.username,
        emailVerified: false
      }
    });

  } catch (error) {
    console.error('Error en registro:', error);

    // Manejar errores específicos
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: copy.validationError,
        errors: Object.values(error.errors).map(err => err.message)
      });
    }

    if (error.code === 11000) {
      return res.status(400).json(buildDuplicateRegisterBody(copy));
    }

    res.status(500).json({ 
      message: copy.registerError,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Verificar email después del registro
router.post('/verify-email', registerLimiter, async (req, res) => {
  const copy = req.apiCopy;
  try {
    const { error, value } = validateBody(getVerifyEmailSchema(copy), req.body);
    if (error) {
      return res.status(400).json(validationErrorBody(copy, error));
    }

    const { email, code } = value;

    // Buscar usuario
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: copy.emailNotFound });
    }

    // Verificar si ya está verificado
    if (user.emailVerified) {
      return res.status(400).json({ message: copy.emailAlreadyVerified });
    }

    // Validar código
    if (!user.emailVerificationCode || 
        !user.emailVerificationCodeExpires ||
        user.emailVerificationCode !== code ||
        user.emailVerificationCodeExpires < Date.now()) {
      return res.status(400).json({ message: copy.invalidOrExpiredCode });
    }

    // Marcar email como verificado y limpiar código
    user.emailVerified = true;
    user.emailVerificationCode = undefined;
    user.emailVerificationCodeExpires = undefined;
    await user.save();

    // Enviar correo de bienvenida ahora que el email está verificado
    enqueueEmail(
      () =>
        mailer.sendWelcomeEmail(email, user.username, {
          language: resolveUserEmailLanguage(user),
        }),
      { type: 'welcome_email', to: email }
    );

    // Generar tokens ahora que el email está verificado
    const { accessToken, refreshToken } = await generateTokens(user._id, user.role || 'user');

    res.json({
      message: copy.verifyEmailSuccess,
      accessToken,
      token: accessToken,
      refreshToken,
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Error verificando email:', error);
    res.status(500).json({ message: copy.verifyEmailError });
  }
});

// Reenviar código de verificación de email
router.post('/resend-verification-code', registerLimiter, async (req, res) => {
  const copy = req.apiCopy;
  try {
    const { error, value } = validateBody(getPasswordResetSchema(copy), req.body);
    if (error) {
      return res.status(400).json(validationErrorBody(copy, error));
    }

    const { email } = value;

    // Buscar usuario
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: copy.emailNotFound });
    }

    // Verificar si ya está verificado
    if (user.emailVerified) {
      return res.status(400).json({ message: copy.emailAlreadyVerified });
    }

    // Generar nuevo código
    const verificationCode = generateEmailVerificationCode();
    const codeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos

    user.emailVerificationCode = verificationCode;
    user.emailVerificationCodeExpires = codeExpires;
    await user.save();

    // Enviar código por email
    try {
      await mailer.sendEmailVerificationCode(email, verificationCode, user.username, {
        language: resolveUserEmailLanguage(user, resolveEmailLanguageFromRequest(req, user)),
      });
      res.json({
        message: copy.resendCodeSuccess,
        expiresIn: 600 // 10 minutos en segundos
      });
    } catch (err) {
      console.error('Error enviando código de verificación:', err.message);
      res.status(500).json({ message: copy.resendCodeSendError });
    }
  } catch (error) {
    console.error('Error reenviando código:', error);
    res.status(500).json({ message: copy.requestProcessError });
  }
});

// Login
router.post('/login', loginLimiter, async (req, res) => {
  const copy = req.apiCopy;
  try {
    const { error, value } = validateBody(getLoginSchema(copy), req.body);
    if (error) {
      return res.status(400).json(validationErrorBody(copy, error));
    }

    const { email, password } = value;

    // Buscar usuario (Joi ya normaliza email a lowercase)
    const user = await User.findOne({ email });

    if (!user || !user.comparePassword(password)) {
      return res.status(401).json({ message: copy.invalidCredentials });
    }

    // Verificar si el usuario está activo
    if (!user.isActive) {
      return res.status(403).json({ message: copy.accountDeactivated });
    }

    // Verificar si el email está verificado
    if (!user.emailVerified) {
      return res.status(403).json({
        message: copy.verifyEmailBeforeLogin,
        requiresVerification: true,
        email: user.email
      });
    }

    // Generar tokens con el rol del usuario
    const { accessToken, refreshToken } = await generateTokens(user._id, user.role || 'user');

    // Actualizar último login y actividad
    user.lastLogin = new Date();
    user.stats.lastActive = new Date();
    user.stats.totalSessions += 1;
    await user.save();

    // Verificar si los términos han cambiado (informar, no bloquear)
    const needsTermsUpdate = user.termsVersion !== CURRENT_TERMS_VERSION;
    
    res.json({
      accessToken,
      refreshToken,
      user: user.toJSON(),
      ...(needsTermsUpdate && {
        termsUpdateRequired: true,
        currentTermsVersion: CURRENT_TERMS_VERSION,
        userTermsVersion: user.termsVersion
      })
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ message: copy.loginError });
  }
});

// Refresh token: genera nuevo access token
router.post('/refresh', refreshLimiter, async (req, res) => {
  const copy = req.apiCopy;
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ message: copy.refreshTokenRequired });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
    
    if (decoded.type !== 'refresh') {
      return res.status(401).json({ message: copy.invalidToken });
    }

    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({ message: copy.userNotFoundInactive });
    }

    // Generar nuevo access token con el rol actualizado del usuario
    const { accessToken } = await generateTokens(user._id, user.role || 'user');

    res.json({
      accessToken,
      user: user.toJSON()
    });

  } catch (error) {
    console.error('Error en refresh token:', error);
    res.status(401).json({ message: copy.tokenInvalidOrExpired });
  }
});

// Recuperar contraseña: envía código de verificación
router.post('/recover-password', passwordRecoverSendLimiter, async (req, res) => {
  const copy = req.apiCopy;
  try {
    const { error, value } = validateBody(getPasswordResetSchema(copy), req.body);
    if (error) {
      return res.status(400).json(validationErrorBody(copy, error));
    }

    const { email } = value;

    // Verificar si el usuario existe (Joi ya normaliza email a lowercase)
    const user = await User.findOne({ email }).select('preferences.language resetPasswordCode resetPasswordExpires');
    if (!user) {
      return res.status(404).json({ message: copy.emailNotFound });
    }

    const emailLanguage = resolveUserEmailLanguage(user, resolveEmailLanguageFromRequest(req, user));

    // Generar código de verificación (6 dígitos); reemplaza uno anterior si existía
    const verificationCode = crypto.randomInt(100000, 999999).toString();
    const expiresIn = RESET_CODE_TTL_MS;
    
    // Guardar el código en el usuario
    user.resetPasswordCode = verificationCode;
    user.resetPasswordExpires = Date.now() + expiresIn;
    await user.save();

    // Enviar correo con el código
    await mailer.sendVerificationCode(email, verificationCode, { language: emailLanguage });

    res.json({
      message: copy.verificationCodeSent,
      expiresIn: Math.floor(RESET_CODE_TTL_MS / 1000),
    });

  } catch (error) {
    console.error('Error en recuperación de contraseña:', error);
    res.status(500).json({ message: copy.requestProcessError });
  }
});

// Verificar código de recuperación
router.post('/verify-code', passwordVerifyCodeLimiter, async (req, res) => {
  const copy = req.apiCopy;
  try {
    const { error, value } = validateBody(getVerifyCodeSchema(copy), req.body);
    if (error) {
      return res.status(400).json(validationErrorBody(copy, error));
    }

    const { email, code } = value;

    // Buscar usuario (Joi ya normaliza email a lowercase)
    const user = await User.findOne({ email })
      .select('_id resetPasswordCode resetPasswordExpires')
      .lean();
    if (!user) {
      return res.status(404).json({ message: copy.emailNotFound });
    }

    if (!isResetCodeValid(user, code)) {
      return respondInvalidResetCode(res, copy, user);
    }

    const expiresMs =
      user.resetPasswordExpires instanceof Date
        ? user.resetPasswordExpires.getTime()
        : new Date(user.resetPasswordExpires).getTime();

    res.json({
      message: copy.codeVerifiedSuccess,
      expiresIn: Math.max(0, Math.floor((expiresMs - Date.now()) / 1000)),
    });
  } catch (error) {
    console.error('Error al verificar código:', error);
    res.status(500).json({ message: copy.codeVerifyError });
  }
});

// Restablecer contraseña: cambia la contraseña con código verificado
router.post('/reset-password', passwordResetSubmitLimiter, async (req, res) => {
  const copy = req.apiCopy;
  try {
    const { error, value } = validateBody(getResetPasswordSchema(copy), req.body);
    if (error) {
      return res.status(400).json(validationErrorBody(copy, error));
    }

    const { email, code, newPassword } = value;

    // Incluir campos de recuperación (select: false en el modelo)
    const user = await User.findOne({ email }).select(
      '+resetPasswordCode +resetPasswordExpires +password +salt',
    );
    if (!user) {
      return res.status(404).json({ message: copy.emailNotFound });
    }

    if (!isResetCodeValid(user, code)) {
      return respondInvalidResetCode(res, copy, user);
    }

    if (user.salt && user.password && user.comparePassword(newPassword)) {
      return res.status(400).json({
        message: copy.passwordSameAsCurrent,
        code: 'PASSWORD_SAME_AS_CURRENT',
      });
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

    res.json({ message: copy.passwordResetSuccess });
  } catch (error) {
    console.error('Error al restablecer contraseña:', error);
    res.status(500).json({ message: copy.passwordResetError });
  }
});

// Cambiar contraseña (usuario autenticado)
router.put('/change-password', changePasswordLimiter, authenticateToken, async (req, res) => {
  const copy = req.apiCopy;
  try {
    const { error, value } = validateBody(getChangePasswordSchema(copy), req.body);
    if (error) {
      return res.status(400).json({
        ...validationErrorBody(copy, error),
        errorCode: 'VALIDATION_ERROR',
      });
    }

    const { currentPassword, newPassword } = value;
    const userId = req.user._id || req.user.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: copy.userNotFound,
        errorCode: 'USER_NOT_FOUND',
      });
    }

    if (!user.comparePassword(currentPassword)) {
      return res.status(401).json({
        message: copy.wrongCurrentPassword,
        errorCode: 'WRONG_CURRENT_PASSWORD',
      });
    }

    if (user.comparePassword(newPassword)) {
      return res.status(400).json({
        message: copy.passwordSameAsCurrent,
        errorCode: 'PASSWORD_SAME_AS_CURRENT',
      });
    }

    const { salt, hash } = hashPassword(newPassword);
    user.password = hash;
    user.salt = salt;
    user.lastPasswordChange = new Date();
    await user.save();

    res.json({ message: copy.passwordUpdatedSuccess });
  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    res.status(500).json({
      message: copy.changePasswordError,
      errorCode: 'CHANGE_PASSWORD_FAILED',
    });
  }
});

// Logout: cierra sesión (en implementación futura se invalidaría el refresh token)
router.post('/logout', authenticateToken, async (req, res) => {
  const copy = req.apiCopy;
  try {
    res.json({ message: copy.logoutSuccess });
  } catch (error) {
    console.error('Error en logout:', error);
    res.status(500).json({ message: copy.logoutError });
  }
});

export default router;
