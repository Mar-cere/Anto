/**
 * Modelo de Usuario - Gestiona la información de autenticación, preferencias y estadísticas del usuario
 */
import crypto from 'crypto';
import mongoose from 'mongoose';

/** Valores antiguos de preferences.responseStyle → estilos canónicos (brief, balanced, deep, empatico, estructurado). */
const LEGACY_RESPONSE_STYLE_MAP = {
  calido: 'empatico',
  profesional: 'estructurado',
  directo: 'brief',
};

const userSchema = new mongoose.Schema({
  // ID único generado automáticamente
  id: {
    type: String,
    required: true,
    default: () => crypto.randomBytes(16).toString('hex'),
    unique: true,
    index: true
  },
  // Información personal (opcional)
  name: {
    type: String,
    trim: true,
    minlength: [2, 'El nombre debe tener al menos 2 caracteres'],
    maxlength: [50, 'El nombre debe tener máximo 50 caracteres'],
    default: null
  },
  // Credenciales de acceso
  username: {
    type: String,
    required: [true, 'El nombre de usuario es requerido'],
    unique: true,
    trim: true,
    lowercase: true,
    minlength: [3, 'El nombre de usuario debe tener al menos 3 caracteres'],
    maxlength: [20, 'El nombre de usuario debe tener máximo 20 caracteres'],
    match: [/^[a-z0-9_]+$/, 'El nombre de usuario solo puede contener letras minúsculas, números y guiones bajos'],
    index: true
  },
  email: {
    type: String,
    required: [true, 'El correo electrónico es requerido'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Por favor ingresa un correo válido'],
    index: true
  },
  // Verificación de email
  emailVerified: {
    type: Boolean,
    default: false,
    index: true
  },
  emailVerificationCode: {
    type: String,
    default: null
  },
  emailVerificationCodeExpires: {
    type: Date,
    default: null
  },
  /** Se setea al enviar el recordatorio de verificación (usuarios sin confirmar email); evita reenvíos. */
  emailVerificationReminderSentAt: {
    type: Date,
    default: null
  },
  // Seguridad: contraseña hasheada y salt para encriptación
  password: {
    type: String,
    required: [true, 'La contraseña es requerida'],
    minlength: [8, 'La contraseña debe tener al menos 8 caracteres']
  },
  salt: {
    type: String,
    required: true  
  },
  // Seguimiento de actividad
  lastLogin: {
    type: Date,
    default: Date.now
  },
  lastPasswordChange: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Rol del usuario (user, admin, moderator, emergency)
  role: {
    type: String,
    enum: ['user', 'admin', 'moderator', 'emergency'],
    default: 'user',
    index: true
  },
  // Preferencias de usuario
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'light'
    },
    notifications: {
      type: Boolean,
      default: true
    },
    language: {
      type: String,
      enum: ['es', 'en'],
      default: 'es'
    },
    privacy: {
      profileVisibility: {
        type: String,
        enum: ['public', 'private', 'friends'],
        default: 'private'
      }
    },
    // NUEVO: Estilo de respuesta preferido
    responseStyle: {
      type: String,
      enum: ['brief', 'balanced', 'deep', 'empatico', 'estructurado'],
      default: 'balanced',
      description: 'Estilo de respuesta: brief, balanced, deep, empatico, estructurado (legados calido/profesional/directo se migran al guardar)'
    }
    ,
    timezone: {
      type: String,
      default: null,
      trim: true,
      maxlength: [64, 'La zona horaria no puede exceder 64 caracteres']
    },
    /** País explícito (ISO alpha-2, prefijo telefónico o legacy ESPANA, MEXICO, …) */
    country: {
      type: String,
      default: null,
      trim: true,
      maxlength: [16, 'El país no puede exceder 16 caracteres']
    },
    /** ISO alpha-2 inferido del locale del dispositivo (sin GPS) */
    regionCountry: {
      type: String,
      default: null,
      trim: true,
      uppercase: true,
      maxlength: [2, 'regionCountry debe ser ISO alpha-2']
    }
  },
  /** Consentimiento granular señales #215 / #216 / #208. */
  signalConsent: {
    typingTelemetry: {
      enabled: { type: Boolean, default: false },
      enabledAt: { type: Date, default: null },
    },
    digitalHealth: {
      enabled: { type: Boolean, default: false },
      enabledAt: { type: Date, default: null },
      steps: { type: Boolean, default: false },
      sleep: { type: Boolean, default: false },
      screenTime: { type: Boolean, default: false },
    },
    weeklyInsights: {
      enabled: { type: Boolean, default: true },
      enabledAt: { type: Date, default: null },
    },
  },
  lastDigitalPhenotypeSyncAt: {
    type: Date,
    default: null,
  },
  // Estadísticas del usuario
  stats: {
    tasksCompleted: {
      type: Number,
      default: 0,
      min: [0, 'Las tareas completadas no pueden ser negativas']
    },
    habitsStreak: {
      type: Number,
      default: 0,
      min: [0, 'La racha de hábitos no puede ser negativa']
    },
    engagementStreak: {
      current: { type: Number, default: 0, min: 0 },
      best: { type: Number, default: 0, min: 0 },
      lastQualifiedDateKey: { type: String, default: null, trim: true },
      todayDateKey: { type: String, default: null, trim: true },
      todayPoints: { type: Number, default: 0, min: 0 },
      todaySignals: { type: [String], default: [] },
    },
    sessionWai: {
      pendingReminder: { type: Boolean, default: false },
      lastSkippedConversationId: { type: String, default: null, trim: true },
      lastSkippedAt: { type: Date, default: null },
      lastSubmittedAt: { type: Date, default: null },
    },
    totalSessions: {
      type: Number,
      default: 0,
      min: [0, 'El total de sesiones no puede ser negativo']
    },
    lastActive: {
      type: Date,
      default: Date.now
    },
    /** Clave ISO semanal UTC (p. ej. `2026-W15`) del último aviso de resumen semanal por correo; evita duplicados. */
    lastWeeklyTipsEmailYearWeek: {
      type: String,
      default: null,
      trim: true
    },
    lastWeeklyTipsEmailAt: {
      type: Date,
      default: null
    },
    /** Clave de campaña promocional (p. ej. `1.5.0`) para no reenviar la misma campaña de novedades. */
    lastProductUpdateCampaignKey: {
      type: String,
      default: null,
      trim: true
    },
    lastProductUpdateCampaignAt: {
      type: Date,
      default: null
    }
  },
  // Recuperación de contraseña (no se incluye en consultas por defecto)
  resetPasswordCode: {
    type: String,
    select: false
  },
  resetPasswordExpires: {
    type: Date,
    select: false
  },
  // Configuración de notificaciones
  notificationPreferences: {
    enabled: {
      type: Boolean,
      default: true
    },
    morning: {
      enabled: { type: Boolean, default: true },
      hour: { 
        type: Number, 
        default: 8,
        min: [0, 'La hora debe estar entre 0 y 23'],
        max: [23, 'La hora debe estar entre 0 y 23']
      },
      minute: { 
        type: Number, 
        default: 0,
        min: [0, 'El minuto debe estar entre 0 y 59'],
        max: [59, 'El minuto debe estar entre 0 y 59']
      }
    },
    evening: {
      enabled: { type: Boolean, default: true },
      hour: { 
        type: Number, 
        default: 19,
        min: [0, 'La hora debe estar entre 0 y 23'],
        max: [23, 'La hora debe estar entre 0 y 23']
      },
      minute: { 
        type: Number, 
        default: 0,
        min: [0, 'El minuto debe estar entre 0 y 59'],
        max: [59, 'El minuto debe estar entre 0 y 59']
      }
    },
    types: {
      dailyReminders: { type: Boolean, default: true },
      habitReminders: { type: Boolean, default: true },
      taskReminders: { type: Boolean, default: true },
      motivationalMessages: { type: Boolean, default: true },
      betweenSessionsMessages: { type: Boolean, default: true },
      commitmentWeeklyReminders: { type: Boolean, default: false }
    }
  },
  // Información de suscripción
  subscription: {
    status: {
      type: String,
      enum: ['free', 'trial', 'premium', 'expired'],
      default: 'free'
    },
    trialStartDate: Date,
    trialEndDate: Date,
    subscriptionStartDate: Date,
    subscriptionEndDate: Date,
    plan: {
      type: String,
      enum: ['monthly', 'quarterly', 'semestral', 'yearly'],
      default: null
    },
    /** Marca de auditoría: se asigna al otorgar trial en registro (una vez por cuenta). */
    trialGrantedAt: {
      type: Date,
      default: null
    },
    /** Se setea al enviar el correo “retención trial” (día ~2 de prueba corta); evita reenvíos. */
    trialRetentionEmailSentAt: {
      type: Date,
      default: null
    }
  },
  // Contactos de emergencia (máximo 2)
  emergencyContacts: {
    type: [{
      name: {
        type: String,
        required: true,
        trim: true,
        maxlength: [100, 'El nombre del contacto no puede exceder 100 caracteres']
      },
      email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, 'Por favor ingresa un correo válido']
      },
      phone: {
        type: String,
        trim: true,
        default: null
      },
      relationship: {
        type: String,
        trim: true,
        default: null,
        maxlength: [50, 'La relación no puede exceder 50 caracteres']
      },
      enabled: {
        type: Boolean,
        default: true
      },
      createdAt: {
        type: Date,
        default: Date.now
      },
      lastReminderSent: {
        type: Date,
        default: null
      }
    }],
    default: [],
    validate: {
      validator: function(v) {
        return v.length <= 2;
      },
      message: 'Solo se permiten máximo 2 contactos de emergencia'
    }
  },
  // Token push para notificaciones
  pushToken: {
    type: String,
    default: null,
    select: false, // No incluir por defecto en consultas por seguridad
    index: true
  },
  pushTokenUpdatedAt: {
    type: Date,
    default: null,
    select: false
  },
  // Aceptación de términos y condiciones
  termsAccepted: {
    type: Boolean,
    default: false,
    required: true
  },
  termsAcceptedAt: {
    type: Date,
    default: null
  },
  termsVersion: {
    type: String,
    default: '1.0',
    description: 'Versión de términos aceptada (para tracking si cambian)'
  },
  // Aceptación de política de privacidad (GDPR requiere consentimiento separado)
  privacyAccepted: {
    type: Boolean,
    default: false,
    required: true
  },
  privacyAcceptedAt: {
    type: Date,
    default: null
  },
  /**
   * Continuidad del último chat (#4 + #47): un solo documento lógico por usuario;
   * al generarse uno nuevo sustituye al anterior (no es el resumen semanal/mensual).
   */
  lastSessionSummary: {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      default: null
    },
    bullets: {
      type: [String],
      default: [],
      validate: {
        validator: (v) => Array.isArray(v) && v.length <= 5,
        message: 'Máximo 5 bullets'
      }
    },
    bridge: {
      type: String,
      default: '',
      maxlength: 600
    },
    snippet: {
      type: String,
      default: '',
      maxlength: 280
    },
    riskTier: {
      type: String,
      enum: ['low', 'warning', 'medium', 'high', 'unknown'],
      default: 'unknown'
    },
    placeholder: {
      type: Boolean,
      default: false
    },
    userTurnCount: {
      type: Number,
      default: 0,
      min: 0
    },
    generatedAt: {
      type: Date,
      default: null
    },
    /** Último mensaje de la conversación al generar la continuidad (referencia temporal). */
    sessionEndedAt: {
      type: Date,
      default: null
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índices adicionales para optimizar consultas (email y username ya tienen índice en el schema)
userSchema.index({ 'stats.lastActive': -1 });
userSchema.index({ createdAt: -1 });
userSchema.index({
  emailVerified: 1,
  emailVerificationReminderSentAt: 1,
  createdAt: 1,
});
// Índices compuestos para consultas frecuentes
userSchema.index({ 'subscription.status': 1, 'subscription.trialEndDate': 1 });
userSchema.index({
  'subscription.status': 1,
  'subscription.trialRetentionEmailSentAt': 1,
  'subscription.trialStartDate': 1,
});
userSchema.index({
  emailVerified: 1,
  isActive: 1,
  'stats.totalSessions': 1,
  'stats.lastWeeklyTipsEmailYearWeek': 1,
  _id: 1
});
userSchema.index({ 'subscription.status': 1, 'subscription.subscriptionEndDate': 1 });
userSchema.index({ email: 1, isActive: 1 });

// Virtuals: propiedades calculadas al acceder
userSchema.virtual('daysSinceRegistration').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

userSchema.virtual('isInTrial').get(function() {
  if (!this.subscription.trialStartDate || !this.subscription.trialEndDate) {
    return false;
  }
  const now = new Date();
  return now >= this.subscription.trialStartDate && now <= this.subscription.trialEndDate;
});

userSchema.virtual('hasActiveSubscription').get(function() {
  if (this.subscription.status === 'premium' && this.subscription.subscriptionEndDate) {
    return new Date() <= this.subscription.subscriptionEndDate;
  }
  return false;
});

// Métodos de instancia: operaciones sobre un usuario específico
userSchema.methods.comparePassword = function(candidatePassword) {
  const hash = crypto.pbkdf2Sync(candidatePassword, this.salt, 1000, 64, 'sha512').toString('hex');
  return this.password === hash;
};

userSchema.methods.updateLastActive = function() {
  this.stats.lastActive = new Date();
  this.stats.totalSessions += 1;
  return this.save();
};

userSchema.methods.incrementTasksCompleted = function() {
  this.stats.tasksCompleted += 1;
  return this.save();
};

userSchema.methods.updateHabitsStreak = function(streak) {
  this.stats.habitsStreak = Math.max(this.stats.habitsStreak, streak);
  return this.save();
};

// Migración de estilos legados ANTES del enum (validate corre antes que save; ver Mongoose middleware order)
userSchema.pre('validate', function(next) {
  const rs = this.preferences?.responseStyle;
  if (rs && LEGACY_RESPONSE_STYLE_MAP[rs]) {
    this.preferences.responseStyle = LEGACY_RESPONSE_STYLE_MAP[rs];
    this.markModified('preferences');
  }
  next();
});

// Middleware pre-save: ejecuta antes de guardar
userSchema.pre('save', function(next) {
  if (!this.id) {
    this.id = crypto.randomBytes(16).toString('hex');
  }

  if (this.isModified('password')) {
    this.lastPasswordChange = new Date();
  }

  next();
});

// Método toJSON: sanitiza datos sensibles antes de serializar
userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  obj.id = obj._id;
  delete obj.password;
  delete obj.salt;
  delete obj.__v;
  delete obj.resetPasswordCode;
  delete obj.resetPasswordExpires;
  return obj;
};

// Métodos estáticos: operaciones sobre la colección
userSchema.statics.findActiveUsers = function() {
  return this.find({ isActive: true });
};

userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

const User = mongoose.model('User', userSchema);

export default User;